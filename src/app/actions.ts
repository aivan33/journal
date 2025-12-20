'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateEntryEmbedding } from '@/lib/ai/embeddings'
import { logError } from '@/lib/logger'

async function createTasksFromContent(content: string, entryId: string, supabase: any) {
  // Parse content for [bracket] format markers like [task], [meditate], [Meditate Tomorrow]
  const taskRegex = /\[([^\]]+)\]/g
  const tasks: string[] = []
  let match

  // Extract all tasks from content
  while ((match = taskRegex.exec(content)) !== null) {
    const taskContent = match[1].trim()
    if (taskContent) {
      tasks.push(taskContent)
    }
  }

  // Check existing tasks for this entry to prevent duplicates
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('content')
    .eq('entry_id', entryId)

  const existingTaskContents = new Set(
    existingTasks?.map((t: any) => t.content.toLowerCase()) || []
  )

  // Insert only new tasks
  for (const taskContent of tasks) {
    if (!existingTaskContents.has(taskContent.toLowerCase())) {
      await supabase.from('tasks').insert({
        content: taskContent,
        entry_id: entryId,
        completed: false,
        archived: false,
      })
    }
  }
}

export async function addEntry(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const supabase = await createClient()

  try {
    // Generate embedding for the entry
    const embedding = await generateEntryEmbedding(title, content)

    const { data, error } = await supabase
      .from('entries')
      .insert({ title, content, embedding })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Create tasks from @task markers in content
    if (data) {
      await createTasksFromContent(content, data.id, supabase)
    }

    revalidatePath('/')
    revalidatePath('/todo')
    return { success: true }
  } catch (embeddingError) {
    // If embedding generation fails, still save the entry without embedding
    logError(
      embeddingError instanceof Error ? embeddingError : new Error(String(embeddingError)),
      'Failed to generate embedding for entry, saving without embedding',
      { title, contentLength: content.length }
    )

    const { data, error } = await supabase
      .from('entries')
      .insert({ title, content })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    // Create tasks from @task markers in content
    if (data) {
      await createTasksFromContent(content, data.id, supabase)
    }

    revalidatePath('/')
    revalidatePath('/todo')
    return { success: true }
  }
}

export async function updateEntry(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || !content) {
    return { error: 'Title and content are required' }
  }

  const supabase = await createClient()

  try {
    // Generate new embedding for the updated entry
    const embedding = await generateEntryEmbedding(title, content)

    const { error } = await supabase
      .from('entries')
      .update({ title, content, embedding })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    // Create tasks from @task markers in updated content
    await createTasksFromContent(content, id, supabase)

    revalidatePath(`/entries/${id}`)
    revalidatePath('/')
    revalidatePath('/todo')
    return { success: true }
  } catch (embeddingError) {
    // If embedding generation fails, still update the entry without new embedding
    logError(
      embeddingError instanceof Error ? embeddingError : new Error(String(embeddingError)),
      'Failed to generate embedding for entry update, saving without new embedding',
      { entryId: id, title, contentLength: content.length }
    )

    const { error } = await supabase
      .from('entries')
      .update({ title, content })
      .eq('id', id)

    if (error) {
      return { error: error.message }
    }

    // Create tasks from @task markers in updated content
    await createTasksFromContent(content, id, supabase)

    revalidatePath(`/entries/${id}`)
    revalidatePath('/')
    revalidatePath('/todo')
    return { success: true }
  }
}

export async function deleteEntry(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}
