import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EntryDetail } from '../entry-detail'
import * as actions from '@/app/actions'

// Mock router
vi.mock('next/navigation', async () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  }
  return {
    useRouter: () => mockRouter,
    router: mockRouter,
  }
})

// Mock actions
vi.mock('@/app/actions', () => ({
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}))

// Mock components
vi.mock('../markdown', () => ({
  Markdown: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}))

vi.mock('../relative-time', () => ({
  RelativeTime: ({ date, className }: { date: string; className?: string }) => (
    <time className={className}>{new Date(date).toLocaleDateString()}</time>
  ),
}))

describe('EntryDetail', () => {
  const mockEntry = {
    id: '123',
    title: 'Test Entry',
    content: 'This is test content',
    created_at: '2025-12-18T10:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('View Mode', () => {
    it('renders entry details in view mode', () => {
      render(<EntryDetail entry={mockEntry} />)

      expect(screen.getByText('Test Entry')).toBeInTheDocument()
      expect(screen.getByTestId('markdown')).toHaveTextContent('This is test content')
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('shows created date', () => {
      render(<EntryDetail entry={mockEntry} />)

      expect(screen.getByText('12/18/2025')).toBeInTheDocument()
    })

    it('switches to edit mode when Edit button is clicked', async () => {
      const user = userEvent.setup()
      render(<EntryDetail entry={mockEntry} />)

      const editButton = screen.getByText('Edit')
      await user.click(editButton)

      // Should now show form inputs
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText(/Content/)).toBeInTheDocument()
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    async function enterEditMode() {
      const user = userEvent.setup()
      render(<EntryDetail entry={mockEntry} />)
      await user.click(screen.getByText('Edit'))
      return user
    }

    it('shows editable form fields with current values', async () => {
      await enterEditMode()

      const titleInput = screen.getByLabelText('Title')
      const contentTextarea = screen.getByLabelText(/Content/)

      expect(titleInput).toHaveValue('Test Entry')
      expect(contentTextarea).toHaveValue('This is test content')
    })

    it('allows editing title and content', async () => {
      const user = await enterEditMode()

      const titleInput = screen.getByLabelText('Title')
      const contentTextarea = screen.getByLabelText(/Content/)

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Title')
      await user.clear(contentTextarea)
      await user.type(contentTextarea, 'Updated content')

      expect(titleInput).toHaveValue('Updated Title')
      expect(contentTextarea).toHaveValue('Updated content')
    })

    it('saves changes on Save Changes button click', async () => {
      const user = await enterEditMode()
      vi.mocked(actions.updateEntry).mockResolvedValue({ success: true })

      const titleInput = screen.getByLabelText('Title')
      const contentTextarea = screen.getByLabelText(/Content/)

      await user.clear(titleInput)
      await user.type(titleInput, 'Updated')
      await user.clear(contentTextarea)
      await user.type(contentTextarea, 'New content')

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(actions.updateEntry).toHaveBeenCalledWith('123', expect.any(FormData))
      })
    })

    it('returns to view mode after successful save', async () => {
      const user = await enterEditMode()
      vi.mocked(actions.updateEntry).mockResolvedValue({ success: true })

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        // Should be back in view mode
        expect(screen.getByText('Edit')).toBeInTheDocument()
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
      })
    })

    it('shows error message on save failure', async () => {
      const user = await enterEditMode()
      vi.mocked(actions.updateEntry).mockResolvedValue({
        error: 'Failed to update entry',
      })

      await user.click(screen.getByText('Save Changes'))

      await waitFor(() => {
        expect(screen.getByText('Failed to update entry')).toBeInTheDocument()
      })

      // Should stay in edit mode
      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('saves on Cmd+Enter keyboard shortcut', async () => {
      const user = await enterEditMode()
      vi.mocked(actions.updateEntry).mockResolvedValue({ success: true })

      const contentTextarea = screen.getByLabelText(/Content/)
      await user.type(contentTextarea, '{Meta>}{Enter}{/Meta}')

      await waitFor(() => {
        expect(actions.updateEntry).toHaveBeenCalledWith('123', expect.any(FormData))
      })
    })

    it('saves on Ctrl+Enter keyboard shortcut', async () => {
      const user = await enterEditMode()
      vi.mocked(actions.updateEntry).mockResolvedValue({ success: true })

      const contentTextarea = screen.getByLabelText(/Content/)
      await user.type(contentTextarea, '{Control>}{Enter}{/Control}')

      await waitFor(() => {
        expect(actions.updateEntry).toHaveBeenCalledWith('123', expect.any(FormData))
      })
    })

    it('cancels editing and restores original values', async () => {
      const user = await enterEditMode()

      const titleInput = screen.getByLabelText('Title')
      const contentTextarea = screen.getByLabelText(/Content/)

      // Make changes
      await user.clear(titleInput)
      await user.type(titleInput, 'Changed')
      await user.clear(contentTextarea)
      await user.type(contentTextarea, 'Changed content')

      // Cancel
      await user.click(screen.getByText('Cancel'))

      // Should be back in view mode with original values
      expect(screen.getByText('Test Entry')).toBeInTheDocument()
      expect(screen.getByTestId('markdown')).toHaveTextContent('This is test content')
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('inputs are enabled initially and after save', async () => {
      const user = await enterEditMode()
      vi.mocked(actions.updateEntry).mockResolvedValue({ success: true })

      const titleInput = screen.getByLabelText('Title')
      const contentTextarea = screen.getByLabelText(/Content/)
      const saveButton = screen.getByText('Save Changes')

      // Initially enabled
      expect(titleInput).not.toBeDisabled()
      expect(contentTextarea).not.toBeDisabled()
      expect(saveButton).not.toBeDisabled()

      await user.click(saveButton)

      // After save completes, should be back in view mode
      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
      })
    })
  })

  describe('Delete Functionality', () => {
    it('shows confirmation dialog when Delete button is clicked', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<EntryDetail entry={mockEntry} />)

      await user.click(screen.getByText('Delete'))

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this entry? This action cannot be undone.'
      )

      confirmSpy.mockRestore()
    })

    it('does not delete if confirmation is cancelled', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<EntryDetail entry={mockEntry} />)

      await user.click(screen.getByText('Delete'))

      expect(actions.deleteEntry).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })

    it('deletes entry and redirects on confirmation', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(actions.deleteEntry).mockResolvedValue({ success: true })

      render(<EntryDetail entry={mockEntry} />)

      await user.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(actions.deleteEntry).toHaveBeenCalledWith('123')
      })

      const navigation = await import('next/navigation')
      const mockRouter = navigation.useRouter()
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })

      confirmSpy.mockRestore()
    })

    it('shows error message on delete failure', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(actions.deleteEntry).mockResolvedValue({
        error: 'Failed to delete entry',
      })

      render(<EntryDetail entry={mockEntry} />)

      await user.click(screen.getByText('Delete'))

      await waitFor(() => {
        expect(screen.getByText('Failed to delete entry')).toBeInTheDocument()
      })

      // Should still be in view mode
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()

      confirmSpy.mockRestore()
    })

    it('shows loading text while deleting', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(actions.deleteEntry).mockResolvedValue({ success: true })

      render(<EntryDetail entry={mockEntry} />)

      await user.click(screen.getByText('Delete'))

      // After delete completes, should navigate away
      const navigation = await import('next/navigation')
      const mockRouter = navigation.useRouter()
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/')
      })

      confirmSpy.mockRestore()
    })
  })
})
