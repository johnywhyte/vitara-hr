export type UserRole = 'applicant' | 'admin'
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
export type RejectionSection = 'personal' | 'guarantor'

export interface Profile {
  id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  status: ApplicationStatus
  rejection_reason: string | null
  rejection_section: RejectionSection | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
  applicant_details?: ApplicantDetails
  guarantor_details?: GuarantorDetails
}

export interface ApplicantDetails {
  id: string
  application_id: string
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  date_of_birth: string | null
  phone_number: string | null
  ghana_id_number: string | null
  ghana_id_verified: boolean
  region_id: string | null
  cv_url: string | null
  cover_letter_url: string | null
  ghana_id_card_url: string | null
  created_at: string
  updated_at: string
}

export interface GuarantorDetails {
  id: string
  application_id: string
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  email: string | null
  phone_number: string | null
  national_id_url: string | null
  signed_form_url: string | null
  created_at: string
  updated_at: string
}

export interface GhanaRegion {
  id: string
  name: string
}
