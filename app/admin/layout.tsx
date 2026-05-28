import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/apply')

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#FCF5EB]">
      {/* Sidebar */}
      <aside className="w-52 bg-[#71001D] text-white flex flex-col shrink-0 hidden md:flex">
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-[9px] text-white/60 uppercase tracking-widest mb-0.5">Vitara</p>
          <p className="text-sm font-bold">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/applications"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Users className="w-4 h-4" />
            Applications
          </Link>
        </nav>

        <div className="p-3 border-t border-white/10">
          <p className="text-[10px] text-white/50 px-3 mb-1 truncate">{user.email}</p>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md w-full transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-[#71001D] text-white px-4 py-2.5 flex items-center justify-between shadow-sm">
        <p className="text-sm font-bold">Vitara Admin</p>
        <div className="flex gap-3">
          <Link href="/admin" className="text-xs text-white/80 hover:text-white">Dashboard</Link>
          <Link href="/admin/applications" className="text-xs text-white/80 hover:text-white">Applications</Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:mt-0 mt-12">
        <main className="flex-1 p-5">
          {children}
        </main>
      </div>
    </div>
  )
}
