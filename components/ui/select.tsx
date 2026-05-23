import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full rounded-md border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#343A40] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] focus:border-[#2D6A4F]',
          'disabled:opacity-50 disabled:bg-[#F8F9FA] disabled:cursor-not-allowed',
          error && 'border-[#C0392B] focus:ring-[#C0392B]',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
