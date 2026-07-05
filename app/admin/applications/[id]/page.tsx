import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { GHANA_REGIONS } from '@/lib/ghana-regions'
import { StatusBadge } from '@/components/ui/badge'
import { AdminActionPanel } from '@/components/admin/AdminActionPanel'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'
import {
  ChevronLeft, User, Shield, FileText,
  Phone, Mail, MapPin, Calendar, CreditCard,
  ExternalLink
} from 'lucide-react'

function DetailRow({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[#F8F9FA] last:border-0 gap-4">
      <span className="text-xs text-[#6C757D] shrink-0">{label}</span>
      <span className={`text-xs font-medium text-[#343A40] text-right ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function FileLink({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-[#F8F9FA] last:border-0">
        <span className="text-xs text-[#6C757D]">{label}</span>
        <span className="text-xs text-[#ADB5BD]">Not uploaded</span>
      </div>
    )
  }
  // Extract the storage path from the full URL so we can generate a signed URL
  // URL format: .../storage/v1/object/public/application-files/<path>
  //          or .../storage/v1/object/sign/application-files/<path>
  const storagePath = url.includes('/application-files/')
    ? url.split('/application-files/')[1]?.split('?')[0]
    : null

  const href = storagePath
    ? `/api/file-url?path=${encodeURIComponent(storagePath)}`
    : url

  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F8F9FA] last:border-0">
      <span className="text-xs text-[#6C757D]">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-semibold text-[#71001D] hover:underline flex items-center gap-1"
      >
        View file <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: app } = await supabase
    .from('applications')
    .select(`
      *,
      profiles!applications_user_id_fkey (email),
      applicant_details (*),
      guarantor_details (*)
    `)
    .eq('id', id)
    .single()

  if (!app) notFound()

  const a = app as {
    id: string
    status: ApplicationStatus
    rejection_reason: string | null
    rejection_section: string | null
    submitted_at: string | null
    reviewed_at: string | null
    created_at: string
    profiles: { email: string } | null
    applicant_details: {
      first_name: string | null
      last_name: string | null
      middle_name: string | null
      date_of_birth: string | null
      phone_number: string | null
      ghana_id_number: string | null
      ghana_id_verified: boolean
      region_id: string | null
      drivers_license_number: string | null
      has_motorbike: 'yes' | 'no' | null
      compensation_expectation: string | null
      possible_start_date: string | null
      cv_url: string | null
      cover_letter_url: string | null
      ghana_id_card_url: string | null
      drivers_license_url: string | null
    } | null
    guarantor_details: {
      first_name: string | null
      last_name: string | null
      middle_name: string | null
      email: string | null
      phone_number: string | null
      place_of_work: string | null
      national_id_url: string | null
      signed_form_url: string | null
    } | null
  }

  const ad = a.applicant_details
  const gd = a.guarantor_details

  const fullName = [ad?.first_name, ad?.middle_name, ad?.last_name].filter(Boolean).join(' ') || a.profiles?.email || 'Unknown Applicant'
  const regionName = ad?.region_id ? GHANA_REGIONS.find((r) => r.id === ad.region_id)?.name ?? ad.region_id : null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C757D] hover:text-[#71001D] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All Applications
      </Link>

      {/* Header */}
      <div className="bg-white border border-[#DEE2E6] rounded-lg shadow-sm mb-4">
        <div className="bg-[#71001D] text-white px-4 py-4 rounded-t-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white/60 mb-0.5">Applicant</p>
              <h1 className="text-lg font-bold">{fullName}</h1>
              <p className="text-sm text-white/75">{a.profiles?.email}</p>
            </div>
            <StatusBadge status={a.status} className="shrink-0 mt-1" />
          </div>
        </div>

        <div className="px-4 py-3 grid grid-cols-3 gap-4 text-center border-b border-[#E9ECEF]">
          <div>
            <p className="text-[10px] text-[#6C757D] font-semibold uppercase tracking-wide">Submitted</p>
            <p className="text-xs font-semibold text-[#343A40] mt-0.5">{formatDate(a.submitted_at)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#6C757D] font-semibold uppercase tracking-wide">Reviewed</p>
            <p className="text-xs font-semibold text-[#343A40] mt-0.5">{formatDate(a.reviewed_at)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#6C757D] font-semibold uppercase tracking-wide">Application ID</p>
            <p className="text-[10px] font-mono text-[#6C757D] mt-0.5 truncate">{a.id.slice(0, 8)}…</p>
          </div>
        </div>

        {/* Rejection notice on detail */}
        {a.rejection_reason && a.status === 'rejected' && (
          <div className="px-4 py-3 bg-[#FFE5E5] border-b border-[#f5c6c6]">
            <p className="text-xs font-bold text-[#C0392B]">
              Rejected ({a.rejection_section === 'guarantor' ? 'Guarantor Section' : 'Personal Section'})
            </p>
            <p className="text-xs text-[#C0392B] mt-0.5">{a.rejection_reason}</p>
          </div>
        )}

        {/* Admin action panel */}
        <div className="p-4">
          <AdminActionPanel applicationId={a.id} currentStatus={a.status} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Personal Details */}
        <div className="bg-white border border-[#DEE2E6] rounded-lg shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E9ECEF] bg-[#F8F9FA] rounded-t-lg">
            <User className="w-4 h-4 text-[#6C757D]" />
            <h2 className="text-xs font-bold text-[#343A40]">Personal Details</h2>
          </div>
          <div className="px-4 py-2">
            <DetailRow label="Full Name" value={[ad?.first_name, ad?.middle_name, ad?.last_name].filter(Boolean).join(' ')} />
            <DetailRow label="Date of Birth" value={ad?.date_of_birth ? formatDate(ad.date_of_birth) : null} />
            <DetailRow label="Phone" value={ad?.phone_number} />
            <DetailRow label="Ghana Card No." value={ad?.ghana_id_number} mono />
            <DetailRow
              label="ID Verified"
              value={ad?.ghana_id_verified ? '✓ Verified' : '✗ Not verified'}
            />
            <DetailRow label="Region" value={regionName} />
            <DetailRow label="Driver's License No." value={ad?.drivers_license_number} mono />
            <DetailRow
              label="Has Motorbike"
              value={ad?.has_motorbike ? (ad.has_motorbike === 'yes' ? 'Yes' : 'No') : null}
            />
            <DetailRow
              label="Compensation (GHS)"
              value={ad?.compensation_expectation}
            />
            <DetailRow
              label="Possible Start Date"
              value={ad?.possible_start_date ? formatDate(ad.possible_start_date) : null}
            />
          </div>

          <div className="border-t border-[#E9ECEF] mt-1">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA]">
              <FileText className="w-3.5 h-3.5 text-[#6C757D]" />
              <h3 className="text-xs font-bold text-[#343A40]">Documents</h3>
            </div>
            <div className="px-4 py-1">
              <FileLink label="CV / Resume" url={ad?.cv_url} />
              <FileLink label="Cover Letter" url={ad?.cover_letter_url} />
              <FileLink label="Ghana ID Card" url={ad?.ghana_id_card_url} />
              <FileLink label="Driver's License" url={ad?.drivers_license_url} />
            </div>
          </div>
        </div>

        {/* Guarantor Details */}
        <div className="bg-white border border-[#DEE2E6] rounded-lg shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E9ECEF] bg-[#F8F9FA] rounded-t-lg">
            <Shield className="w-4 h-4 text-[#6C757D]" />
            <h2 className="text-xs font-bold text-[#343A40]">Guarantor Details</h2>
          </div>
          <div className="px-4 py-2">
            <DetailRow
              label="Full Name"
              value={[gd?.first_name, gd?.middle_name, gd?.last_name].filter(Boolean).join(' ')}
            />
            <DetailRow label="Email" value={gd?.email} />
            <DetailRow label="Phone" value={gd?.phone_number} />
            <DetailRow label="Place of Work" value={gd?.place_of_work} />
          </div>

          <div className="border-t border-[#E9ECEF] mt-1">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F8F9FA]">
              <FileText className="w-3.5 h-3.5 text-[#6C757D]" />
              <h3 className="text-xs font-bold text-[#343A40]">Documents</h3>
            </div>
            <div className="px-4 py-1">
              <FileLink label="National ID" url={gd?.national_id_url} />
              <FileLink label="Signed Guarantor Form" url={gd?.signed_form_url} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
