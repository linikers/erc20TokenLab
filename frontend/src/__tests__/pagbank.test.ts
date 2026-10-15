import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  baseUrl,
  criarPedidoPix,
  normalizar,
  PagBankErro,
  statusInterno,
} from "@/lib/pagbank";

/**
 * Regras que não podem regredir: status desconhecido nunca vira "pago",
 * a resposta é achatada nos campos que o front usa, e o CPF é validado antes
 * de chamar a API (CPF inválido não pode virar requisição).
 */
describe("pagbank - statusInterno", () => {
  it("mapeia os status conhecidos", () => {
    expect(statusInterno("WAITING")).toBe("pendente");
    expect(statusInterno("PAID")).toBe("pago");
    expect(statusInterno("AVAILABLE")).toBe("pago");
    expect(statusInterno("DECLINED")).toBe("recusado");
    expect(statusInterno("CANCELED")).toBe("cancelado");
    expect(statusInterno("EXPIRED")).toBe("expirado");
    expect(statusInterno("REFUNDED")).toBe("cancelado");
  });

  it("status desconhecido ou vazio NUNCA libera acesso", () => {
    expect(statusInterno("IN_ANALYSIS")).toBe("pendente");
    expect(statusInterno("ALGO_NOVO")).toBe("pendente");
    expect(statusInterno("")).toBe("pendente");
    expect(statusInterno(undefined as unknown as string)).toBe("pendente");
  });
});

describe("pagbank - normalizar", () => {
  it("extrai QR, cobrança e valor do response do PagBank", () => {
    const pedido = normalizar({
      id: "ORDE_1",
      reference_id: "ERC20-1",
      charges: [{ id: "CHAR_1", status: "WAITING", amount: { value: 1900 } }],
      qr_code: [
        {
          text: "00020101...",
          links: [
            { rel: "QRCODE.PNG", href: "https://x/qr.png" },
            { rel: "QRCODE.BASE64", href: "https://x/qr.b64" },
          ],
        },
      ],
    });

    expect(pedido.pedidoId).toBe("ORDE_1");
    expect(pedido.chargeId).toBe("CHAR_1");
    expect(pedido.status).toBe("pendente");
    expect(pedido.statusBruto).toBe("WAITING");
    expect(pedido.valorCentavos).toBe(1900);
    expect(pedido.referencia).toBe("ERC20-1");
    expect(pedido.qrCodeTexto).toBe("00020101...");
    expect(pedido.qrCodePngUrl).toBe("https://x/qr.png");
  });

  it("acha o QR também no payment_method da cobrança", () => {
    const pedido = normalizar({
      id: "ORDE_2",
      charges: [
        {
          id: "CHAR_2",
          status: "PAID",
          amount: { value: 1900 },
          payment_method: {
            type: "PIX",
            pix: { text: "copia-e-cola", links: [{ rel: "QRCODE.PNG", href: "https://x/2.png" }] },
          },
        },
      ],
    });

    expect(pedido.status).toBe("pago");
    expect(pedido.qrCodeTexto).toBe("copia-e-cola");
    expect(pedido.qrCodePngUrl).toBe("https://x/2.png");
  });

  it("resposta vazia não quebra (e não libera)", () => {
    const pedido = normalizar({});
    expect(pedido.status).toBe("pendente");
    expect(pedido.pedidoId).toBe("");
    expect(pedido.valorCentavos).toBe(0);
  });
});

describe("pagbank - baseUrl (ambiente)", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("PAGBANK_BASE_URL tem precedência", () => {
    process.env.PAGBANK_BASE_URL = "https://api.pagseguro.com/";
    process.env.PAGBANK_SANDBOX = "true";
    expect(baseUrl()).toBe("https://api.pagseguro.com");
  });

  it("env antiga PAGBANK_SANDBOX=false aponta para produção", () => {
    delete process.env.PAGBANK_BASE_URL;
    process.env.PAGBANK_SANDBOX = "false";
    expect(baseUrl()).toBe("https://api.pagseguro.com");
  });

  it("sem configuração o default é sandbox (token de produção aqui dá 401)", () => {
    delete process.env.PAGBANK_BASE_URL;
    delete process.env.PAGBANK_SANDBOX;
    expect(baseUrl()).toBe("https://sandbox.api.pagseguro.com");
  });
});

describe("pagbank - criarPedidoPix", () => {
  const params = {
    referencia: "ERC20-TESTE",
    valorCentavos: 1900,
    descricao: "Curso ERC20",
    cliente: { nome: "Teste", email: "t@example.com", taxId: "12345678909" },
    notificationUrls: ["https://exemplo.test/api/pagbank/webhook"],
  };

  beforeEach(() => {
    process.env.PAGBANK_TOKEN = "token-de-teste";
    process.env.PAGBANK_BASE_URL = "https://sandbox.api.pagseguro.com";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.PAGBANK_TOKEN;
    delete process.env.PAGBANK_BASE_URL;
  });

  it("envia charges[].payment_method PIX com notification_urls e tax_id", async () => {
    type CorpoEnviado = {
      customer: { tax_id: string };
      items: Array<{ unit_amount: number }>;
      charges: Array<{
        payment_method: {
          type: string;
          pix: { key?: string; expiration_date?: string };
        };
        notification_urls: string[];
      }>;
    };
    const chamadas: { url: string; corpo: CorpoEnviado }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { body: string }) => {
      chamadas.push({ url: String(url), corpo: JSON.parse(init.body) });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          id: "ORDE_9",
          reference_id: params.referencia,
          charges: [{ id: "CHAR_9", status: "WAITING", amount: { value: 1900 } }],
          qr_code: [{ text: "000201", links: [] }],
        }),
      } as unknown as Response;
    });

    const pedido = await criarPedidoPix(params);

    expect(chamadas).toHaveLength(1);
    expect(chamadas[0].url).toBe("https://sandbox.api.pagseguro.com/orders");
    const corpo = chamadas[0].corpo;
    expect(corpo.charges[0].payment_method.type).toBe("PIX");
    // a chave PIX NÃO vai no payload: quem usa é a chave da conta recebedora
    expect(corpo.charges[0].payment_method.pix.key).toBeUndefined();
    expect(corpo.charges[0].payment_method.pix.expiration_date).toBeTruthy();
    expect(corpo.charges[0].notification_urls).toEqual(params.notificationUrls);
    expect(corpo.customer.tax_id).toBe("12345678909");
    expect(corpo.items[0].unit_amount).toBe(1900);
    expect(pedido.status).toBe("pendente");
    expect(pedido.qrCodeTexto).toBe("000201");
  });

  it("recusa CPF inválido sem chamar a API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      criarPedidoPix({ ...params, cliente: { ...params.cliente, taxId: "123" } }),
    ).rejects.toBeInstanceOf(PagBankErro);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("401 do PagBank vira erro explicativo e não repete a chamada", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error_messages: [{ code: "UNAUTHORIZED" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(criarPedidoPix(params)).rejects.toThrow(/token/i);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("403 ACCESS_DENIED explica que falta liberação da API (não é token errado)", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        error_messages: [
          { code: "ACCESS_DENIED", description: "whitelist access required. Contact PagSeguro" },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(criarPedidoPix(params)).rejects.toThrow(/Integrações/);
    await expect(criarPedidoPix(params)).rejects.toThrow(/API de Pedidos liberada/);
    expect(fetchMock).toHaveBeenCalledTimes(2); // 403 não repete: 1 tentativa por chamada
  });

  it("sem PAGBANK_TOKEN explica o que falta", async () => {
    delete process.env.PAGBANK_TOKEN;
    await expect(criarPedidoPix(params)).rejects.toThrow(/PAGBANK_TOKEN/);
  });
});
