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

      // Ensure content is a proper Buffer for PDF
      const pdfBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
    } else {
      const filename = `documents_${Date.now()}.zip`;

      // Ensure content is a proper Buffer for ZIP
      const zipBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content);

      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
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

    // Generate HTML template using the same template as print
    const html = generatePrintHTML([document], processedSettings);

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
      // Fallback: return HTML content as "PDF" (for development purposes)
      const fallbackContent = `
        PDF Generation Failed - Development Mode
        =======================================
        Document Number: ${document.docNumber}
        Customer: ${document.customer.name}
        Total Amount: ${document.totalAmount}

        Error: ${puppeteerError.message}

        Note: This is a fallback response. Install Chrome/Chromium to enable proper PDF generation.
      `;

      return Buffer.from(fallbackContent, 'utf8');
    }

  } catch (error) {
    throw error;
  }
}

function generatePrintHTML(documents, companySettings) {
  const documentsHTML = documents.map((document, index) => {
    return generateDocumentHTML(document, companySettings, index > 0);
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap');

        @media print {
          body { margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
          @page {
            margin-top: 10mm;
            margin-bottom: 5mm;
            margin-left: 0;
            margin-right: 0;
            size: A4;
          }

          /* Force remove headers and footers */
          @page :first { margin-top: 10mm; }
          @page :left { margin-left: 0; }
          @page :right { margin-right: 0; }

          /* Hide page numbers and headers completely */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }

        * {
          box-sizing: border-box;
        }

        body {
          font-family: '${companySettings.templateSettings?.fontFamily || 'Sarabun'}', sans-serif;
          font-size: ${companySettings.templateSettings?.fontSize || '13px'};
          line-height: 1.3;
          margin: 0;
          padding: 10px;
          color: ${companySettings.templateSettings?.primaryColor || '#000'};
        }

        @media print {
          body {
            padding: 5mm 8mm;
            margin: 0;
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
      ${documentsHTML}
    </body>
    </html>
  `;
}

