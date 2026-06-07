import { getAccounts } from '@/app/actions/account-actions'
import { AccountsClient } from '@/components/accounts/AccountsClient'

export default async function AccountsPage() {
  const accounts = await getAccounts()
  return <AccountsClient initialAccounts={accounts} />
}
