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

    // ---- PAGBANK ----
    if (method === "pagbank") {
      const clientId = process.env.PAGBANK_EMAIL;
      const clientSecret = process.env.PAGBANK_TOKEN;
      const isSandbox = process.env.PAGBANK_SANDBOX === "true";
      const baseApi = isSandbox ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";
      const baseWs = isSandbox ? "https://sandbox.ws.pagseguro.uol.com.br" : "https://ws.pagseguro.uol.com.br";
      console.log("[PagBank] Credentials defined:", !!clientId, !!clientSecret, "Sandbox:", isSandbox);

      if (clientId && clientSecret && clientSecret !== "SEU_TOKEN_AQUI") {

        // ---- TENTATIVA 1: OAuth (API nova) ----
        console.log("[PagBank] Tentando OAuth...");
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

        const tokenRes = await fetch(`${baseApi}/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({ grant_type: "client_credentials" }),
        });

        let tokenData;
        try { tokenData = await tokenRes.json(); } catch { tokenData = null; }
        console.log("[PagBank] OAuth status:", tokenRes.status);

        if (tokenData?.access_token) {
          console.log("[PagBank] OAuth funcionou! Criando pedido...");
          const orderRes = await fetch(`${baseApi}/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenData.access_token}`,
            },
            body: JSON.stringify({
              reference_id: `curso_${Date.now()}`,
              customer: { name: name || "Cliente", email },
              items: [{ reference_id: "curso-erc20", name: "Curso: Do Zero ao seu Token ERC20", quantity: 1, unit_amount: 1900 }],
              notification_urls: [`${baseUrl}/api/webhook`],
            }),
          });

          let order;
          try { order = await orderRes.json(); } catch { order = null; }
          console.log("[PagBank] Order status:", orderRes.status);

          if (order?.id) {
            const charge = order.charges?.[0];
            const checkoutUrl = charge?.payment_response?.redirect_url ||
              `https://pagseguro.uol.com.br/checkout/v2/payment/redirect.html?code=${order.id}`;
            return NextResponse.json({ url: checkoutUrl, id: order.id, method: "pagbank_oauth" });
          }
          console.log("[PagBank] Order falhou:", JSON.stringify(order));
        }

        // ---- TENTATIVA 2: Checkout Transparente (API legada XML) ----
        console.log("[PagBank] OAuth falhou, tentando Checkout Transparente XML...");
        const xmlUrl = `${baseWs}/v2/checkout?email=${encodeURIComponent(clientId)}&token=${encodeURIComponent(clientSecret)}`;
        const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<checkout>
  <currency>BRL</currency>
  <items>
    <item>
      <id>curso-erc20</id>
      <description>Curso: Do Zero ao seu Token ERC20</description>
      <amount>19.00</amount>
      <quantity>1</quantity>
    </item>
  </items>
  <reference>curso_${Date.now()}</reference>
  <sender><email>${email}</email><name>${name || "Cliente"}</name></sender>
  <redirectURL>${baseUrl}/course</redirectURL>
  <notificationURL>${baseUrl}/api/webhook</notificationURL>
</checkout>`;

        const xmlRes = await fetch(xmlUrl, {
          method: "POST",
          headers: { "Content-Type": "application/xml;charset=UTF-8" },
          body: xmlBody,
        });

        const xmlText = await xmlRes.text();
        console.log("[PagBank] XML status:", xmlRes.status);

        const codeMatch = xmlText.match(/<code>(.*?)<\/code>/);
        if (codeMatch?.[1]) {
          return NextResponse.json({
            url: `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${codeMatch[1]}`,
            id: codeMatch[1],
            method: "pagbank_xml",
          });
        }

        // Se tudo falhar, loga e retorna erro
        console.log("[PagBank] Ambas tentativas falharam. OAuth:", JSON.stringify(tokenData), "XML:", xmlText.substring(0, 300));
        return NextResponse.json(
          { error: "PagBank nao autorizou. Verifique suas credenciais em dev.pagbank.com.br" },
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
