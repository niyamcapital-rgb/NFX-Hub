'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { upsertConfluence, deleteConfluence } from '@/app/actions/confluence-actions'
import { EASE_OUT } from '@/lib/motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Confluence } from '@/types/database'

const PRESET_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

interface Props {
  confluences: Confluence[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function ConfluenceComboBox({ confluences: initial, selected, onChange }: Props) {
  const [open,        setOpen]        = useState(false)
  const [items,       setItems]       = useState<Confluence[]>(initial)
  const [newName,     setNewName]     = useState('')
  const [isAdding,    setIsAdding]    = useState(false)
  const [hoveredId,   setHoveredId]   = useState<string | null>(null)
  const [toDelete,    setToDelete]    = useState<Confluence | null>(null)
  const [, startTransition]           = useTransition()
  const containerRef                  = useRef<HTMLDivElement>(null)
  const inputRef                      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  async function handleAdd() {
    const name = newName.trim()
    if (!name || items.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setNewName('')
      return
    }
    setIsAdding(true)
    const color = PRESET_COLORS[items.length % PRESET_COLORS.length]
    const fd = new FormData()
    fd.set('name', name)
    fd.set('color', color)
    const result = await upsertConfluence(fd)
    setIsAdding(false)
    if ('id' in result && result.id) {
      const newC: Confluence = { id: result.id, user_id: '', name, color, category: null }
      setItems((prev) => [...prev, newC])
      onChange([...selected, result.id!])
    }
    setNewName('')
  }

  function confirmDelete() {
    if (!toDelete) return
    const { id } = toDelete
    setToDelete(null)
    setItems((prev) => prev.filter((c) => c.id !== id))
    onChange(selected.filter((x) => x !== id))
    startTransition(async () => { await deleteConfluence(id) })
  }

  const selectedItems = items.filter((c) => selected.includes(c.id))

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-border/50 bg-transparent px-3 py-2 text-sm transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <div className="flex flex-1 flex-wrap gap-1.5">
          {selectedItems.length === 0 ? (
            <span className="text-muted-foreground">Select confluences</span>
          ) : (
            selectedItems.map((c) => (
              <span
                key={c.id}
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: `${c.color}18`, color: c.color, border: `1px solid ${c.color}33` }}
              >
                {c.name}
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

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(-6px) scaleY(0.96)', transformOrigin: 'top' }}
            animate={{ opacity: 1, transform: 'translateY(0px)  scaleY(1)',    transformOrigin: 'top' }}
            exit={{    opacity: 0, transform: 'translateY(-4px) scaleY(0.97)', transformOrigin: 'top' }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
          >
            {/* Add input */}
            <div className="flex items-center gap-1.5 border-b border-border/50 px-2.5 py-2">
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                  if (e.key === 'Escape') setOpen(false)
                }}
                placeholder="Add confluence…"
                maxLength={40}
                disabled={isAdding}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              />
              <AnimatePresence>
                {newName.trim() && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{    opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.12, ease: EASE_OUT }}
                    type="button"
                    onClick={handleAdd}
                    disabled={isAdding}
                    className="rounded px-2 py-0.5 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
                  >
                    {isAdding ? 'Adding…' : 'Add'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Item list */}
            <ul className="max-h-56 overflow-y-auto py-1">
              {items.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No confluences yet — type above to add one
                </li>
              ) : (
                items.map((c) => {
                  const isSelected = selected.includes(c.id)
                  const isHovered  = hoveredId === c.id
                  return (
                    <li
                      key={c.id}
                      className="flex cursor-pointer items-center justify-between px-2.5 py-2 transition-colors hover:bg-secondary/40"
                      onMouseEnter={() => setHoveredId(c.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => toggle(c.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                            isSelected ? 'text-primary opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                        <span className={`text-sm ${isSelected ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {c.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setToDelete(c) }}
                        style={{ opacity: isHovered ? 1 : 0 }}
                        className="rounded p-1 text-muted-foreground transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <Dialog open={!!toDelete} onOpenChange={(v) => { if (!v) setToDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete confluence</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">{toDelete?.name}</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl border border-red-500/30 text-red-400 hover:border-red-500 hover:bg-red-500 hover:text-white"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
