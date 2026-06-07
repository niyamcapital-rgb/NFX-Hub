import { getTrades } from '@/app/actions/trade-actions'
import { getAccounts } from '@/app/actions/account-actions'
import { getConfluences } from '@/app/actions/confluence-actions'
import { getSymbols } from '@/app/actions/symbol-actions'
import { JournalClient } from '@/components/journal/JournalClient'

export default async function JournalPage() {
  const [trades, accounts, confluences, symbols] = await Promise.all([
    getTrades(),
    getAccounts(),
    getConfluences(),
    getSymbols(),
  ])
  return (
    <JournalClient
      initialTrades={trades}
      accounts={accounts}
      confluences={confluences}
      symbols={symbols}
    />
  )
}
