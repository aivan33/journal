'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateEntryEmbedding } from '@/lib/ai/embeddings'

async function createTasksFromContent(content: string, entryId: string, supabase: any) {
  // Parse content for @task markers
  const lines = content.split('\n')
  const taskRegex = /@task\s+(.+)/i

  for (const line of lines) {
    const match = line.match(taskRegex)
    if (match) {
      const taskContent = match[1].trim()
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
    revalidatePath('/tasks')
    return { success: true }
  } catch (embeddingError) {
    // If embedding generation fails, still save the entry without embedding
    console.error('Failed to generate embedding:', embeddingError)

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
    revalidatePath('/tasks')
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
    revalidatePath('/tasks')
    return { success: true }
  } catch (embeddingError) {
    // If embedding generation fails, still update the entry without new embedding
    console.error('Failed to generate embedding:', embeddingError)

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
    revalidatePath('/tasks')
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
