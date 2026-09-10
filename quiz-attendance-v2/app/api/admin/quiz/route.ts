import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date가 필요합니다." }, { status: 400 });

  const [{ data: quiz }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("quizzes").select("*").eq("quiz_date", date).maybeSingle(),
    supabaseAdmin
      .from("submissions")
      .select("student_id, score, attended, students(name)")
      .eq("quiz_date", date),
  ]);

  return NextResponse.json({
    quiz: quiz
      ? { date: quiz.quiz_date, session: quiz.session, title: quiz.title, questions: quiz.questions }
      : null,
    submissions: (subs || []).map((s: any) => ({
      studentId: s.student_id,
      studentName: s.students?.name || "(삭제된 학생)",
      score: s.score,
      attended: s.attended,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { date, session, title, questions } = body || {};
  if (!date || !session || !Array.isArray(questions)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("quizzes").upsert({
    quiz_date: date,
    session,
    title: title || "오늘의 퀴즈",
    questions,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
