-- 내 닉네임 변경을 허용하고 닉네임 중복을 막는다. SQL Editor에서 실행한다.
-- 다시 실행해도 안전하다.
-- schema.sql에는 이미 반영되어 있으므로 새 프로젝트에서는 실행하지 않아도 된다.

grant update (nickname) on public.profiles to authenticated;
drop policy if exists "본인 닉네임 수정" on public.profiles;
create policy "본인 닉네임 수정" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- 대소문자만 다른 닉네임도 같은 것으로 본다.
create unique index if not exists profiles_nickname_key
  on public.profiles (lower(nickname));

-- 가입 트리거의 오류는 Auth가 일반 오류로 바꾸므로, 가입 전에 미리 확인한다.
create or replace function public.is_nickname_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles
    where lower(nickname) = lower(trim(candidate))
  );
$$;

revoke all on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text)
  to anon, authenticated;
