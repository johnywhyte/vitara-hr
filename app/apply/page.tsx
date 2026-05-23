import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ApplyIndexPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find or create application
  let { data: application } = await supabase
    .from('applications')
    .select('id, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!application) {
    const { data: newApp } = await supabase
      .from('applications')
      .insert({ user_id: user.id })
      .select('id, status')
      .single()
    application = newApp
  }

  redirect('/apply/step1')
}
