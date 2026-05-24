import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Check,
  Star,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Sparkles className="h-6 w-6 text-primary" />
            <span>AI Company Builder</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px] [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Social Proof Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 mb-6 animate-fade-in">
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              New
            </Badge>
            <span className="text-sm font-medium">Open-source AI company automation starter</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Build Your AI Company
            </span>
            <br />
            <span className="text-primary">in Minutes, Not Months</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Create autonomous AI companies that work 24/7. No coding required.
            <br className="hidden md:block" />
            Choose from <strong className="text-foreground">Marketing, Content, Customer Service, or Development</strong> companies.
          </p>

          {/* Value Proposition */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>Self-host ready</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>Environment-based configuration</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              <span>MIT licensed</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Start Building Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-xs text-muted-foreground">Company Types</div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-xs text-muted-foreground">Always Working</div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border">
              <div className="text-3xl font-bold text-primary">AI</div>
              <div className="text-xs text-muted-foreground">Task Execution</div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card/50 border">
              <div className="text-3xl font-bold text-primary">OSS</div>
              <div className="text-xs text-muted-foreground">Open Source</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your AI Company Type
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each company type comes with specialized AI agents trained for specific tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                icon: "📢",
                title: "Marketing Company",
                description: "Automated social media, content distribution, and campaign management",
                features: ["Social Media Automation", "Campaign Analytics", "Content Scheduling"]
              },
              {
                icon: "✍️",
                title: "Content Company",
                description: "AI-powered content creation, SEO optimization, and publishing",
                features: ["Blog Writing", "SEO Optimization", "Multi-platform Publishing"]
              },
              {
                icon: "💬",
                title: "Customer Service",
                description: "24/7 AI support, ticket management, and customer engagement",
                features: ["24/7 Support", "Ticket Automation", "Customer Insights"]
              },
              {
                icon: "💻",
                title: "Development Company",
                description: "AI-assisted coding, code review, and deployment automation",
                features: ["Code Generation", "Automated Testing", "CI/CD Integration"]
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 border rounded-xl bg-card hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="font-bold mb-2 text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Modern Businesses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to automate your business operations with AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Setup",
                description: "Configure the app with environment variables and deploy it on your own infrastructure.",
                stat: "Self-host",
                statLabel: "Deployment model"
              },
              {
                icon: Shield,
                title: "Security Controls",
                description: "Keep service-role keys on the server and use your platform's access controls.",
                stat: "RLS",
                statLabel: "Supabase ready"
              },
              {
                icon: DollarSign,
                title: "Cost Visibility",
                description: "Track model usage and route work across configured AI providers.",
                stat: "Usage",
                statLabel: "AI cost tracking"
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-xl border bg-card hover:shadow-lg transition-all animate-fade-in"
                style={{ animationDelay: `${0.8 + index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="font-bold mb-3 text-xl">{benefit.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {benefit.description}
                </p>
                <div className="pt-6 border-t">
                  <div className="text-3xl font-bold text-primary mb-1">{benefit.stat}</div>
                  <div className="text-sm text-muted-foreground">{benefit.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-2xl md:text-3xl font-semibold mb-4">
              Build from a clear, inspectable foundation
            </p>
            <p className="text-muted-foreground mb-6">
              Adapt the source, review the workflows, and deploy under your own controls.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Open-source codebase</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secret-safe configuration</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span>Usage-aware AI routing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center p-12 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build Your AI Company?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start from the codebase, configure your providers, and run it on infrastructure you control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="gap-2 text-base px-8 h-12 shadow-lg shadow-primary/20">
                  Create Account <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-base px-8 h-12">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Open source under the MIT License.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-bold">AI Company Builder</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automate your business with AI-powered companies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#features" className="hover:text-foreground transition-colors">Docs</Link></li>
                <li><Link href="/legal/security" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="/legal/security" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>Copyright 2026 AI Company Builder contributors. MIT licensed. Built with Next.js and Supabase.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
