import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addTodo, toggleTodo, archiveTodo } from '../actions'
import * as supabaseServer from '@/lib/supabase/server'
import { mockSuccessfulQuery, mockFailedQuery } from '@/test/utils/mock-supabase'
import { createFormData } from '@/test/utils/test-helpers'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('next/cache')

describe('Todo Actions', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create a fresh mock client for each test
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    vi.mocked(supabaseServer.createClient).mockResolvedValue(mockSupabaseClient)
  })

  describe('addTodo', () => {
    it('creates a new todo with content only', async () => {
      mockSupabaseClient.insert.mockResolvedValue(mockSuccessfulQuery(null))

      const formData = createFormData({
        content: 'Buy groceries',
        due_date: '',
      })

      const result = await addTodo(formData)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        content: 'Buy groceries',
        due_date: null,
        completed: false,
        archived: false,
      })
    })

    it('creates a new todo with content and due date', async () => {
      mockSupabaseClient.insert.mockResolvedValue(mockSuccessfulQuery(null))

      const formData = createFormData({
        content: 'Call dentist',
        due_date: '2025-12-25',
      })

      const result = await addTodo(formData)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        content: 'Call dentist',
        due_date: '2025-12-25',
        completed: false,
        archived: false,
      })
    })

    it('returns error when content is missing', async () => {
      const formData = createFormData({
        content: '',
        due_date: '2025-12-25',
      })

      const result = await addTodo(formData)

      expect(result).toEqual({ error: 'Content is required' })
      expect(mockSupabaseClient.insert).not.toHaveBeenCalled()
    })

    it('returns error when database insertion fails', async () => {
      mockSupabaseClient.insert.mockResolvedValue(
        mockFailedQuery('Database connection error')
      )

      const formData = createFormData({
        content: 'Test todo',
        due_date: '',
      })

      const result = await addTodo(formData)

      expect(result).toEqual({ error: 'Database connection error' })
    })

    it('calls revalidatePath after successful creation', async () => {
      mockSupabaseClient.insert.mockResolvedValue(mockSuccessfulQuery(null))

      const { revalidatePath } = await import('next/cache')

      const formData = createFormData({
        content: 'Test todo',
        due_date: '',
      })

      await addTodo(formData)

      expect(revalidatePath).toHaveBeenCalledWith('/todo')
    })
  })

  describe('toggleTodo', () => {
    it('toggles todo to completed', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const result = await toggleTodo('todo-123', true)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
          updated_at: expect.any(String),
        })
      )
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'todo-123')
    })

    it('toggles todo to incomplete', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const result = await toggleTodo('todo-456', false)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: false,
        })
      )
    })

    it('returns error when database update fails', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockFailedQuery('Update failed'))

      const result = await toggleTodo('todo-123', true)

      expect(result).toEqual({ error: 'Update failed' })
    })

    it('sets updated_at timestamp', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      await toggleTodo('todo-123', true)

      const updateCall = mockSupabaseClient.update.mock.calls[0][0]
      expect(updateCall.updated_at).toBeDefined()
      // Verify it's a valid ISO date string
      expect(new Date(updateCall.updated_at).toISOString()).toBe(updateCall.updated_at)
    })

    it('calls revalidatePath after successful toggle', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const { revalidatePath } = await import('next/cache')

      await toggleTodo('todo-123', true)

      expect(revalidatePath).toHaveBeenCalledWith('/todo')
    })
  })

  describe('archiveTodo', () => {
    it('archives a todo', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const result = await archiveTodo('todo-789')

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          archived: true,
          updated_at: expect.any(String),
        })
      )
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'todo-789')
    })

    it('returns error when database update fails', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockFailedQuery('Archive failed'))

      const result = await archiveTodo('todo-789')

      expect(result).toEqual({ error: 'Archive failed' })
    })

    it('sets updated_at timestamp', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      await archiveTodo('todo-789')

      const updateCall = mockSupabaseClient.update.mock.calls[0][0]
      expect(updateCall.updated_at).toBeDefined()
      expect(new Date(updateCall.updated_at).toISOString()).toBe(updateCall.updated_at)
    })

    it('calls revalidatePath after successful archive', async () => {
      mockSupabaseClient.eq.mockResolvedValue(mockSuccessfulQuery(null))

      const { revalidatePath } = await import('next/cache')

      await archiveTodo('todo-789')

      expect(revalidatePath).toHaveBeenCalledWith('/todo')
    })
  })
})
