import { createClient } from "@supabase/supabase-js";

// 서버(API 라우트)에서만 사용합니다. 절대 클라이언트 컴포넌트에서 import하지 마세요.
// Service Role(Secret) Key는 RLS를 우회하는 강력한 키입니다.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "http://localhost:54321",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "missing-key",
  {
    auth: { persistSession: false },
    // Next.js의 fetch 캐싱을 완전히 우회합니다. (캐싱되면 새 글이 안 보이는 문제가 생깁니다)
    global: {
      fetch: (input: RequestInfo | URL, init: RequestInit = {}) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  }
);
