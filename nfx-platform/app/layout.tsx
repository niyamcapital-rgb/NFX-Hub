import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NFX Hub — Trading Terminal Workspace',
  description: 'Professional-grade trade journaling and prop account management.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
