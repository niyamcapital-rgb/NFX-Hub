'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getLegsForTrade(tradeId: string) {
  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from('trade_legs')
    .select('*')
    .eq('trade_id', tradeId)
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function addTradeLeg(tradeId: string, riskFactor: number, targetRR: number) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data, error } = await supabase
    .from('trade_legs')
    .insert({ trade_id: tradeId, risk_factor: riskFactor, target_rr: targetRR })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/journal')
  return { success: true, leg: data }
}

export async function deleteTradeLeg(legId: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { error } = await supabase
    .from('trade_legs')
    .delete()
    .eq('id', legId)

  if (error) return { error: error.message }
  revalidatePath('/journal')
  return { success: true }
}
