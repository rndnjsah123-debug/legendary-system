import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { computeAdminToken } from "../../../lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  const { password } = body || {};

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "서버에 관리자 비밀번호(ADMIN_PASSWORD)가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await computeAdminToken();
  cookies().set("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14일
  });
  return NextResponse.json({ ok: true });
}
