import { createClient } from "@supabase/supabase-js";

// 이 클라이언트는 절대 클라이언트 컴포넌트에서 import하면 안 됩니다.
// Service Role Key는 RLS를 무시하고 모든 테이블에 접근할 수 있는 강력한 키입니다.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabaseAdmin] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다."
  );
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);
