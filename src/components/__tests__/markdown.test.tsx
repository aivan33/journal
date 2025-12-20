import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Markdown } from '../markdown'

describe('Markdown', () => {
  it('renders plain text', () => {
    render(<Markdown content="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders headings', () => {
    const content = `# Heading 1
## Heading 2
### Heading 3`
    render(<Markdown content={content} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Heading 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Heading 2' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Heading 3' })).toBeInTheDocument()
  })

  it('renders paragraphs', () => {
    const content = `First paragraph

Second paragraph`
    render(<Markdown content={content} />)

    expect(screen.getByText('First paragraph')).toBeInTheDocument()
    expect(screen.getByText('Second paragraph')).toBeInTheDocument()
  })

  it('renders links with correct attributes', () => {
    const content = '[Click here](https://example.com)'
    render(<Markdown content={content} />)

    const link = screen.getByRole('link', { name: 'Click here' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders unordered lists', () => {
    const content = `- Item 1
- Item 2
- Item 3`
    render(<Markdown content={content} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('UL')

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('renders ordered lists', () => {
    const content = `1. First
2. Second
3. Third`
    render(<Markdown content={content} />)

    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
    expect(screen.getByText('Third')).toBeInTheDocument()
  })

  it('renders inline code', () => {
    const content = 'Use `const` for constants'
    render(<Markdown content={content} />)

    const code = screen.getByText('const')
    expect(code.tagName).toBe('CODE')
    expect(code).toHaveClass('rounded')
  })

  it('renders code blocks', () => {
    const content = '```javascript\nconst x = 10\n```'
    render(<Markdown content={content} />)

    const code = screen.getByText('const x = 10')
    expect(code.tagName).toBe('CODE')
    expect(code).toHaveClass('block')
  })

  it('renders blockquotes', () => {
    const content = '> This is a quote'
    render(<Markdown content={content} />)

    const blockquote = screen.getByText('This is a quote').closest('blockquote')
    expect(blockquote).toBeInTheDocument()
    expect(blockquote).toHaveClass('border-l-4')
  })

  it('renders bold text', () => {
    const content = 'This is **bold** text'
    render(<Markdown content={content} />)

    const strong = screen.getByText('bold')
    expect(strong.tagName).toBe('STRONG')
    expect(strong).toHaveClass('font-semibold')
  })

  it('renders italic text', () => {
    const content = 'This is *italic* text'
    render(<Markdown content={content} />)

    const em = screen.getByText('italic')
    expect(em.tagName).toBe('EM')
    expect(em).toHaveClass('italic')
  })

  it('applies custom className', () => {
    const { container } = render(<Markdown content="Test" className="custom-class" />)

    // ReactMarkdown wraps content in a div, find it
    const markdownElement = container.querySelector('.custom-class')
    expect(markdownElement).toBeInTheDocument()
  })

  it('renders complex markdown with multiple elements', () => {
    const content = `# Title

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

[Link](https://example.com)

> Quote

\`inline code\``

    render(<Markdown content={content} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('bold')).toBeInTheDocument()
    expect(screen.getByText('italic')).toBeInTheDocument()
    expect(screen.getByText('List item 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Link' })).toBeInTheDocument()
    expect(screen.getByText('Quote')).toBeInTheDocument()
    expect(screen.getByText('inline code')).toBeInTheDocument()
  })

  it('renders empty content without errors', () => {
    const { container } = render(<Markdown content="" />)
    expect(container).toBeInTheDocument()
  })

  it('renders content with special characters', () => {
    const content = 'Special chars: & < > " \''
    render(<Markdown content={content} />)

    expect(screen.getByText(/Special chars:/)).toBeInTheDocument()
  })
})
