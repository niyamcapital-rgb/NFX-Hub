'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Trade, TradeType, TradeResult, AccountGroup } from '@/types/database'

export async function getTrades(): Promise<Trade[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('trades')
    .select(`
      *,
      trade_accounts(account_id, accounts(id, account_name, firm_name, grp)),
      trade_confluences(confluence_id, confluences(id, name, color)),
      trade_groups(grp),
      trade_legs(id, risk_factor, target_rr, created_at)
    `)
    .eq('user_id', user.id)
    .is('parent_trade_id', null)
    .order('open_date', { ascending: false })

  return (data ?? []) as unknown as Trade[]
}

export async function createTrade(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const accountIds    = formData.getAll('account_ids[]') as string[]
  const confluenceIds = formData.getAll('confluence_ids[]') as string[]
  const groups        = formData.getAll('groups[]') as string[]

  const { data: trade, error } = await supabase
    .from('trades')
    .insert({
      user_id:              user.id,
      open_date:            formData.get('open_date') as string,
      close_date:           (formData.get('close_date') as string) || null,
      symbol:               formData.get('symbol') as string,
      trade_type:           (formData.get('trade_type') as TradeType) || null,
      scale_in_enabled:     formData.get('scale_in_enabled') === 'true',
      risk_reward:          formData.get('risk_reward') ? parseFloat(formData.get('risk_reward') as string) : null,
      result:               ((formData.get('result') as TradeResult) || 'pending') as TradeResult,
      pnl:                  formData.get('pnl') ? parseFloat(formData.get('pnl') as string) : null,
      summary:              (formData.get('summary') as string) || null,
      dxy_chart_url:        (formData.get('dxy_chart_url') as string) || null,
      entry_chart_url:      (formData.get('entry_chart_url') as string) || null,
      new_daily_outlook_id:  (formData.get('daily_outlook_id') as string) || null,
      new_weekly_outlook_id: (formData.get('weekly_outlook_id') as string) || null,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  const junctions: PromiseLike<unknown>[] = []
  if (accountIds.length) {
    junctions.push(supabase.from('trade_accounts').insert(accountIds.map((id) => ({ trade_id: trade.id, account_id: id }))))
  }
  if (confluenceIds.length) {
    junctions.push(supabase.from('trade_confluences').insert(confluenceIds.map((id) => ({ trade_id: trade.id, confluence_id: id }))))
  }
  if (groups.length) {
    junctions.push(supabase.from('trade_groups').insert(groups.map((grp) => ({ trade_id: trade.id, grp: grp as AccountGroup }))))
  }
  await Promise.all(junctions)

  revalidatePath('/journal')
  revalidatePath('/')
  return { success: true, id: trade.id }
}

export async function updateTrade(tradeId: string, formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const accountIds    = formData.getAll('account_ids[]') as string[]
  const confluenceIds = formData.getAll('confluence_ids[]') as string[]
  const groups        = formData.getAll('groups[]') as string[]

  const { error } = await supabase
    .from('trades')
    .update({
      open_date:   formData.get('open_date') as string,
      close_date:  (formData.get('close_date') as string) || null,
      symbol:      formData.get('symbol') as string,
      trade_type:       (formData.get('trade_type') as TradeType) || null,
      scale_in_enabled: formData.get('scale_in_enabled') === 'true',
      risk_reward:      formData.get('risk_reward') ? parseFloat(formData.get('risk_reward') as string) : null,
      result:      ((formData.get('result') as TradeResult) || 'pending') as TradeResult,
      pnl:         formData.get('pnl') ? parseFloat(formData.get('pnl') as string) : null,
      summary:         (formData.get('summary') as string) || null,
      dxy_chart_url:   (formData.get('dxy_chart_url') as string) || null,
      entry_chart_url: (formData.get('entry_chart_url') as string) || null,
      new_daily_outlook_id:  (formData.get('daily_outlook_id') as string) || null,
      new_weekly_outlook_id: (formData.get('weekly_outlook_id') as string) || null,
    })
    .eq('id', tradeId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  await Promise.all([
    supabase.from('trade_accounts').delete().eq('trade_id', tradeId),
    supabase.from('trade_confluences').delete().eq('trade_id', tradeId),
    supabase.from('trade_groups').delete().eq('trade_id', tradeId),
  ])
  const junctions: PromiseLike<unknown>[] = []
  if (accountIds.length)    junctions.push(supabase.from('trade_accounts').insert(accountIds.map((id) => ({ trade_id: tradeId, account_id: id }))))
  if (confluenceIds.length) junctions.push(supabase.from('trade_confluences').insert(confluenceIds.map((id) => ({ trade_id: tradeId, confluence_id: id }))))
  if (groups.length)        junctions.push(supabase.from('trade_groups').insert(groups.map((grp) => ({ trade_id: tradeId, grp: grp as AccountGroup }))))
  await Promise.all(junctions)

  revalidatePath('/journal')
  revalidatePath('/')
  return { success: true }
}

export async function deleteTrade(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('trades').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/journal')
  revalidatePath('/')
  return { success: true }
}
