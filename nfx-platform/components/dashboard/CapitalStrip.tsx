'use client'

import { motion } from 'framer-motion'
import { Banknote, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { staggerContainer, staggerItem } from '@/lib/motion'
import type { Account } from '@/types/database'

interface Props { accounts: Account[] }

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function CapitalStrip({ accounts }: Props) {
  const funded     = accounts.filter((a) => a.phase === 'Funded')
  const challenges = accounts.filter((a) => a.phase === 'P1' || a.phase === 'P2')

  const totalFunding    = funded.reduce((s, a) => s + a.starting_balance, 0)
  const totalChallenges = challenges.reduce((s, a) => s + a.starting_balance, 0)

  const cards = [
    {
      label: 'Total Funding',
      value: fmt(totalFunding),
      sub: `${funded.length} funded account${funded.length !== 1 ? 's' : ''}`,
      icon: Banknote,
      color: 'text-neon-green',
      accent: 'rgba(57,255,20,0.7)',
    },
    {
      label: 'Total Challenges',
      value: fmt(totalChallenges),
      sub: `${challenges.length} challenge account${challenges.length !== 1 ? 's' : ''}`,
      icon: Trophy,
      color: 'text-electric-blue',
      accent: 'rgba(0,210,255,0.7)',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid grid-cols-2 gap-5"
    >
      {cards.map((m) => (
        <motion.div key={m.label} variants={staggerItem}>
          <Card className="relative overflow-hidden border-border/40">
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: m.accent }} />

            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {m.label}
              </CardTitle>
              <div className={`rounded-md p-1.5 ${m.color} bg-white/5`}>
                <m.icon className="h-3.5 w-3.5" />
              </div>
            </CardHeader>

            <CardContent className="pb-5">
              <span className="text-[1.6rem] font-semibold leading-none tracking-tight">{m.value}</span>
              <p className="mt-1.5 text-[11px] text-muted-foreground/60">{m.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
