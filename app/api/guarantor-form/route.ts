import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET() {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { height } = page.getSize()

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const green = rgb(0.176, 0.416, 0.31) // #2D6A4F
  const gray = rgb(0.42, 0.46, 0.49) // #6C757D
  const dark = rgb(0.2, 0.22, 0.25) // #343A40
  const black = rgb(0, 0, 0)

  const margin = 56
  let y = height - 56

  // Header bar
  page.drawRectangle({ x: 0, y: height - 90, width: 595, height: 90, color: green })

  page.drawText('VITARA AGRICULTURAL E-COMMERCE', {
    x: margin,
    y: height - 32,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
    opacity: 0.7,
  })
  page.drawText('Guarantor Declaration Form', {
    x: margin,
    y: height - 52,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  })
  page.drawText('Recruitment Process Automation — Candidate Support Document', {
    x: margin,
    y: height - 70,
    size: 9,
    font: regular,
    color: rgb(1, 1, 1),
    opacity: 0.8,
  })

  y = height - 110

  // Introduction
  const drawText = (text: string, opts: { size?: number; font?: typeof bold; color?: typeof dark; indent?: number }) => {
    const { size = 10, font = regular, color = dark, indent = 0 } = opts
    const words = text.split(' ')
    let line = ''
    const maxWidth = 595 - margin * 2 - indent

    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      const testWidth = font.widthOfTextAtSize(test, size)
      if (testWidth > maxWidth && line) {
        page.drawText(line, { x: margin + indent, y, size, font, color })
        y -= size + 4
        line = word
      } else {
        line = test
      }
    }
    if (line) {
      page.drawText(line, { x: margin + indent, y, size, font, color })
      y -= size + 4
    }
  }

  y -= 10
  page.drawText('PURPOSE OF THIS FORM', { x: margin, y, size: 10, font: bold, color: green })
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.72, 0.89, 0.78) })
  y -= 14

  drawText(
    'This form is issued by Vitara Agricultural E-Commerce as part of its recruitment process. All applicants are required to provide a guarantor who can vouch for their character, integrity, and reliability. The guarantor must read, complete, and sign this form, which will then be uploaded by the applicant to the recruitment portal.',
    { size: 9.5 }
  )

  y -= 10
  page.drawText('INSTRUCTIONS', { x: margin, y, size: 10, font: bold, color: green })
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.72, 0.89, 0.78) })
  y -= 14

  const instructions = [
    '1. This form must be completed in full by the guarantor (not the applicant).',
    '2. All fields are mandatory. Incomplete forms will not be accepted.',
    '3. The guarantor must attach a copy of a valid national ID.',
    '4. After signing, return this form to the applicant to upload on the recruitment portal.',
  ]
  for (const inst of instructions) {
    page.drawText(inst, { x: margin, y, size: 9.5, font: regular, color: dark })
    y -= 16
  }

  y -= 10

  // Candidate section
  page.drawText('SECTION A — APPLICANT INFORMATION (for guarantor reference)', {
    x: margin, y, size: 10, font: bold, color: green,
  })
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.72, 0.89, 0.78) })
  y -= 16

  const fields = [
    "Applicant's Full Name:",
    "Applicant's Phone Number:",
    "Position Applied For:",
  ]
  for (const f of fields) {
    page.drawText(f, { x: margin, y, size: 9, font: bold, color: gray })
    page.drawLine({ start: { x: margin + 130, y: y - 2 }, end: { x: 595 - margin, y: y - 2 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
    y -= 22
  }

  y -= 10
  page.drawText('SECTION B — GUARANTOR INFORMATION', { x: margin, y, size: 10, font: bold, color: green })
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.72, 0.89, 0.78) })
  y -= 16

  const guarantorFields = [
    'Full Name (as on ID):',
    'National ID Number:',
    'Relationship to Applicant:',
    'Occupation / Employer:',
    'Phone Number:',
    'Email Address:',
    'Residential Address:',
    '',
    '',
  ]
  for (const f of guarantorFields) {
    if (f) page.drawText(f, { x: margin, y, size: 9, font: bold, color: gray })
    page.drawLine({ start: { x: margin + (f ? 140 : 0), y: y - 2 }, end: { x: 595 - margin, y: y - 2 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
    y -= 22
  }

  y -= 10
  page.drawText('SECTION C — GUARANTOR DECLARATION', { x: margin, y, size: 10, font: bold, color: green })
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.72, 0.89, 0.78) })
  y -= 14

  const declaration = 'I, the undersigned, hereby declare that I personally know the applicant named above and can vouch for their good character, trustworthiness, and suitability for employment at Vitara Agricultural E-Commerce. I understand that by signing this form, I am taking responsibility as a guarantor for the applicant\'s conduct during their employment. I confirm that all information provided in this form is true and accurate to the best of my knowledge.'

  drawText(declaration, { size: 9.5 })

  y -= 16
  page.drawText('SECTION D — SIGNATURE', { x: margin, y, size: 10, font: bold, color: green })
  y -= 4
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.72, 0.89, 0.78) })
  y -= 20

  // Signature boxes
  const boxWidth = 210
  const boxHeight = 60

  // Left box — Guarantor
  page.drawRectangle({ x: margin, y: y - boxHeight, width: boxWidth, height: boxHeight, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, color: rgb(0.98, 0.98, 0.98) })
  page.drawText("Guarantor's Signature", { x: margin + 6, y: y - boxHeight + 8, size: 8, font: bold, color: gray })
  page.drawLine({ start: { x: margin, y: y - 4 }, end: { x: margin + boxWidth, y: y - 4 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  // Right box — Date
  const rightX = 595 - margin - boxWidth
  page.drawRectangle({ x: rightX, y: y - boxHeight, width: boxWidth, height: boxHeight, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5, color: rgb(0.98, 0.98, 0.98) })
  page.drawText('Date (DD/MM/YYYY)', { x: rightX + 6, y: y - boxHeight + 8, size: 8, font: bold, color: gray })
  page.drawLine({ start: { x: rightX, y: y - 4 }, end: { x: rightX + boxWidth, y: y - 4 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

  y -= boxHeight + 20

  // Official use
  page.drawRectangle({ x: margin, y: y - 40, width: 595 - margin * 2, height: 40, color: rgb(0.97, 0.97, 0.97), borderColor: rgb(0.88, 0.88, 0.88), borderWidth: 0.5 })
  page.drawText('FOR OFFICIAL USE ONLY', { x: margin + 8, y: y - 12, size: 7, font: bold, color: gray })
  page.drawText('Verified by HR: ________________________   Date: ______________   Status: ___________________', {
    x: margin + 8, y: y - 28, size: 7.5, font: regular, color: gray,
  })

  y -= 56

  // Footer
  page.drawLine({ start: { x: margin, y }, end: { x: 595 - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 12
  page.drawText('© 2026 Vitara Agricultural E-Commerce · Ghana · This is an official recruitment document — do not alter.', {
    x: margin, y, size: 7.5, font: regular, color: gray,
  })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="vitara-guarantor-form.pdf"',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
