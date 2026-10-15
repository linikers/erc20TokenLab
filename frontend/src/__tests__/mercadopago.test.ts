import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  criarCobrancaPix,
  mercadopagoConfigurado,
  MercadoPagoErro,
  mpBaseUrl,
  normalizarMP,
  statusInternoMP,
} from "@/lib/mercadopago";

/**
 * Regras que não podem regredir: status desconhecido nunca vira "pago", o corpo
 * enviado tem o formato que a Orders API exige (Pix dentro de transactions) e
 * erro de credencial tem mensagem própria (credencial de teste não funciona aqui).
 */
describe("mercadopago - statusInternoMP", () => {
  it("lê o status do pagamento quando existe", () => {
    expect(
      statusInternoMP({ status: "action_required", transactions: { payments: [{ status: "approved" }] } }),
    ).toBe("pago");
    expect(
      statusInternoMP({ transactions: { payments: [{ status: "rejected" }] } }),
    ).toBe("recusado");
  });

  it("lê o status da ordem quando não há pagamento detalhado", () => {
    expect(statusInternoMP({ status: "processed" })).toBe("pago");
    expect(statusInternoMP({ status: "action_required" })).toBe("pendente");
    expect(statusInternoMP({ status: "expired" })).toBe("expirado");
  });

  it("status desconhecido ou vazio NUNCA libera acesso", () => {
    expect(statusInternoMP({ status: "algo_novo" })).toBe("pendente");
    expect(statusInternoMP({ status: "" })).toBe("pendente");
    expect(statusInternoMP({})).toBe("pendente");
    expect(statusInternoMP(null)).toBe("pendente");
  });
});

describe("mercadopago - normalizarMP", () => {
  it("extrai QR (texto + imagem), link e valor da ordem", () => {
    const cobranca = normalizarMP({
      id: "ORD01ABC",
      external_reference: "ERC20-1",
      total_amount: "19.00",
      status: "action_required",
      status_detail: "waiting_transfer",
      transactions: {
        payments: [
          {
            id: "PAY01ABC",
            status: "action_required",
            payment_method: {
              qr_code: "00020101...",
              qr_code_base64: "iVBORw0KGgo=",
              ticket_url: "https://mp/ticket",
            },
          },
        ],
      },
    });

    expect(cobranca.pedidoId).toBe("ORD01ABC");
    expect(cobranca.pagamentoId).toBe("PAY01ABC");
    expect(cobranca.status).toBe("pendente");
    expect(cobranca.statusDetalhe).toBe("waiting_transfer");
    expect(cobranca.valorCentavos).toBe(1900);
    expect(cobranca.qrCodeTexto).toBe("00020101...");
    expect(cobranca.qrCodeImagem).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(cobranca.linkPagamento).toBe("https://mp/ticket");
  });

  it("ordem vazia não quebra e não libera", () => {
    const cobranca = normalizarMP(null);
    expect(cobranca.status).toBe("pendente");
    expect(cobranca.pedidoId).toBe("");
    expect(cobranca.valorCentavos).toBe(0);
  });
});

describe("mercadopago - ambiente", () => {
  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
    delete process.env.MP_BASE_URL;
  });

  it("sem token não está configurado", () => {
    expect(mercadopagoConfigurado()).toBe(false);
  });

  it("com token está configurado e a base é a oficial", () => {
    process.env.MP_ACCESS_TOKEN = "APP_USR-teste";
    expect(mercadopagoConfigurado()).toBe(true);
    expect(mpBaseUrl()).toBe("https://api.mercadopago.com");
  });
});

describe("mercadopago - criarCobrancaPix", () => {
  const params = {
    referencia: "ERC20-TESTE",
    valorCentavos: 1900,
    descricao: "Curso ERC20",
    cliente: { nome: "Liniker Teste", email: "liniker@example.com", taxId: "12345678909" },
  };

  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = "APP_USR-teste";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MP_ACCESS_TOKEN;
  });

  it("monta o corpo que a Orders API exige (Pix em transactions + idempotência)", async () => {
    type CorpoEnviado = {
      type: string;
      processing_mode: string;
      total_amount: string;
      external_reference: string;
      transactions: {
        payments: Array<{
          amount: string;
          expiration_time: string;
          payment_method: { id: string; type: string };
        }>;
      };
      payer: { email: string; first_name?: string; identification?: { type: string; number: string } };
    };
    const chamadas: { url: string; corpo: CorpoEnviado; idempotencia?: string }[] = [];

    vi.stubGlobal("fetch", async (url: string, init: { body: string; headers: Record<string, string> }) => {
      chamadas.push({
        url: String(url),
        corpo: JSON.parse(init.body),
        idempotencia: init.headers["X-Idempotency-Key"],
      });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: "ORD01XYZ",
          external_reference: "ERC20-TESTE",
          total_amount: "19.00",
          status: "action_required",
          transactions: {
            payments: [
              {
                id: "PAY01XYZ",
                status: "action_required",
                payment_method: { qr_code: "000201", qr_code_base64: "AAA=", ticket_url: "https://mp/t" },
              },
            ],
          },
        }),
      } as unknown as Response;
    });

    const cobranca = await criarCobrancaPix(params);

    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].url).toBe("https://api.mercadopago.com/v1/orders");
    expect(chamadas[0].idempotencia).toBe("ERC20-TESTE");

    const corpo = chamadas[0].corpo;
    expect(corpo.type).toBe("online");
    expect(corpo.processing_mode).toBe("automatic");
    expect(corpo.total_amount).toBe("19.00");
    expect(corpo.transactions.payments[0].payment_method).toEqual({
      id: "pix",
      type: "bank_transfer",
    });
    // o total tem que casar com a soma das transações (a API devolve 400 se não casar)
    expect(corpo.total_amount).toBe(corpo.transactions.payments[0].amount);
    expect(corpo.payer.email).toBe("liniker@example.com");
    expect(corpo.payer.first_name).toBe("Liniker");
    expect(corpo.payer.identification).toEqual({ type: "CPF", number: "12345678909" });

    expect(cobranca.status).toBe("pendente");
    expect(cobranca.qrCodeTexto).toBe("000201");
    expect(cobranca.qrCodeImagem).toBe("data:image/png;base64,AAA=");
  });

  it("401 invalid_credentials explica que credencial de teste não serve", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: "invalid_credentials", message: "invalid_credentials" }),
    }));

    await expect(criarCobrancaPix(params)).rejects.toThrow(/usuário de teste/i);
  });

  it("400 traz o motivo devolvido pelo Mercado Pago", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: "unsupported_properties", cause: [{ code: "unsupported_properties", description: "notification_url não suportado" }] }),
    }));

    await expect(criarCobrancaPix(params)).rejects.toThrow(/notification_url não suportado/);
  });

  it("sem MP_ACCESS_TOKEN explica o que falta", async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(criarCobrancaPix(params)).rejects.toBeInstanceOf(MercadoPagoErro);
    await expect(criarCobrancaPix(params)).rejects.toThrow(/MP_ACCESS_TOKEN/);
  });
});
