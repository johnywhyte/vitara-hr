'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FCF5EB]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/">
            <div className="inline-block bg-[#71001D] rounded-lg px-4 py-2 mb-3">
              <p className="text-[9px] text-white/70 uppercase tracking-widest">Vitara</p>
              <p className="text-sm font-bold text-white">Recruitment Portal</p>
            </div>
          </Link>
          <h1 className="text-lg font-bold text-[#343A40]">Reset Password</h1>
          <p className="text-xs text-[#6C757D] mt-0.5">
            Enter your email and we&apos;ll send a reset link
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-5">
          {sent ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-[#FFF3CD] rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-[#71001D]" />
              </div>
              <p className="text-sm font-bold text-[#343A40] mb-1">Check your inbox</p>
              <p className="text-xs text-[#6C757D] mb-3">
                We sent a password reset link to <span className="font-semibold text-[#343A40]">{email}</span>
              </p>
              <p className="text-[11px] text-[#ADB5BD]">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-[#71001D] font-semibold hover:underline"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-[#FFE5E5] border-l-4 border-[#C0392B] rounded text-xs text-[#C0392B]">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <Label htmlFor="email" required>Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/login"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#6C757D] hover:text-[#71001D] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
