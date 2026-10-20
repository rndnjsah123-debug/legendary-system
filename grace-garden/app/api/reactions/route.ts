import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { clientIp, isSameOrigin, json } from "../../../lib/http";
import { hit } from "../../../lib/rateLimit";
import { REACTION_KEYS, type Counts } from "../../../lib/posts";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLIENT_ID = /^[A-Za-z0-9_-]{8,64}$/;

// 공개: 이모티콘 반응 남기기 / 바꾸기 / 취소 (reaction: null)
// 기기(브라우저)마다 글 하나에 반응 1개만 남길 수 있습니다.
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return json({ error: "허용되지 않은 요청입니다." }, 403);
    if (Number(request.headers.get("content-length") || 0) > 1000) {
      return json({ error: "잘못된 요청입니다." }, 413);
    }
    const raw = await request.text();
    if (raw.length > 1000) return json({ error: "잘못된 요청입니다." }, 413);

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return json({ error: "입력을 확인해 주세요." }, 400);
    }
    const reaction = data?.reaction;
    if (
      !data ||
      typeof data.postId !== "string" ||
      !UUID.test(data.postId) ||
      typeof data.clientId !== "string" ||
      !CLIENT_ID.test(data.clientId) ||
      !(reaction === null || (typeof reaction === "string" && (REACTION_KEYS as readonly string[]).includes(reaction)))
    ) {
      return json({ error: "잘못된 요청입니다." }, 400);
    }

    const count = await hit("react", clientIp(request));
    if (count > 120) {
      return json({ error: "잠시 반응이 많이 올라오고 있어요. 1분 뒤 다시 시도해 주세요." }, 429);
    }

    if (reaction === null) {
      const { error } = await supabaseAdmin
        .from("grace_reactions")
        .delete()
        .eq("post_id", data.postId)
        .eq("client_id", data.clientId);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("grace_reactions")
        .upsert(
          { post_id: data.postId, client_id: data.clientId, reaction },
          { onConflict: "post_id,client_id" }
        );
      if (error) {
        if ((error as any).code === "23503") {
          return json({ error: "이미 삭제된 글이에요. 새로고침해 주세요." }, 404);
        }
        throw error;
      }
    }

    // 최신 개수를 돌려줘서 화면 숫자를 정확하게 맞춥니다.
    const { data: rows, error: readErr } = await supabaseAdmin
      .from("grace_reactions")
      .select("reaction")
      .eq("post_id", data.postId)
      .limit(1000);
    if (readErr) throw readErr;
    const counts: Counts = {};
    for (const r of (rows || []) as { reaction: string }[]) counts[r.reaction] = (counts[r.reaction] || 0) + 1;
    return json({ counts });
  } catch {
    return json({ error: "반응을 남기지 못했어요. 잠시 후 다시 시도해 주세요." }, 503);
  }
}
