import { z } from 'zod'

export const personalDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  middle_name: z.string().max(50).optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  phone_number: z.string().min(10, 'Valid phone number required').max(15),
  ghana_id_number: z
    .string()
    .min(1, 'Ghana ID is required')
    .regex(/^GHA-[A-Z0-9]{9}-\d$/i, 'Invalid Ghana Card format (GHA-XXXXXXXXX-X)'),
  region_id: z.string().min(1, 'Region is required'),
  cv_url: z.string().min(1, 'CV upload is required'),
  cover_letter_url: z.string().min(1, 'Cover letter upload is required'),
  ghana_id_card_url: z.string().min(1, 'Ghana ID card upload is required'),
})

export const guarantorDetailsSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50),
  last_name: z.string().min(1, 'Last name is required').max(50),
  middle_name: z.string().max(50).optional(),
  email: z.string().email('Valid email required'),
  phone_number: z.string().min(10, 'Valid phone number required').max(15),
  national_id_url: z.string().min(1, "Guarantor's national ID upload is required"),
  signed_form_url: z.string().min(1, 'Signed guarantor form upload is required'),
})

export type PersonalDetailsFormData = z.infer<typeof personalDetailsSchema>
export type GuarantorDetailsFormData = z.infer<typeof guarantorDetailsSchema>
