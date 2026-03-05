import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PdfContractInput {
  templateTitle: string;
  templateBody: string;
  residentName: string;
  signatureDataUrl: string; // base64 PNG: "data:image/png;base64,..."
  signedAt: string;         // ISO date string
  tenantName?: string;
}

/**
 * Generates a signed contract PDF using pdf-lib.
 * Returns the PDF as a Uint8Array ready for upload.
 */
export async function generateSignedContractPdf(
  input: PdfContractInput
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 60;
  const pageWidth = 612;  // Letter width in points
  const pageHeight = 792; // Letter height in points
  const usableWidth = pageWidth - margin * 2;

  // Strip HTML tags for plain text rendering
  const plainBody = input.templateBody
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n$1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // ── Page 1: Contract Body ────────────────────────────────────────────────
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos = pageHeight - margin;

  // Header bar
  page.drawRectangle({
    x: 0,
    y: pageHeight - 80,
    width: pageWidth,
    height: 80,
    color: rgb(0.02, 0.31, 0.38), // #054f62 ≈ brand teal
  });

  // Title in header
  page.drawText('High Value Growth', {
    x: margin,
    y: pageHeight - 35,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(input.templateTitle, {
    x: margin,
    y: pageHeight - 58,
    size: 11,
    font: helvetica,
    color: rgb(0.8, 0.95, 1),
  });

  yPos = pageHeight - 100;

  // Resident / date info
  const infoY = yPos;
  page.drawText(`Resident: ${input.residentName}`, {
    x: margin,
    y: infoY,
    size: 10,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  if (input.tenantName) {
    page.drawText(`Organization: ${input.tenantName}`, {
      x: margin,
      y: infoY - 16,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
  }
  const dateLabel = `Date: ${new Date(input.signedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })}`;
  page.drawText(dateLabel, {
    x: pageWidth - margin - helvetica.widthOfTextAtSize(dateLabel, 10),
    y: infoY,
    size: 10,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  yPos = infoY - 32;

  // Divider
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: pageWidth - margin, y: yPos },
    thickness: 1,
    color: rgb(0.8, 0.85, 0.9),
  });
  yPos -= 20;

  // Body text — word-wrap
  const bodyLines = wrapText(plainBody, timesRoman, 11, usableWidth);
  for (const line of bodyLines) {
    if (yPos < margin + 40) {
      // Add new page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPos = pageHeight - margin;
    }

    const isHeading = line.trim() !== '' && bodyLines[bodyLines.indexOf(line) - 1] === '';
    const font = isHeading ? timesRomanBold : timesRoman;
    const size = isHeading ? 12 : 11;
    const color = isHeading ? rgb(0.02, 0.31, 0.38) : rgb(0.1, 0.1, 0.1);

    if (line.trim() !== '') {
      page.drawText(line, {
        x: margin,
        y: yPos,
        size,
        font,
        color,
        maxWidth: usableWidth,
      });
    }
    yPos -= line.trim() === '' ? 8 : size + 5;
  }

  // ── Signature Page ────────────────────────────────────────────────────────
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  yPos = pageHeight - margin;

  // Signature header
  page.drawRectangle({
    x: 0,
    y: pageHeight - 80,
    width: pageWidth,
    height: 80,
    color: rgb(0.02, 0.31, 0.38),
  });
  page.drawText('Signature Page', {
    x: margin,
    y: pageHeight - 48,
    size: 14,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  yPos = pageHeight - 120;

  page.drawText('The undersigned has read, understood, and agreed to the terms of this agreement.', {
    x: margin,
    y: yPos,
    size: 11,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 40;

  // Signature image
  try {
    const base64Data = input.signatureDataUrl.split(',')[1];
    const sigBytes = Buffer.from(base64Data, 'base64');
    const sigImage = await pdfDoc.embedPng(sigBytes);
    const sigAspect = sigImage.width / sigImage.height;
    const sigWidth = Math.min(240, sigImage.width);
    const sigHeight = sigWidth / sigAspect;

    page.drawImage(sigImage, {
      x: margin,
      y: yPos - sigHeight,
      width: sigWidth,
      height: sigHeight,
    });
    yPos -= sigHeight + 8;
  } catch {
    // If image embedding fails, leave a blank signature area
    page.drawRectangle({
      x: margin,
      y: yPos - 60,
      width: 240,
      height: 60,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 1,
    });
    yPos -= 68;
  }

  // Signature line
  page.drawLine({
    start: { x: margin, y: yPos },
    end: { x: margin + 240, y: yPos },
    thickness: 1,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 14;

  page.drawText(`Resident Signature: ${input.residentName}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });
  yPos -= 16;
  page.drawText(`Date Signed: ${new Date(input.signedAt).toLocaleString('en-US')}`, {
    x: margin,
    y: yPos,
    size: 10,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Footer watermark
  page.drawText('Generated by High Value Growth Platform · hvg.app', {
    x: margin,
    y: 30,
    size: 8,
    font: helvetica,
    color: rgb(0.7, 0.7, 0.7),
  });

  return pdfDoc.save();
}

/** Simple word-wrap: splits text into lines that fit within maxWidth at given font size. */
function wrapText(text: string, font: Awaited<ReturnType<PDFDocument['embedFont']>>, size: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return lines;
}
