import { createClient } from '@/lib/supabase/server'
import { sendApplicationSubmittedEmail } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { applicationId } = await req.json()
  if (!applicationId) return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('applications')
    .select('id, profiles(email), applicant_details(first_name, last_name)')
    .eq('id', applicationId)
    .eq('user_id', user.id)
    .single()

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  type NotifyData = {
    profiles: { email: string } | { email: string }[] | null
    applicant_details: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  }
  const app = data as unknown as NotifyData
  const profileData = Array.isArray(app.profiles) ? app.profiles[0] : app.profiles
  const applicantData = Array.isArray(app.applicant_details) ? app.applicant_details[0] : app.applicant_details

  const email = profileData?.email
  const name = [applicantData?.first_name, applicantData?.last_name]
    .filter(Boolean)
    .join(' ') || 'Applicant'

  if (email) {
    await sendApplicationSubmittedEmail(email, name)
  }

  return NextResponse.json({ success: true })
}
