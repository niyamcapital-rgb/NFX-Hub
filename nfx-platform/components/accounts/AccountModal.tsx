'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Account, AccountGroup, AccountPhase, AccountStatus } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (formData: FormData) => void
  onDelete: (account: Account) => void
  account?: Account | null
}

export function AccountModal({ open, onClose, account, onSave, onDelete }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (account?.id) fd.set('id', account.id)
    onSave(fd)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firm_name">Firm Name</Label>
              <Input id="firm_name" name="firm_name" defaultValue={account?.firm_name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_name">Account Name</Label>
              <Input id="account_name" name="account_name" defaultValue={account?.account_name} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="starting_balance">Account Size ($)</Label>
              <Input id="starting_balance" name="starting_balance" type="number" step="0.01" defaultValue={account?.starting_balance} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_balance">Current Balance ($)</Label>
              <Input id="current_balance" name="current_balance" type="number" step="0.01" defaultValue={account?.current_balance ?? undefined} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profit_target_pct">Profit Target (%)</Label>
              <Input id="profit_target_pct" name="profit_target_pct" type="number" step="0.1" defaultValue={account?.profit_target_pct} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_drawdown_pct">Max DD (%)</Label>
              <Input id="max_drawdown_pct" name="max_drawdown_pct" type="number" step="0.1" defaultValue={account?.max_drawdown_pct} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="daily_loss_limit_pct">Daily Limit (%)</Label>
              <Input id="daily_loss_limit_pct" name="daily_loss_limit_pct" type="number" step="0.1" defaultValue={account?.daily_loss_limit_pct ?? undefined} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Phase</Label>
              <Select name="phase" defaultValue={account?.phase ?? ''}>
                <SelectTrigger><SelectValue placeholder="Phase" /></SelectTrigger>
                <SelectContent>
                  {(['P1', 'P2', 'Funded'] as AccountPhase[]).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Group</Label>
              <Select name="grp" defaultValue={account?.grp ?? ''}>
                <SelectTrigger><SelectValue placeholder="Group" /></SelectTrigger>
                <SelectContent>
                  {(['A', 'B', 'C', 'D', 'E'] as AccountGroup[]).map((g) => (
                    <SelectItem key={g} value={g}>Group {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select name="status" defaultValue={account?.status ?? 'active'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['active', 'passed', 'blown', 'paused'] as AccountStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start Date</Label>
            <Input id="start_date" name="start_date" type="date" defaultValue={account?.start_date ?? undefined} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {account ? 'Save Changes' : 'Add Account'}
            </Button>
            {account && (
              <Button type="button" variant="destructive" onClick={() => onDelete(account)}>
                Delete
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
