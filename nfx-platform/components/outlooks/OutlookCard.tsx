'use client'

import { motion } from 'framer-motion'
import { Calendar, FileText, StickyNote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cardHover } from '@/lib/motion'
import { useDateFormat } from '@/lib/date-format'
import type { WeeklyOutlook, DailyOutlook } from '@/types/database'

interface WeeklyProps { outlook: WeeklyOutlook; onClick: (o: WeeklyOutlook) => void }
interface DailyProps  { outlook: DailyOutlook;  onClick: (o: DailyOutlook) => void }

export function WeeklyOutlookCard({ outlook, onClick }: WeeklyProps) {
  const { fmtWeek } = useDateFormat()
  return (
    <motion.div {...cardHover} className="cursor-pointer" onClick={() => onClick(outlook)}>
      <Card className="border-border/50 transition-shadow hover:shadow-lg hover:shadow-black/30">
        {outlook.chart_url && (
          <div className="h-32 w-full overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={outlook.chart_url} alt="Chart" className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">{fmtWeek(outlook.week_start)}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          {outlook.trading_plan ? (
            <p className="line-clamp-3 text-xs text-muted-foreground">{outlook.trading_plan}</p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">No trading plan written</p>
          )}
          {outlook.notes && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70 line-clamp-1">
              <StickyNote className="h-3 w-3 shrink-0" />{outlook.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DailyOutlookCard({ outlook, onClick }: DailyProps) {
  const { fmt } = useDateFormat()
  const date = fmt(outlook.outlook_date)

  return (
    <motion.div {...cardHover} className="cursor-pointer" onClick={() => onClick(outlook)}>
      <Card className="border-border/50 transition-shadow hover:shadow-lg hover:shadow-black/30">
        {outlook.chart_url && (
          <div className="h-24 w-full overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={outlook.chart_url} alt="Chart" className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-semibold">{date}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {outlook.trading_plan ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{outlook.trading_plan}</p>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">No plan written</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
