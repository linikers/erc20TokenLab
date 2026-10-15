import { NextResponse } from "next/server";
import { consultarPedido, MercadoPagoErro } from "@/lib/mercadopago";
import { PRECO_CENTAVOS } from "@/lib/produto";

/**
 * Webhook do Mercado Pago (evento **Order**, configurado no painel:
 * Webhooks → modo produção → URL + evento "Order").
 *
 * O corpo é um envelope de aviso: `{ action, type: "order", data: { id } }`.
 * Ele **não** traz o status — a verdade se lê em `GET /v1/orders/{id}`, então é
 * isso que fazemos aqui (mesma regra do PagBank: não confiar no que chega).
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
  try {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as NotificacaoMP;

    // O id vem no corpo e/ou nos query params (data.id=...&type=order).
    const tipo = body?.type ?? url.searchParams.get("type") ?? "";
    const id = body?.data?.id ?? url.searchParams.get("data.id") ?? "";

    if (!id) {
      console.warn("[mercadopago webhook] aviso sem id", { tipo });
      return NextResponse.json({ received: true });
    }

    if (tipo !== "order") {
      // Só o tópico "order" está configurado para esta aplicação; qualquer outro
      // é registrado e ignorado (nada é liberado sem confirmar na API).
      console.log("[mercadopago webhook] tópico ignorado", { tipo, id });
      return NextResponse.json({ received: true });
    }

    const cobranca = await consultarPedido(id);

    if (cobranca.status === "pago" && cobranca.valorCentavos !== PRECO_CENTAVOS) {
      console.error("[mercadopago webhook] valor divergente — acesso NÃO liberado", {
        referencia: cobranca.referencia,
        esperadoCentavos: PRECO_CENTAVOS,
        recebidoCentavos: cobranca.valorCentavos,
      });
      return NextResponse.json({ received: true });
    }

    console.log("[mercadopago webhook]", {
      order_id: cobranca.pedidoId,
      referencia: cobranca.referencia,
      statusBruto: cobranca.statusBruto,
      status: cobranca.status,
      liberado: cobranca.status === "pago",
    });

    return NextResponse.json({ received: true });
  } catch (erro) {
    const e = erro as MercadoPagoErro;
    console.error("[mercadopago webhook] falha ao processar:", e?.message ?? erro);
    // 200 mesmo com erro interno: 4xx/5xx faz o MP reenviar em loop.
    return NextResponse.json({ received: true });
  }
}
