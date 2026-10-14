import { NextResponse } from "next/server";
import { consultarPedido, PagBankErro } from "@/lib/pagbank";
import { PRECO_CENTAVOS } from "@/lib/produto";

/** Corpo da notificação do PagBank: mesmo formato do response síncrono. */
interface NotificacaoPagBank {
  id?: string;
  reference_id?: string;
  charges?: Array<{ id?: string; status?: string }>;
}

/**
 * Webhook de mudança de status do PagBank (`notification_urls`).
 *
 * Regras que evitam liberar acesso errado:
 * - **não confiar no corpo**: o payload é o mesmo do response síncrono, então ele
 *   pode ser reenviado; reconferimos o pedido na API antes de qualquer conclusão;
 * - **conferir o valor**: pagamento com valor diferente do produto não libera;
 * - **status desconhecido não libera** (`statusInterno` devolve "pendente");
 * - **sempre 200**: erro de resposta faz o PagBank reenviar em loop.
 *
 * Nesta fase a fonte de verdade do acesso é `GET /api/pagbank/status` (consulta
 * ao PagBank). O registro da venda em banco é o PR seguinte.
 */
const eventosProcessados = new Set<string>();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NotificacaoPagBank;
    const referencia: string = body?.reference_id ?? "";
    const chargeId: string | undefined = body?.charges?.[0]?.id;
    const statusBruto: string | undefined = body?.charges?.[0]?.status;

    // 1) idempotência barata: o mesmo evento (cobrança + status) não é reprocessado.
    const chave = `${chargeId ?? body?.id ?? "?"}:${statusBruto ?? "SEM_STATUS"}`;
    if (eventosProcessados.has(chave)) {
      return NextResponse.json({ received: true, duplicado: true });
    }
    eventosProcessados.add(chave);

    // 2) fonte de verdade: reconsultar o pedido na API do PagBank.
    const pedido = body?.id ? await consultarPedido(String(body.id)) : null;

    if (!pedido) {
      console.warn("[pagbank webhook] corpo sem id de pedido", { referencia });
      return NextResponse.json({ received: true });
    }

    // 3) valor divergente nunca libera — fica no log para conferência.
    if (pedido.status === "pago" && pedido.valorCentavos !== PRECO_CENTAVOS) {
      console.error("[pagbank webhook] valor divergente — acesso NÃO liberado", {
        referencia,
        esperadoCentavos: PRECO_CENTAVOS,
        recebidoCentavos: pedido.valorCentavos,
      });
      return NextResponse.json({ received: true });
    }

    console.log("[pagbank webhook]", {
      referencia,
      order_id: pedido.pedidoId,
      charge_id: pedido.chargeId,
      statusBruto: pedido.statusBruto,
      status: pedido.status,
      liberado: pedido.status === "pago",
    });

    return NextResponse.json({ received: true });
  } catch (erro) {
    // Mesmo com erro interno devolvemos 200 (senão o PagBank reenvia em loop);
    // o erro fica no log e o acesso continua verificável por /api/pagbank/status.
    const e = erro as PagBankErro;
    console.error("[pagbank webhook] falha ao processar:", e?.message ?? erro);
    return NextResponse.json({ received: true });
  }
}
