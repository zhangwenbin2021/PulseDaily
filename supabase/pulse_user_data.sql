-- Create per-user storage for PulseDaily cloud sync
create table if not exists public.pulse_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  habits_data jsonb not null,
  reminders_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pulse_user_data enable row level security;

create policy "Users can read own data" on public.pulse_user_data
  for select using (auth.uid() = user_id);

create policy "Users can insert own data" on public.pulse_user_data
  for insert with check (auth.uid() = user_id);

create policy "Users can update own data" on public.pulse_user_data
  for update using (auth.uid() = user_id);

create policy "Users can delete own data" on public.pulse_user_data
  for delete using (auth.uid() = user_id);