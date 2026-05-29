import { NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const purchaseId = searchParams.get("purchase_id");
  const email = searchParams.get("email");

  if (!purchaseId && !email) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const purchasesPath = path.join(process.cwd(), "src/data/purchases.json");
  if (!existsSync(purchasesPath)) {
    return NextResponse.json({ valid: false });
  }

  const purchases = JSON.parse(readFileSync(purchasesPath, "utf-8"));

  const valid = purchases.some((p: any) =>
    (purchaseId && p.id === purchaseId && p.status === "approved") ||
    (email && p.email === email && p.status === "approved")
  );

  return NextResponse.json({ valid, purchases: valid ? purchases.filter((p: any) => p.status === "approved") : [] });
}
