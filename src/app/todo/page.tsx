import { createClient } from '@/lib/supabase/server'
import { TodoList } from '@/components/todo-list'
import { TodoForm } from '@/components/todo-form'
import Link from 'next/link'

export default async function TodoPage() {
  const supabase = await createClient()
  const { data: todos } = await supabase
    .from('tasks')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Todo
          </h1>
          <div className="flex gap-4">
            <Link
              href="/todo/archived"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              View Archived
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Back to Journal
            </Link>
          </div>
        </div>

        <div className="mb-12">
          <TodoForm />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Active Todos
          </h2>

          {!todos || todos.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">
              No todos yet. Create your first todo above!
            </p>
          ) : (
            <TodoList todos={todos} />
          )}
        </div>
      </main>
    </div>
  )
}
