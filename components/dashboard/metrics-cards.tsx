'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react'

interface Metric {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: string
}

interface MetricsCardsProps {
  companyType: string
}

export function MetricsCards({ companyType }: MetricsCardsProps) {
  const getMetrics = (type: string): Metric[] => {
    switch (type) {
      case 'MARKETING':
        return [
          {
            label: 'Total Reach',
            value: '12.5K',
            change: 15.3,
            changeLabel: 'vs last week',
            icon: '👥'
          },
          {
            label: 'Engagement Rate',
            value: '4.2%',
            change: 8.1,
            changeLabel: 'vs last week',
            icon: '💬'
          },
          {
            label: 'Conversion Rate',
            value: '2.8%',
            change: -2.4,
            changeLabel: 'vs last week',
            icon: '🎯'
          },
          {
            label: 'ROI',
            value: '3.2x',
            change: 12.5,
            changeLabel: 'vs last month',
            icon: '💰'
          }
        ]
      case 'CONTENT':
        return [
          {
            label: 'Articles Published',
            value: '24',
            change: 20,
            changeLabel: 'vs last week',
            icon: '📝'
          },
          {
            label: 'Total Views',
            value: '45.2K',
            change: 18.5,
            changeLabel: 'vs last week',
            icon: '👁️'
          },
          {
            label: 'Avg. Read Time',
            value: '3.5 min',
            change: 5.2,
            changeLabel: 'vs last week',
            icon: '⏱️'
          },
          {
            label: 'SEO Score',
            value: '87/100',
            change: 3.8,
            changeLabel: 'vs last week',
            icon: '📊'
          }
        ]
      case 'CUSTOMER_SERVICE':
        return [
          {
            label: 'Tickets Resolved',
            value: '156',
            change: 12.3,
            changeLabel: 'vs last week',
            icon: '✅'
          },
          {
            label: 'Avg. Response Time',
            value: '2.3 min',
            change: -15.2,
            changeLabel: 'improvement',
            icon: '⚡'
          },
          {
            label: 'Customer Satisfaction',
            value: '4.8/5',
            change: 4.2,
            changeLabel: 'vs last week',
            icon: '⭐'
          },
          {
            label: 'Resolution Rate',
            value: '94%',
            change: 2.1,
            changeLabel: 'vs last week',
            icon: '🎯'
          }
        ]
      case 'DEVELOPMENT':
        return [
          {
            label: 'Commits',
            value: '87',
            change: 23.5,
            changeLabel: 'vs last week',
            icon: '💻'
          },
          {
            label: 'Code Quality',
            value: '92/100',
            change: 5.3,
            changeLabel: 'vs last week',
            icon: '✨'
          },
          {
            label: 'Bugs Fixed',
            value: '34',
            change: 18.2,
            changeLabel: 'vs last week',
            icon: '🐛'
          },
          {
            label: 'Deploy Success',
            value: '98%',
            change: 1.5,
            changeLabel: 'vs last week',
            icon: '🚀'
          }
        ]
      default:
        return []
    }
  }

  const metrics = getMetrics(companyType)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs">{metric.label}</CardDescription>
              {metric.icon && <span className="text-2xl">{metric.icon}</span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {metric.change > 0 ? (
                    <>
                      <ArrowUpIcon className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">
                        +{metric.change}%
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownIcon className="h-3 w-3 text-red-600" />
                      <span className="text-red-600 font-medium">
                        {metric.change}%
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">{metric.changeLabel}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
