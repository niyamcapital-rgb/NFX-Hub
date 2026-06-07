'use client'

import { forwardRef } from 'react'
import type { Trade } from '@/types/database'

interface Props {
  trade: Trade
  displayRR: number | null
  campaignRR: number | null
}

const RESULT_CONFIG = {
  win:       { label: 'WIN',       color: '#10b981' },
  loss:      { label: 'LOSS',      color: '#ef4444' },
  breakeven: { label: 'BREAKEVEN', color: '#71717a' },
  pending:   { label: 'PENDING',   color: '#f59e0b' },
} as const

export const TradeCertificateCard = forwardRef<HTMLDivElement, Props>(
  function TradeCertificateCard({ trade, displayRR, campaignRR }, ref) {
    const cfg = RESULT_CONFIG[(trade.result ?? 'pending') as keyof typeof RESULT_CONFIG] ?? RESULT_CONFIG.pending
    const children = trade.children ?? []
    const isCampaign = trade.scale_in_enabled && children.length > 0
    const rrSign = displayRR !== null && displayRR >= 0 ? '+' : ''
    const rrColor = trade.result === 'win' ? '#10b981' : trade.result === 'loss' ? '#ef4444' : '#ffffff'
    const f = (s: React.CSSProperties): React.CSSProperties => s

    return (
      <div
        ref={ref}
        style={f({
          width: 900,
          height: 500,
          fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #000815 0%, #01122e 55%, #000d1f 100%)',
        })}
      >
        {/* Blue glow — top left */}
        <div style={f({
          position: 'absolute', top: -130, left: -90,
          width: 480, height: 480,
          background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 68%)',
          pointerEvents: 'none',
        })} />

        {/* Green glow — bottom right */}
        <div style={f({
          position: 'absolute', bottom: -110, right: -80,
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 68%)',
          pointerEvents: 'none',
        })} />

        {/* Dot grid */}
        <div style={f({
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        })} />

        {/* ── Header ──────────────────────────────────── */}
        <div style={f({
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '26px 44px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'relative',
        })}>
          {/* Logo mark + name */}
          <div style={f({ display: 'flex', alignItems: 'center', gap: 10 })}>
            <div style={f({
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: 'white', letterSpacing: '-0.5px',
            })}>N</div>
            <span style={f({ fontSize: 15, fontWeight: 700, color: 'white', letterSpacing: '-0.2px' })}>
              NFX Hub
            </span>
          </div>

          <span style={f({
            fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.22)',
            letterSpacing: '0.22em', textTransform: 'uppercase',
          })}>
            {isCampaign ? 'Campaign Trade' : 'Trade Record'}
          </span>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div style={f({
          flex: 1, padding: '34px 44px 26px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative',
        })}>

          {/* Row 1: Symbol + result badge */}
          <div style={f({ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' })}>
            <div>
              <div style={f({
                fontSize: 52, fontWeight: 800, color: 'white',
                letterSpacing: '-2.5px', lineHeight: '1',
              })}>
                {trade.symbol}
              </div>
              <div style={f({ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 })}>
                {trade.trade_type && (
                  <span style={f({
                    fontSize: 11, fontWeight: 600,
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  })}>
                    {trade.trade_type}
                  </span>
                )}
                {isCampaign && (
                  <>
                    <span style={f({ color: 'rgba(255,255,255,0.15)', fontSize: 12 })}>·</span>
                    <span style={f({
                      fontSize: 11, fontWeight: 600,
                      color: 'rgba(59,130,246,0.65)',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                    })}>
                      {children.length} Leg{children.length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {trade.open_date && (
                  <>
                    <span style={f({ color: 'rgba(255,255,255,0.15)', fontSize: 12 })}>·</span>
                    <span style={f({ fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em' })}>
                      {trade.open_date}{trade.close_date ? ` → ${trade.close_date}` : ''}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Result pill */}
            <div style={f({
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 100,
              background: `${cfg.color}14`,
              border: `1px solid ${cfg.color}40`,
            })}>
              <div style={f({ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 })} />
              <span style={f({ fontSize: 13, fontWeight: 700, color: cfg.color, letterSpacing: '0.1em' })}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Row 2: RR hero number + optional leg list */}
          <div style={f({ display: 'flex', alignItems: 'flex-end', gap: 44 })}>
            <div>
              <div style={f({
                fontSize: 10, fontWeight: 600, letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 5,
              })}>
                {campaignRR !== null ? 'Total Campaign R' : 'Risk / Reward'}
              </div>
              <div style={f({ display: 'flex', alignItems: 'baseline', gap: 3 })}>
                <span style={f({
                  fontSize: 80, fontWeight: 800, color: rrColor,
                  letterSpacing: '-4px', lineHeight: '1',
                })}>
                  {displayRR !== null ? `${rrSign}${Number(displayRR).toFixed(2)}` : '—'}
                </span>
                <span style={f({
                  fontSize: 36, fontWeight: 700,
                  color: 'rgba(255,255,255,0.22)',
                  letterSpacing: '-1px', marginLeft: 3,
                })}>
                  R
                </span>
              </div>
            </div>

            {/* Vertical divider + leg rows */}
            {isCampaign && children.length > 0 && (
              <>
                <div style={f({ width: 1, height: 80, background: 'rgba(255,255,255,0.08)', flexShrink: 0 })} />
                <div style={f({ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 })}>
                  {children.slice(0, 5).map((child) => {
                    const legColor = child.leg_type === 'Placeholder' ? '#fbbf24' : '#34d399'
                    const childResColor =
                      child.result === 'win' ? '#10b981'
                      : child.result === 'loss' ? '#ef4444'
                      : 'rgba(255,255,255,0.2)'
                    return (
                      <div key={child.id} style={f({ display: 'flex', alignItems: 'center', gap: 10 })}>
                        <span style={f({
                          fontSize: 10, fontWeight: 700, color: legColor,
                          letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 78,
                        })}>
                          {child.leg_type === 'Placeholder' ? 'Placeholder' : 'Scale-In'}
                        </span>
                        {child.risk_factor !== null && child.risk_factor !== undefined && (
                          <span style={f({ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.38)', minWidth: 32 })}>
                            {child.risk_factor}×
                          </span>
                        )}
                        {child.risk_reward !== null && child.risk_reward !== undefined && (
                          <span style={f({ fontSize: 12, fontWeight: 700, color: 'white', minWidth: 38 })}>
                            {child.risk_reward}R
                          </span>
                        )}
                        <div style={f({ width: 6, height: 6, borderRadius: '50%', background: childResColor, flexShrink: 0 })} />
                      </div>
                    )
                  })}
                  {children.length > 5 && (
                    <span style={f({ fontSize: 10, color: 'rgba(255,255,255,0.25)' })}>
                      +{children.length - 5} more
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div style={f({
          padding: '14px 44px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative',
        })}>
          <span style={f({ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.06em' })}>
            nfxhub.com
          </span>
          <div style={f({ display: 'flex', alignItems: 'center', gap: 8 })}>
            <div style={f({ width: 4, height: 4, borderRadius: '50%', background: 'rgba(59,130,246,0.55)' })} />
            <span style={f({
              fontSize: 10, color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            })}>
              Professional Trade Record
            </span>
          </div>
        </div>
      </div>
    )
  },
)
