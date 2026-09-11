import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

function isShortQ(q: any, idx: number) {
  return q.type === "short" || idx === 4;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: submissions }, { data: quizzes }, { data: students }] = await Promise.all([
    supabaseAdmin
      .from("submissions")
      .select("quiz_date, student_id, score, attended, answers, submitted_at")
      .order("quiz_date"),
    supabaseAdmin.from("quizzes").select("quiz_date, session, title, questions"),
    supabaseAdmin.from("students").select("id, name"),
  ]);

  const quizByDate: Record<string, any> = {};
  (quizzes || []).forEach((q: any) => (quizByDate[q.quiz_date] = q));
  const studentById: Record<string, string> = {};
  (students || []).forEach((s: any) => (studentById[s.id] = s.name));

  const rows: any[] = [];
  (submissions || []).forEach((sub: any) => {
    const quiz = quizByDate[sub.quiz_date];
    if (!quiz) return;
    const studentName = studentById[sub.student_id] || "(삭제된 학생)";
    const questions: any[] = quiz.questions || [];
    const answers = sub.answers || {};

    questions.forEach((q: any, idx: number) => {
      const short = isShortQ(q, idx);
      const raw = answers[q.id];
      let studentAnswerText = "";
      let correctAnswerText = "";
      let isCorrect: boolean | null = null;

      if (short) {
        studentAnswerText = raw ? String(raw) : "(제출 기록 없음)";
        correctAnswerText = q.answer ? String(q.answer) : "";
        isCorrect = true; // 주관식은 항상 정답 처리
      } else {
        const optText: Record<string, string> = {
          A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD,
        };
        studentAnswerText = raw ? `${raw}. ${optText[raw] || ""}` : "(제출 기록 없음)";
        correctAnswerText = q.correct ? `${q.correct}. ${optText[q.correct] || ""}` : "";
        isCorrect = raw ? raw === q.correct : null;
      }

      rows.push({
        quizDate: sub.quiz_date,
        session: quiz.session,
        quizTitle: quiz.title,
        studentName,
        questionNo: idx + 1,
        questionType: short ? "주관식" : "객관식",
        questionText: q.question || "",
        studentAnswer: studentAnswerText,
        correctAnswer: correctAnswerText,
        isCorrect,
        score: sub.score,
        attended: sub.attended,
        submittedAt: sub.submitted_at,
      });
    });
  });

  rows.sort((a, b) => (a.quizDate === b.quizDate ? a.studentName.localeCompare(b.studentName) : a.quizDate.localeCompare(b.quizDate)));

  return NextResponse.json({ rows });
}
