import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { clientIp, isSameOrigin, json } from "../../../lib/http";
import { hit } from "../../../lib/rateLimit";
import { fetchLatestPosts, toPost, type PostRow } from "../../../lib/posts";

export const dynamic = "force-dynamic";

// 공개: 최신 글 조회 (정원에 표시, 댓글 포함)
export async function GET() {
  try {
    const rows = await fetchLatestPosts();
    return json({ posts: rows.map(toPost) });
  } catch {
    return json({ error: "글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }
}

// 공개: 나눔 글 게시
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return json({ error: "허용되지 않은 요청입니다." }, 403);
    if (Number(request.headers.get("content-length") || 0) > 16000) {
      return json({ error: "글이 너무 깁니다." }, 413);
    }
    const raw = await request.text();
    if (raw.length > 12000) return json({ error: "글이 너무 깁니다." }, 413);

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return json({ error: "입력을 확인해 주세요." }, 400);
    }
    if (!data || typeof data.name !== "string" || typeof data.body !== "string") {
      return json({ error: "이름과 글을 적어 주세요." }, 400);
    }
    const name = data.name.trim();
    const body = data.body.trim();
    if (!name || name.length > 30 || !body || body.length > 2000) {
      return json({ error: "이름은 30자, 글은 2,000자 이내로 적어 주세요." }, 400);
    }
    if (data.website) return json({ error: "허용되지 않은 요청입니다." }, 400); // 봇 방지 숨김 칸

    const count = await hit("post", clientIp(request));
    if (count > 50) {
      return json({ error: "잠시 글이 많이 올라오고 있어요. 1분 뒤 다시 시도해 주세요." }, 429);
    }

    const { data: row, error } = await supabaseAdmin
      .from("grace_posts")
      .insert({ name, body })
      .select("id,name,body,created_at")
      .single();
    if (error || !row) throw error || new Error("insert failed");
    return json({ post: toPost(row as PostRow) }, 201);
  } catch {
    return json({ error: "저장하지 못했습니다. 작성하신 글은 그대로 있으니 다시 시도해 주세요." }, 503);
  }
}
