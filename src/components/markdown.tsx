import ReactMarkdown from 'react-markdown'

type MarkdownProps = {
  content: string
  className?: string
}

export function Markdown({ content, className = '' }: MarkdownProps) {
  return (
    <ReactMarkdown
      className={className}
      components={{
        // Style headers
        h1: ({ children }) => (
          <h1 className="mb-4 mt-6 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 mt-5 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {children}
          </h3>
        ),
        // Style paragraphs
        p: ({ children }) => (
          <p className="mb-4 text-zinc-700 dark:text-zinc-300">{children}</p>
        ),
        // Style links
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 underline decoration-zinc-400 underline-offset-2 transition-colors hover:decoration-zinc-900 dark:text-zinc-50 dark:decoration-zinc-600 dark:hover:decoration-zinc-50"
          >
            {children}
          </a>
        ),
        // Style lists
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-1 text-zinc-700 dark:text-zinc-300">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        // Style code
        code: ({ children, className }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                {children}
              </code>
            )
          }
          return (
            <code className="block rounded-md bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
              {children}
            </code>
          )
        },
        // Style blockquotes
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            {children}
          </blockquote>
        ),
        // Style strong/bold
        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-900 dark:text-zinc-50">
            {children}
          </strong>
        ),
        // Style emphasis/italic
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
