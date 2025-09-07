'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient' // ← 이 경로가 맞아요!

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setOk(null)

    if (!password) return setError('새 비밀번호를 입력하세요.')
    if (password !== confirm) return setError('비밀번호 확인이 일치하지 않습니다.')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) return setError(error.message)
    setOk('비밀번호가 변경되었습니다.')
    setTimeout(() => router.push('/dashboard'), 800)
  }

  return (
    <main className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-bold">Update password</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="w-full border p-2 rounded" type="password" placeholder="New password"
               value={password} onChange={(e) => setPassword(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Confirm new password"
               value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {ok && <p className="text-green-600 text-sm">{ok}</p>}
        <button disabled={loading} className="w-full border p-2 rounded">
          {loading ? 'Updating…' : 'Update'}
        </button>
      </form>
    </main>
  )
}
