// apps/web/app/layout.tsx
import "./globals.css";
import "@/styles/theme.css";
import React from "react";
import RootShell from "@/components/layout/RootShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      {/* bg-color은 globals.css body에서 #f2f4f1로 단일 관리 */}
      <body className="min-h-screen" suppressHydrationWarning>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}