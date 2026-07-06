import { NextResponse } from "next/server";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";
import crypto from "crypto";

const PURCHASES_PATH = path.join(process.cwd(), "src/data/purchases.json");

// Pix key
const PIX_KEY = "010d0101-9109-4cd1-bf05-cad25bebd1d2";
const PIX_MERCHANT = "CURSO ERC20";
const PIX_CITY = "SAO PAULO";

function crc16(payload: string): string {
  const poly = 0x1021;
  let reg = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    let byte = payload.charCodeAt(i);
    reg ^= byte << 8;
    for (let j = 0; j < 8; j++) {
      if (reg & 0x8000) reg = (reg << 1) ^ poly;
      else reg <<= 1;
      reg &= 0xffff;
    }
  }
  return reg.toString(16).toUpperCase().padStart(4, "0");
}

function addField(id: number, value: string): string {
  const size = String(value.length).padStart(2, "0");
  return `${String(id).padStart(2, "0")}${size}${value}`;
}

function generatePixPayload(amount: number, txid: string): string {
  const gui = addField(0, "BR.GOV.BCB.PIX");
  const key = addField(1, PIX_KEY);
  const merchant = addField(4, PIX_MERCHANT.slice(0, 25));
  const city = addField(5, PIX_CITY.slice(0, 15));
  const value = addField(6, amount.toFixed(2));
  const txidField = addField(62, txid.slice(0, 25));
  const merchantAccount = `${gui}${key}`;
  const mai = addField(26, merchantAccount);
  const withoutCRC = `000201${mai}${merchant}${value}${city}${txidField}6304`;
  return `${withoutCRC}${crc16(withoutCRC)}`;
}

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
      const apiEmail = process.env.PAGBANK_EMAIL;
      const apiToken = process.env.PAGBANK_TOKEN;
      const isSandbox = process.env.PAGBANK_SANDBOX === "true";
      const baseApi = isSandbox ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com";
      const baseWs = isSandbox ? "https://ws.sandbox.pagseguro.uol.com.br" : "https://ws.pagseguro.uol.com.br";
      console.log("[PagBank] Credentials defined:", !!apiEmail, !!apiToken, "Sandbox:", isSandbox);

      if (apiEmail && apiToken && apiToken !== "SEU_TOKEN_AQUI") {

        // Helper to create order with a given access token
        const createOrder = async (accessToken: string) => {
          const orderRes = await fetch(`${baseApi}/orders`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
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
            return { url: checkoutUrl, id: order.id };
          }
          console.log("[PagBank] Order response:", JSON.stringify(order));
          return null;
        };

        // ---- TENTATIVA 1: Token direto como Bearer (pode ser que o token do portal já seja o access_token) ----
        console.log("[PagBank] Tentando token direto como Bearer...");
        let result = await createOrder(apiToken);
        if (result) {
          return NextResponse.json({ ...result, method: "pagbank_bearer" });
        }

        // ---- TENTATIVA 2: OAuth client_credentials (Basic Auth + form-urlencoded) ----
        console.log("[PagBank] Tentando OAuth form-urlencoded...");
        const auth = Buffer.from(`${apiEmail}:${apiToken}`).toString("base64");
        let tokenRes = await fetch(`${baseApi}/oauth2/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${auth}`,
          },
          body: "grant_type=client_credentials",
        });
        let tokenData;
        try { tokenData = await tokenRes.json(); } catch { tokenData = null; }
        console.log("[PagBank] OAuth form status:", tokenRes.status, JSON.stringify(tokenData));

        if (tokenData?.access_token) {
          result = await createOrder(tokenData.access_token);
          if (result) return NextResponse.json({ ...result, method: "pagbank_oauth" });
        }

        // ---- TENTATIVA 3: OAuth JSON (credenciais no body) ----
        console.log("[PagBank] Tentando OAuth JSON...");
        tokenRes = await fetch(`${baseApi}/oauth2/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: apiEmail,
            client_secret: apiToken,
          }),
        });
        try { tokenData = await tokenRes.json(); } catch { tokenData = null; }
        console.log("[PagBank] OAuth JSON status:", tokenRes.status, JSON.stringify(tokenData));

        if (tokenData?.access_token) {
          result = await createOrder(tokenData.access_token);
          if (result) return NextResponse.json({ ...result, method: "pagbank_oauth_json" });
        }

        // ---- TENTATIVA 4: Checkout Transparente XML ----
        console.log("[PagBank] Tentando XML...");
        const xmlUrl = `${baseWs}/v2/checkout?email=${encodeURIComponent(apiEmail)}&token=${encodeURIComponent(apiToken)}`;
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
        console.log("[PagBank] XML status:", xmlRes.status, xmlText.substring(0, 200));
        const codeMatch = xmlText.match(/<code>(.*?)<\/code>/);
        if (codeMatch?.[1]) {
          return NextResponse.json({
            url: `https://pagseguro.uol.com.br/v2/checkout/payment.html?code=${codeMatch[1]}`,
            id: codeMatch[1],
            method: "pagbank_xml",
          });
        }

        // Tudo falhou
        console.log("[PagBank] TODAS as tentativas falharam");
        return NextResponse.json(
          { error: "PagBank nao autorizou. Suas credenciais do dev.pagbank podem ser apenas para consulta, não para criar vendas. Precisa de credenciais de Checkout Transparente." },
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

    // ---- BITCOIN / LIGHTNING (estático) ----
    if (method === "bipa") {
      const purchaseId = `btc_${Date.now()}`;
      const btcAddress = "bc1q0em9vfr2x3t9765cchdfr04s2ztcy6lkk435z0";
      const lightningInvoice = "lnbc1p4yh2aepp5ua82h6cqnavh5l2wtv96ueq43dqlhr5lcd7dyl25mszhp9gy8juqdqqcqzzsxqrrsssp50y2xzsfr20mqpqnzutltaxum3y6y4pmwwlm47ye2uc0fngcmjpxs9qxpqysgqy936llmgsvga2xgqnhfg4e99e5aqzcrdqrw9xyf6er5027mv9zcqvmttwprgskn0r6n6kt6xjeujtj5cjyl2me28lazugew0r7rhmcgqc99snq";
      const bip21Uri = `bitcoin:${btcAddress}?amount=0&lightning=${lightningInvoice}`;

      return NextResponse.json({
        id: purchaseId,
        method: "bipa",
        btc_address: btcAddress,
        lightning_invoice: lightningInvoice,
        bip21_uri: bip21Uri,
        btc_amount_brl: 19.0,
        status: "pending",
        instructions: "Pague via Lightning (rápido, taxa baixa) ou Bitcoin on-chain. Envie o comprovante para confirmar.",
      });
    }

    // ---- PIX ----
    if (method === "pix") {
      const purchaseId = `pix_${Date.now()}`;
      const pixPayload = generatePixPayload(19.0, purchaseId);

      // Tenta salvar localmente, mas nao trava se falhar (Vercel = read-only fs)
      try {
        const purchases = existsSync(PURCHASES_PATH)
          ? JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"))
          : [];
        purchases.push({
          id: purchaseId,
          email,
          name: name || "",
          product: "curso-erc20",
          amount: 19.0,
          currency: "BRL",
          status: "pending",
          payment_method: "pix",
          pix_key: PIX_KEY,
          created_at: new Date().toISOString(),
        });
        writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));
      } catch (e) {
        console.warn("[Pix] Nao foi possivel salvar purchase localmente (Vercel?):", e);
      }

      return NextResponse.json({
        id: purchaseId,
        method: "pix",
        pix_key: PIX_KEY,
        pix_payload: pixPayload,
        pix_amount: 19.0,
        pix_copy: pixPayload,
        status: "pending",
        instructions: "Pague o PIX acima e envie o comprovante. Após confirmacao, voce recebera acesso ao curso.",
      });
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
