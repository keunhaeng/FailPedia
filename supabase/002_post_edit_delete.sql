-- 내 글 수정과 삭제를 허용한다. SQL Editor에서 한 번 실행한다.
-- schema.sql에는 이미 반영되어 있으므로 새 프로젝트에서는 실행하지 않아도 된다.

-- 작성자와 작성일, '도움이 돼요' 기본값은 계속 바꿀 수 없다.
grant update (is_anonymous, category, title, situation, mistake, self_action, tags)
  on public.posts to authenticated;

grant delete on public.posts to authenticated;
create policy "본인 글 삭제" on public.posts
  for delete to authenticated using (author_id = auth.uid());
