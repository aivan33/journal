-- Upgrade from voyage-3-lite (512 dims) to voyage-3 (1024 dims)

-- Drop the existing index
drop index if exists entries_embedding_idx;

-- Drop the old embedding column
alter table public.entries
drop column if exists embedding;

-- Add new embedding column with 1024 dimensions
alter table public.entries
add column embedding vector(1024);

-- Recreate the index for vector similarity search
create index entries_embedding_idx
on public.entries
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
