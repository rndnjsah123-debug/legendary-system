import { supabaseAdmin } from "./supabaseAdmin";

export type CommentRow = { id: string; name: string; body: string; created_at: string };
export type PostRow = {
  id: string;
  name: string;
  body: string;
  created_at: string;
  grace_comments?: CommentRow[] | null;
};

export function toComment(c: CommentRow) {
  return { id: c.id, name: c.name, body: c.body, createdAt: c.created_at };
}

export const REACTION_KEYS = ["heart", "thumbs", "pray", "smile", "tear"] as const;
export type Counts = Record<string, number>;

export function toPost(r: PostRow, reactions?: Counts) {
  return {
    id: r.id,
    name: r.name,
    body: r.body,
    createdAt: r.created_at,
    comments: (r.grace_comments || []).map(toComment),
    reactions: reactions || {},
  };
}

// 글별 이모티콘 반응 개수 { 글id: { heart: 3, thumbs: 1 } }
// 반응 표가 아직 없는 경우에도 글은 그대로 보이도록 빈 값을 돌려줍니다.
export async function fetchReactionCounts(): Promise<Record<string, Counts>> {
  try {
    const out: Record<string, Counts> = {};
    const size = 1000;
    for (let from = 0; ; from += size) {
      const { data, error } = await supabaseAdmin
        .from("grace_reaction_summary")
        .select("post_id,counts")
        .order("post_id")
        .range(from, from + size - 1);
      if (error) throw error;
      const rows = (data || []) as unknown as { post_id: string; counts: Counts | null }[];
      for (const r of rows) out[r.post_id] = r.counts || {};
      if (rows.length < size) break;
    }
    return out;
  } catch {
    return {};
  }
}

const POST_COLS = "id,name,body,created_at";
const WITH_COMMENTS = `${POST_COLS},grace_comments(id,name,body,created_at)`;

async function page(select: string, ascending: boolean, from: number, to: number) {
  let q: any = supabaseAdmin
    .from("grace_posts")
    .select(select)
    .order("created_at", { ascending })
    .order("id", { ascending });
  if (select.includes("grace_comments")) {
    q = q.order("created_at", { ascending: true, referencedTable: "grace_comments" });
  }
  const { data, error } = await q.range(from, to);
  if (error) throw error;
  return (data || []) as PostRow[];
}

async function loadAll(select: string, ascending: boolean): Promise<PostRow[]> {
  const size = 1000;
  const all: PostRow[] = [];
  for (let from = 0; ; from += size) {
    const rows = await page(select, ascending, from, from + size - 1);
    all.push(...rows);
    if (rows.length < size) break;
  }
  return all;
}

// 전체 글(+댓글). 댓글 표가 아직 없는 경우에도 글은 보이도록 댓글 없이 다시 시도합니다.
export async function fetchAllPosts(ascending: boolean): Promise<PostRow[]> {
  try {
    return await loadAll(WITH_COMMENTS, ascending);
  } catch {
    return await loadAll(POST_COLS, ascending);
  }
}

// 정원 화면용: 최신 글 1,000개(+댓글)
export async function fetchLatestPosts(): Promise<PostRow[]> {
  try {
    return await page(WITH_COMMENTS, false, 0, 999);
  } catch {
    return await page(POST_COLS, false, 0, 999);
  }
}
