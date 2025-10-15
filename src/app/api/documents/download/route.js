import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request) {
  try {
    console.log('=== Document Download API Called ===');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { documents } = body;
    
    if (!documents || documents.length === 0) {
      console.log('Error: No documents provided');
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }
    
    console.log(`Processing ${documents.length} documents for download`);
    
    // For now, return mock ZIP data
    // Later this will generate actual PDFs and zip them
    console.log('Generating mock ZIP content...');
    const mockZipContent = await generateMockZip(documents);
    console.log('Mock ZIP generated, size:', mockZipContent.length, 'bytes');
    
    const filename = `documents_${Date.now()}.zip`;
    console.log('Sending ZIP file:', filename);
    
    return new NextResponse(mockZipContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
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

async function generateMockZip(documents) {
  try {
    console.log('=== Generating Mock ZIP ===');
    console.log('Documents to process:', documents.length);
    
    // Mock ZIP file content (minimal ZIP structure)
    // In a real implementation, you would use a library like 'archiver' or 'jszip'
    const files = await Promise.all(documents.map(async (doc, index) => {
      console.log(`Processing document ${index + 1}:`, {
        customer: doc.customer?.name,
        docNumber: doc.docNumber,
        docType: doc.docType
      });
      
      const content = await generatePDF(doc);
      
      return {
        name: `${doc.customer.name}_${doc.docNumber}.pdf`,
        content: content
      };
    }));
    
    console.log(`Generated ${files.length} file entries`);
    
    // For single file, return the content directly without ZIP structure
    if (files.length === 1) {
      console.log('Returning single file content');
      const buffer = Buffer.from(files[0].content, 'utf8');
      console.log('Single file buffer created, size:', buffer.length);
      console.log('=========================');
      return buffer;
    }
    
    // Simple mock ZIP structure for multiple files
    let zipContent = 'PK\x03\x04'; // ZIP file header
    
    files.forEach((file, index) => {
      console.log(`Adding file ${index + 1} to ZIP:`, file.name);
      zipContent += file.name + '\n';
      zipContent += file.content + '\n';
    });
    
    zipContent += 'PK\x05\x06'; // ZIP end header
    
    const buffer = Buffer.from(zipContent, 'utf8');
    console.log('ZIP buffer created, size:', buffer.length);
    console.log('=========================');
    
    return buffer;
  } catch (error) {
    console.error('Error in generateMockZip:', error);
    throw error;
  }
}

async function generatePDF(document) {
  try {
    console.log('Generating PDF for:', document.customer?.name, document.docNumber);
    
    const docTypeText = document.docType === 'delivery_note' ? 'ใบส่งสินค้า' :
                        document.docType === 'billing' ? 'ใบวางบิล' : 'ใบเสร็จ';
    
    // Generate HTML template
    const html = generateHTMLTemplate(document, docTypeText);
    
    // Launch Puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    });
    
    await browser.close();
    
    console.log('PDF generated successfully, size:', pdfBuffer.length);
    return pdfBuffer;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

function generateHTMLTemplate(document, docTypeText) {
  // Handle different date fields for different document types
  const dateFormat = document.docType === 'billing'
    ? new Date(document.actualBillingDate).toLocaleDateString('th-TH')
    : new Date(document.date).toLocaleDateString('th-TH');
  const dueDateFormat = new Date(document.dueDate).toLocaleDateString('th-TH');
  
  const payMethodText = document.payMethod === 'cash' ? 'เงินสด' : 
                       document.payMethod === 'transfer' ? 'เงินโอน' : 
                       document.payMethod === 'credit' ? 'เครดิต' : 'อื่นๆ';

  // Calculate subtotal and VAT
  const subtotal = document.totalAmount;
  const vat = subtotal * 0.07;
  const netTotal = subtotal + vat;

  return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Sarabun', sans-serif;
          font-size: 13px;
          line-height: 1.3;
          margin: 0;
          padding: 15px;
          color: #000;
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
        
        .doc-info {
          display: flex;
          margin-bottom: 15px;
        }
        
        .doc-info-left {
          flex: 1;
        }
        
        .doc-info-right {
          flex: 1;
          text-align: right;
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
        
        .product-table tbody tr {
          min-height: 25px;
        }
        
        .empty-rows {
          height: 200px;
          border: 1px solid #000;
        }
        
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .customer-name-row {
          font-weight: bold;
        }
        
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
        
        .payment-info {
          font-size: 11px;
          margin-bottom: 20px;
        }
        
        .signatures {
          display: flex;
          justify-content: space-around;
          margin-top: 30px;
        }
        
        .signature-box {
          text-align: center;
          width: 150px;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          margin: 30px 10px 5px 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="doc-title">${docTypeText}<br/>${document.docType === 'billing' ? 'Billing Statement' : 'Delivery Sheet'}</div>
      </div>
      
      <div class="company-header">
        <div class="company-name">HALEM FARM</div>
        <div class="company-details">
          198 ม.9 บ้านห้วยลาดอาย ต.ขุนดินเถื่อ<br/>
          อ.ดูลำปี จ.ขกรรเขียว การค์โปรดแรด 30170<br/>
          โทร (+66) 095736589<br/>
          เลขประจำตัวผู้เสียภาษี 34090003658912
        </div>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="info-header" width="15%">รหัสลูกค้า/เลขประจำตัวผู้เสียภาษี<br/>Tax ID</td>
          <td width="35%">${document.customer.taxId || '0305565004605'}</td>
          <td class="info-header" width="15%">${document.docType === 'billing' ? 'เลขที่ใบวางบิล' : 'เลขที่ใบส่งสินค้า'}<br/>-</td>
          <td width="35%">${document.docNumber}</td>
        </tr>
        <tr>
          <td class="info-header">ชื่อลูกค้า<br/>Customer</td>
          <td>${document.customer.companyName || document.customer.name}</td>
          <td class="info-header">${document.docType === 'billing' ? 'วันที่วางบิล<br/>กำหนดชำระ' : 'วันที่ทำรายการ<br/>กำหนดชำระสินค้า'}</td>
          <td>${dateFormat}<br/>${dueDateFormat}</td>
        </tr>
        <tr>
          <td class="info-header">ที่อยู่<br/>Address</td>
          <td colspan="3">${document.customer.address || ''}</td>
        </tr>
        <tr>
          <td class="info-header">โทรศัพท์/Phone<br/>อีเมล/Email</td>
          <td>${document.customer.telephone || ''}</td>
          <td class="info-header">${document.docType === 'billing' ? 'รอบบิล<br/>Period' : ''}</td>
          <td>${document.docType === 'billing' ? document.periodDisplay || '' : ''}</td>
        </tr>
      </table>
      
      <table class="product-table">
        <thead>
          <tr>
            <th width="8%">ลำดับ<br/>Item No.</th>
            <th width="40%">ชื่อสินค้าหรือเรียเอียด<br/>Product Description</th>
            <th width="12%">จำนวน<br/>Quantity</th>
            <th width="15%">ราคาต่อหน่วย<br/>Unit Price</th>
            <th width="15%">จำนวนเงิน<br/>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${document.docType === 'billing'
            ? document.deliveryNotes.map((note, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${note.description}</td>
                  <td class="text-center">${note.quantity.toFixed(2)} กก.</td>
                  <td class="text-right">-</td>
                  <td class="text-right">${Math.round(note.amount).toFixed(2)}</td>
                </tr>
              `).join('')
            : document.items.map((item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.name}</td>
                  <td class="text-center">${item.quantity.toFixed(2)}</td>
                  <td class="text-right">${Math.round(item.unitPrice).toFixed(2)}</td>
                  <td class="text-right">${Math.round(item.total).toFixed(2)}</td>
                </tr>
              `).join('')
          }
          ${Array.from({
            length: Math.max(0, 8 - (document.docType === 'billing' ? document.deliveryNotes.length : document.items.length))
          }, (_, i) => `
            <tr>
              <td class="text-center">&nbsp;</td>
              <td>&nbsp;</td>
              <td class="text-center">&nbsp;</td>
              <td class="text-right">&nbsp;</td>
              <td class="text-right">&nbsp;</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals-section">
        <div class="totals-left">
          <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold;">หมายเหตุ</td>
              <td style="border: 1px solid #000; padding: 4px 8px;">${document.customer.name}</td>
            </tr>
          </table>
          
          <div style="margin-top: 15px; font-size: 11px;">
            <strong>ส่วนรีซีปป์เอกสารสำหรับ</strong><br/>
            <strong>ชำระเงิน</strong><br/>
            <div style="margin-top: 10px;">
              <strong>เครดิต</strong> &nbsp;&nbsp;&nbsp; ระบบการกินสินค้าสิน 15 ของเดือน<br/>
              <strong>ภาษีมูลค่าเพิ่ม/เอกสารกำกับต่างๆสำหรับใน</strong>
            </div>
            
            <div style="margin-top: 20px;">
              <strong>การสอบสำรองเสียมค่า</strong> งานควบรเขาขำ อีก 7 วันหลังจากการเวลา
            </div>
          </div>
        </div>
        
        <div class="totals-right">
          <table class="totals-table">
            <tr>
              <td>รวมค่าหบนด์น</td>
              <td class="text-right">${Math.round(subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td>ภาษีมูลค่าเพิ่ม (Vat) 7%</td>
              <td class="text-right">${Math.round(vat).toFixed(2)}</td>
            </tr>
            <tr style="border-bottom: 2px solid #000;">
              <td>ชำระเงินสุทธิสุด / Net Total</td>
              <td class="text-right">${Math.round(netTotal).toFixed(2)}</td>
            </tr>
          </table>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-center;">ผู้อนุมัติ</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-center;">ผู้ส่งสินค้า</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-center;">ผู้รับสินค้า</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-center;">
                วันที่ &nbsp;&nbsp;......../......../..........
              </td>
            </tr>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
}