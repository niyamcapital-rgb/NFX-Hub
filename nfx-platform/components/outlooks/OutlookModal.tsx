'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ImageDropzone } from '@/components/ui/image-dropzone'
import { uploadFile } from '@/lib/storage-utils'
import type { WeeklyOutlook, DailyOutlook } from '@/types/database'

interface WeeklyProps {
  open: boolean
  onClose: () => void
  type: 'weekly'
  outlook?: WeeklyOutlook | null
  onSave: (formData: FormData) => void
  onDelete: (outlook: WeeklyOutlook) => void
}

interface DailyProps {
  open: boolean
  onClose: () => void
  type: 'daily'
  outlook?: DailyOutlook | null
  onSave: (formData: FormData) => void
  onDelete: (outlook: DailyOutlook) => void
}

type Props = WeeklyProps | DailyProps

export function OutlookModal({ open, onClose, type, outlook, onSave, onDelete }: Props) {
  const [chartFile,     setChartFile]     = useState<File | null>(null)
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null)
  const [isUploading,   setIsUploading]   = useState(false)

  const weeklyOutlook = type === 'weekly' ? (outlook as WeeklyOutlook | null | undefined) : null
  const dailyOutlook  = type === 'daily'  ? (outlook as DailyOutlook  | null | undefined) : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (outlook?.id) fd.set('id', outlook.id)

    if (chartFile || newsImageFile) {
      setIsUploading(true)
      try {
        if (chartFile) {
          const url = await uploadFile(chartFile, 'outlook-charts', type === 'weekly' ? 'weekly' : 'daily')
          if (url) fd.set('chart_url', url)
        }
        if (newsImageFile && type === 'weekly') {
          const url = await uploadFile(newsImageFile, 'outlook-charts', 'news')
          if (url) fd.set('news_image_url', url)
        }
      } catch {
        // continue without image
      } finally {
        setIsUploading(false)
      }
    }

    onSave(fd)
  }

  function handleDelete() {
    if (!outlook) return
    if (type === 'weekly') (onDelete as WeeklyProps['onDelete'])(outlook as WeeklyOutlook)
    else                   (onDelete as DailyProps['onDelete'])(outlook as DailyOutlook)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {outlook ? 'Edit' : 'New'} {type === 'weekly' ? 'Weekly' : 'Daily'} Outlook
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date-field">
              {type === 'weekly' ? 'Week Start (Monday)' : 'Date'}
            </Label>
            <Input
              id="date-field"
              name={type === 'weekly' ? 'week_start' : 'outlook_date'}
              type="date"
              defaultValue={type === 'weekly' ? weeklyOutlook?.week_start : dailyOutlook?.outlook_date}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trading_plan">Trading Plan</Label>
            <Textarea
              id="trading_plan"
              name="trading_plan"
              rows={5}
              placeholder="Weekly narrative, key levels, bias direction…"
              defaultValue={type === 'weekly' ? weeklyOutlook?.trading_plan ?? '' : dailyOutlook?.trading_plan ?? ''}
            />
          </div>

          {type === 'weekly' && (
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="News events, macro context…"
                defaultValue={weeklyOutlook?.notes ?? ''}
              />
            </div>
          )}

          {/* Chart image */}
          <ImageDropzone
            label={type === 'weekly' ? 'Weekly Chart' : 'Daily Chart'}
            onFileSelect={setChartFile}
            existingUrl={type === 'weekly' ? weeklyOutlook?.chart_url : dailyOutlook?.chart_url}
          />

          {/* News image — weekly only */}
          {type === 'weekly' && (
            <ImageDropzone
              label="News Image"
              onFileSelect={setNewsImageFile}
              existingUrl={weeklyOutlook?.news_urls?.[0] ?? null}
            />
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? 'Uploading…' : outlook ? 'Save Changes' : 'Create Outlook'}
            </Button>
            {outlook && (
              <Button type="button" variant="destructive" onClick={handleDelete}>Delete</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
