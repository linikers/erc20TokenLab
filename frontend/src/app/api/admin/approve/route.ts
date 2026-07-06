import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const PURCHASES_PATH = path.join(process.cwd(), "src/data/purchases.json");

function getPurchases() {
  if (!existsSync(PURCHASES_PATH)) return [];
  return JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"));
}

function checkAdmin(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  return !!adminPassword && password === adminPassword;
}

export async function POST(request: Request) {
  try {
    const { password, purchase_id, email, action } = await request.json();
    if (!checkAdmin(password)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchases = getPurchases();

    if (action === "approve") {
      // Approve by purchase_id or email
      const idx = purchase_id
        ? purchases.findIndex((p: any) => p.id === purchase_id)
        : purchases.findIndex((p: any) => p.email === email && p.status === "pending");

      if (idx === -1) {
        return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
      }

      purchases[idx].status = "approved";
      purchases[idx].approved_at = new Date().toISOString();
      writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));

      return NextResponse.json({ success: true, purchase: purchases[idx] });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
