'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEntry, deleteEntry } from '@/app/actions'
import Link from 'next/link'
import { AutoTextarea } from './auto-textarea'
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

export function EntryDetail({ entry }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(entry.title)
  const [content, setContent] = useState(entry.content)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updateEntry(entry.id, formData)

    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      setIsEditing(false)
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    setTitle(entry.title)
    setContent(entry.content)
    setError(null)
    setIsEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    const result = await deleteEntry(entry.id)

    if (result.error) {
      setError(result.error)
      setIsDeleting(false)
    } else {
      router.push('/')
    }
  }

  if (isEditing) {
    return (
      <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <RelativeTime
          date={entry.created_at}
          className="mb-4 block text-sm text-zinc-500 dark:text-zinc-400"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isSubmitting}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-lg font-semibold text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Content (Markdown supported)
            </label>
            <AutoTextarea
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isSubmitting}
              minRows={12}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <RelativeTime
          date={entry.created_at}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <h1 className="mb-6 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
        {entry.title}
      </h1>

      <div className="text-lg">
        <Markdown content={entry.content} />
      </div>
    </article>
  )
}
