-- Create tasks table
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  completed boolean default false not null,
  due_date date,
  archived boolean default false not null,
  entry_id uuid references public.entries(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on entry_id for faster lookups
create index if not exists tasks_entry_id_idx on public.tasks(entry_id);

-- Create index on archived for filtering active/archived tasks
create index if not exists tasks_archived_idx on public.tasks(archived);

-- Enable Row Level Security (RLS)
alter table public.tasks enable row level security;

-- Create policy to allow authenticated users to read their own tasks
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() is not null);

-- Create policy to allow authenticated users to insert their own tasks
create policy "Users can create their own tasks"
  on public.tasks for insert
  with check (auth.uid() is not null);

-- Create policy to allow authenticated users to update their own tasks
create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() is not null);

-- Create policy to allow authenticated users to delete their own tasks
create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() is not null);

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to call the function before update
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();
