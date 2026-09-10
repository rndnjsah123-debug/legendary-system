import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { date, studentId } = (await req.json().catch(() => ({}))) || {};
  if (!date || !studentId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("submissions")
    .delete()
    .eq("quiz_date", date)
    .eq("student_id", studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
