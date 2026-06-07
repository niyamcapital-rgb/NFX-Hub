'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  label: string
  icon: LucideIcon
}

export function NavItem({ href, label, icon: Icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
        isActive
          ? 'font-medium text-primary'
          : 'font-normal text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
      )}
    >
      {/* Shared layout pill — spring-slides between active routes */}
      {isActive && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl bg-primary/10"
          style={{ boxShadow: '0 0 0 1px rgba(59,130,246,0.15)' }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
        />
      )}
      <Icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
      <span className="relative z-10">{label}</span>
    </Link>
  )
}
