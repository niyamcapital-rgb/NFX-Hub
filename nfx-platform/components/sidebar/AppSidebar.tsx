'use client'

import Image from 'next/image'
import { LayoutDashboard, BookOpen, Shield, Compass, Settings, LogOut } from 'lucide-react'
import { NavItem } from './NavItem'
import { MobileMenuTrigger } from './MobileMenuTrigger'
import { signOut } from '@/app/actions/auth-actions'
import { Button } from '@/components/ui/button'

export const navItems = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts',  label: 'Accounts',  icon: Shield },
  { href: '/journal',   label: 'Journal',   icon: BookOpen },
  { href: '/outlooks',  label: 'Outlooks',  icon: Compass },
  { href: '/settings',  label: 'Settings',  icon: Settings },
]

export function SidebarBrand() {
  return (
    <div className="mb-6 flex items-center gap-3 px-2">
      <Image src="/logo.png" alt="NFX Hub" width={32} height={32} className="shrink-0 object-contain" />
      <div>
        <p className="text-sm font-light italic tracking-tight text-foreground leading-tight">
          The ultimate<br />
          traders hub.
        </p>
      </div>
    </div>
  )
}

function SidebarContent() {
  return (
    <div className="flex h-full flex-col px-3 py-5">
      {/* Brand */}
      <SidebarBrand />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t pt-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className="nav-signout-btn w-full justify-start gap-3 rounded-xl px-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <>
      <aside
        className="hidden h-screen w-[220px] min-w-[220px] flex-col border-r backdrop-blur-xl lg:flex"
        style={{
          background: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        <SidebarContent />
      </aside>
      <MobileMenuTrigger />
    </>
  )
}
