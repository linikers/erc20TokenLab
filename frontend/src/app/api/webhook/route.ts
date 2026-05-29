import { NextResponse } from "next/server";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";

const PURCHASES_PATH = path.join(process.cwd(), "src/data/purchases.json");

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const method = url.searchParams.get("method") || "pagbank";
    const body = await request.json();

    let email = "";
    let paymentId = "";
    let amount = 19.0;

    // ---- PAGBANK Webhook ----
    if (method === "pagbank") {
      // PagBank sends: { id, reference_id, status, charges: [...] }
      const charge = body.charges?.[0];
      if (charge?.status === "PAID" || charge?.status === "AUTHORIZED") {
        email = body.customer?.email || charge?.email || "";
        paymentId = body.id || charge?.id || "";
        amount = (body.amount?.value || 1900) / 100;
      }
    }

    // ---- BIPA Webhook ----
    if (method === "bipa") {
      // Bipa sends: { id, status, external_id, amount }
      if (body.status === "completed" || body.status === "paid") {
        email = body.external_id || "";
        paymentId = body.id || "";
        amount = body.amount || 19.0;
      }
    }

    if (email && paymentId) {
      const purchases = existsSync(PURCHASES_PATH)
        ? JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"))
        : [];

      // Avoid duplicates
      const exists = purchases.some((p: any) => p.id === paymentId);
      if (!exists) {
        purchases.push({
          id: paymentId,
          email,
          name: body.customer?.name || "",
          product: "curso-erc20",
          amount,
          currency: "BRL",
          status: "approved",
          payment_method: method,
          created_at: new Date().toISOString(),
        });
        writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
