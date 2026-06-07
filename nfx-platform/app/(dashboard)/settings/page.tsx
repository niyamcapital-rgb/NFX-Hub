import { getSymbols } from '@/app/actions/symbol-actions'
import { getConfluences } from '@/app/actions/confluence-actions'
import { SettingsClient } from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const [symbols, confluences] = await Promise.all([
    getSymbols(),
    getConfluences(),
  ])
  return <SettingsClient symbols={symbols} confluences={confluences} />
}
