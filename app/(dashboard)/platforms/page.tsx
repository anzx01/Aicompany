'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { trpc } from '@/lib/trpc/client'
import { Loader2, CheckCircle2, XCircle, Activity, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PlatformsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [companyId, setCompanyId] = useState('')
  const [platformId] = useState('twitter')
  const [accessToken, setAccessToken] = useState('')
  const [tweetBody, setTweetBody] = useState('')
  const [tweetTags, setTweetTags] = useState('')
  const [result, setResult] = useState<any>(null)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        setUserEmail(user.email || '')
      } else {
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  // Mutations
  const connectMutation = trpc.platform.connect.useMutation()
  const publishMutation = trpc.platform.publish.useMutation()
  const disconnectMutation = trpc.platform.disconnect.useMutation()

  // Queries
  const getConnectedQuery = trpc.platform.getConnected.useQuery(
    { companyId },
    { enabled: false }
  )
  const getAnalyticsQuery = trpc.platform.getAnalytics.useQuery(
    {
      companyId,
      platformId,
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
    },
    { enabled: false }
  )
  const healthCheckQuery = trpc.platform.healthCheck.useQuery(
    { companyId, platformId },
    { enabled: false }
  )

  const loading =
    connectMutation.isPending ||
    publishMutation.isPending ||
    disconnectMutation.isPending ||
    getConnectedQuery.isFetching ||
    getAnalyticsQuery.isFetching ||
    healthCheckQuery.isFetching

  // Connect Platform
  const handleConnect = async () => {
    if (!companyId || !accessToken) {
      alert('请输入 Company ID 和 Access Token')
      return
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(companyId)) {
      alert('Company ID 必须是 UUID 格式（例如：123e4567-e89b-12d3-a456-426614174000）\n\n请从 Dashboard 或数据库中获取正确的公司 ID')
      return
    }

    setResult(null)

    try {
      const response = await connectMutation.mutateAsync({
        companyId,
        platformId,
        credentials: {
          accessToken,
        },
      })

      setResult({
        success: true,
        message: '平台连接成功！',
        data: response,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || '连接失败',
        error: error,
      })
    }
  }

  // Publish Content
  const handlePublish = async () => {
    if (!companyId || !tweetBody) {
      alert('请输入 Company ID 和推文内容')
      return
    }

    setResult(null)

    try {
      const response = await publishMutation.mutateAsync({
        companyId,
        platformId,
        content: {
          body: tweetBody,
          tags: tweetTags ? tweetTags.split(',').map((t) => t.trim()) : [],
        },
      })

      setResult({
        success: response.success,
        message: response.success
          ? `发布成功！URL: ${response.url}`
          : `发布失败: ${response.error}`,
        data: response,
      })

      if (response.success) {
        setTweetBody('')
        setTweetTags('')
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })
    }
  }

  // Get Analytics
  const handleGetAnalytics = async () => {
    if (!companyId) {
      alert('请输入 Company ID')
      return
    }

    setResult(null)

    try {
      const response = await getAnalyticsQuery.refetch()

      setResult({
        success: true,
        message: '分析数据获取成功！',
        data: response.data,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })
    }
  }

  // Health Check
  const handleHealthCheck = async () => {
    if (!companyId) {
      alert('请输入 Company ID')
      return
    }

    setResult(null)

    try {
      const response = await healthCheckQuery.refetch()

      setResult({
        success: response.data?.status.healthy,
        message: response.data?.status.healthy
          ? `平台健康！延迟: ${response.data.status.latency}ms`
          : `平台不健康: ${response.data?.status.error}`,
        data: response.data,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })
    }
  }

  // Get Connected Platforms
  const handleGetConnected = async () => {
    if (!companyId) {
      alert('请输入 Company ID')
      return
    }

    setResult(null)

    try {
      const response = await getConnectedQuery.refetch()

      setResult({
        success: true,
        message: `找到 ${response.data?.length || 0} 个已连接的平台`,
        data: response.data,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })
    }
  }

  // Disconnect Platform
  const handleDisconnect = async () => {
    if (!companyId) {
      alert('请输入 Company ID')
      return
    }

    if (!confirm('确定要断开平台连接吗？')) {
      return
    }

    setResult(null)

    try {
      const response = await disconnectMutation.mutateAsync({
        companyId,
        platformId,
      })

      setResult({
        success: true,
        message: '平台已断开连接！',
        data: response,
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message,
      })
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Integrations</h1>
        <p className="text-muted-foreground">
          管理社交媒体和开发平台集成
        </p>
      </div>

      {/* Authentication Check */}
      {isAuthenticated === null && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">检查登录状态...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isAuthenticated === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>需要登录</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">此页面需要登录才能访问。请先登录您的账户。</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/auth/login')}>
                前往登录
              </Button>
              <Button variant="outline" onClick={() => router.push('/auth/sign-up')}>
                注册账户
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isAuthenticated === true && (
        <>
          {/* User Info */}
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>已登录</AlertTitle>
            <AlertDescription>
              当前用户: {userEmail}
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>配置</CardTitle>
            <CardDescription>设置平台连接参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">Company ID (UUID)</Label>
                <Input
                  id="companyId"
                  placeholder="例如：123e4567-e89b-12d3-a456-426614174000"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  请输入 UUID 格式的公司 ID，可从 Dashboard 或数据库获取
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformId">平台</Label>
                <Input
                  id="platformId"
                  value="Twitter"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="输入访问令牌"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                用于 Mock 测试，任何值都可以
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Connect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">连接平台</CardTitle>
              <CardDescription>保存平台凭证</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="w-full"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="mr-2 h-4 w-4" />
                )}
                连接 Twitter
              </Button>
            </CardContent>
          </Card>

          {/* Health Check */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">健康检查</CardTitle>
              <CardDescription>检查平台状态</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleHealthCheck}
                disabled={healthCheckQuery.isFetching}
                variant="outline"
                className="w-full"
              >
                {healthCheckQuery.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="mr-2 h-4 w-4" />
                )}
                健康检查
              </Button>
            </CardContent>
          </Card>

          {/* Get Connected */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">已连接平台</CardTitle>
              <CardDescription>查看所有连接</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGetConnected}
                disabled={getConnectedQuery.isFetching}
                variant="outline"
                className="w-full"
              >
                {getConnectedQuery.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  '查看连接'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">获取分析</CardTitle>
              <CardDescription>查看平台指标</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGetAnalytics}
                disabled={getAnalyticsQuery.isFetching}
                variant="outline"
                className="w-full"
              >
                {getAnalyticsQuery.isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  '获取分析'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Disconnect */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">断开连接</CardTitle>
              <CardDescription>移除平台连接</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="mr-2 h-4 w-4" />
                )}
                断开连接
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Publish Content */}
        <Card>
          <CardHeader>
            <CardTitle>发布内容</CardTitle>
            <CardDescription>发布推文到 Twitter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tweetBody">推文内容</Label>
              <Textarea
                id="tweetBody"
                placeholder="What's happening?"
                value={tweetBody}
                onChange={(e) => setTweetBody(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tweetTags">标签 (逗号分隔)</Label>
              <Input
                id="tweetTags"
                placeholder="AI,Automation"
                value={tweetTags}
                onChange={(e) => setTweetTags(e.target.value)}
              />
            </div>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="w-full"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发布中...
                </>
              ) : (
                '发布推文'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">{result.message}</p>
              </div>

              {result.error && (
                <div>
                  <Label className="text-red-600">错误详情:</Label>
                  <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}

              {result.data && (
                <div>
                  <Label>响应数据:</Label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-xs">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
        </>
      )}
    </div>
  )
}
