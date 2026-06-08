'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, SlidersHorizontal, Shield, Bell, Camera, ChevronDown, Moon, Sun, RotateCcw, Crosshair } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDateFormat, formatDate, type DateFormat } from '@/lib/date-format'
import { useTheme, ACCENT_PRESETS, ROTATION_MODES, type RotationMode } from '@/lib/theme'

type Page = 'profile' | 'preferences' | 'execution' | 'security' | 'notifications'

const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'preferences',   label: 'Preferences',   icon: SlidersHorizontal },
  { id: 'execution',     label: 'Execution',      icon: Crosshair },
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
      className="rounded-xl border"
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

function RiskInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(() => String(value))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === '') { setText(''); return }
    // Only allow digits with at most one decimal point and max 2 decimal places
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return
    // Block anything >= 5 while typing (still allows "4.99")
    const num = parseFloat(raw)
    if (!isNaN(num) && num >= 5) return
    setText(raw)
  }

  function handleBlur() {
    const num = parseFloat(text)
    if (isNaN(num) || num < 0.1) {
      // Reset to last committed value if invalid or below minimum
      setText(String(value))
    } else {
      const rounded = Math.round(Math.min(4.99, Math.max(0.1, num)) * 100) / 100
      setText(String(rounded))
      onChange(rounded)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-16 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center text-xs font-medium text-foreground focus:border-white/20 focus:outline-none"
      />
      <span className="text-xs text-muted-foreground">%</span>
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

// ── Execution Settings ────────────────────────────────────────────────────────

function ThresholdInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(() => String(value))

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === '') { setText(''); return }
    if (!/^\d*\.?\d{0,1}$/.test(raw)) return
    const num = parseFloat(raw)
    if (!isNaN(num) && num > 50) return
    setText(raw)
  }
  function handleBlur() {
    const num = parseFloat(text)
    if (isNaN(num) || num < 1) { setText(String(value)); return }
    const clamped = Math.round(Math.min(50, Math.max(1, num)) * 10) / 10
    setText(String(clamped))
    onChange(clamped)
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        className="w-16 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center text-xs font-medium text-foreground focus:border-white/20 focus:outline-none"
      />
      <span className="text-xs text-muted-foreground">%</span>
    </div>
  )
}

function ExecutionPage() {
  const {
    rotationEnabled, setRotationEnabled,
    rotationMode, setRotationMode,
    riskP1, setRiskP1,
    riskP2, setRiskP2,
    riskLive, setRiskLive,
    proximityThreshold, setProximityThreshold,
  } = useTheme()
  const [rotationOpen, setRotationOpen] = useState(false)
  const activeRotation = ROTATION_MODES.find((m) => m.value === rotationMode) ?? ROTATION_MODES[1]

  return (
    <div className="space-y-5">

      {/* Account Rotation */}
      <SettingsGroup
        title="Account Rotation"
        description="Automatically signal which accounts to trade based on your last result"
      >
        <PrefRow label="Rotation Mode" description="Show account rotation signals on the dashboard">
          <button
            onClick={() => setRotationEnabled(!rotationEnabled)}
            className={cn(
              'relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none',
              rotationEnabled ? 'bg-primary' : 'bg-muted',
            )}
          >
            <span
              className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-md"
              style={{ left: rotationEnabled ? '18px' : '2px', transition: 'left 200ms ease' }}
            />
          </button>
        </PrefRow>

        <AnimatePresence>
          {rotationEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.23, 1, 0.32, 1] } }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            >
              <div className="h-px my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <PrefRow label="Rotation Strategy" description="Determines account switching aggressiveness">
                <div className="relative">
                  {rotationOpen && <div className="fixed inset-0 z-40" onClick={() => setRotationOpen(false)} />}
                  <button
                    onClick={() => setRotationOpen((o) => !o)}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                      rotationOpen
                        ? 'border-white/20 bg-white/[0.06] text-foreground'
                        : 'border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground',
                    )}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {activeRotation.label}
                    <ChevronDown className={cn('h-3 w-3 transition-transform duration-150', rotationOpen && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {rotationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] } }}
                        exit={{ opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.1 } }}
                        className="absolute right-0 top-9 z-50 w-56 overflow-hidden rounded-xl border shadow-xl"
                        style={{ background: 'rgba(13,13,13,0.98)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                      >
                        {ROTATION_MODES.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => { setRotationMode(m.value as RotationMode); setRotationOpen(false) }}
                            className={cn(
                              'flex w-full flex-col items-start px-3 py-2.5 text-left transition-colors duration-150',
                              rotationMode === m.value ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]',
                            )}
                          >
                            <span className={cn('text-xs font-semibold', rotationMode === m.value ? 'text-foreground' : 'text-muted-foreground')}>
                              {m.label}
                            </span>
                            <span className="mt-0.5 text-[10px] text-muted-foreground/50">{m.description}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </PrefRow>
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsGroup>

      {/* Risk Engine */}
      <SettingsGroup
        title="Risk Engine"
        description="Risk per trade and advisor settings"
      >
        <PrefRow label="Phase 1 — Risk Per Trade" description="% of account balance risked on each P1 trade">
          <RiskInput value={riskP1} onChange={setRiskP1} />
        </PrefRow>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <PrefRow label="Phase 2 — Risk Per Trade" description="% of account balance risked on each P2 trade">
          <RiskInput value={riskP2} onChange={setRiskP2} />
        </PrefRow>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <PrefRow label="Live — Risk Per Trade" description="% of account balance risked on each funded/live trade">
          <RiskInput value={riskLive} onChange={setRiskLive} />
        </PrefRow>
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <PrefRow
          label="Near Pass Threshold"
          description="Flag an account as Near Pass when this % or less gain is needed to hit the target"
        >
          <ThresholdInput value={proximityThreshold} onChange={setProximityThreshold} />
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
              {page === 'execution'     && <ExecutionPage />}
              {page === 'security'      && <ComingSoonPage label="Security" />}
              {page === 'notifications' && <ComingSoonPage label="Notifications" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
