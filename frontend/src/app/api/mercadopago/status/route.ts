import { NextResponse } from "next/server";
import {
  consultarPedido,
  mercadopagoConfigurado,
  MercadoPagoErro,
} from "@/lib/mercadopago";

/**
 * Fonte de verdade do acesso no Mercado Pago: pergunta à API se a ordem está paga.
 * Não depende do webhook ter chegado nem de banco de dados.
 */
export async function GET(request: Request) {
  const order = new URL(request.url).searchParams.get("order");

  if (!order) {
    return NextResponse.json({ error: "order é obrigatório" }, { status: 400 });
  }
  if (!mercadopagoConfigurado()) {
    return NextResponse.json({ error: "MP_ACCESS_TOKEN não configurado" }, { status: 503 });
  }

  try {
    const cobranca = await consultarPedido(order);
    return NextResponse.json({
      order_id: cobranca.pedidoId,
      status: cobranca.statusBruto,
      status_detalhe: cobranca.statusDetalhe,
      status_interno: cobranca.status,
      liberado: cobranca.status === "pago",
      valor: cobranca.valorCentavos / 100,
    });
  } catch (erro) {
    const e = erro as MercadoPagoErro;
    return NextResponse.json(
      { error: e.message, liberado: false },
      { status: e.http === 404 ? 404 : 502 },
    );
  }
}
