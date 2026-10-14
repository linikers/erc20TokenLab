import { NextResponse } from "next/server";
import { writeFileSync, existsSync, readFileSync } from "fs";
import path from "path";
import { PRECO_CENTAVOS, PRODUTO } from "@/lib/produto";
import { gerarPixEstatico } from "@/lib/pix";

const PURCHASES_PATH = path.join(process.cwd(), "src/data/purchases.json");

// Pix key
const PIX_KEY = "010d0101-9109-4cd1-bf05-cad25bebd1d2";
const PIX_MERCHANT = "CURSO ERC20";
const PIX_CITY = "SAO PAULO";

const PRECO = PRECO_CENTAVOS / 100;

function savePurchase(data: {
  id: string;
  email: string;
  name: string;
  amount: number;
  method: string;
  ref?: string;
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
    referred_by: data.ref || "",
    created_at: new Date().toISOString(),
  });
  writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));
}

/**
 * Checkout dos meios locais: Pix manual (chave estatica), Bitcoin/Lightning e demo.
 *
 * A cobranca no PagBank nao mora mais aqui: ela e feita em /api/pagbank/checkout
 * (API de Pedidos, com QR real e liberacao automatica). Este arquivo segue como
 * fallback quando o PagBank nao esta configurado.
 */
export async function POST(request: Request) {
  try {
    const { email, name, method = "pix", ref } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";


    // ---- BIPA ----
    if (method === "bipa") {
      const apiKey = process.env.BIPA_API_KEY;
      if (apiKey && apiKey !== "SUA_CHAVE_BIPA") {
        const invoice = {
          amount: PRECO,
          currency: "BRL",
          description: PRODUTO,
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

      // Tenta salvar localmente
      try {
        const purchases = existsSync(PURCHASES_PATH)
          ? JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"))
          : [];
        purchases.push({
          id: purchaseId,
          email,
          name: name || "",
          product: "curso-erc20",
          amount: PRECO,
          currency: "BRL",
          status: "pending",
          payment_method: "btc",
          btc_address: btcAddress,
          referred_by: ref || "",
          created_at: new Date().toISOString(),
        });
        writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));
      } catch (e) {
        console.warn("[BTC] Nao foi possivel salvar:", e);
      }

      return NextResponse.json({
        id: purchaseId,
        method: "bipa",
        btc_address: btcAddress,
        lightning_invoice: lightningInvoice,
        bip21_uri: bip21Uri,
        btc_amount_brl: PRECO,
        status: "pending",
        instructions: "Pague via Lightning (rápido) ou on-chain. Acesso sera liberado em breve.",
      });
    }

    // ---- PIX ----
    if (method === "pix") {
      const purchaseId = `pix_${Date.now()}`;
      const pixPayload = gerarPixEstatico({
        chave: PIX_KEY,
        nome: PIX_MERCHANT,
        cidade: PIX_CITY,
        valorReais: PRECO,
        txid: purchaseId,
      });

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
          amount: PRECO,
          currency: "BRL",
          status: "pending",
          payment_method: "pix",
          pix_key: PIX_KEY,
          referred_by: ref || "",
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
        pix_amount: PRECO,
        pix_copy: pixPayload,
        status: "pending",
        instructions: "Pague o PIX acima e em breve o acesso sera liberado.",
      });
    }

    // ---- DEMO MODE ----
    const purchaseId = `demo_${Date.now()}`;
    savePurchase({
      id: purchaseId,
      email,
      name: name || "",
      amount: PRECO,
      method: "demo",
      ref,
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
