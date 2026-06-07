import { getTrades } from '@/app/actions/trade-actions'
import { MetricsStrip } from '@/components/dashboard/MetricsStrip'
import { TradeCalendar } from '@/components/dashboard/TradeCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const trades = await getTrades()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance overview across all accounts</p>
      </div>

      <MetricsStrip trades={trades} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Trade Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <TradeCalendar trades={trades} />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-medium">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No trades logged yet.</p>
            ) : (
              <div className="space-y-2">
                {trades.slice(0, 8).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{t.symbol}</span>
                      <span className="text-xs text-muted-foreground">{t.open_date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.risk_reward && (
                        <span className="text-xs text-muted-foreground">{t.risk_reward}R</span>
                      )}
                      <span className={`text-xs font-semibold ${
                        t.result === 'win' ? 'text-emerald-400' :
                        t.result === 'loss' ? 'text-red-400' :
                        'text-zinc-400'
                      }`}>
                        {t.result?.toUpperCase() ?? 'PENDING'}
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
