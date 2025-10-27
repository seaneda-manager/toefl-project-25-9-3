"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  email: string;
  password: string;
  remember: boolean;
  loading?: boolean;
  error?: string | null;
  onChangeEmail?: (v: string) => void;
  onChangePassword?: (v: string) => void;
  onToggleRemember?: (v: boolean) => void;
  onSubmit?: () => void;
  onFindId?: () => void;
  onForgotPw?: () => void;
};

export default function PlasmicLoginForm({
  email,
  password,
  remember,
  loading = false,
  error,
  onChangeEmail,
  onChangePassword,
  onToggleRemember,
  onSubmit,
  onFindId,
  onForgotPw,
}: Props) {
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const emailId = useMemo(() => "email-" + Math.random().toString(36).slice(2), []);
  const pwId = useMemo(() => "password-" + Math.random().toString(36).slice(2), []);
  const errId = useMemo(() => "login-error-" + Math.random().toString(36).slice(2), []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) onSubmit?.();
  }

  function onPwKey(evt: React.KeyboardEvent<HTMLInputElement>) {
    // CapsLock 媛먯?
    if (evt.getModifierState && typeof evt.getModifierState === "function") {
      setCapsOn(evt.getModifierState("CapsLock"));
    }
    // Enter濡??쒖텧
    if (evt.key === "Enter" && !loading) {
      onSubmit?.();
    }
  }

  // ???꾩껜?먯꽌 Enter濡??쒖텧(?띿뒪???낅젰 以묒씪 ???숈옉)
  function onFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && !loading) {
      // textarea媛 ?꾨땶 寃쎌슦留?(?덈떎硫?
      const target = e.target as HTMLElement;
      const isTextArea = target?.tagName?.toLowerCase() === "textarea";
      if (!isTextArea) onSubmit?.();
    }
  }

  // 濡쒕뵫 ?쒖옉 ??踰꾪듉???ъ빱??怨좎젙(以묐났 ?쒖텧 諛⑹? UX)
  useEffect(() => {
    if (!loading) return;
    const btn = formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]');
    btn?.focus();
  }, [loading]);

  return (
    <div className="grid min-h-screen w-full place-items-center bg-neutral-950 p-4 text-neutral-100">
      <div className="grid w-full max-w-[960px] gap-6 md:grid-cols-[420px_1fr]">
        {/* Left: Login card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow">
          <h1 className="mb-1 text-xl font-semibold">濡쒓렇??/h1>
          <p className="mb-4 text-sm text-neutral-400">?꾩씠???대찓??? 鍮꾨?踰덊샇瑜??낅젰?섏꽭??</p>

          <form
            ref={formRef}
            className="space-y-4"
            onSubmit={handleSubmit}
            onKeyDown={onFormKeyDown}
            noValidate
            aria-describedby={error ? errId : undefined}
          >
            <label className="block" htmlFor={emailId}>
              <span className="mb-1 block text-sm text-neutral-300">?꾩씠???대찓??</span>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => onChangeEmail?.(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                aria-invalid={!!error || undefined}
              />
            </label>

            <label className="block" htmlFor={pwId}>
              <span className="mb-1 block text-sm text-neutral-300">鍮꾨?踰덊샇</span>
              <div className="relative">
                <input
                  id={pwId}
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => onChangePassword?.(e.target.value)}
                  onKeyUp={onPwKey}
                  onKeyDown={onPwKey}
                  placeholder="?™™™™™™™?
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                  autoComplete="current-password"
                  aria-invalid={!!error || undefined}
                  aria-describedby={[capsOn ? `${pwId}-caps` : null, error ? errId : null]
                    .filter(Boolean)
                    .join(" ") || undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2 my-1 rounded-lg px-2 text-xs text-neutral-300 hover:bg-neutral-800"
                  onClick={() => setShowPw((s) => !s)}
                  aria-pressed={showPw}
                >
                  {showPw ? "?④린湲? : "?쒖떆"}
                </button>
              </div>
              {capsOn && (
                <div id={`${pwId}-caps`} className="mt-1 text-xs text-amber-400">
                  Caps Lock??耳쒖졇 ?덉뒿?덈떎.
                </div>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm">
              <label className="inline-flex select-none items-center gap-2" htmlFor="remember">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="size-4 accent-white"
                  checked={remember}
                  onChange={(e) => onToggleRemember?.(e.target.checked)}
                />
                ?꾩씠?????
              </label>
              <span className="opacity-40">|</span>
              <button
                type="button"
                className="underline underline-offset-4 hover:opacity-80"
                onClick={() => onFindId?.()}
              >
                ?꾩씠??李얘린
              </button>
              <span className="opacity-40">|</span>
              <button
                type="button"
                className="underline underline-offset-4 hover:opacity-80"
                onClick={() => onForgotPw?.()}
              >
                鍮꾨?踰덊샇 李얘린
              </button>
            </div>

            {error && (
              <div id={errId} className="text-sm text-red-400" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading || undefined}
              className="w-full rounded-xl bg-white py-2.5 font-semibold text-black hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> 濡쒓렇??以묅?
                </span>
              ) : (
                "?뺤씤"
              )}
            </button>
          </form>
        </div>

        {/* Right: Visual/help */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:min-h-[420px]">
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="relative mx-auto mb-4 h-56 w-56 opacity-90">
                <Image
                  src="/images/login-hero.png"
                  alt="?숈뒿 ?덉뼱濡??대?吏"
                  fill
                  sizes="224px"
                  className="object-contain"
                  priority
                  // ?대?吏媛 ?몃? CDN ?깆쑝濡??대룞?섎뜑?쇰룄 ?щ옒??諛⑹?
                  unoptimized
                />
              </div>
              <h2 className="text-lg font-semibold">Klai Prime English</h2>
              <p className="mt-1 text-sm text-neutral-400">
                ?덉씠?꾩썐/?대?吏??Plasmic?먯꽌 諛붽씀怨? 肄붾뱶?????뚯씪留?援먯껜?섎㈃ ?⑸땲??
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ?????????? small ui ?????????? */
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="img"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" fill="none" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}




