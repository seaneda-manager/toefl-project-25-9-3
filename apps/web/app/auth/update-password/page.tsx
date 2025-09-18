'use client'
import { useEffect, useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { ActionState } from '@/app/actions/auth'
import { updatePassword } from '@/app/actions/auth'

const initial: ActionState = { ok: true, error: null }

function computeStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}

async function doUpdate(prev: ActionState, formData: FormData): Promise<ActionState> {
  const pw = String(formData.get('password') ?? '')
  const cf = String(formData.get('confirm') ?? '')
  if (pw !== cf) return { ok: false, error: '비밀번호가 일치하지 않습니다.' }
  if (computeStrength(pw) < 2 || pw.length < 8) {
    return { ok: false, error: '비밀번호 조건을 확인하세요(8자 이상, 숫자/문자 조합 권장).' }
  }
  return await updatePassword(formData)
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button className="w-full py-2.5 rounded-xl border" disabled={pending} aria-disabled={pending}>
      {pending ? '저장 중…' : '새 비밀번호 저장'}
    </button>
  )
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [cf, setCf] = useState('')
  const [show, setShow] = useState(false)
  const strength = useMemo(() => computeStrength(pw), [pw])

  const [state, formAction] = useFormState<ActionState, FormData>(doUpdate, initial)

  useEffect(() => { if (state?.redirectTo) router.push(state.redirectTo) }, [state?.redirectTo, router])

  const valid = pw.length >= 8 && pw === cf && strength >= 2

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">새 비밀번호 설정</h1>

        {state.ok === false && (
          <div className="rounded-lg border bg-red-50 px-3 py-2 text-sm">{state.error}</div>
        )}

        <form className="space-y-3" action={formAction} onSubmit={(e) => { if (!valid) e.preventDefault() }}>
          <label className="block space-y-1">
            <span className="sr-only">새 비밀번호</span>
            <input
              className="w-full border rounded-md px-3 py-2"
              name="password"
              type={show ? 'text' : 'password'}
              placeholder="새 비밀번호"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="sr-only">비밀번호 확인</span>
            <input
              className="w-full border rounded-md px-3 py-2"
              name="confirm"
              type={show ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              value={cf}
              onChange={(e) => setCf(e.target.value)}
              required
            />
          </label>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>강도: {['약함','보통','좋음','매우 좋음'][Math.max(0, strength-1)] ?? '—'}</span>
            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              <span>표시</span>
            </label>
          </div>
          <Submit />
        </form>
      </div>
    </div>
  )
}
