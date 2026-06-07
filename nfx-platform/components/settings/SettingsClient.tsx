'use client'

import { useState, useTransition } from 'react'
import React from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { upsertConfluence, deleteConfluence } from '@/app/actions/confluence-actions'
import type { Confluence } from '@/types/database'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

interface Props {
  confluences: Confluence[]
}

export function SettingsClient({ confluences: initialConfluences }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confluences, setConfluences] = useState(initialConfluences)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [cfName,      setCfName]      = useState('')
  const [cfColor,     setCfColor]     = useState(PRESET_COLORS[0])
  const [cfCategory,  setCfCategory]  = useState('')

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
      setConfluences((prev) =>
        prev.map((c) => c.id === editingId ? { ...c, name: cfName.trim(), color: cfColor, category: cfCategory || null } : c)
      )
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
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your confluence tags and trading configuration</p>
      </div>

      {/* Confluence tags section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Confluence Tags</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Color-coded tags applied to trades in the journal</p>
        </div>

        {/* Tag list */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'rgba(1,9,22,0.8)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {confluences.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No tags yet — create your first one below
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {confluences.map((c) => (
                <li
                  key={c.id}
                  className={cn(
                    'flex items-center justify-between px-5 py-3.5 transition-colors',
                    editingId === c.id ? 'bg-primary/5' : 'hover:bg-white/[0.02]',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-[#010916]"
                      style={{ background: c.color, '--tw-ring-color': `${c.color}40` } as React.CSSProperties}
                    />
                    <span className="text-sm font-medium">{c.name}</span>
                    {c.category && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
                        {c.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditConfluence(c)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfluence(c.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Form */}
          <div className="space-y-4 border-t p-5" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              {editingId ? 'Edit Tag' : 'New Tag'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-name">Name</Label>
                <Input
                  id="cf-name"
                  value={cfName}
                  onChange={(e) => setCfName(e.target.value)}
                  placeholder="e.g. Liquidity Sweep"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveConfluence()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-category">Category (optional)</Label>
                <Input
                  id="cf-category"
                  value={cfCategory}
                  onChange={(e) => setCfCategory(e.target.value)}
                  placeholder="e.g. Structure"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap items-center gap-2.5">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCfColor(color)}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all duration-150',
                      cfColor === color ? 'scale-110 border-white shadow-lg' : 'border-transparent hover:scale-105',
                    )}
                    style={{ background: color, boxShadow: cfColor === color ? `0 0 12px ${color}60` : undefined }}
                  />
                ))}
                <input
                  type="color"
                  value={cfColor}
                  onChange={(e) => setCfColor(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded-full border-2 border-transparent bg-transparent p-0 hover:scale-105"
                  title="Custom color"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSaveConfluence}
                disabled={isPending || !cfName.trim()}
                className="flex-1 rounded-xl shadow-lg shadow-primary/20"
              >
                {isPending ? 'Saving…' : editingId ? 'Update Tag' : <><Plus className="mr-1.5 h-4 w-4" />Add Tag</>}
              </Button>
              {editingId && (
                <Button variant="outline" onClick={resetConfluenceForm} className="rounded-xl">Cancel</Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
