// apps/web/app/(site)/layout.tsx
import React from "react";
import ClientSiteHeader from "@/components/layout/ClientSiteHeader";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClientSiteHeader />
      <div className="mx-auto w-full max-w-5xl px-4 py-6">{children}</div>
    </>
  );
}
