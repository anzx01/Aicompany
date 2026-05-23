'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyTypeSelector, CompanyType } from '@/components/company/company-type-selector'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ArrowRight, Check, Sparkles, Building2, Target, Zap, DollarSign, Rocket } from 'lucide-react'

export default function CreateCompanyPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<CompanyType | null>(null)
  const [name, setName] = useState('')
  const [goals, setGoals] = useState('')
  const [budget, setBudget] = useState(100)
  const [automationLevel, setAutomationLevel] = useState(8)

  const createCompanyMutation = trpc.company.create.useMutation({
    onSuccess: async (data) => {
      // Create goal if provided
      if (goals.trim()) {
        await createGoalMutation.mutateAsync({
          companyId: data.id,
          title: `${name} Goals`,
          description: goals,
          priority: 10,
        })
      }
      router.push(`/dashboard?companyId=${data.id}`)
    },
    onError: (error) => {
      console.error('Failed to create company:', error)
      alert('Failed to create company. Please try again.')
    }
  })

  const createGoalMutation = trpc.company.createGoal.useMutation()

  const handleCreate = () => {
    if (!selectedType || !name) return

    createCompanyMutation.mutate({
      name,
      type: selectedType,
      description: goals || `An AI-powered ${selectedType.toLowerCase()} company`,
      config: {
        budget,
        automationLevel
      },
      heartbeat_interval: 21600 // 6 hours
    })
  }

  const canCreate = selectedType && name.trim().length > 0

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-primary/5 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Autonomous AI Company</span>
        </div>
        <h1 className="text-5xl font-bold mb-3">Create Your AI Company</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Set your goals, and let AI agents run your company autonomously
        </p>
      </div>

      <Card className="border-primary/20 shadow-xl">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Company Setup
          </CardTitle>
          <CardDescription>
            Define your company in 3 simple steps - we'll handle the rest
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          {/* Step 1: Company Type */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Choose Company Type</h3>
            </div>
            <CompanyTypeSelector
              selectedType={selectedType}
              onSelect={setSelectedType}
            />
          </div>

          {/* Step 2: Company Name & Goals */}
          {selectedType && (
            <div className="space-y-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold">Name & Goals</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Acme Marketing Co."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="goals" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    What do you want to achieve? (Optional)
                  </Label>
                  <Textarea
                    id="goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="Describe your goals in natural language. For example: 'Grow social media presence to 10k followers in 3 months' or 'Launch a new product and generate $50k in revenue'"
                    className="mt-2 min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    AI agents will use these goals to create and prioritize tasks automatically
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configuration */}
          {selectedType && name && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold">Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monthly Budget: ${budget}
                  </Label>
                  <Slider
                    value={[budget]}
                    onValueChange={(v) => setBudget(v[0])}
                    min={10}
                    max={1000}
                    step={10}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Company will auto-pause at 90% budget usage
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Automation Level: {automationLevel}/10
                  </Label>
                  <Slider
                    value={[automationLevel]}
                    onValueChange={(v) => setAutomationLevel(v[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher = more autonomous decision-making
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* What Happens Next */}
          {canCreate && (
            <Card className="border-primary/20 bg-primary/5 animate-scale-in">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What happens after you click "Launch"?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    '✨ 4 specialized AI agents are created instantly',
                    '🎯 Initial tasks are generated based on your goals',
                    '🚀 Company starts running autonomously',
                    '💰 Budget is monitored automatically',
                    '🤖 CEO agent creates new tasks as needed',
                    '📊 You can monitor progress anytime'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Create Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleCreate}
              disabled={!canCreate || createCompanyMutation.isPending}
              size="lg"
              className="gap-2 shadow-lg shadow-primary/20 px-8"
            >
              {createCompanyMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-primary-foreground" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="h-5 w-5" />
                  Launch Company
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="mt-6 border-muted">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Truly Autonomous</h4>
              <p className="text-sm text-muted-foreground">
                Once launched, your company runs completely on its own. AI agents will create tasks,
                execute them, and adapt based on results. You only need to check in when you want to.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
