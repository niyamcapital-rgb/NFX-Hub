'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageDropzone } from '@/components/ui/image-dropzone'
import { uploadFile } from '@/lib/storage-utils'
import { upsertConfluence, deleteConfluence } from '@/app/actions/confluence-actions'
import type { Account, Confluence, Symbol, Trade, TradeType } from '@/types/database'

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

export function TradeModal({ open, onClose, trade, accounts, confluences: initialConfluences, symbols, onSave, onDelete }: Props) {
  const [selectedAccounts,    setSelectedAccounts]    = useState<string[]>(trade?.trade_accounts?.map((ta) => ta.account_id) ?? [])
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>(trade?.trade_confluences?.map((tc) => tc.confluence_id) ?? [])
  const [tradeType,   setTradeType]   = useState<TradeType | ''>(trade?.trade_type ?? '')
  const [scaleIn,     setScaleIn]     = useState(trade?.scale_in_enabled ?? false)
  const [dxyFile,     setDxyFile]     = useState<File | null>(null)
  const [entryFile,   setEntryFile]   = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Inline confluence management
  const [allConfluences, setAllConfluences] = useState<Confluence[]>(initialConfluences)
  const [showAddCf,      setShowAddCf]      = useState(false)
  const [newCfName,      setNewCfName]      = useState('')
  const [isAddingCf,     setIsAddingCf]     = useState(false)

  const showScaleIn = tradeType === 'Swing' || tradeType === 'Intraswing'

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (trade?.id) fd.set('id', trade.id)
    selectedAccounts.forEach((id)    => fd.append('account_ids[]', id))
    selectedConfluences.forEach((id) => fd.append('confluence_ids[]', id))
    fd.set('scale_in_enabled', String(scaleIn))
    if (tradeType) fd.set('trade_type', tradeType)

    setUploadError(null)

    if (!dxyFile && trade?.dxy_chart_url)     fd.set('dxy_chart_url',   trade.dxy_chart_url)
    if (!entryFile && trade?.entry_chart_url) fd.set('entry_chart_url', trade.entry_chart_url)

    if (dxyFile || entryFile) {
      setIsUploading(true)
      try {
        if (dxyFile) {
          const url = await uploadFile(dxyFile, 'trade-charts', 'dxy')
          if (url) fd.set('dxy_chart_url', url)
        }
        if (entryFile) {
          const url = await uploadFile(entryFile, 'trade-charts', 'entry')
          if (url) fd.set('entry_chart_url', url)
        }
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? 'Edit Trade' : 'Log New Trade'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="open_date">Open Date</Label>
              <Input id="open_date" name="open_date" type="date" defaultValue={trade?.open_date} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close_date">Close Date</Label>
              <Input id="close_date" name="close_date" type="date" defaultValue={trade?.close_date ?? undefined} />
            </div>
          </div>

          {/* Symbol + Trade Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Symbol</Label>
              {symbols.length > 0 ? (
                <Select name="symbol" defaultValue={trade?.symbol ?? ''} required>
                  <SelectTrigger><SelectValue placeholder="Select symbol" /></SelectTrigger>
                  <SelectContent>
                    {symbols.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-9 items-center rounded-md border border-border/50 px-3 text-sm text-muted-foreground">
                  Add symbols in Settings first
                </div>
              )}
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

          {/* Scale-in toggle */}
          {showScaleIn && (
            <div className="flex items-center gap-3 rounded-md border border-border/50 bg-secondary/20 px-3 py-2.5">
              <input
                id="scale_in"
                type="checkbox"
                checked={scaleIn}
                onChange={(e) => setScaleIn(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor="scale_in" className="text-sm">
                Enable scale-in position
                <span className="ml-2 text-xs text-muted-foreground">(creates a linked child trade)</span>
              </label>
            </div>
          )}

          {/* Result + RR + PnL */}
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
              <Label htmlFor="risk_reward">Risk / Reward</Label>
              <Input id="risk_reward" name="risk_reward" type="number" step="any" placeholder="e.g. 2.5" defaultValue={trade?.risk_reward ?? undefined} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pnl">P&L ($)</Label>
              <Input id="pnl" name="pnl" type="number" step="0.01" defaultValue={trade?.pnl ?? undefined} />
            </div>
          </div>

          {/* Chart image uploads */}
          <div className="grid grid-cols-2 gap-4">
            <ImageDropzone label="DXY Chart"   onFileSelect={setDxyFile}   existingUrl={trade?.dxy_chart_url} />
            <ImageDropzone label="Entry Chart" onFileSelect={setEntryFile} existingUrl={trade?.entry_chart_url} />
          </div>

          {/* Accounts */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Accounts</Label>
              <div className="flex flex-wrap gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAccount(a.id)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      selectedAccounts.includes(a.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {a.account_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confluences — inline list with add + delete */}
          <div className="space-y-2">
            <Label>Confluences</Label>
            <div className="overflow-hidden rounded-lg border border-border/50">
              {allConfluences.length === 0 && !showAddCf ? (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No confluences yet — click below to add your first
                </p>
              ) : (
                <ul>
                  {allConfluences.map((c) => {
                    const selected = selectedConfluences.includes(c.id)
                    return (
                      <li
                        key={c.id}
                        className={`group flex cursor-pointer items-center justify-between border-b border-border/30 px-3 py-2.5 last:border-0 transition-colors ${
                          selected ? 'bg-primary/8' : 'hover:bg-secondary/30'
                        }`}
                        onClick={() => toggleConfluence(c.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full transition-opacity ${selected ? 'opacity-100' : 'opacity-50'}`}
                            style={{ background: c.color }}
                          />
                          <span className={`text-sm transition-colors ${selected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {c.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteConfluence(c.id) }}
                          className="rounded p-1 text-muted-foreground/30 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Add row */}
              {showAddCf ? (
                <div className="flex items-center gap-2 border-t border-border/30 bg-secondary/20 px-3 py-2">
                  <input
                    autoFocus
                    value={newCfName}
                    onChange={(e) => setNewCfName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddConfluence() }
                      if (e.key === 'Escape') { setShowAddCf(false); setNewCfName('') }
                    }}
                    placeholder="Confluence name…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    disabled={isAddingCf}
                  />
                  <button
                    type="button"
                    onClick={handleAddConfluence}
                    disabled={isAddingCf || !newCfName.trim()}
                    className="text-xs text-primary disabled:opacity-40 hover:underline"
                  >
                    {isAddingCf ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCf(false); setNewCfName('') }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddCf(true)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground ${
                    allConfluences.length > 0 ? 'border-t border-border/30' : ''
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Confluence
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" name="summary" rows={3} placeholder="Trade rationale, execution notes…" defaultValue={trade?.summary ?? undefined} />
          </div>

          {uploadError && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {uploadError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isUploading || isAddingCf}>
              {isUploading ? 'Uploading…' : trade ? 'Save Changes' : 'Log Trade'}
            </Button>
            {trade && (
              <Button type="button" variant="destructive" onClick={() => onDelete(trade)}>Delete</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
