"use client";
import { useCallback, useEffect, useState } from "react";

const TOTAL_SESSIONS = 8;

type Question = {
  id: string;
  no: number;
  type: "mc" | "short";
  question: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correct?: string;
  answer?: string;
  explanation?: string;
};

function uid() {
  const g: any = globalThis as any;
  return g.crypto?.randomUUID ? g.crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
}
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
function addDays(dateStr: string, delta: number) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function blankQuestions(): Question[] {
  return Array.from({ length: 5 }, (_, i) =>
    i === 4
      ? { id: uid(), no: 5, type: "short", question: "", answer: "", explanation: "" }
      : {
          id: uid(),
          no: i + 1,
          type: "mc",
          question: "",
          optionA: "",
          optionB: "",
          optionC: "",
          optionD: "",
          correct: "A",
          explanation: "",
        }
  );
}

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<"quiz" | "students" | "attendance">("quiz");
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div>
      <div className="qa-admin-header">
        <div className="row">
          <h2 className="qa-serif">관리자</h2>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a className="qa-exit" href="/">학생 화면으로</a>
            <button className="qa-exit" onClick={onLogout}>로그아웃</button>
          </div>
        </div>
      </div>
      <div className="qa-tabs">
        <button className={"qa-tab" + (tab === "quiz" ? " on" : "")} onClick={() => setTab("quiz")}>
          퀴즈 관리
        </button>
        <button className={"qa-tab" + (tab === "students" ? " on" : "")} onClick={() => setTab("students")}>
          학생 관리
        </button>
        <button className={"qa-tab" + (tab === "attendance" ? " on" : "")} onClick={() => setTab("attendance")}>
          출석부
        </button>
      </div>
      <div className="qa-body">
        {tab === "quiz" && <QuizTab showToast={showToast} />}
        {tab === "students" && <StudentsTab showToast={showToast} />}
        {tab === "attendance" && <AttendanceTab />}
      </div>
      {toast && <div className="qa-toast">{toast}</div>}
    </div>
  );
}

function QuizTab({ showToast }: { showToast: (m: string) => void }) {
  const [date, setDate] = useState(todayKST());
  const [title, setTitle] = useState("오늘의 퀴즈");
  const [session, setSession] = useState(1);
  const [questions, setQuestions] = useState<Question[]>(blankQuestions());
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copyTarget, setCopyTarget] = useState(addDays(todayKST(), 5));
  const [copying, setCopying] = useState(false);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quiz?date=${d}`, { cache: "no-store" });
      const data = await res.json();
      if (data.quiz) {
        setTitle(data.quiz.title || "오늘의 퀴즈");
        setSession(data.quiz.session || 1);
        setQuestions(
          Array.isArray(data.quiz.questions) && data.quiz.questions.length === 5
            ? data.quiz.questions
            : blankQuestions()
        );
      } else {
        setTitle("오늘의 퀴즈");
        setSession(1);
        setQuestions(blankQuestions());
      }
      setSubs(data.submissions || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);
  useEffect(() => {
    setCopyTarget(addDays(date, 5));
  }, [date]);

  function edit(i: number, key: string, val: string) {
    setQuestions(questions.map((q, j) => (j === i ? { ...q, [key]: val } : q)));
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, session, title, questions }),
    });
    setSaving(false);
    showToast(res.ok ? "저장되었습니다." : "저장에 실패했습니다.");
    if (res.ok) load(date);
  }

  async function copyToTarget() {
    if (!copyTarget) return;
    setCopying(true);
    const res = await fetch("/api/admin/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: copyTarget, session, title, questions }),
    });
    setCopying(false);
    showToast(res.ok ? `${copyTarget}로 ${session}회차 문제를 동일하게 복사했습니다.` : "복사에 실패했습니다.");
  }

  async function allowRetake(studentId: string) {
    const res = await fetch("/api/admin/retake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, studentId }),
    });
    if (res.ok) {
      showToast("재시험이 허용되었습니다. 학생이 다시 제출할 수 있어요.");
      load(date);
    } else {
      showToast("처리에 실패했습니다.");
    }
  }

  return (
    <div>
      <div className="qa-row-between qa-section">
        <div>
          <div className="qa-section-title" style={{ marginBottom: 2 }}>
            퀴즈 관리
          </div>
          <span className="qa-muted">날짜별 5문제 입력</span>
        </div>
        <input
          type="date"
          className="qa-input"
          style={{ maxWidth: 170 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="qa-center-pad">불러오는 중...</div>
      ) : (
        <>
          <div className="qa-card" style={{ marginBottom: 16 }}>
            <div className="qa-grid2">
              <div>
                <label className="qa-field-label">퀴즈 제목</label>
                <input className="qa-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="qa-field-label">회차 (같은 회차끼리 출석이 합산돼요)</label>
                <div className="qa-select-wrap">
                  <select
                    className="qa-select"
                    value={session}
                    onChange={(e) => setSession(Number(e.target.value))}
                  >
                    {Array.from({ length: TOTAL_SESSIONS }, (_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}회
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="qa-card">
            {questions.map((q, i) => (
              <div className="qa-editor-q" key={q.id}>
                <h4>
                  {i + 1}번 문제{q.type === "short" ? " · 주관식 (자동 정답 처리)" : ""}
                </h4>
                <textarea
                  className="qa-textarea"
                  placeholder="문제를 입력하세요"
                  value={q.question}
                  onChange={(e) => edit(i, "question", e.target.value)}
                />
                {q.type === "short" ? (
                  <div className="qa-grid2">
                    <input
                      className="qa-input"
                      placeholder="모범답안 (참고용 · 자동 채점에는 사용되지 않음)"
                      value={q.answer || ""}
                      onChange={(e) => edit(i, "answer", e.target.value)}
                    />
                    <input
                      className="qa-input"
                      placeholder="해설 (선택)"
                      value={q.explanation || ""}
                      onChange={(e) => edit(i, "explanation", e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="qa-grid2">
                      <input
                        className="qa-input"
                        placeholder="A 보기"
                        value={q.optionA || ""}
                        onChange={(e) => edit(i, "optionA", e.target.value)}
                      />
                      <input
                        className="qa-input"
                        placeholder="B 보기"
                        value={q.optionB || ""}
                        onChange={(e) => edit(i, "optionB", e.target.value)}
                      />
                      <input
                        className="qa-input"
                        placeholder="C 보기"
                        value={q.optionC || ""}
                        onChange={(e) => edit(i, "optionC", e.target.value)}
                      />
                      <input
                        className="qa-input"
                        placeholder="D 보기"
                        value={q.optionD || ""}
                        onChange={(e) => edit(i, "optionD", e.target.value)}
                      />
                    </div>
                    <div className="qa-grid2">
                      <div className="qa-select-wrap">
                        <select
                          className="qa-select"
                          value={q.correct}
                          onChange={(e) => edit(i, "correct", e.target.value)}
                        >
                          <option value="A">A 정답</option>
                          <option value="B">B 정답</option>
                          <option value="C">C 정답</option>
                          <option value="D">D 정답</option>
                        </select>
                      </div>
                      <input
                        className="qa-input"
                        placeholder="해설 (선택)"
                        value={q.explanation || ""}
                        onChange={(e) => edit(i, "explanation", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
            <button className="qa-btn" style={{ marginTop: 16 }} onClick={save} disabled={saving}>
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>

          <div className="qa-card" style={{ marginTop: 16 }}>
            <h4 style={{ margin: "0 0 4px", fontSize: 14, color: "var(--navy-900)" }}>
              다른 날짜에 동일한 문제 복사
            </h4>
            <p className="qa-muted" style={{ marginBottom: 10 }}>
              오프라인(목) · 온라인(화)처럼 같은 회차 내용을 다른 요일에도 그대로 내리려면, 아래
              날짜로 복사하세요. 같은 {session}회차 번호로 복사되므로 출석부에서도 같은 주차로
              합산됩니다.
            </p>
            <div className="qa-add-row">
              <input
                type="date"
                className="qa-input"
                value={copyTarget}
                onChange={(e) => setCopyTarget(e.target.value)}
              />
              <button className="qa-btn qa-btn-sm" onClick={copyToTarget} disabled={copying}>
                {copying ? "복사 중..." : "이 문제 복사하기"}
              </button>
            </div>
            <p className="qa-muted" style={{ marginTop: 8, fontSize: 12 }}>
              이미 해당 날짜에 문제가 있다면 덮어써집니다. 지금 화면에 있는 내용(저장 여부와 무관)이
              복사됩니다.
            </p>
          </div>

          <div className="qa-card" style={{ marginTop: 16 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--navy-900)" }}>제출 현황</h4>
            <p className="qa-muted" style={{ marginBottom: subs.length ? 10 : 0 }}>
              {subs.length}명 제출 · 출석 인정 {subs.filter((s) => s.attended).length}명
            </p>
            {subs.map((s) => (
              <div className="qa-student-row" key={s.studentId}>
                <span>
                  <strong>{s.studentName}</strong>
                  <span className="qa-muted"> {s.score}/{questions.length}점</span>{" "}
                  <span className={"qa-pill " + (s.attended ? "active" : "inactive")}>
                    {s.attended ? "출석 인정" : "출석 미인정"}
                  </span>
                </span>
                <button className="qa-btn qa-btn-sec qa-btn-sm" onClick={() => allowRetake(s.studentId)}>
                  재시험 허용
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StudentsTab({ showToast }: { showToast: (m: string) => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/students", { cache: "no-store" });
    const data = await res.json();
    setStudents(data.students || []);
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function addStudent() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setNewName("");
      showToast("학생이 추가되었습니다.");
      load();
    } else {
      showToast("추가에 실패했습니다.");
    }
  }
  async function toggle(s: any) {
    const res = await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, active: !s.active }),
    });
    if (res.ok) load();
  }
  async function remove(s: any) {
    const res = await fetch(`/api/admin/students?id=${s.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("삭제되었습니다.");
      load();
    }
  }

  return (
    <div>
      <div className="qa-section-title">학생 명단</div>
      <div className="qa-add-row">
        <input
          className="qa-input"
          placeholder="학생 이름"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addStudent()}
        />
        <button className="qa-btn qa-btn-sm" onClick={addStudent}>
          추가
        </button>
      </div>
      <div className="qa-card" style={{ marginTop: 14 }}>
        {loading ? (
          <div className="qa-center-pad">불러오는 중...</div>
        ) : students.length === 0 ? (
          <p className="qa-muted">등록된 학생이 없습니다.</p>
        ) : (
          students.map((s) => (
            <div className="qa-student-row" key={s.id}>
              <span style={{ fontWeight: 600 }}>{s.name}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={"qa-pill " + (s.active ? "active" : "inactive")}>
                  {s.active ? "활성" : "비활성"}
                </span>
                <button className="qa-btn qa-btn-sec qa-btn-sm" onClick={() => toggle(s)}>
                  {s.active ? "비활성화" : "활성화"}
                </button>
                <button className="qa-btn qa-btn-danger qa-btn-sm" onClick={() => remove(s)}>
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AttendanceTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/attendance", { cache: "no-store" });
    setData(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) return <div className="qa-center-pad">불러오는 중...</div>;

  const { sessionDates, rows, totalSessions } = data;
  const sessionsUsed = sessionDates.filter((ds: string[]) => ds.length > 0).length;

  function colDate(i: number) {
    const ds = sessionDates[i] || [];
    if (ds.length === 0) return "-";
    return ds.map((d: string) => d.slice(5).replace("-", "/")).join(",");
  }

  function downloadCSV() {
    const header = [
      "학생",
      ...Array.from({ length: totalSessions }, (_, i) => `${i + 1}회(${colDate(i)})`),
      "출석횟수",
    ];
    const lines = [header];
    rows.forEach((r: any) => {
      const cells = Array.from({ length: totalSessions }, (_, i) => (r.attended[i] ? "O" : ""));
      lines.push([r.name, ...cells, r.count]);
    });
    const csv = "\uFEFF" + lines.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `교리학교_출석부.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function csvField(v: any) {
    const s = String(v ?? "");
    return '"' + s.replace(/"/g, '""') + '"';
  }

  async function downloadAnswersCSV() {
    setExporting(true);
    try {
      const res = await fetch("/api/admin/answers", { cache: "no-store" });
      const answerData = await res.json();
      const answerRows = answerData.rows || [];
      const header = [
        "회차", "날짜", "퀴즈 제목", "학생", "문제번호", "문제유형",
        "문제", "학생 답안", "정답", "채점 결과", "총점", "출석여부",
      ];
      const lines = [header.map(csvField).join(",")];
      answerRows.forEach((r: any) => {
        lines.push(
          [
            r.session, r.quizDate, r.quizTitle, r.studentName, r.questionNo, r.questionType,
            r.questionText, r.studentAnswer, r.correctAnswer,
            r.isCorrect === null ? "-" : r.isCorrect ? "정답" : "오답",
            r.score, r.attended ? "인정" : "미인정",
          ].map(csvField).join(",")
        );
      });
      const csv = "\uFEFF" + lines.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "교리학교_답안상세.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="qa-row-between qa-section">
        <div>
          <div className="qa-section-title" style={{ marginBottom: 2 }}>
            교리학교 출석부
          </div>
          <span className="qa-muted">
            전체 {totalSessions}회차 중 {sessionsUsed}회차 진행됨 · 같은 회차의 목/화 날짜는 자동 합산
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="qa-btn qa-btn-sec qa-btn-sm" onClick={load}>
            새로고침
          </button>
          <button className="qa-btn qa-btn-sm" onClick={downloadCSV}>
            출석 CSV
          </button>
          <button className="qa-btn qa-btn-sm" onClick={downloadAnswersCSV} disabled={exporting}>
            {exporting ? "생성 중..." : "답안 상세 CSV"}
          </button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="qa-muted">등록된 학생이 없습니다.</p>
      ) : (
        <div className="qa-table-wrap">
          <table className="qa-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>학생</th>
                {Array.from({ length: totalSessions }, (_, i) => (
                  <th key={i}>
                    {i + 1}회
                    <br />
                    <span style={{ fontWeight: 400, fontSize: 11 }}>{colDate(i)}</span>
                  </th>
                ))}
                <th>출석</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.studentId}>
                  <td className="name-cell">{r.name}</td>
                  {Array.from({ length: totalSessions }, (_, i) => (
                    <td key={i} className={r.attended[i] ? "qa-dot-yes" : "qa-dot-no"}>
                      {(sessionDates[i]?.length || 0) > 0 ? (r.attended[i] ? "●" : "·") : "-"}
                    </td>
                  ))}
                  <td style={{ fontWeight: 700 }}>
                    {r.count} / {totalSessions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
