'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AIReportProps {
  report: {
    summary: string
    completedToday: number
    upcomingTasks: number
    risks?: Array<{
      level: 'low' | 'medium' | 'high'
      description: string
    }>
  }
}

export function AIReport({ report }: AIReportProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Report</CardTitle>
            <CardDescription>Latest insights from your AI team</CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Updated just now
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm leading-relaxed">{report.summary}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{report.completedToday}</div>
            <div className="text-sm text-muted-foreground">Completed Today</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{report.upcomingTasks}</div>
            <div className="text-sm text-muted-foreground">Upcoming Tasks</div>
          </div>
        </div>

        {/* Risks */}
        {report.risks && report.risks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Risk Alerts</h4>
            {report.risks.map((risk, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getRiskColor(risk.level)}`}
              >
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 capitalize">
                    {risk.level}
                  </Badge>
                  <p className="text-sm flex-1">{risk.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Next Check-in */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next check-in:</span>
            <span className="font-medium">In 6 hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
