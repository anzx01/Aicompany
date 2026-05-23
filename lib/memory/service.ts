// Memory Service - Store and retrieve memories with vector search

import { db } from '@/lib/db'
import { memories } from '@/lib/db/schema'
import { eq, and, desc, sql, gte } from 'drizzle-orm'
import { generateEmbedding, cosineSimilarity } from './embeddings'
import type { Memory, MemorySearchOptions, MemorySearchResult, MemoryStats, MemoryType } from './types'

/**
 * Store a new memory with embedding
 */
export async function storeMemory(
  companyId: string,
  type: MemoryType,
  content: string,
  importance: number = 50,
  metadata?: Record<string, any>
): Promise<Memory> {
  // Generate embedding for the content
  const embedding = await generateEmbedding(content)

  // Store in database
  // Note: embedding field will be added after pgvector is enabled
  const [memory] = await db.insert(memories).values({
    company_id: companyId,
    type,
    content,
    importance,
    // embedding: sql`${JSON.stringify(embedding)}::vector`, // Uncomment after enabling pgvector
  }).returning()

  return {
    id: memory.id,
    companyId: memory.company_id,
    type: memory.type as MemoryType,
    content: memory.content,
    importance: memory.importance || 50,
    embedding,
    metadata: metadata || {},
    createdAt: memory.created_at,
    updatedAt: memory.updated_at,
  }
}

/**
 * Search memories using semantic similarity with pgvector
 * Note: This requires pgvector extension to be enabled
 */
export async function searchMemories(options: MemorySearchOptions): Promise<MemorySearchResult[]> {
  const {
    companyId,
    query,
    type,
    limit = 10,
    minImportance = 0,
    minSimilarity = 0.7,
  } = options

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query)

  // Fallback to client-side similarity search if pgvector is not enabled
  // In production, use pgvector for better performance
  const conditions = [eq(memories.company_id, companyId)]

  if (type) {
    conditions.push(eq(memories.type, type))
  }

  if (minImportance > 0) {
    conditions.push(gte(memories.importance, minImportance))
  }

  const allMemories = await db.query.memories.findMany({
    where: and(...conditions),
    orderBy: [desc(memories.created_at)],
  })

  // Calculate similarity for each memory
  const results: MemorySearchResult[] = []

  for (const memory of allMemories) {
    // Generate embedding on-the-fly (in production, use stored embeddings)
    const memoryEmbedding = await generateEmbedding(memory.content)
    const similarity = cosineSimilarity(queryEmbedding, memoryEmbedding)

    if (similarity >= minSimilarity) {
      results.push({
        memory: {
          id: memory.id,
          companyId: memory.company_id,
          type: memory.type as MemoryType,
          content: memory.content,
          importance: memory.importance || 50,
          embedding: memoryEmbedding,
          metadata: {},
          createdAt: memory.created_at,
          updatedAt: memory.updated_at,
        },
        similarity,
      })
    }
  }

  // Sort by similarity (descending) and limit
  results.sort((a, b) => b.similarity - a.similarity)
  return results.slice(0, limit)
}

/**
 * Get recent memories for a company
 */
export async function getRecentMemories(
  companyId: string,
  limit: number = 20,
  type?: MemoryType
): Promise<Memory[]> {
  const conditions = [eq(memories.company_id, companyId)]

  if (type) {
    conditions.push(eq(memories.type, type))
  }

  const results = await db.query.memories.findMany({
    where: and(...conditions),
    orderBy: [desc(memories.created_at)],
    limit,
  })

  return results.map(memory => ({
    id: memory.id,
    companyId: memory.company_id,
    type: memory.type as MemoryType,
    content: memory.content,
    importance: memory.importance || 50,
    metadata: {}, // Not stored in DB yet
    createdAt: memory.created_at,
    updatedAt: memory.updated_at,
  }))
}

/**
 * Get important memories (importance >= 70)
 */
export async function getImportantMemories(
  companyId: string,
  limit: number = 10
): Promise<Memory[]> {
  const results = await db.query.memories.findMany({
    where: and(
      eq(memories.company_id, companyId),
      gte(memories.importance, 70)
    ),
    orderBy: [desc(memories.importance), desc(memories.created_at)],
    limit,
  })

  return results.map(memory => ({
    id: memory.id,
    companyId: memory.company_id,
    type: memory.type as MemoryType,
    content: memory.content,
    importance: memory.importance || 50,
    metadata: {}, // Not stored in DB yet
    createdAt: memory.created_at,
    updatedAt: memory.updated_at,
  }))
}

/**
 * Update memory importance
 */
export async function updateMemoryImportance(
  memoryId: string,
  importance: number
): Promise<void> {
  await db.update(memories)
    .set({
      importance,
      updated_at: new Date()
    })
    .where(eq(memories.id, memoryId))
}

/**
 * Delete old, low-importance memories
 * Useful for memory management
 */
export async function pruneMemories(
  companyId: string,
  olderThanDays: number = 90,
  maxImportance: number = 30
): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

  const result = await db.delete(memories)
    .where(
      and(
        eq(memories.company_id, companyId),
        sql`${memories.created_at} < ${cutoffDate}`,
        sql`${memories.importance} <= ${maxImportance}`
      )
    )

  // Drizzle ORM doesn't return rowCount, so we'll return 0 for now
  // In production, you might want to count before deleting
  return 0
}

/**
 * Get memory statistics for a company
 */
export async function getMemoryStats(companyId: string): Promise<MemoryStats> {
  const allMemories = await db.query.memories.findMany({
    where: eq(memories.company_id, companyId),
  })

  const byType: Record<MemoryType, number> = {
    PRODUCT: 0,
    MARKETING: 0,
    CUSTOMER: 0,
    DECISION: 0,
    TASK: 0,
    CONVERSATION: 0,
  }

  let totalImportance = 0
  let oldestDate: Date | null = null
  let newestDate: Date | null = null

  for (const memory of allMemories) {
    const type = memory.type as MemoryType
    byType[type] = (byType[type] || 0) + 1
    totalImportance += memory.importance || 50

    if (!oldestDate || memory.created_at < oldestDate) {
      oldestDate = memory.created_at
    }
    if (!newestDate || memory.created_at > newestDate) {
      newestDate = memory.created_at
    }
  }

  return {
    total: allMemories.length,
    byType,
    averageImportance: allMemories.length > 0 ? totalImportance / allMemories.length : 0,
    oldestMemory: oldestDate,
    newestMemory: newestDate,
  }
}

/**
 * Delete a memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  await db.delete(memories).where(eq(memories.id, memoryId))
}
