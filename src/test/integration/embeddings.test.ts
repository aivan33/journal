import { describe, it, expect, beforeEach } from 'vitest'
import { getTestClient, createTestEntry, clearDatabase } from './setup'

describe('Embeddings Integration Tests', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  describe('Embedding Storage', () => {
    it('stores a 1024-dimensional embedding vector', async () => {
      const client = getTestClient()

      // Create embedding (1024 dimensions for voyage-3)
      const embedding = Array.from({ length: 1024 }, (_, i) => i / 1024)

      const { data, error } = await client
        .from('entries')
        .insert({
          title: 'Entry with Embedding',
          content: 'Content with embedding',
          embedding: embedding,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.embedding).toBeDefined()
      expect(data?.embedding).toHaveLength(1024)
      expect(data?.embedding?.[0]).toBeCloseTo(0, 3)
      expect(data?.embedding?.[1023]).toBeCloseTo(1023 / 1024, 3)
    })

    it('stores entries without embeddings (null)', async () => {
      const client = getTestClient()

      const { data, error } = await client
        .from('entries')
        .insert({
          title: 'Entry without Embedding',
          content: 'No embedding',
          embedding: null,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.embedding).toBeNull()
    })

    it('updates embedding on existing entry', async () => {
      const entry = await createTestEntry({
        title: 'Original Entry',
        content: 'Original content',
        embedding: null,
      })

      const client = getTestClient()
      const newEmbedding = Array.from({ length: 1024 }, () => 0.5)

      const { data, error } = await client
        .from('entries')
        .update({ embedding: newEmbedding })
        .eq('id', entry.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.embedding).toBeDefined()
      expect(data?.embedding).toHaveLength(1024)
      expect(data?.embedding?.[0]).toBeCloseTo(0.5, 3)
    })

    it('replaces existing embedding with new one', async () => {
      const oldEmbedding = Array.from({ length: 1024 }, () => 0.3)
      const entry = await createTestEntry({
        title: 'Entry',
        content: 'Content',
        embedding: oldEmbedding,
      })

      const client = getTestClient()
      const newEmbedding = Array.from({ length: 1024 }, () => 0.7)

      const { data, error } = await client
        .from('entries')
        .update({ embedding: newEmbedding })
        .eq('id', entry.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.embedding?.[0]).toBeCloseTo(0.7, 3)
      expect(data?.embedding?.[0]).not.toBeCloseTo(0.3, 3)
    })
  })

  describe('Vector Similarity Search', () => {
    it('finds similar entries using cosine similarity', async () => {
      const client = getTestClient()

      // Create embeddings that are similar and different
      const baseEmbedding = Array.from({ length: 1024 }, () => 0.5)

      // Similar embedding (small difference)
      const similarEmbedding = baseEmbedding.map((val, i) =>
        i < 100 ? val + 0.1 : val
      )

      // Different embedding (large difference)
      const differentEmbedding = Array.from({ length: 1024 }, () => 0.9)

      // Create entries
      const entry1 = await createTestEntry({
        title: 'AI and Machine Learning',
        content: 'Deep learning neural networks',
        embedding: baseEmbedding,
      })

      await createTestEntry({
        title: 'Artificial Intelligence',
        content: 'Neural networks and ML',
        embedding: similarEmbedding,
      })

      await createTestEntry({
        title: 'Cooking Pasta',
        content: 'Boil water and add pasta',
        embedding: differentEmbedding,
      })

      // Search for similar entries
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: baseEmbedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBeGreaterThan(0)

      // First result should be the similar AI entry
      expect(data[0].title).toContain('Artificial Intelligence')
      expect(data[0].similarity).toBeGreaterThan(0.8) // High similarity
    })

    it('excludes the query entry from results', async () => {
      const client = getTestClient()

      const embedding = Array.from({ length: 1024 }, () => 0.5)

      const entry1 = await createTestEntry({
        title: 'Entry 1',
        content: 'Content',
        embedding: embedding,
      })

      await createTestEntry({
        title: 'Entry 2',
        content: 'Content',
        embedding: embedding,
      })

      // Search and exclude entry1
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()

      // entry1 should not be in results
      const foundEntry1 = data.find((e: any) => e.id === entry1.id)
      expect(foundEntry1).toBeUndefined()
    })

    it('respects match_threshold parameter', async () => {
      const client = getTestClient()

      const embedding1 = Array.from({ length: 1024 }, () => 0.5)
      const embedding2 = Array.from({ length: 1024 }, () => 0.9) // Very different

      const entry1 = await createTestEntry({
        title: 'Entry 1',
        content: 'Content',
        embedding: embedding1,
      })

      await createTestEntry({
        title: 'Entry 2',
        content: 'Different content',
        embedding: embedding2,
      })

      // High threshold (0.95) should exclude dissimilar entries
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding1,
        match_threshold: 0.95,
        match_count: 10,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBe(0) // No results above 0.95 similarity
    })

    it('respects match_count parameter', async () => {
      const client = getTestClient()

      const embedding = Array.from({ length: 1024 }, () => 0.5)

      // Create 5 similar entries
      const entry1 = await createTestEntry({
        title: 'Entry 1',
        content: 'Content',
        embedding: embedding,
      })

      for (let i = 2; i <= 5; i++) {
        await createTestEntry({
          title: `Entry ${i}`,
          content: 'Content',
          embedding: embedding,
        })
      }

      // Limit to 2 results
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 2,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBeLessThanOrEqual(2)
    })

    it('returns empty array when no similar entries exist', async () => {
      const client = getTestClient()

      const embedding = Array.from({ length: 1024 }, () => 0.5)

      const entry = await createTestEntry({
        title: 'Only Entry',
        content: 'Content',
        embedding: embedding,
      })

      // Search but exclude the only entry
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBe(0)
    })

    it('handles entries without embeddings gracefully', async () => {
      const client = getTestClient()

      const embedding = Array.from({ length: 1024 }, () => 0.5)

      const entry1 = await createTestEntry({
        title: 'Entry with Embedding',
        content: 'Content',
        embedding: embedding,
      })

      // Create entry without embedding
      await createTestEntry({
        title: 'Entry without Embedding',
        content: 'No embedding',
        embedding: null,
      })

      // Search should work and skip entries without embeddings
      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      // Should not crash, entries without embeddings are excluded
    })
  })

  describe('Similarity Ranking', () => {
    it('orders results by similarity (highest first)', async () => {
      const client = getTestClient()

      // Base embedding
      const baseEmbedding = Array.from({ length: 1024 }, () => 0.5)

      // Very similar (only first 10 values different by 0.05)
      const verySimilar = baseEmbedding.map((val, i) => (i < 10 ? val + 0.05 : val))

      // Somewhat similar (first 100 values different by 0.1)
      const somewhatSimilar = baseEmbedding.map((val, i) =>
        i < 100 ? val + 0.1 : val
      )

      // Less similar (first 200 values different by 0.2)
      const lessSimilar = baseEmbedding.map((val, i) => (i < 200 ? val + 0.2 : val))

      const entry1 = await createTestEntry({
        title: 'Base Entry',
        content: 'Base content',
        embedding: baseEmbedding,
      })

      await createTestEntry({
        title: 'Less Similar',
        content: 'Content',
        embedding: lessSimilar,
      })

      await createTestEntry({
        title: 'Very Similar',
        content: 'Content',
        embedding: verySimilar,
      })

      await createTestEntry({
        title: 'Somewhat Similar',
        content: 'Content',
        embedding: somewhatSimilar,
      })

      const { data, error } = await client.rpc('match_entries', {
        query_embedding: baseEmbedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.length).toBe(3)

      // Results should be ordered by similarity (descending)
      expect(data[0].title).toBe('Very Similar')
      expect(data[1].title).toBe('Somewhat Similar')
      expect(data[2].title).toBe('Less Similar')

      // Verify similarity scores are in descending order
      expect(data[0].similarity).toBeGreaterThan(data[1].similarity)
      expect(data[1].similarity).toBeGreaterThan(data[2].similarity)
    })

    it('includes similarity score in results', async () => {
      const client = getTestClient()

      const embedding = Array.from({ length: 1024 }, () => 0.5)

      const entry1 = await createTestEntry({
        title: 'Entry 1',
        content: 'Content',
        embedding: embedding,
      })

      await createTestEntry({
        title: 'Entry 2',
        content: 'Content',
        embedding: embedding, // Identical embedding
      })

      const { data, error } = await client.rpc('match_entries', {
        query_embedding: embedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry1.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data[0].similarity).toBeDefined()
      expect(typeof data[0].similarity).toBe('number')
      expect(data[0].similarity).toBeGreaterThan(0.99) // Almost identical
      expect(data[0].similarity).toBeLessThanOrEqual(1)
    })
  })

  describe('Edge Cases', () => {
    it('handles zero vector gracefully', async () => {
      const client = getTestClient()

      const zeroEmbedding = Array.from({ length: 1024 }, () => 0)

      const entry = await createTestEntry({
        title: 'Zero Embedding',
        content: 'Content',
        embedding: zeroEmbedding,
      })

      const { data, error } = await client.rpc('match_entries', {
        query_embedding: zeroEmbedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry.id,
      })

      // Should not error
      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('handles negative values in embeddings', async () => {
      const client = getTestClient()

      const negativeEmbedding = Array.from({ length: 1024 }, () => -0.5)

      const { data, error } = await client
        .from('entries')
        .insert({
          title: 'Negative Embedding',
          content: 'Content',
          embedding: negativeEmbedding,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.embedding?.[0]).toBeCloseTo(-0.5, 3)
    })

    it('handles mixed positive and negative values', async () => {
      const client = getTestClient()

      const mixedEmbedding = Array.from({ length: 1024 }, (_, i) =>
        i % 2 === 0 ? 0.5 : -0.5
      )

      const entry = await createTestEntry({
        title: 'Mixed Embedding',
        content: 'Content',
        embedding: mixedEmbedding,
      })

      const { data, error } = await client.rpc('match_entries', {
        query_embedding: mixedEmbedding,
        match_threshold: 0.1,
        match_count: 10,
        exclude_id: entry.id,
      })

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })
  })
})
