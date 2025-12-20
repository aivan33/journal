import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addEntry, updateEntry, deleteEntry } from '../actions'
import * as supabaseServer from '@/lib/supabase/server'
import * as embeddings from '@/lib/ai/embeddings'
import { mockSuccessfulQuery, mockFailedQuery } from '@/test/utils/mock-supabase'
import { createFormData } from '@/test/utils/test-helpers'
import { createMockEmbedding } from '@/test/utils/mock-voyage'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/ai/embeddings')
vi.mock('next/cache')

describe('Entry Actions', () => {
  let mockSupabaseClient: any
  const mockEmbedding = createMockEmbedding()

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a fresh mock client with proper chaining for each test
    mockSupabaseClient = {
      from: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
      single: vi.fn(),
      eq: vi.fn(),
    }

    // Set up method chaining - each method returns the mock itself
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient)
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient)

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient)
    vi.mocked(embeddings.generateEntryEmbedding).mockResolvedValue(mockEmbedding)
  })

  describe('addEntry', () => {
    it('creates entry with embedding and no tasks', async () => {
      mockSupabaseClient.single.mockResolvedValue(
        mockSuccessfulQuery({ id: 'entry-123', title: 'Test', content: 'Content' })
      )

      const formData = createFormData({
        title: 'Test Entry',
        content: 'This is a test entry without tasks',
      })

      const result = await addEntry(formData)

      expect(result).toEqual({ success: true })
      expect(embeddings.generateEntryEmbedding).toHaveBeenCalledWith(
        'Test Entry',
        'This is a test entry without tasks'
      )
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        title: 'Test Entry',
        content: 'This is a test entry without tasks',
        embedding: mockEmbedding,
      })
    })

    it('completes successfully with task extraction syntax in content', async () => {
      // Note: Full task extraction logic is tested in integration tests
      // This unit test verifies the entry is created successfully
      mockSupabaseClient.single.mockResolvedValue(
        mockSuccessfulQuery({
          id: 'entry-456',
          title: 'Daily Log',
          content: 'Need to [call doctor] and [buy milk]',
        })
      )

      const formData = createFormData({
        title: 'Daily Log',
        content: 'Need to [call doctor] and [buy milk]',
      })

      const result = await addEntry(formData)

      // Verify entry creation succeeded
      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Daily Log',
          content: 'Need to [call doctor] and [buy milk]',
        })
      )
    })

    it('handles content with existing task markers', async () => {
      // Note: Duplicate prevention logic is tested in integration tests
      mockSupabaseClient.single.mockResolvedValue(
        mockSuccessfulQuery({
          id: 'entry-789',
          title: 'Update',
          content: '[existing task]',
        })
      )

      const formData = createFormData({
        title: 'Update',
        content: '[existing task]',
      })

      const result = await addEntry(formData)

      // Verify entry creation succeeded
      expect(result).toEqual({ success: true })
    })

    it('saves entry without embedding when embedding generation fails', async () => {
      vi.mocked(embeddings.generateEntryEmbedding).mockRejectedValue(
        new Error('API rate limit exceeded')
      )

      mockSupabaseClient.single.mockResolvedValue(
        mockSuccessfulQuery({ id: 'entry-999', title: 'Fallback', content: 'Test' })
      )

      const formData = createFormData({
        title: 'Fallback Entry',
        content: 'Should save without embedding',
      })

      const result = await addEntry(formData)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        title: 'Fallback Entry',
        content: 'Should save without embedding',
        // No embedding field
      })
    })

    it('returns error when title is missing', async () => {
      const formData = createFormData({
        title: '',
        content: 'Some content',
      })

      const result = await addEntry(formData)

      expect(result).toEqual({ error: 'Title and content are required' })
      expect(embeddings.generateEntryEmbedding).not.toHaveBeenCalled()
    })

    it('returns error when content is missing', async () => {
      const formData = createFormData({
        title: 'Title',
        content: '',
      })

      const result = await addEntry(formData)

      expect(result).toEqual({ error: 'Title and content are required' })
      expect(embeddings.generateEntryEmbedding).not.toHaveBeenCalled()
    })

    it('returns error when database insertion fails', async () => {
      mockSupabaseClient.single.mockResolvedValue(
        mockFailedQuery('Database connection error')
      )

      const formData = createFormData({
        title: 'Test',
        content: 'Test content',
      })

      const result = await addEntry(formData)

      expect(result).toEqual({ error: 'Database connection error' })
    })

    it('calls revalidatePath for home and todo pages', async () => {
      mockSupabaseClient.single.mockResolvedValue(
        mockSuccessfulQuery({ id: 'entry-abc', title: 'Test', content: 'Test' })
      )

      const { revalidatePath } = await import('next/cache')

      const formData = createFormData({
        title: 'Test',
        content: 'Test',
      })

      await addEntry(formData)

      expect(revalidatePath).toHaveBeenCalledWith('/')
      expect(revalidatePath).toHaveBeenCalledWith('/todo')
    })
  })

  describe('updateEntry', () => {
    it('updates entry with new embedding', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const formData = createFormData({
        title: 'Updated Title',
        content: 'Updated content',
      })

      const result = await updateEntry('entry-123', formData)

      expect(result).toEqual({ success: true })
      expect(embeddings.generateEntryEmbedding).toHaveBeenCalledWith(
        'Updated Title',
        'Updated content'
      )
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        title: 'Updated Title',
        content: 'Updated content',
        embedding: mockEmbedding,
      })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'entry-123')
    })

    it('updates entry with task extraction syntax in content', async () => {
      // Note: Task extraction logic is tested in integration tests
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const formData = createFormData({
        title: 'Updated',
        content: 'New task: [important meeting]',
      })

      const result = await updateEntry('entry-123', formData)

      // Verify update succeeded
      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated',
          content: 'New task: [important meeting]',
        })
      )
    })

    it('updates entry without embedding when generation fails', async () => {
      vi.mocked(embeddings.generateEntryEmbedding).mockRejectedValue(
        new Error('API error')
      )

      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const formData = createFormData({
        title: 'Updated',
        content: 'Updated',
      })

      const result = await updateEntry('entry-123', formData)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        title: 'Updated',
        content: 'Updated',
        // No embedding
      })
    })

    it('returns error when title is missing', async () => {
      const formData = createFormData({
        title: '',
        content: 'Content',
      })

      const result = await updateEntry('entry-123', formData)

      expect(result).toEqual({ error: 'Title and content are required' })
    })

    it('returns error when database update fails', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockFailedQuery('Update failed'))

      const formData = createFormData({
        title: 'Test',
        content: 'Test',
      })

      const result = await updateEntry('entry-123', formData)

      expect(result).toEqual({ error: 'Update failed' })
    })

    it('calls revalidatePath for entry, home, and todo pages', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const { revalidatePath } = await import('next/cache')

      const formData = createFormData({
        title: 'Test',
        content: 'Test',
      })

      await updateEntry('entry-456', formData)

      expect(revalidatePath).toHaveBeenCalledWith('/entries/entry-456')
      expect(revalidatePath).toHaveBeenCalledWith('/')
      expect(revalidatePath).toHaveBeenCalledWith('/todo')
    })
  })

  describe('deleteEntry', () => {
    it('deletes an entry', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const result = await deleteEntry('entry-789')

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('entries')
      expect(mockSupabaseClient.delete).toHaveBeenCalled()
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'entry-789')
    })

    it('returns error when database deletion fails', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockFailedQuery('Deletion failed'))

      const result = await deleteEntry('entry-789')

      expect(result).toEqual({ error: 'Deletion failed' })
    })

    it('calls revalidatePath for home page', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const { revalidatePath } = await import('next/cache')

      await deleteEntry('entry-789')

      expect(revalidatePath).toHaveBeenCalledWith('/')
    })
  })

  // Note: Task extraction logic ([bracket] syntax) is comprehensively tested
  // in integration tests with a real database. Unit tests focus on entry CRUD operations.
})

