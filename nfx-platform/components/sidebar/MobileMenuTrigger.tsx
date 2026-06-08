'use client'

import { Menu, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NavItem } from './NavItem'
import { navItems, SidebarBrand } from './AppSidebar'
import { signOut } from '@/app/actions/auth-actions'

export function MobileMenuTrigger() {
  return (
    <div className="fixed left-4 top-4 z-40 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl border backdrop-blur-xl"
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[220px] border-r p-0"
          style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex h-full flex-col px-3 py-5">
            <SidebarBrand />
            <nav className="flex flex-1 flex-col gap-0.5">
              {navItems.map((item) => (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </nav>
            <div className="border-t pt-3" style={{ borderColor: 'var(--sidebar-border)' }}>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit" className="nav-signout-btn w-full justify-start gap-3 rounded-xl px-3 text-muted-foreground hover:text-foreground">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
