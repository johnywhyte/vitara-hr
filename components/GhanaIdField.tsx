'use client'

import { useState, useCallback } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { formatGhanaId, isGhanaIdComplete } from '@/lib/utils'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type VerifyStatus = 'idle' | 'verifying' | 'verified' | 'failed'

interface GhanaIdFieldProps {
  value: string
  onChange: (val: string) => void
  onVerified?: (verified: boolean) => void
  error?: string
}

export function GhanaIdField({ value, onChange, onVerified, error }: GhanaIdFieldProps) {
  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [verifyMsg, setVerifyMsg] = useState('')

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const formatted = formatGhanaId(raw)
      onChange(formatted)

      if (isGhanaIdComplete(formatted)) {
        setStatus('verifying')
        setVerifyMsg('')
        try {
          const res = await fetch('/api/verify-ghana-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_number: formatted }),
          })
          const data = await res.json()
          if (data.verified) {
            setStatus('verified')
            setVerifyMsg('ID verified successfully')
            onVerified?.(true)
          } else {
            setStatus('failed')
            setVerifyMsg(data.message || 'Could not verify ID')
            onVerified?.(false)
          }
        } catch {
          setStatus('failed')
          setVerifyMsg('Verification service unavailable')
          onVerified?.(false)
        }
      } else {
        setStatus('idle')
        setVerifyMsg('')
        onVerified?.(false)
      }
    },
    [onChange, onVerified]
  )

  return (
    <div>
      <Label required>Ghana Card Number</Label>
      <div className="relative">
        <Input
          value={value}
          onChange={handleChange}
          placeholder="GHA-XXXXXXXXX-X"
          maxLength={15}
          error={error}
          className={cn(
            'pr-8',
            status === 'verified' && 'border-[#FFB000] focus:ring-[#FFB000]',
            status === 'failed' && 'border-[#C0392B] focus:ring-[#C0392B]'
          )}
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {status === 'verifying' && <Loader2 className="w-4 h-4 text-[#71001D] animate-spin" />}
          {status === 'verified' && <CheckCircle className="w-4 h-4 text-[#FFB000]" />}
          {status === 'failed' && <XCircle className="w-4 h-4 text-[#C0392B]" />}
        </div>
      </div>
      {status === 'verifying' && (
        <p className="text-[11px] text-[#71001D] mt-1">Verifying your Ghana Card…</p>
      )}
      {status === 'verified' && (
        <p className="text-[11px] text-[#FFB000] mt-1 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> {verifyMsg}
        </p>
      )}
      {status === 'failed' && (
        <p className="text-[11px] text-[#C0392B] mt-1">{verifyMsg}</p>
      )}
      {status === 'idle' && error && (
        <p className="text-[11px] text-[#C0392B] mt-1">{error}</p>
      )}
      <p className="text-[10px] text-[#ADB5BD] mt-0.5">Format: GHA-XXXXXXXXX-X</p>
    </div>
  )
}
