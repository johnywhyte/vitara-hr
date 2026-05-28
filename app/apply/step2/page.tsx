'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { guarantorDetailsSchema, type GuarantorDetailsFormData } from '@/lib/validations'
import { ApplicationStepper } from '@/components/ApplicationStepper'
import { FileUpload } from '@/components/FileUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Download, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

export default function Step2Page() {
  const router = useRouter()
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [rejection, setRejection] = useState<{ reason: string } | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [appStatus, setAppStatus] = useState<string>('draft')

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GuarantorDetailsFormData>({
    resolver: zodResolver(guarantorDetailsSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      middle_name: '',
      email: '',
      phone_number: '',
      national_id_url: '',
      signed_form_url: '',
    },
  })

  const nationalIdUrl = watch('national_id_url')
  const signedFormUrl = watch('signed_form_url')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: app } = await supabase
      .from('applications')
      .select('id, status, rejection_reason, rejection_section')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!app) return
    setApplicationId(app.id)
    setAppStatus(app.status)
    setIsSubmitted(app.status !== 'draft' && app.status !== 'rejected')

    if (app.rejection_reason && app.rejection_section === 'guarantor') {
      setRejection({ reason: app.rejection_reason })
    }

    const { data: details } = await supabase
      .from('guarantor_details')
      .select('*')
      .eq('application_id', app.id)
      .single()

    if (details) {
      setValue('first_name', details.first_name ?? '')
      setValue('last_name', details.last_name ?? '')
      setValue('middle_name', details.middle_name ?? '')
      setValue('email', details.email ?? '')
      setValue('phone_number', details.phone_number ?? '')
      setValue('national_id_url', details.national_id_url ?? '')
      setValue('signed_form_url', details.signed_form_url ?? '')
    }
  }, [supabase, setValue])

  useEffect(() => { loadData() }, [loadData])

  const onSave = async (data: GuarantorDetailsFormData) => {
    if (!applicationId) return
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const { error } = await supabase
      .from('guarantor_details')
      .upsert(
        { application_id: applicationId, ...data, updated_at: new Date().toISOString() },
        { onConflict: 'application_id' }
      )

    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      router.push('/apply/step3')
    }
  }

  const handlePartialSave = async () => {
    if (!applicationId) return
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const vals = watch()
    const { error } = await supabase
      .from('guarantor_details')
      .upsert(
        { application_id: applicationId, ...vals, updated_at: new Date().toISOString() },
        { onConflict: 'application_id' }
      )

    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div>
      <ApplicationStepper currentStep={2} completedSteps={[1]} />

      {/* Status banners */}
      {appStatus === 'approved' && (
        <div className="mb-4 p-3 bg-[#FFF3CD] border-l-4 border-[#FFB000] rounded-md flex gap-2.5">
          <CheckCircle className="w-4 h-4 text-[#71001D] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#71001D]">Application Approved 🎉</p>
            <p className="text-xs text-[#71001D]/80 mt-0.5">
              Your application has been approved. You will receive next steps by email.
            </p>
          </div>
        </div>
      )}
      {(appStatus === 'submitted' || appStatus === 'under_review') && (
        <div className="mb-4 p-3 bg-[#FFF3CD] border-l-4 border-[#FFB000] rounded-md flex gap-2.5">
          <Clock className="w-4 h-4 text-[#71001D] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#71001D]">Application Under Review</p>
            <p className="text-xs text-[#71001D]/80 mt-0.5">
              Your application is being reviewed by our HR team. Editing is disabled until a decision is made.
            </p>
          </div>
        </div>
      )}

      {/* Rejection notice */}
      {rejection && (
        <div className="mb-4 p-3 bg-[#FFE5E5] border-l-4 border-[#C0392B] rounded-md flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#C0392B]">Guarantor Section Rejected</p>
            <p className="text-xs text-[#C0392B] mt-0.5">{rejection.reason}</p>
          </div>
        </div>
      )}

      <div className="bg-[#71001D] text-white rounded-t-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/20 border border-white/30 rounded-full px-2 py-0.5 font-semibold">
            Step 2
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Guarantor Details</h2>
            <p className="text-[10px] text-white/70">Your guarantor vouches for your character</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-t-0 border-[#DEE2E6] rounded-b-lg p-4 space-y-3.5">

        {/* Download notice */}
        <div className="p-3 bg-[#E8F4FD] border-l-4 border-[#2980B9] rounded-md">
          <p className="text-xs font-semibold text-[#2980B9] mb-1">Guarantor Form Required</p>
          <p className="text-[11px] text-[#1a5276]">
            Download the guarantor form, have your guarantor sign it, then upload the signed copy below.
          </p>
          <a
            href="/api/guarantor-form"
            download="vitara-guarantor-form.pdf"
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2980B9] hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            Download Guarantor Form (PDF)
          </a>
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-3.5">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>First Name</Label>
              <Input
                {...register('first_name')}
                placeholder="Ama"
                error={errors.first_name?.message}
                disabled={isSubmitted}
              />
              {errors.first_name && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label required>Last Name</Label>
              <Input
                {...register('last_name')}
                placeholder="Asante"
                error={errors.last_name?.message}
                disabled={isSubmitted}
              />
              {errors.last_name && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <Label>Middle Name</Label>
            <Input {...register('middle_name')} placeholder="Optional" disabled={isSubmitted} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Email Address</Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="guarantor@email.com"
                error={errors.email?.message}
                disabled={isSubmitted}
              />
              {errors.email && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.email.message}</p>}
            </div>
            <div>
              <Label required>Phone Number</Label>
              <Input
                {...register('phone_number')}
                placeholder="+233 XX XXX XXXX"
                type="tel"
                error={errors.phone_number?.message}
                disabled={isSubmitted}
              />
              {errors.phone_number && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.phone_number.message}</p>}
            </div>
          </div>

          <div className="h-px bg-[#E9ECEF]" />

          <div>
            <Label required>Guarantor&apos;s National ID (Upload)</Label>
            <FileUpload
              label="National ID"
              accept=".pdf,.jpg,.jpeg,.png"
              value={nationalIdUrl}
              onChange={(url) => setValue('national_id_url', url, { shouldValidate: true })}
              userId={userId ?? 'unknown'}
              folder="guarantor-id"
              error={errors.national_id_url?.message}
              disabled={isSubmitted}
            />
          </div>

          <div>
            <Label required>Signed Guarantor Form</Label>
            <FileUpload
              label="Signed Form"
              accept=".pdf,.jpg,.jpeg,.png"
              value={signedFormUrl}
              onChange={(url) => setValue('signed_form_url', url, { shouldValidate: true })}
              userId={userId ?? 'unknown'}
              folder="guarantor-form"
              error={errors.signed_form_url?.message}
              disabled={isSubmitted}
            />
          </div>

          {saveError && <p className="text-xs text-[#C0392B]">{saveError}</p>}
          {saved && (
            <div className="p-2.5 bg-[#FFF3CD] border-l-4 border-[#FFB000] rounded text-xs text-[#71001D] font-semibold">
              Progress saved
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Link href="/apply/step1" className="flex-1">
              <Button type="button" variant="ghost" size="sm" className="w-full">
                ← Back
              </Button>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePartialSave}
              loading={saving}
              disabled={isSubmitted}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </Button>
            <Button type="submit" size="sm" loading={saving} disabled={isSubmitted} className="flex-1">
              Save & Continue →
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}
