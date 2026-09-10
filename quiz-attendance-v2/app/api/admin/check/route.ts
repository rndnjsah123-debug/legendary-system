import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const ok = await requireAdmin();
  return NextResponse.json({ authed: ok });
}
