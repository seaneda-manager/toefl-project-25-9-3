// apps/web/components/layout/RootShell.tsx
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import ClientSiteHeader from "@/components/layout/ClientSiteHeader";

const APP_PREFIXES = [
  "/home",   // ✅ add this
  "/toefl",
  "/lingox",
  "/admin",
  "/vocab",
  "/reading",
  "/listening",
  "/speaking",
  "/writing",
  "/dashboard",
  "/teacher",
];

function isAppRoute(pathname: string) {
  return APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  // ✅ 앱 영역: 전역 header/container를 씌우지 않는다 (각 앱 레이아웃이 책임)
  if (isAppRoute(pathname)) return <>{children}</>;

  // ✅ 마케팅/기타 영역: 기존처럼 header + max width wrapper 적용
  return (
    <>
      <ClientSiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </>
  );
}