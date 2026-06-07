import { createClient } from './supabase/client'

export type StorageBucket = 'trade-charts' | 'outlook-charts'

/**
 * Uploads a file to a public Supabase Storage bucket and returns the public URL.
 * Returns null when Supabase credentials are not configured.
 * Throws a descriptive error on upload failure so the caller can surface it to the user.
 */
export async function uploadFile(
  file: File,
  bucket: StorageBucket,
  prefix: string,
): Promise<string | null> {
  const supabase = createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to upload images.')

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${user.id}/${prefix}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    // Bucket not found is the most common setup mistake — give a clear message
    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
      throw new Error(
        `Storage bucket "${bucket}" does not exist. Run supabase/migrations/003_storage_setup.sql in your Supabase SQL editor.`
      )
    }
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // getPublicUrl works on public buckets (public = true).
  // If you see broken image URLs, make sure the bucket is set to public in 003_storage_setup.sql.
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteFile(bucket: StorageBucket, url: string): Promise<void> {
  const supabase = createClient()
  if (!supabase) return

  const urlObj = new URL(url)
  const path = urlObj.pathname.split(`/storage/v1/object/public/${bucket}/`)[1]
  if (!path) return

  await supabase.storage.from(bucket).remove([path])
}
