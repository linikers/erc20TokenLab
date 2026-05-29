import { NextResponse } from "next/server";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

export async function GET() {
  const purchasesPath = path.join(process.cwd(), "src/data/purchases.json");
  if (!existsSync(purchasesPath)) {
    return NextResponse.json({ purchases: [], total: 0, revenue: 0 });
  }

  const purchases = JSON.parse(readFileSync(purchasesPath, "utf-8"));
  const approved = purchases.filter((p: any) => p.status === "approved");
  const total = approved.length;
  const revenue = approved.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return NextResponse.json({ purchases: approved, total, revenue });
}

// Allow admin to manually add a purchase
export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const purchasesPath = path.join(process.cwd(), "src/data/purchases.json");
    const purchases = existsSync(purchasesPath)
      ? JSON.parse(readFileSync(purchasesPath, "utf-8"))
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
    writeFileSync(purchasesPath, JSON.stringify(purchases, null, 2));

    return NextResponse.json({ success: true, purchase });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
