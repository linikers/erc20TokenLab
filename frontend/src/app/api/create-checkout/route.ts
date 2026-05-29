import { NextResponse } from "next/server";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";

const PURCHASES_PATH = path.join(process.cwd(), "src/data/purchases.json");

function savePurchase(data: {
  id: string;
  email: string;
  name: string;
  amount: number;
  method: string;
}) {
  const purchases = existsSync(PURCHASES_PATH)
    ? JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"))
    : [];
  purchases.push({
    id: data.id,
    email: data.email,
    name: data.name || "",
    product: "curso-erc20",
    amount: data.amount,
    currency: "BRL",
    status: "approved",
    payment_method: data.method,
    created_at: new Date().toISOString(),
  });
  writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));
}

export async function POST(request: Request) {
  try {
    const { email, name, method = "pagbank" } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    // ---- PAGBANK (API OAuth) ----
    if (method === "pagbank") {
      const clientId = process.env.PAGBANK_EMAIL;
      const clientSecret = process.env.PAGBANK_TOKEN;
      console.log("[PagBank] Client ID defined:", !!clientId);
      console.log("[PagBank] Client Secret defined:", !!clientSecret);

      if (clientId && clientSecret && clientSecret !== "SEU_TOKEN_AQUI") {
        // 1. Get OAuth token
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        console.log("[PagBank] Solicitando OAuth token...");

        const tokenRes = await fetch("https://api.pagseguro.com/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
          body: "grant_type=client_credentials",
        });

        console.log("[PagBank] OAuth status:", tokenRes.status);
        const tokenData = await tokenRes.json();
        console.log("[PagBank] OAuth response:", JSON.stringify(tokenData, null, 2));

        const accessToken = tokenData.access_token;

        if (!accessToken) {
          console.log("[PagBank] ERRO: access_token nao recebido");
          return NextResponse.json(
            { error: "Erro no PagBank OAuth: " + JSON.stringify(tokenData) },
            { status: 500 },
          );
        }

        console.log("[PagBank] OAuth token obtido com sucesso");

        // 2. Create order
        console.log("[PagBank] Criando pedido...");
        const orderPayload = {
          reference_id: `curso_${Date.now()}`,
          customer: { name: name || "Cliente", email },
          items: [
            {
              reference_id: "curso-erc20",
              name: "Curso: Do Zero ao seu Token ERC20",
              quantity: 1,
              unit_amount: 1900,
            },
          ],
          notification_urls: [`${baseUrl}/api/webhook`],
        };
        console.log("[PagBank] Order payload:", JSON.stringify(orderPayload, null, 2));

        const orderRes = await fetch("https://api.pagseguro.com/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(orderPayload),
        });

        console.log("[PagBank] Order status:", orderRes.status);
        const order = await orderRes.json();
        console.log("[PagBank] Order response:", JSON.stringify(order, null, 2));

        if (order.id) {
          // Get the checkout URL from the charge's payment response
          const charge = order.charges?.[0];
          const checkoutUrl =
            charge?.checkout_url ||
            charge?.payment_response?.redirect_url ||
            `https://pagseguro.uol.com.br/checkout/v2/payment/redirect.html?code=${order.id}`;

          return NextResponse.json({
            url: checkoutUrl,
            id: order.id,
            method: "pagbank",
          });
        }

        return NextResponse.json(
          { error: "Erro no PagBank: " + JSON.stringify(order) },
          { status: 500 },
        );
      }

      // PagBank sem credenciais cai no demo
    }

    // ---- BIPA ----
    if (method === "bipa") {
      const apiKey = process.env.BIPA_API_KEY;
      if (apiKey && apiKey !== "SUA_CHAVE_BIPA") {
        const invoice = {
          amount: 19.0,
          currency: "BRL",
          description: "Curso: Do Zero ao seu Token ERC20",
          callback_url: `${baseUrl}/api/webhook?method=bipa`,
          external_id: email,
        };

        const response = await fetch("https://api.bipa.app/v1/invoices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
          },
          body: JSON.stringify(invoice),
        });

        const data = await response.json();

        if (data.id || data.lightning_invoice) {
          return NextResponse.json({
            lightning_invoice: data.lightning_invoice,
            id: data.id,
            method: "bipa",
          });
        }

        return NextResponse.json(
          { error: "Erro na Bipa: " + JSON.stringify(data) },
          { status: 500 },
        );
      }

      // Bipa sem chave cai no demo
    }

    // ---- DEMO MODE ----
    const purchaseId = `demo_${Date.now()}`;
    savePurchase({
      id: purchaseId,
      email,
      name: name || "",
      amount: 19.0,
      method: "demo",
    });

    return NextResponse.json({
      url: `/course?purchase_id=${purchaseId}`,
      id: purchaseId,
      method: "demo",
      demo: true,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
