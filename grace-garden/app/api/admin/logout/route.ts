import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "../../../../lib/adminAuth";
import { json } from "../../../../lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  cookies().delete(ADMIN_COOKIE);
  return json({ ok: true });
}
