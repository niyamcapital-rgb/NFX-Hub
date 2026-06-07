'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { createSymbol, deleteSymbol } from '@/app/actions/symbol-actions'
import { EASE_OUT } from '@/lib/motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Symbol } from '@/types/database'

interface Props {
  symbols: Symbol[]
  value: string
  onChange: (value: string) => void
  name?: string
  placeholder?: string
  required?: boolean
}

export function SymbolComboBox({
  symbols: initial,
  value,
  onChange,
  name,
  placeholder = 'Select symbol',
  required,
}: Props) {
  const [open,           setOpen]           = useState(false)
  const [items,          setItems]          = useState<Symbol[]>(initial)
  const [newName,        setNewName]        = useState('')
  const [isAdding,       setIsAdding]       = useState(false)
  const [hoveredId,      setHoveredId]      = useState<string | null>(null)
  const [symbolToDelete, setSymbolToDelete] = useState<{ id: string; name: string } | null>(null)
  const [, startTransition]                = useTransition()
  const containerRef                       = useRef<HTMLDivElement>(null)
  const inputRef                           = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Focus add-input when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  async function handleAdd() {
    const name = newName.trim().toUpperCase()
    if (!name || items.some((s) => s.name === name)) {
      setNewName('')
      return
    }
    setIsAdding(true)
    const tempId = `opt-${Date.now()}`
    const optimistic: Symbol = { id: tempId, user_id: '', name, created_at: new Date().toISOString() }
    setItems((prev) => [...prev, optimistic])
    onChange(name)
    setNewName('')
    setIsAdding(false)
    setOpen(false)
    startTransition(async () => {
      const result = await createSymbol(name)
      if ('id' in result && result.id) {
        setItems((prev) => prev.map((s) => (s.id === tempId ? { ...s, id: result.id! } : s)))
      }
    })
  }

  function confirmDelete() {
    if (!symbolToDelete) return
    const { id, name } = symbolToDelete
    setSymbolToDelete(null)
    setItems((prev) => prev.filter((s) => s.id !== id))
    if (value === name) onChange('')
    startTransition(async () => { await deleteSymbol(id) })
  }

  function handleSelect(symbolName: string) {
    onChange(symbolName)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border/50 bg-transparent px-3 text-sm transition-colors hover:border-border/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          className="ml-2 shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, transform: 'translateY(-6px) scaleY(0.96)', transformOrigin: 'top' }}
            animate={{ opacity: 1, transform: 'translateY(0px)  scaleY(1)',    transformOrigin: 'top' }}
            exit={{    opacity: 0, transform: 'translateY(-4px) scaleY(0.97)', transformOrigin: 'top' }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
          >
            {/* Add-symbol input row */}
            <div className="flex items-center gap-1.5 border-b border-border/50 px-2.5 py-2">
              <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
                  if (e.key === 'Escape') { setOpen(false) }
                }}
                placeholder="Add new symbol…"
                maxLength={20}
                disabled={isAdding}
                className="flex-1 bg-transparent text-sm font-mono tracking-wide outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/40"
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

            {/* Symbol list */}
            <ul className="max-h-56 overflow-y-auto py-1">
              {items.length === 0 ? (
                <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                  No symbols yet — type above to add one
                </li>
              ) : (
                items.map((s) => {
                  const selected  = value === s.name
                  const isHovered = hoveredId === s.id
                  return (
                    <li
                      key={s.id}
                      className="flex cursor-pointer items-center justify-between px-2.5 py-2 transition-colors hover:bg-secondary/40"
                      onMouseEnter={() => setHoveredId(s.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleSelect(s.name)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Check
                          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                            selected ? 'text-primary opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span className={`font-mono text-sm tracking-wide ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {s.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSymbolToDelete({ id: s.id, name: s.name }) }}
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!symbolToDelete} onOpenChange={(open) => { if (!open) setSymbolToDelete(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete symbol</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-mono font-semibold text-foreground">{symbolToDelete?.name}</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl"
              onClick={() => setSymbolToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white hover:border-red-500"
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
