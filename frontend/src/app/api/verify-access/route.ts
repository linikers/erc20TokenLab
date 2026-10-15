import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";
import {
  consultarPedido as consultarPedidoMP,
  mercadopagoConfigurado,
} from "@/lib/mercadopago";

/** Linha do `purchases.json` (compras aprovadas pelo admin). */
interface CompraLocal {
  id?: string;
  email?: string;
  status?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const purchaseId = searchParams.get("purchase_id");
  const email = searchParams.get("email");
  const mp = searchParams.get("mp");

  if (!purchaseId && !email && !mp) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  // Pix automático (Mercado Pago): a própria API diz se a ordem está paga.
  if (mp) {
    if (!mercadopagoConfigurado()) {
      return NextResponse.json({ valid: false, motivo: "mercadopago_nao_configurado" });
    }
    try {
      const cobranca = await consultarPedidoMP(mp);
      return NextResponse.json({
        valid: cobranca.status === "pago",
        order_id: cobranca.pedidoId,
        status: cobranca.statusBruto,
      });
    } catch (erro) {
      console.error("[verify-access] Mercado Pago:", erro);
      return NextResponse.json({ valid: false, motivo: "erro_mercadopago" });
    }
  }

  const purchasesPath = path.join(process.cwd(), "src/data/purchases.json");
  if (!existsSync(purchasesPath)) {
    return NextResponse.json({ valid: false });
  }

  const purchases = JSON.parse(
    readFileSync(purchasesPath, "utf-8"),
  ) as Array<CompraLocal>;

  const valid = purchases.some(
    (p) =>
      (purchaseId && p.id === purchaseId && p.status === "approved") ||
      (email && p.email === email && p.status === "approved"),
  );

  return NextResponse.json({
    valid,
    purchases: valid ? purchases.filter((p) => p.status === "approved") : [],
  });
}
