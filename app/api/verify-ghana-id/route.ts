import { NextRequest, NextResponse } from 'next/server'
import { isGhanaIdComplete } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { id_number } = await req.json()

  if (!id_number || !isGhanaIdComplete(id_number)) {
    return NextResponse.json({ verified: false, message: 'Invalid Ghana Card format' }, { status: 400 })
  }

  // Hubtel KYC API integration
  const apiKey = process.env.HUBTEL_API_KEY
  const clientId = process.env.HUBTEL_CLIENT_ID
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET

  if (apiKey && clientId && clientSecret) {
    try {
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      const response = await fetch(
        `https://api.hubtel.com/v1/mobileaccount/kyc/verify/nationalid?nationalId=${encodeURIComponent(id_number)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Cache-Control': 'no-cache',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.ResponseCode === '0000' || data.status === 'success') {
          return NextResponse.json({ verified: true, message: 'ID verified successfully' })
        } else {
          return NextResponse.json({
            verified: false,
            message: data.ResponseDescription || 'ID could not be verified',
          })
        }
      }
    } catch (err) {
      console.error('Hubtel KYC error:', err)
    }
  }

  // Development/fallback: basic format check passes as "verified"
  // In production, ensure HUBTEL credentials are set
  if (process.env.NODE_ENV === 'development') {
    await new Promise((r) => setTimeout(r, 800)) // simulate API latency
    return NextResponse.json({ verified: true, message: 'ID verified (development mode)' })
  }

  return NextResponse.json(
    { verified: false, message: 'Verification service unavailable' },
    { status: 503 }
  )
}
