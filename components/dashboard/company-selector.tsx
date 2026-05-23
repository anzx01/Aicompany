'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Company {
  id: string
  name: string
  type: string
  status: string
}

interface CompanySelectorProps {
  companies: Company[]
  selectedCompanyId: string | null
  onSelect: (companyId: string) => void
}

export function CompanySelector({ companies, selectedCompanyId, onSelect }: CompanySelectorProps) {
  const getCompanyIcon = (type: string) => {
    switch (type) {
      case 'MARKETING':
        return '📢'
      case 'CONTENT':
        return '✍️'
      case 'CUSTOMER_SERVICE':
        return '💬'
      case 'DEVELOPMENT':
        return '💻'
      default:
        return '🏢'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600'
      case 'INITIALIZING':
        return 'text-yellow-600'
      case 'PAUSED':
        return 'text-gray-600'
      case 'ARCHIVED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (companies.length === 0) {
    return null
  }

  return (
    <Select value={selectedCompanyId || undefined} onValueChange={onSelect}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            <div className="flex items-center gap-2">
              <span>{getCompanyIcon(company.type)}</span>
              <span className="font-medium">{company.name}</span>
              <span className={`text-xs ${getStatusColor(company.status)}`}>
                ({company.status})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
