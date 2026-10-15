import { NextResponse } from "next/server";
import {
  baseUrl,
  criarPedidoPix,
  pagbankConfigurado,
  PagBankErro,
} from "@/lib/pagbank";
import { PRECO_CENTAVOS, PRODUTO, expiracaoPixMinutos } from "@/lib/produto";

/**
 * Cria a cobrança PIX no PagBank (API de Pedidos) e devolve o QR.
 *
 * Sem `PAGBANK_TOKEN` a rota responde 503 `fallback: "pix_estatico"` — o front
 * cai no PIX de chave estática em vez de estourar erro na cara do comprador.
 */
export async function POST(request: Request) {
  try {
    const { email, name, taxId, ref } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }
    if (!/^\d{11}$|^\d{14}$/.test(String(taxId ?? "").replace(/\D/g, ""))) {
      return NextResponse.json(
        { error: "CPF é obrigatório para gerar a cobrança (exigência do PagBank)" },
        { status: 400 },
      );
    }

    if (!pagbankConfigurado()) {
      return NextResponse.json(
        {
          fallback: "pix_estatico",
          motivo: "PAGBANK_TOKEN não configurado neste ambiente",
          ambiente: baseUrl(),
        },
        { status: 503 },
      );
    }

    const urlPublica =
      process.env.NEXT_PUBLIC_URL?.replace(/\/+$/, "") ||
      "https://ecr20ttk.vercel.app";

    // A referência é o que liga o webhook à nossa compra — sempre única.
    const referencia = `ERC20-${Date.now()}-${String(email).slice(0, 12)}`;

    const pedido = await criarPedidoPix({
      referencia,
      valorCentavos: PRECO_CENTAVOS,
      descricao: PRODUTO,
      cliente: { nome: name || "Cliente", email, taxId },
      notificationUrls: [`${urlPublica}/api/pagbank/webhook`],
      expiracaoMinutos: expiracaoPixMinutos(),
    });

    return NextResponse.json({
      method: "pagbank_pix",
      order_id: pedido.pedidoId,
      charge_id: pedido.chargeId,
      referencia,
      qr_code: pedido.qrCodeTexto,
      qr_png: pedido.qrCodePngUrl,
      amount: pedido.valorCentavos / 100,
      status: pedido.statusBruto ?? "WAITING",
      ref: ref || "",
    });
  } catch (erro) {
    const e = erro as PagBankErro;
    // O ambiente do PagBank NÃO é segredo: deixar isso na resposta evita caçar
    // em log por que "o token não funciona" (sandbox × produção é a causa nº 1).
    const detalhePagBank = (
      e.detalhes as
        | { error_messages?: Array<{ code?: string; description?: string }> }
        | undefined
    )?.error_messages?.[0];

    console.error("[pagbank checkout]", {
      ambiente: baseUrl(),
      http: e.http,
      erro: e.message,
      pagbank: detalhePagBank ?? e.detalhes ?? null,
    });

    return NextResponse.json(
      {
        error: e.message || "Erro ao criar a cobrança no PagBank",
        ambiente: baseUrl(),
        pagbank_code: detalhePagBank?.code,
        pagbank_descricao: detalhePagBank?.description,
      },
      { status: 502 },
    );
  }
}
