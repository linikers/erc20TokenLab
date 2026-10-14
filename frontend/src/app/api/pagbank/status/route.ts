import { NextResponse } from "next/server";
import { consultarPedido, PagBankErro, pagbankConfigurado } from "@/lib/pagbank";

/**
 * Fonte de verdade do acesso: pergunta ao PagBank se este pedido está pago.
 * Não depende do webhook ter chegado nem de banco de dados.
 */
export async function GET(request: Request) {
  const order = new URL(request.url).searchParams.get("order");

  if (!order) {
    return NextResponse.json({ error: "order é obrigatório" }, { status: 400 });
  }
  if (!pagbankConfigurado()) {
    return NextResponse.json(
      { error: "PAGBANK_TOKEN não configurado" },
      { status: 503 },
    );
  }

  try {
    const pedido = await consultarPedido(order);
    return NextResponse.json({
      order_id: pedido.pedidoId,
      status: pedido.statusBruto,
      status_interno: pedido.status,
      liberado: pedido.status === "pago",
      valor: pedido.valorCentavos / 100,
    });
  } catch (erro) {
    const e = erro as PagBankErro;
    return NextResponse.json(
      { error: e.message, liberado: false },
      { status: e.http === 404 ? 404 : 502 },
    );
  }
}
