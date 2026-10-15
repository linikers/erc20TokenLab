import { NextResponse } from "next/server";
import {
  criarCobrancaPix,
  mercadopagoConfigurado,
  MercadoPagoErro,
} from "@/lib/mercadopago";
import { PRECO_CENTAVOS, PRODUTO } from "@/lib/produto";

/**
 * Pix automático pelo **Mercado Pago** (Orders API).
 *
 * Se o Mercado Pago não estiver configurado ou recusar a cobrança, a resposta é
 * 503 `fallback: "pix_estatico"` — o front gera o **Pix manual** (chave estática)
 * em vez de deixar o comprador sem meio de pagamento.
 *
 * O PagBank saiu deste fluxo (a conta segue sem a API de Pedidos liberada:
 * 403 ACCESS_DENIED / whitelist). O cliente dele fica no histórico do git
 * (PRs #15–#17) caso a whitelist saia um dia; as rotas `/api/pagbank/*` foram
 * removidas junto.
 */
export async function POST(request: Request) {
  try {
    const { email, name, taxId, ref } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    if (!mercadopagoConfigurado()) {
      return NextResponse.json(
        {
          fallback: "pix_estatico",
          motivo: "MP_ACCESS_TOKEN não configurado neste ambiente",
        },
        { status: 503 },
      );
    }

    const referencia = `ERC20-${Date.now()}-${String(email).slice(0, 12)}`;

    const cobranca = await criarCobrancaPix({
      referencia,
      valorCentavos: PRECO_CENTAVOS,
      descricao: PRODUTO,
      cliente: { nome: name || "Cliente", email, taxId },
    });

    return NextResponse.json({
      provedor: "mercadopago",
      method: "pix_automatico",
      order_id: cobranca.pedidoId,
      payment_id: cobranca.pagamentoId,
      referencia,
      qr_code: cobranca.qrCodeTexto,
      qr_png: cobranca.qrCodeImagem,
      link_pagamento: cobranca.linkPagamento,
      amount: cobranca.valorCentavos / 100,
      status: cobranca.statusBruto ?? "action_required",
      status_url: `/api/mercadopago/status?order=${encodeURIComponent(cobranca.pedidoId)}`,
      acesso_url: `/course?mp=${encodeURIComponent(cobranca.pedidoId)}`,
      ref: ref || "",
    });
  } catch (erro) {
    const e = erro as MercadoPagoErro;
    console.error("[pix/checkout] Mercado Pago falhou:", e.message, e.detalhes ?? "");
    // 503 = o front cai no Pix manual: a venda acontece, só não é automática.
    return NextResponse.json(
      { fallback: "pix_estatico", motivo: e.message || "Mercado Pago indisponível" },
      { status: 503 },
    );
  }
}
