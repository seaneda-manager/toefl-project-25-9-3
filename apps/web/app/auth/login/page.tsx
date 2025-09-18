'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import type { ActionState } from '@/app/actions/auth'
import { signInEmailPassword } from '@/app/actions/auth'

const initialState: ActionState = { ok: true, error: null }

async function loginAction(prev: ActionState, formData: FormData): Promise<ActionState> {
  return await signInEmailPassword(formData)
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      className="w-full py-2.5 rounded-xl border text-base disabled:opacity-60"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? '로그인 중…' : '로그인'}
    </button>
  )
}

export default function LoginPage() {
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const search = useSearchParams()
  const router = useRouter()
  const m = search.get('m')
  const email = search.get('email') ?? undefined
  const resetSent = m === 'reset-sent'

  const [state, formAction] = useFormState<ActionState, FormData>(loginAction, initialState)

  useEffect(() => {
    if (state?.redirectTo) router.push(state.redirectTo)
  }, [state?.redirectTo, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-semibold text-center">로그인</h1>

        {/* 상태 배너 */}
        {resetSent && (
          <div className="rounded-lg border bg-green-50 px-3 py-2 text-sm">
            비밀번호 재설정 링크를{email ? ` ${email}` : ''}로 보냈습니다. 메일함을 확인하세요.
          </div>
        )}
        {state.ok === false && (
          <div className="rounded-lg border bg-red-50 px-3 py-2 text-sm">
            로그인 실패: {state.error ?? '이메일/비밀번호를 확인해 주세요.'}
          </div>
        )}

        {/* 역할 토글 */}
        <div className="flex justify-center gap-2">
          {(['student','teacher'] as const).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-xl border ${role===r?'bg-black text-white':'bg-white'}`}
            >{r==='student'?'학생':'선생님'}</button>
          ))}
        </div>

        {/* 로그인 폼 */}
        <form className="space-y-3" action={formAction}>
          <label className="block">
            <span className="sr-only">이메일</span>
            <input className="w-full border rounded-md px-3 py-2" name="email" type="email" placeholder="이메일" required />
          </label>
          <label className="block">
            <span className="sr-only">비밀번호</span>
            <input className="w-full border rounded-md px-3 py-2" name="password" type="password" placeholder="비밀번호" required />
          </label>
          <input type="hidden" name="role" value={role} />
          <SubmitButton />
        </form>

        <div className="flex items-center justify-between text-sm">
          <a className="underline" href="/auth/forgot">비밀번호 재설정</a>
          <a className="underline" href="/auth/signup-teacher">선생님 가입</a>
        </div>
      </div>
    </div>
  )
}