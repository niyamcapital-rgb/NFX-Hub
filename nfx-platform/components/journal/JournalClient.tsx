'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, List, BookOpen } from 'lucide-react'
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

  const trades = dateFilter
    ? optimistic.filter((t) => t.open_date === dateFilter)
    : optimistic

  function openCreate()    { setEditing(null); setTradeModalOpen(true) }
  function openEdit(t: Trade) { setEditing(t); setTradeModalOpen(true) }
  function closeModal()    { setTradeModalOpen(false); setEditing(null) }

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
    setEditingChild(null)
    setChildParentId(null)
    setChildParentSymbol(null)
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
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {optimistic.length} execution{optimistic.length !== 1 ? 's' : ''} logged
            {dateFilter && (
              <> · filtered to {dateFilter}&nbsp;
                <button className="text-primary underline" onClick={() => setDateFilter(null)}>clear</button>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* iOS segmented control */}
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

          <Button onClick={openCreate} className="rounded-xl shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4" />
            Log Trade
          </Button>
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {trades.map((t) => (
                  <motion.div key={t.id} variants={staggerItem}>
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
