'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getConfluences() {
  const supabase = await createClient()
  if (!supabase) return []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('confluences')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  return data ?? []
}

export async function upsertConfluence(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const id = formData.get('id') as string | null

  const fields = {
    name:     formData.get('name') as string,
    color:    (formData.get('color') as string) || '#3b82f6',
    category: (formData.get('category') as string) || null,
  }

  if (id) {
    const { error } = await supabase.from('confluences').update(fields).eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
    revalidatePath('/journal')
    revalidatePath('/settings')
    return { success: true, id }
  } else {
    const { data, error } = await supabase
      .from('confluences')
      .insert({ ...fields, user_id: user.id })
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/journal')
    revalidatePath('/settings')
    return { success: true, id: data.id }
  }
}

export async function deleteConfluence(id: string) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('confluences').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/journal')
  return { success: true }
}
