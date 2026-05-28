'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react'

interface FileUploadProps {
  label: string
  accept?: string
  maxSizeMb?: number
  value?: string
  onChange: (url: string) => void
  onError?: (msg: string) => void
  userId: string
  folder: string
  error?: string
}

export function FileUpload({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMb = 5,
  value,
  onChange,
  onError,
  userId,
  folder,
  error,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(
    value ? value.split('/').pop() ?? null : null
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        onError?.(`File must be under ${maxSizeMb}MB`)
        return
      }

      setUploading(true)
      const ext = file.name.split('.').pop()
      const path = `${userId}/${folder}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('application-files')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        onError?.(uploadError.message)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('application-files').getPublicUrl(path)
      setFileName(file.name)
      onChange(data.publicUrl)
      setUploading(false)
    },
    [userId, folder, maxSizeMb, onChange, onError, supabase]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleClear = () => {
    setFileName(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {fileName ? (
        <div
          className={cn(
            'flex items-center gap-2 p-2.5 rounded-md border bg-[#FFF3CD] border-[#FFE59E]',
            error && 'bg-[#FFE5E5] border-[#f5c6c6]'
          )}
        >
          <CheckCircle className="w-4 h-4 text-[#71001D] shrink-0" />
          <span className="text-xs text-[#71001D] flex-1 truncate">{fileName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-[#6C757D] hover:text-[#C0392B] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            'relative rounded-md border-2 border-dashed border-[#DEE2E6] bg-[#F8F9FA] p-4 text-center cursor-pointer hover:border-[#71001D] hover:bg-[#FFF3CD]/20 transition-colors',
            error && 'border-[#C0392B]'
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleChange}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="w-5 h-5 text-[#71001D] animate-spin" />
              <p className="text-xs text-[#6C757D]">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="w-5 h-5 text-[#ADB5BD]" />
              <p className="text-xs text-[#6C757D]">
                <span className="font-semibold text-[#71001D]">Tap to upload</span> or drag &amp; drop
              </p>
              <p className="text-[10px] text-[#ADB5BD]">
                {accept.replace(/\./g, '').toUpperCase()} · max {maxSizeMb}MB
              </p>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-[11px] text-[#C0392B] mt-1">{error}</p>}
    </div>
  )
}
