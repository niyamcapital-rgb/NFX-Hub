'use client'

import { useEffect, useState, useTransition } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SymbolComboBox } from '@/components/ui/symbol-combobox'
import { ImageDropzone } from '@/components/ui/image-dropzone'
import { uploadFile } from '@/lib/storage-utils'
import { upsertConfluence, deleteConfluence } from '@/app/actions/confluence-actions'
import { getLegsForTrade, addTradeLeg, deleteTradeLeg } from '@/app/actions/trade-leg-actions'
import { calcCumulativeRR, calcLegRiskSum } from '@/lib/scale-in'
import type { Account, Confluence, Symbol, Trade, TradeLeg, TradeType } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (formData: FormData) => void
  onDelete: (trade: Trade) => void
  trade?: Trade | null
  accounts: Account[]
  symbols: Symbol[]
  confluences: Confluence[]
}

const TRADE_TYPES: TradeType[] = ['Swing', 'Intraswing', 'Intraday', 'Manipulation']
const PRESET_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']
// No hard cap — legs are funded by recycled risk from stop tightenings.

export function TradeModal({ open, onClose, trade, accounts, confluences: initialConfluences, symbols, onSave, onDelete }: Props) {
  const [selectedAccounts,    setSelectedAccounts]    = useState<string[]>(trade?.trade_accounts?.map((ta) => ta.account_id) ?? [])
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>(trade?.trade_confluences?.map((tc) => tc.confluence_id) ?? [])
  const [tradeType,   setTradeType]   = useState<TradeType | ''>(trade?.trade_type ?? '')
  const [scaleIn,     setScaleIn]     = useState(trade?.scale_in_enabled ?? false)
  const [dxyFile,     setDxyFile]     = useState<File | null>(null)
  const [entryFile,   setEntryFile]   = useState<File | null>(null)
  const [symbol,      setSymbol]      = useState(trade?.symbol ?? '')
  const [openDate,    setOpenDate]    = useState(trade?.open_date ?? '')
  const [initialRR,   setInitialRR]   = useState<string>(trade?.risk_reward?.toString() ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dateError,   setDateError]   = useState<string | null>(null)

  // Confluence state
  const [allConfluences, setAllConfluences] = useState<Confluence[]>(initialConfluences)
  const [showAddCf,      setShowAddCf]      = useState(false)
  const [newCfName,      setNewCfName]      = useState('')
  const [isAddingCf,     setIsAddingCf]     = useState(false)

  // Scale-In leg state
  const [legs,        setLegs]        = useState<TradeLeg[]>(trade?.trade_legs ?? [])
  const [legFactor,   setLegFactor]   = useState('')
  const [legRR,       setLegRR]       = useState('')
  const [isAddingLeg, setIsAddingLeg] = useState(false)
  const [legError,    setLegError]    = useState<string | null>(null)
  const [legToDelete, setLegToDelete] = useState<TradeLeg | null>(null)
  const [, startLegTransition]        = useTransition()

  const showScaleIn = tradeType === 'Swing' || tradeType === 'Intraswing'

  useEffect(() => {
    if (!trade?.id || !scaleIn) { setLegs([]); return }
    if (trade.trade_legs?.length) { setLegs(trade.trade_legs); return }
    getLegsForTrade(trade.id).then(setLegs)
  }, [trade?.id, scaleIn])

  // Derived metrics
  const parsedInitialRR = initialRR ? parseFloat(initialRR) : null
  const legRiskSum      = calcLegRiskSum(legs)   // sum of all leg risk_factors (informational)
  const cumulativeRR    = calcCumulativeRR(parsedInitialRR, legs)

  function toggleAccount(id: string) {
    setSelectedAccounts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  function toggleConfluence(id: string) {
    setSelectedConfluences((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  async function handleAddConfluence() {
    const name = newCfName.trim()
    if (!name) return
    setIsAddingCf(true)
    const color = PRESET_COLORS[allConfluences.length % PRESET_COLORS.length]
    const fd = new FormData()
    fd.set('name', name)
    fd.set('color', color)
    const result = await upsertConfluence(fd)
    setIsAddingCf(false)
    if ('id' in result && result.id) {
      const newC: Confluence = { id: result.id, user_id: '', name, color, category: null }
      setAllConfluences((prev) => [...prev, newC])
      setSelectedConfluences((prev) => [...prev, result.id!])
    }
    setNewCfName('')
    setShowAddCf(false)
  }

  async function handleDeleteConfluence(id: string) {
    setAllConfluences((prev) => prev.filter((c) => c.id !== id))
    setSelectedConfluences((prev) => prev.filter((x) => x !== id))
    await deleteConfluence(id)
  }

  async function handleAddLeg() {
    if (!trade?.id) return
    const rf = parseFloat(legFactor)
    const rr = parseFloat(legRR)
    setLegError(null)
    if (isNaN(rf) || rf <= 0) { setLegError('Risk factor must be greater than 0.'); return }
    if (isNaN(rr) || rr <= 0) { setLegError('Target RR must be greater than 0.'); return }

    setIsAddingLeg(true)
    const tempId = `temp-${Date.now()}`
    const optimistic: TradeLeg = { id: tempId, trade_id: trade.id, risk_factor: rf, target_rr: rr, created_at: new Date().toISOString() }
    setLegs((prev) => [...prev, optimistic])
    setLegFactor('')
    setLegRR('')
    setIsAddingLeg(false)

    startLegTransition(async () => {
      const result = await addTradeLeg(trade.id, rf, rr)
      if ('error' in result) {
        setLegs((prev) => prev.filter((l) => l.id !== tempId))
        setLegError(result.error ?? 'Failed to add leg.')
      } else if ('leg' in result && result.leg) {
        setLegs((prev) => prev.map((l) => l.id === tempId ? (result.leg as TradeLeg) : l))
      }
    })
  }

  function confirmDeleteLeg() {
    if (!legToDelete) return
    const id = legToDelete.id
    setLegToDelete(null)
    setLegs((prev) => prev.filter((l) => l.id !== id))
    startLegTransition(async () => { await deleteTradeLeg(id) })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (trade?.id) fd.set('id', trade.id)
    selectedAccounts.forEach((id)    => fd.append('account_ids[]', id))
    selectedConfluences.forEach((id) => fd.append('confluence_ids[]', id))
    fd.set('scale_in_enabled', String(scaleIn))
    if (tradeType) fd.set('trade_type', tradeType)

    setUploadError(null)
    setDateError(null)

    const closeDate = fd.get('close_date') as string
    if (closeDate && openDate && closeDate < openDate) {
      setDateError('Close date must be on or after the open date.')
      return
    }

    if (!dxyFile && trade?.dxy_chart_url)     fd.set('dxy_chart_url',   trade.dxy_chart_url)
    if (!entryFile && trade?.entry_chart_url) fd.set('entry_chart_url', trade.entry_chart_url)

    if (dxyFile || entryFile) {
      setIsUploading(true)
      try {
        if (dxyFile)  { const url = await uploadFile(dxyFile,  'trade-charts', 'dxy');   if (url) fd.set('dxy_chart_url',   url) }
        if (entryFile){ const url = await uploadFile(entryFile,'trade-charts', 'entry'); if (url) fd.set('entry_chart_url', url) }
      } catch (err) {
        setIsUploading(false)
        setUploadError(err instanceof Error ? err.message : 'Image upload failed.')
        return
      }
      setIsUploading(false)
    }

    onSave(fd)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{trade ? 'Edit Trade' : 'Log New Trade'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="mt-4 space-y-0">

            {/* ── Section: Trade Details ─────────────────────────────── */}
            <div className="space-y-4 pb-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Trade Details</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="open_date">Open Date</Label>
                  <Input id="open_date" name="open_date" type="date" defaultValue={trade?.open_date} onChange={(e) => setOpenDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="close_date">Close Date</Label>
                  <Input id="close_date" name="close_date" type="date" defaultValue={trade?.close_date ?? undefined} min={openDate || undefined} />
                  {dateError && <p className="text-xs text-red-400">{dateError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Symbol</Label>
                  <SymbolComboBox symbols={symbols} value={symbol} onChange={setSymbol} name="symbol" placeholder="Select or add symbol" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Trade Type</Label>
                  <Select value={tradeType} onValueChange={(v) => setTradeType(v as TradeType)}>
                    <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      {TRADE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showScaleIn && (
                <div className="space-y-0">
                  {/* Toggle */}
                  <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                    <input id="scale_in" type="checkbox" checked={scaleIn} onChange={(e) => setScaleIn(e.target.checked)} className="h-4 w-4 accent-primary" />
                    <label htmlFor="scale_in" className="flex-1 text-sm">
                      Enable scale-in position
                      <span className="ml-2 text-xs text-muted-foreground">(normalized risk)</span>
                    </label>
                    {scaleIn && legs.length > 0 && (
                      <span className="text-xs text-muted-foreground">{legs.length} {legs.length === 1 ? 'leg' : 'legs'}</span>
                    )}
                  </div>

                  {/* Scale-In Panel */}
                  {scaleIn && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">

                      {/* Risk Monitor */}
                      <div className="border-b border-white/[0.06] px-4 py-3">
                        <div className="mb-2.5 flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Risk Monitor</span>
                        </div>

                        {/* Initial position row */}
                        <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-muted-foreground">0</div>
                          <div className="flex flex-1 items-center gap-4 text-sm">
                            <span className="text-muted-foreground/60 text-xs">Initial position</span>
                            <span className="font-mono text-muted-foreground">1.0× risk</span>
                            {parsedInitialRR ? (
                              <span className="font-mono text-foreground">@ {parsedInitialRR}R</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">set RR below</span>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">Recycled Risk</p>
                            <p className="text-base font-semibold tabular-nums text-amber-400">
                              {legRiskSum.toFixed(2)}×
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground/40">across {legs.length} {legs.length === 1 ? 'leg' : 'legs'}</p>
                          </div>
                          <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
                            <p className="mb-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/50">Total RR</p>
                            <p className={`text-base font-semibold tabular-nums ${
                              cumulativeRR === null ? 'text-muted-foreground/30'
                              : cumulativeRR >= (parsedInitialRR ?? 0) ? 'text-emerald-400'
                              : 'text-amber-400'
                            }`}>
                              {cumulativeRR !== null ? `${cumulativeRR.toFixed(2)}R` : '—'}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground/40">additive total</p>
                          </div>
                        </div>
                      </div>

                      {/* Leg list */}
                      {legs.length > 0 && (
                        <ul className="divide-y divide-white/[0.04]">
                          {legs.map((leg, i) => (
                            <li key={leg.id} className="group flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                                  {i + 1}
                                </span>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="font-mono text-foreground">{leg.risk_factor}× risk</span>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className="font-mono text-foreground">{leg.target_rr}R target</span>
                                  <span className="text-xs text-muted-foreground/40">
                                    ({(leg.risk_factor * leg.target_rr).toFixed(3)} weighted)
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setLegToDelete(leg)}
                                className="rounded-lg p-1.5 text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Add leg form */}
                      {!trade?.id ? (
                        <p className="px-4 py-3 text-center text-xs text-muted-foreground/40">
                          Save this trade first to add scale-in entries.
                        </p>
                      ) : (
                        <div className={`${legs.length > 0 ? 'border-t border-white/[0.04]' : ''} px-4 py-3`}>
                          <div className="flex items-end gap-2">
                            <div className="w-28 space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
                                Risk Factor
                              </label>
                              <input
                                type="number"
                                step="0.05"
                                min="0.05"
                                value={legFactor}
                                onChange={(e) => setLegFactor(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLeg() } }}
                                placeholder="0.5"
                                className="h-8 w-full rounded-lg border border-white/[0.08] bg-transparent px-2.5 font-mono text-sm outline-none placeholder:text-muted-foreground/30 focus:border-primary/40"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <label className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Target RR</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={legRR}
                                onChange={(e) => setLegRR(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLeg() } }}
                                placeholder="3.0"
                                className="h-8 w-full rounded-lg border border-white/[0.08] bg-transparent px-2.5 font-mono text-sm outline-none placeholder:text-muted-foreground/30 focus:border-primary/40"
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/30">
                                Total recycled: <span className="font-mono text-muted-foreground/50">{legRiskSum.toFixed(2)}×</span>
                              </p>
                              <button
                                type="button"
                                onClick={handleAddLeg}
                                disabled={isAddingLeg || !legFactor || !legRR}
                                className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-40"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Leg
                              </button>
                            </div>
                          </div>
                          {legError && <p className="mt-2 text-xs text-red-400">{legError}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── Section: Outcome ──────────────────────────────────── */}
            <div className="space-y-4 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Outcome</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Result</Label>
                  <Select name="result" defaultValue={trade?.result ?? 'pending'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                      <SelectItem value="breakeven">Break Even</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="risk_reward">
                    Initial RR
                    {showScaleIn && scaleIn && <span className="ml-1 text-[10px] text-muted-foreground/50">(position 0)</span>}
                  </Label>
                  <Input
                    id="risk_reward"
                    name="risk_reward"
                    type="number"
                    step="any"
                    placeholder="e.g. 2.5"
                    value={initialRR}
                    onChange={(e) => setInitialRR(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pnl">P&L ($)</Label>
                  <Input id="pnl" name="pnl" type="number" step="0.01" defaultValue={trade?.pnl ?? undefined} />
                </div>
              </div>
              {showScaleIn && scaleIn && legs.length > 0 && cumulativeRR !== null && (
                <div className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground/60">
                  <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
                  Total Trade RR after scale-ins:
                  <span className="font-mono font-semibold text-foreground">{cumulativeRR.toFixed(2)}R</span>
                  <span className="text-muted-foreground/30">({legRiskSum.toFixed(2)}× recycled)</span>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── Section: Charts ───────────────────────────────────── */}
            <div className="space-y-4 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Charts</p>
              <div className="grid grid-cols-2 gap-4">
                <ImageDropzone label="DXY Chart"   onFileSelect={setDxyFile}   existingUrl={trade?.dxy_chart_url} />
                <ImageDropzone label="Entry Chart" onFileSelect={setEntryFile} existingUrl={trade?.entry_chart_url} />
              </div>
            </div>

            <div className="border-t border-white/[0.05]" />

            {/* ── Section: Context ──────────────────────────────────── */}
            <div className="space-y-5 py-6">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Context</p>

              {accounts.length > 0 && (
                <div className="space-y-2">
                  <Label>Accounts</Label>
                  <div className="flex flex-wrap gap-2">
                    {accounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAccount(a.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
                          selectedAccounts.includes(a.id)
                            ? 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10'
                            : 'border-white/[0.08] text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                      >
                        {a.account_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Confluences</Label>
                <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                  {allConfluences.length === 0 && !showAddCf ? (
                    <p className="px-4 py-5 text-center text-xs text-muted-foreground/50">No confluences yet — add your first below</p>
                  ) : (
                    <ul>
                      {allConfluences.map((c) => {
                        const selected = selectedConfluences.includes(c.id)
                        return (
                          <li
                            key={c.id}
                            className={`group flex cursor-pointer items-center justify-between border-b border-white/[0.05] px-4 py-3 last:border-0 transition-colors ${selected ? 'bg-primary/[0.06]' : 'hover:bg-white/[0.02]'}`}
                            onClick={() => toggleConfluence(c.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`h-2.5 w-2.5 shrink-0 rounded-full transition-opacity ${selected ? 'opacity-100' : 'opacity-40'}`} style={{ background: c.color }} />
                              <span className={`text-sm transition-colors ${selected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{c.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteConfluence(c.id) }}
                              className="rounded-lg p-1.5 text-muted-foreground/20 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {showAddCf ? (
                    <div className="flex items-center gap-2 border-t border-white/[0.05] bg-white/[0.02] px-4 py-2.5">
                      <input
                        autoFocus
                        value={newCfName}
                        onChange={(e) => setNewCfName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleAddConfluence() }
                          if (e.key === 'Escape') { setShowAddCf(false); setNewCfName('') }
                        }}
                        placeholder="Confluence name…"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                        disabled={isAddingCf}
                      />
                      <button type="button" onClick={handleAddConfluence} disabled={isAddingCf || !newCfName.trim()} className="text-xs text-primary disabled:opacity-40 hover:underline">
                        {isAddingCf ? 'Adding…' : 'Add'}
                      </button>
                      <button type="button" onClick={() => { setShowAddCf(false); setNewCfName('') }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddCf(true)}
                      className={`flex w-full items-center gap-2 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-white/[0.03] hover:text-foreground ${allConfluences.length > 0 ? 'border-t border-white/[0.05]' : ''}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Confluence
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary">Summary</Label>
                <Textarea id="summary" name="summary" rows={3} placeholder="Trade rationale, execution notes…" defaultValue={trade?.summary ?? undefined} />
              </div>
            </div>

            {uploadError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-xs text-red-400">{uploadError}</p>
            )}

            <div className="flex gap-2 pb-1 pt-2">
              <Button type="submit" className="flex-1 rounded-xl shadow-lg shadow-primary/20" disabled={isUploading || isAddingCf}>
                {isUploading ? 'Uploading…' : trade ? 'Save Changes' : 'Log Trade'}
              </Button>
              {trade && (
                <Button type="button" variant="destructive" className="rounded-xl" onClick={() => onDelete(trade)}>Delete</Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Leg delete confirmation */}
      <Dialog open={!!legToDelete} onOpenChange={(open) => { if (!open) setLegToDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete scale-in</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this scale-in?{' '}
            {legToDelete && (
              <span className="font-mono font-semibold text-foreground">
                {legToDelete.risk_factor}× @ {legToDelete.target_rr}R
              </span>
            )}{' '}
            This cannot be undone.
          </p>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setLegToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500"
              onClick={confirmDeleteLeg}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
