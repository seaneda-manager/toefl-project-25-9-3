import "./globals.css";
import "@/styles/theme.css";
import React from "react";
import ClientSiteHeader from "@/components/layout/ClientSiteHeader";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <ClientSiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
