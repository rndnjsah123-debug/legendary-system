import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// 매 요청마다 최신 퀴즈를 조회하도록 캐싱을 끕니다.
// (이게 없으면 배포 후 첫 응답이 그대로 캐시되어 새 퀴즈를 등록해도 반영되지 않습니다.)
export const dynamic = "force-dynamic";

function todayKST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const m: Record<string, string> = {};
  parts.forEach((p) => (m[p.type] = p.value));
  return `${m.year}-${m.month}-${m.day}`;
}

// 정답(correct)과 모범답안(answer)은 학생 화면으로 절대 내려보내지 않는다.
function stripAnswers(q: any) {
  const { correct, answer, ...rest } = q || {};
  return rest;
}

export async function GET() {
  const date = todayKST();

  const [{ data: quiz, error: quizErr }, { data: students, error: studentsErr }] = await Promise.all([
    supabaseAdmin.from("quizzes").select("*").eq("quiz_date", date).maybeSingle(),
    supabaseAdmin.from("students").select("id,name").eq("active", true).order("name"),
  ]);

  if (quizErr || studentsErr) {
    return NextResponse.json({ error: "데이터를 불러오지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    date,
    students: students || [],
    quiz: quiz
      ? {
          date: quiz.quiz_date,
          session: quiz.session,
          title: quiz.title,
          questions: (quiz.questions || []).map(stripAnswers),
        }
      : null,
  });
}
