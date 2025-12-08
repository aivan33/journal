export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY

  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not set')
  }

  try {
    // Call Voyage AI's embeddings API
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
      console.error('Embedding API error:', error)
      throw new Error(`Failed to generate embedding: ${response.statusText}`)
    }

    const data = await response.json()

    // Return the embedding vector from Voyage AI response
    // Voyage AI returns: { data: [{ embedding: [...] }] }
    return data.data?.[0]?.embedding || []
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

export async function generateEntryEmbedding(
  title: string,
  content: string
): Promise<number[]> {
  // Combine title and content for embedding
  const text = `${title}\n\n${content}`
  return generateEmbedding(text)
}
