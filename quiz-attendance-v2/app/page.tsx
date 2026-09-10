"use client";
import { useEffect, useState } from "react";

type Question = {
  id: string;
  no: number;
  type: "mc" | "short";
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
};
type Quiz = { date: string; session: number; title: string; questions: Question[] };
type Student = { id: string; name: string };

const MIN_MC_CORRECT = 2;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ attended: boolean; alreadyDone: boolean } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/quiz-today")
      .then((r) => r.json())
      .then((d) => {
        setQuiz(d.quiz);
        setStudents(d.students || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalQ = quiz?.questions.length || 5;
  function isAnswered(q: Question) {
    const v = answers[q.id];
    return q.type === "short" ? !!(v && v.trim()) : !!v;
  }
  const answeredCount = quiz ? quiz.questions.filter(isAnswered).length : 0;
  const canSubmit = !!name && answeredCount === totalQ && !submitting;

  async function submit() {
    setErr("");
    if (!quiz || !name || answeredCount !== totalQ) {
      setErr("이름을 선택하고 모든 문제에 답해주세요.");
      return;
    }
    const student = students.find((s) => s.name === name);
    if (!student) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: quiz.date, studentId: student.id, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "저장 중 문제가 발생했습니다.");
      } else {
        setResult({ attended: data.attended, alreadyDone: data.alreadyDone });
      }
    } catch {
      setErr("저장 중 문제가 발생했습니다.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="qa-shell">
        <div className="qa-center-pad">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="qa-shell">
      <div className="qa-hero">
        <div className="qa-hero-top">
          <div className="qa-group-name">2026년 하반기 교리학교</div>
          <a className="qa-admin-link" href="/admin">관리자</a>
        </div>
        <h1 className="qa-serif">{quiz?.title || "오늘의 퀴즈"}</h1>
        <div className="qa-sub">{quiz ? `${quiz.date} · ${totalQ}문제` : ""}</div>
        <div className="qa-hero-rule" />
      </div>

      {!quiz && (
        <div className="qa-center-pad">
          <p>오늘 등록된 퀴즈가 없어요.</p>
          <p className="qa-muted">담당 교역자에게 문의해주세요.</p>
        </div>
      )}

      {quiz && result && (
        <div className="qa-success">
          <p className="qa-muted">{name}님, 수고했어요!</p>
          <div className={"qa-score " + (result.attended ? "pass" : "fail")}>
            {result.attended ? "PASS" : "FAIL"}
          </div>
          {result.alreadyDone ? (
            <p className="qa-muted">
              이미 제출하셨어요. 출석은 {result.attended ? "인정" : "미인정"} 처리되어 있어요.
            </p>
          ) : result.attended ? (
            <p className="qa-muted">오늘 출석이 인정되었습니다.</p>
          ) : (
            <p className="qa-muted">아쉽지만 오늘 출석 인정 기준을 충족하지 못했습니다.</p>
          )}
        </div>
      )}

      {quiz && !result && (
        <>
          <div className="qa-progress">
            <span className="qa-progress-label">
              {answeredCount} / {totalQ} 답변 완료
            </span>
            <div className="qa-progress-track">
              <div
                className="qa-progress-fill"
                style={{ width: `${(answeredCount / totalQ) * 100}%` }}
              />
            </div>
          </div>
          <div className="qa-body">
            <div className="qa-section">
              <div className="qa-section-title">나는 누구인가요?</div>
              <div className="qa-select-wrap">
                <select className="qa-select" value={name} onChange={(e) => setName(e.target.value)}>
                  <option value="">이름을 선택하세요</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="qa-section">
              {quiz.questions.map((q, i) => (
                <div className="qa-q" key={q.id}>
                  <p className="qa-q-text">
                    <span className="qa-q-no">{i + 1}</span>
                    {q.question}
                  </p>
                  {q.type === "short" ? (
                    <input
                      className="qa-input"
                      style={{ marginTop: 12 }}
                      placeholder="답을 입력하세요"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  ) : (
                    <div className="qa-options">
                      {(["A", "B", "C", "D"] as const).map((v) => {
                        const text = (q as any)["option" + v];
                        return (
                          <div
                            key={v}
                            className={"qa-option" + (answers[q.id] === v ? " on" : "")}
                            onClick={() => setAnswers({ ...answers, [q.id]: v })}
                          >
                            <span className="qa-opt-letter">{v}.</span> {text}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {err && <p style={{ color: "var(--danger)", fontSize: 13.5 }}>{err}</p>}
            <p className="qa-muted" style={{ fontSize: 12.5 }}>
              ※ 모든 문제에 답해야 제출할 수 있어요. 객관식 4문제 중 {MIN_MC_CORRECT}문제 이상
              정답이어야 출석이 인정됩니다.
            </p>
          </div>
          <div className="qa-sticky-cta">
            <button className="qa-btn" disabled={!canSubmit} onClick={submit}>
              {submitting ? "제출 중..." : "제출하고 출석하기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
