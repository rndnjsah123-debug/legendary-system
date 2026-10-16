import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { clientIp, isSameOrigin, json } from "../../../lib/http";
import { hit } from "../../../lib/rateLimit";
import { toComment, type CommentRow } from "../../../lib/posts";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 공개: 댓글 달기
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return json({ error: "허용되지 않은 요청입니다." }, 403);
    if (Number(request.headers.get("content-length") || 0) > 4000) {
      return json({ error: "댓글이 너무 깁니다." }, 413);
    }
    const raw = await request.text();
    if (raw.length > 4000) return json({ error: "댓글이 너무 깁니다." }, 413);

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return json({ error: "입력을 확인해 주세요." }, 400);
    }
    if (
      !data ||
      typeof data.postId !== "string" ||
      !UUID.test(data.postId) ||
      typeof data.name !== "string" ||
      typeof data.body !== "string"
    ) {
      return json({ error: "이름과 댓글을 적어 주세요." }, 400);
    }
    const name = data.name.trim();
    const body = data.body.trim();
    if (!name || name.length > 30 || !body || body.length > 500) {
      return json({ error: "이름은 30자, 댓글은 500자 이내로 적어 주세요." }, 400);
    }
    if (data.website) return json({ error: "허용되지 않은 요청입니다." }, 400); // 봇 방지 숨김 칸

    const count = await hit("comment", clientIp(request));
    if (count > 50) {
      return json({ error: "잠시 댓글이 많이 올라오고 있어요. 1분 뒤 다시 시도해 주세요." }, 429);
    }

    const { data: row, error } = await supabaseAdmin
      .from("grace_comments")
      .insert({ post_id: data.postId, name, body })
      .select("id,name,body,created_at")
      .single();
    if (error) {
      if ((error as any).code === "23503") {
        return json({ error: "이미 삭제된 글이에요. 새로고침해 주세요." }, 404);
      }
      throw error;
    }
    return json({ comment: toComment(row as CommentRow) }, 201);
  } catch {
    return json({ error: "저장하지 못했습니다. 작성하신 댓글은 그대로 있으니 다시 시도해 주세요." }, 503);
  }
}
