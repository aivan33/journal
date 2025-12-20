import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryForm } from '../entry-form'
import * as actions from '@/app/actions'

// Mock the server actions
vi.mock('@/app/actions', () => ({
  addEntry: vi.fn(),
}))

describe('EntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default title as today\'s date', () => {
    render(<EntryForm />)

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const titleInput = screen.getByLabelText('Title')
    expect(titleInput).toHaveValue(today)
  })

  it('renders all form elements', () => {
    render(<EntryForm />)

    expect(screen.getByRole('heading', { name: 'New Entry' })).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText(/Content/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Entry' })).toBeInTheDocument()
  })

  it('allows typing in title and content fields', async () => {
    const user = userEvent.setup()
    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)

    await user.clear(titleInput)
    await user.type(titleInput, 'My Test Entry')
    await user.type(contentTextarea, 'This is test content')

    expect(titleInput).toHaveValue('My Test Entry')
    expect(contentTextarea).toHaveValue('This is test content')
  })

  it('submits form on button click', async () => {
    const user = userEvent.setup()
    vi.mocked(actions.addEntry).mockResolvedValue({ success: true })

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)
    const submitButton = screen.getByRole('button', { name: 'Add Entry' })

    await user.clear(titleInput)
    await user.type(titleInput, 'Test Title')
    await user.type(contentTextarea, 'Test content')
    await user.click(submitButton)

    await waitFor(() => {
      expect(actions.addEntry).toHaveBeenCalledTimes(1)
    })
  })

  it('disables inputs while submitting', async () => {
    const user = userEvent.setup()
    vi.mocked(actions.addEntry).mockResolvedValue({ success: true })

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)
    const submitButton = screen.getByRole('button', { name: 'Add Entry' })

    // Verify initially enabled
    expect(titleInput).not.toBeDisabled()
    expect(contentTextarea).not.toBeDisabled()
    expect(submitButton).not.toBeDisabled()

    await user.clear(titleInput)
    await user.type(titleInput, 'Test')
    await user.type(contentTextarea, 'Content')
    await user.click(submitButton)

    // After submission completes, should be enabled again
    await waitFor(() => {
      expect(titleInput).not.toBeDisabled()
      expect(contentTextarea).not.toBeDisabled()
      expect(submitButton).not.toBeDisabled()
    })
  })

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup()
    vi.mocked(actions.addEntry).mockResolvedValue({
      error: 'Failed to add entry'
    })

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)
    const submitButton = screen.getByRole('button', { name: 'Add Entry' })

    await user.clear(titleInput)
    await user.type(titleInput, 'Test')
    await user.type(contentTextarea, 'Content')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to add entry')).toBeInTheDocument()
    })
  })

  it('resets form on successful submission', async () => {
    const user = userEvent.setup()
    vi.mocked(actions.addEntry).mockResolvedValue({ success: true })

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)
    const submitButton = screen.getByRole('button', { name: 'Add Entry' })

    // Fill form
    await user.clear(titleInput)
    await user.type(titleInput, 'Test Title')
    await user.type(contentTextarea, 'Test content')

    // Submit
    await user.click(submitButton)

    // Wait for form to reset
    await waitFor(() => {
      // Content should be cleared
      expect(contentTextarea).toHaveValue('')
      // Title should be reset to today's date
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      expect(titleInput).toHaveValue(today)
    })
  })

  it('submits form on Cmd+Enter keyboard shortcut', async () => {
    const user = userEvent.setup()
    vi.mocked(actions.addEntry).mockResolvedValue({ success: true })

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)

    await user.clear(titleInput)
    await user.type(titleInput, 'Test Title')
    await user.type(contentTextarea, 'Test content')

    // Press Cmd+Enter (metaKey)
    await user.type(contentTextarea, '{Meta>}{Enter}{/Meta}')

    await waitFor(() => {
      expect(actions.addEntry).toHaveBeenCalledTimes(1)
    })
  })

  it('submits form on Ctrl+Enter keyboard shortcut', async () => {
    const user = userEvent.setup()
    vi.mocked(actions.addEntry).mockResolvedValue({ success: true })

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)

    await user.clear(titleInput)
    await user.type(titleInput, 'Test Title')
    await user.type(contentTextarea, 'Test content')

    // Press Ctrl+Enter (ctrlKey)
    await user.type(contentTextarea, '{Control>}{Enter}{/Control}')

    await waitFor(() => {
      expect(actions.addEntry).toHaveBeenCalledTimes(1)
    })
  })

  it('does not submit while already submitting', async () => {
    const user = userEvent.setup()
    let resolveSubmit: (value: any) => void
    const submitPromise = new Promise((resolve) => {
      resolveSubmit = resolve
    })

    vi.mocked(actions.addEntry).mockReturnValue(submitPromise)

    render(<EntryForm />)

    const titleInput = screen.getByLabelText('Title')
    const contentTextarea = screen.getByLabelText(/Content/)

    await user.clear(titleInput)
    await user.type(titleInput, 'Test')
    await user.type(contentTextarea, 'Content')

    // First submit with Cmd+Enter
    user.type(contentTextarea, '{Meta>}{Enter}{/Meta}')

    // Try to submit again immediately
    user.type(contentTextarea, '{Meta>}{Enter}{/Meta}')

    // Should only have been called once
    await waitFor(() => {
      expect(actions.addEntry).toHaveBeenCalledTimes(1)
    })

    // Resolve the promise
    resolveSubmit!({ success: true })
  })
})
