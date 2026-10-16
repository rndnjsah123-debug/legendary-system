// 관리자 비밀번호는 서버 환경변수(ADMIN_PASSWORD)에만 존재하며 클라이언트에 노출되지 않습니다.
// 로그인에 성공하면 비밀번호에서 계산한 해시값을 httpOnly 쿠키로 내려줍니다.

export const ADMIN_COOKIE = "grace_admin";

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return toHex(digest);
}

export async function computeAdminToken(): Promise<string> {
  return sha256Hex((process.env.ADMIN_PASSWORD || "") + ":grace-garden-2026");
}

export async function isValidAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !process.env.ADMIN_PASSWORD) return false;
  return token === (await computeAdminToken());
}
