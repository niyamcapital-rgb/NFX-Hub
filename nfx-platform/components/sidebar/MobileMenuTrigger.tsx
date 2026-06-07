'use client'

import Image from 'next/image'
import { Menu, LogOut } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NavItem } from './NavItem'
import { navItems } from './AppSidebar'
import { signOut } from '@/app/actions/auth-actions'

export function MobileMenuTrigger() {
  return (
    <div className="fixed left-4 top-4 z-40 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl border border-white/[0.08] backdrop-blur-xl"
            style={{ background: 'rgba(1,9,22,0.85)' }}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[220px] border-r border-white/[0.07] p-0"
          style={{ background: 'rgba(1,9,22,0.95)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex h-full flex-col px-3 py-5">
            <div className="mb-6 flex items-center gap-3 px-2">
              <Image src="/logo.png" alt="NFX Hub" width={32} height={32} className="shrink-0 object-contain" />
              <div>
                <p className="text-sm font-light italic tracking-tight text-foreground leading-tight">
                  The ultimate<br />
                  traders hub.
                </p>
              </div>
            </div>
            <nav className="flex flex-1 flex-col gap-0.5">
              {navItems.map((item) => (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </nav>
            <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <form action={signOut}>
                <Button variant="ghost" size="sm" type="submit" className="w-full justify-start gap-3 rounded-xl px-3 text-muted-foreground hover:bg-white/5 hover:text-foreground">
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
