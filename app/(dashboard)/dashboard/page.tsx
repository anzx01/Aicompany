'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import ReactMarkdown from 'react-markdown'
import {
  Plus, Building2, Sparkles, Rocket, Target, CheckCircle2,
  Clock, DollarSign, Zap, TrendingUp, Activity, Bot, AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')

  const { data: companies, isLoading: companiesLoading } = trpc.company.list.useQuery()
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.company.getDashboard.useQuery(
    { companyId: companyId || '' },
    { enabled: !!companyId }
  )
  const { data: goals } = trpc.company.listGoals.useQuery(
    { companyId: companyId || '' },
    { enabled: !!companyId }
  )

  const handleCompanySelect = (newCompanyId: string) => {
    router.push(`/dashboard?companyId=${newCompanyId}`)
  }

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your companies...</p>
        </div>
      </div>
    )
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl"></div>
          <Building2 className="h-24 w-24 text-primary relative" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-3xl font-bold">Welcome to AI Company Builder</h2>
          <p className="text-muted-foreground">
            Create your first autonomous AI company and watch it run itself.
          </p>
        </div>
        <Link href="/company/create">
          <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-5 w-5" />
            Create Your First Company
          </Button>
        </Link>
      </div>
    )
  }

  const selectedCompany = companyId
    ? companies.find(c => c.id === companyId)
    : companies[0]

  if (!selectedCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Company not found</h2>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500'
      case 'PAUSED': return 'bg-yellow-500'
      case 'INITIALIZING': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Running Autonomously'
      case 'PAUSED': return 'Paused'
      case 'INITIALIZING': return 'Initializing'
      default: return status
    }
  }

  const activeGoals = goals?.filter(g => g.status === 'ACTIVE') || []
  const completedTasks = dashboardData?.tasks.filter(t => t.status === 'COMPLETED').length || 0
  const pendingTasks = dashboardData?.tasks.filter(t => t.status === 'PENDING').length || 0
  const inProgressTasks = dashboardData?.tasks.filter(t => t.status === 'IN_PROGRESS').length || 0

  const totalCost = dashboardData?.costs?.total || 0
  const budgetUsed = dashboardData?.costs?.budgetUsedPercent || 0
  const budget = (selectedCompany.config as any)?.budget || 0

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">{selectedCompany.name}</h1>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="capitalize">
              {selectedCompany.type.replace('_', ' ')}
            </Badge>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedCompany.status)}`}>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedCompany.status)} animate-ping`}></div>
              </div>
              <span className="text-sm font-medium">{getStatusText(selectedCompany.status)}</span>
            </div>
          </div>
        </div>
        {companies.length > 1 && (
          <select
            value={selectedCompany.id}
            onChange={(e) => handleCompanySelect(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Autonomous Status Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Autonomous Operation Active</h3>
              <p className="text-muted-foreground mb-4">
                Your company is running on autopilot. AI agents are creating and executing tasks based on your goals.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm">{dashboardData?.agents.length || 0} AI Agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-sm">{inProgressTasks} Tasks Running</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">{completedTasks} Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm">{pendingTasks} Queued</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Progress */}
      {activeGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Active Goals
            </CardTitle>
            <CardDescription>AI agents are working towards these objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                  <Badge variant="outline">Priority {goal.priority}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-start gap-3 py-3 border-b last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  task.status === 'COMPLETED' ? 'bg-green-500' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.status === 'COMPLETED' ? 'Completed' :
                     task.status === 'IN_PROGRESS' ? 'In Progress' :
                     'Pending'}
                  </p>
                  {task.status === 'COMPLETED' && task.result && (
                    <div className="mt-2 p-3 bg-muted/50 rounded text-sm border border-muted">
                      <p className="text-muted-foreground mb-2 font-semibold">Result:</p>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>
                          {(task.result as any)?.content || 'Task completed successfully'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!dashboardData?.tasks || dashboardData.tasks.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tasks yet. AI agents will create tasks automatically.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Monthly Budget</span>
                  <span className="font-semibold">${budget}</span>
                </div>
                <Progress value={budgetUsed} className="h-2" />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {budgetUsed.toFixed(1)}% used this month
                  </p>
                  <p className="text-xs font-medium">
                    {formatCurrency(totalCost)} spent
                  </p>
                </div>
              </div>
              {budgetUsed > 80 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Budget Warning</p>
                    <p className="text-xs text-red-700">
                      {budgetUsed >= 90 ? 'Company will pause at 90%' : 'Approaching budget limit'}
                    </p>
                  </div>
                </div>
              )}
              {budgetUsed <= 80 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Auto-pause at 90%</span>
                    <br />
                    <span className="text-muted-foreground">
                      Company will automatically pause when budget limit is reached
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Your company is running autonomously</h4>
              <p className="text-sm text-muted-foreground">
                AI agents are creating tasks, executing them, and adapting based on results.
                Check back anytime to see progress, or let it run completely hands-off.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
