-- מעשר כספים: טבלאות + הרשאות גישה (RLS) כך שכל משתמש רואה ושומר רק את הנתונים שלו

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense','giving')),
  date_iso date not null,
  amount numeric not null check (amount > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists entries_user_id_idx on public.entries(user_id);

alter table public.entries enable row level security;

create policy "select own entries" on public.entries
  for select using (auth.uid() = user_id);
create policy "insert own entries" on public.entries
  for insert with check (auth.uid() = user_id);
create policy "update own entries" on public.entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own entries" on public.entries
  for delete using (auth.uid() = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  percent numeric not null default 10,
  calendar text not null default 'hebrew',
  last_backup timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "select own settings" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "insert own settings" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "update own settings" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
