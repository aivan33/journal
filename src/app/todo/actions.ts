'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTodo(formData: FormData) {
  const content = formData.get('content') as string
  const due_date = formData.get('due_date') as string

  if (!content) {
    return { error: 'Content is required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('tasks').insert({
    content,
    due_date: due_date || null,
    completed: false,
    archived: false,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todo')
  return { success: true }
}

export async function toggleTodo(todoId: string, completed: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ completed, updated_at: new Date().toISOString() })
    .eq('id', todoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todo')
  return { success: true }
}

export async function archiveTodo(todoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', todoId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/todo')
  return { success: true }
}
