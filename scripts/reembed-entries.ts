import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

// Re-embedding script for upgrading from voyage-3-lite to voyage-3
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY

  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not set')
  }

  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to generate embedding: ${error}`)
  }

  const data = await response.json()
  return data.data?.[0]?.embedding || []
}

async function reembedAllEntries() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not set')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch all entries
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, title, content')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch entries: ${error.message}`)
  }

  if (!entries || entries.length === 0) {
    console.log('No entries to re-embed')
    return
  }

  console.log(`Found ${entries.length} entries to re-embed\n`)

  let successCount = 0
  let errorCount = 0

  for (const entry of entries) {
    try {
      console.log(`Processing: ${entry.title}`)

      // Generate embedding
      const text = `${entry.title}\n\n${entry.content}`
      const embedding = await generateEmbedding(text)

      // Update the entry with new embedding
      const { error: updateError } = await supabase
        .from('entries')
        .update({ embedding })
        .eq('id', entry.id)

      if (updateError) {
        throw updateError
      }

      successCount++
      console.log(`✓ Successfully re-embedded: ${entry.title}`)

      // Add 25-second delay to stay under 3 RPM rate limit
      if (successCount < entries.length) {
        console.log(`Waiting 25 seconds before next request...\n`)
        await new Promise((resolve) => setTimeout(resolve, 25000))
      }
    } catch (err) {
      errorCount++
      console.error(`✗ Failed to re-embed: ${entry.title}`)
      console.error(`  Error: ${err}\n`)
    }
  }

  console.log('\n=== Re-embedding Complete ===')
  console.log(`Successful: ${successCount}`)
  console.log(`Failed: ${errorCount}`)
  console.log(`Total: ${entries.length}`)
}

// Run the script
reembedAllEntries()
  .then(() => {
    console.log('\nScript completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nScript failed:', error)
    process.exit(1)
  })
