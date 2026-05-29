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
      const emailCred = process.env.PAGBANK_EMAIL;
      const token = process.env.PAGBANK_TOKEN;
      if (emailCred && token && token !== "SEU_TOKEN_AQUI") {
        // PagBank Checkout Transparente - API via query params
        const checkoutUrl = `https://ws.pagseguro.uol.com.br/v2/checkout?email=${encodeURIComponent(emailCred)}&token=${encodeURIComponent(token)}`;

        const checkoutBody = `<?xml version="1.0" encoding="UTF-8"?>
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
  <sender>
    <email>${email}</email>
    <name>${name || "Cliente"}</name>
  </sender>
  <redirectURL>${baseUrl}/course</redirectURL>
  <notificationURL>${baseUrl}/api/webhook</notificationURL>
  <maxUses>1</maxUses>
</checkout>`;

        const response = await fetch(checkoutUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/xml;charset=UTF-8",
          },
          body: checkoutBody,
        });

        const text = await response.text();

        // Parse the response XML for the checkout code
        const codeMatch = text.match(/<code>(.*?)<\/code>/);
        if (codeMatch && codeMatch[1]) {
          return NextResponse.json({
            url: `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${codeMatch[1]}`,
            id: codeMatch[1],
            method: "pagbank",
          });
        }

        // Try JSON error parsing
        try {
          const json = JSON.parse(text);
          return NextResponse.json(
            { error: "Erro no PagBank: " + JSON.stringify(json) },
            { status: 500 },
          );
        } catch {
          return NextResponse.json(
            { error: "Erro no PagBank: " + text.substring(0, 300) },
            { status: 500 },
          );
        }
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
