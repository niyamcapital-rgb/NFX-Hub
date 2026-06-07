'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Weekly ────────────────────────────────────────────────────
export async function getWeeklyOutlooks(limit = 6) {
  const supabase = await createClient()
  if (!supabase) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('weekly_outlooks')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function upsertWeeklyOutlook(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string | null

  const newsImageUrl = formData.get('news_image_url') as string | null

  const fields = {
    week_start:   formData.get('week_start') as string,
    trading_plan: (formData.get('trading_plan') as string) || null,
    notes:        (formData.get('notes') as string) || null,
    chart_url:    (formData.get('chart_url') as string) || null,
    news_urls:    newsImageUrl ? [newsImageUrl] : null,
  }

  let dbError: string | null = null
  if (id) {
    const { error } = await supabase.from('weekly_outlooks').update(fields).eq('id', id).eq('user_id', user.id)
    dbError = error?.message ?? null
  } else {
    const { error } = await supabase.from('weekly_outlooks').insert({ ...fields, user_id: user.id })
    dbError = error?.message ?? null
  }

  if (dbError) return { error: dbError }
  revalidatePath('/outlooks')
  return { success: true }
}

export async function deleteWeeklyOutlook(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('weekly_outlooks').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/outlooks')
  return { success: true }
}

// ── Daily ─────────────────────────────────────────────────────
export async function getDailyOutlooks(limit = 30) {
  const supabase = await createClient()
  if (!supabase) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('daily_outlooks')
    .select('*')
    .eq('user_id', user.id)
    .order('outlook_date', { ascending: false })
    .limit(limit)

  return data ?? []
}

export async function upsertDailyOutlook(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string | null

  const fields = {
    outlook_date: formData.get('outlook_date') as string,
    trading_plan: (formData.get('trading_plan') as string) || null,
    chart_url:    (formData.get('chart_url') as string) || null,
  }

  let dbError: string | null = null
  if (id) {
    const { error } = await supabase.from('daily_outlooks').update(fields).eq('id', id).eq('user_id', user.id)
    dbError = error?.message ?? null
  } else {
    const { error } = await supabase.from('daily_outlooks').insert({ ...fields, user_id: user.id })
    dbError = error?.message ?? null
  }

  if (dbError) return { error: dbError }
  revalidatePath('/outlooks')
  return { success: true }
}

export async function deleteDailyOutlook(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('daily_outlooks').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/outlooks')
  return { success: true }
}
