'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { ApplicationStatus } from '@/types'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface AdminActionPanelProps {
  applicationId: string
  currentStatus: ApplicationStatus
}

export function AdminActionPanel({ applicationId, currentStatus }: AdminActionPanelProps) {
  const router = useRouter()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionSection, setRejectionSection] = useState<'personal' | 'guarantor'>('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canAct = ['submitted', 'under_review'].includes(currentStatus)
  const isApproved = currentStatus === 'approved'
  const isRejected = currentStatus === 'rejected'

  const handleAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please enter a rejection reason')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/admin/applications/${applicationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        rejection_reason: action === 'reject' ? rejectionReason : undefined,
        rejection_section: action === 'reject' ? rejectionSection : undefined,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    setSuccess(action === 'approve' ? 'Application approved. Confirmation email sent.' : 'Application rejected. Notification email sent.')
    setShowRejectForm(false)
    setRejectionReason('')
    setTimeout(() => {
      router.refresh()
    }, 1500)
  }

  if (isApproved) {
    return (
      <div className="flex items-center gap-2 p-3 bg-[#D8F3DC] border-l-4 border-[#52B788] rounded-md">
        <CheckCircle className="w-4 h-4 text-[#2D6A4F] shrink-0" />
        <p className="text-xs font-semibold text-[#2D6A4F]">This application has been approved.</p>
      </div>
    )
  }

  if (isRejected && !canAct) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-[#FFE5E5] border-l-4 border-[#C0392B] rounded-md">
          <XCircle className="w-4 h-4 text-[#C0392B] shrink-0" />
          <p className="text-xs font-semibold text-[#C0392B]">This application has been rejected.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleAction('approve')}
          loading={loading}
          className="w-full"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Overturn — Approve Instead
        </Button>
      </div>
    )
  }

  if (!canAct) {
    return (
      <p className="text-xs text-[#ADB5BD] text-center py-2">
        No actions available for this status.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {success && (
        <div className="p-2.5 bg-[#D8F3DC] border-l-4 border-[#52B788] rounded text-xs text-[#2D6A4F] font-semibold">
          {success}
        </div>
      )}
      {error && <p className="text-xs text-[#C0392B]">{error}</p>}

      {!showRejectForm ? (
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAction('approve')}
            loading={loading}
            className="flex-1"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve Application
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="flex-1"
          >
            <XCircle className="w-3.5 h-3.5" />
            Reject Application
          </Button>
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-[#FFE5E5] rounded-md border border-[#f5c6c6]">
          <p className="text-xs font-bold text-[#C0392B]">Reject Application</p>

          {/* Section selector */}
          <div>
            <p className="text-[11px] font-semibold text-[#C0392B] mb-1.5">Rejection applies to:</p>
            <div className="flex gap-2">
              {(['personal', 'guarantor'] as const).map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setRejectionSection(section)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                    rejectionSection === section
                      ? 'bg-[#C0392B] text-white border-[#C0392B]'
                      : 'bg-white text-[#C0392B] border-[#C0392B]/50 hover:bg-[#FFE5E5]'
                  }`}
                >
                  {section === 'personal' ? 'Personal Section' : 'Guarantor Section'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[#C0392B] mb-1">Reason for Rejection</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain clearly why this application is being rejected. This will be displayed to the applicant and sent via email."
              rows={3}
              className="w-full text-xs border border-[#C0392B]/40 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C0392B] resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowRejectForm(false); setError('') }}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleAction('reject')}
              loading={loading}
              className="flex-1"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
