import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const MIN_MC_CORRECT = 2;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { date, studentId, answers } = body || {};
  if (!date || !studentId || !answers || typeof answers !== "object") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { data: quiz, error: quizErr } = await supabaseAdmin
    .from("quizzes")
    .select("*")
    .eq("quiz_date", date)
    .maybeSingle();
  if (quizErr || !quiz) {
    return NextResponse.json({ error: "오늘 등록된 퀴즈가 없습니다." }, { status: 404 });
  }

  // 이미 제출했는지 확인
  const { data: existing } = await supabaseAdmin
    .from("submissions")
    .select("attended")
    .eq("quiz_date", date)
    .eq("student_id", studentId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ alreadyDone: true, attended: existing.attended });
  }

  const questions: any[] = quiz.questions || [];

  // 모든 문제에 답했는지 서버에서도 확인 (클라이언트 우회 방지)
  const allAnswered = questions.every((q, idx) => {
    const isShort = q.type === "short" || idx === 4;
    const v = answers[q.id];
    return isShort ? typeof v === "string" && v.trim() !== "" : !!v;
  });
  if (!allAnswered) {
    return NextResponse.json({ error: "모든 문제에 답해주세요." }, { status: 400 });
  }

  let score = 0;
  let mcCorrect = 0;
  questions.forEach((q, idx) => {
    const isShort = q.type === "short" || idx === 4;
    if (isShort) {
      score += 1; // 주관식은 무조건 정답 처리
    } else if (answers[q.id] === q.correct) {
      score += 1;
      mcCorrect += 1;
    }
  });
  const attended = mcCorrect >= MIN_MC_CORRECT;

  const { error: insertErr } = await supabaseAdmin.from("submissions").insert({
    quiz_date: date,
    student_id: studentId,
    score,
    attended,
  });
  if (insertErr) {
    return NextResponse.json({ error: "저장 중 문제가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ alreadyDone: false, attended });
}
