'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type CompanyType = 'MARKETING' | 'CONTENT' | 'CUSTOMER_SERVICE' | 'DEVELOPMENT'

interface CompanyTypeOption {
  type: CompanyType
  icon: string
  title: string
  description: string
  features: string[]
}

const companyTypes: CompanyTypeOption[] = [
  {
    type: 'MARKETING',
    icon: '📢',
    title: 'Marketing Company',
    description: 'AI-powered marketing automation and campaign management',
    features: [
      'Social media management',
      'Content distribution',
      'Analytics & reporting',
      'Campaign optimization'
    ]
  },
  {
    type: 'CONTENT',
    icon: '✍️',
    title: 'Content Company',
    description: 'Automated content creation and publishing',
    features: [
      'Blog post generation',
      'SEO optimization',
      'Multi-platform publishing',
      'Content calendar'
    ]
  },
  {
    type: 'CUSTOMER_SERVICE',
    icon: '💬',
    title: 'Customer Service',
    description: '24/7 AI customer support and ticket management',
    features: [
      'Automated responses',
      'Ticket routing',
      'Sentiment analysis',
      'Multi-channel support'
    ]
  },
  {
    type: 'DEVELOPMENT',
    icon: '💻',
    title: 'Development Company',
    description: 'AI-assisted software development and code review',
    features: [
      'Code generation',
      'Bug detection',
      'Code review',
      'Documentation'
    ]
  }
]

interface CompanyTypeSelectorProps {
  selectedType: CompanyType | null
  onSelect: (type: CompanyType) => void
}

export function CompanyTypeSelector({ selectedType, onSelect }: CompanyTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {companyTypes.map((option) => (
        <Card
          key={option.type}
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            selectedType === option.type && 'ring-2 ring-primary'
          )}
          onClick={() => onSelect(option.type)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{option.icon}</span>
              <div>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {option.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
