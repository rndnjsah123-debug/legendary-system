import { supabaseAdmin } from "./supabaseAdmin";

export type PostRow = { id: string; name: string; body: string; created_at: string };

export function toPost(r: PostRow) {
  return { id: r.id, name: r.name, body: r.body, createdAt: r.created_at };
}

// 1,000건씩 끊어서 전체 글을 가져옵니다. (Supabase 기본 조회 한도 대응)
export async function fetchAllPosts(ascending: boolean): Promise<PostRow[]> {
  const size = 1000;
  const all: PostRow[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await supabaseAdmin
      .from("grace_posts")
      .select("id,name,body,created_at")
      .order("created_at", { ascending })
      .order("id", { ascending })
      .range(from, from + size - 1);
    if (error) throw error;
    const rows = (data || []) as PostRow[];
    all.push(...rows);
    if (rows.length < size) break;
  }
  return all;
}
