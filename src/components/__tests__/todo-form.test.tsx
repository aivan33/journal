import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils/test-helpers'
import userEvent from '@testing-library/user-event'
import { TodoForm } from '../todo-form'
import * as todoActions from '@/app/todo/actions'

// Mock the todo actions
vi.mock('@/app/todo/actions')

describe('TodoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with all fields', () => {
    render(<TodoForm />)

    expect(screen.getByRole('heading', { name: 'Add Todo' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Todo$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Todo/i })).toBeInTheDocument()
  })

  it('shows placeholders correctly', () => {
    render(<TodoForm />)

    const todoInput = screen.getByPlaceholderText('Enter todo')
    expect(todoInput).toBeInTheDocument()
  })

  it('submits form with todo content only', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Buy groceries')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledTimes(1)
    })

    const formData = mockAddTodo.mock.calls[0][0]
    expect(formData.get('content')).toBe('Buy groceries')
  })

  it('submits form with todo content and due date', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const dueDateInput = screen.getByLabelText(/Due Date/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Call dentist')
    await user.type(dueDateInput, '2025-12-25')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledTimes(1)
    })

    const formData = mockAddTodo.mock.calls[0][0]
    expect(formData.get('content')).toBe('Call dentist')
    expect(formData.get('due_date')).toBe('2025-12-25')
  })

  it('displays error message on submission failure', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ error: 'Content is required' })

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Test todo')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Content is required')).toBeInTheDocument()
    })
  })

  it('resets form on successful submission', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Test todo')
    expect(todoInput.value).toBe('Test todo')

    await user.click(submitButton)

    await waitFor(() => {
      expect(todoInput.value).toBe('')
    })
  })

  it('enables inputs after submission completes', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const dueDateInput = screen.getByLabelText(/Due Date/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Test todo')
    await user.click(submitButton)

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalled()
    })

    // After submission, inputs should be enabled again
    expect(todoInput).not.toBeDisabled()
    expect(dueDateInput).not.toBeDisabled()
    expect(submitButton).not.toBeDisabled()
    expect(submitButton).toHaveTextContent('Add Todo')
  })

  it('calls router.refresh on successful submission', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ success: true })

    // Access the mocked router from next/navigation
    const navigation = await import('next/navigation')
    const mockRouter = navigation.useRouter()
    vi.mocked(mockRouter.refresh).mockClear()

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Test todo')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockRouter.refresh).toHaveBeenCalled()
    })
  })

  it('does not call router.refresh on submission failure', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValue({ error: 'Database error' })

    // Access the mocked router from next/navigation
    const navigation = await import('next/navigation')
    const mockRouter = navigation.useRouter()
    vi.mocked(mockRouter.refresh).mockClear()

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    await user.type(todoInput, 'Test todo')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })

    expect(mockRouter.refresh).not.toHaveBeenCalled()
  })

  it('clears previous errors on new submission', async () => {
    const mockAddTodo = vi.mocked(todoActions.addTodo)
    mockAddTodo.mockResolvedValueOnce({ error: 'First error' })
    mockAddTodo.mockResolvedValueOnce({ success: true })

    const user = userEvent.setup()
    render(<TodoForm />)

    const todoInput = screen.getByLabelText(/^Todo$/i)
    const submitButton = screen.getByRole('button', { name: /Add Todo/i })

    // First submission with error
    await user.type(todoInput, 'Test todo')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second submission successful
    await user.type(todoInput, 'Another todo')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })
})
