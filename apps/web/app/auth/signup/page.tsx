'use client'
import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { ActionState } from '@/app/actions/auth'
import { signUp } from '@/app/actions/auth'

const initial: ActionState = { ok: true, error: null }

async function doSignUp(prev: ActionState, formData: FormData): Promise<ActionState> {
  return await signUp(formData)
}

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button className="w-full py-2.5 rounded-xl border" disabled={pending} aria-disabled={pending}>
      {pending ? '가입 중…' : '가입'}
    </button>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const [state, formAction] = useFormState<ActionState, FormData>(doSignUp, initial)

  useEffect(() => {
    if (state.ok && !state.error) router.push('/auth/login?m=signed-up')
  }, [state, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">회원가입</h1>
        {state.ok === false && (
          <div className="rounded-lg border bg-red-50 px-3 py-2 text-sm">{state.error}</div>
        )}
        <form className="space-y-3" action={formAction}>
          <input className="w-full border rounded-md px-3 py-2" name="email" type="email" placeholder="이메일" required />
          <input className="w-full border rounded-md px-3 py-2" name="password" type="password" placeholder="비밀번호" required />
          <input className="w-full border rounded-md px-3 py-2" name="role" type="text" placeholder="역할(선택)" />
          <Submit />
        </form>
      </div>
    </div>
  )
}