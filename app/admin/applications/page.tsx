import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'
import { ChevronRight, Search } from 'lucide-react'

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In Review', value: 'under_review' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
]

export default async function ApplicationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const { status = 'all', q = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('applications')
    .select(`
      id, status, submitted_at, created_at, updated_at,
      profiles!applications_user_id_fkey (email),
      applicant_details (first_name, last_name, phone_number, region_id)
    `)
    .neq('status', 'draft')
    .order('submitted_at', { ascending: false })

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: applications } = await query

  type AppRow = {
    id: string
    status: ApplicationStatus
    submitted_at: string | null
    profiles: { email: string } | { email: string }[] | null
    applicant_details: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null
  }

  function getProfile(row: AppRow) {
    if (!row.profiles) return null
    return Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles
  }
  function getApplicant(row: AppRow) {
    if (!row.applicant_details) return null
    return Array.isArray(row.applicant_details) ? row.applicant_details[0] ?? null : row.applicant_details
  }

  // Client-side name filter (simpler than full-text search)
  const filtered = ((applications ?? []) as unknown as AppRow[]).filter((app) => {
    if (!q) return true
    const search = q.toLowerCase()
    const ad = getApplicant(app)
    const name = [ad?.first_name, ad?.last_name].filter(Boolean).join(' ').toLowerCase()
    const email = getProfile(app)?.email?.toLowerCase() ?? ''
    return name.includes(search) || email.includes(search)
  })

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#343A40]">Applications</h1>
        <p className="text-sm text-[#6C757D]">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DEE2E6] rounded-lg p-3 mb-4 shadow-sm flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form className="flex-1 flex gap-2" method="GET">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#ADB5BD] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or email…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#DEE2E6] rounded-md focus:outline-none focus:ring-2 focus:ring-[#71001D] focus:border-[#71001D]"
            />
          </div>
          {status !== 'all' && <input type="hidden" name="status" value={status} />}
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#71001D] text-white text-xs font-semibold rounded-md hover:bg-[#5A0017] transition-colors"
          >
            Search
          </button>
        </form>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={`/admin/applications?status=${f.value}${q ? `&q=${q}` : ''}`}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                status === f.value
                  ? 'bg-[#71001D] text-white'
                  : 'bg-[#F8F9FA] text-[#6C757D] hover:bg-[#E9ECEF]'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#DEE2E6] rounded-lg shadow-sm overflow-hidden">
        {!filtered.length ? (
          <div className="text-center py-12 text-sm text-[#ADB5BD]">
            No applications found
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E9ECEF]">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6C757D]">Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6C757D]">Email</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6C757D]">Submitted</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#6C757D]">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8F9FA]">
                  {filtered.map((app) => {
                    const ad = getApplicant(app)
                    const prof = getProfile(app)
                    const name = [ad?.first_name, ad?.last_name].filter(Boolean).join(' ') || '—'
                    return (
                      <tr key={app.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#343A40]">{name}</td>
                        <td className="px-4 py-3 text-[#6C757D] text-xs">{prof?.email ?? '—'}</td>
                        <td className="px-4 py-3 text-[#6C757D] text-xs">{formatDate(app.submitted_at)}</td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#71001D] hover:underline"
                          >
                            Review <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-[#F8F9FA]">
              {filtered.map((app) => {
                const ad = getApplicant(app)
                const prof = getProfile(app)
                const name = [ad?.first_name, ad?.last_name].filter(Boolean).join(' ') || '—'
                return (
                  <Link
                    key={app.id}
                    href={`/admin/applications/${app.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[#F8F9FA] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#343A40]">{name}</p>
                      <p className="text-[11px] text-[#6C757D]">{prof?.email}</p>
                      <p className="text-[11px] text-[#ADB5BD]">{formatDate(app.submitted_at)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={app.status} />
                      <ChevronRight className="w-4 h-4 text-[#ADB5BD]" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
