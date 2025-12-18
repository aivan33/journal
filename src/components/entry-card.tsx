'use client'

import { useState } from 'react'
import { deleteEntry } from '@/app/actions'
import Link from 'next/link'
import { Markdown } from './markdown'
import { RelativeTime } from './relative-time'

type Entry = {
  id: string
  title: string
  content: string
  created_at: string
}

type Props = {
  entry: Entry
}

export function EntryCard({ entry }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)

    const result = await deleteEntry(entry.id)

    if (result.error) {
      alert(`Error deleting entry: ${result.error}`)
      setIsDeleting(false)
    }
  }

  const contentPreview = entry.content.length > 200
    ? entry.content.slice(0, 200) + '...'
    : entry.content

  return (
    <article className="group relative rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/entries/${entry.id}`}>
        <h3 className="mb-2 text-xl font-semibold text-zinc-900 transition-colors hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300">
          {entry.title}
        </h3>
      </Link>
      <div className="mb-4 line-clamp-3">
        <Markdown content={contentPreview} />
      </div>
      <div className="flex items-center justify-between">
        <RelativeTime
          date={entry.created_at}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        />
        <div className="flex items-center gap-2">
          {entry.content.length > 200 && (
            <Link
              href={`/entries/${entry.id}`}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Read more →
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded p-1.5 text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Delete entry"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}
