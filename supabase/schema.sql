-- FailPedia 데이터베이스 스키마
-- Supabase 대시보드의 SQL Editor에 전체를 붙여 넣고 한 번 실행한다.
--
-- 공개 키는 브라우저에 노출되므로 누구나 DB에 직접 요청할 수 있다.
-- 원본 테이블을 그대로 공개하면 익명 글의 작성자가 드러나기 때문에,
-- 테이블은 본인 행만 읽게 막고 공개 조회는 이름을 가린 뷰로만 허용한다.

-- 테이블 ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 30),
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  is_anonymous boolean not null default false,
  category text not null check (category in ('학업', '취업', '연애', '관계', '기타')),
  title text not null check (char_length(title) between 1 and 80),
  situation text not null check (char_length(situation) > 0),
  mistake text not null check (char_length(mistake) > 0),
  self_action text not null check (char_length(self_action) > 0),
  tags text[] not null default '{}' check (cardinality(tags) <= 5),
  is_reviewed boolean not null default false,
  pinned_comment_id uuid,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

alter table public.posts
  add constraint posts_pinned_comment_id_fkey
  foreign key (pinned_comment_id) references public.comments (id)
  on delete set null;

create table public.post_helpful (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index comments_post_id_idx on public.comments (post_id);

-- 트리거 ---------------------------------------------------------------

-- 회원가입 시 닉네임으로 프로필을 만든다.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nickname'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 채택은 해당 글에 달린 다른 사람의 피드백만 가능하다.
create function public.check_pinned_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.pinned_comment_id is not null and not exists (
    select 1 from public.comments c
    where c.id = new.pinned_comment_id
      and c.post_id = new.id
      and c.author_id <> new.author_id
  ) then
    raise exception '이 피드백은 채택할 수 없습니다.';
  end if;
  return new;
end;
$$;

create trigger check_pinned_comment
  before update of pinned_comment_id on public.posts
  for each row execute function public.check_pinned_comment();

-- 공개 조회용 뷰 -------------------------------------------------------
-- 뷰는 소유자 권한으로 실행되므로 아래 컬럼만 외부에 노출된다.
-- 복기 상태는 작성자 본인에게만 보인다.

create view public.post_feed with (security_invoker = false) as
select
  p.id,
  p.is_anonymous,
  p.category,
  p.title,
  p.situation,
  p.mistake,
  p.self_action,
  p.tags,
  p.pinned_comment_id,
  p.created_at,
  case when p.is_anonymous then null else pr.nickname end as author_name,
  coalesce(p.author_id = auth.uid(), false) as is_mine,
  coalesce(p.author_id = auth.uid() and p.is_reviewed, false) as is_reviewed,
  (select count(*)::int from public.post_helpful h where h.post_id = p.id)
    as helpful_count,
  exists (
    select 1 from public.post_helpful h
    where h.post_id = p.id and h.user_id = auth.uid()
  ) as helped_by_me
from public.posts p
join public.profiles pr on pr.id = p.author_id;

create view public.comment_feed with (security_invoker = false) as
select
  c.id,
  c.post_id,
  c.body,
  c.created_at,
  case
    when p.is_anonymous and c.author_id = p.author_id then null
    else pr.nickname
  end as author_name,
  c.author_id = p.author_id as is_post_author,
  coalesce(c.author_id = auth.uid(), false) as is_mine
from public.comments c
join public.posts p on p.id = c.post_id
join public.profiles pr on pr.id = c.author_id;

-- 권한 -----------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_helpful enable row level security;

revoke all on public.profiles, public.posts, public.comments, public.post_helpful
  from anon, authenticated;
revoke all on public.post_feed, public.comment_feed from anon, authenticated;

grant select on public.post_feed, public.comment_feed to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (nickname) on public.profiles to authenticated;
create policy "본인 프로필 조회" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "본인 닉네임 수정" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- 대소문자만 다른 닉네임도 같은 것으로 본다.
create unique index profiles_nickname_key
  on public.profiles (lower(nickname));

-- 가입 트리거의 오류는 Auth가 일반 오류로 바꾸므로, 가입 전에 미리 확인한다.
create function public.is_nickname_available(candidate text)
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

-- 작성자와 작성일은 위조할 수 없다.
grant select on public.posts to authenticated;
grant insert (is_anonymous, category, title, situation, mistake, self_action, tags)
  on public.posts to authenticated;
grant update (
  is_anonymous, category, title, situation, mistake, self_action, tags,
  is_reviewed, pinned_comment_id
) on public.posts to authenticated;
grant delete on public.posts to authenticated;
create policy "본인 글 조회" on public.posts
  for select to authenticated using (author_id = auth.uid());
create policy "본인 글 작성" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
create policy "본인 글 수정" on public.posts
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "본인 글 삭제" on public.posts
  for delete to authenticated using (author_id = auth.uid());

grant insert (post_id, body) on public.comments to authenticated;
create policy "본인 이름으로 피드백 작성" on public.comments
  for insert to authenticated with check (author_id = auth.uid());

grant select, delete on public.post_helpful to authenticated;
grant insert (post_id) on public.post_helpful to authenticated;
create policy "본인 반응 조회" on public.post_helpful
  for select to authenticated using (user_id = auth.uid());
create policy "본인 반응 추가" on public.post_helpful
  for insert to authenticated with check (user_id = auth.uid());
create policy "본인 반응 취소" on public.post_helpful
  for delete to authenticated using (user_id = auth.uid());
