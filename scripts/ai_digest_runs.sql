create table if not exists public.ai_digest_runs (
  id uuid default gen_random_uuid() primary key,
  run_date date not null,
  status text not null,
  mode text not null,
  trigger_type text not null,
  triggered_by text,
  item_count integer default 0,
  post_slug text,
  error_message text,
  source_results jsonb default '[]'::jsonb,
  started_at timestamptz default now(),
  finished_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_ai_digest_runs_run_date
  on public.ai_digest_runs(run_date);

create index if not exists idx_ai_digest_runs_created_at
  on public.ai_digest_runs(created_at desc);

alter table public.ai_digest_runs enable row level security;

drop policy if exists "Authenticated users can view digest runs" on public.ai_digest_runs;
create policy "Authenticated users can view digest runs"
  on public.ai_digest_runs
  for select
  using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert digest runs" on public.ai_digest_runs;
create policy "Authenticated users can insert digest runs"
  on public.ai_digest_runs
  for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update digest runs" on public.ai_digest_runs;
create policy "Authenticated users can update digest runs"
  on public.ai_digest_runs
  for update
  using (auth.role() = 'authenticated');
