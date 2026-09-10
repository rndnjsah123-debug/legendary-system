"use client";
import { useEffect, useState } from "react";
import Dashboard from "./dashboard";

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authed))
      .catch(() => setAuthed(false));
  }, []);

  async function login() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        const d = await res.json().catch(() => ({}));
        setErr(d.error || "비밀번호가 올바르지 않습니다.");
      }
    } catch {
      setErr("로그인 중 문제가 발생했습니다.");
    }
    setLoading(false);
  }

  async function logout() {
    await fetch("/api/admin-logout", { method: "POST" }).catch(() => {});
    setAuthed(false);
    setPw("");
  }

  if (authed === null) {
    return (
      <div className="qa-shell">
        <div className="qa-center-pad">불러오는 중...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="qa-shell">
        <div className="qa-login-wrap">
          <h1 className="qa-serif" style={{ textAlign: "center", marginBottom: 4 }}>
            관리자 로그인
          </h1>
          <p className="qa-muted" style={{ textAlign: "center", marginBottom: 22 }}>
            퀴즈·출석 관리 화면으로 이동합니다.
          </p>
          <label className="qa-field-label">비밀번호</label>
          <input
            className="qa-input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="비밀번호를 입력하세요"
          />
          {err && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{err}</p>}
          <button className="qa-btn" style={{ marginTop: 16 }} onClick={login} disabled={loading}>
            {loading ? "확인 중..." : "로그인"}
          </button>
          <a className="qa-btn qa-btn-sec" style={{ marginTop: 10, display: "block", textAlign: "center" }} href="/">
            학생 화면으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-shell">
      <Dashboard onLogout={logout} />
    </div>
  );
}
