import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url || url === 'your-project-url-here') return null
  return createBrowserClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
