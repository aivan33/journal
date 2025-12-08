'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateEntryEmbedding } from '@/lib/ai/embeddings'

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

    const { error } = await supabase
      .from('entries')
      .insert({ title, content, embedding })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/')
    return { success: true }
  } catch (embeddingError) {
    // If embedding generation fails, still save the entry without embedding
    console.error('Failed to generate embedding:', embeddingError)

    const { error } = await supabase
      .from('entries')
      .insert({ title, content })

    if (error) {
      return { error: error.message }
    }

    revalidatePath('/')
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

    revalidatePath(`/entries/${id}`)
    revalidatePath('/')
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

    revalidatePath(`/entries/${id}`)
    revalidatePath('/')
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
