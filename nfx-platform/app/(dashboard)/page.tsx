import { getTrades } from '@/app/actions/trade-actions'
import { MetricsStrip } from '@/components/dashboard/MetricsStrip'
import { TradeCalendar } from '@/components/dashboard/TradeCalendar'
import { RecentTradesList } from '@/components/dashboard/RecentTradesList'
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
            <RecentTradesList trades={trades} />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
