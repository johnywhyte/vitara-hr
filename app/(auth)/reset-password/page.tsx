'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/'), 2500)
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
          <h1 className="text-lg font-bold text-[#343A40]">Set New Password</h1>
          <p className="text-xs text-[#6C757D] mt-0.5">Choose a strong password for your account</p>
        </div>

        <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-5">
          {done ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 bg-[#FFF3CD] rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-[#71001D]" />
              </div>
              <p className="text-sm font-bold text-[#343A40] mb-1">Password updated!</p>
              <p className="text-xs text-[#6C757D]">Redirecting you to sign in…</p>
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
                  <Label htmlFor="password" required>New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ADB5BD] hover:text-[#6C757D]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirm-password" required>Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                  />
                </div>

                <Button type="submit" loading={loading} className="w-full mt-1">
                  Update Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
