import { getConfluences } from '@/app/actions/confluence-actions'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const confluences = await getConfluences()
  return <SettingsClient confluences={confluences} />
}
