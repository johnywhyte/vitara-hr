import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail } from '@/lib/email'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { action, rejection_reason, rejection_section } = body

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  if (action === 'reject' && !rejection_reason) {
    return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }

  if (action === 'reject') {
    updateData.rejection_reason = rejection_reason
    updateData.rejection_section = rejection_section ?? 'personal'
  } else {
    updateData.rejection_reason = null
    updateData.rejection_section = null
  }

  const { data: application, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .select(`
      id,
      status,
      rejection_reason,
      profiles (email),
      applicant_details (first_name, last_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger email notification
  try {
    type AppResult = {
      profiles: { email: string } | { email: string }[] | null
      applicant_details: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
      rejection_reason: string | null
    }
    const app = application as unknown as AppResult
    const profilesData = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
    const applicantData = Array.isArray(app.applicant_details) ? app.applicant_details[0] : app.applicant_details
    const email = profilesData?.email
    const name = [applicantData?.first_name, applicantData?.last_name]
      .filter(Boolean)
      .join(' ') || 'Applicant'

    if (email) {
      if (action === 'approve') {
        await sendApplicationApprovedEmail(email, name)
      } else {
        await sendApplicationRejectedEmail(email, name, app.rejection_reason ?? '')
      }
    }
  } catch (emailErr) {
    console.error('Email send failed:', emailErr)
  }

  return NextResponse.json({ success: true, application })
}
