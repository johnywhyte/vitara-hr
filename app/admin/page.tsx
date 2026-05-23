import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'
import { Users, CheckCircle, XCircle, Clock, FileText, ChevronRight } from 'lucide-react'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from('applications')
    .select('status, created_at, updated_at')

  const all = data ?? []
  return {
    total: all.length,
    submitted: all.filter((a) => a.status === 'submitted').length,
    under_review: all.filter((a) => a.status === 'under_review').length,
    approved: all.filter((a) => a.status === 'approved').length,
    rejected: all.filter((a) => a.status === 'rejected').length,
    draft: all.filter((a) => a.status === 'draft').length,
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const { data: recentApps } = await supabase
    .from('applications')
    .select(`
      id, status, submitted_at, created_at,
      profiles (email),
      applicant_details (first_name, last_name)
    `)
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })
    .limit(5)

  const statCards = [
    { label: 'Total Applications', value: stats.total, icon: Users, color: 'text-[#2D6A4F]', bg: 'bg-[#D8F3DC]' },
    { label: 'Pending Review', value: stats.submitted + stats.under_review, icon: Clock, color: 'text-[#856404]', bg: 'bg-[#FFF3CD]' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-[#2D6A4F]', bg: 'bg-[#D8F3DC]' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-[#C0392B]', bg: 'bg-[#FFE5E5]' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#343A40]">Dashboard</h1>
        <p className="text-sm text-[#6C757D]">Recruitment pipeline overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white border border-[#DEE2E6] rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#6C757D] font-medium">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
                <div className={`w-9 h-9 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pipeline bar */}
      <div className="bg-white border border-[#DEE2E6] rounded-lg p-4 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#343A40] mb-3">Pipeline Status</h2>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: 'Draft', count: stats.draft, color: 'bg-[#E9ECEF] text-[#6C757D]' },
            { label: 'Submitted', count: stats.submitted, color: 'bg-[#E8F4FD] text-[#2980B9]' },
            { label: 'In Review', count: stats.under_review, color: 'bg-[#FFF3CD] text-[#856404]' },
            { label: 'Approved', count: stats.approved, color: 'bg-[#D8F3DC] text-[#2D6A4F]' },
            { label: 'Rejected', count: stats.rejected, color: 'bg-[#FFE5E5] text-[#C0392B]' },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg py-2 ${s.color}`}>
              <p className="text-lg font-bold">{s.count}</p>
              <p className="text-[10px] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent applications */}
      <div className="bg-white border border-[#DEE2E6] rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E9ECEF]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6C757D]" />
            <h2 className="text-sm font-bold text-[#343A40]">Recent Submissions</h2>
          </div>
          <Link
            href="/admin/applications"
            className="text-xs font-semibold text-[#2D6A4F] hover:underline flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!recentApps?.length ? (
          <div className="text-center py-8 text-sm text-[#ADB5BD]">
            No applications yet
          </div>
        ) : (
          <div className="divide-y divide-[#F8F9FA]">
            {recentApps.map((app) => {
              type RecentApp = {
                id: string
                status: ApplicationStatus
                submitted_at: string | null
                profiles: { email: string } | { email: string }[] | null
                applicant_details: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
              }
              const a = app as unknown as RecentApp
              const prof = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
              const ad = Array.isArray(a.applicant_details) ? a.applicant_details[0] : a.applicant_details
              const name = [ad?.first_name, ad?.last_name].filter(Boolean).join(' ') || prof?.email || 'Unknown'

              return (
                <Link
                  key={a.id}
                  href={`/admin/applications/${a.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F9FA] transition-colors group"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#343A40] group-hover:text-[#2D6A4F]">{name}</p>
                    <p className="text-[11px] text-[#6C757D]">
                      {prof?.email} · Submitted {formatDate(a.submitted_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <ChevronRight className="w-4 h-4 text-[#ADB5BD]" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
