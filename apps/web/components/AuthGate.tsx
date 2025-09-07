'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient' // ← 경로 확정

type Props = {
  children: ReactNode
  redirect?: string
}

export default function AuthGate({ children, redirect = '/auth/login' }: Props) {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function run() {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session) {
        setAuthed(true)
        setReady(true)
      } else {
        setAuthed(false)
        setReady(true)
        router.replace(redirect)
      }
    }
    run()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (!mounted) return
      if (sess) setAuthed(true)
      else {
        setAuthed(false)
        router.replace(redirect)
      }
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [redirect, router])

  if (!ready) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Checking session…
      </div>
    )
  }

  if (!authed) return null
  return <>{children}</>
}
