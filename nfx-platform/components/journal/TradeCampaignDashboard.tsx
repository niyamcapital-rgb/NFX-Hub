'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, MinusCircle, Clock, Plus, Pencil, Share2, Loader2, Trash2 } from 'lucide-react'
import { toPng } from 'html-to-image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cardHover } from '@/lib/motion'
import { calcCumulativeRR } from '@/lib/scale-in'
import { cn } from '@/lib/utils'
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

const LEG_TYPE_ORDER: LegType[] = ['Placeholder', 'ScaleIn']

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
  const certRef                                   = useRef<HTMLDivElement>(null)

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

  // Global index follows display order (Placeholder → Swing → ScaleIn, chrono within each group)
  const orderedForIndex = LEG_TYPE_ORDER.flatMap((type) =>
    children.filter((c) => (c.leg_type ?? 'ScaleIn') === type),
  )
  const globalIndex = new Map(orderedForIndex.map((c, i) => [c.id, i + 1]))

  // Grouped by leg_type; null leg_type falls into ScaleIn bucket (legacy)
  const byType = (type: LegType) => children.filter((c) => (c.leg_type ?? 'ScaleIn') === type)

  return (
    <>
      <motion.div {...cardHover}>
        <div
          className={cn(
            'overflow-hidden rounded-xl border transition-shadow duration-300',
            'bg-[rgba(1,9,22,0.8)] backdrop-blur-md',
            'hover:shadow-xl hover:shadow-blue-950/60',
            rs.shadow,
          )}
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* ── Chart preview ─────────────────────────────────────── */}
          <div className="relative h-32 w-full cursor-pointer overflow-hidden bg-white/[0.03]" onClick={onEdit}>
            {hasChart ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trade.entry_chart_url || trade.dxy_chart_url || ''} alt="Chart" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-xs text-muted-foreground/40">No chart</span>
              </div>
            )}

            <div className={cn('absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border px-2 py-0.5', rs.bg, rs.text, rs.border)}>
              <ResultIcon result={trade.result} className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{trade.result ?? 'pending'}</span>
            </div>

            {trade.trade_type && (
              <div className="absolute left-2.5 top-2.5 rounded-full border border-white/10 bg-black/40 px-2 py-[3px] backdrop-blur-sm">
                <span className="text-[10px] font-semibold leading-none text-white/70">{trade.trade_type}</span>
              </div>
            )}
          </div>

          {/* ── Root trade content ────────────────────────────────── */}
          <div className="cursor-pointer px-3 pb-2 pt-3" onClick={onEdit}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold tracking-tight">{trade.symbol}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{trade.open_date}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                {displayRR !== null && displayRR !== undefined && (
                  <span className="font-mono text-sm font-semibold tabular-nums">{Number(displayRR).toFixed(2)}R</span>
                )}
              </div>
            </div>

            {confluences.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {confluences.slice(0, 3).map((c) => (
                  <span
                    key={c!.id}
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: `${c!.color}18`, color: c!.color, border: `1px solid ${c!.color}33` }}
                  >
                    {c!.name}
                  </span>
                ))}
                {confluences.length > 3 && (
                  <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                    +{confluences.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Campaign legs ─────────────────────────────────────── */}
          {isCampaign && children.length > 0 && (
            <div className="mb-1.5 px-3">
              <div className="space-y-1.5">
                {LEG_TYPE_ORDER.map((type) => {
                  const group = byType(type)
                  if (group.length === 0) return null
                  const ls = LEG_STYLE[type]
                  return (
                    <div key={type}>
                      {/* Section header */}
                      <div className="mb-0.5 flex items-center gap-1.5 px-2">
                        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: ls.color, flexShrink: 0 }} />
                        <span
                          className="text-[9px] font-semibold uppercase tracking-widest"
                          style={{ color: ls.color, opacity: 0.6 }}
                        >
                          {ls.label}
                        </span>
                      </div>

                      {/* Child rows — date and risk factor removed, RR only */}
                      <div className="ml-2 space-y-0.5 border-l pl-3" style={{ borderColor: `${ls.color}40` }}>
                        {group.map((child) => {
                          const crs = RESULT_STYLES[(child.result ?? 'pending') as keyof typeof RESULT_STYLES] ?? RESULT_STYLES.pending
                          return (
                            <div
                              key={child.id}
                              className="group flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/[0.04]"
                            >
                              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[8px] font-semibold text-muted-foreground/60">
                                {globalIndex.get(child.id)}
                              </span>
                              <div className={cn('shrink-0', crs.text)}>
                                <ResultIcon result={child.result} />
                              </div>
                              <div className="flex min-w-0 flex-1 items-center gap-2 text-xs">
                                {child.risk_reward !== null && child.risk_reward !== undefined && (
                                  <span className="font-mono font-medium">{child.risk_reward}R</span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => onEditChild(child)}
                                  className="rounded p-1 text-muted-foreground/40 transition-colors hover:bg-white/[0.06] hover:text-foreground"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChildToDelete(child)}
                                  className="rounded p-1 text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Action bar (all cards) ─────────────────────────────── */}
          <div className="flex items-center gap-1 px-3 pb-1.5">
            {isCampaign && (
              <button
                type="button"
                onClick={() => onAddChild(trade.symbol)}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-muted-foreground/40 transition-colors hover:bg-white/[0.04] hover:text-primary"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              title="Share trade"
              className="rounded-lg p-1.5 text-muted-foreground/30 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
            >
              {isSharing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Share2 className="h-3.5 w-3.5" />}
            </button>
            {isCampaign && (
              <button
                type="button"
                onClick={() => setConfirmDeleteRoot(true)}
                className="rounded-lg p-1.5 text-muted-foreground/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
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
                {childToDelete.open_date}
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
