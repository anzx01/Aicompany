'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, TrendingUp, RefreshCw, Sparkles, BarChart3, Zap } from 'lucide-react'

export default function CostsPage() {
  const [companyId, setCompanyId] = useState('')

  // 获取公司列表
  const { data: companies } = trpc.company.list.useQuery()

  // 获取公司成本统计
  const { data: companyCosts, refetch: refetchCompanyCosts } = trpc.llm.getCompanyCosts.useQuery(
    { companyId },
    { enabled: !!companyId }
  )

  // 获取公司所有 Agent 成本统计
  const { data: agentCosts, refetch: refetchAgentCosts } = trpc.llm.getCompanyAgentsCosts.useQuery(
    { companyId },
    { enabled: !!companyId }
  )

  // 自动选择第一个公司
  if (companies && companies.length > 0 && !companyId) {
    setCompanyId(companies[0].id)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Cost Analytics</h1>
            <p className="text-muted-foreground">Monitor AI API usage costs and statistics</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Company Selector */}
        {companies && companies.length > 0 && (
          <Card className="border-primary/20 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Select Company
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {companies.map((company) => (
                  <Button
                    key={company.id}
                    variant={companyId === company.id ? 'default' : 'outline'}
                    onClick={() => setCompanyId(company.id)}
                    className="gap-2"
                  >
                    {companyId === company.id && <Sparkles className="h-4 w-4" />}
                    {company.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Total Cost */}
        {companyCosts && (
          <Card className="border-primary/20 shadow-sm animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Total Company Cost
              </CardTitle>
              <CardDescription>Total cost of all AI API calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground font-medium">Total Cost</p>
                  </div>
                  <p className="text-3xl font-bold text-primary">${companyCosts.totalCost.toFixed(4)}</p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium">Input Tokens</p>
                  </div>
                  <p className="text-3xl font-bold">{companyCosts.totalTokens.input.toLocaleString()}</p>
                </div>
                <div className="p-6 bg-muted/50 rounded-lg border hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium">Output Tokens</p>
                  </div>
                  <p className="text-3xl font-bold">{companyCosts.totalTokens.output.toLocaleString()}</p>
                </div>
              </div>

              {/* By Provider */}
              {companyCosts.costByProvider && Object.keys(companyCosts.costByProvider).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    By Provider
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(companyCosts.costByProvider).map(([provider, cost]: [string, any], index) => (
                      <div
                        key={provider}
                        className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border hover:border-primary/30 transition-all animate-scale-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{provider}</Badge>
                        </div>
                        <p className="text-xl font-bold">${cost.toFixed(4)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Model */}
              {companyCosts.costByModel && Object.keys(companyCosts.costByModel).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    By Model
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(companyCosts.costByModel).map(([model, cost]: [string, any], index) => (
                      <div
                        key={model}
                        className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border hover:border-primary/30 transition-all animate-scale-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{model}</Badge>
                        </div>
                        <p className="text-xl font-bold">${cost.toFixed(4)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Agent Cost Statistics */}
        {agentCosts && agentCosts.length > 0 && (
          <Card className="border-primary/20 shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Agent Cost Statistics
              </CardTitle>
              <CardDescription>Cost usage by each agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agentCosts.map((agent: any, index) => (
                  <div
                    key={agent.agentId}
                    className="p-4 border rounded-lg hover:border-primary/30 transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{agent.agentName || agent.agentId}</p>
                        <Badge variant="outline" className="mt-1 capitalize">{agent.role}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">${agent.totalCost.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">API Calls</p>
                        <p className="text-lg font-semibold">{agent.totalCalls}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Total Tokens</p>
                        <p className="text-lg font-semibold">{agent.totalTokens.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Avg Cost</p>
                        <p className="text-lg font-semibold">
                          ${(agent.totalCost / agent.totalCalls).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Refresh Button */}
        {companyId && (
          <div className="flex justify-center">
            <Button
              onClick={() => {
                refetchCompanyCosts()
                refetchAgentCosts()
              }}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!companyId && companies && companies.length === 0 && (
          <Card className="border-primary/20">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-2">No Companies Yet</p>
              <p className="text-muted-foreground">Create a company first to view cost analytics</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
