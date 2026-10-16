import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { json } from "../../../../lib/http";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

// 관리자: 댓글 삭제 (되돌릴 수 없음)
export async function DELETE(request: Request) {
  if (!(await requireAdmin())) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return json({ error: "잘못된 요청입니다." }, 400);
  }
  const { data, error } = await supabaseAdmin
    .from("grace_comments")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return json({ error: "삭제하지 못했습니다. 다시 시도해 주세요." }, 503);
  if (!data || data.length === 0) return json({ error: "이미 삭제되었거나 없는 댓글입니다." }, 404);
  return json({ ok: true });
}
