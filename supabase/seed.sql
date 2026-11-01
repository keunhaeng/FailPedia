-- 시연용 예시 글 7개를 넣는다. SQL Editor에서 한 번만 실행한다.
-- 작성자 계정(seed.*@example.com)은 미리 가입되어 있어야 한다.
-- 지우려면: delete from auth.users where email like 'seed.%@example.com';

-- '도움이 돼요' 수는 사용자별 행을 세므로, 예시 글의 기본값을 따로 둔다.
alter table public.posts
  add column if not exists seed_helpful_count integer not null default 0;

create or replace view public.post_feed with (security_invoker = false) as
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
  p.seed_helpful_count
    + (select count(*)::int from public.post_helpful h where h.post_id = p.id)
    as helpful_count,
  exists (
    select 1 from public.post_helpful h
    where h.post_id = p.id and h.user_id = auth.uid()
  ) as helped_by_me
from public.posts p
join public.profiles pr on pr.id = p.author_id;

create function pg_temp.seed_user(slug text)
returns uuid
language plpgsql
as $$
declare
  user_id uuid;
begin
  select id into user_id from auth.users
  where email = 'seed.' || slug || '@example.com';
  if user_id is null then
    raise exception '작성자 계정이 없습니다: %', slug;
  end if;
  return user_id;
end;
$$;

create function pg_temp.seed_post(
  slug text, anonymous boolean, category text, title text, situation text,
  mistake text, self_action text, tags text[], created timestamptz,
  helpful integer, reviewed boolean
)
returns uuid
language sql
as $$
  insert into public.posts (
    author_id, is_anonymous, category, title, situation, mistake, self_action,
    tags, created_at, seed_helpful_count, is_reviewed
  )
  values (
    pg_temp.seed_user(slug), anonymous, category, title, situation, mistake,
    self_action, tags, created, helpful, reviewed
  )
  returning id;
$$;

create function pg_temp.seed_comment(
  post uuid, slug text, body text, created timestamptz
)
returns uuid
language sql
as $$
  insert into public.comments (post_id, author_id, body, created_at)
  values (post, pg_temp.seed_user(slug), body, created)
  returning id;
$$;

do $seed$
declare
  post uuid;
  pinned uuid;
begin
  if exists (select 1 from public.posts where seed_helpful_count > 0) then
    raise exception '예시 글이 이미 들어가 있습니다.';
  end if;

  post := pg_temp.seed_post('me', false, '학업',
    $t$시험 범위는 친구 말이 아니라 공지에서 직접 확인해야 한다$t$,
    $t$중간고사 전날에야 시험 범위가 두 장 더 있다는 걸 알았어요$t$,
    $t$공지를 '나중에 봐야지' 하고 넘긴 뒤 친구에게 들은 범위만 믿고 공부했어요. 시험 전날 밤 11시에 강의계획서를 다시 보고 나서야 범위가 다르다는 걸 알았습니다.$t$,
    $t$공지를 바로 읽고, 친구에게 들은 범위는 강의계획서와 대조해 볼 거예요. 시험 2주 전에는 범위를 캘린더에 적어 두겠습니다.$t$,
    array['시간관리', '시험', '확인습관'], '2026-10-30 13:20+09', 12, false);
  perform pg_temp.seed_comment(post, 'u2',
    $t$저도 같은 실수를 해서 과목별로 '공지 체크' 반복 일정을 만들었어요. 매주 월요일 10분만 써도 놓치는 일이 확 줄어듭니다.$t$,
    '2026-10-30 15:02+09');
  perform pg_temp.seed_comment(post, 'u3',
    $t$남은 하루를 어떻게 썼는지도 회고에 넣어 보면 어떨까요? 위기 대응도 다음에 쓸 수 있는 자산이에요.$t$,
    '2026-10-30 18:44+09');

  post := pg_temp.seed_post('u4', false, '취업',
    $t$답변을 돌려 쓸수록 회사별 차이를 더 챙겨야 한다$t$,
    $t$1차 면접에서 지원 회사 이름을 다른 회사로 불렀어요$t$,
    $t$비슷한 직무에 동시에 지원하면서 답변을 돌려 쓰다 보니, 마지막 포부를 말할 때 경쟁사 이름이 튀어나왔어요. 면접관 표정이 굳는 게 보였습니다.$t$,
    $t$면접 전날 회사별 차이부터 정리하고, 당일 아침 핵심 키워드 3개를 소리 내어 말해 본 뒤 들어갈 거예요.$t$,
    array['면접', '말실수', '준비부족'], '2026-10-29 09:10+09', 44, false);
  pinned := pg_temp.seed_comment(post, 'me',
    $t$스크립트에 회사명을 직접 쓰지 말고 '귀사'로 통일해서 연습하면 이런 사고를 구조적으로 막을 수 있어요.$t$,
    '2026-10-29 11:30+09');
  perform pg_temp.seed_comment(post, 'u5',
    $t$저는 바로 사과하고 지원 동기를 다시 말해서 합격한 적도 있어요. 실수 직후의 대처도 연습해 두면 좋습니다.$t$,
    '2026-10-29 12:15+09');
  update public.posts set pinned_comment_id = pinned where id = post;

  post := pg_temp.seed_post('u6', true, '연애',
    $t$침묵은 기다림이 아니라 상대에게 보내는 메시지다$t$,
    $t$다툰 뒤 사흘 동안 연락을 안 하고 상대가 먼저 오길 기다렸어요$t$,
    $t$내가 먼저 연락하면 지는 것 같아서 답장을 일부러 미뤘어요. 상대는 제가 관계를 정리하려는 줄 알고 크게 상처받았습니다.$t$,
    $t$'하루만 생각하고 연락할게'라고 먼저 말한 뒤 시간을 가질 거예요. 그래야 상대도 불안하지 않았을 테니까요.$t$,
    array['대화법', '감정조절'], '2026-10-27 22:05+09', 26, false);
  perform pg_temp.seed_comment(post, 'u7',
    $t$'시간이 필요해'라고 말하는 것 자체가 큰 진전이에요. 돌아올 시점까지 함께 말하면 상대의 불안이 훨씬 줄어듭니다.$t$,
    '2026-10-28 08:40+09');

  post := pg_temp.seed_post('me', true, '관계',
    $t$글로 하는 농담에는 표정이 담기지 않는다$t$,
    $t$팀플 단톡방에서 농담으로 한 말이 팀원에게 상처가 됐어요$t$,
    $t$자료 제출이 늦은 팀원에게 분위기를 풀려고 'ㅋㅋ 역시 무임승차 장인'이라고 보냈어요. 그 팀원은 사정이 있었고, 이후로 말수가 크게 줄었습니다.$t$,
    $t$단톡방에 농담을 보내는 대신 먼저 개인적으로 사정을 물어볼 거예요.$t$,
    array['말실수', '팀플', '대화법'], '2026-10-25 20:30+09', 18, true);
  perform pg_temp.seed_comment(post, 'u8',
    $t$사과는 단톡방에서도 한 번 해 주세요. 공개적으로 한 말은 공개적으로 거두는 게 팀원의 체면을 살려 줍니다.$t$,
    '2026-10-26 09:20+09');
  perform pg_temp.seed_comment(post, 'u9',
    $t$저는 보내기 전에 '이 말을 얼굴 보고도 할 수 있나?'를 체크해요. 3초만 멈춰도 많이 달라집니다.$t$,
    '2026-10-26 13:05+09');

  post := pg_temp.seed_post('u10', false, '기타',
    $t$고정 지출은 기억이 아니라 시스템으로 관리해야 한다$t$,
    $t$자동이체 잔액 부족으로 월세가 밀린 걸 집주인 연락으로 알았어요$t$,
    $t$카드값 빠지는 날을 착각해서 계좌에 돈이 모자랐는데, 알림을 꺼 둔 탓에 일주일 동안 몰랐습니다.$t$,
    $t$고정 지출을 월급날 다음 날로 옮겨 두고, 이체 실패 알림은 켜 둘 거예요.$t$,
    array['돈관리', '자취'], '2026-10-22 10:00+09', 35, false);
  pinned := pg_temp.seed_comment(post, 'u11',
    $t$고정 지출 전용 통장을 따로 두면 더 안전해요. 월급날 그 통장으로 한 번에 옮겨 두면 끝입니다.$t$,
    '2026-10-22 12:12+09');
  update public.posts set pinned_comment_id = pinned where id = post;

  post := pg_temp.seed_post('u12', false, '취업',
    $t$모르면 숨기지 말고 일찍 확인받는 게 모두의 시간을 아낀다$t$,
    $t$인턴 첫 주에 모르는 걸 숨기다가 일을 이틀 날렸어요$t$,
    $t$질문하면 못해 보일까 봐 혼자 해결하려다 요구사항을 잘못 이해한 채로 작업했습니다. 다 만든 뒤에야 방향이 틀렸다는 걸 알았어요.$t$,
    $t$30분 고민해도 안 풀리면 시도한 내용을 정리해서 질문하고, 시작 전에 이해한 내용을 한 줄로 확인받을 거예요.$t$,
    array['인턴', '커뮤니케이션'], '2026-10-18 17:45+09', 52, false);
  perform pg_temp.seed_comment(post, 'me',
    $t$'제가 이해한 건 이건데 맞을까요?' 한 문장이 진짜 강력하더라고요. 질문이 아니라 확인이라 부담도 적어요.$t$,
    '2026-10-18 20:10+09');
  perform pg_temp.seed_comment(post, 'u13',
    $t$첫 주에는 질문이 곧 일이라고 생각해도 됩니다. 사수도 그걸 기대하고 있어요.$t$,
    '2026-10-19 09:00+09');

  perform pg_temp.seed_post('u14', true, '학업',
    $t$마감은 날짜뿐 아니라 시간까지 확인해야 한다$t$,
    $t$과제 마감을 오후 11시 59분으로 착각해 제출을 놓쳤어요$t$,
    $t$마감이 정오였는데 늘 자정이라고 생각해서 시간을 확인하지 않았고, 저녁에 제출하려다 시스템이 닫힌 걸 봤습니다.$t$,
    $t$강의 공지에서 마감 시간을 확인하고, 하루 앞서 알림을 맞춰 둘 거예요.$t$,
    array['시간관리', '과제'], '2026-10-12 19:25+09', 9, false);
end;
$seed$;
