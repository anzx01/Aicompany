'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'

interface HeartbeatResult {
  companyId: string
  companyName: string
  tasksExecuted: number
  tasksCreated: number
  memoriesCreated: number
  errors: string[]
  timestamp: string | Date
}

export default function HeartbeatTestPage() {
  const [results, setResults] = useState<HeartbeatResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeAllMutation = trpc.heartbeat.executeAll.useMutation()

  const handleExecuteAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await executeAllMutation.mutateAsync()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">心跳机制测试</h1>
        <p className="text-muted-foreground">
          手动触发心跳执行，测试所有活跃公司的任务处理
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>执行心跳</CardTitle>
          <CardDescription>
            点击按钮手动触发心跳，系统会检查所有活跃公司并执行待处理任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExecuteAll}
            disabled={loading}
            size="lg"
          >
            {loading ? '执行中...' : '执行所有公司心跳'}
          </Button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">错误</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">执行结果</h2>

          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.companyName}</CardTitle>
                    <Badge variant={result.errors.length > 0 ? 'destructive' : 'default'}>
                      {result.errors.length > 0 ? '有错误' : '成功'}
                    </Badge>
                  </div>
                  <CardDescription>
                    公司 ID: {result.companyId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">执行任务</p>
                      <p className="text-2xl font-bold">{result.tasksExecuted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">创建任务</p>
                      <p className="text-2xl font-bold">{result.tasksCreated}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">创建记忆</p>
                      <p className="text-2xl font-bold">{result.memoriesCreated}</p>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-red-800 mb-2">错误信息:</p>
                      <ul className="space-y-1">
                        {result.errors.map((error, i) => (
                          <li key={i} className="text-sm text-red-600">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-muted-foreground">
                    执行时间: {new Date(result.timestamp).toLocaleString('zh-CN')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>统计摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">总公司数</p>
                  <p className="text-2xl font-bold">{results.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总执行任务</p>
                  <p className="text-2xl font-bold">
                    {results.reduce((sum, r) => sum + r.tasksExecuted, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总创建任务</p>
                  <p className="text-2xl font-bold">
                    {results.reduce((sum, r) => sum + r.tasksCreated, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总错误数</p>
                  <p className="text-2xl font-bold text-red-600">
                    {results.reduce((sum, r) => sum + r.errors.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>关于心跳机制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">什么是心跳机制？</h3>
            <p className="text-sm text-muted-foreground">
              心跳机制是一个定期执行的后台任务，每 6 小时自动检查所有活跃公司，
              执行待处理的任务，并根据需要创建新任务。这样可以大幅降低 AI API 调用成本。
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">心跳执行内容</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 检查所有活跃公司</li>
              <li>• 查找待处理或已调度的任务</li>
              <li>• 分配空闲 Agent 执行任务</li>
              <li>• CEO Agent 分析情况并创建新任务</li>
              <li>• 存储执行记录到记忆系统</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">自动执行配置</h3>
            <p className="text-sm text-muted-foreground">
              要启用自动心跳执行，需要在 Supabase 中配置 pg_cron。
              详细步骤请查看 <code className="bg-muted px-1 py-0.5 rounded">HEARTBEAT_SETUP.md</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
