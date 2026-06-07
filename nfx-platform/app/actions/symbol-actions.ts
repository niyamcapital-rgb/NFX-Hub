'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getSymbols() {
  const supabase = await createClient()
  if (!supabase) return []

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('symbols')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  return data ?? []
}

export async function createSymbol(name: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('symbols')
    .insert({ user_id: user.id, name: name.trim().toUpperCase() })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/journal')
  return { success: true, id: data.id as string }
}

export async function deleteSymbol(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('symbols')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/journal')
  return { success: true }
}
