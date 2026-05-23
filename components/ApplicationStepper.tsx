'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Check } from 'lucide-react'

interface Step {
  number: number
  label: string
  href: string
}

const STEPS: Step[] = [
  { number: 1, label: 'Personal Details', href: '/apply/step1' },
  { number: 2, label: 'Guarantor', href: '/apply/step2' },
  { number: 3, label: 'Review & Submit', href: '/apply/step3' },
]

interface ApplicationStepperProps {
  currentStep: number
  completedSteps?: number[]
}

export function ApplicationStepper({ currentStep, completedSteps = [] }: ApplicationStepperProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-5">
      {STEPS.map((step, i) => {
        const isCompleted = completedSteps.includes(step.number)
        const isCurrent = step.number === currentStep
        const isPast = step.number < currentStep

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors',
                  isCurrent && 'border-[#2D6A4F] bg-[#2D6A4F] text-white',
                  (isCompleted || isPast) && !isCurrent && 'border-[#52B788] bg-[#52B788] text-white',
                  !isCurrent && !isCompleted && !isPast && 'border-[#DEE2E6] bg-white text-[#ADB5BD]'
                )}
              >
                {isCompleted || isPast ? <Check className="w-3.5 h-3.5" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold mt-1 text-center leading-tight',
                  isCurrent ? 'text-[#2D6A4F]' : 'text-[#ADB5BD]'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-1 -mt-4',
                  isPast || isCompleted ? 'bg-[#52B788]' : 'bg-[#DEE2E6]'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
