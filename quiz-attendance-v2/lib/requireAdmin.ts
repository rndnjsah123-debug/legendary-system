import { cookies } from "next/headers";
import { isValidAdminToken } from "./adminAuth";

export async function requireAdmin(): Promise<boolean> {
  const token = cookies().get("admin_session")?.value;
  return isValidAdminToken(token);
}
