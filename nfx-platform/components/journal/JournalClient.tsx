'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, List, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TradeCard } from './TradeCard'
import { TradeTable } from './TradeTable'
import { TradeModal } from './TradeModal'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { createTrade, updateTrade, deleteTrade } from '@/app/actions/trade-actions'
import type { Trade, Account, Confluence, Symbol, TradeType, TradeResult } from '@/types/database'

type ViewMode = 'gallery' | 'list'

type OptAction =
  | { type: 'add'; trade: Trade }
  | { type: 'update'; trade: Trade }
  | { type: 'delete'; id: string }

function buildOptimisticTrade(
  formData: FormData,
  accounts: Account[],
  confluences: Confluence[],
  existingId?: string | null,
): Trade {
  const accountIds    = formData.getAll('account_ids[]') as string[]
  const confluenceIds = formData.getAll('confluence_ids[]') as string[]
  return {
    id: existingId || `opt-${Date.now()}`,
    user_id: '',
    account_id: null,
    parent_trade_id: null,
    open_date:    (formData.get('open_date') as string) || new Date().toISOString().split('T')[0],
    close_date:   (formData.get('close_date') as string) || null,
    symbol:       (formData.get('symbol') as string) || '',
    direction:    null,
    trade_type:   (formData.get('trade_type') as TradeType) || null,
    scale_in_enabled: formData.get('scale_in_enabled') === 'true',
    model:        null,
    entry_type:   null,
    entry_price:  null,
    stop_loss:    null,
    take_profit:  null,
    risk_reward:  formData.get('risk_reward') ? parseFloat(formData.get('risk_reward') as string) : null,
    result:       ((formData.get('result') as TradeResult) || 'pending') as TradeResult,
    pnl:          formData.get('pnl') ? parseFloat(formData.get('pnl') as string) : null,
    summary:      (formData.get('summary') as string) || null,
    dxy_chart_url:   (formData.get('dxy_chart_url') as string) || null,
    entry_chart_url: (formData.get('entry_chart_url') as string) || null,
    new_daily_outlook_id:  null,
    new_weekly_outlook_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    trade_accounts:    accountIds.map((aid) => ({ account_id: aid, accounts: accounts.find((a) => a.id === aid) })),
    trade_confluences: confluenceIds.map((cid) => ({ confluence_id: cid, confluences: confluences.find((c) => c.id === cid) })),
    trade_groups: [],
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
      if (action.type === 'add')    return [action.trade, ...state]
      if (action.type === 'update') return state.map((t) => (t.id === action.trade.id ? action.trade : t))
      return state.filter((t) => t.id !== action.id)
    },
  )

  const [view, setView]                     = useState<ViewMode>('gallery')
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [editing, setEditing]               = useState<Trade | null>(null)
  const [dateFilter, setDateFilter]         = useState<string | null>(null)

  const trades = dateFilter
    ? optimistic.filter((t) => t.open_date === dateFilter)
    : optimistic

  function openCreate() { setEditing(null); setTradeModalOpen(true) }
  function openEdit(t: Trade) { setEditing(t); setTradeModalOpen(true) }
  function closeModal() { setTradeModalOpen(false); setEditing(null) }

  function handleSave(formData: FormData) {
    const id = formData.get('id') as string | null
    const optimisticTrade = buildOptimisticTrade(formData, accounts, confluences, id)
    closeModal()
    startTransition(async () => {
      dispatch(id
        ? { type: 'update', trade: optimisticTrade }
        : { type: 'add',    trade: optimisticTrade },
      )
      if (id) await updateTrade(id, formData)
      else    await createTrade(formData)
    })
  }

  function handleDelete(trade: Trade) {
    closeModal()
    startTransition(async () => {
      dispatch({ type: 'delete', id: trade.id })
      await deleteTrade(trade.id)
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

          <Button
            onClick={openCreate}
            className="rounded-xl shadow-lg shadow-primary/25"
          >
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
                    <TradeCard trade={t} onClick={openEdit} />
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
    </div>
  )
}
