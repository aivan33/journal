'use client'

import { useState } from 'react'
import { toggleTask, archiveTask } from '@/app/tasks/actions'
import type { Task } from '@/lib/supabase/types'
import Link from 'next/link'

type TaskListProps = {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  const [optimisticTasks, setOptimisticTasks] = useState(tasks)

  async function handleToggle(taskId: string, completed: boolean) {
    // Optimistic update
    setOptimisticTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed } : task
      )
    )

    const result = await toggleTask(taskId, completed)
    if (result.error) {
      // Revert on error
      setOptimisticTasks(tasks)
      alert(result.error)
    }
  }

  async function handleArchive(taskId: string) {
    // Optimistic update
    setOptimisticTasks(prev => prev.filter(task => task.id !== taskId))

    const result = await archiveTask(taskId)
    if (result.error) {
      // Revert on error
      setOptimisticTasks(tasks)
      alert(result.error)
    }
  }

  return (
    <div className="space-y-2">
      {optimisticTasks.map(task => {
        const dueDate = task.due_date ? new Date(task.due_date) : null
        const isOverdue = dueDate && dueDate < new Date() && !task.completed

        return (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => handleToggle(task.id, e.target.checked)}
              className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"
            />

            <div className="flex-1">
              <p
                className={`text-zinc-900 dark:text-zinc-50 ${
                  task.completed ? 'line-through opacity-60' : ''
                }`}
              >
                {task.content}
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

                {task.entry_id && (
                  <Link
                    href={`/entries/${task.entry_id}`}
                    className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    View Entry →
                  </Link>
                )}
              </div>
            </div>

            <button
              onClick={() => handleArchive(task.id)}
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
