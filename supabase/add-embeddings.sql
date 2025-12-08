-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding column to entries table
-- voyage-3-lite produces 512-dimensional embeddings
alter table public.entries
add column if not exists embedding vector(512);

-- Create an index for vector similarity search (using cosine distance)
create index if not exists entries_embedding_idx
on public.entries
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
