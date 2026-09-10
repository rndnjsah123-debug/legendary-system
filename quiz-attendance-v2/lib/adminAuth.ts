// 관리자 비밀번호는 서버 환경변수(ADMIN_PASSWORD)에만 존재하고,
// 클라이언트 번들에는 절대 포함되지 않습니다.
// 로그인에 성공하면 비밀번호를 직접 저장하는 대신,
// 비밀번호로부터 계산된 해시값을 httpOnly 쿠키로 내려줍니다.

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeAdminToken(): Promise<string> {
  const secret = process.env.ADMIN_PASSWORD || "";
  const enc = new TextEncoder().encode(secret + ":doctrine-school-2026");
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return toHex(digest);
}

export async function isValidAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await computeAdminToken();
  return token === expected;
}
