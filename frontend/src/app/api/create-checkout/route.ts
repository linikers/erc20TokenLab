import { NextResponse } from "next/server";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    // Check if Mercado Pago credentials are configured
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (accessToken && accessToken !== "TEST-...") {
      // Real Mercado Pago integration
      const preference = {
        items: [
          {
            title: "Curso: Do Zero ao seu Token ERC20",
            quantity: 1,
            currency_id: "BRL",
            unit_price: 19.0,
          },
        ],
        payer: { email, name: name || "" },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/course?purchase_id=`,
          failure: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/?payment=failed`,
        },
        auto_return: "approved",
        notification_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/webhook`,
        external_reference: email,
      };

      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preference),
      });

      const data = await response.json();
      
      if (data.init_point) {
        return NextResponse.json({ url: data.init_point, id: data.id });
      }
      
      return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
    }

    // DEMO MODE - Simulate purchase for testing
    const purchaseId = "demo_" + Date.now();
    const purchasesPath = path.join(process.cwd(), "src/data/purchases.json");
    const purchases = existsSync(purchasesPath)
      ? JSON.parse(readFileSync(purchasesPath, "utf-8"))
      : [];

    purchases.push({
      id: purchaseId,
      email,
      name: name || "",
      product: "curso-erc20",
      amount: 19.0,
      currency: "BRL",
      status: "approved",
      payment_method: "demo",
      created_at: new Date().toISOString(),
    });

    writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2));

    return NextResponse.json({
      url: `/course?purchase_id=${purchaseId}`,
      id: purchaseId,
      demo: true,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
