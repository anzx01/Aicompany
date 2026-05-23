import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Sparkles,
  Rocket
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="hidden sm:inline">AI Company Builder</span>
              </Link>
              <nav className="hidden lg:flex gap-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/company/create">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Rocket className="h-4 w-4" />
                    Create Company
                  </Button>
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:inline text-sm">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="lg:hidden">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="lg:hidden">
                    <Link href="/company/create" className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Create Company
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="lg:hidden" />
                  <DropdownMenuItem asChild>
                    <form action="/auth/signout" method="post" className="w-full">
                      <button type="submit" className="flex items-center gap-2 w-full">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
