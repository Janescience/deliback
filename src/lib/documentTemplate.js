// Shared document template logic for both client-side and server-side rendering

// Thai number to text converter
export const convertNumberToThaiText = (number) => {
  const thaiDigits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiPlaces = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  if (number === 0) return 'ศูนย์บาทถ้วน';

  const numberStr = Math.floor(number).toString();
  let result = '';

  for (let i = 0; i < numberStr.length; i++) {
    const digit = parseInt(numberStr[i]);
    const place = numberStr.length - i - 1;

    if (digit === 0) continue;

    // Special cases for Thai number reading
    if (place === 1 && digit === 1 && numberStr.length > 1) {
      result += 'สิบ';
    } else if (place === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else if (place === 0 && digit === 1 && numberStr.length > 1) {
      result += 'เอ็ด';
    } else {
      result += thaiDigits[digit];
      if (place > 0) result += thaiPlaces[place];
    }
  }

  return result + 'บาทถ้วน';
};

// Calculate due date based on document type and company settings
export const calculateDueDate = (documentDate, docType, companySettings) => {
  const date = new Date(documentDate);

  switch(docType) {
    case 'delivery_note': {
      // ใบส่งสินค้า: ตรวจสอบวันที่ทำรายการเทียบกับรอบบิล
      const billingDay = companySettings.documentSettings?.billingCycleDay || 15;
      const currentDay = date.getDate();

      if (currentDay <= 14) {
        // วันที่ 1-14: กำหนดชำระวันที่ 15 ของเดือนเดียวกัน
        const dueDate = new Date(date);
        dueDate.setDate(billingDay);
        return dueDate;
      } else {
        // วันที่ 15 เป็นต้นไป: กำหนดชำระวันที่ 15 ของเดือนถัดไป
        const nextMonth = new Date(date);
        nextMonth.setMonth(date.getMonth() + 1);
        nextMonth.setDate(billingDay);
        return nextMonth;
      }
    }
    case 'receipt': {
      // ใบเสร็จ: วันที่เดียวกันกับวันที่ทำรายการ
      return new Date(date);
    }
    case 'billing': {
      // ใบวางบิล: วันที่ + 7 วันจากวันที่ทำรายการ
      const paymentDueDays = companySettings.documentSettings?.paymentDueDays || 7;
      const dueDate = new Date(date);
      dueDate.setDate(date.getDate() + paymentDueDays);
      return dueDate;
    }
    default: {
      // Default: วันที่ + จำนวนวันเครดิต
      const creditDays = companySettings.documentSettings?.creditDays || 15;
      const dueDate = new Date(date);
      dueDate.setDate(date.getDate() + creditDays);
      return dueDate;
    }
  }
};

// Get document title based on type and settings
export const getDocumentTitle = (docType, companySettings) => {
  const titles = companySettings.templateSettings || {};

  switch(docType) {
    case 'delivery_note':
      return {
        thai: titles.deliveryNoteTitle?.thai || 'ใบส่งสินค้า',
        english: titles.deliveryNoteTitle?.english || 'Delivery Sheet'
      };
    case 'receipt':
      return {
        thai: titles.receiptTitle?.thai || 'ใบเสร็จ',
        english: titles.receiptTitle?.english || 'Receipt'
      };
    case 'billing':
      return {
        thai: titles.billingTitle?.thai || 'ใบวางบิล',
        english: titles.billingTitle?.english || 'Invoice'
      };
    default:
      return {
        thai: 'เอกสาร',
        english: 'Document'
      };
  }
};

// Generate document template data
export const generateDocumentData = (document, companySettings) => {
  // Handle different date fields for different document types
  const dateFormat = document.docType === 'billing'
    ? new Date(document.actualBillingDate).toLocaleDateString('th-TH')
    : new Date(document.date).toLocaleDateString('th-TH');

  // Calculate due date using document type and company settings
  const docDate = document.docType === 'billing'
    ? new Date(document.actualBillingDate)
    : new Date(document.date);
  const dueDate = calculateDueDate(docDate, document.docType, companySettings);
  const dueDateFormat = dueDate.toLocaleDateString('th-TH');

  // Get document title from company settings
  const documentTitle = getDocumentTitle(document.docType, companySettings);

  const subtotal = document.totalAmount;

  return {
    dateFormat,
    dueDateFormat,
    documentTitle,
    subtotal,
    textAmount: convertNumberToThaiText(subtotal),
    companySettings,
    document
  };
};

// Generate JSX template for React components
export const DocumentTemplate = ({ data, className = '' }) => {
  const {
    dateFormat,
    dueDateFormat,
    documentTitle,
    subtotal,
    textAmount,
    companySettings,
    document
  } = data;

  return (
    <div className={`p-4 font-sarabun text-xs ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between pb-3">
        {/* Logo + Company Info - Left */}
        <div className="flex items-start">
          <div
            className=" flex items-center justify-center mr-3"
            style={{
              width: `${companySettings.logo?.width || 64}px`,
              height: `${companySettings.logo?.height || 64}px`
            }}
          >
            {companySettings.logo?.url ? (
              <img
                src={companySettings.logo.url}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-500">LOGO</span>
            )}
          </div>
          <div className="text-left">
            <div className="text-lg font-bold mb-1">{companySettings.companyName}</div>
            <div className="text-xs leading-tight">
              {companySettings.address?.line1}<br/>
              {companySettings.address?.line2}<br/>
              โทร {companySettings.telephone}<br/>
              เลขประจำตัวผู้เสียภาษี {companySettings.taxId}
            </div>
          </div>
        </div>

        {/* Document Title - Right */}
        <div className="text-right">
          <div className="px-3 py-2 inline-block font-bold text-lg">
            {documentTitle.thai}<br/>{documentTitle.english}
          </div>
        </div>
      </div>

      {/* Info Table */}
      <table className="w-full border border-black border-collapse text-xs">
        <tbody>
          <tr>
            <td className=" p-2 font-bold text-xs">
              เลขประจำตัวผู้เสียภาษี
            </td>
            
            <td className=" p-2 " >{document.customer.taxId || companySettings.taxId}</td>
            <td className=" p-2 font-bold text-xs">
              
            </td>
            <td className=" p-2 font-bold text-xs ">
              {document.docType === 'receipt' ? 'เลขที่ใบเสร็จ' :
               document.docType === 'billing' ? 'เลขที่ใบวางบิล' :
               'เลขที่ใบส่งสินค้า'}
            </td>
            <td className=" p-2">{document.docNumber}</td>
          </tr>
          <tr>
            <td className=" p-2 font-bold text-xs">
              ชื่อลูกค้า
            </td>
            
            <td className=" p-2 " colSpan="1">{document.customer.companyName || document.customer.name}</td>
            <td className=" p-2 font-bold text-xs">
            </td>
            <td className=" p-2 font-bold text-xs">
              วันที่ทำรายการ<br/>กำหนดชำระเงิน
            </td>
            <td className=" p-2" >{dateFormat}<br/>{dueDateFormat}</td>
          </tr>
          <tr>
            <td className=" p-2 font-bold text-xs">
              ที่อยู่
            </td>
        
            <td className=" p-2" colSpan="2">{document.customer.address || ''}</td>
          </tr>
          <tr>
            <td className=" p-2 font-bold text-xs">
              เบอร์โทรศัพท์
            </td>
        
            <td className=" p-2" colSpan="2">{document.customer.telephone || ''}</td>
          </tr>
        </tbody>
      </table>

      {/* Product Table */}
      <table className="w-full border border-black border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-black text-center text-xs font-bold w-1/12">
              ลำดับ<br/>Item No.
            </th>
            <th className="border border-black p-2 text-center text-xs font-bold w-5/12">
              ชื่อสินค้า/รายละเอียด<br/>Product Description
            </th>
            <th className="border border-black p-2 text-center text-xs font-bold w-2/12">
              จำนวน<br/>Quantity
            </th>
            <th className="border border-black p-2 text-center text-xs font-bold w-2/12">
              ราคา/หน่วย<br/>Unit Price
            </th>
            <th className="border border-black p-2 text-center text-xs font-bold w-2/12">
              จำนวนเงิน<br/>Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {document.docType === 'billing' ? (
            // For billing documents, show delivery notes
            document.deliveryNotes?.map((note, index) => (
              <tr key={index}>
                <td className="border-r border-black  text-center">{index + 1}</td>
                <td className="border-r border-black ">{note.description}</td>
                <td className="border-r border-black  text-center">{note.quantity.toFixed(2)}</td>
                <td className="border-r border-black text-right">-</td>
                <td className="text-right">{Math.round(note.amount).toFixed(2)}</td>
              </tr>
            )) || []
          ) : (
            // For other documents, show items
            document.items?.map((item, index) => (
              <tr key={index}>
                <td className="border-r border-black  text-center">{index + 1}</td>
                <td className="border-r border-black ">{item.name}</td>
                <td className="border-r border-black  text-center">{item.quantity.toFixed(2)}</td>
                <td className="border-r border-black  text-right">{Math.round(item.unitPrice).toFixed(2)}</td>
                <td className="text-right">{Math.round(item.total).toFixed(2)}</td>
              </tr>
            )) || []
          )}
          {Array.from({ length: Math.max(0, 20 - (document.docType === 'billing' ? (document.deliveryNotes?.length || 0) : (document.items?.length || 0))) }, (_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border-r border-black text-center">&nbsp;</td>
              <td className="border-r border-black ">&nbsp;</td>
              <td className="border-r border-black text-center">&nbsp;</td>
              <td className="border-r border-black text-right">&nbsp;</td>
              <td className="text-right">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom Section */}
      <div className="flex justify-between">
        <div className="flex-1">
          <table className="w-full border border-black border-collapse">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">หมายเหตุ</td>
                <td className="border border-black p-2">{document.customer.name}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">จำนวนเงิน (ตัวอักษร)</td>
                <td className="border border-black p-2">{textAmount}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border border-black border-collapse">
            <tbody>
              <tr>
                <td className="p-2 text-xs">
                  <strong>ชำระโดย</strong>
                  
                </td>
              </tr>
              <tr>
                <td className=" p-2 text-xs">
                  {document.docType === 'receipt' ? (
                    document.customer?.pay_method === 'cash' ? (
                        <strong>เงินสด</strong>
                    ) : document.customer?.pay_method === 'transfer' ? (
                      <div>
                        <strong>โอนเงิน</strong><br/>
                        <div >
                          <strong>ช่องทางการชำระเงิน:</strong><br/>
                          {companySettings.bankSettings?.bankName || 'ธนาคารกสิกรไทย'}<br/>
                          เลขที่บัญชี {companySettings.bankSettings?.accountNumber || '113-8-48085-9'}<br/>
                          ชื่อบัญชี {companySettings.bankSettings?.accountName || 'นายฮาเล็ม เจะมาริกัน'}<br/>
                          {companySettings.bankSettings?.transferInstructions || 'กรณีโอนชำระเงินเรียบร้อยแล้ว กรุณาส่งหลักฐานยืนยันการชำระผ่านทาง LINE'}
                        </div>
                      </div>
                    ) : (
                      <div >
                        <strong>เครดิต</strong> &nbsp;&nbsp;&nbsp; {companySettings.documentSettings?.paymentTermsText || 'ตัดรอบวางบิลทุกวันที่ 15 ของเดือน'}<br/>
                      </div>
                    )
                  ) : (
                    <div >
                       <strong>เครดิต</strong> &nbsp;&nbsp;&nbsp; {companySettings.documentSettings?.paymentTermsText || 'ตัดรอบวางบิลทุกวันที่ 15 ของเดือน'}<br/>
                    </div>
                  )}
                  
                </td>
              </tr>
              <tr>
                <td className=" p-2 text-xs">&nbsp;</td>
              </tr>
              <tr>
                <td className="p-2 text-xs">&nbsp;</td>
              </tr>
              <tr>
                <td className="p-2 text-xs">
                  {document.docType !== 'receipt' || document.customer?.pay_method === 'credit' ? (
                    <div>
                      <strong>เงื่อนไขการชำระเงิน</strong> {companySettings.documentSettings?.paymentConditionText || 'รบกวนชําระเงินภายใน 7 วันหลังจากวางบิล'}
                    </div>
                  ) : <div>&nbsp;</div>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="w-80">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold">รวมจำนวนเงิน</td>
                <td className="border border-black p-2 text-right">{Math.round(subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">ภาษีมูลค่าเพิ่ม (Vat) 7%</td>
                <td className="border border-black p-2 text-right">0</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold">จำนวนเงินรวมทั้งสิ้น / Net Total</td>
                <td className="border border-black p-2 text-right">{Math.round(subtotal).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full">
            <tbody>
              <tr>
                <td className="border border-black p-2">ผู้อนุมัติ</td>
              </tr>
              <tr>
                <td className="border border-black p-2">ผู้ส่งสินค้า</td>
              </tr>
              <tr>
                <td className="border border-black p-2">ผู้รับสินค้า</td>
              </tr>
              <tr>
                <td className="border border-black p-2 text-center">
                  วันที่ &nbsp;&nbsp;............../............../................
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Generate HTML template for server-side rendering (print)
export const generateDocumentHTML = (document, companySettings, isPageBreak = false) => {
  const data = generateDocumentData(document, companySettings);
  const {
    dateFormat,
    dueDateFormat,
    documentTitle,
    subtotal,
    textAmount
  } = data;

  return `
    ${isPageBreak ? '<div class="page-break"></div>' : ''}

    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 10px;">
      <!-- Logo + Company Info - Left -->
      <div style="display: flex; align-items: flex-start;">
        <div style="width: ${companySettings.logo?.width || 64}px; height: ${companySettings.logo?.height || 64}px;  display: flex; align-items: center; justify-content: center; margin-right: 12px;">
          ${companySettings.logo?.url
            ? `<img src="${companySettings.logo.url}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Logo" />`
            : '<span style="font-size: 12px; color: #6b7280;">LOGO</span>'
          }
        </div>
        <div style="text-align: left;">
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">${companySettings.companyName}</div>
          <div style="font-size: 12px; line-height: 1.3;">
            ${companySettings.address?.line1}<br/>
            ${companySettings.address?.line2}<br/>
            โทร ${companySettings.telephone}<br/>
            เลขประจำตัวผู้เสียภาษี ${companySettings.taxId}
          </div>
        </div>
      </div>

      <!-- Document Title - Right -->
      <div style="text-align: right;">
        <div style="padding: 8px 12px; display: inline-block; font-weight: bold; font-size: 18px;">
          ${documentTitle.thai}<br/>${documentTitle.english}
        </div>
      </div>
    </div>

    <!-- Info Table -->
    <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 12px;">
      <tbody>
        <tr>
          <td style="padding: 8px; font-weight: bold; font-size: 12px; width: 25%;">
            เลขประจำตัวผู้เสียภาษี
          </td>
          <td style="padding: 8px; width: 25%;">${document.customer.taxId || companySettings.taxId}</td>
          <td className=" p-2 font-bold text-xs">
              
            </td>
          <td style="padding: 8px; font-weight: bold; font-size: 12px; width: 25%;">
            ${document.docType === 'receipt' ? 'เลขที่ใบเสร็จ' :
              document.docType === 'billing' ? 'เลขที่ใบวางบิล' :
              'เลขที่ใบส่งสินค้า'}
          </td>
          <td style="padding: 8px; width: 25%;">${document.docNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; font-size: 12px;">
            ชื่อลูกค้า
          </td>
          <td style="padding: 8px;" colspan="1">${document.customer.companyName || document.customer.name}</td>
          <td className=" p-2 font-bold text-xs">
              
            </td>
          <td style="padding: 8px; font-weight: bold; font-size: 12px;">
            วันที่ทำรายการ<br/>กำหนดชำระเงิน
          </td>
          <td style="padding: 8px;">${dateFormat}<br/>${dueDateFormat}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; font-size: 12px;">
            ที่อยู่
          </td>
          <td style="padding: 8px;" colspan="2">${document.customer.address || ''}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; font-size: 12px;">
            เบอร์โทรศัพท์
          </td>
          <td style="padding: 8px;" colspan="2">${document.customer.telephone || ''}</td>
        </tr>
      </tbody>
    </table>

    <!-- Product Table -->
    <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; width: 8.33%;">
            ลำดับ<br/>Item No.
          </th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; width: 41.67%;">
            ชื่อสินค้า/รายละเอียด<br/>Product Description
          </th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; width: 16.67%;">
            จำนวน<br/>Quantity
          </th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; width: 16.67%;">
            ราคา/หน่วย<br/>Unit Price
          </th>
          <th style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; width: 16.67%;">
            จำนวนเงิน<br/>Amount
          </th>
        </tr>
      </thead>
      <tbody>
        ${document.docType === 'billing' ? (
          // For billing documents, show delivery notes
          document.deliveryNotes?.map((note, index) => `
            <tr>
              <td style="border-right: 1px solid #000; text-align: center;">${index + 1}</td>
              <td style="border-right: 1px solid #000; ">${note.description}</td>
              <td style="border-right: 1px solid #000;  text-align: center;">${note.quantity.toFixed(2)}</td>
              <td style="border-right: 1px solid #000;  text-align: right;">-</td>
              <td style="text-align: right;">${Math.round(note.amount).toFixed(2)}</td>
            </tr>
          `).join('') || ''
        ) : (
          // For other documents, show items
          document.items?.map((item, index) => `
            <tr>
              <td style="border-right: 1px solid #000;  text-align: center;">${index + 1}</td>
              <td style="border-right: 1px solid #000; ">${item.name}</td>
              <td style="border-right: 1px solid #000;  text-align: center;">${item.quantity.toFixed(2)}</td>
              <td style="border-right: 1px solid #000;  text-align: right;">${Math.round(item.unitPrice).toFixed(2)}</td>
              <td style=" text-align: right;">${Math.round(item.total).toFixed(2)}</td>
            </tr>
          `).join('') || ''
        )}
        ${Array.from({
          length: Math.max(0, 20 - (document.docType === 'billing' ? (document.deliveryNotes?.length || 0) : (document.items?.length || 0)))
        }, () => `
          <tr>
            <td style="border-right: 1px solid #000;  text-align: center;">&nbsp;</td>
            <td style="border-right: 1px solid #000; "> &nbsp;</td>
            <td style="border-right: 1px solid #000;  text-align: center;">&nbsp;</td>
            <td style="border-right: 1px solid #000;  text-align: right;">&nbsp;</td>
            <td style=" text-align: right;">&nbsp;</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Bottom Section -->
    <div style="display: flex; justify-content: space-between;">
      <div style="flex: 1; ">
        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px; font-weight: bold;">หมายเหตุ</td>
              <td style="padding: 8px;">${document.customer.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">จำนวนเงิน (ตัวอักษร)</td>
              <td style="padding: 8px;">${textAmount}</td>
            </tr>
          </tbody>
        </table>

        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px; font-size: 12px;">
                <strong>ชำระโดย</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-size: 12px;">
                ${document.docType === 'receipt'
                  ? document.customer?.pay_method === 'cash'
                    ? `<strong>เงินสด</strong>`
                    : document.customer?.pay_method === 'transfer'
                      ? `<div>
                           โอนเงิน
                         </div>`
                      : `<div>
                           <strong>เครดิต</strong> &nbsp;&nbsp;&nbsp; ${companySettings.documentSettings?.paymentTermsText || 'ตัดรอบวางบิลทุกวันที่ 15 ของเดือน'}<br/>
                         </div>`
                  : `<div>
                       <strong>เครดิต</strong> &nbsp;&nbsp;&nbsp; ${companySettings.documentSettings?.paymentTermsText || 'ตัดรอบวางบิลทุกวันที่ 15 ของเดือน'}<br/>
                     </div>`
                }
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; font-size: 12px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-size: 12px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-size: 12px;">
                ${document.docType !== 'receipt' || document.customer?.pay_method === 'credit'
                  ? `<div>
                       <strong>เงื่อนไขการชำระเงิน</strong> ${companySettings.documentSettings?.paymentConditionText || 'รบกวนชําระเงินภายใน 7 วันหลังจากวางบิล'}
                     </div>`
                  : '&nbsp;'
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="width: 320px;">
        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse;">
          <tbody>
            <tr style="border: 1px solid #000;">
              <td style="padding: 8px; font-weight: bold;">รวมจำนวนเงิน</td>
              <td style="padding: 8px; text-align: right;">${Math.round(subtotal).toFixed(2)}</td>
            </tr>
            <tr style="border: 1px solid #000;">
              <td style="padding: 8px; font-weight: bold;">ภาษีมูลค่าเพิ่ม (Vat) 7%</td>
              <td style="padding: 8px; text-align: right;">0</td>
            </tr>
            <tr style="border: 1px solid #000;">
              <td style="padding: 8px; font-weight: bold;">จำนวนเงินรวมทั้งสิ้น / Net Total</td>
              <td style="padding: 8px; text-align: right;">${Math.round(subtotal).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <table style="width: 100%;  border: 1px solid #000; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="padding: 8px;  border: 1px solid #000;">ผู้อนุมัติ</td>
            </tr>
            <tr>
              <td style="padding: 8px;  border: 1px solid #000;">ผู้ส่งสินค้า</td>
            </tr>
            <tr>
              <td style="padding: 8px;  border: 1px solid #000;">ผู้รับสินค้า</td>
            </tr>
            <tr>
              <td style="padding: 8px;  border: 1px solid #000; text-align: center;">
                วันที่ &nbsp;&nbsp;............../............../................
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
};