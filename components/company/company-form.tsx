'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { CompanyType } from './company-type-selector'

const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  budget: z.number().min(100).max(10000),
  automationLevel: z.number().min(1).max(10),
  heartbeatInterval: z.number().min(3600).max(86400) // 1 hour to 24 hours in seconds
})

export type CompanyFormData = z.infer<typeof companyFormSchema>

interface CompanyFormProps {
  companyType: CompanyType
  onSubmit: (data: CompanyFormData) => void
  onBack: () => void
  isLoading?: boolean
}

export function CompanyForm({ companyType, onSubmit, onBack, isLoading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      description: '',
      budget: 1000,
      automationLevel: 5,
      heartbeatInterval: 21600 // 6 hours
    }
  })

  const budget = watch('budget')
  const automationLevel = watch('automationLevel')
  const heartbeatInterval = watch('heartbeatInterval')

  const getCompanyTypeLabel = (type: CompanyType) => {
    const labels = {
      MARKETING: 'Marketing Company',
      CONTENT: 'Content Company',
      CUSTOMER_SERVICE: 'Customer Service',
      DEVELOPMENT: 'Development Company'
    }
    return labels[type]
  }

  const formatHeartbeatInterval = (seconds: number) => {
    const hours = seconds / 3600
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Configure Your {getCompanyTypeLabel(companyType)}</h3>
        <p className="text-sm text-muted-foreground">
          Set up the basic configuration for your AI company
        </p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Company Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Acme Marketing AI"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe what your AI company will do..."
          rows={4}
          {...register('description')}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Monthly Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget">Monthly Budget: ${budget}</Label>
        <Slider
          id="budget"
          min={100}
          max={10000}
          step={100}
          value={[budget]}
          onValueChange={(value) => setValue('budget', value[0])}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Estimated monthly cost for AI operations and platform integrations
        </p>
      </div>

      {/* Automation Level */}
      <div className="space-y-2">
        <Label htmlFor="automationLevel">
          Automation Level: {automationLevel}/10
        </Label>
        <Slider
          id="automationLevel"
          min={1}
          max={10}
          step={1}
          value={[automationLevel]}
          onValueChange={(value) => setValue('automationLevel', value[0])}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          {automationLevel <= 3 && 'Low: Requires frequent approval'}
          {automationLevel > 3 && automationLevel <= 7 && 'Medium: Balanced automation'}
          {automationLevel > 7 && 'High: Mostly autonomous'}
        </p>
      </div>

      {/* Heartbeat Interval */}
      <div className="space-y-2">
        <Label htmlFor="heartbeatInterval">
          Check-in Frequency: {formatHeartbeatInterval(heartbeatInterval)}
        </Label>
        <Slider
          id="heartbeatInterval"
          min={3600}
          max={86400}
          step={3600}
          value={[heartbeatInterval]}
          onValueChange={(value) => setValue('heartbeatInterval', value[0])}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          How often your AI company will check in and report progress
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Creating...' : 'Create Company'}
        </Button>
      </div>
    </form>
  )
}
