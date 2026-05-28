import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/types'

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-[#E9ECEF] text-[#6C757D]',
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-[#E8F4FD] text-[#2980B9]',
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-[#FFF3CD] text-[#856404]',
  },
  approved: {
    label: 'Approved',
    className: 'bg-[#FFF3CD] text-[#71001D]',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-[#FFE5E5] text-[#C0392B]',
  },
}

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
