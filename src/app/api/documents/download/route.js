import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import JSZip from 'jszip';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import CompanySettings from '@/models/CompanySettings';
import { generateDocumentHTML } from '@/lib/documentTemplate';

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { documents, userId = 'default' } = body;

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }

    // Get company settings
    const companySettings = await CompanySettings.getSettings(userId);

    const content = await generateMockZip(documents, companySettings);

    // Determine filename and content type based on number of documents
    if (documents.length === 1) {
      const filename = `${documents[0].customer.name}_${documents[0].docNumber}.pdf`;
      const encodedFilename = encodeURIComponent(filename);

      // Ensure content is a proper Buffer for PDF
      const pdfBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
    } else {
      const filename = `documents_${Date.now()}.zip`;
      const encodedFilename = encodeURIComponent(filename);

      // Ensure content is a proper Buffer for ZIP
      const zipBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
          'Content-Length': zipBuffer.length.toString(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
    }
    
  } catch (error) {
    console.error('=== Document Download Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('================================');
    
    return NextResponse.json(
      { 
        error: error.message,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}

async function generateMockZip(documents, companySettings) {
  try {
    const files = await Promise.all(documents.map(async (doc) => {
      const content = await generatePDF(doc, companySettings);

      return {
        name: `${doc.customer.name}_${doc.docNumber}.pdf`,
        content: content
      };
    }));

    // For single file, return the PDF content directly
    if (files.length === 1) {
      return files[0].content;
    }

    // Create proper ZIP using JSZip
    const zip = new JSZip();

    files.forEach((file) => {
      zip.file(file.name, file.content);
    });

    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });

    return Buffer.from(zipBuffer);
  } catch (error) {
    throw error;
  }
}

async function generatePDF(document, companySettings) {
  try {
    console.log('Starting PDF generation for document:', document.docNumber);

    // Convert logo URL to base64 if available for better PDF compatibility
    let processedSettings = JSON.parse(JSON.stringify(companySettings)); // Deep clone to preserve all data

    if (processedSettings.logo?.url) {
      try {
        const logoResponse = await axios.get(processedSettings.logo.url, {
          responseType: 'arraybuffer',
          timeout: 5000
        });

        const base64 = Buffer.from(logoResponse.data).toString('base64');
        const mimeType = logoResponse.headers['content-type'] || 'image/png';
        processedSettings.logo.url = `data:${mimeType};base64,${base64}`;
      } catch (logoError) {
        processedSettings.logo.url = '';
      }
    }

    // Generate HTML template with proper structure
    const documentHTML = generateDocumentHTML(document, processedSettings);
    const html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap');

          * {
            box-sizing: border-box;
          }

          body {
            font-family: '${processedSettings.templateSettings?.fontFamily || 'Sarabun'}', sans-serif;
            font-size: ${processedSettings.templateSettings?.fontSize || '13px'};
            line-height: 1.3;
            margin: 0;
            padding: 10px;
            color: ${processedSettings.templateSettings?.primaryColor || '#000'};
          }

          @media print {
            body {
              padding: 5mm 8mm;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            .document-container {
              page-break-after: always !important;
              break-after: page !important;
              min-height: 90vh !important;
            }

            .document-container:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          }

          /* Mobile-specific styles */
          @media screen and (max-width: 768px) {
            .document-container {
              margin-bottom: 40px;
              padding-bottom: 40px;
              border-bottom: 2px solid #ddd;
            }

            .document-container:last-child {
              border-bottom: none;
            }
          }

          .header {
            text-align: right;
            margin-bottom: 15px;
          }

          .doc-title {
            background-color: #555;
            color: white;
            padding: 8px 15px;
            font-weight: bold;
            font-size: 14px;
          }

          .company-header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }

          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 2px;
          }

          .company-details {
            font-size: 11px;
            line-height: 1.2;
          }

          .info-table {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 12px;
          }

          .info-table td {
            padding: 4px 8px;
            border: 1px solid #000;
            vertical-align: top;
          }

          .info-header {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 11px;
          }

          .product-table {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 12px;
          }

          .product-table th {
            background-color: #555;
            color: white;
            padding: 8px 4px;
            text-align: center;
            font-size: 11px;
            font-weight: bold;
          }

          .product-table td {
            padding: 6px 4px;
            border: 1px solid #000;
            vertical-align: top;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }

          .totals-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .totals-left {
            flex: 1;
            padding-right: 20px;
          }

          .totals-right {
            width: 250px;
          }

          .totals-table {
            width: 100%;
            border: 1px solid #000;
            border-collapse: collapse;
          }

          .totals-table td {
            padding: 4px 8px;
            border: 1px solid #000;
            font-size: 12px;
          }


        </style>
      </head>
      <body>
        ${documentHTML}
      </body>
      </html>
    `;

    // Try Puppeteer first, with fallback to jsPDF if it fails
    try {
        // Launch Puppeteer to convert HTML to PDF
        let browser;

        if (process.env.NODE_ENV === 'production') {
        // Use puppeteer-core with Chromium for production
        const executablePath = await chromium.executablePath();
        console.log('Using Chromium executable:', executablePath);

        browser = await puppeteerCore.launch({
          args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath,
          headless: 'new',
          ignoreHTTPSErrors: true,
          timeout: 10000,
        });
      } else {
        // Use regular puppeteer for development (uses local Chrome)
        browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ],
          ignoreHTTPSErrors: true,
        });
      }

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      // Generate PDF to match print format exactly
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        tagged: false,
        outline: false
      });

      await browser.close();

      return pdfBuffer;

    } catch (puppeteerError) {
      console.error('Puppeteer PDF generation failed:', puppeteerError.message);
      console.error('Error stack:', puppeteerError.stack);
      console.error('Falling back to jsPDF generation...');
    }

    // Use jsPDF as fallback - create a more comprehensive document
    try {
        const { jsPDF } = require('jspdf');


        // Try to parse the HTML and extract structured data, or fall back to simple format
        console.log('Creating enhanced jsPDF document...');

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        // Set font for better compatibility
        doc.setFont('helvetica');

        // Company header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(companySettings.companyName || 'Company', 105, 20, { align: 'center' });

        // Company details
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        if (companySettings.address?.line1) {
          doc.text(companySettings.address.line1, 105, 28, { align: 'center' });
        }
        if (companySettings.address?.line2) {
          doc.text(companySettings.address.line2, 105, 32, { align: 'center' });
        }
        if (companySettings.telephone) {
          doc.text(`Tel: ${companySettings.telephone}`, 105, 36, { align: 'center' });
        }
        if (companySettings.taxId) {
          doc.text(`Tax ID: ${companySettings.taxId}`, 105, 40, { align: 'center' });
        }

        // Document title
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const thaiTitle = document.docType === 'receipt' ? 'ใบเสร็จ' :
                         document.docType === 'billing' ? 'ใบวางบิล' : 'ใบส่งสินค้า';
        const englishTitle = document.docType === 'receipt' ? 'Receipt' :
                            document.docType === 'billing' ? 'Invoice' : 'Delivery Note';
        doc.text(`${thaiTitle} / ${englishTitle}`, 105, 55, { align: 'center' });

        // Document info table
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let yPos = 75;

        // Left column
        doc.text('เลขที่เอกสาร / Document No:', 20, yPos);
        doc.text(document.docNumber || 'N/A', 75, yPos);
        yPos += 6;

        doc.text('วันที่ / Date:', 20, yPos);
        doc.text(new Date(document.date).toLocaleDateString('th-TH'), 75, yPos);
        yPos += 6;

        // Customer info
        doc.text('ลูกค้า / Customer:', 20, yPos);
        doc.text(document.customer?.name || 'N/A', 75, yPos);
        yPos += 6;

        if (document.customer?.address) {
          doc.text('ที่อยู่ / Address:', 20, yPos);
          const address = document.customer.address;
          doc.text(address, 75, yPos, { maxWidth: 100 });
          yPos += 12;
        }

        // Items table header
        yPos += 10;
        doc.setFont('helvetica', 'bold');
        doc.text('รายการ / Items', 20, yPos);
        doc.text('จำนวน', 120, yPos);
        doc.text('ราคา/หน่วย', 140, yPos);
        doc.text('รวม', 170, yPos);
        yPos += 8;

        // Draw line under header
        doc.line(20, yPos - 2, 190, yPos - 2);

        // Items
        doc.setFont('helvetica', 'normal');
        if (document.items && document.items.length > 0) {
          document.items.forEach((item, index) => {
            if (yPos > 250) { // Check if we need a new page
              doc.addPage();
              yPos = 20;
            }

            doc.text(`${index + 1}. ${item.name}`, 20, yPos, { maxWidth: 90 });
            doc.text(item.quantity?.toFixed(2) || '0', 120, yPos);
            doc.text(item.unitPrice?.toFixed(2) || '0', 140, yPos);
            doc.text(item.total?.toFixed(2) || '0', 170, yPos);
            yPos += 6;
          });
        }

        // Total section
        yPos += 10;
        doc.line(20, yPos - 2, 190, yPos - 2);
        doc.setFont('helvetica', 'bold');
        doc.text('รวมทั้งสิ้น / Total:', 120, yPos);
        doc.text(`${document.totalAmount?.toFixed(2) || '0.00'} บาท`, 170, yPos);

        // Generate PDF
        const pdfOutput = doc.output('arraybuffer');
        return Buffer.from(pdfOutput);

      } catch (jsPdfError) {
        console.error('jsPDF fallback also failed:', jsPdfError.message);

        // Final fallback - create a compatible minimal PDF
        const docNum = String(document.docNumber || 'N/A').substring(0, 20);
        const custName = String(document.customer?.name || 'N/A').substring(0, 30);
        const amount = String(document.totalAmount || '0').substring(0, 15);

        const minimalPdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/Producer (Halem Farm Backend)
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 595 842]
/Resources <<
  /Font <<
    /F1 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica
    >>
  >>
>>
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 350
>>
stream
BT
/F1 16 Tf
50 750 Td
(Document) Tj
0 -30 Td
/F1 12 Tf
(Document Number: ${docNum}) Tj
0 -20 Td
(Customer: ${custName}) Tj
0 -20 Td
(Amount: ${amount} THB) Tj
0 -40 Td
(Note: PDF generated with fallback method) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000078 00000 n
0000000120 00000 n
0000000350 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
450
%%EOF`;

        return Buffer.from(minimalPdf, 'utf8');
      }

  } catch (error) {
    console.error('All PDF generation methods failed:', error.message);
    throw error;
  }
}


