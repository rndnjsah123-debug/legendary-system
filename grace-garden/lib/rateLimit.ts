import { supabaseAdmin } from "./supabaseAdmin";
import { sha256Hex } from "./adminAuth";

// IP별 1분 단위 호출 횟수를 DB에 기록하고 현재 횟수를 돌려줍니다. (grace_hit 함수 사용)
export async function hit(prefix: string, ip: string): Promise<number> {
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  const key = await sha256Hex(`${prefix}:${ip}:${minute}`);
  const { data, error } = await supabaseAdmin.rpc("grace_hit", {
    p_key: key,
    p_expires: now + 120000,
    p_now: now,
  });
  if (error) throw error;
  return Number(data);
}
