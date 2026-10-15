import { NextResponse } from "next/server";
import {
  criarCobrancaPix,
  mercadopagoConfigurado,
  MercadoPagoErro,
  mpBaseUrl,
} from "@/lib/mercadopago";
import { PRECO_CENTAVOS, PRODUTO } from "@/lib/produto";

/**
 * Cria a cobrança Pix no Mercado Pago (Orders API) e devolve o QR.
 *
 * Sem `MP_ACCESS_TOKEN` a rota responde 503 `fallback: "pix_estatico"` — o front
 * cai no Pix manual em vez de estourar erro na cara do comprador.
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
          ambiente: mpBaseUrl(),
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

    if (cobranca.teste) {
      console.error(
        "[mercadopago checkout] MP respondeu live_mode=false: a credencial é de TESTE.",
      );
      return NextResponse.json(
        {
          fallback: "pix_estatico",
          motivo:
            "credencial de teste do Mercado Pago: a cobrança não é pagável (MP_ACCESS_TOKEN precisa ser o de produção)",
        },
        { status: 503 },
      );
    }

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
    console.error("[mercadopago checkout]", {
      ambiente: mpBaseUrl(),
      http: e.http,
      erro: e.message,
      mp: e.detalhes ?? null,
    });
    return NextResponse.json(
      { error: e.message || "Erro ao criar a cobrança no Mercado Pago", ambiente: mpBaseUrl() },
      { status: 502 },
    );
  }
}
