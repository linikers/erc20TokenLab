import { NextResponse } from "next/server";
import {
  consultarPagamento,
  consultarPedido,
  MercadoPagoErro,
} from "@/lib/mercadopago";
import { PRECO_CENTAVOS } from "@/lib/produto";

/**
 * Webhook do Mercado Pago (painel: Webhooks → URL + eventos).
 *
 * Duas coisas aprendidas ao vivo:
 * 1. o corpo é só um aviso (`{ action, type, data: { id } }`) — o status se lê na
 *    API;
 * 2. o `data.id` **nem sempre é o id da ordem**: em notificação de pagamento vem o
 *    id do pagamento (ex.: `183312519297`) e consultar `/v1/orders/{id}` com ele
 *    devolve `404 order_not_found`. Por isso o handler aceita os dois caminhos e,
 *    quando o pagamento aponta a ordem, confirma o status pelo recurso canônico.
 *
 * Sempre responder 200: o MP espera confirmação em até 22s e reenvia a cada
 * 15 minutos enquanto não receber.
 */
interface NotificacaoMP {
  action?: string;
  type?: string;
  data?: { id?: string };
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  let tipo = url.searchParams.get("type") ?? "";
  let id = url.searchParams.get("data.id") ?? "";
  let acao = "";

  try {
    const body = (await request.json().catch(() => ({}))) as NotificacaoMP;
    tipo = body?.type ?? tipo;
    id = body?.data?.id ?? id;
    acao = body?.action ?? "";

    // Log sempre: sem tipo/id registrados não dá para diagnosticar notificação.
    console.log("[mercadopago webhook] recebido", { tipo, id, acao });

    if (!id) {
      console.warn("[mercadopago webhook] aviso sem id", { tipo });
      return NextResponse.json({ received: true });
    }

    // ---- 1) Notificação de ordem ----
    if (tipo === "order" || tipo === "") {
      try {
        const cobranca = await consultarPedido(id);
        return resposta({
          orderId: cobranca.pedidoId,
          referencia: cobranca.referencia,
          statusBruto: cobranca.statusBruto,
          status: cobranca.status,
          valorCentavos: cobranca.valorCentavos,
        });
      } catch (erro) {
        const e = erro as MercadoPagoErro;
        // `404 order_not_found` é esperado quando o id é de pagamento: cai no
        // caminho 2 em vez de estourar.
        if (e.http !== 404) throw erro;
        console.log("[mercadopago webhook] id não é de ordem, tentando como pagamento", { id });
      }
    }

    // ---- 2) Notificação de pagamento (ou id que não era ordem) ----
    const pagamento = await consultarPagamento(id);

    // Se o pagamento revelar a ordem, confirma pelo recurso canônico.
    if (pagamento.ordemId) {
      const cobranca = await consultarPedido(pagamento.ordemId);
      return resposta({
        orderId: cobranca.pedidoId,
        referencia: cobranca.referencia || pagamento.referencia,
        statusBruto: cobranca.statusBruto ?? pagamento.statusBruto,
        status: cobranca.status,
        valorCentavos: cobranca.valorCentavos || pagamento.valorCentavos,
      });
    }

    return resposta({
      orderId: "",
      referencia: pagamento.referencia,
      statusBruto: pagamento.statusBruto,
      status: pagamento.status,
      valorCentavos: pagamento.valorCentavos,
    });
  } catch (erro) {
    const e = erro as MercadoPagoErro;
    console.error("[mercadopago webhook] falha ao processar:", {
      tipo,
      id,
      acao,
      erro: e?.message ?? String(erro),
    });
    // 200 mesmo com erro interno: 4xx/5xx faz o MP reenviar em loop.
    return NextResponse.json({ received: true });
  }
}

function resposta(dados: {
  orderId: string;
  referencia: string;
  statusBruto?: string;
  status: string;
  valorCentavos: number;
}) {
  if (dados.status === "pago" && dados.valorCentavos !== PRECO_CENTAVOS) {
    console.error("[mercadopago webhook] valor divergente — acesso NÃO liberado", {
      referencia: dados.referencia,
      esperadoCentavos: PRECO_CENTAVOS,
      recebidoCentavos: dados.valorCentavos,
    });
    return NextResponse.json({ received: true });
  }

  console.log("[mercadopago webhook]", {
    order_id: dados.orderId,
    referencia: dados.referencia,
    statusBruto: dados.statusBruto,
    status: dados.status,
    liberado: dados.status === "pago",
  });

  return NextResponse.json({ received: true });
}
