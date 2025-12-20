import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { TodoList } from '../todo-list'
import * as todoActions from '@/app/todo/actions'
import type { Todo } from '@/lib/supabase/types'

// Mock the todo actions
vi.mock('@/app/todo/actions')

// Mock window.alert
global.alert = vi.fn()

describe('TodoList', () => {
  const mockTodos: Todo[] = [
    {
      id: '1',
      content: 'Buy groceries',
      completed: false,
      due_date: null,
      archived: false,
      entry_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '2',
      content: 'Call dentist',
      completed: true,
      due_date: '2025-12-25',
      archived: false,
      entry_id: 'entry-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '3',
      content: 'Fix bug',
      completed: false,
      due_date: '2025-01-01', // Past date
      archived: false,
      entry_id: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all todos', () => {
    render(<TodoList todos={mockTodos} />)

    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('Call dentist')).toBeInTheDocument()
    expect(screen.getByText('Fix bug')).toBeInTheDocument()
  })

  it('renders empty list when no todos', () => {
    const { container } = render(<TodoList todos={[]} />)
    const listContainer = container.querySelector('.space-y-2')
    expect(listContainer?.children.length).toBe(0)
  })

  it('shows checkboxes with correct checked state', () => {
    render(<TodoList todos={mockTodos} />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).not.toBeChecked() // Buy groceries
    expect(checkboxes[1]).toBeChecked() // Call dentist (completed)
    expect(checkboxes[2]).not.toBeChecked() // Fix bug
  })

  it('applies line-through style to completed todos', () => {
    render(<TodoList todos={mockTodos} />)

    const completedTodo = screen.getByText('Call dentist')
    expect(completedTodo).toHaveClass('line-through')
    expect(completedTodo).toHaveClass('opacity-60')

    const incompleteTodo = screen.getByText('Buy groceries')
    expect(incompleteTodo).not.toHaveClass('line-through')
  })

  it('displays due date when present', () => {
    render(<TodoList todos={mockTodos} />)

    expect(screen.getByText(/Due: 12\/25\/2025/)).toBeInTheDocument()
  })

  it('highlights overdue todos in red', () => {
    render(<TodoList todos={mockTodos} />)

    const overdueTodo = screen.getByText(/Due: 1\/1\/2025/)
    expect(overdueTodo).toHaveClass('text-red-600')
  })

  it('does not highlight completed todos as overdue', () => {
    render(<TodoList todos={mockTodos} />)

    const completedDueTodo = screen.getByText(/Due: 12\/25\/2025/)
    expect(completedDueTodo).not.toHaveClass('text-red-600')
  })

  it('shows "View Entry" link when entry_id is present', () => {
    render(<TodoList todos={mockTodos} />)

    const entryLink = screen.getByText('View Entry →')
    expect(entryLink).toBeInTheDocument()
    expect(entryLink).toHaveAttribute('href', '/entries/entry-123')
  })

  it('toggles todo completion optimistically', async () => {
    const mockToggleTodo = vi.mocked(todoActions.toggleTodo)
    mockToggleTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} />)

    const checkbox = screen.getAllByRole('checkbox')[0] // Buy groceries

    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)

    // Optimistically updated immediately
    expect(checkbox).toBeChecked()

    await waitFor(() => {
      expect(mockToggleTodo).toHaveBeenCalledWith('1', true)
    })
  })

  it('reverts optimistic update on toggle failure', async () => {
    const mockToggleTodo = vi.mocked(todoActions.toggleTodo)
    mockToggleTodo.mockResolvedValue({ error: 'Database error' })

    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} />)

    const checkbox = screen.getAllByRole('checkbox')[0]

    await user.click(checkbox)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Database error')
    })

    // Reverted to original state
    expect(checkbox).not.toBeChecked()
  })

  it('archives todo optimistically', async () => {
    const mockArchiveTodo = vi.mocked(todoActions.archiveTodo)
    mockArchiveTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} />)

    expect(screen.getByText('Buy groceries')).toBeInTheDocument()

    const archiveButtons = screen.getAllByText('Archive')
    await user.click(archiveButtons[0])

    // Optimistically removed immediately
    expect(screen.queryByText('Buy groceries')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(mockArchiveTodo).toHaveBeenCalledWith('1')
    })
  })

  it('reverts optimistic update on archive failure', async () => {
    const mockArchiveTodo = vi.mocked(todoActions.archiveTodo)
    mockArchiveTodo.mockResolvedValue({ error: 'Failed to archive' })

    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} />)

    const archiveButtons = screen.getAllByText('Archive')
    await user.click(archiveButtons[0])

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to archive')
    })

    // Reverted - todo is back
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('renders all archive buttons', () => {
    render(<TodoList todos={mockTodos} />)

    const archiveButtons = screen.getAllByText('Archive')
    expect(archiveButtons).toHaveLength(3)
  })

  it('handles multiple rapid toggles correctly', async () => {
    const mockToggleTodo = vi.mocked(todoActions.toggleTodo)
    mockToggleTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoList todos={mockTodos} />)

    const checkbox = screen.getAllByRole('checkbox')[0]

    // Rapid clicks
    await user.click(checkbox)
    await user.click(checkbox)
    await user.click(checkbox)

    // Should be checked (odd number of clicks)
    expect(checkbox).toBeChecked()

    await waitFor(() => {
      expect(mockToggleTodo).toHaveBeenCalledTimes(3)
    })
  })
})
