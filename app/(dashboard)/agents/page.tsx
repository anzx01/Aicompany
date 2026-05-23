'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Play, Pause, Plus, Bot, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AgentsPage() {
  const utils = trpc.useUtils()
  const [companyId, setCompanyId] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState(5)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [schedulerMessage, setSchedulerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const createTaskMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      refetchTasks()
      setTaskTitle('')
      setTaskDescription('')
      setTaskPriority(5)
    },
  })

  const startSchedulerMutation = trpc.agent.startScheduler.useMutation({
    onSuccess: () => {
      setSchedulerMessage({ type: 'success', text: '调度器已启动' })
      refetchStats()
      setTimeout(() => setSchedulerMessage(null), 3000)
    },
    onError: (error) => {
      setSchedulerMessage({ type: 'error', text: `启动失败: ${error.message}` })
      setTimeout(() => setSchedulerMessage(null), 3000)
    },
  })

  const stopSchedulerMutation = trpc.agent.stopScheduler.useMutation({
    onSuccess: () => {
      setSchedulerMessage({ type: 'success', text: '调度器已停止' })
      refetchStats()
      setTimeout(() => setSchedulerMessage(null), 3000)
    },
    onError: (error) => {
      setSchedulerMessage({ type: 'error', text: `停止失败: ${error.message}` })
      setTimeout(() => setSchedulerMessage(null), 3000)
    },
  })

  const deleteTaskMutation = trpc.task.delete.useMutation({
    onSuccess: async () => {
      await utils.task.list.invalidate()
      await utils.agent.getSchedulerStats.invalidate()
      setDeletingTaskId(null)
    },
    onError: () => {
      setDeletingTaskId(null)
    },
  })

  const { data: schedulerStats, refetch: refetchStats } = trpc.agent.getSchedulerStats.useQuery(
    { companyId },
    { enabled: !!companyId }
  )

  const { data: companyAgents, refetch: refetchAgents } = trpc.agent.getByCompany.useQuery(
    { companyId },
    { enabled: !!companyId }
  )

  const { data: recentTasks, refetch: refetchTasks } = trpc.task.list.useQuery(
    { companyId, limit: 20 },
    { enabled: !!companyId }
  )

  const handleCreateTask = () => {
    if (!companyId || !taskTitle) return

    createTaskMutation.mutate({
      companyId,
      title: taskTitle,
      description: taskDescription,
      priority: taskPriority,
    })
  }

  const handleDeleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      setDeletingTaskId(taskId)
      deleteTaskMutation.mutate({ id: taskId })
    }
  }

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!companyId || deletingTaskId) return

    const interval = setInterval(() => {
      refetchTasks()
      refetchStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [companyId, deletingTaskId, refetchTasks, refetchStats])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">AI Agents</h1>
            <p className="text-muted-foreground">Manage AI agents and task scheduling</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Configuration */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Company Configuration
            </CardTitle>
            <CardDescription>Select the company you want to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="company-id">Company ID</Label>
              <Input
                id="company-id"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="Enter company ID"
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {companyId && (
          <>
            {/* Scheduler Control & Stats */}
            <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
              <Card className="border-primary/20 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Scheduler Control
                  </CardTitle>
                  <CardDescription>Start or stop automatic task scheduling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => startSchedulerMutation.mutate({ companyId })}
                      disabled={startSchedulerMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      {startSchedulerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Start
                    </Button>

                    <Button
                      onClick={() => stopSchedulerMutation.mutate({ companyId })}
                      variant="outline"
                      disabled={stopSchedulerMutation.isPending}
                      className="flex-1 gap-2"
                    >
                      {stopSchedulerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                      Stop
                    </Button>
                  </div>

                  {schedulerMessage && (
                    <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${
                      schedulerMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {schedulerMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {schedulerMessage.text}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/20 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Task Statistics
                  </CardTitle>
                  <CardDescription>Real-time task status</CardDescription>
                </CardHeader>
                <CardContent>
                  {schedulerStats ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors">
                        <p className="text-xs text-muted-foreground mb-1">Pending</p>
                        <p className="text-3xl font-bold">{schedulerStats.pending}</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 transition-colors">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">In Progress</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{schedulerStats.inProgress}</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-300 transition-colors">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Completed</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{schedulerStats.completed}</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 transition-colors">
                        <p className="text-xs text-red-600 dark:text-red-400 mb-1">Failed</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">{schedulerStats.failed}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Create Task */}
            <Card className="border-primary/20 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Create New Task
                </CardTitle>
                <CardDescription>Create tasks for AI agents to execute</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g., Write an article about AI"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority (1-10)</Label>
                    <Input
                      id="task-priority"
                      type="number"
                      min="1"
                      max="10"
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-description">Task Description</Label>
                  <Textarea
                    id="task-description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe the task requirements in detail..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending || !taskTitle}
                  className="w-full gap-2"
                  size="lg"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Task
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Company Agents */}
            {companyAgents && companyAgents.length > 0 && (
              <Card className="border-primary/20 shadow-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Agents
                  </CardTitle>
                  <CardDescription>All AI agents in this company</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {companyAgents.map((agent, index) => (
                      <div
                        key={agent.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 animate-scale-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{agent.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{agent.role}</p>
                          </div>
                          <Badge
                            variant={
                              agent.status === 'IDLE' ? 'default' :
                              agent.status === 'RUNNING' ? 'secondary' :
                              agent.status === 'ERROR' ? 'destructive' :
                              'outline'
                            }
                          >
                            {agent.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks */}
            {recentTasks && recentTasks.length > 0 && (
              <Card className="border-primary/20 shadow-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Task List
                  </CardTitle>
                  <CardDescription>Recent tasks and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="p-4 border rounded-lg hover:border-primary/30 transition-all animate-scale-in"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge
                              variant={
                                task.status === 'COMPLETED' ? 'default' :
                                task.status === 'IN_PROGRESS' ? 'secondary' :
                                task.status === 'FAILED' ? 'destructive' :
                                'outline'
                              }
                              className="whitespace-nowrap"
                            >
                              {task.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={deletingTaskId === task.id}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              {deletingTaskId === task.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {task.result ? (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg border text-sm">
                            <p className="font-medium text-xs text-muted-foreground mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Result:
                            </p>
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {(() => {
                                if (typeof task.result === 'object' && task.result !== null && 'content' in task.result && typeof task.result.content === 'string') {
                                  return (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.result.content}
                                    </ReactMarkdown>
                                  )
                                } else if (typeof task.result === 'string') {
                                  return (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {task.result}
                                    </ReactMarkdown>
                                  )
                                } else {
                                  return (
                                    <pre className="whitespace-pre-wrap text-xs">
                                      {JSON.stringify(task.result, null, 2)}
                                    </pre>
                                  )
                                }
                              })()}
                            </div>
                          </div>
                        ) : null}

                        {task.error && (
                          <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                            <p className="font-medium text-xs text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Error:
                            </p>
                            <p className="text-red-800 dark:text-red-300">{task.error}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
