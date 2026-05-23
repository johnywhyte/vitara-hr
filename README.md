# Vitara Recruitment Portal

Full-stack Next.js 16 application for Vitara Agricultural E-Commerce's automated hiring process.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Full-stack, server actions, file-based routing |
| Database | **Supabase** (PostgreSQL) | Auth + DB + Storage in one service |
| Auth | Supabase Auth | Email/password + Google OAuth with email verification |
| Storage | Supabase Storage | CV, cover letter, ID card, guarantor docs |
| Email | Resend | Simple API, great DX, reliable deliverability |
| Ghana ID | Hubtel KYC API | Ghana-native identity verification service |
| PDF | pdf-lib | Server-side guarantor form PDF generation |
| UI | Tailwind CSS + custom components | Mobile-first, compact field-agent UX |
| Validation | React Hook Form + Zod | Type-safe forms |

---

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Go to **Storage** → create a bucket named `application-files` (set to **private**)
4. In Storage → Policies, add policies for authenticated upload and owner/admin read

### 2. Supabase Auth config

- Enable **Email** provider (Email Verification ON)
- Enable **Google** provider (add your Google OAuth credentials)
- Set Site URL to your app URL (e.g. `http://localhost:3000`)
- Add redirect URL: `http://localhost:3000/auth/callback`

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_your_key
EMAIL_FROM=Vitara Recruitment <no-reply@vitara.ag>
HUBTEL_CLIENT_ID=          # optional — omit for dev mode (format-check only)
HUBTEL_CLIENT_SECRET=
HUBTEL_API_KEY=
```

### 4. Set up an admin user

After signing up a user, run this in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@yourcompany.com';
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Application Flow

```
Landing → Sign Up → Email Verification
  → Step 1: Personal Details + Ghana ID (auto-verified) + File Uploads
  → Step 2: Guarantor Details + Download/Upload Signed Form
  → Step 3: Review Checklist → Submit (triggers confirmation email)
  → Admin: Approve (→ congratulations email) / Reject (→ reason email, shown on form)
```

## Key Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/signup` / `/login` | Auth (email+password or Google) |
| `/apply/step1` | Personal details form |
| `/apply/step2` | Guarantor details form |
| `/apply/step3` | Review & submit |
| `/admin` | HR dashboard |
| `/admin/applications` | Filterable application list |
| `/admin/applications/[id]` | Full detail + approve/reject |
| `/api/guarantor-form` | Download guarantor PDF |
| `/api/verify-ghana-id` | Ghana Card KYC verification |

## Ghana Card Format

`GHA-XXXXXXXXX-X` (e.g. `GHA-123456789-1`) — auto-verified on input completion via Hubtel KYC API. In development (no Hubtel credentials), format validation is used as a fallback.

## Deployment (Vercel)

1. Push to GitHub
2. Connect repo to Vercel
3. Add all env vars in Vercel project settings
4. Set `NEXT_PUBLIC_APP_URL` to your production URL
5. Update Supabase redirect URLs to include your production domain
