import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ApplyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Top nav */}
      <header className="bg-[#2D6A4F] text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <Link href="/apply" className="flex items-center gap-2">
          <div>
            <p className="text-[9px] text-white/60 uppercase tracking-widest leading-none">Vitara</p>
            <p className="text-sm font-bold leading-tight">Recruitment Portal</p>
          </div>
        </Link>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="text-[11px] text-white/80 hover:text-white border border-white/30 rounded px-2.5 py-1 hover:bg-white/10 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </header>

      <main className="px-4 py-5 max-w-lg mx-auto">
        {children}
      </main>

      <footer className="text-center py-4 text-[10px] text-[#ADB5BD]">
        © 2026 Vitara Agricultural E-Commerce · Ghana
      </footer>
    </div>
  )
}
