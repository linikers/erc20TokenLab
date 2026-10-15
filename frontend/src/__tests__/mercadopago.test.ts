import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  consultarPagamento,
  criarCobrancaPix,
  mercadopagoConfigurado,
  MercadoPagoErro,
  mpBaseUrl,
  normalizarMP,
  referenciaValida,
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

describe("mercadopago - referenciaValida", () => {
  it("tira o que o MP recusa (só letras, números e hífen)", () => {
    // referência montada com e-mail era o que quebrava a cobrança em produção
    expect(referenciaValida("ERC20-1759930-liniker@example.com")).toBe(
      "ERC20-1759930-liniker-example-com",
    );
    expect(referenciaValida("comprador@gmail.com")).toBe("comprador-gmail-com");
    expect(referenciaValida("a_b.c d@e")).toBe("a-b-c-d-e");
  });

  it("não deixa passar nada fora do permitido e limita a 64", () => {
    const limpa = referenciaValida("a".repeat(80) + "@@");
    expect(limpa).toHaveLength(64);
    expect(limpa).toMatch(/^[A-Za-z0-9-]+$/);
    expect(referenciaValida("@@@,,,..")).toMatch(/^[A-Za-z0-9-]+$/);
  });

  it("nunca devolve vazio (é a referência que liga a ordem à compra)", () => {
    expect(referenciaValida("")).toMatch(/^ERC20-\d+$/);
  });
});

describe("mercadopago - consultarPagamento (webhook com id de pagamento)", () => {
  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = "APP_USR-teste";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.MP_ACCESS_TOKEN;
  });

  it("lê status, valor e a ordem apontada pelo pagamento", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: 183312519297,
        status: "approved",
        status_detail: "accredited",
        transaction_amount: 19,
        external_reference: "ERC20-123",
        order: { id: "ORD01M50CPV2Y" },
      }),
    }));

    const pagamento = await consultarPagamento("183312519297");
    expect(pagamento.status).toBe("pago");
    expect(pagamento.statusDetalhe).toBe("accredited");
    expect(pagamento.valorCentavos).toBe(1900);
    expect(pagamento.referencia).toBe("ERC20-123");
    expect(pagamento.ordemId).toBe("ORD01M50CPV2Y");
  });

  it("pagamento pendente não libera", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, status: "pending", transaction_amount: 19 }),
    }));
    expect((await consultarPagamento("1")).status).toBe("pendente");
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

  it("400 traz o motivo e o CAMPO devolvido pelo Mercado Pago", async () => {
    vi.stubGlobal("fetch", async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        errors: [
          {
            code: "property_value",
            message: "Invalid value for property",
            details: [{ property: "external_reference", message: "must contain only letters, numbers and hyphen" }],
          },
        ],
      }),
    }));

    let erro: MercadoPagoErro | undefined;
    try {
      await criarCobrancaPix(params);
    } catch (e) {
      erro = e as MercadoPagoErro;
    }
    expect(erro?.message).toContain("property_value");
    expect(erro?.message).toContain("external_reference");
  });

  it("referência com e-mail vai saneada no corpo (regressão do 400 em produção)", async () => {
    let corpoEnviado: { external_reference?: string } = {};
    vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
      corpoEnviado = JSON.parse(init.body);
      return {
        ok: true,
        status: 201,
        json: async () => ({ id: "ORD01", total_amount: "19.00", status: "action_required" }),
      } as unknown as Response;
    });

    await criarCobrancaPix({ ...params, referencia: `ERC20-123-${params.cliente.email}` });

    expect(corpoEnviado.external_reference).toBe("ERC20-123-liniker-example-com");
    expect(corpoEnviado.external_reference).not.toContain("@");
  });

  it("sem MP_ACCESS_TOKEN explica o que falta", async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(criarCobrancaPix(params)).rejects.toBeInstanceOf(MercadoPagoErro);
    await expect(criarCobrancaPix(params)).rejects.toThrow(/MP_ACCESS_TOKEN/);
  });
});
