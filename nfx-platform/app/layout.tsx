import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'NFX Hub — Trading Terminal Workspace',
  description: 'Professional-grade trade journaling and prop account management.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakartaSans.variable}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
