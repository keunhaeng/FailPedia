# FailPedia

일상의 실수를 구조화해 기록하고 피드백을 나누는 웹앱입니다. 데이터와 로그인은 Supabase를 사용합니다.

## 실행

```bash
npm install
npm run dev
```

처음 실행할 때는 다음 설정이 필요합니다.

1. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다. 예시 글이 필요하면 `supabase/seed.sql`도 실행합니다.
2. `.env.example`을 `.env.local`로 복사하고 프로젝트 URL과 Publishable 키를 넣습니다.

http://localhost:3000 에서 확인할 수 있습니다.

## 화면

- `/` 메인 피드: 키워드·`#태그` 검색, 카테고리 탭, 정렬
- `/posts/[id]` 게시글 상세: "도움이 돼요", 피드백 작성, 채택, 내 글 수정·삭제
- `/me` 마이페이지: 오답노트, 내 피드백, 채택된 피드백
- 실수 기록 모달: 헤더의 "실수 기록하기" 버튼

## 구조

- `supabase/schema.sql` 테이블, 뷰, 권한 규칙
- `src/lib/supabase.ts` Supabase 클라이언트
- `src/lib/store.tsx` 앱 전역 상태와 Supabase 읽기/쓰기
- `src/components/` 화면 컴포넌트 (`ui/`는 shadcn/ui)
