-- ============================================================
-- Vitara Recruitment — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  role        TEXT DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPLICATIONS ──────────────────────────────────────────
CREATE TABLE public.applications (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft','submitted','under_review','approved','rejected')),
  rejection_reason  TEXT,
  rejection_section TEXT CHECK (rejection_section IN ('personal','guarantor')),
  submitted_at      TIMESTAMPTZ,
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── APPLICANT DETAILS ─────────────────────────────────────
CREATE TABLE public.applicant_details (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id      UUID REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name          TEXT,
  last_name           TEXT,
  middle_name         TEXT,
  date_of_birth       DATE,
  phone_number        TEXT,
  ghana_id_number     TEXT,
  ghana_id_verified   BOOLEAN DEFAULT FALSE,
  region_id           TEXT,
  cv_url              TEXT,
  cover_letter_url    TEXT,
  ghana_id_card_url   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── GUARANTOR DETAILS ─────────────────────────────────────
CREATE TABLE public.guarantor_details (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_id  UUID REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name      TEXT,
  last_name       TEXT,
  middle_name     TEXT,
  email           TEXT,
  phone_number    TEXT,
  national_id_url TEXT,
  signed_form_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicant_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guarantor_details ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Own profile read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin read all profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- applications
CREATE POLICY "Own application select" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own application insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own draft update"       ON public.applications FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft','rejected'));
CREATE POLICY "Admin select all"       ON public.applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admin update all"       ON public.applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- applicant_details
CREATE POLICY "Own applicant_details select" ON public.applicant_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Own applicant_details insert" ON public.applicant_details FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Own applicant_details update" ON public.applicant_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Admin applicant_details select" ON public.applicant_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- guarantor_details
CREATE POLICY "Own guarantor_details select" ON public.guarantor_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Own guarantor_details insert" ON public.guarantor_details FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Own guarantor_details update" ON public.guarantor_details FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Admin guarantor_details select" ON public.guarantor_details FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── STORAGE BUCKETS ───────────────────────────────────────
-- Run these in Supabase Dashboard → Storage → Create Bucket
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('application-files', 'application-files', false);

-- Storage RLS (if using SQL)
-- CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'application-files');
-- CREATE POLICY "Owner read files" ON storage.objects FOR SELECT TO authenticated
--   USING (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Admin read all files" ON storage.objects FOR SELECT TO authenticated
--   USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
