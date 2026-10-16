import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminToken } from "./adminAuth";

export async function requireAdmin(): Promise<boolean> {
  return isValidAdminToken(cookies().get(ADMIN_COOKIE)?.value);
}
