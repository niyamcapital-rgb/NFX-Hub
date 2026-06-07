'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SymbolComboBox } from '@/components/ui/symbol-combobox'
import { ConfluenceComboBox } from '@/components/ui/confluence-combobox'
import { ImageDropzone } from '@/components/ui/image-dropzone'
import { uploadFile } from '@/lib/storage-utils'
import { EASE_OUT } from '@/lib/motion'
import type { Account, Confluence, LegType, Symbol, Trade, TradeType } from '@/types/database'

// ── iOS-style toggle switch ────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={`relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
        checked ? 'bg-primary' : 'bg-white/[0.12]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

// ── Accounts multi-select dropdown ────────────────────────────────────────
function AccountsDropdown({
  accounts,
  selected,
  onChange,
}: {
  accounts: Account[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  const selectedItems = accounts.filter((a) => selected.includes(a.id))

  if (accounts.length === 0) {
    return (
      <div className="flex h-9 items-center rounded-md border border-border/30 px-3 text-xs text-muted-foreground/40">
        No accounts yet
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-border/50 bg-transparent px-3 py-2 text-sm transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">Select accounts</span>
          ) : (
            selectedItems.map((a) => (
              <span
                key={a.id}
                className="inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {a.account_name}
              </span>
            ))
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(-6px) scaleY(0.96)', transformOrigin: 'top' }}
            animate={{ opacity: 1, transform: 'translateY(0px)  scaleY(1)',    transformOrigin: 'top' }}
            exit={{    opacity: 0, transform: 'translateY(-4px) scaleY(0.97)', transformOrigin: 'top' }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
          >
            <ul className="max-h-52 overflow-y-auto py-1">
              {accounts.map((a) => {
                const isSelected = selected.includes(a.id)
                return (
                  <li
                    key={a.id}
                    className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2.5 transition-colors hover:bg-secondary/40"
                    onClick={() => toggle(a.id)}
                  >
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                        isSelected ? 'text-primary opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className={`truncate text-sm ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {a.account_name}
                      </p>
                      {a.firm_name && (
                        <p className="truncate text-[10px] text-muted-foreground/40">{a.firm_name}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
  onSave: (formData: FormData) => void
  onDelete: (trade: Trade) => void
  trade?: Trade | null
  accounts: Account[]
  symbols: Symbol[]
  confluences: Confluence[]
  parentTradeId?: string
  parentSymbol?: string
}

const TRADE_TYPES: TradeType[] = ['Swing', 'Intraswing', 'Intraday', 'Manipulation']
const LEG_TYPES: { value: LegType; label: string }[] = [
  { value: 'Placeholder', label: 'Placeholder' },
  { value: 'ScaleIn',     label: 'Scale-In'    },
]

export function TradeModal({
  open, onClose, trade, accounts, confluences: initialConfluences,
  symbols, onSave, onDelete, parentTradeId, parentSymbol,
}: Props) {
  const isChild = !!parentTradeId

  const [selectedAccounts,    setSelectedAccounts]    = useState<string[]>(trade?.trade_accounts?.map((ta) => ta.account_id) ?? [])
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>(trade?.trade_confluences?.map((tc) => tc.confluence_id) ?? [])
  const [tradeType,   setTradeType]   = useState<TradeType | ''>(trade?.trade_type ?? '')
  const [scaleIn,     setScaleIn]     = useState(trade?.scale_in_enabled ?? false)
  const [dxyFile,     setDxyFile]     = useState<File | null>(null)
  const [entryFile,   setEntryFile]   = useState<File | null>(null)
  const [symbol,      setSymbol]      = useState(trade?.symbol ?? parentSymbol ?? '')
  const [openDate,    setOpenDate]    = useState(trade?.open_date ?? '')
  const [riskFactor,  setRiskFactor]  = useState<string>(trade?.risk_factor?.toString() ?? (parentTradeId ? '' : '1'))
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dateError,   setDateError]   = useState<string | null>(null)

  // Scale-in only applies to Swing / Intraswing root trades
  const showScaleIn = !isChild && (tradeType === 'Swing' || tradeType === 'Intraswing')

  function handleTradeTypeChange(v: TradeType) {
    setTradeType(v)
    // Clear campaign toggle when switching away from supported types
    if (v !== 'Swing' && v !== 'Intraswing') setScaleIn(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (trade?.id) fd.set('id', trade.id)
    selectedAccounts.forEach((id)    => fd.append('account_ids[]', id))
    selectedConfluences.forEach((id) => fd.append('confluence_ids[]', id))
    // scale_in_enabled is only true when the toggle is shown AND on
    fd.set('scale_in_enabled', isChild ? 'false' : String(showScaleIn && scaleIn))
    if (tradeType) fd.set('trade_type', tradeType)
    if (isChild)   fd.set('parent_trade_id', parentTradeId)
    if (riskFactor) fd.set('risk_factor', riskFactor)

    setUploadError(null)
    setDateError(null)

    const closeDate = fd.get('close_date') as string
    if (closeDate && openDate && closeDate < openDate) {
      setDateError('Close date must be on or after open date.')
      return
    }

    if (!dxyFile && trade?.dxy_chart_url)     fd.set('dxy_chart_url',   trade.dxy_chart_url)
    if (!entryFile && trade?.entry_chart_url) fd.set('entry_chart_url', trade.entry_chart_url)

    if (dxyFile || entryFile) {
      setIsUploading(true)
      try {
        if (dxyFile)   { const url = await uploadFile(dxyFile,   'trade-charts', 'dxy');   if (url) fd.set('dxy_chart_url',   url) }
        if (entryFile) { const url = await uploadFile(entryFile, 'trade-charts', 'entry'); if (url) fd.set('entry_chart_url', url) }
      } catch (err) {
        setIsUploading(false)
        setUploadError(err instanceof Error ? err.message : 'Image upload failed.')
        return
      }
      setIsUploading(false)
    }

    onSave(fd)
  }

  const title = isChild
    ? (trade ? 'Edit Scale-In' : 'Log Scale-In')
    : (trade ? 'Edit Trade'    : 'Log New Trade')

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">

          {/* ── 2-column grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-2">

            {/* Row 1 — Date Range | Symbol */}
            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <div className="flex items-center gap-1 rounded-md border border-border/50 px-3 py-2 text-sm transition-colors focus-within:ring-1 focus-within:ring-primary">
                <input
                  type="date"
                  name="open_date"
                  defaultValue={trade?.open_date}
                  onChange={(e) => setOpenDate(e.target.value)}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none [color-scheme:dark]"
                />
                <span className="shrink-0 select-none px-1 text-muted-foreground/30">→</span>
                <input
                  type="date"
                  name="close_date"
                  defaultValue={trade?.close_date ?? undefined}
                  min={openDate || undefined}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none [color-scheme:dark]"
                />
              </div>
              {dateError && <p className="text-xs text-red-400">{dateError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Symbol</Label>
              <SymbolComboBox
                symbols={symbols}
                value={symbol}
                onChange={setSymbol}
                name="symbol"
                placeholder="Select or add symbol"
                required
              />
            </div>

            {/* Row 2 — Trade Type | Campaign toggle (root) or just Trade Type (child) */}
            <div className="space-y-1.5">
              <Label>Trade Type</Label>
              {isChild ? (
                <Select name="leg_type" defaultValue={trade?.leg_type ?? 'ScaleIn'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEG_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={tradeType} onValueChange={handleTradeTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {TRADE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Right of Row 2 — Scale-in toggle for Swing/Intraswing, empty otherwise */}
            <div className="space-y-1.5">
              {showScaleIn && (
                <>
                  <Label htmlFor="scale_in">Campaign Mode</Label>
                  <div className="flex h-9 items-center gap-3 rounded-md border border-border/50 px-3">
                    <ToggleSwitch checked={scaleIn} onChange={setScaleIn} id="scale_in" />
                    <label
                      htmlFor="scale_in"
                      className="cursor-pointer select-none text-sm text-muted-foreground"
                    >
                      Enable Scale-In
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Row 3 — Confluences | Accounts */}
            <div className="space-y-1.5">
              <Label>Confluences</Label>
              <ConfluenceComboBox
                confluences={initialConfluences}
                selected={selectedConfluences}
                onChange={setSelectedConfluences}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Accounts</Label>
              <AccountsDropdown
                accounts={accounts}
                selected={selectedAccounts}
                onChange={setSelectedAccounts}
              />
            </div>

          </div>

          <div className="border-t border-white/[0.05]" />

          {/* ── Row 4: Outcome (full width) ────────────────────────────── */}
          <div className="space-y-3">
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
                <Label htmlFor="risk_reward">{isChild ? 'Target RR' : 'Risk / Reward'}</Label>
                <Input
                  id="risk_reward"
                  name="risk_reward"
                  type="number"
                  step="any"
                  placeholder="e.g. 2.5"
                  defaultValue={trade?.risk_reward ?? undefined}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="risk_factor">Risk Factor</Label>
                <Input
                  id="risk_factor"
                  type="number"
                  step="0.05"
                  min="0.05"
                  placeholder="1.0"
                  value={riskFactor}
                  onChange={(e) => setRiskFactor(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.05]" />

          {/* ── Charts (full width) ────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Charts</p>
            <div className="grid grid-cols-2 gap-4">
              <ImageDropzone label="DXY Chart"   onFileSelect={setDxyFile}   existingUrl={trade?.dxy_chart_url} />
              <ImageDropzone label="Entry Chart" onFileSelect={setEntryFile} existingUrl={trade?.entry_chart_url} />
            </div>
          </div>

          <div className="border-t border-white/[0.05]" />

          {/* ── Summary (full width) ───────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              name="summary"
              rows={3}
              placeholder="Trade rationale, execution notes…"
              defaultValue={trade?.summary ?? undefined}
            />
          </div>

          {uploadError && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 text-xs text-red-400">
              {uploadError}
            </p>
          )}

          <div className="flex gap-2 pb-1">
            <Button type="submit" className="flex-1 rounded-xl shadow-lg shadow-primary/20" disabled={isUploading}>
              {isUploading ? 'Uploading…' : trade ? 'Save Changes' : (isChild ? 'Log Scale-In' : 'Log Trade')}
            </Button>
            {trade && (
              <Button type="button" variant="destructive" className="rounded-xl" onClick={() => onDelete(trade)}>
                Delete
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
