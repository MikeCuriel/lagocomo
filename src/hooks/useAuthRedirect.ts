'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function useAuthRedirect(): boolean {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated')

    if (isAuth !== 'true' && pathname !== '/') {
      router.replace('/') // usar replace evita que puedas ir atrás al login
    } else {
      setReady(true)
    }
  }, [router, pathname])

  return ready
}
