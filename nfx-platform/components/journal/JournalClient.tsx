'use client'

import { useOptimistic, useTransition, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, List, BookOpen, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TradeCampaignDashboard } from './TradeCampaignDashboard'
import { TradeTable } from './TradeTable'
import { TradeModal } from './TradeModal'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { createTrade, updateTrade, deleteTrade } from '@/app/actions/trade-actions'
import type { Trade, Account, Confluence, LegType, Symbol, TradeType, TradeResult } from '@/types/database'

type ViewMode = 'gallery' | 'list'

type OptAction =
  | { type: 'add';          trade: Trade }
  | { type: 'update';       trade: Trade }
  | { type: 'delete';       id: string }
  | { type: 'add-child';    parentId: string; child: Trade }
  | { type: 'update-child'; parentId: string; child: Trade }
  | { type: 'delete-child'; parentId: string; childId: string }

function buildOptimisticTrade(
  formData: FormData,
  accounts: Account[],
  confluences: Confluence[],
  existingId?: string | null,
): Trade {
  const accountIds    = formData.getAll('account_ids[]') as string[]
  const confluenceIds = formData.getAll('confluence_ids[]') as string[]
  return {
    id:               existingId || `opt-${Date.now()}`,
    user_id:          '',
    account_id:       null,
    parent_trade_id:  (formData.get('parent_trade_id') as string) || null,
    risk_factor:      formData.get('risk_factor') ? parseFloat(formData.get('risk_factor') as string) : null,
    leg_type:         (formData.get('leg_type') as LegType) || null,
    open_date:        (formData.get('open_date') as string) || new Date().toISOString().split('T')[0],
    close_date:       (formData.get('close_date') as string) || null,
    symbol:           (formData.get('symbol') as string) || '',
    direction:        null,
    trade_type:       (formData.get('trade_type') as TradeType) || null,
    scale_in_enabled: formData.get('scale_in_enabled') === 'true',
    model:            null,
    entry_type:       null,
    entry_price:      null,
    stop_loss:        null,
    take_profit:      null,
    risk_reward:      formData.get('risk_reward') ? parseFloat(formData.get('risk_reward') as string) : null,
    result:           ((formData.get('result') as TradeResult) || 'pending') as TradeResult,
    pnl:              formData.get('pnl') ? parseFloat(formData.get('pnl') as string) : null,
    summary:          (formData.get('summary') as string) || null,
    dxy_chart_url:    (formData.get('dxy_chart_url') as string) || null,
    entry_chart_url:  (formData.get('entry_chart_url') as string) || null,
    new_daily_outlook_id:  null,
    new_weekly_outlook_id: null,
    created_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString(),
    children:    [],
    trade_accounts:    accountIds.map((aid) => ({ account_id: aid, accounts: accounts.find((a) => a.id === aid) })),
    trade_confluences: confluenceIds.map((cid) => ({ confluence_id: cid, confluences: confluences.find((c) => c.id === cid) })),
    trade_groups:      [],
  }
}

interface Props {
  initialTrades: Trade[]
  accounts: Account[]
  confluences: Confluence[]
  symbols: Symbol[]
}

export function JournalClient({ initialTrades, accounts, confluences, symbols }: Props) {
  const [, startTransition] = useTransition()
  const [optimistic, dispatch] = useOptimistic(
    initialTrades,
    (state: Trade[], action: OptAction) => {
      switch (action.type) {
        case 'add':    return [action.trade, ...state]
        case 'update': return state.map((t) => t.id === action.trade.id ? action.trade : t)
        case 'delete': return state.filter((t) => t.id !== action.id)
        case 'add-child':
          return state.map((t) => t.id === action.parentId
            ? { ...t, children: [...(t.children ?? []), action.child] }
            : t)
        case 'update-child':
          return state.map((t) => t.id === action.parentId
            ? { ...t, children: (t.children ?? []).map((c) => c.id === action.child.id ? action.child : c) }
            : t)
        case 'delete-child':
          return state.map((t) => t.id === action.parentId
            ? { ...t, children: (t.children ?? []).filter((c) => c.id !== action.childId) }
            : t)
      }
    },
  )

  const [view, setView]                         = useState<ViewMode>('gallery')
  const [tradeModalOpen, setTradeModalOpen]     = useState(false)
  const [editing, setEditing]                   = useState<Trade | null>(null)
  const [childModalOpen, setChildModalOpen]     = useState(false)
  const [editingChild, setEditingChild]         = useState<Trade | null>(null)
  const [childParentId, setChildParentId]       = useState<string | null>(null)
  const [childParentSymbol, setChildParentSymbol] = useState<string | null>(null)
  const [childSaveError, setChildSaveError]     = useState<string | null>(null)
  const [dateFilter, setDateFilter]             = useState<string | null>(null)

  // Filter + sort state
  const [typeFilters, setTypeFilters] = useState<TradeType[]>([])
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [sortDir, setSortDir]         = useState<'desc' | 'asc'>('desc')
  const [filterOpen, setFilterOpen]   = useState(false)
  const [sortOpen, setSortOpen]       = useState(false)

  const activeFilterCount = typeFilters.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (dateFilter ? 1 : 0)

  function toggleType(t: TradeType) {
    setTypeFilters((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])
  }

  function clearFilters() {
    setTypeFilters([])
    setDateFrom('')
    setDateTo('')
    setDateFilter(null)
  }

  const trades = useMemo(() => {
    const result = optimistic.filter((t) => {
      if (dateFilter && t.open_date !== dateFilter) return false
      if (typeFilters.length > 0 && (t.trade_type === null || !typeFilters.includes(t.trade_type))) return false
      if (dateFrom && t.open_date < dateFrom) return false
      if (dateTo && t.open_date > dateTo) return false
      return true
    })
    return result.sort((a, b) => {
      const cmp = a.open_date.localeCompare(b.open_date)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [optimistic, dateFilter, typeFilters, dateFrom, dateTo, sortDir])

  function openCreate()    { setEditing(null); setTradeModalOpen(true) }
  function openEdit(t: Trade) { setEditing(t); setTradeModalOpen(true) }
  function closeModal()    { setTradeModalOpen(false) }

  function openAddChild(parentId: string, parentSymbol: string) {
    setChildParentId(parentId)
    setChildParentSymbol(parentSymbol)
    setEditingChild(null)
    setChildSaveError(null)
    setChildModalOpen(true)
  }
  function openEditChild(child: Trade) {
    setChildParentId(child.parent_trade_id)
    setChildParentSymbol(null)
    setEditingChild(child)
    setChildSaveError(null)
    setChildModalOpen(true)
  }
  function closeChildModal() {
    setChildModalOpen(false)
  }

  function handleSave(formData: FormData) {
    const id = formData.get('id') as string | null
    const optimisticTrade = buildOptimisticTrade(formData, accounts, confluences, id)
    closeModal()
    startTransition(async () => {
      dispatch(id
        ? { type: 'update', trade: optimisticTrade }
        : { type: 'add',    trade: optimisticTrade })
      if (id) await updateTrade(id, formData)
      else    await createTrade(formData)
    })
  }

  function handleChildSave(formData: FormData) {
    const id       = formData.get('id') as string | null
    const parentId = formData.get('parent_trade_id') as string
    const child    = buildOptimisticTrade(formData, accounts, confluences, id)
    setChildSaveError(null)
    closeChildModal()
    startTransition(async () => {
      dispatch(id
        ? { type: 'update-child', parentId, child }
        : { type: 'add-child',   parentId, child })
      const result = id ? await updateTrade(id, formData) : await createTrade(formData)
      if (result && 'error' in result && result.error) {
        setChildSaveError(result.error)
      }
    })
  }

  function handleDelete(trade: Trade) {
    if (tradeModalOpen) closeModal()
    startTransition(async () => {
      dispatch({ type: 'delete', id: trade.id })
      await deleteTrade(trade.id)
    })
  }

  function handleChildDelete(child: Trade) {
    const parentId = child.parent_trade_id!
    startTransition(async () => {
      dispatch({ type: 'delete-child', parentId, childId: child.id })
      await deleteTrade(child.id)
    })
  }

  return (
    <div className="space-y-6">
      {/* Click-outside overlay for dropdowns */}
      {(filterOpen || sortOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setFilterOpen(false); setSortOpen(false) }} />
      )}

      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {trades.length !== optimistic.length
              ? <>{trades.length} of {optimistic.length} trades</>
              : <>{optimistic.length} execution{optimistic.length !== 1 ? 's' : ''} logged</>
            }
            {activeFilterCount > 0 && (
              <> · <button className="text-primary underline" onClick={clearFilters}>clear</button></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter icon + dropdown */}
          <div className="relative">
            <button
              onClick={() => { setFilterOpen((o) => !o); setSortOpen(false) }}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150',
                filterOpen || activeFilterCount > 0
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-black">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                  exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
                  className="absolute right-0 top-10 z-50 w-60 rounded-xl border p-3 shadow-xl"
                  style={{ background: 'rgba(13,13,13,0.98)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                >
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">Type</p>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {(['Swing', 'Intraswing', 'Intraday', 'Manipulation', 'Placeholder'] as TradeType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={cn(
                          'rounded-lg border px-2 py-0.5 text-[11px] font-medium transition-all duration-150',
                          typeFilters.includes(type)
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground',
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">Date range</p>
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-muted-foreground focus:border-white/20 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-muted-foreground focus:border-white/20 focus:outline-none"
                    />
                  </div>

                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="mt-3 w-full text-center text-[11px] text-muted-foreground/50 underline hover:text-muted-foreground"
                    >
                      Clear all
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort icon + dropdown */}
          <div className="relative">
            <button
              onClick={() => { setSortOpen((o) => !o); setFilterOpen(false) }}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150',
                sortOpen
                  ? 'border-white/20 bg-white/[0.06] text-foreground'
                  : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground',
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                  exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
                  className="absolute right-0 top-10 z-50 w-40 overflow-hidden rounded-xl border shadow-xl"
                  style={{ background: 'rgba(13,13,13,0.98)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                >
                  {(['desc', 'asc'] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => { setSortDir(dir); setSortOpen(false) }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-colors duration-150',
                        sortDir === dir
                          ? 'bg-white/[0.06] text-foreground'
                          : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
                      )}
                    >
                      {dir === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                      {dir === 'desc' ? 'Newest first' : 'Oldest first'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button onClick={openCreate} className="rounded-xl shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" />
            Log Trade
          </Button>

          <div className="h-5 w-px bg-white/10" />

          {/* Gallery / List toggle */}
          <div className="flex rounded-xl bg-white/[0.05] p-1">
            <button
              onClick={() => setView('gallery')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                view === 'gallery'
                  ? 'bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Gallery
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                view === 'list'
                  ? 'bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'gallery' ? (
          <motion.div
            key="gallery"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-24 text-center">
                <div className="mb-4 rounded-full bg-white/[0.04] p-5">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No trades yet</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Click "Log Trade" to record your first execution</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {trades.map((t) => (
                  <motion.div key={t.id} variants={staggerItem} layout className="min-w-0 max-w-full overflow-hidden">
                    <TradeCampaignDashboard
                      trade={t}
                      onEdit={() => openEdit(t)}
                      onEditChild={openEditChild}
                      onAddChild={(sym) => openAddChild(t.id, sym)}
                      onDelete={() => handleDelete(t)}
                      onDeleteChild={handleChildDelete}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            <TradeTable trades={trades} onRowClick={openEdit} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scale-in save error banner */}
      {childSaveError && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5">
          <p className="text-xs text-red-400">Scale-in failed to save: {childSaveError}</p>
          <button onClick={() => setChildSaveError(null)} className="ml-4 text-xs text-red-400/60 hover:text-red-400">Dismiss</button>
        </div>
      )}

      {/* Root trade modal */}
      <TradeModal
        key={editing?.id ?? 'new'}
        open={tradeModalOpen}
        onClose={closeModal}
        trade={editing}
        accounts={accounts}
        confluences={confluences}
        symbols={symbols}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Child (scale-in) trade modal */}
      <TradeModal
        key={editingChild?.id ?? `child-new-${childParentId}`}
        open={childModalOpen}
        onClose={closeChildModal}
        trade={editingChild}
        accounts={accounts}
        confluences={confluences}
        symbols={symbols}
        onSave={handleChildSave}
        onDelete={(child) => { closeChildModal(); handleChildDelete(child) }}
        parentTradeId={childParentId ?? undefined}
        parentSymbol={childParentSymbol ?? undefined}
      />
    </div>
  )
}
