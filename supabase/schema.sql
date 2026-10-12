-- RecApp schema. Paste into Supabase → SQL Editor → Run.
-- Timestamps are epoch milliseconds (bigint) to match the client.

create table if not exists public.decks (
  id         uuid primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null check (char_length(name) between 1 and 200),
  created_at bigint not null,
  unique (id, user_id)
);

create table if not exists public.cards (
  id            uuid primary key,
  user_id       uuid not null default auth.uid() references auth.users on delete cascade,
  deck_id       uuid not null,
  front         text not null check (char_length(front) <= 10000),
  back          text not null check (char_length(back) <= 10000),
  ease          real not null default 2.5,
  interval_days integer not null default 0,
  reps          integer not null default 0,
  lapses        integer not null default 0,
  due           bigint not null,
  last_review   bigint,
  created_at    bigint not null,
  updated_at    bigint not null,
  -- Composite key so a card can only belong to a deck owned by the same user.
  foreign key (deck_id, user_id) references public.decks (id, user_id) on delete cascade
);

create index if not exists cards_user_deck_idx on public.cards (user_id, deck_id);

alter table public.decks enable row level security;
alter table public.cards enable row level security;

drop policy if exists "Users manage their own decks" on public.decks;
create policy "Users manage their own decks" on public.decks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own cards" on public.cards;
create policy "Users manage their own cards" on public.cards
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.decks, public.cards to authenticated;
