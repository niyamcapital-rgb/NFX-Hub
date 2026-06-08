'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeeklyOutlookCard, DailyOutlookCard } from './OutlookCard'
import { OutlookModal } from './OutlookModal'
import { staggerContainer, staggerItem } from '@/lib/motion'
import {
  upsertWeeklyOutlook,
  upsertDailyOutlook,
  deleteWeeklyOutlook,
  deleteDailyOutlook,
} from '@/app/actions/outlook-actions'
import type { WeeklyOutlook, DailyOutlook } from '@/types/database'

type WeeklyOptAction =
  | { type: 'add';    outlook: WeeklyOutlook }
  | { type: 'update'; outlook: WeeklyOutlook }
  | { type: 'delete'; id: string }

type DailyOptAction =
  | { type: 'add';    outlook: DailyOutlook }
  | { type: 'update'; outlook: DailyOutlook }
  | { type: 'delete'; id: string }

function buildOptimisticWeekly(formData: FormData, existingId?: string | null): WeeklyOutlook {
  return {
    id: existingId || `opt-${Date.now()}`,
    user_id: '',
    week_start:   (formData.get('week_start') as string) || new Date().toISOString().split('T')[0],
    trading_plan: (formData.get('trading_plan') as string) || null,
    notes:        (formData.get('notes') as string) || null,
    chart_url:    (formData.get('chart_url') as string) || null,
    news_urls:    formData.get('news_image_url') ? [formData.get('news_image_url') as string] : null,
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }
}

function buildOptimisticDaily(formData: FormData, existingId?: string | null): DailyOutlook {
  return {
    id: existingId || `opt-${Date.now()}`,
    user_id: '',
    outlook_date: (formData.get('outlook_date') as string) || new Date().toISOString().split('T')[0],
    trading_plan: (formData.get('trading_plan') as string) || null,
    chart_url:    (formData.get('chart_url') as string) || null,
    created_at:   new Date().toISOString(),
    updated_at:   new Date().toISOString(),
  }
}

interface Props {
  initialWeekly: WeeklyOutlook[]
  initialDaily:  DailyOutlook[]
}

export function OutlooksClient({ initialWeekly, initialDaily }: Props) {
  const [, startTransition] = useTransition()

  const [optimisticWeekly, dispatchWeekly] = useOptimistic(
    initialWeekly,
    (state: WeeklyOutlook[], action: WeeklyOptAction) => {
      if (action.type === 'add')    return [action.outlook, ...state]
      if (action.type === 'update') return state.map((o) => (o.id === action.outlook.id ? action.outlook : o))
      return state.filter((o) => o.id !== action.id)
    },
  )

  const [optimisticDaily, dispatchDaily] = useOptimistic(
    initialDaily,
    (state: DailyOutlook[], action: DailyOptAction) => {
      if (action.type === 'add')    return [action.outlook, ...state]
      if (action.type === 'update') return state.map((o) => (o.id === action.outlook.id ? action.outlook : o))
      return state.filter((o) => o.id !== action.id)
    },
  )

  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false)
  const [dailyModalOpen,  setDailyModalOpen]  = useState(false)
  const [editingWeekly,   setEditingWeekly]   = useState<WeeklyOutlook | null>(null)
  const [editingDaily,    setEditingDaily]    = useState<DailyOutlook | null>(null)

  function openWeeklyCreate() { setEditingWeekly(null); setWeeklyModalOpen(true) }
  function openWeeklyEdit(o: WeeklyOutlook) { setEditingWeekly(o); setWeeklyModalOpen(true) }
  function closeWeekly() { setWeeklyModalOpen(false) }

  function openDailyCreate() { setEditingDaily(null); setDailyModalOpen(true) }
  function openDailyEdit(o: DailyOutlook) { setEditingDaily(o); setDailyModalOpen(true) }
  function closeDaily() { setDailyModalOpen(false) }

  function handleSaveWeekly(formData: FormData) {
    const id = formData.get('id') as string | null
    const optimistic = buildOptimisticWeekly(formData, id)
    closeWeekly()
    startTransition(async () => {
      dispatchWeekly(id
        ? { type: 'update', outlook: optimistic }
        : { type: 'add',    outlook: optimistic },
      )
      await upsertWeeklyOutlook(formData)
    })
  }

  function handleDeleteWeekly(outlook: WeeklyOutlook) {
    closeWeekly()
    startTransition(async () => {
      dispatchWeekly({ type: 'delete', id: outlook.id })
      await deleteWeeklyOutlook(outlook.id)
    })
  }

  function handleSaveDaily(formData: FormData) {
    const id = formData.get('id') as string | null
    const optimistic = buildOptimisticDaily(formData, id)
    closeDaily()
    startTransition(async () => {
      dispatchDaily(id
        ? { type: 'update', outlook: optimistic }
        : { type: 'add',    outlook: optimistic },
      )
      await upsertDailyOutlook(formData)
    })
  }

  function handleDeleteDaily(outlook: DailyOutlook) {
    closeDaily()
    startTransition(async () => {
      dispatchDaily({ type: 'delete', id: outlook.id })
      await deleteDailyOutlook(outlook.id)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Outlooks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Weekly and daily market forecasting system</p>
      </div>

      <Tabs defaultValue="weekly">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="daily">Daily</TabsTrigger>
          </TabsList>
        </div>

        {/* Weekly tab */}
        <TabsContent value="weekly" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={openWeeklyCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Weekly Outlook
            </Button>
          </div>

          {optimisticWeekly.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
              <p className="text-sm font-medium text-muted-foreground">No weekly outlooks yet</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {optimisticWeekly.map((o) => (
                <motion.div key={o.id} variants={staggerItem}>
                  <WeeklyOutlookCard outlook={o} onClick={openWeeklyEdit} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* Daily tab */}
        <TabsContent value="daily" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={openDailyCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Daily Outlook
            </Button>
          </div>

          {optimisticDaily.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
              <p className="text-sm font-medium text-muted-foreground">No daily outlooks yet</p>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5"
            >
              {optimisticDaily.map((o) => (
                <motion.div key={o.id} variants={staggerItem}>
                  <DailyOutlookCard outlook={o} onClick={openDailyEdit} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      <OutlookModal
        key={editingWeekly?.id ?? 'new-weekly'}
        open={weeklyModalOpen}
        onClose={closeWeekly}
        type="weekly"
        outlook={editingWeekly}
        onSave={handleSaveWeekly}
        onDelete={handleDeleteWeekly}
      />
      <OutlookModal
        key={editingDaily?.id ?? 'new-daily'}
        open={dailyModalOpen}
        onClose={closeDaily}
        type="daily"
        outlook={editingDaily}
        onSave={handleSaveDaily}
        onDelete={handleDeleteDaily}
      />
    </div>
  )
}
