import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/requireAdmin";

const TOTAL_SESSIONS = 8;

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: students }, { data: quizzes }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("students").select("*").eq("active", true).order("name"),
    supabaseAdmin.from("quizzes").select("quiz_date, session").order("quiz_date"),
    supabaseAdmin.from("submissions").select("quiz_date, student_id, attended"),
  ]);

  const sessionDates: string[][] = Array.from({ length: TOTAL_SESSIONS }, () => []);
  (quizzes || []).forEach((q: any) => {
    const idx = q.session >= 1 && q.session <= TOTAL_SESSIONS ? q.session - 1 : null;
    if (idx !== null) sessionDates[idx].push(q.quiz_date);
  });
  sessionDates.forEach((ds) => ds.sort());

  const attendedSet = new Set(
    (subs || [])
      .filter((s: any) => s.attended)
      .map((s: any) => `${s.quiz_date}|${s.student_id}`)
  );

  const rows = (students || []).map((st: any) => {
    const attended = sessionDates.map((dates) => dates.some((d) => attendedSet.has(`${d}|${st.id}`)));
    return { studentId: st.id, name: st.name, attended, count: attended.filter(Boolean).length };
  });

  return NextResponse.json({ sessionDates, rows, totalSessions: TOTAL_SESSIONS });
}
