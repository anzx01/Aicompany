// Memory System Types

export type MemoryType = 'PRODUCT' | 'MARKETING' | 'CUSTOMER' | 'DECISION' | 'TASK' | 'CONVERSATION'

export interface Memory {
  id: string
  companyId: string
  type: MemoryType
  content: string
  importance: number // 0-100
  embedding?: number[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface MemorySearchOptions {
  companyId: string
  query: string
  type?: MemoryType
  limit?: number
  minImportance?: number
  minSimilarity?: number
}

export interface MemorySearchResult {
  memory: Memory
  similarity: number
}

export interface MemoryStats {
  total: number
  byType: Record<MemoryType, number>
  averageImportance: number
  oldestMemory: Date | null
  newestMemory: Date | null
}
