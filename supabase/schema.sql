-- Create entries table
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  content text not null
);

-- Enable Row Level Security
alter table public.entries enable row level security;

-- Create policy to allow all operations (for now - you can restrict this later)
create policy "Enable all operations for all users"
  on public.entries
  for all
  using (true)
  with check (true);
