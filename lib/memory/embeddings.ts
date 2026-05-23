// Embedding Generation Service
// Uses OpenAI's text-embedding-3-small model for cost-effective embeddings

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embedding vector for text
 * Uses text-embedding-3-small (1536 dimensions, $0.00002/1k tokens)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient than calling generateEmbedding multiple times
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Failed to generate embeddings batch:', error)
    throw new Error('Failed to generate embeddings batch')
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Estimate embedding cost
 * text-embedding-3-small: $0.00002 per 1k tokens
 */
export function estimateEmbeddingCost(textLength: number): number {
  // Rough estimate: 1 token ≈ 4 characters
  const estimatedTokens = textLength / 4
  const costPer1kTokens = 0.00002
  return (estimatedTokens / 1000) * costPer1kTokens
}
