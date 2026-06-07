'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, X } from 'lucide-react'
import { Label } from './label'

interface Props {
  label: string
  onFileSelect: (file: File | null) => void
  existingUrl?: string | null
  className?: string
}

export function ImageDropzone({ label, onFileSelect, existingUrl, className }: Props) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return
      onFileSelect(file)
      setPreview(URL.createObjectURL(file))
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    setPreview(null)
    onFileSelect(null)
  }

  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      <div
        {...getRootProps()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/40'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={label} className="h-32 w-full rounded-lg object-cover" />
            <button
              type="button"
              onClick={clear}
              className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-0.5 text-muted-foreground backdrop-blur-sm hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-5 text-muted-foreground">
            <UploadCloud className="h-6 w-6" />
            <p className="text-xs font-medium">
              {isDragActive ? 'Drop image here' : 'Drag & drop or click to upload'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
