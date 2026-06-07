'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertConfluence, deleteConfluence } from '@/app/actions/confluence-actions'
import type { Confluence } from '@/types/database'

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

interface Props {
  open: boolean
  onClose: () => void
  confluences: Confluence[]
}

export function ConfluenceManager({ open, onClose, confluences }: Props) {
  const [isPending, startTransition] = useTransition()
  const [editingId, setEditingId]    = useState<string | null>(null)
  const [name, setName]              = useState('')
  const [color, setColor]            = useState(PRESET_COLORS[0])
  const [category, setCategory]      = useState('')

  function startEdit(c: Confluence) {
    setEditingId(c.id)
    setName(c.name)
    setColor(c.color)
    setCategory(c.category ?? '')
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setColor(PRESET_COLORS[0])
    setCategory('')
  }

  function handleSave() {
    if (!name.trim()) return
    const fd = new FormData()
    if (editingId) fd.set('id', editingId)
    fd.set('name', name.trim())
    fd.set('color', color)
    fd.set('category', category)
    startTransition(async () => {
      await upsertConfluence(fd)
      resetForm()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteConfluence(id) })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confluence Tags</DialogTitle>
        </DialogHeader>

        {/* Existing tags */}
        <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {confluences.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No confluences yet. Create your first tag below.</p>
          )}
          {confluences.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded-md border px-3 py-2 transition-colors ${
                editingId === c.id ? 'border-primary/50 bg-primary/5' : 'border-border/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                <span className="text-sm font-medium">{c.name}</span>
                {c.category && <span className="text-[11px] text-muted-foreground">· {c.category}</span>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(c)} className="rounded p-1 hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(c.id)} disabled={isPending} className="rounded p-1 hover:bg-secondary">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {editingId ? 'Edit Tag' : 'New Tag'}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="cf-name">Name</Label>
            <Input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Liquidity Sweep" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-category">Category (optional)</Label>
            <Input id="cf-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Structure, Entry" />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
                title="Custom color"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={isPending || !name.trim()}>
              {isPending ? 'Saving…' : editingId ? 'Update Tag' : <><Plus className="mr-1.5 h-4 w-4" />Add Tag</>}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
