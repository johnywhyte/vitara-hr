'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { personalDetailsSchema, type PersonalDetailsFormData } from '@/lib/validations'
import { GHANA_REGIONS } from '@/lib/ghana-regions'
import { ApplicationStepper } from '@/components/ApplicationStepper'
import { GhanaIdField } from '@/components/GhanaIdField'
import { FileUpload } from '@/components/FileUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Save, AlertTriangle } from 'lucide-react'

export default function Step1Page() {
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [ghanaIdVerified, setGhanaIdVerified] = useState(false)
  const [rejection, setRejection] = useState<{ reason: string; section: string } | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalDetailsFormData>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      middle_name: '',
      date_of_birth: '',
      phone_number: '',
      ghana_id_number: '',
      region_id: '',
      cv_url: '',
      cover_letter_url: '',
      ghana_id_card_url: '',
    },
  })

  const ghanaId = watch('ghana_id_number')
  const cvUrl = watch('cv_url')
  const coverLetterUrl = watch('cover_letter_url')
  const ghanaIdCardUrl = watch('ghana_id_card_url')

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Get or create application
    let { data: app } = await supabase
      .from('applications')
      .select('id, status, rejection_reason, rejection_section')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!app) {
      const { data: newApp } = await supabase
        .from('applications')
        .insert({ user_id: user.id })
        .select('id, status, rejection_reason, rejection_section')
        .single()
      app = newApp
    }

    if (!app) return
    setApplicationId(app.id)
    setIsSubmitted(app.status !== 'draft' && app.status !== 'rejected')

    if (app.rejection_reason && app.rejection_section === 'personal') {
      setRejection({ reason: app.rejection_reason, section: app.rejection_section })
    }

    // Load existing details
    const { data: details } = await supabase
      .from('applicant_details')
      .select('*')
      .eq('application_id', app.id)
      .single()

    if (details) {
      setValue('first_name', details.first_name ?? '')
      setValue('last_name', details.last_name ?? '')
      setValue('middle_name', details.middle_name ?? '')
      setValue('date_of_birth', details.date_of_birth ?? '')
      setValue('phone_number', details.phone_number ?? '')
      setValue('ghana_id_number', details.ghana_id_number ?? '')
      setValue('region_id', details.region_id ?? '')
      setValue('cv_url', details.cv_url ?? '')
      setValue('cover_letter_url', details.cover_letter_url ?? '')
      setValue('ghana_id_card_url', details.ghana_id_card_url ?? '')
      setGhanaIdVerified(details.ghana_id_verified ?? false)
    }
  }, [supabase, setValue])

  useEffect(() => { loadData() }, [loadData])

  const onSave = async (data: PersonalDetailsFormData) => {
    if (!applicationId) return
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const payload = {
      application_id: applicationId,
      ...data,
      ghana_id_verified: ghanaIdVerified,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('applicant_details')
      .upsert(payload, { onConflict: 'application_id' })

    setSaving(false)
    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handlePartialSave = async () => {
    if (!applicationId || !userId) return
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const vals = watch()
    const { error } = await supabase
      .from('applicant_details')
      .upsert(
        { application_id: applicationId, ...vals, ghana_id_verified: ghanaIdVerified, updated_at: new Date().toISOString() },
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
      <ApplicationStepper currentStep={1} completedSteps={[]} />

      {/* Rejection notice */}
      {rejection && (
        <div className="mb-4 p-3 bg-[#FFE5E5] border-l-4 border-[#C0392B] rounded-md flex gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#C0392B] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-[#C0392B]">Application Rejected</p>
            <p className="text-xs text-[#C0392B] mt-0.5">{rejection.reason}</p>
            <p className="text-[11px] text-[#C0392B]/80 mt-1">
              Please review and correct the information below, then save your progress.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#2D6A4F] text-white rounded-t-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/20 border border-white/30 rounded-full px-2 py-0.5 font-semibold">
            Step 1
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Personal Details</h2>
            <p className="text-[10px] text-white/70">Fill in your information and upload required documents</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="bg-white border border-t-0 border-[#DEE2E6] rounded-b-lg p-4 space-y-3.5">

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>First Name</Label>
            <Input
              {...register('first_name')}
              placeholder="Kwame"
              error={errors.first_name?.message}
              disabled={isSubmitted}
            />
            {errors.first_name && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.first_name.message}</p>}
          </div>
          <div>
            <Label required>Last Name</Label>
            <Input
              {...register('last_name')}
              placeholder="Mensah"
              error={errors.last_name?.message}
              disabled={isSubmitted}
            />
            {errors.last_name && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <Label>Middle Name</Label>
          <Input
            {...register('middle_name')}
            placeholder="Optional"
            disabled={isSubmitted}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Date of Birth</Label>
            <Input
              {...register('date_of_birth')}
              type="date"
              error={errors.date_of_birth?.message}
              disabled={isSubmitted}
            />
            {errors.date_of_birth && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.date_of_birth.message}</p>}
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

        {/* Ghana ID — auto-verifies */}
        <GhanaIdField
          value={ghanaId}
          onChange={(val) => setValue('ghana_id_number', val, { shouldValidate: true })}
          onVerified={setGhanaIdVerified}
          error={errors.ghana_id_number?.message}
        />

        {/* Region */}
        <div>
          <Label required>Region</Label>
          <Select
            {...register('region_id')}
            error={errors.region_id?.message}
            disabled={isSubmitted}
          >
            <option value="">Select region…</option>
            {GHANA_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
          {errors.region_id && <p className="text-[11px] text-[#C0392B] mt-0.5">{errors.region_id.message}</p>}
        </div>

        <div className="h-px bg-[#E9ECEF]" />

        {/* File uploads */}
        <div>
          <Label required>CV / Resume</Label>
          <FileUpload
            label="CV"
            accept=".pdf,.doc,.docx"
            value={cvUrl}
            onChange={(url) => setValue('cv_url', url, { shouldValidate: true })}
            userId={userId ?? 'unknown'}
            folder="cv"
            error={errors.cv_url?.message}
          />
        </div>

        <div>
          <Label required>Cover Letter</Label>
          <FileUpload
            label="Cover Letter"
            accept=".pdf,.doc,.docx"
            value={coverLetterUrl}
            onChange={(url) => setValue('cover_letter_url', url, { shouldValidate: true })}
            userId={userId ?? 'unknown'}
            folder="cover-letter"
            error={errors.cover_letter_url?.message}
          />
        </div>

        <div>
          <Label required>Ghana ID Card (Photo)</Label>
          <FileUpload
            label="Ghana ID Card"
            accept=".pdf,.jpg,.jpeg,.png"
            value={ghanaIdCardUrl}
            onChange={(url) => setValue('ghana_id_card_url', url, { shouldValidate: true })}
            userId={userId ?? 'unknown'}
            folder="ghana-id"
            error={errors.ghana_id_card_url?.message}
          />
        </div>

        {/* Save status */}
        {saveError && <p className="text-xs text-[#C0392B]">{saveError}</p>}
        {saved && (
          <div className="p-2.5 bg-[#D8F3DC] border-l-4 border-[#52B788] rounded text-xs text-[#2D6A4F] font-semibold">
            Progress saved successfully
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePartialSave}
            loading={saving}
            disabled={isSubmitted}
            className="flex-1"
          >
            <Save className="w-3.5 h-3.5" />
            Save Progress
          </Button>
          <Button
            type="submit"
            size="sm"
            loading={saving}
            disabled={isSubmitted}
            className="flex-1"
          >
            Save & Continue →
          </Button>
        </div>

        {isSubmitted && (
          <p className="text-center text-[11px] text-[#6C757D]">
            Application submitted — personal details are locked.
          </p>
        )}
      </form>
    </div>
  )
}
