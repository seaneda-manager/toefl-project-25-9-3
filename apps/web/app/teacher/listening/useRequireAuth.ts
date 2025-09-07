'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient' // ← 경로 확정

/**
 * 보호 구역에서 사용: 세션 없으면 /auth/login 으로 보냄
 * 사용법:
 *   const { loading, session, user } = useRequireAuth()
 */
export function useRequireAuth(redirect = '/auth/login') {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function check() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
      if (!data.session) router.replace(redirect)
    }

    check()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return
      setSession(sess)
      if (!sess) router.replace(redirect)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [redirect, router])

  return { loading, session, user: session?.user ?? null }
}
