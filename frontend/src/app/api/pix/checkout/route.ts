import { NextResponse } from "next/server";
import { criarPedidoPix, pagbankConfigurado, PagBankErro } from "@/lib/pagbank";
import {
  criarCobrancaPix,
  mercadopagoConfigurado,
  MercadoPagoErro,
} from "@/lib/mercadopago";
import { PRECO_CENTAVOS, PRODUTO, expiracaoPixMinutos } from "@/lib/produto";

/**
 * Orquestrador do Pix automático: tenta os provedores em ordem e só cai no Pix
 * manual (fallback) se nenhum estiver configurado ou todos recusarem.
 *
 * Ordem: **Mercado Pago → PagBank**. O MP vem primeiro porque credencial e
 * liberação são de autoatendimento; o PagBank entra quando a whitelist da API de
 * Pedidos sair (hoje ele responde ACCESS_DENIED). Se um provedor recusa por
 * configuração da conta, o outro ainda salva a venda.
 *
 * A resposta tem o mesmo formato para os dois: `qr_code`, `qr_png`, `amount`,
 * `status`, mais `status_url` (para o front consultar) e `acesso_url`.
 */
export async function POST(request: Request) {
  const { email, name, taxId, ref } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
  }

  const referencia = `ERC20-${Date.now()}-${String(email).slice(0, 12)}`;
  const tentativas: Array<{ provedor: string; erro: string }> = [];

  // ---- 1) Mercado Pago ----
  if (mercadopagoConfigurado()) {
    try {
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
      tentativas.push({ provedor: "mercadopago", erro: e.message });
    }
  } else {
    tentativas.push({ provedor: "mercadopago", erro: "MP_ACCESS_TOKEN não configurado" });
  }

  // ---- 2) PagBank ----
  if (pagbankConfigurado()) {
    try {
      const urlPublica =
        process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ||
        "https://ecr20ttk.vercel.app";

      const pedido = await criarPedidoPix({
        referencia,
        valorCentavos: PRECO_CENTAVOS,
        descricao: PRODUTO,
        cliente: { nome: name || "Cliente", email, taxId },
        notificationUrls: [`${urlPublica}/api/pagbank/webhook`],
        expiracaoMinutos: expiracaoPixMinutos(),
      });

      return NextResponse.json({
        provedor: "pagbank",
        method: "pix_automatico",
        order_id: pedido.pedidoId,
        charge_id: pedido.chargeId,
        referencia,
        qr_code: pedido.qrCodeTexto,
        qr_png: pedido.qrCodePngUrl,
        amount: pedido.valorCentavos / 100,
        status: pedido.statusBruto ?? "WAITING",
        status_url: `/api/pagbank/status?order=${encodeURIComponent(pedido.pedidoId)}`,
        acesso_url: `/course?order=${encodeURIComponent(pedido.pedidoId)}`,
        ref: ref || "",
      });
    } catch (erro) {
      const e = erro as PagBankErro;
      console.error("[pix/checkout] PagBank falhou:", e.message, e.detalhes ?? "");
      tentativas.push({ provedor: "pagbank", erro: e.message });
    }
  } else {
    tentativas.push({ provedor: "pagbank", erro: "PAGBANK_TOKEN não configurado" });
  }

  // ---- 3) Nenhum provedor automático: o front gera o Pix manual ----
  return NextResponse.json(
    {
      fallback: "pix_estatico",
      motivo: "nenhum provedor automático conseguiu criar a cobrança",
      tentativas: tentativas.map((t) => t.provedor),
      detalhes: tentativas,
    },
    { status: 503 },
  );
}
