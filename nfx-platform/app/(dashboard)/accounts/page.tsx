import { getAccounts } from '@/app/actions/account-actions'
import { getTrades } from '@/app/actions/trade-actions'
import { AccountsClient } from '@/components/accounts/AccountsClient'

export default async function AccountsPage() {
  const [accounts, trades] = await Promise.all([getAccounts(), getTrades()])
  return <AccountsClient initialAccounts={accounts} trades={trades} />
}
