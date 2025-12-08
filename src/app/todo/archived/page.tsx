import { createClient } from '@/lib/supabase/server'
import type { Todo } from '@/lib/supabase/types'
import Link from 'next/link'

export default async function ArchivedTodosPage() {
  const supabase = await createClient()
  const { data: todos } = await supabase
    .from('tasks')
    .select('*')
    .eq('archived', true)
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Archived Todos
          </h1>
          <Link
            href="/todo"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Back to Active Todos
          </Link>
        </div>

        <div className="space-y-6">
          {!todos || todos.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              No archived todos yet.
            </p>
          ) : (
            <div className="space-y-2">
              {todos.map((todo: Todo) => {
                const dueDate = todo.due_date ? new Date(todo.due_date) : null

                return (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 opacity-75 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      disabled
                      className="h-5 w-5 rounded border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800"
                    />

                    <div className="flex-1">
                      <p
                        className={`text-zinc-900 dark:text-zinc-50 ${
                          todo.completed ? 'line-through' : ''
                        }`}
                      >
                        {todo.content}
                      </p>

                      <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                        {dueDate && (
                          <span>Due: {dueDate.toLocaleDateString()}</span>
                        )}

                        {todo.entry_id && (
                          <Link
                            href={`/entries/${todo.entry_id}`}
                            className="hover:text-zinc-900 dark:hover:text-zinc-50"
                          >
                            View Entry →
                          </Link>
                        )}

                        <span>
                          Archived:{' '}
                          {new Date(todo.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
