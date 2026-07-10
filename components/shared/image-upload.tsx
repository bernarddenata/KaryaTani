'use client'

import * as React from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiUpload } from '@/lib/utils/api-client'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onUploaded: (fileUrl: string, fileId: string) => void
  onRemoved?: () => void
  entityType?: string
  entityId?: string
  accept?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onUploaded,
  onRemoved,
  entityType,
  entityId,
  accept = 'image/jpeg,image/png,image/webp',
  className,
  disabled,
}: ImageUploadProps) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (entityType) formData.append('entity_type', entityType)
      if (entityId) formData.append('entity_id', entityId)

      const res = await apiUpload('/api/files/upload', formData)
      if (!res.success) {
        setError(res.error?.message || 'Gagal mengunggah file.')
        return
      }
      onUploaded(res.data.file_url, res.data.id)
    } catch {
      setError('Gagal mengunggah file.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Upload preview"
            className="h-32 w-32 rounded-lg border object-cover"
          />
          {onRemoved && !disabled && (
            <button
              type="button"
              onClick={onRemoved}
              className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading || disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <>
              <Upload className="size-6" />
              <span className="text-xs">Unggah Foto</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
