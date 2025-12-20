import { describe, it, expect, beforeEach } from 'vitest'
import { getTestClient, createTestEntry, clearDatabase } from './setup'

describe('Entries Integration Tests', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  describe('Entry CRUD Operations', () => {
    it('creates an entry with title and content', async () => {
      const client = getTestClient()

      const { data, error } = await client
        .from('entries')
        .insert({
          title: 'Integration Test Entry',
          content: 'This is created by an integration test',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.title).toBe('Integration Test Entry')
      expect(data?.content).toBe('This is created by an integration test')
      expect(data?.id).toBeDefined()
      expect(data?.created_at).toBeDefined()
    })

    it('retrieves entries from database', async () => {
      const client = getTestClient()

      // Create test entries
      await createTestEntry({ title: 'Entry 1', content: 'Content 1' })
      await createTestEntry({ title: 'Entry 2', content: 'Content 2' })

      const { data, error } = await client
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.length).toBeGreaterThanOrEqual(2)
    })

    it('updates an entry', async () => {
      const client = getTestClient()

      // Create entry
      const entry = await createTestEntry({
        title: 'Original Title',
        content: 'Original Content',
      })

      // Update entry
      const { data, error } = await client
        .from('entries')
        .update({
          title: 'Updated Title',
          content: 'Updated Content',
        })
        .eq('id', entry.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.title).toBe('Updated Title')
      expect(data?.content).toBe('Updated Content')
    })

    it('deletes an entry', async () => {
      const client = getTestClient()

      // Create entry
      const entry = await createTestEntry({
        title: 'To Delete',
        content: 'Will be deleted',
      })

      // Delete entry
      const { error: deleteError } = await client.from('entries').delete().eq('id', entry.id)

      expect(deleteError).toBeNull()

      // Verify deletion
      const { data, error: fetchError } = await client
        .from('entries')
        .select()
        .eq('id', entry.id)
        .maybeSingle()

      expect(fetchError).toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('Entry Embeddings', () => {
    it('stores embedding vectors', async () => {
      const client = getTestClient()

      // Create a test embedding (1024 dimensions for voyage-3)
      const testEmbedding = Array.from({ length: 1024 }, (_, i) => i / 1024)

      const { data, error } = await client
        .from('entries')
        .insert({
          title: 'Entry with Embedding',
          content: 'Content',
          embedding: testEmbedding,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.embedding).toBeDefined()
      expect(data?.embedding).toHaveLength(1024)
    })

    it('finds similar entries using vector similarity', async () => {
      const client = getTestClient()

      // Create test embeddings (simplified for testing)
      const embedding1 = Array.from({ length: 1024 }, () => 0.5)
      const embedding2 = Array.from({ length: 1024 }, () => 0.5)
      const embedding3 = Array.from({ length: 1024 }, () => 0.9)

      // Create entries with embeddings
      const entry1 = await createTestEntry({
        title: 'Similar Entry 1',
        content: 'About AI and machine learning',
        embedding: embedding1,
      })

      await createTestEntry({
        title: 'Similar Entry 2',
        content: 'About artificial intelligence',
        embedding: embedding2,
      })

      await createTestEntry({
        title: 'Different Entry',
        content: 'About cooking recipes',
        embedding: embedding3,
      })

      // Use the match_entries RPC function to find similar entries
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding1,
        match_threshold: 0.1,
        match_count: 5,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      // Should find at least one similar entry
      expect(data.length).toBeGreaterThan(0)
    })
  })

  describe('Entry Validation', () => {
    it('requires title field', async () => {
      const client = getTestClient()

      const { data, error } = await client
        .from('entries')
        .insert({
          content: 'Content without title',
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('requires content field', async () => {
      const client = getTestClient()

      const { data, error } = await client
        .from('entries')
        .insert({
          title: 'Title without content',
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })
  })
})
