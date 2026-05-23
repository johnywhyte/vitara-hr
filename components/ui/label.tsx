import { cn } from '@/lib/utils'
import { LabelHTMLAttributes } from 'react'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-xs font-semibold text-[#6C757D] mb-1', className)}
      {...props}
    >
      {children}
      {required && <span className="text-[#C0392B] ml-0.5">*</span>}
    </label>
  )
}
