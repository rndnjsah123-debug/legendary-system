# 2026년 하반기 교리학교 퀴즈·출석 시스템

Next.js + Supabase 기반. Claude 계정과 무관하게, 링크만 있으면 누구나 로그인 없이 바로 쓸 수 있습니다.

## 주요 기능
- 학생 이름 선택 → 5문제(객관식 4 + 주관식 1) → 제출 시 자동 출석 처리
- 주관식(5번)은 항상 정답 처리, 객관식 4문제 중 2문제 이상 맞아야 출석 인정
- 결과 화면은 PASS/FAIL만 표시 (정답 내용은 노출하지 않음)
- 관리자: 회차(1~8회)별 문제 관리, 다른 날짜(목/화 등)로 동일 문제 복사 → 같은 회차로 출석 자동 합산
- 관리자: 학생별 재시험 허용, 학생 명단 관리, 회차 기준 8칸 출석부(CSV 다운로드)
- 정답은 서버에서만 다루고 학생 화면에는 절대 내려가지 않음
- 관리자 비밀번호는 서버 환경변수에만 저장되고, 로그인은 서버에서 검증 (코드에 노출되지 않음)

## 1. Supabase 설정 (무료)
1. https://supabase.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 실행
3. 왼쪽 메뉴 **Settings > API**에서 다음 두 값을 복사해둡니다
   - `Project URL` → `SUPABASE_URL`
   - `service_role` 키 (secret) → `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ `service_role` 키는 절대 외부에 노출되면 안 됩니다. Vercel 환경변수에만 등록하세요.

## 2. 로컬에서 확인 (선택)
```bash
npm install
cp .env.local.example .env.local
# .env.local에 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_PASSWORD 입력
npm run dev
# http://localhost:3000
```

## 3. Vercel로 배포 (무료)
1. 이 프로젝트를 GitHub 저장소로 올립니다
2. https://vercel.com 에서 "New Project" → 방금 올린 저장소 선택
3. **Environment Variables**에 아래 3개를 등록
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (관리자 로그인 비밀번호, 원하는 값으로)
4. Deploy 클릭 → 완료되면 `https://프로젝트이름.vercel.app` 형태의 공개 링크 생성
5. (선택) Vercel 프로젝트 설정 > Domains에서 원하는 도메인(예: `quiz.수지교회.com`) 연결 가능

## 4. 사용 순서
1. `/admin` 접속 → 비밀번호로 로그인
2. "학생 관리"에서 학생 명단 등록
3. "퀴즈 관리"에서 날짜 선택 → 회차 선택 → 문제 5개 입력 → 저장
4. 오프라인(목)/온라인(화)처럼 같은 내용을 다른 날짜에도 내리려면 "다른 날짜에 동일한 문제 복사" 사용 (같은 회차 번호로 복사되어 출석부에서 자동 합산됨)
5. 학생들에게는 배포된 메인 링크(`/`)만 공유하면 됩니다 — 그날 날짜의 퀴즈가 자동으로 뜹니다

## 보안 관련 참고
- 정답은 서버(API 라우트)에서만 다루고 학생 화면에는 전달되지 않습니다.
- 모든 DB 접근은 서버의 Service Role Key를 통해서만 이루어지며, RLS가 켜져 있어 외부에서 Supabase에 직접 접근할 수 없습니다.
- 관리자 인증은 간단한 비밀번호 기반입니다. 더 강력한 보안이 필요하면 Supabase Auth 기반의 정식 로그인으로 교체하는 것을 권장합니다.
