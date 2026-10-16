import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { json, csvCell } from "../../../../lib/http";
import { requireAdmin } from "../../../../lib/requireAdmin";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  body: string;
  created_at: string;
  grace_posts?: { name: string; body: string } | { name: string; body: string }[] | null;
};

async function fetchAllComments(): Promise<Row[]> {
  const size = 1000;
  const all: Row[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await supabaseAdmin
      .from("grace_comments")
      .select("id,name,body,created_at,grace_posts(name,body)")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + size - 1);
    if (error) throw error;
    const rows = (data || []) as unknown as Row[];
    all.push(...rows);
    if (rows.length < size) break;
  }
  return all;
}

// 관리자: 전체 댓글 CSV 다운로드 (UTF-8 BOM, 한국시간)
export async function GET() {
  if (!(await requireAdmin())) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  try {
    const rows = await fetchAllComments();
    const table = [
      ["번호", "원글 작성자", "원글 내용", "댓글 작성자", "댓글 내용", "작성일시 (한국시간)"],
      ...rows.map((r, i) => {
        const post = Array.isArray(r.grace_posts) ? r.grace_posts[0] : r.grace_posts;
        return [
          String(i + 1),
          post?.name || "",
          post?.body || "",
          r.name,
          r.body,
          new Date(r.created_at).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }),
        ];
      }),
    ];
    const csv = "\uFEFF" + table.map((r) => r.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="swc-grace-comments-2026.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return json({ error: "다운로드를 준비하지 못했습니다. 다시 시도해 주세요." }, 503);
  }
}
