import { getTrades } from '@/app/actions/trade-actions'
import { MetricsStrip } from '@/components/dashboard/MetricsStrip'
import { TradeCalendar } from '@/components/dashboard/TradeCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const trades = await getTrades()

  return (
    <div className="space-y-10">

      {/* Page header */}
      <div className="flex items-end justify-between border-b border-border/30 pb-6">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">Overview</p>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">{trades.length} total trades</p>
      </div>

      {/* Metric cards */}
      <MetricsStrip trades={trades} />

      {/* Calendar + Recent trades */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
        <Card className="border-border/40">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Trade Calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <TradeCalendar trades={trades} />
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Recent Trades
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {trades.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No trades logged yet.</p>
            ) : (
              <div className="space-y-1.5">
                {trades.slice(0, 10).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        t.result === 'win'  ? 'bg-emerald-400' :
                        t.result === 'loss' ? 'bg-red-400' :
                        'bg-zinc-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium leading-none">{t.symbol}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/60">
                          {t.close_date ?? t.open_date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {t.risk_reward != null && (
                        <span className="text-xs text-muted-foreground">{t.risk_reward}R</span>
                      )}
                      <span className={`w-16 rounded-md border px-2 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide ${
                        t.result === 'win'       ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                        t.result === 'loss'      ? 'border-red-500/20    bg-red-500/10    text-red-400'     :
                        t.result === 'breakeven' ? 'border-zinc-500/20   bg-zinc-500/10   text-zinc-400'    :
                                                   'border-blue-500/20   bg-blue-500/10   text-blue-400'
                      }`}>
                        {t.result ?? 'pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
