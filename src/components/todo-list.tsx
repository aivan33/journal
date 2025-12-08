'use client'

import { useState } from 'react'
import { toggleTodo, archiveTodo } from '@/app/todo/actions'
import type { Todo } from '@/lib/supabase/types'
import Link from 'next/link'

type TodoListProps = {
  todos: Todo[]
}

export function TodoList({ todos }: TodoListProps) {
  const [optimisticTodos, setOptimisticTodos] = useState(todos)

  async function handleToggle(todoId: string, completed: boolean) {
    // Optimistic update
    setOptimisticTodos(prev =>
      prev.map(todo =>
        todo.id === todoId ? { ...todo, completed } : todo
      )
    )

    const result = await toggleTodo(todoId, completed)
    if (result.error) {
      // Revert on error
      setOptimisticTodos(todos)
      alert(result.error)
    }
  }

  async function handleArchive(todoId: string) {
    // Optimistic update
    setOptimisticTodos(prev => prev.filter(todo => todo.id !== todoId))

    const result = await archiveTodo(todoId)
    if (result.error) {
      // Revert on error
      setOptimisticTodos(todos)
      alert(result.error)
    }
  }

  return (
    <div className="space-y-2">
      {optimisticTodos.map(todo => {
        const dueDate = todo.due_date ? new Date(todo.due_date) : null
        const isOverdue = dueDate && dueDate < new Date() && !todo.completed

        return (
          <div
            key={todo.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={(e) => handleToggle(todo.id, e.target.checked)}
              className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />

            <div className="flex-1">
              <p
                className={`text-zinc-900 dark:text-zinc-50 ${
                  todo.completed ? 'line-through opacity-60' : ''
                }`}
              >
                {todo.content}
              </p>

              <div className="mt-1 flex items-center gap-3 text-sm">
                {dueDate && (
                  <span
                    className={`${
                      isOverdue
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    Due: {dueDate.toLocaleDateString()}
                  </span>
                )}

                {todo.entry_id && (
                  <Link
                    href={`/entries/${todo.entry_id}`}
                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    View Entry →
                  </Link>
                )}
              </div>
            </div>

            <button
              onClick={() => handleArchive(todo.id)}
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Archive
            </button>
          </div>
        )
      })}
    </div>
  )
}
