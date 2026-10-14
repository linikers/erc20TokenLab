import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { consultarPedido, PagBankErro, pagbankConfigurado } from "@/lib/pagbank";

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
  const order = searchParams.get("order");

  if (!purchaseId && !email && !order) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  // Pagamento via PagBank: o próprio PagBank diz se o pedido está pago.
  if (order) {
    if (!pagbankConfigurado()) {
      return NextResponse.json({ valid: false, motivo: "pagbank_nao_configurado" });
    }
    try {
      const pedido = await consultarPedido(order);
      return NextResponse.json({
        valid: pedido.status === "pago",
        order_id: pedido.pedidoId,
        status: pedido.statusBruto,
      });
    } catch (erro) {
      const e = erro as PagBankErro;
      console.error("[verify-access] PagBank:", e?.message ?? erro);
      return NextResponse.json({ valid: false, motivo: "erro_pagbank" });
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
