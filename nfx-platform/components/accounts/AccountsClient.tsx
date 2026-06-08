'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountCard } from './AccountCard'
import { AccountModal } from './AccountModal'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { upsertAccount, deleteAccount } from '@/app/actions/account-actions'
import type { Account, AccountGroup, AccountPhase, AccountStatus, Trade } from '@/types/database'

const GROUPS: (AccountGroup | 'All')[] = ['All', 'A', 'B', 'C', 'D', 'E']

type OptAction =
  | { type: 'upsert'; account: Account }
  | { type: 'delete'; id: string }

function buildOptimistic(formData: FormData, existingId?: string | null): Account {
  return {
    id: existingId || `opt-${Date.now()}`,
    user_id: '',
    firm_name: (formData.get('firm_name') as string) || '',
    account_name: (formData.get('account_name') as string) || '',
    starting_balance: parseFloat(formData.get('starting_balance') as string) || 0,
    current_balance: formData.get('current_balance') ? parseFloat(formData.get('current_balance') as string) : null,
    profit_target_pct: parseFloat(formData.get('profit_target_pct') as string) || 0,
    max_drawdown_pct: parseFloat(formData.get('max_drawdown_pct') as string) || 0,
    daily_loss_limit_pct: formData.get('daily_loss_limit_pct') ? parseFloat(formData.get('daily_loss_limit_pct') as string) : null,
    status: ((formData.get('status') as AccountStatus) || 'active'),
    phase: (formData.get('phase') as AccountPhase) || null,
    grp: (formData.get('grp') as AccountGroup) || null,
    start_date: (formData.get('start_date') as string) || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

interface Props { initialAccounts: Account[]; trades: Trade[] }

export function AccountsClient({ initialAccounts, trades }: Props) {
  const [, startTransition] = useTransition()
  const [optimistic, dispatch] = useOptimistic(
    initialAccounts,
    (state: Account[], action: OptAction) => {
      if (action.type === 'upsert') {
        const exists = state.some((a) => a.id === action.account.id)
        return exists
          ? state.map((a) => (a.id === action.account.id ? action.account : a))
          : [action.account, ...state]
      }
      return state.filter((a) => a.id !== action.id)
    },
  )

  const [filter, setFilter] = useState<AccountGroup | 'All'>('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)

  const filtered = filter === 'All' ? optimistic : optimistic.filter((a) => a.grp === filter)

  function openCreate() { setEditing(null); setModalOpen(true) }
  function openEdit(a: Account) { setEditing(a); setModalOpen(true) }
  function closeModal() { setModalOpen(false) }

  function handleSave(formData: FormData) {
    const id = formData.get('id') as string | null
    const optimisticAccount = buildOptimistic(formData, id)
    closeModal()
    startTransition(async () => {
      dispatch({ type: 'upsert', account: optimisticAccount })
      await upsertAccount(formData)
    })
  }

  function handleDelete(account: Account) {
    closeModal()
    startTransition(async () => {
      dispatch({ type: 'delete', id: account.id })
      await deleteAccount(account.id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prop Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your funded allocations and drawdown limits</p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as AccountGroup | 'All')}>
        <TabsList>
          {GROUPS.map((g) => (
            <TabsTrigger key={g} value={g}>{g === 'All' ? 'All' : `Group ${g}`}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium text-muted-foreground">No accounts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Click "Add Account" to provision your first funded account</p>
        </div>
      ) : (
        <motion.div
          key="account-grid"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((a) => (
              <motion.div key={a.id} variants={staggerItem} layout>
                <AccountCard account={a} trades={trades} onClick={openEdit} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AccountModal
        key={editing?.id ?? 'new'}
        open={modalOpen}
        onClose={closeModal}
        account={editing}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
