'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSymbol, deleteSymbol } from '@/app/actions/symbol-actions'
import { upsertConfluence, deleteConfluence } from '@/app/actions/confluence-actions'
import type { Symbol, Confluence } from '@/types/database'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

interface Props {
  symbols: Symbol[]
  confluences: Confluence[]
}

export function SettingsClient({ symbols: initialSymbols, confluences: initialConfluences }: Props) {
  const [isPending, startTransition] = useTransition()

  // ── Symbols ──────────────────────────────────────────────────
  const [symbols, setSymbols] = useState(initialSymbols)
  const [newSymbol, setNewSymbol] = useState('')

  function handleAddSymbol() {
    const name = newSymbol.trim().toUpperCase()
    if (!name) return
    const optimistic = { id: `opt-${Date.now()}`, user_id: '', name, created_at: new Date().toISOString() }
    setSymbols((prev) => [...prev, optimistic].sort((a, b) => a.name.localeCompare(b.name)))
    setNewSymbol('')
    startTransition(async () => { await createSymbol(name) })
  }

  function handleDeleteSymbol(id: string) {
    setSymbols((prev) => prev.filter((s) => s.id !== id))
    startTransition(async () => { await deleteSymbol(id) })
  }

  // ── Confluences ───────────────────────────────────────────────
  const [confluences, setConfluences] = useState(initialConfluences)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [cfName, setCfName]           = useState('')
  const [cfColor, setCfColor]         = useState(PRESET_COLORS[0])
  const [cfCategory, setCfCategory]   = useState('')

  function startEditConfluence(c: Confluence) {
    setEditingId(c.id)
    setCfName(c.name)
    setCfColor(c.color)
    setCfCategory(c.category ?? '')
  }

  function resetConfluenceForm() {
    setEditingId(null)
    setCfName('')
    setCfColor(PRESET_COLORS[0])
    setCfCategory('')
  }

  function handleSaveConfluence() {
    if (!cfName.trim()) return
    const fd = new FormData()
    if (editingId) fd.set('id', editingId)
    fd.set('name', cfName.trim())
    fd.set('color', cfColor)
    fd.set('category', cfCategory)

    if (editingId) {
      setConfluences((prev) => prev.map((c) => c.id === editingId ? { ...c, name: cfName.trim(), color: cfColor, category: cfCategory || null } : c))
    } else {
      const optimistic: Confluence = { id: `opt-${Date.now()}`, user_id: '', name: cfName.trim(), color: cfColor, category: cfCategory || null }
      setConfluences((prev) => [...prev, optimistic])
    }
    resetConfluenceForm()
    startTransition(async () => { await upsertConfluence(fd) })
  }

  function handleDeleteConfluence(id: string) {
    setConfluences((prev) => prev.filter((c) => c.id !== id))
    startTransition(async () => { await deleteConfluence(id) })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your trading symbols and confluence tags</p>
      </div>

      {/* ── Trading Symbols ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Trading Symbols</h2>
          <p className="text-sm text-muted-foreground">Symbols available in the trade journal dropdown</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card">
          {symbols.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No symbols yet — add your first one below
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {symbols.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-3">
                  <span className="font-mono text-sm font-medium">{s.name}</span>
                  <button
                    onClick={() => handleDeleteSymbol(s.id)}
                    disabled={isPending}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 border-t border-border/40 p-3">
            <Input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSymbol()}
              placeholder="e.g. EURUSD"
              className="font-mono uppercase"
            />
            <Button onClick={handleAddSymbol} disabled={isPending || !newSymbol.trim()} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </section>

      {/* ── Confluence Tags ──────────────────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Confluence Tags</h2>
          <p className="text-sm text-muted-foreground">Color-coded tags applied to trades in the journal</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card">
          {confluences.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No tags yet — create your first one below
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {confluences.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    editingId === c.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.category && <span className="text-[11px] text-muted-foreground">· {c.category}</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditConfluence(c)} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteConfluence(c.id)} disabled={isPending} className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3 border-t border-border/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {editingId ? 'Edit Tag' : 'New Tag'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-name">Name</Label>
                <Input id="cf-name" value={cfName} onChange={(e) => setCfName(e.target.value)} placeholder="e.g. Liquidity Sweep" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-category">Category (optional)</Label>
                <Input id="cf-category" value={cfCategory} onChange={(e) => setCfCategory(e.target.value)} placeholder="e.g. Structure" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCfColor(c)}
                    className={`h-6 w-6 rounded-full border-2 transition-all ${cfColor === c ? 'scale-110 border-white' : 'border-transparent'}`}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={cfColor}
                  onChange={(e) => setCfColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  title="Custom color"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveConfluence} disabled={isPending || !cfName.trim()} className="flex-1">
                {isPending ? 'Saving…' : editingId ? 'Update Tag' : <><Plus className="mr-1.5 h-4 w-4" />Add Tag</>}
              </Button>
              {editingId && <Button variant="outline" onClick={resetConfluenceForm}>Cancel</Button>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
