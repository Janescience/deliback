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

          * { box-sizing: border-box; }

          body {
            font-family: '${processedSettings.templateSettings?.fontFamily || 'Sarabun'}', sans-serif;
            font-size: ${processedSettings.templateSettings?.fontSize || '13px'};
            line-height: 1.3;
            margin: 0;
            padding: 10px;
            color: ${processedSettings.templateSettings?.primaryColor || '#000'};
          }

          .document-container {
            margin-top: 20mm;
            page-break-after: always;
          }

          .document-container:first-child {
            margin-top: 0;
          }

          @media print {
            body {
              padding: 0;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            @page {
              margin-top: 20mm;
              margin-bottom: 15mm;
              margin-left: 15mm;
              margin-right: 15mm;
              size: A4;
            }

            .document-container {
              margin-top: 0;
              padding-top: 10mm;
              min-height: calc(100vh - 40mm);
              page-break-after: always;
              break-after: page;
            }

            .document-container:first-child {
              padding-top: 0;
            }

            .document-container:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            /* Safari print specific fixes */
            @media print and (-webkit-min-device-pixel-ratio: 0) {
              table {
                border-collapse: separate !important;
                border-spacing: 0 !important;
                border: 2px solid #000 !important;
              }

              table td, table th {
                border: 1px solid #000 !important;
                border-right: 1px solid #000 !important;
                border-bottom: 1px solid #000 !important;
              }

              table td:last-child, table th:last-child {
                border-right: 1px solid #000 !important;
              }

              table tr:last-child td {
                border-bottom: 1px solid #000 !important;
              }
            }

            /* Mobile Safari specific */
            @supports (-webkit-touch-callout: none) {
              @page {
                margin-top: 25mm !important;
                margin-bottom: 20mm !important;
                margin-left: 20mm !important;
                margin-right: 20mm !important;
              }

              .document-container {
                padding-top: 15mm !important;
              }

              .document-container:first-child {
                padding-top: 5mm !important;
              }

              table {
                border-collapse: separate !important;
                border-spacing: 0 !important;
                border: 2px solid #000 !important;
              }

              table td, table th {
                border: 1px solid #000 !important;
                -webkit-print-color-adjust: exact !important;
              }
            }
          }
        </style>
      </head>
      <body>
        ${documentHTML}
      </body>
      </html>
    `;

    // Try Puppeteer first
    try {
      // Launch Puppeteer to convert HTML to PDF
      let browser;

      if (process.env.NODE_ENV === 'production') {
        // Use puppeteer-core with Chromium for production
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
            '--allow-running-insecure-content'
          ],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: 'new',
          ignoreHTTPSErrors: true,
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

      // Generate PDF with better compatibility settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        tagged: false,
        outline: false
      });

      await browser.close();

      return pdfBuffer;

    } catch (puppeteerError) {
      console.error('Puppeteer PDF generation failed:', puppeteerError.message);

      // Use jsPDF as fallback
      try {
        const { jsPDF } = require('jspdf');

        const doc = new jsPDF();

        // Add title
        doc.setFontSize(16);
        doc.text(`${document.docType === 'receipt' ? 'ใบเสร็จ' : document.docType === 'billing' ? 'ใบวางบิล' : 'ใบส่งสินค้า'}`, 105, 20, { align: 'center' });

        // Add document info
        doc.setFontSize(12);
        doc.text(`Document Number: ${document.docNumber}`, 20, 40);
        doc.text(`Customer: ${document.customer.name}`, 20, 50);
        doc.text(`Date: ${new Date(document.date).toLocaleDateString('th-TH')}`, 20, 60);
        doc.text(`Total Amount: ${document.totalAmount.toFixed(2)} THB`, 20, 70);

        // Add items as simple text if available
        if (document.items && document.items.length > 0) {
          let yPos = 80;
          doc.text('Items:', 20, yPos);
          yPos += 10;

          document.items.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.name} - Qty: ${item.quantity.toFixed(2)} - Price: ${item.unitPrice.toFixed(2)} - Total: ${item.total.toFixed(2)}`, 20, yPos);
            yPos += 10;
          });
        }

        // Add note about fallback
        const finalY = 130;
        doc.setFontSize(8);
        doc.text('Note: This PDF was generated using fallback method due to server limitations.', 20, finalY);

        return Buffer.from(doc.output('arraybuffer'));

      } catch (jsPdfError) {
        console.error('jsPDF fallback also failed:', jsPdfError.message);

        // Final fallback - create a minimal valid PDF
        const minimalPdf = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
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
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
72 720 Td
(PDF Generation Failed) Tj
0 -20 Td
(Document: ${document.docNumber}) Tj
0 -20 Td
(Customer: ${document.customer.name}) Tj
0 -20 Td
(Amount: ${document.totalAmount}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000074 00000 n
0000000120 00000 n
0000000179 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
380
%%EOF`;

        return Buffer.from(minimalPdf, 'utf8');
      }
    }

  } catch (error) {
    throw error;
  }
}


