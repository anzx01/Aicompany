'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: number | null
  created_at: Date | string
  scheduled_at: Date | string | null
  agent_id: string | null
}

interface TaskListProps {
  tasks: Task[]
  title?: string
  description?: string
}

export function TaskList({ tasks, title = 'Recent Tasks', description = 'Latest activity from your AI company' }: TaskListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600'
    if (priority >= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet</p>
            <p className="text-sm mt-2">Your AI agents will start creating tasks soon</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{task.title}</h4>
                      {task.priority !== null && (
                        <span className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                          P{task.priority}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>
                        Created {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </span>
                      {task.scheduled_at && (
                        <>
                          <span>•</span>
                          <span>
                            Scheduled for {formatDistanceToNow(new Date(task.scheduled_at), { addSuffix: true })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(task.status)}>
                    {formatStatus(task.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
