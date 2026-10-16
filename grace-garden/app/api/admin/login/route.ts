import { cookies } from "next/headers";
import { ADMIN_COOKIE, computeAdminToken } from "../../../../lib/adminAuth";
import { clientIp, json } from "../../../../lib/http";
import { hit } from "../../../../lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return json({ error: "서버에 관리자 비밀번호(ADMIN_PASSWORD)가 설정되어 있지 않습니다." }, 500);
  }

  // 비밀번호 대입 공격 방지: IP당 1분에 10회까지만 시도 가능
  // (속도 제한 기록이 일시적으로 실패해도 비밀번호 확인 자체는 계속 필요합니다)
  try {
    if ((await hit("login", clientIp(request))) > 10) {
      return json({ error: "시도가 너무 많습니다. 1분 뒤 다시 시도해 주세요." }, 429);
    }
  } catch {}

  const body = await request.json().catch(() => null);
  if (!body || typeof body.password !== "string" || body.password !== process.env.ADMIN_PASSWORD) {
    return json({ error: "비밀번호가 올바르지 않습니다." }, 401);
  }

  cookies().set(ADMIN_COOKIE, await computeAdminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return json({ ok: true });
}
