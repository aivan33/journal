import { describe, it, expect, beforeEach } from 'vitest'
import {
  getTestClient,
  createTestEntry,
  createTestTask,
  clearDatabase,
} from './setup'

describe('Tasks Integration Tests', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  describe('Task CRUD Operations', () => {
    it('creates a task with required fields', async () => {
      const client = getTestClient()

      // Create entry first (tasks require entry_id)
      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      const { data, error } = await client
        .from('tasks')
        .insert({
          content: 'My test task',
          entry_id: entry.id,
          completed: false,
          archived: false,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.content).toBe('My test task')
      expect(data?.entry_id).toBe(entry.id)
      expect(data?.completed).toBe(false)
      expect(data?.archived).toBe(false)
      expect(data?.id).toBeDefined()
      expect(data?.created_at).toBeDefined()
    })

    it('creates a task with due date', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      const dueDate = '2025-12-25T00:00:00Z'

      const { data, error } = await client
        .from('tasks')
        .insert({
          content: 'Task with due date',
          entry_id: entry.id,
          due_date: dueDate,
          completed: false,
          archived: false,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.due_date).toBe(dueDate)
    })

    it('retrieves tasks from database', async () => {
      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      // Create multiple tasks
      await createTestTask({ content: 'Task 1', entry_id: entry.id })
      await createTestTask({ content: 'Task 2', entry_id: entry.id })
      await createTestTask({ content: 'Task 3', entry_id: entry.id })

      const client = getTestClient()
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('entry_id', entry.id)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.length).toBe(3)
    })

    it('updates a task', async () => {
      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      const task = await createTestTask({
        content: 'Original content',
        entry_id: entry.id,
      })

      const client = getTestClient()
      const { data, error } = await client
        .from('tasks')
        .update({
          content: 'Updated content',
          completed: true,
        })
        .eq('id', task.id)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data?.content).toBe('Updated content')
      expect(data?.completed).toBe(true)
    })

    it('deletes a task', async () => {
      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      const task = await createTestTask({
        content: 'To delete',
        entry_id: entry.id,
      })

      const client = getTestClient()

      // Delete task
      const { error: deleteError } = await client.from('tasks').delete().eq('id', task.id)

      expect(deleteError).toBeNull()

      // Verify deletion
      const { data, error: fetchError } = await client
        .from('tasks')
        .select()
        .eq('id', task.id)
        .maybeSingle()

      expect(fetchError).toBeNull()
      expect(data).toBeNull()
    })
  })

  describe('Task Filtering', () => {
    it('filters active (non-archived) tasks', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      // Create active and archived tasks
      await createTestTask({ content: 'Active 1', entry_id: entry.id })
      await createTestTask({ content: 'Active 2', entry_id: entry.id })

      const archivedTask = await createTestTask({
        content: 'Archived',
        entry_id: entry.id,
        completed: true,
      })

      // Archive one task
      await client.from('tasks').update({ archived: true }).eq('id', archivedTask.id)

      // Query only active tasks
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data?.length).toBe(2)
      expect(data?.every((task) => !task.archived)).toBe(true)
    })

    it('filters completed tasks', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      // Create completed and incomplete tasks
      await createTestTask({ content: 'Incomplete 1', entry_id: entry.id, completed: false })
      await createTestTask({ content: 'Completed 1', entry_id: entry.id, completed: true })
      await createTestTask({ content: 'Completed 2', entry_id: entry.id, completed: true })

      // Query only completed tasks
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('completed', true)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data?.length).toBe(2)
      expect(data?.every((task) => task.completed)).toBe(true)
    })

    it('filters overdue tasks', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Create tasks with different due dates
      await createTestTask({
        content: 'Overdue task',
        entry_id: entry.id,
        completed: false,
        due_date: yesterday.toISOString(),
      })

      await createTestTask({
        content: 'Future task',
        entry_id: entry.id,
        completed: false,
        due_date: tomorrow.toISOString(),
      })

      await createTestTask({
        content: 'No due date',
        entry_id: entry.id,
        completed: false,
      })

      // Query overdue tasks (due_date < now AND not completed)
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('completed', false)
        .not('due_date', 'is', null)
        .lt('due_date', now.toISOString())

      expect(error).toBeNull()
      expect(data?.length).toBe(1)
      expect(data?.[0].content).toBe('Overdue task')
    })
  })

  describe('Task-Entry Relationship', () => {
    it('retrieves tasks with entry information', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'My Entry',
        content: 'Entry content',
      })

      await createTestTask({
        content: 'Task for entry',
        entry_id: entry.id,
      })

      // Query tasks with entry data (join)
      const { data, error } = await client
        .from('tasks')
        .select(
          `
          *,
          entries:entry_id (
            id,
            title,
            content
          )
        `
        )
        .eq('entry_id', entry.id)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data?.entries).toBeDefined()
      expect(data?.entries?.title).toBe('My Entry')
    })

    it('deletes tasks when entry is deleted (cascade)', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Entry to delete',
        content: 'Content',
      })

      const task = await createTestTask({
        content: 'Task will be deleted',
        entry_id: entry.id,
      })

      // Delete entry (should cascade to tasks)
      const { error: deleteError } = await client.from('entries').delete().eq('id', entry.id)

      expect(deleteError).toBeNull()

      // Verify task was also deleted
      const { data, error } = await client
        .from('tasks')
        .select()
        .eq('id', task.id)
        .maybeSingle()

      expect(error).toBeNull()
      expect(data).toBeNull()
    })

    it('retrieves all tasks for an entry', async () => {
      const client = getTestClient()

      const entry1 = await createTestEntry({
        title: 'Entry 1',
        content: 'Content 1',
      })

      const entry2 = await createTestEntry({
        title: 'Entry 2',
        content: 'Content 2',
      })

      // Create tasks for both entries
      await createTestTask({ content: 'Task 1 for Entry 1', entry_id: entry1.id })
      await createTestTask({ content: 'Task 2 for Entry 1', entry_id: entry1.id })
      await createTestTask({ content: 'Task for Entry 2', entry_id: entry2.id })

      // Query tasks for entry1 only
      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('entry_id', entry1.id)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data?.length).toBe(2)
      expect(data?.every((task) => task.entry_id === entry1.id)).toBe(true)
    })
  })

  describe('Task Validation', () => {
    it('requires content field', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      const { data, error } = await client
        .from('tasks')
        .insert({
          entry_id: entry.id,
          completed: false,
          archived: false,
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('requires entry_id field', async () => {
      const client = getTestClient()

      const { data, error } = await client
        .from('tasks')
        .insert({
          content: 'Task without entry',
          completed: false,
          archived: false,
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(data).toBeNull()
    })

    it('rejects invalid entry_id (foreign key constraint)', async () => {
      const client = getTestClient()

      const { data, error } = await client
        .from('tasks')
        .insert({
          content: 'Task with invalid entry',
          entry_id: '00000000-0000-0000-0000-999999999999', // Non-existent
          completed: false,
          archived: false,
        })
        .select()
        .single()

      expect(error).toBeDefined()
      expect(error?.message).toContain('foreign key')
      expect(data).toBeNull()
    })
  })

  describe('Task Sorting and Ordering', () => {
    it('orders tasks by created_at descending (newest first)', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      // Create tasks with slight delays to ensure different timestamps
      const task1 = await createTestTask({ content: 'First', entry_id: entry.id })
      await new Promise((resolve) => setTimeout(resolve, 10))

      const task2 = await createTestTask({ content: 'Second', entry_id: entry.id })
      await new Promise((resolve) => setTimeout(resolve, 10))

      const task3 = await createTestTask({ content: 'Third', entry_id: entry.id })

      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('entry_id', entry.id)
        .order('created_at', { ascending: false })

      expect(error).toBeNull()
      expect(data?.length).toBe(3)
      expect(data?.[0].id).toBe(task3.id) // Newest
      expect(data?.[1].id).toBe(task2.id)
      expect(data?.[2].id).toBe(task1.id) // Oldest
    })

    it('orders tasks by due_date ascending (earliest first)', async () => {
      const client = getTestClient()

      const entry = await createTestEntry({
        title: 'Test Entry',
        content: 'Content',
      })

      await createTestTask({
        content: 'Due in 3 days',
        entry_id: entry.id,
        due_date: '2025-12-23T00:00:00Z',
      })

      await createTestTask({
        content: 'Due in 1 day',
        entry_id: entry.id,
        due_date: '2025-12-21T00:00:00Z',
      })

      await createTestTask({
        content: 'Due in 2 days',
        entry_id: entry.id,
        due_date: '2025-12-22T00:00:00Z',
      })

      const { data, error } = await client
        .from('tasks')
        .select('*')
        .eq('entry_id', entry.id)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })

      expect(error).toBeNull()
      expect(data?.length).toBe(3)
      expect(data?.[0].content).toBe('Due in 1 day')
      expect(data?.[1].content).toBe('Due in 2 days')
      expect(data?.[2].content).toBe('Due in 3 days')
    })
  })
})
