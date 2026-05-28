import { Resend } from 'resend'

// Lazy singleton — instantiated on first use so the module can be imported
// at build time even when RESEND_API_KEY is not present in the build env.
let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? 'Vitara Recruitment <no-reply@vitara.ag>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Vitara Recruitment</title>
</head>
<body style="margin:0;padding:0;background:#FCF5EB;font-family:'Segoe UI',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#71001D;padding:24px 28px;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Vitara Agricultural E-Commerce</p>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Recruitment Portal</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            ${content}
          </td>
        </tr>
        <tr>
          <td style="background:#F8F9FA;padding:14px 28px;border-top:1px solid #E9ECEF;text-align:center;">
            <p style="margin:0;font-size:10px;color:#6C757D;">© 2026 Vitara Agricultural E-Commerce · Ghana · <a href="${BASE_URL}" style="color:#71001D;">vitara.ag</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export async function sendApplicationSubmittedEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Application Received — Vitara Recruitment',
    html: baseHtml(`
      <h2 style="margin:0 0 8px;color:#71001D;font-size:18px;">Application Received!</h2>
      <p style="margin:0 0 16px;color:#343A40;font-size:14px;">Dear ${name},</p>
      <p style="margin:0 0 16px;color:#343A40;font-size:14px;">Thank you for submitting your application to <strong>Vitara Agricultural E-Commerce</strong>. We have successfully received your application and it is now under review by our HR team.</p>
      <div style="background:#FFF3CD;border-left:3px solid #FFB000;border-radius:6px;padding:12px 16px;margin:0 0 20px;">
        <p style="margin:0;color:#71001D;font-size:13px;font-weight:600;">What happens next?</p>
        <p style="margin:6px 0 0;color:#71001D;font-size:12px;">Our team will review your application within 3–5 business days. You will receive an email notification once a decision has been made.</p>
      </div>
      <a href="${BASE_URL}/apply/step3" style="display:inline-block;background:#71001D;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;">View Application</a>
    `),
  })
}

export async function sendApplicationApprovedEmail(to: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Congratulations! Application Approved — Vitara Recruitment',
    html: baseHtml(`
      <div style="background:#71001D;border-radius:8px;padding:24px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:32px;">🎉</p>
        <h2 style="margin:0;color:#fff;font-size:20px;font-weight:700;">Congratulations, ${name}!</h2>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your application has been approved</p>
      </div>
      <p style="margin:0 0 14px;color:#343A40;font-size:14px;">We are delighted to inform you that your application to <strong>Vitara Agricultural E-Commerce</strong> has been <strong>approved</strong> by our HR team.</p>
      <div style="background:#FFF3CD;border-left:3px solid #FFB000;border-radius:6px;padding:12px 16px;margin:0 0 20px;">
        <p style="margin:0;color:#71001D;font-size:13px;font-weight:600;">Next Steps</p>
        <p style="margin:6px 0 0;color:#71001D;font-size:12px;">You will receive a separate email shortly with details regarding your interview schedule or onboarding process. Please keep an eye on your inbox and ensure you check your spam folder too.</p>
      </div>
      <p style="margin:0;color:#6C757D;font-size:12px;">We look forward to welcoming you to the Vitara team!</p>
    `),
  })
}

export async function sendApplicationRejectedEmail(
  to: string,
  name: string,
  reason: string
) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: 'Application Update — Vitara Recruitment',
    html: baseHtml(`
      <h2 style="margin:0 0 8px;color:#343A40;font-size:18px;">Application Status Update</h2>
      <p style="margin:0 0 16px;color:#343A40;font-size:14px;">Dear ${name},</p>
      <p style="margin:0 0 16px;color:#343A40;font-size:14px;">Thank you for your interest in joining <strong>Vitara Agricultural E-Commerce</strong>. After careful review of your application, we regret to inform you that we are unable to move forward with your application at this time.</p>
      <div style="background:#FFE5E5;border-left:3px solid #C0392B;border-radius:6px;padding:12px 16px;margin:0 0 20px;">
        <p style="margin:0;color:#C0392B;font-size:13px;font-weight:600;">Reason for decision</p>
        <p style="margin:6px 0 0;color:#C0392B;font-size:12px;">${reason}</p>
      </div>
      <p style="margin:0 0 16px;color:#343A40;font-size:13px;">You may log back into your application portal to review the feedback and make corrections if applicable.</p>
      <a href="${BASE_URL}/apply/step1" style="display:inline-block;background:#71001D;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:600;">View Application</a>
      <p style="margin:16px 0 0;color:#6C757D;font-size:12px;">We wish you the best in your future endeavours.</p>
    `),
  })
}
