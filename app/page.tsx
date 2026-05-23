import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/apply')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[#F0F2F5]">
      <div className="w-full max-w-sm">
        <div className="bg-[#2D6A4F] rounded-xl p-6 mb-5 text-center shadow-md">
          <p className="text-[10px] text-white/70 uppercase tracking-widest mb-1">
            Vitara Agricultural E-Commerce
          </p>
          <h1 className="text-2xl font-bold text-white">Recruitment Portal</h1>
          <p className="text-white/80 text-sm mt-1.5">
            Join us in transforming agriculture across Ghana
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#DEE2E6] shadow-sm p-4 mb-4">
          <h2 className="text-xs font-bold text-[#343A40] mb-3">Application Process</h2>
          {[
            { step: '1', label: 'Personal Details', desc: 'Fill your profile & upload documents' },
            { step: '2', label: 'Guarantor Details', desc: 'Provide your guarantor information' },
            { step: '3', label: 'Review & Submit', desc: 'Final check and submit your application' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="w-6 h-6 rounded-full bg-[#D8F3DC] border border-[#B7E4C7] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#2D6A4F]">{item.step}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#343A40]">{item.label}</p>
                <p className="text-[11px] text-[#6C757D]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/signup"
            className="w-full bg-[#2D6A4F] text-white text-sm font-semibold py-2.5 rounded-md text-center hover:bg-[#245840] transition-colors"
          >
            Start Application
          </Link>
          <Link
            href="/login"
            className="w-full bg-white text-[#2D6A4F] text-sm font-semibold py-2.5 rounded-md text-center border border-[#2D6A4F] hover:bg-[#D8F3DC] transition-colors"
          >
            Continue Existing Application
          </Link>
        </div>

        <p className="text-center text-[10px] text-[#ADB5BD] mt-5">
          © 2026 Vitara Agricultural E-Commerce · Ghana
        </p>
      </div>
    </div>
  )
}
