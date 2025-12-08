-- Create a function to match similar entries using vector similarity
create or replace function match_entries(
  query_embedding vector(1024),
  match_threshold float default 0.5,
  match_count int default 3,
  exclude_id uuid default null
)
returns table (
  id uuid,
  title text,
  content text,
  created_at timestamp with time zone,
  similarity float
)
language sql stable
as $$
  select
    entries.id,
    entries.title,
    entries.content,
    entries.created_at,
    1 - (entries.embedding <=> query_embedding) as similarity
  from entries
  where
    entries.embedding is not null
    and (exclude_id is null or entries.id != exclude_id)
    and 1 - (entries.embedding <=> query_embedding) > match_threshold
  order by entries.embedding <=> query_embedding
  limit match_count;
$$;
