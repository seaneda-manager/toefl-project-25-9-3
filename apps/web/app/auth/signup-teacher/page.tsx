// apps/web/app/auth/signup-teacher/page.tsx
'use client';

import { useState } from 'react';
// 寃쎈줈 alias 臾몄젣 ?뚰뵾: ?곷?寃쎈줈濡?蹂寃?
import { signUpTeacher } from '../../actions/auth';

export default function SignupTeacherPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">援먯궗 ?뚯썝媛??/h1>

      {/* onSubmit?쇰줈 濡쒖뺄 pending 泥섎━ */}
      <form
        action={async (formData) => {
          setSubmitting(true);
          try {
            await signUpTeacher(formData); // ?쒕쾭 ?≪뀡 ?몄텧 ???대??먯꽌 redirect
          } finally {
            setSubmitting(false);
          }
        }}
        onSubmit={() => setSubmitting(true)}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm mb-1">?대찓??/label>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">鍮꾨?踰덊샇</label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="6???댁긽"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
        >
          {submitting ? '怨꾩젙 ?앹꽦 以묅? : '援먯궗 怨꾩젙 留뚮뱾湲?}
        </button>
      </form>

      <p className="text-sm">
        ?대? 怨꾩젙???덈굹??{' '}
        <a className="underline" href={`/auth/login?email=${encodeURIComponent(email)}`}>
          濡쒓렇?명븯湲?
        </a>
      </p>
    </div>
  );
}
