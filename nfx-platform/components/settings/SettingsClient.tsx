'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, SlidersHorizontal, Shield, Bell, Camera, ChevronDown, Moon, Sun } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDateFormat, formatDate, type DateFormat } from '@/lib/date-format'
import { useTheme, ACCENT_PRESETS } from '@/lib/theme'

type Page = 'profile' | 'preferences' | 'security' | 'notifications'

const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'preferences',   label: 'Preferences',   icon: SlidersHorizontal },
  { id: 'security',      label: 'Security',       icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const DATE_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
  { value: 'DMY', label: 'DD / MM / YYYY', example: formatDate('2026-06-07', 'DMY') },
  { value: 'MDY', label: 'MM / DD / YYYY', example: formatDate('2026-06-07', 'MDY') },
  { value: 'YMD', label: 'YYYY / MM / DD', example: formatDate('2026-06-07', 'YMD') },
]

function SettingsGroup({
  title,
  description,
  children,
  noPadding = false,
}: {
  title: string
  description?: string
  children: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <div
      className="rounded-xl border backdrop-blur-lg"
      style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className={noPadding ? '' : 'space-y-4 p-5'}>{children}</div>
    </div>
  )
}

function ProfilePage() {
  const [avatar, setAvatar] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      <SettingsGroup title="Avatar" description="Your profile picture across NFX Hub">
        <div className="flex items-center gap-5">
          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.10)' }}
          >
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-7 w-7 text-muted-foreground/30" />
            )}
          </div>
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setAvatar(URL.createObjectURL(file))
                }}
              />
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground">
                <Camera className="h-3.5 w-3.5" />
                Upload photo
              </span>
            </label>
            <p className="mt-1.5 text-[11px] text-muted-foreground/40">JPG, PNG or WebP · max 2MB</p>
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Profile" description="Your display name and bio">
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="e.g. niyam" className="settings-input" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={3}
            placeholder="A short description of your trading style…"
            className="settings-input w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none"
          />
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20">Save changes</Button>
      </SettingsGroup>
    </div>
  )
}

function PrefRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function PreferencesPage() {
  const { format, setFormat } = useDateFormat()
  const { theme, setTheme, accent, setAccent } = useTheme()
  const [dateOpen, setDateOpen] = useState(false)
  const activeDate = DATE_OPTIONS.find((o) => o.value === format) ?? DATE_OPTIONS[0]

  return (
    <div className="space-y-5">
      <SettingsGroup title="Display" description="Appearance preferences across the platform">
        {/* Theme */}
        <PrefRow label="Theme" description="Switch between dark and light interface">
          <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
            {(['dark', 'light'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  theme === t
                    ? 'bg-white/10 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'dark' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                {t === 'dark' ? 'Dark' : 'Light'}
              </button>
            ))}
          </div>
        </PrefRow>

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Accent colour */}
        <PrefRow label="Accent Colour" description="Primary colour used for highlights and active states">
          <div className="flex items-center gap-2">
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setAccent(p.value)}
                title={p.label}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-all duration-150',
                  accent === p.value ? 'scale-110 border-white' : 'border-transparent hover:scale-105',
                )}
                style={{
                  background: p.value,
                  boxShadow: accent === p.value ? `0 0 10px ${p.value}60` : undefined,
                }}
              />
            ))}
          </div>
        </PrefRow>

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Date format */}
        <PrefRow label="Date Format" description="How dates appear throughout the journal and dashboard">
          <div className="relative">
            {dateOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setDateOpen(false)} />
            )}
            <button
              onClick={() => setDateOpen((o) => !o)}
              className={cn(
                'flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                dateOpen
                  ? 'border-white/20 bg-white/[0.06] text-foreground'
                  : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground',
              )}
            >
              {activeDate.label}
              <ChevronDown className={cn('h-3 w-3 transition-transform duration-150', dateOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {dateOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                  exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
                  className="absolute right-0 top-9 z-50 w-44 overflow-hidden rounded-xl border shadow-xl"
                  style={{ background: 'rgba(13,13,13,0.98)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                >
                  {DATE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setFormat(opt.value); setDateOpen(false) }}
                      className={cn(
                        'flex w-full items-center px-3 py-2.5 text-xs transition-colors duration-150',
                        format === opt.value
                          ? 'bg-white/[0.06] text-foreground'
                          : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PrefRow>
      </SettingsGroup>
    </div>
  )
}

function ComingSoonPage({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed py-24 text-center"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground/40">Coming soon</p>
    </div>
  )
}

export function SettingsClient() {
  const [page, setPage] = useState<Page>('profile')

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      <div className="flex gap-8">
        {/* Left sub-nav */}
        <nav className="w-40 shrink-0">
          <ul className="space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setPage(id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    page === id
                      ? 'bg-white/[0.07] text-foreground'
                      : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content pane */}
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
              exit={{ opacity: 0, x: -8, transition: { duration: 0.12 } }}
            >
              {page === 'profile'       && <ProfilePage />}
              {page === 'preferences'   && <PreferencesPage />}
              {page === 'security'      && <ComingSoonPage label="Security" />}
              {page === 'notifications' && <ComingSoonPage label="Notifications" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
