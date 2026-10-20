import { NextResponse } from "next/server";
import { json, csvCell } from "../../../../lib/http";
import { requireAdmin } from "../../../../lib/requireAdmin";
import { fetchAllPosts, fetchReactionCounts, REACTION_KEYS } from "../../../../lib/posts";

export const dynamic = "force-dynamic";

// 관리자: 전체 나눔 CSV 다운로드 (UTF-8 BOM, 한국시간)
export async function GET() {
  if (!(await requireAdmin())) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  try {
    const [rows, counts] = await Promise.all([fetchAllPosts(true), fetchReactionCounts()]);
    const table = [
      ["번호", "이름", "나눔 내용", "작성일시 (한국시간)", "하트", "엄지척", "기도해요", "기뻐요", "울컥해요", "반응 합계"],
      ...rows.map((r, i) => [
        String(i + 1),
        r.name,
        r.body,
        new Date(r.created_at).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }),
        ...REACTION_KEYS.map((k) => String(counts[r.id]?.[k] || 0)),
        String(REACTION_KEYS.reduce((n, k) => n + (counts[r.id]?.[k] || 0), 0)),
      ]),
    ];
    const csv = "\uFEFF" + table.map((r) => r.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="swc-grace-2026.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return json({ error: "다운로드를 준비하지 못했습니다. 다시 시도해 주세요." }, 503);
  }
}
