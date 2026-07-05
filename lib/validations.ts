import { z } from 'zod'

// Returns whole years between the given date string and today.
function ageInYears(dateStr: string): number {
  const dob = new Date(dateStr)
  if (Number.isNaN(dob.getTime())) return NaN
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export const personalDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  middle_name: z.string().max(50).optional(),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => ageInYears(val) >= 18, {
      message: 'You must be at least 18 years old to apply',
    }),
  phone_number: z.string().min(10, 'Valid phone number required').max(15),
  ghana_id_number: z
    .string()
    .min(1, 'Ghana ID is required')
    .regex(/^GHA-[A-Z0-9]{9}-\d$/i, 'Invalid Ghana Card format (GHA-XXXXXXXXX-X)'),
  region_id: z.string().min(1, 'Region is required'),
  drivers_license_number: z
    .string()
    .min(1, "Driver's license number is required"),
  has_motorbike: z.enum(['yes', 'no'], {
    message: 'Please tell us whether you have a motorbike',
  }),
  compensation_expectation: z
    .string()
    .min(1, 'Compensation expectation is required'),
  possible_start_date: z.string().min(1, 'Possible start date is required'),
  cv_url: z.string().min(1, 'CV upload is required'),
  cover_letter_url: z.string().min(1, 'Cover letter upload is required'),
  ghana_id_card_url: z.string().min(1, 'Ghana ID card upload is required'),
  drivers_license_url: z
    .string()
    .min(1, "A valid driver's license upload is required"),
})

export const guarantorDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  middle_name: z.string().max(50).optional(),
  email: z.string().email('Valid email required'),
  phone_number: z.string().min(10, 'Valid phone number required').max(15),
  place_of_work: z.string().min(1, "Guarantor's place of work is required"),
  national_id_url: z.string().min(1, "Guarantor's national ID upload is required"),
  signed_form_url: z.string().min(1, 'Signed guarantor form upload is required'),
})

export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>
export type GuarantorDetailsFormData = z.infer<typeof guarantorDetailsSchema>
