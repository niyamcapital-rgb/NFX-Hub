import type { Trade } from '@/types/database'

function fmtDate(d: string | null) {
  return d ?? ''
}

function fmtResult(r: string | null) {
  if (!r || r === 'pending') return 'Pending'
  return r.charAt(0).toUpperCase() + r.slice(1)
}

function getAccounts(t: Trade) {
  return t.trade_accounts?.map((ta) => ta.accounts?.account_name).filter(Boolean).join(', ') ?? ''
}

function getConfluences(t: Trade) {
  return t.trade_confluences?.map((tc) => tc.confluences?.name).filter(Boolean).join(', ') ?? ''
}

// ── CSV ────────────────────────────────────────────────────────────────────

function escapeCell(v: string | number | null | undefined) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportTradesToCSV(trades: Trade[], filename = 'trades.csv') {
  const headers = ['Date', 'Symbol', 'Account(s)', 'Type', 'R:R', 'Result', 'P&L', 'Confluences', 'Notes']
  const rows = trades.map((t) => [
    fmtDate(t.open_date),
    t.symbol,
    getAccounts(t),
    t.trade_type ?? '',
    t.risk_reward ?? '',
    fmtResult(t.result),
    t.pnl ?? '',
    getConfluences(t),
    t.summary ?? '',
  ])

  const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF ────────────────────────────────────────────────────────────────────

export async function exportTradesToPDF(trades: Trade[], filename = 'trades.pdf') {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })

  // Header
  doc.setFontSize(18)
  doc.setTextColor(30, 30, 30)
  doc.text('NFX Hub — Trade Journal', 40, 40)

  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text(`${trades.length} trade${trades.length !== 1 ? 's' : ''} · exported ${new Date().toLocaleDateString()}`, 40, 56)

  const head = [['Date', 'Symbol', 'Account(s)', 'Type', 'R:R', 'Result', 'P&L', 'Confluences']]
  const body = trades.map((t) => [
    fmtDate(t.open_date),
    t.symbol,
    getAccounts(t),
    t.trade_type ?? '—',
    t.risk_reward != null ? String(t.risk_reward) : '—',
    fmtResult(t.result),
    t.pnl != null ? `$${t.pnl.toFixed(2)}` : '—',
    getConfluences(t) || '—',
  ])

  autoTable(doc, {
    startY: 70,
    head,
    body,
    styles: {
      fontSize: 8,
      cellPadding: 5,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [20, 20, 20],
      textColor: [240, 240, 240],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 60 },
      4: { cellWidth: 40 },
      5: { cellWidth: 55 },
      6: { cellWidth: 55 },
    },
    margin: { left: 40, right: 40 },
  })

  doc.save(filename)
}
