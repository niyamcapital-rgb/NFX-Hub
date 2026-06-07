'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { AccountGroup, AccountPhase, AccountStatus } from '@/types/database'

export async function getAccounts() {
  const supabase = await createClient()
  if (!supabase) return []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function upsertAccount(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string | null

  const fields = {
    firm_name: formData.get('firm_name') as string,
    account_name: formData.get('account_name') as string,
    starting_balance: parseFloat(formData.get('starting_balance') as string),
    current_balance: formData.get('current_balance') ? parseFloat(formData.get('current_balance') as string) : null,
    profit_target_pct: parseFloat(formData.get('profit_target_pct') as string),
    max_drawdown_pct: parseFloat(formData.get('max_drawdown_pct') as string),
    daily_loss_limit_pct: formData.get('daily_loss_limit_pct') ? parseFloat(formData.get('daily_loss_limit_pct') as string) : null,
    status: (formData.get('status') as AccountStatus) ?? 'active',
    phase: (formData.get('phase') as AccountPhase) || null,
    grp: (formData.get('grp') as AccountGroup) || null,
    start_date: (formData.get('start_date') as string) || null,
  }

  let dbError: string | null = null
  if (id) {
    const { error } = await supabase.from('accounts').update(fields).eq('id', id).eq('user_id', user.id)
    dbError = error?.message ?? null
  } else {
    const { error } = await supabase.from('accounts').insert({ ...fields, user_id: user.id })
    dbError = error?.message ?? null
  }

  if (dbError) return { error: dbError }
  revalidatePath('/accounts')
  return { success: true }
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/accounts')
  return { success: true }
}
