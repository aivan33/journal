'use client'

import { useRef, useState } from 'react'
import { addTodo } from '@/app/todo/actions'

export function TodoForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    const result = await addTodo(formData)

    if (result.error) {
      setError(result.error)
    } else {
      formRef.current?.reset()
    }

    setIsSubmitting(false)
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add Todo
      </h2>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Todo
          </label>
          <input
            type="text"
            id="content"
            name="content"
            required
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
            placeholder="Enter todo"
          />
        </div>

        <div className="w-48">
          <label
            htmlFor="due_date"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Due Date (optional)
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? 'Adding...' : 'Add Todo'}
      </button>
    </form>
  )
}
