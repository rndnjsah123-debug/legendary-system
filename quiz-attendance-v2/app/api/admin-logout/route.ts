import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete("admin_session");
  return NextResponse.json({ ok: true });
}
