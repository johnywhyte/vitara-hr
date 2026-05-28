import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-md border border-[#DEE2E6] bg-white px-3 py-2 text-sm text-[#343A40] placeholder:text-[#ADB5BD] transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#71001D] focus:border-[#71001D]',
          'disabled:opacity-50 disabled:bg-[#F8F9FA] disabled:cursor-not-allowed',
          error && 'border-[#C0392B] focus:ring-[#C0392B] focus:border-[#C0392B]',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
