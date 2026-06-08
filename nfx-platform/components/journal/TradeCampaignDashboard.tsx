'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, MinusCircle, Clock, Plus, Share2, Loader2, Trash2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cardHover } from '@/lib/motion'
import { calcCumulativeRR } from '@/lib/scale-in'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/date-format'
import { TradeCertificateCard } from './TradeCertificateCard'
import type { LegType, Trade } from '@/types/database'

interface Props {
  trade: Trade
  onEdit: () => void
  onEditChild: (child: Trade) => void
  onAddChild: (parentSymbol: string) => void
  onDelete: () => void
  onDeleteChild: (child: Trade) => void
}

const RESULT_STYLES = {
  win:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', shadow: 'hover:shadow-emerald-500/[0.08]' },
  loss:      { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     shadow: 'hover:shadow-red-500/[0.08]' },
  breakeven: { bg: 'bg-zinc-500/10',    text: 'text-zinc-400',    border: 'border-zinc-500/20',    shadow: '' },
  pending:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   shadow: '' },
} as const

// Visual identity per leg type — use inline styles to avoid Tailwind scanner gaps
const LEG_STYLE: Record<LegType, { label: string; color: string }> = {
  Placeholder: { label: 'Placeholder', color: '#fbbf24' },
  Swing:       { label: 'Swing',       color: '#3b82f6' },
  ScaleIn:     { label: 'Scale-In',    color: '#34d399' },
}


const ResultIcon = ({ result, className }: { result: string | null; className?: string }) => {
  const cls = cn('h-3 w-3', className)
  if (result === 'win')       return <CheckCircle className={cls} />
  if (result === 'loss')      return <XCircle className={cls} />
  if (result === 'breakeven') return <MinusCircle className={cls} />
  return <Clock className={cls} />
}

export function TradeCampaignDashboard({ trade, onEdit, onEditChild, onAddChild, onDelete, onDeleteChild }: Props) {
  const [confirmDeleteRoot, setConfirmDeleteRoot] = useState(false)
  const [childToDelete, setChildToDelete]         = useState<Trade | null>(null)
  const [isSharing, setIsSharing]                 = useState(false)
  const [expanded, setExpanded]                   = useState(false)
  const certRef                                   = useRef<HTMLDivElement>(null)
  const { fmt }                                   = useDateFormat()

  async function handleShare() {
    if (!certRef.current) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(certRef.current, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.download = `NFX-${trade.symbol}-${trade.open_date}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Share failed:', err)
    } finally {
      setIsSharing(false)
    }
  }

  const children   = trade.children ?? []
  const isCampaign = trade.scale_in_enabled
  const rs         = RESULT_STYLES[(trade.result ?? 'pending') as keyof typeof RESULT_STYLES] ?? RESULT_STYLES.pending
  const hasChart   = trade.entry_chart_url || trade.dxy_chart_url
  const confluences = trade.trade_confluences?.map((tc) => tc.confluences!).filter(Boolean) ?? []

  // Campaign total RR = additive sum across all children
  const campaignLegs = children.map((c) => ({ risk_factor: c.risk_factor ?? 0, target_rr: c.risk_reward ?? 0 }))
  const campaignRR   = isCampaign && children.length > 0 ? calcCumulativeRR(trade.risk_reward, campaignLegs) : null
  const displayRR    = campaignRR ?? trade.risk_reward


  return (
    <>
      <motion.div
        layout
        inherit={false}
        className="w-full min-w-0 cursor-pointer"
        style={{ position: 'relative', zIndex: expanded ? 10 : undefined }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={onEdit}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      >
        <div
          className={cn(
            'w-full overflow-hidden rounded-xl border border-border/50 transition-shadow duration-300',
            'bg-card',
            expanded ? 'shadow-lg' : '',
            rs.shadow,
          )}
        >
          {/* ── Chart ─────────────────────────────────────────────── */}
          <div className="relative h-[175px] w-full overflow-hidden bg-secondary/30">
            {hasChart ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={trade.entry_chart_url || trade.dxy_chart_url || ''}
                alt="Chart"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs text-muted-foreground/25">No chart</span>
              </div>
            )}

            {/* Gradient fade hint — exits when expanded */}
            <AnimatePresence>
              {!expanded && (
                <motion.div
                  key="chart-fade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="pointer-events-none absolute bottom-0 left-0 right-0 h-8"
                  style={{ background: 'linear-gradient(to bottom, transparent, var(--card-solid))' }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Info strip ────────────────────────────────────────── */}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2">
              <ResultIcon result={trade.result} className={cn('h-4 w-4 shrink-0', rs.text)} />
              <span className="text-xs text-foreground/75">{fmt(trade.open_date)}</span>
              {displayRR !== null && displayRR !== undefined && (
                <span className="ml-auto font-mono text-xs font-semibold tabular-nums">
                  {Number(displayRR).toFixed(2)}RR
                </span>
              )}
            </div>
            {trade.trade_type && (
              <div className="mt-2">
                <span className="inline-block rounded-md bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                  {trade.trade_type}
                </span>
              </div>
            )}
          </div>

          {/* ── Control panel — spring-animated expansion ─────────── */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                key="control-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 300, opacity: { duration: 0.15 } } }}
                exit={{ height: 0, opacity: 0, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
                style={{ overflow: 'hidden', width: '100%' }}
              >
                <div className="w-full border-t border-border/40 px-3 pb-3">
                  {/* Campaign legs — each row is clickable to edit that child */}
                  {isCampaign && children.length > 0 && (
                    <div className="pt-2.5">
                      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">Campaign Legs</p>
                      <div className="space-y-0.5">
                        {children.map((c, i) => (
                          <button
                            key={c.id}
                            onClick={(e) => { e.stopPropagation(); onEditChild(c) }}
                            className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] text-muted-foreground/70 transition-colors duration-150 hover:text-foreground/90 nav-item"
                          >
                            <span className="font-mono text-muted-foreground/40">{i + 1}.</span>
                            <span>{fmt(c.open_date)}</span>
                            {c.leg_type && (
                              <span
                                className="rounded px-1 py-px"
                                style={{ color: LEG_STYLE[c.leg_type].color, background: `${LEG_STYLE[c.leg_type].color}15` }}
                              >
                                {LEG_STYLE[c.leg_type].label}
                              </span>
                            )}
                            {c.risk_reward !== null && (
                              <span className="ml-auto font-mono font-semibold text-foreground/60">{Number(c.risk_reward).toFixed(2)}R</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Visually hidden certificate — captured by html-to-image on Share */}
      <div aria-hidden="true" style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <TradeCertificateCard ref={certRef} trade={trade} displayRR={displayRR} campaignRR={campaignRR} />
      </div>

      {/* Root delete confirmation */}
      <Dialog open={confirmDeleteRoot} onOpenChange={(v) => { if (!v) setConfirmDeleteRoot(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete campaign</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <span className="font-semibold text-foreground">{trade.symbol}</span>
            {children.length > 0 && (
              <> and all {children.length} {children.length === 1 ? 'entry' : 'entries'}</>
            )}? This cannot be undone.
          </p>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setConfirmDeleteRoot(false)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl border border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => { setConfirmDeleteRoot(false); onDelete() }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Child delete confirmation */}
      <Dialog open={!!childToDelete} onOpenChange={(v) => { if (!v) setChildToDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete leg</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete this {childToDelete?.leg_type ? LEG_STYLE[childToDelete.leg_type].label.toLowerCase() : 'leg'} entry?{' '}
            {childToDelete && (
              <span className="font-mono font-semibold text-foreground">
                {fmt(childToDelete.open_date)}
                {childToDelete.risk_reward !== null ? ` · ${childToDelete.risk_reward}R` : ''}
              </span>
            )}{' '}
            This cannot be undone.
          </p>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setChildToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl border border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500 hover:text-white"
              onClick={() => { if (childToDelete) { onDeleteChild(childToDelete); setChildToDelete(null) } }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
