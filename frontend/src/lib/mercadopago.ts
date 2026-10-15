/**
 * Cliente do Mercado Pago — Checkout Transparente via Orders API (`POST /v1/orders`).
 *
 * Contrato levantado na doc oficial (out/2026):
 * - `POST /v1/orders` com `type: "online"`, `processing_mode: "automatic"` e a
 *   cobrança em `transactions.payments[]` (a Orders API aceita **uma** transação);
 * - `total_amount` (string) precisa bater com a soma de `transactions.payments[].amount`;
 * - header `X-Idempotency-Key` é obrigatório (1 a 64 caracteres);
 * - Pix: `payment_method: { id: "pix", type: "bank_transfer" }` — o QR volta em
 *   `transactions.payments[].payment_method.qr_code` (+ `qr_code_base64` e `ticket_url`);
 * - **credenciais de teste não funcionam** nesta API (`401 invalid_credentials`):
 *   para testar, use um **usuário de teste** com credenciais de produção, e o e-mail
 *   do pagador precisa conter `@testuser.com` (`400 invalid_email_for_sandbox`);
 * - o webhook é configurado no painel (Webhooks → evento "Order") e chega como
 *   `{ type: "order", data: { id: "ORD..." } }`; a verdade se lê em `GET /v1/orders/{id}`.
 *
 * Pré-requisito do Pix: a conta Mercado Pago precisa ter **chave Pix cadastrada**.
 *
 * Regra que vale para os dois provedores: **status desconhecido nunca libera acesso**.
 */

export const MP_BASE = "https://api.mercadopago.com";

export type StatusInterno =
  | "pendente"
  | "pago"
  | "recusado"
  | "cancelado"
  | "expirado";

/** Status da ordem (GET /v1/orders/{id}). */
const MAPA_ORDEM: Record<string, StatusInterno> = {
  processed: "pago",
  created: "pendente",
  action_required: "pendente",
  canceled: "cancelado",
  cancelled: "cancelado",
  expired: "expirado",
  failed: "recusado",
};

/** Status do pagamento dentro da ordem (`transactions.payments[].status`). */
const MAPA_PAGAMENTO: Record<string, StatusInterno> = {
  approved: "pago",
  processed: "pago",
  pending: "pendente",
  in_process: "pendente",
  authorized: "pendente",
  action_required: "pendente",
  rejected: "recusado",
  failed: "recusado",
  cancelled: "cancelado",
  canceled: "cancelado",
  refunded: "cancelado",
  charged_back: "cancelado",
};

export interface PagamentoMP {
  id?: string;
  status?: string;
  status_detail?: string;
  /** No Pix, é aqui que vêm o copia-e-cola e o PNG do QR. */
  payment_method?: {
    id?: string;
    type?: string;
    qr_code?: string;
    qr_code_base64?: string;
    ticket_url?: string;
  };
}

export interface OrdemMP {
  id?: string;
  reference_id?: string;
  external_reference?: string;
  total_amount?: string;
  status?: string;
  status_detail?: string;
  transactions?: { payments?: PagamentoMP[] };
}

/**
 * Achata o status cru do MP. O pagamento (quando existe) manda; depois a ordem;
 * e qualquer coisa fora dos mapas cai em `pendente` — nunca em `pago`.
 */
export function statusInternoMP(ordem?: OrdemMP | null): StatusInterno {
  const pagamento = ordem?.transactions?.payments?.[0];
  const doPagamento =
    MAPA_PAGAMENTO[String(pagamento?.status ?? "").toLowerCase()];
  if (doPagamento) return doPagamento;

  const daOrdem = MAPA_ORDEM[String(ordem?.status ?? "").toLowerCase()];
  if (daOrdem) return daOrdem;

  return "pendente";
}

export interface CobrancaMP {
  pedidoId: string;
  pagamentoId?: string;
  status: StatusInterno;
  statusBruto?: string;
  statusDetalhe?: string;
  valorCentavos: number;
  referencia: string;
  /** Pix copia-e-cola. */
  qrCodeTexto?: string;
  /** PNG do QR como data URI, pronto para <img src>. */
  qrCodeImagem?: string;
  /** Página hospedada do MP (alternativa ao QR). */
  linkPagamento?: string;
  bruto: unknown;
}

export class MercadoPagoErro extends Error {
  readonly http?: number;
  readonly detalhes?: unknown;
  constructor(mensagem: string, http?: number, detalhes?: unknown) {
    super(mensagem);
    this.name = "MercadoPagoErro";
    this.http = http;
    this.detalhes = detalhes;
  }
}

export function mercadopagoConfigurado(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN?.trim());
}

export function mpBaseUrl(): string {
  return (process.env.MP_BASE_URL?.trim().replace(/\/+$/, "")) || MP_BASE;
}

/** Só dígitos: o MP usa o número cru em `payer.identification`. */
export function semMascara(valor: string): string {
  return String(valor ?? "").replace(/\D/g, "");
}

function accessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new MercadoPagoErro(
      "MP_ACCESS_TOKEN não configurado (Mercado Pago → Suas integrações → Credenciais).",
    );
  }
  return token;
}

interface RespostaErroMP {
  error?: string;
  message?: string;
  status?: number;
  cause?: Array<{ code?: string; description?: string }>;
}

function motivoErro(dados: RespostaErroMP | null): string {
  const causa = dados?.cause?.[0];
  return (
    causa?.description ||
    causa?.code ||
    dados?.message ||
    dados?.error ||
    ""
  );
}

/** 5xx/rede repete; 4xx não (é payload/token/credencial). */
async function requisitar<T>(
  metodo: "GET" | "POST",
  caminho: string,
  corpo?: unknown,
  idempotencia?: string,
): Promise<T> {
  const tentativas = Number(process.env.MP_TENTATIVAS || 2);
  let ultimoHttp: number | undefined;
  let ultimoCorpo: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    const resposta = await fetch(`${mpBaseUrl()}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${accessToken()}`,
        "Content-Type": "application/json",
        ...(idempotencia ? { "X-Idempotency-Key": idempotencia } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: "no-store",
    });

    const dados = (await resposta.json().catch(() => null)) as
      | (RespostaErroMP & T)
      | null;

    if (resposta.ok) return dados as T;

    ultimoHttp = resposta.status;
    ultimoCorpo = dados;

    if (resposta.status === 401 || resposta.status === 403) {
      const detalhe = motivoErro(dados);
      if (/invalid_credentials/i.test(JSON.stringify(dados ?? ""))) {
        throw new MercadoPagoErro(
          "Mercado Pago recusou as credenciais: esta API não aceita credenciais de teste. Use um usuário de teste com credenciais de produção, ou ative as credenciais de produção da aplicação.",
          resposta.status,
          dados,
        );
      }
      throw new MercadoPagoErro(
        `Mercado Pago recusou as credenciais (${resposta.status})${detalhe ? `: ${detalhe}` : "."} Confira o Access Token e se as credenciais de produção foram ativadas.`,
        resposta.status,
        dados,
      );
    }

    if (resposta.status < 500) {
      const detalhe = motivoErro(dados);
      throw new MercadoPagoErro(
        `Mercado Pago recusou a requisição (${resposta.status})${detalhe ? `: ${detalhe}` : "."}`,
        resposta.status,
        dados,
      );
    }

    if (tentativa < tentativas) {
      await new Promise((res) => setTimeout(res, 1000 * tentativa));
    }
  }

  throw new MercadoPagoErro(
    `Falha ao falar com o Mercado Pago${ultimoHttp ? ` (${ultimoHttp})` : ""}.`,
    ultimoHttp,
    ultimoCorpo,
  );
}

export interface CriarCobrancaPixParams {
  referencia: string;
  valorCentavos: number;
  descricao: string;
  cliente: { nome: string; email: string; taxId?: string };
  /** Validade do Pix (ISO 8601 duration, ex.: "PT1H"). Default: 1 hora. */
  expiracao?: string;
}

export async function criarCobrancaPix(
  params: CriarCobrancaPixParams,
): Promise<CobrancaMP> {
  const valor = (params.valorCentavos / 100).toFixed(2);
  const [primeiroNome, ...resto] = String(params.cliente?.nome ?? "")
    .trim()
    .split(/\s+/);
  const documento = semMascara(params.cliente?.taxId ?? "");

  const corpo = {
    type: "online",
    processing_mode: "automatic",
    total_amount: valor,
    external_reference: params.referencia.slice(0, 64),
    // O MP aceita uma transação por ordem.
    transactions: {
      payments: [
        {
          amount: valor,
          payment_method: { id: "pix", type: "bank_transfer" },
          expiration_time: params.expiracao ?? "PT1H",
        },
      ],
    },
    payer: {
      email: params.cliente.email,
      ...(primeiroNome ? { first_name: primeiroNome } : {}),
      ...(resto.length ? { last_name: resto.join(" ") } : {}),
      ...(documento.length === 11 || documento.length === 14
        ? {
            identification: {
              type: documento.length === 11 ? "CPF" : "CNPJ",
              number: documento,
            },
          }
        : {}),
    },
  };

  // A URL do webhook é configurada no painel do MP (Webhooks → evento "Order"),
  // não no corpo: mandar campo não suportado devolve 400 unsupported_properties.
  const resposta = await requisitar<OrdemMP>(
    "POST",
    "/v1/orders",
    corpo,
    params.referencia.slice(0, 64),
  );

  return normalizarMP(resposta, params.referencia);
}

export async function consultarPedido(pedidoId: string): Promise<CobrancaMP> {
  const resposta = await requisitar<OrdemMP>(
    "GET",
    `/v1/orders/${encodeURIComponent(pedidoId)}`,
  );
  return normalizarMP(resposta, resposta?.external_reference ?? "");
}

/** Achata a ordem do MP no que o nosso código usa. */
export function normalizarMP(
  resposta: OrdemMP | null,
  referencia = "",
): CobrancaMP {
  const pagamento = resposta?.transactions?.payments?.[0];
  const metodo = pagamento?.payment_method ?? {};
  const base64 = metodo.qr_code_base64;

  return {
    pedidoId: resposta?.id ?? "",
    pagamentoId: pagamento?.id,
    status: statusInternoMP(resposta),
    statusBruto: pagamento?.status ?? resposta?.status,
    statusDetalhe: pagamento?.status_detail ?? resposta?.status_detail,
    valorCentavos: Math.round(Number(resposta?.total_amount ?? 0) * 100),
    referencia: resposta?.external_reference ?? referencia,
    qrCodeTexto: metodo.qr_code,
    qrCodeImagem: base64 ? `data:image/png;base64,${base64}` : undefined,
    linkPagamento: metodo.ticket_url,
    bruto: resposta,
  };
}
