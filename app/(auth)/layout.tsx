// Auth pages call createBrowserClient() which validates env vars at instantiation
// time. Marking this segment as force-dynamic prevents Next.js from prerendering
// these pages at build time, which would fail without NEXT_PUBLIC_ vars baked in.
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
