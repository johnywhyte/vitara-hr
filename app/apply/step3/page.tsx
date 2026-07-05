'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { GHANA_REGIONS } from '@/lib/ghana-regions'
import { ApplicationStepper } from '@/components/ApplicationStepper'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Application, ApplicantDetails, GuarantorDetails } from '@/types'
import {
  CheckCircle, XCircle, Clock, User, Shield, FileText,
  ChevronRight, Send
} from 'lucide-react'

type AppData = Application & {
  applicant_details: ApplicantDetails | null
  guarantor_details: GuarantorDetails | null
}

function CheckItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#F8F9FA] last:border-0">
      <span className="text-xs text-[#343A40]">{label}</span>
      {value ? (
        <CheckCircle className="w-4 h-4 text-[#FFB000]" />
      ) : (
        <XCircle className="w-4 h-4 text-[#C0392B]" />
      )}
    </div>
  )
}

export default function Step3Page() {
  const [appData, setAppData] = useState<AppData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        applicant_details (*),
        guarantor_details (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setAppData(data as AppData)
      if (data.status === 'submitted' || data.status === 'under_review') setSubmitted(true)
    }
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  // Validation checks
  const ad = appData?.applicant_details
  const gd = appData?.guarantor_details
  const status = appData?.status

  // Detect whether the new-application-fields migration has run. Supabase's
  // `select *` omits columns that don't exist, so a missing key means the
  // column isn't there yet — in that case we don't gate submission on the new
  // fields (they activate automatically once the migration is applied).
  const applicantColsReady = !!ad && 'has_motorbike' in ad
  const guarantorColsReady = !!gd && 'place_of_work' in gd

  const checks = {
    personal: {
      firstName: !!ad?.first_name,
      lastName: !!ad?.last_name,
      dob: !!ad?.date_of_birth,
      phone: !!ad?.phone_number,
      ghanaId: !!ad?.ghana_id_number,
      region: !!ad?.region_id,
      driversLicense: !applicantColsReady || !!ad?.drivers_license_number,
      motorbike: !applicantColsReady || ad?.has_motorbike === 'yes' || ad?.has_motorbike === 'no',
      compensation: !applicantColsReady || !!ad?.compensation_expectation,
      startDate: !applicantColsReady || !!ad?.possible_start_date,
      cv: !!ad?.cv_url,
      coverLetter: !!ad?.cover_letter_url,
      idCard: !!ad?.ghana_id_card_url,
      driversLicenseFile: !applicantColsReady || !!ad?.drivers_license_url,
    },
    guarantor: {
      firstName: !!gd?.first_name,
      lastName: !!gd?.last_name,
      email: !!gd?.email,
      phone: !!gd?.phone_number,
      placeOfWork: !guarantorColsReady || !!gd?.place_of_work,
      nationalId: !!gd?.national_id_url,
      signedForm: !!gd?.signed_form_url,
    },
  }

  const personalComplete = Object.values(checks.personal).every(Boolean)
  const guarantorComplete = Object.values(checks.guarantor).every(Boolean)
  const allComplete = personalComplete && guarantorComplete

  const regionName = ad?.region_id
    ? GHANA_REGIONS.find((r) => r.id === ad.region_id)?.name ?? ad.region_id
    : '—'

  const handleSubmit = async () => {
    if (!appData || !allComplete) return
    setSubmitting(true)
    setSubmitError('')

    const { error } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
        rejection_section: null,
      })
      .eq('id', appData.id)

    if (error) {
      setSubmitError(error.message)
      setSubmitting(false)
      return
    }

    // Trigger submission email via API
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await fetch('/api/notify-submitted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appData.id, userId: user?.id }),
      })
    } catch { /* non-blocking */ }

    setSubmitted(true)
    setSubmitting(false)
    setAppData((prev) => prev ? { ...prev, status: 'submitted' } : prev)
  }

  if (!appData) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-[#71001D] border-t-transparent rounded-full" />
      </div>
    )
  }

  // Approved state
  if (status === 'approved') {
    return (
      <div className="text-center py-8">
        <ApplicationStepper currentStep={3} completedSteps={[1, 2]} />
        <div className="bg-[#71001D] rounded-xl p-6 text-white shadow-md">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-lg font-bold mb-1">Application Approved!</h2>
          <p className="text-sm text-white/80">
            Congratulations! Your application has been approved. You will receive an email
            shortly with details regarding your interview or onboarding process.
          </p>
        </div>
      </div>
    )
  }

  // Submitted state — mirrors the HR confirmation email sent to the applicant
  if (submitted && status !== 'rejected') {
    return (
      <div>
        <ApplicationStepper currentStep={3} completedSteps={[1, 2]} />
        <div className="bg-white border border-[#DEE2E6] rounded-lg p-6 shadow-sm">
          <div className="text-center">
            <div className="w-14 h-14 bg-[#FFF3CD] rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-[#71001D]" />
            </div>
            <h2 className="text-base font-bold text-[#343A40] mb-1">Application Received!</h2>
            <StatusBadge status="submitted" />
          </div>

          {/* HR confirmation message */}
          <div className="mt-4 space-y-3 text-left">
            <p className="text-xs text-[#343A40]">
              Thank you for submitting your application to <strong>Vitara Agricultural
              E-Commerce</strong>. We have successfully received your application and it is now
              under review by our HR team.
            </p>
            <div className="p-3 bg-[#FFF3CD] border-l-4 border-[#FFB000] rounded-md">
              <p className="text-xs font-bold text-[#71001D]">What happens next?</p>
              <p className="text-[11px] text-[#71001D]/90 mt-0.5">
                Our HR team will review your application within 3–5 business days. You will
                receive an email notification once a decision has been made.
              </p>
            </div>
            {/* 30-day account deletion notice */}
            <div className="p-3 bg-[#E8F4FD] border-l-4 border-[#2980B9] rounded-md">
              <p className="text-xs font-bold text-[#2980B9]">Data retention notice</p>
              <p className="text-[11px] text-[#1a5276] mt-0.5">
                For your privacy, if no decision is recorded on your application, your account and
                the documents you uploaded will be automatically deleted <strong>30 days</strong> after
                submission. A confirmation of this has also been sent to your email.
              </p>
            </div>
            <p className="text-[11px] text-[#ADB5BD] text-center pt-1">
              A confirmation message has been sent to your email.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ApplicationStepper currentStep={3} completedSteps={[1, 2]} />

      {/* Rejection message */}
      {status === 'rejected' && (
        <div className="mb-4 p-3 bg-[#FFE5E5] border-l-4 border-[#C0392B] rounded-md flex gap-2.5">
          <XCircle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#C0392B]">Application Rejected</p>
            {appData.rejection_reason && (
              <p className="text-xs text-[#C0392B] mt-0.5">{appData.rejection_reason}</p>
            )}
            <p className="text-[11px] text-[#C0392B]/80 mt-1">
              Please review and correct the{' '}
              {appData.rejection_section === 'guarantor' ? 'guarantor' : 'personal'} details,
              then resubmit your application.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#71001D] text-white rounded-t-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/20 border border-white/30 rounded-full px-2 py-0.5 font-semibold">
            Step 3
          </span>
          <div>
            <h2 className="text-sm font-semibold">Review &amp; Submit</h2>
            <p className="text-[10px] text-white/70">Check all details before submitting</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-t-0 border-[#DEE2E6] rounded-b-lg p-4 space-y-4">

        {/* Current status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#6C757D]">Application Status</span>
          <StatusBadge status={appData.status} />
        </div>

        {/* Personal section check */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#6C757D]" />
              <span className="text-xs font-bold text-[#343A40]">Personal Details</span>
            </div>
            <div className="flex items-center gap-1">
              {personalComplete ? (
                <span className="text-[10px] font-semibold text-[#FFB000]">Complete</span>
              ) : (
                <Link href="/apply/step1" className="text-[10px] font-semibold text-[#2980B9] flex items-center gap-0.5">
                  Edit <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Summary */}
          {ad && (
            <div className="bg-[#F8F9FA] rounded-md p-3 text-xs space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Name</span>
                <span className="font-medium">{[ad.first_name, ad.middle_name, ad.last_name].filter(Boolean).join(' ') || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Ghana ID</span>
                <span className="font-medium font-mono">{ad.ghana_id_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Region</span>
                <span className="font-medium">{regionName}</span>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E9ECEF] rounded-md p-3">
            <CheckItem label="First Name" value={checks.personal.firstName} />
            <CheckItem label="Last Name" value={checks.personal.lastName} />
            <CheckItem label="Date of Birth" value={checks.personal.dob} />
            <CheckItem label="Phone Number" value={checks.personal.phone} />
            <CheckItem label="Ghana Card Number" value={checks.personal.ghanaId} />
            <CheckItem label="Region" value={checks.personal.region} />
            {applicantColsReady && (
              <>
                <CheckItem label="Driver's License Number" value={checks.personal.driversLicense} />
                <CheckItem label="Motorbike Question Answered" value={checks.personal.motorbike} />
                <CheckItem label="Compensation Expectation" value={checks.personal.compensation} />
                <CheckItem label="Possible Start Date" value={checks.personal.startDate} />
              </>
            )}
            <CheckItem label="CV Uploaded" value={checks.personal.cv} />
            <CheckItem label="Cover Letter Uploaded" value={checks.personal.coverLetter} />
            <CheckItem label="Ghana ID Card Uploaded" value={checks.personal.idCard} />
            {applicantColsReady && (
              <CheckItem label="Driver's License Uploaded" value={checks.personal.driversLicenseFile} />
            )}
          </div>
        </div>

        {/* Guarantor section check */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#6C757D]" />
              <span className="text-xs font-bold text-[#343A40]">Guarantor Details</span>
            </div>
            <div className="flex items-center gap-1">
              {guarantorComplete ? (
                <span className="text-[10px] font-semibold text-[#FFB000]">Complete</span>
              ) : (
                <Link href="/apply/step2" className="text-[10px] font-semibold text-[#2980B9] flex items-center gap-0.5">
                  Edit <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>

          {gd && (
            <div className="bg-[#F8F9FA] rounded-md p-3 text-xs space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Guarantor Name</span>
                <span className="font-medium">{[gd.first_name, gd.last_name].filter(Boolean).join(' ') || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C757D]">Email</span>
                <span className="font-medium">{gd.email || '—'}</span>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E9ECEF] rounded-md p-3">
            <CheckItem label="Guarantor First Name" value={checks.guarantor.firstName} />
            <CheckItem label="Guarantor Last Name" value={checks.guarantor.lastName} />
            <CheckItem label="Email Address" value={checks.guarantor.email} />
            <CheckItem label="Phone Number" value={checks.guarantor.phone} />
            {guarantorColsReady && (
              <CheckItem label="Place of Work" value={checks.guarantor.placeOfWork} />
            )}
            <CheckItem label="National ID Uploaded" value={checks.guarantor.nationalId} />
            <CheckItem label="Signed Form Uploaded" value={checks.guarantor.signedForm} />
          </div>
        </div>

        {!allComplete && (
          <div className="p-3 bg-[#FFF3CD] border-l-4 border-[#E9C46A] rounded-md">
            <p className="text-xs font-semibold text-[#856404]">Incomplete Application</p>
            <p className="text-[11px] text-[#856404] mt-0.5">
              Please complete all required fields before submitting.
            </p>
          </div>
        )}

        {submitError && <p className="text-xs text-[#C0392B]">{submitError}</p>}

        <div className="flex gap-2 pt-1">
          <Link href="/apply/step2" className="flex-1">
            <Button type="button" variant="ghost" size="sm" className="w-full">
              ← Back
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            disabled={!allComplete || submitting || submitted}
            className="flex-1"
            size="sm"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Application
          </Button>
        </div>

        <p className="text-[10px] text-[#ADB5BD] text-center">
          By submitting, you confirm all information provided is accurate and complete.
        </p>
      </div>
    </div>
  )
}
