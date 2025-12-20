import { createClient } from './server'
import { logError } from '@/lib/logger'

export type RelatedEntry = {
  id: string
  title: string
  content: string
  created_at: string
  similarity: number
}

export async function getRelatedEntries(
  entryId: string,
  limit: number = 3
): Promise<RelatedEntry[]> {
  const supabase = await createClient()

  // First, get the current entry's embedding
  const { data: currentEntry } = await supabase
    .from('entries')
    .select('embedding')
    .eq('id', entryId)
    .single()

  if (!currentEntry?.embedding) {
    return []
  }

  // Query for similar entries using cosine similarity
  // The <=> operator returns cosine distance (lower is more similar)
  // We convert it to similarity score (1 - distance) for better UX
  const { data, error } = await supabase.rpc('match_entries', {
    query_embedding: currentEntry.embedding,
    match_threshold: 0.5,
    match_count: limit + 1, // +1 to account for the current entry
    exclude_id: entryId,
  })

  if (error) {
    logError(
      new Error(error.message),
      'Error fetching related entries via vector similarity',
      { entryId, limit, errorCode: error.code }
    )
    return []
  }

  return (data || []).slice(0, limit)
}
