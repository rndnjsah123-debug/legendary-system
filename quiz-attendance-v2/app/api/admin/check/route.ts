import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/requireAdmin";

export async function GET() {
  const ok = await requireAdmin();
  return NextResponse.json({ authed: ok });
}
