'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient' // ??寃쎈줈 ?뺤젙

/**
 * 蹂댄샇 援ъ뿭?먯꽌 ?ъ슜: ?몄뀡 ?놁쑝硫?/auth/login ?쇰줈 蹂대깂
 * ?ъ슜踰?
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
