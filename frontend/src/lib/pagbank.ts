/**
 * Cliente da API de Pedidos do PagBank (Orders).
 *
 * Contrato verificado ao vivo no sandbox (boleto 201/WAITING, cartão 201/PAID e
 * 201/DECLINED, webhook com o mesmo payload do response síncrono):
 * - `POST /orders` cria o pedido e já a cobrança; a cobrança mora em `charges[]`
 *   (sem `charges[].payment_method` não existe PIX/QR para o cliente pagar);
 * - valores em **centavos** (`1900` = R$ 19,00);
 * - `customer.tax_id` (CPF 11 / CNPJ 14) é **obrigatório**, senão `400 must not be null`;
 * - no PIX a **chave não vai no payload** — a API usa a chave da conta recebedora;
 * - webhook: `notification_urls` na cobrança, e o corpo tem o mesmo formato do
 *   response síncrono (`charges[].status`, `reference_id`, `paid_at`);
 * - a única autenticação é o header `Authorization` com Bearer token do painel.
 *   Não existe `client_credentials` nessa API.
 */

export const PAGBANK_SANDBOX = "https://sandbox.api.pagseguro.com";
export const PAGBANK_PRODUCAO = "https://api.pagseguro.com";

export type StatusPagBank =
  | "WAITING"
  | "IN_ANALYSIS"
  | "PAID"
  | "AVAILABLE"
  | "DECLINED"
  | "CANCELED"
  | "EXPIRED"
  | "REFUNDED"
  | string;

export type StatusInterno =
  | "pendente"
  | "pago"
  | "recusado"
  | "cancelado"
  | "expirado";

const MAPA_STATUS: Record<string, StatusInterno> = {
  WAITING: "pendente",
  IN_ANALYSIS: "pendente",
  PAID: "pago",
  AVAILABLE: "pago",
  DECLINED: "recusado",
  CANCELED: "cancelado",
  EXPIRED: "expirado",
  REFUNDED: "cancelado",
};

/** Status desconhecido cai em `pendente` — nunca liberar acesso por engano. */
export function statusInterno(status: StatusPagBank): StatusInterno {
  return MAPA_STATUS[String(status ?? "").toUpperCase()] ?? "pendente";
}

/** Link de recurso devolvido pelo PagBank (`QRCODE.PNG`, `BOLETO.PDF`, ...). */
interface LinkPagBank {
  rel?: string;
  href?: string;
}

interface PixPagBank {
  text?: string;
  links?: LinkPagBank[];
}

interface BoletoPagBank {
  barcode?: string;
  formatted_barcode?: string;
}

interface CobrancaPagBank {
  id?: string;
  status?: string;
  amount?: { value?: number };
  payment_method?: {
    type?: string;
    pix?: PixPagBank;
    boleto?: BoletoPagBank;
  };
  links?: LinkPagBank[];
}

/** Formato que o PagBank devolve em `POST /orders`, `GET /orders/{id}` e no webhook. */
export interface RespostaPagBank {
  id?: string;
  reference_id?: string;
  amount?: { value?: number };
  charges?: CobrancaPagBank[];
  qr_code?: PixPagBank[];
  error_messages?: Array<{
    code?: string;
    description?: string;
    parameter_name?: string;
  }>;
}

export interface PedidoNormalizado {
  pedidoId: string;
  chargeId?: string;
  status: StatusInterno;
  statusBruto?: string;
  valorCentavos: number;
  referencia: string;
  /** PIX copia-e-cola. */
  qrCodeTexto?: string;
  /** PNG/BASE64 do QR. */
  qrCodePngUrl?: string;
  boletoBarcode?: string;
  boletoPdfUrl?: string;
  bruto: unknown;
}

export class PagBankErro extends Error {
  readonly http?: number;
  readonly detalhes?: unknown;
  constructor(mensagem: string, http?: number, detalhes?: unknown) {
    super(mensagem);
    this.name = "PagBankErro";
    this.http = http;
    this.detalhes = detalhes;
  }
}

export function baseUrl(): string {
  const explicita = process.env.PAGBANK_BASE_URL?.trim().replace(/\/+$/, "");
  if (explicita) return explicita;
  // Compatibilidade com a env antiga (`PAGBANK_SANDBOX=true|false`) — sem ela o
  // default é sandbox, o que faz um token de produção responder 401 aqui.
  if (process.env.PAGBANK_SANDBOX === "false") return PAGBANK_PRODUCAO;
  return PAGBANK_SANDBOX;
}

export function pagbankConfigurado(): boolean {
  return Boolean(process.env.PAGBANK_TOKEN?.trim());
}

export function pagbankProducao(): boolean {
  return baseUrl() === PAGBANK_PRODUCAO;
}

function token(): string {
  const t = process.env.PAGBANK_TOKEN?.trim();
  if (!t) {
    throw new PagBankErro(
      "PAGBANK_TOKEN não configurado (produção: PagBank → Vendas → Integrações → Gerar Token).",
    );
  }
  return t;
}

/**
 * 5xx/rede repete com backoff; 401/403 e o resto dos 4xx **não** repetem:
 * é erro de token/payload, repetir só gasta tempo.
 */
async function requisitar<T>(
  metodo: "GET" | "POST",
  caminho: string,
  corpo?: unknown,
): Promise<T> {
  const tentativas = Number(process.env.PAGBANK_TENTATIVAS || 2);
  let ultimoHttp: number | undefined;
  let ultimoCorpo: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const resposta = await fetch(`${baseUrl()}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: "no-store",
    });

    const dados = (await resposta.json().catch(() => null)) as RespostaPagBank | null;
    if (resposta.ok) return dados as T;

    ultimoHttp = resposta.status;
    ultimoCorpo = dados;

    if (resposta.status === 401 || resposta.status === 403) {
      const codigo = dados?.error_messages?.[0]?.code;
      const descricao = dados?.error_messages?.[0]?.description ?? "";
      // 403 com ACCESS_DENIED não é token errado: é a conta sem a API de
      // Pedidos liberada (verificado ao vivo). Mensagem diferente porque a
      // ação é outra — quem resolve é o time de Integrações do PagBank.
      if (codigo === "ACCESS_DENIED" || /whitelist/i.test(descricao)) {
        throw new PagBankErro(
          "A conta PagBank não tem a API de Pedidos liberada (ACCESS_DENIED: whitelist access required). O token está certo — falta o PagBank habilitar a API para a conta; peça ao time de Integrações.",
          resposta.status,
          dados,
        );
      }
      throw new PagBankErro(
        "PagBank recusou o token (401/403). Confira o ambiente: sandbox usa o token do Portal do Desenvolvedor; produção usa Vendas → Integrações → Gerar Token.",
        resposta.status,
        dados,
      );
    }

    // Conta recebedora sem chave PIX ativa — não é bug de payload (boleto e
    // cartão passam com o mesmo corpo).
    if (/Pix key was not found/i.test(JSON.stringify(dados ?? ""))) {
      throw new PagBankErro(
        "A conta PagBank não tem chave PIX ativa. Cadastre uma chave PIX no app/site do PagBank antes de cobrar por PIX.",
        resposta.status,
        dados,
      );
    }

    if (resposta.status < 500) {
      const detalhe = dados?.error_messages?.[0];
      const motivo = detalhe
        ? `${detalhe.parameter_name ? `${detalhe.parameter_name}: ` : ""}${detalhe.description ?? ""}`
        : "";
      throw new PagBankErro(
        `PagBank recusou a requisição (${resposta.status})${motivo ? `: ${motivo}` : "."}`,
        resposta.status,
        dados,
      );
    }

    if (tentativa < tentativas) {
      await new Promise((res) => setTimeout(res, 1000 * tentativa));
    }
  }

  throw new PagBankErro(
    `Falha ao falar com o PagBank${ultimoHttp ? ` (${ultimoHttp})` : ""}.`,
    ultimoHttp,
    ultimoCorpo,
  );
}

export interface CriarPedidoPixParams {
  /** Nosso identificador — é por ele que o webhook se liga à nossa compra. */
  referencia: string;
  valorCentavos: number;
  descricao: string;
  cliente: { nome: string; email: string; taxId: string };
  notificationUrls: string[];
  /** Validade do QR em minutos (default: 60). */
  expiracaoMinutos?: number;
}

export async function criarPedidoPix(
  params: CriarPedidoPixParams,
): Promise<PedidoNormalizado> {
  const taxId = String(params.cliente?.taxId ?? "").replace(/\D/g, "");
  if (!/^\d{11}$|^\d{14}$/.test(taxId)) {
    throw new PagBankErro(
      "CPF (11 dígitos) ou CNPJ (14 dígitos) do comprador é obrigatório no PagBank.",
    );
  }
  if (!(params.valorCentavos > 0)) {
    throw new PagBankErro("O valor do pedido precisa ser maior que zero.");
  }

  const minutos = params.expiracaoMinutos ?? 60;

  const corpo = {
    reference_id: params.referencia,
    customer: {
      name: params.cliente.nome,
      email: params.cliente.email,
      tax_id: taxId,
    },
    items: [
      {
        name: params.descricao,
        quantity: 1,
        unit_amount: params.valorCentavos,
      },
    ],
    charges: [
      {
        reference_id: params.referencia,
        description: params.descricao,
        amount: { value: params.valorCentavos, currency: "BRL" },
        payment_method: {
          type: "PIX",
          pix: {
            expiration_date: new Date(
              Date.now() + minutos * 60_000,
            ).toISOString(),
          },
        },
        notification_urls: params.notificationUrls,
      },
    ],
  };

  return normalizar(
    await requisitar<RespostaPagBank>("POST", "/orders", corpo),
    params.referencia,
  );
}

export async function consultarPedido(pedidoId: string): Promise<PedidoNormalizado> {
  const resposta = await requisitar<RespostaPagBank>(
    "GET",
    `/orders/${encodeURIComponent(pedidoId)}`,
  );
  return normalizar(resposta, resposta?.reference_id ?? "");
}

export async function cancelarCobranca(chargeId: string): Promise<StatusInterno> {
  const resposta = await requisitar<CobrancaPagBank>(
    "POST",
    `/charges/${encodeURIComponent(chargeId)}/cancel`,
  );
  return statusInterno(resposta?.status ?? "");
}

/** Achata a resposta do PagBank (síncrona ou webhook — o formato é o mesmo). */
export function normalizar(
  resposta: RespostaPagBank | null,
  referencia = "",
): PedidoNormalizado {
  const cobranca: CobrancaPagBank = resposta?.charges?.[0] ?? {};
  const qr: PixPagBank =
    resposta?.qr_code?.[0] ?? cobranca?.payment_method?.pix ?? {};
  const links: LinkPagBank[] = qr?.links ?? cobranca?.links ?? [];
  const link = (rel: string) => links.find((l) => l?.rel === rel)?.href;

  return {
    pedidoId: resposta?.id ?? "",
    chargeId: cobranca?.id,
    status: statusInterno(cobranca?.status ?? ""),
    statusBruto: cobranca?.status,
    valorCentavos: cobranca?.amount?.value ?? resposta?.amount?.value ?? 0,
    referencia: resposta?.reference_id ?? referencia,
    qrCodeTexto: qr?.text,
    qrCodePngUrl: link("QRCODE.PNG") ?? link("QRCODE.BASE64"),
    boletoBarcode:
      cobranca?.payment_method?.boleto?.barcode ??
      cobranca?.payment_method?.boleto?.formatted_barcode,
    boletoPdfUrl: link("BOLETO.PDF"),
    bruto: resposta,
  };
}
