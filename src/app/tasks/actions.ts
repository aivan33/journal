'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addTask(formData: FormData) {
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

  revalidatePath('/tasks')
  return { success: true }
}

export async function toggleTask(taskId: string, completed: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ completed, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')
  return { success: true }
}

export async function archiveTask(taskId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('tasks')
    .update({ archived: true, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/tasks')
  return { success: true }
}
