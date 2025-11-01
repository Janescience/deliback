import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { date, selectedOrders, preview = false } = body;
    
    
    const documents = [];
    let runNumberRC = 1; // ใบเสร็จ
    let runNumberDS = 1; // ใบส่งสินค้า  
    let runNumberInv = 1; // ใบวางบิล
    
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD format
    
    for (const orderGroup of selectedOrders) {
      const { customer, orders, totalAmount, payMethod } = orderGroup;
      
      // Use existing document number from orders or generate if not exists
      let docNumber = '';
      let docType = '';
      
      // Check if orders already have document numbers
      const existingDocNumber = orders.find(order => order.docnumber)?.docnumber;
      
      if (existingDocNumber) {
        docNumber = existingDocNumber;
      } else {
        // Generate new document number
        switch (payMethod) {
          case 'credit':
            docNumber = `DS${dateStr}${String(runNumberDS++).padStart(3, '0')}`;
            break;
          case 'cash':
          case 'transfer': // เงินสดและเงินโอนใช้ใบเสร็จ
            docNumber = `RC${dateStr}${String(runNumberRC++).padStart(3, '0')}`;
            break;
          default:
            docNumber = `DOC${dateStr}${String(runNumberRC++).padStart(3, '0')}`;
        }
      }
      
      // Set document type
      switch (payMethod) {
        case 'credit':
          docType = 'delivery_note';
          break;
        case 'cash':
        case 'transfer':
          docType = 'receipt';
          break;
        default:
          docType = 'document';
      }
      
      // Collect all order details
      const items = [];
      for (const order of orders) {
        if (order.details && order.details.length > 0) {
          order.details.forEach(detail => {
            items.push({
              name: detail.vegetable_id?.name_eng || detail.vegetable_id?.name_th || 'ผักไม่ระบุ',
              quantity: detail.quantity || 0,
              unitPrice: detail.price || 0, // ใช้ price แทน unit_price
              total: detail.subtotal || 0
            });
          });
        }
      }
      
      const documentData = {
        docNumber,
        docType,
        date: new Date().toISOString().split('T')[0],
        deliveryDate: orders[0]?.delivery_date || new Date().toISOString().split('T')[0], // วันที่สั่งซื้อจริง
        dueDate: payMethod === 'credit' ? calculateDueDate() : new Date().toISOString().split('T')[0],
        customer: {
          name: customer.name,
          companyName: customer.company_name || '',
          taxId: customer.tax_id || '',
          address: customer.address || '',
          telephone: customer.telephone || '',
          pay_method: customer.pay_method || payMethod
        },
        items,
        totalAmount,
        payMethod
      };
      
      documents.push(documentData);
      
      // Update orders with document number (only if new document number was generated and not preview)
      if (!preview && !existingDocNumber) {
        for (const order of orders) {
          await Order.findByIdAndUpdate(order._id, {
            docnumber: docNumber
          });
        }
      }
    }
    
    
    return NextResponse.json({
      success: true,
      documents,
      message: `สร้างเอกสาร ${documents.length} ฉบับเรียบร้อยแล้ว`
    });
    
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function calculateDueDate() {
  const today = new Date();
  const day = today.getDate();
  let dueDate = new Date(today);
  
  if (day < 15) {
    dueDate.setDate(15); // 15th of current month
  } else {
    dueDate.setMonth(dueDate.getMonth() + 1); // Next month
    dueDate.setDate(15); // 15th of next month
  }
  
  return dueDate.toISOString().split('T')[0];
}