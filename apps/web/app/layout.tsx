// apps/web/app/layout.tsx
import "./globals.css";
import "@/styles/theme.css";
import React from "react";
import RootShell from "@/components/layout/RootShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}