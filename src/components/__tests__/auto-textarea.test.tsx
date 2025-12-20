import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-helpers'
import { AutoTextarea } from '../auto-textarea'
import userEvent from '@testing-library/user-event'

describe('AutoTextarea', () => {
  it('renders textarea with default props', () => {
    render(<AutoTextarea />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
  })

  it('applies minRows prop to minimum height', () => {
    render(<AutoTextarea minRows={8} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

    // minRows * 24px (approximate line height)
    expect(textarea.style.minHeight).toBe('192px')
  })

  it('sets resize and overflow styles', () => {
    render(<AutoTextarea />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

    expect(textarea.style.resize).toBe('none')
    expect(textarea.style.overflow).toBe('hidden')
  })

  it('handles value and onChange props', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<AutoTextarea value="" onChange={handleChange} />)
    const textarea = screen.getByRole('textbox')

    await user.type(textarea, 'Test content')

    expect(handleChange).toHaveBeenCalled()
  })

  it('passes through additional HTML attributes', () => {
    render(
      <AutoTextarea
        placeholder="Enter text"
        disabled={true}
        id="test-textarea"
      />
    )
    const textarea = screen.getByRole('textbox')

    expect(textarea).toHaveAttribute('placeholder', 'Enter text')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveAttribute('id', 'test-textarea')
  })

  it('applies custom style prop while preserving required styles', () => {
    const customStyle = { backgroundColor: 'red' }
    render(<AutoTextarea style={customStyle} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

    expect(textarea.style.backgroundColor).toBe('red')
    expect(textarea.style.resize).toBe('none')
    expect(textarea.style.overflow).toBe('hidden')
  })
})
