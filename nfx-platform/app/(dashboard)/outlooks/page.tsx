import { getWeeklyOutlooks, getDailyOutlooks } from '@/app/actions/outlook-actions'
import { OutlooksClient } from '@/components/outlooks/OutlooksClient'

export default async function OutlooksPage() {
  const [weekly, daily] = await Promise.all([
    getWeeklyOutlooks(6),
    getDailyOutlooks(30),
  ])
  return <OutlooksClient initialWeekly={weekly} initialDaily={daily} />
}
