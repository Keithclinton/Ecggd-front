import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './AuthProvider'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, access } = useAuth()
  const router = useRouter()

  // Prevent hydration flicker by waiting until router is ready
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  useEffect(() => {
    if (!ready) return

    if (!loading && !access) {
      router.replace('/login')   // replace() avoids looping + cleaner history
    }
  }, [ready, loading, access, router])

  if (!ready || loading || !access)
    return <div className="p-8">Checking authentication...</div>

  return <>{children}</>
}
