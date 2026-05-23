'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'

export default function ModelsPage() {
  const [tier, setTier] = useState<'fast' | 'balanced' | 'powerful'>('balanced')
  const [prompt, setPrompt] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.')
  const [useCache, setUseCache] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const testMutation = trpc.llm.test.useMutation({
    onSuccess: (data) => {
      setResponse(data)
    },
    onError: (error) => {
      setResponse({ error: error.message })
    },
  })

  const handleTest = () => {
    if (!prompt.trim()) return

    setResponse(null)
    testMutation.mutate({
      tier,
      prompt,
      systemPrompt,
      useCache,
    })
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Models</h1>
        <p className="text-muted-foreground">
          测试和比较不同的 AI 模型
        </p>
      </div>

      <div className="grid gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>模型配置</CardTitle>
            <CardDescription>选择模型层级和配置提示词</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model Tier */}
            <div className="space-y-2">
              <Label htmlFor="tier">模型层级</Label>
              <Select value={tier} onValueChange={(value: any) => setTier(value)}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">
                    Fast - Claude Haiku ($0.001/1k input)
                  </SelectItem>
                  <SelectItem value="balanced">
                    Balanced - Claude Sonnet ($0.003/1k input)
                  </SelectItem>
                  <SelectItem value="powerful">
                    Powerful - DeepSeek Chat ($0.001/1k input)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt">系统提示词</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="输入系统提示词..."
                rows={3}
              />
            </div>

            {/* User Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">用户提示词</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="输入你的提示词..."
                rows={5}
              />
            </div>

            {/* Use Cache */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-cache"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="use-cache" className="cursor-pointer">
                使用提示词缓存 (仅 Anthropic)
              </Label>
            </div>

            {/* Test Button */}
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending || !prompt.trim()}
              className="w-full"
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  调用中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  测试模型
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Response */}
        {response && (
          <Card>
            <CardHeader>
              <CardTitle>响应结果</CardTitle>
              <CardDescription>
                {response.error ? '发生错误' : 'AI 模型响应'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {response.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">错误</p>
                  <p className="text-red-600 text-sm mt-1">{response.error}</p>
                </div>
              ) : (
                <>
                  {/* Content */}
                  <div className="space-y-2">
                    <Label>内容</Label>
                    <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                      {response.content}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">模型</Label>
                      <p className="text-sm font-mono">{response.model}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">提供商</Label>
                      <p className="text-sm font-mono">{response.provider}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">延迟</Label>
                      <p className="text-sm font-mono">{response.latency}ms</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">总成本</Label>
                      <p className="text-sm font-mono">
                        ${response.cost.totalCost.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  {/* Usage */}
                  <div className="space-y-2">
                    <Label>Token 使用量</Label>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">输入 Tokens</p>
                        <p className="text-sm font-mono">{response.usage.inputTokens}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${response.cost.inputCost.toFixed(6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">输出 Tokens</p>
                        <p className="text-sm font-mono">{response.usage.outputTokens}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${response.cost.outputCost.toFixed(6)}
                        </p>
                      </div>
                      {response.usage.cacheCreationTokens > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">缓存创建</p>
                          <p className="text-sm font-mono">
                            {response.usage.cacheCreationTokens}
                          </p>
                        </div>
                      )}
                      {response.usage.cacheReadTokens > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">缓存读取</p>
                          <p className="text-sm font-mono">
                            {response.usage.cacheReadTokens}
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            节省 ${(response.cost.cacheCost || 0).toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Model Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>模型对比</CardTitle>
            <CardDescription>成本和性能特征</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground">
                <div>层级</div>
                <div>模型</div>
                <div>输入成本</div>
                <div>输出成本</div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Fast</div>
                <div className="font-mono text-xs">claude-3-5-haiku</div>
                <div className="font-mono text-xs">$0.001/1k</div>
                <div className="font-mono text-xs">$0.005/1k</div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Balanced</div>
                <div className="font-mono text-xs">claude-3-5-sonnet</div>
                <div className="font-mono text-xs">$0.003/1k</div>
                <div className="font-mono text-xs">$0.015/1k</div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>Powerful</div>
                <div className="font-mono text-xs">deepseek-chat</div>
                <div className="font-mono text-xs">$0.001/1k</div>
                <div className="font-mono text-xs">$0.002/1k</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
