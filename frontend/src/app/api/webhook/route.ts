import { NextResponse } from "next/server";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Only process payment notifications
    if (type !== "payment" && type !== "mercadopago") {
      return NextResponse.json({ received: true });
    }

    // Fetch payment details from Mercado Pago
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "MP not configured" }, { status: 200 });
    }

    let paymentId = data?.id;
    if (!paymentId && body?.action) {
      paymentId = body.action.split("/").pop();
    }

    if (paymentId) {
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const payment = await response.json();

      if (payment.status === "approved") {
        const purchasesPath = path.join(process.cwd(), "src/data/purchases.json");
        const purchases = existsSync(purchasesPath)
          ? JSON.parse(readFileSync(purchasesPath, "utf-8"))
          : [];

        purchases.push({
          id: payment.id.toString(),
          email: payment.payer?.email || "",
          name: payment.payer?.first_name || "",
          product: "curso-erc20",
          amount: payment.transaction_amount,
          currency: "BRL",
          status: "approved",
          payment_method: payment.payment_method_id,
          created_at: payment.date_created,
        });

        writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
