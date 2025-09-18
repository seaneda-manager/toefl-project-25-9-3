'use client'
import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { signOutAction } from '@/app/actions/auth'

function SignOutButton() {
  const { pending } = useFormStatus()
  return (
    <button className="px-3 py-1.5 rounded-md border" disabled={pending} aria-disabled={pending} title="로그아웃">
      {pending ? '…' : '로그아웃'}
    </button>
  )
}

export default function NavBar() {
  return (
    <nav className="w-full h-12 flex items-center justify-between px-4 border-b">
      <div className="flex items-center gap-4">
        <Link href="/">Home</Link>
        <Link href="/student">Student</Link>
      </div>
      <form action={signOutAction}>
        <SignOutButton />
      </form>
    </nav>
  )
}
