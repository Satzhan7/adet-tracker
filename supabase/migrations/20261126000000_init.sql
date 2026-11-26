-- Әдет трекер: initial schema.
-- One day = one row in `days`. Enum values match the Excel template lists
-- (Adet-tracker-shablon.xlsx → «Тізімдер»), so imports map 1:1.
-- NULL in any status column = «белгіленбеген» (not marked, shown grey).

-- ─── Enums ───────────────────────────────────────────────────────────────
create type public.fard_status     as enum ('уақытында', 'мешітте', 'қаза', 'өтелді');
create type public.nafl_status     as enum ('оқылды', 'оқылмады');
create type public.witr_status     as enum ('уақытында', 'қаза', 'өтелді');
create type public.dhikr_status    as enum ('орындалды', 'ішінара', 'жоқ');
create type public.wird_status     as enum ('оқыдым', 'ішінара', 'жоқ');
create type public.creatine_status as enum ('5 г', '6 капсула', '3 капсула', 'өткізілді');
create type public.protein_status  as enum ('іштім', 'жоқ');
create type public.fast_status     as enum ('ұстадым', 'ұстамадым', 'қаза болды', 'қаза өтедім');
create type public.theme_mode      as enum ('dark', 'light');

-- ─── Shared helpers ──────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ─── Allowlist (sign-up is closed) ───────────────────────────────────────
-- Only emails listed here can create an account (Google or magic link).
-- RLS on with no policies → invisible to anon/authenticated; managed via
-- SQL editor / service role only.
create table public.allowed_emails (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.allowed_emails enable row level security;

create function public.enforce_email_allowlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null
     or not exists (select 1 from public.allowed_emails a where a.email = lower(new.email)) then
    raise exception 'email_not_allowed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger enforce_email_allowlist
  before insert on auth.users
  for each row execute function public.enforce_email_allowlist();

-- ─── profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  theme      public.theme_mode not null default 'dark',
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── days ────────────────────────────────────────────────────────────────
-- `date` is the local calendar day (Asia/Almaty), never a timestamp.
create table public.days (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date          date not null,
  -- fard
  tan           public.fard_status,
  besin         public.fard_status,
  asr           public.fard_status,
  sham          public.fard_status,
  quptan        public.fard_status,
  -- witr / nafl
  utir          public.witr_status,
  tungi         public.nafl_status,
  duha          public.nafl_status,
  -- dhikr
  dhikr_morning public.dhikr_status,
  dhikr_evening public.dhikr_status,
  -- Quran wird (design v2: two separate items)
  wird_taha     public.wird_status,  -- Тоһа · таңда
  wird_amana    public.wird_status,  -- Әмәнәр расул · шамнан кейін
  -- health
  creatine      public.creatine_status,
  protein       public.protein_status,
  -- fasting
  oraza         public.fast_status,
  updated_at    timestamptz not null default now(),
  primary key (user_id, date)
);

create trigger days_updated_at
  before update on public.days
  for each row execute function public.set_updated_at();

-- ─── notes ───────────────────────────────────────────────────────────────
create table public.notes (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date       date not null,
  text       text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ─── khatm_log ───────────────────────────────────────────────────────────
create table public.khatm_log (
  id        bigint generated always as identity primary key,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date      date not null,
  pages     integer not null check (pages >= 0),
  from_page integer check (from_page between 1 and 604),
  to_page   integer check (to_page between 1 and 604),
  check (from_page is null or to_page is null or to_page >= from_page)
);
create index khatm_log_user_date on public.khatm_log (user_id, date);

-- ─── hifz_log ────────────────────────────────────────────────────────────
-- `date` nullable: the 2026 Хифз sheet has 24 entries without dates.
create table public.hifz_log (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date        date,
  surah       text not null,
  repetitions integer not null check (repetitions >= 0)
);
create index hifz_log_user_date on public.hifz_log (user_id, date);

-- ─── imports ─────────────────────────────────────────────────────────────
create table public.imports (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_name  text not null,
  rows_ok    integer not null default 0,
  rows_err   integer not null default 0,
  errors     jsonb not null default '[]'::jsonb,  -- [{row, reason}]
  created_at timestamptz not null default now()
);

-- ─── RLS: every row belongs to its owner ─────────────────────────────────
alter table public.profiles  enable row level security;
alter table public.days      enable row level security;
alter table public.notes     enable row level security;
alter table public.khatm_log enable row level security;
alter table public.hifz_log  enable row level security;
alter table public.imports   enable row level security;

create policy "own profile: select" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own rows" on public.days
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.notes
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.khatm_log
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.hifz_log
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.imports
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
