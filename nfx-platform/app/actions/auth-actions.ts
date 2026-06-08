'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signInWithEmail(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) redirect('/')

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signUpWithEmail(formData: FormData) {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase not configured' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: error.message }
  return { success: 'Check your email to confirm your account.' }
}


export async function signOut() {
  const supabase = await createClient()
  if (!supabase) redirect('/login')
  await supabase.auth.signOut()
  redirect('/login')
}
