import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Generates a short-lived signed URL for a private storage file.
// Only accessible to the file owner or an admin.
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase.storage
    .from('application-files')
    .createSignedUrl(path, 60 * 60) // 1 hour

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not generate URL' }, { status: 500 })
  }

  // Redirect directly to the signed URL so file links work transparently
  return NextResponse.redirect(data.signedUrl)
}
