import { json } from "../../../../lib/http";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({ authorized: await requireAdmin() });
}
