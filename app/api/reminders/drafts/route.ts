import { createAdminClient } from '@/lib/supabase/server'
import { sendDraftReminderEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

// How stale (in days) a draft must be before we send a reminder.
const REMINDER_AFTER_DAYS = Number(process.env.DRAFT_REMINDER_DAYS ?? 3)

type DraftRow = {
  id: string
  profiles: { email: string } | { email: string }[] | null
  applicant_details:
    | { first_name: string | null; last_name: string | null }
    | { first_name: string | null; last_name: string | null }[]
    | null
}

/**
 * Sends a one-time reminder email to applicants who started an application
 * (status = 'draft') but haven't submitted it after REMINDER_AFTER_DAYS.
 *
 * Secured with a shared secret — call it from a scheduler (Vercel Cron,
 * Supabase scheduled function, GitHub Action, etc.) with:
 *   Authorization: Bearer <CRON_SECRET>
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - REMINDER_AFTER_DAYS)

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      profiles!applications_user_id_fkey (email),
      applicant_details (first_name, last_name)
    `)
    .eq('status', 'draft')
    .is('draft_reminder_sent_at', null)
    .lt('created_at', cutoff.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as unknown as DraftRow[]
  let sent = 0
  const failures: string[] = []

  for (const row of rows) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const applicant = Array.isArray(row.applicant_details)
      ? row.applicant_details[0]
      : row.applicant_details
    const email = profile?.email
    if (!email) continue

    const name =
      [applicant?.first_name, applicant?.last_name].filter(Boolean).join(' ') || 'Applicant'

    try {
      await sendDraftReminderEmail(email, name)
      // Mark as reminded so we never email the same draft twice.
      await supabase
        .from('applications')
        .update({ draft_reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } catch (err) {
      console.error(`Draft reminder failed for ${row.id}:`, err)
      failures.push(row.id)
    }
  }

  return NextResponse.json({ ok: true, candidates: rows.length, sent, failures })
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
