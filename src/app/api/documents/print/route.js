import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    
    const body = await request.json();
    
    const { documents } = body;
    
    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents provided' }, { status: 400 });
    }
    
    
    // Generate HTML content for printing
    const htmlContent = generatePrintHTML(documents);
    
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

function generatePrintHTML(documents) {
  const documentsHTML = documents.map((document, index) => {
    return generateDocumentHTML(document, index > 0);
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
            margin: 15mm;
            size: A4;
          }
          
          /* Remove all browser default headers and footers */
          @page :first { margin-top: 15mm; }
          @page :left { margin-left: 15mm; }  
          @page :right { margin-right: 15mm; }
          
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
        };
      </script>
    </body>
    </html>
  `;
}

function generateDocumentHTML(document, isPageBreak = false) {
  // Handle different date fields for different document types
  const dateFormat = document.docType === 'billing'
    ? new Date(document.actualBillingDate).toLocaleDateString('th-TH')
    : new Date(document.date).toLocaleDateString('th-TH');
  const docTypeText = document.docType === 'delivery_note' ? 'ใบส่งสินค้า' :
                      document.docType === 'billing' ? 'ใบวางบิล' : 'ใบเสร็จ';
  
  const subtotal = document.totalAmount;
  const vat = 0; // ไม่คิด VAT ตามที่ร้องขอ
  const netTotal = subtotal;

  // ฟังก์ชันแปลงตัวเลขเป็นคำอ่าน (ง่ายๆ)
  const numberToWords = (num) => {
    if (num === 0) return 'ศูนย์บาทถ้วน';
    return `${Math.round(num).toLocaleString()} บาท`;
  };

  return `
    ${isPageBreak ? '<div class="page-break"></div>' : ''}
    
    <!-- Header with doc-title and company info on same line -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
      <div class="doc-title" style="margin: 0;">${docTypeText}</div>
      <div class="company-header" style="text-align: right; margin: 0; border: none; padding: 0;">
        <div class="company-name">HALEM FARM</div>
        <div class="company-details">
          198 ม.9 บ้านห้วยลาดอาย ต.ขุนดินเถื่อ<br/>
          อ.ดูลำปี จ.ขกรรเขียว การค์โปรดแรด 30170<br/>
          โทร (+66) 095736589<br/>
          เลขประจำตัวผู้เสียภาษี 34090003658912
        </div>
      </div>
    </div>
    
    <table class="info-table">
      <tr>
        <td class="info-header" width="15%">เลขประจำตัวผู้เสียภาษี<br/>Tax ID</td>
        <td width="35%">${document.customer.taxId || ''}</td>
        <td class="info-header" width="15%">เลขที่ใบส่งสินค้า</td>
        <td width="35%">${document.docNumber}</td>
      </tr>
      <tr>
        <td class="info-header">ชื่อลูกค้า<br/>Customer</td>
        <td>${document.customer.companyName || document.customer.name}</td>
        <td class="info-header">วันที่ทำรายการ<br/>วันที่จัดส่ง</td>
        <td>${dateFormat}<br/>${dateFormat}</td>
      </tr>
      <tr>
        <td class="info-header">ที่อยู่<br/>Address</td>
        <td colspan="3">${document.customer.address || ''}</td>
      </tr>
      <tr>
        <td class="info-header">โทรศัพท์/Phone<br/>อีเมล/Email</td>
        <td>${document.customer.telephone || ''}</td>
        <td colspan="2"></td>
      </tr>
    </table>
    
    <table class="product-table">
      <thead>
        <tr>
          <th width="8%">ลำดับ<br/>Item No.</th>
          <th width="40%">ชื่อสินค้า/รายละเอียด<br/>Product Description</th>
          <th width="12%">จำนวน<br/>Quantity</th>
          <th width="15%">ราคา/หน่วย<br/>Unit Price</th>
          <th width="15%">จำนวนเงิน<br/>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${document.docType === 'billing'
          ? document.deliveryNotes?.map((note, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${note.description}</td>
                <td class="text-center">${note.quantity.toFixed(2)} กก.</td>
                <td class="text-right">-</td>
                <td class="text-right">${Math.round(note.amount).toFixed(2)}</td>
              </tr>
            `).join('') || ''
          : document.items?.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.name}</td>
                <td class="text-center">${item.quantity.toFixed(2)}</td>
                <td class="text-right">${Math.round(item.unitPrice).toFixed(2)}</td>
                <td class="text-right">${Math.round(item.total).toFixed(2)}</td>
              </tr>
            `).join('') || ''
        }
        ${Array.from({
          length: Math.max(0, 8 - (document.docType === 'billing' ? (document.deliveryNotes?.length || 0) : (document.items?.length || 0)))
        }, () => `
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
    
    <!-- Connected table layout like in the image -->
    <table style="width: 100%; border: 2px solid #000; border-collapse: collapse; margin-bottom: 15px;">
      <tr>
        <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; width: 10%;">หมายเหตุ</td>
        <td style="border: 1px solid #000; padding: 4px 8px; width: 40%;">${document.customer.name}</td>
        <td style="border: 1px solid #000; padding: 4px 8px; width: 25%;">รวมค่าสินค้า</td>
        <td style="border: 1px solid #000; padding: 4px 8px; text-align: right; width: 25%;">${Math.round(subtotal).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;" rowspan="3">
          <strong>ส่วนรีซีปป์เอกสารสำหรับ</strong><br/>
          <strong>ชำระเงิน</strong><br/>
          <div style="margin-top: 10px;">
            <strong>เครดิต</strong> &nbsp;&nbsp;&nbsp; ระบบการกินสินค้าสิน 15 ของเดือน<br/>
            <strong>ภาษีมูลค่าเพิ่ม/เอกสารกำกับต่างๆสำหรับใน</strong>
          </div>
        </td>
        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">
          <strong>จำนวนเงิน</strong> (${numberToWords(netTotal)})
        </td>
        <td style="border: 1px solid #000; padding: 4px 8px;">ภาษีมูลค่าเพิ่ม (Vat) 7%</td>
        <td style="border: 1px solid #000; padding: 4px 8px; text-align: right;">${Math.round(vat).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">
          <strong>การสอบสำรองเสียมค่า</strong> งานควบรเขาขำ อีก 7 วันหลังจากการเวลา
        </td>
        <td style="border: 1px solid #000; padding: 4px 8px; font-weight: bold; border-bottom: 2px solid #000;">ชำระเงินสุทธิสุด / Net Total</td>
        <td style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-weight: bold; border-bottom: 2px solid #000;">${Math.round(netTotal).toFixed(2)}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
        <td style="border: 1px solid #000; padding: 8px;" colspan="2">&nbsp;</td>
      </tr>
    </table>
    
    <!-- Signature section left-aligned with right space for signing -->
    <table style="width: 100%; border: 2px solid #000; border-collapse: collapse;">
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 25%;">ผู้อนุมัติ</td>
        <td style="border: 1px solid #000; padding: 8px; width: 75%;">&nbsp;</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">ผู้ส่งสินค้า</td>
        <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">ผู้รับสินค้า</td>
        <td style="border: 1px solid #000; padding: 8px;">&nbsp;</td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px;">วันที่</td>
        <td style="border: 1px solid #000; padding: 8px;">......../......../..........</td>
      </tr>
    </table>
  `;
}