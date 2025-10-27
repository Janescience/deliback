import { NextResponse } from 'next/server';
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

    // Generate HTML content for printing
    const htmlContent = generatePrintHTML(documents, companySettings);
    
    return NextResponse.json({
      success: true,
      html: htmlContent
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message,
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
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
          font-family: '${companySettings.templateSettings.fontFamily}', sans-serif;
          font-size: ${companySettings.templateSettings.fontSize};
          line-height: 1.3;
          margin: 0;
          padding: 10px;
          color: ${companySettings.templateSettings.primaryColor};
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
      
      <script>
        // Remove document title to prevent it showing in headers
        document.title = '';

        // Additional print settings
        window.onbeforeprint = function() {
          document.title = '';

          // Try to set print margins to none programmatically
          if (window.chrome) {
            // Chrome specific settings
            const printSettings = {
              shouldPrintBackgrounds: true,
              shouldPrintSelectionOnly: false,
              mediaType: 'print',
              collate: true,
              copies: 1,
              deviceName: '',
              duplexMode: 0,
              landscape: false,
              margins: {
                marginType: 1, // NO_MARGINS
                marginTop: 0,
                marginBottom: 0,
                marginLeft: 0,
                marginRight: 0
              },
              pageRanges: [],
              printToPDF: false,
              headerFooterEnabled: false,
              title: '',
              url: ''
            };
          }
        };

        // Hide URL and page numbers
        window.onafterprint = function() {
          document.title = '';
        };
      </script>
    </body>
    </html>
  `;
}

