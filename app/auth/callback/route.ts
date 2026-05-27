import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/apply'

  const supabase = await createClient()

  // ── Path 1: email verification / magic-link (token_hash + type) ──────────
  // Supabase sends this when a user clicks a confirmation or magic-link email.
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'signup' | 'recovery' | 'invite' | null

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=verification_failed`)
  }

  // ── Path 2: OAuth / PKCE code exchange (Google sign-in etc.) ────────────
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // No recognised parameters — send back to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
