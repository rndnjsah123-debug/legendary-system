# 은혜의 정원 · 2026 특별새벽부흥회 (Vercel + Supabase 버전)

수지 함께하는 교회 특별새벽부흥회(2026.10.19–24) 은혜 나눔 웹사이트입니다.
성도는 로그인 없이 글을 남기고, 관리자는 글을 확인·**삭제**하고 CSV로 내려받을 수 있습니다.

## 원본(ChatGPT Sites 버전)과 달라진 점
- 호스팅: Cloudflare/D1 → **Vercel + Supabase** (퀴즈 앱과 같은 방식)
- 관리자 로그인: ChatGPT 계정 → **관리자 비밀번호** (서버 환경변수 `ADMIN_PASSWORD`, 코드에 노출되지 않음)
- 새 기능: **관리자 글 삭제**(이름/내용 검색 포함), 로그인 시도 제한(IP당 분당 10회)
- 게시 화면 디자인·동작은 원본과 동일합니다.

## 1. Supabase 설정 (퀴즈 앱과 같은 프로젝트에서 해도 됩니다)
1. Supabase 대시보드 → **SQL Editor** → `supabase/grace-schema.sql` 내용을 붙여넣고 **Run**
2. Settings > API Keys에서 `Project URL`과 `Secret key`(sb_secret_…)를 확인

## 2. Vercel 배포
1. 이 `grace-garden` 폴더를 GitHub 저장소에 올립니다. (퀴즈 앱과 같은 저장소에 폴더로 추가해도 됩니다)
2. Vercel → **Add New → Project** → 저장소 선택
3. **Root Directory → Edit → `grace-garden`** 선택 (Framework Preset이 **Next.js**인지 확인)
4. **Environment Variables** 3개 입력
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Secret key
   - `ADMIN_PASSWORD` = 원하는 관리자 비밀번호
5. Deploy → 완료되면 공개 주소(`https://….vercel.app`)가 생깁니다.

## 3. 사용
- 성도: 메인 주소에서 ‘나의 은혜 나누기’
- 관리자: 메인 하단 ‘관리자’(또는 `/admin`) → 비밀번호 로그인 → 글 목록/삭제, CSV 다운로드
- 삭제한 글은 되돌릴 수 없으니 필요하면 먼저 CSV로 백업하세요. 정원 화면에는 최대 20초 안에 반영됩니다.

## 참고
- 정원 화면은 최신 1,000개 글까지 보여줍니다. CSV에는 전체 글이 포함됩니다.
- 게시는 IP당 분당 50건으로 제한됩니다. (교회 와이파이는 같은 IP로 보일 수 있어요)
- 개발 시: `npm install` → `.env.local.example`을 `.env.local`로 복사해 값 입력 → `npm run dev`
