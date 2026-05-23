-- Enable pgvector extension for vector similarity search
-- This enables AI-powered memory and semantic search capabilities

-- 1. Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to memories table
ALTER TABLE memories
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create index for vector similarity search (using HNSW for better performance)
CREATE INDEX IF NOT EXISTS memories_embedding_idx
ON memories
USING hnsw (embedding vector_cosine_ops);

-- 4. Create function to search similar memories
CREATE OR REPLACE FUNCTION search_similar_memories(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_company_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  type text,
  content text,
  importance int,
  similarity float,
  created_at timestamp
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.company_id,
    m.type,
    m.content,
    m.importance,
    1 - (m.embedding <=> query_embedding) as similarity,
    m.created_at
  FROM memories m
  WHERE
    (filter_company_id IS NULL OR m.company_id = filter_company_id)
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Create function to get memory statistics
CREATE OR REPLACE FUNCTION get_memory_stats(filter_company_id uuid DEFAULT NULL)
RETURNS TABLE (
  total_memories bigint,
  memories_with_embeddings bigint,
  avg_importance float,
  memory_types jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_memories,
    COUNT(embedding) as memories_with_embeddings,
    AVG(importance) as avg_importance,
    jsonb_object_agg(type, count) as memory_types
  FROM (
    SELECT
      type,
      COUNT(*) as count,
      importance,
      embedding
    FROM memories
    WHERE filter_company_id IS NULL OR company_id = filter_company_id
    GROUP BY type, importance, embedding
  ) subquery;
END;
$$;

-- 6. Add comments for documentation
COMMENT ON COLUMN memories.embedding IS 'Vector embedding (1536 dimensions) for semantic search using OpenAI text-embedding-3-small';
COMMENT ON INDEX memories_embedding_idx IS 'HNSW index for fast vector similarity search using cosine distance';
COMMENT ON FUNCTION search_similar_memories IS 'Search for similar memories using vector similarity (cosine distance)';
COMMENT ON FUNCTION get_memory_stats IS 'Get statistics about memories including embedding coverage';

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION search_similar_memories TO authenticated;
GRANT EXECUTE ON FUNCTION get_memory_stats TO authenticated;
