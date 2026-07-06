import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const PURCHASES_PATH = path.join(process.cwd(), "src/data/purchases.json");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminPassword = searchParams.get("password");

  const purchases = existsSync(PURCHASES_PATH)
    ? JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"))
    : [];

  const adminPass = process.env.ADMIN_PASSWORD;

  // Admin view: return all purchases
  if (adminPassword && adminPass && adminPassword === adminPass) {
    const total = purchases.filter((p: any) => p.status === "approved").length;
    const revenue = purchases
      .filter((p: any) => p.status === "approved")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    return NextResponse.json({ purchases, total, revenue });
  }

  // Public view: only approved
  const approved = purchases.filter((p: any) => p.status === "approved");
  const total = approved.length;
  const revenue = approved.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  return NextResponse.json({ purchases: approved, total, revenue });
}

// Manual add (admin only)
export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();
    const adminPass = process.env.ADMIN_PASSWORD;
    if (!adminPass || password !== adminPass) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const purchases = existsSync(PURCHASES_PATH)
      ? JSON.parse(readFileSync(PURCHASES_PATH, "utf-8"))
      : [];

    const purchase = {
      id: "manual_" + Date.now(),
      email,
      name: name || "",
      product: "curso-erc20",
      amount: 19.0,
      currency: "BRL",
      status: "approved",
      payment_method: "manual",
      created_at: new Date().toISOString(),
    };

    purchases.push(purchase);
    writeFileSync(PURCHASES_PATH, JSON.stringify(purchases, null, 2));

    return NextResponse.json({ success: true, purchase });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
