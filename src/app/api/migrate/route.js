// migrate.js - Fixed timezone and docnumber issues
// วิธีใช้: Access via /api/migrate

import { promises as fs } from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Import your models
import Customer from '@/models/Customer';
import Vegetable from '@/models/Vegetable';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import dbConnect from '@/lib/mongodb';

import { NextResponse } from 'next/server';

const BKK_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// แปลงค่าจาก Excel (Date หรือ string) -> Date(UTC midnight) ของวันตามเวลาไทย
function convertExcelDateToThailand(excelDate) {
  // แปลงเป็น Date object ก่อน
  const d = excelDate instanceof Date ? excelDate : new Date(excelDate);

  // ดึงค่า year, month, date จาก local timezone (ซึ่งควรเป็นเวลาไทย)
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based
  const date = d.getDate();

  // สร้าง Date object ใหม่ที่เป็น UTC midnight ของวันนั้น
  return new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
}

// สร้าง key YYYY-MM-DD ตามปฏิทินไทย (ไม่ลื่นวัน)
function createDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return BKK_FMT.format(d); // "YYYY-MM-DD"
}

// Parse Excel file
async function parseExcelFile(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  
  const workbook = XLSX.read(fileBuffer, {
    cellDates: false,    // *** ปิดการแปลง Date อัตโนมัติ ***
    dateNF: 'dd/mm/yyyy',
    raw: false           // ให้ได้ formatted string
  });
  
  // Function helper สำหรับ parse วันที่
  const parseDate = (dateValue) => {
    // ถ้าเป็น string เช่น "05/09/2025" หรือ "5/9/2025"
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // 0-based
        const year = parseInt(parts[2]);
        // สร้าง UTC midnight โดยตรง
        return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      }
    }
    
    // ถ้าเป็นตัวเลข (Excel serial number)
    if (typeof dateValue === 'number') {
      // Excel serial date: days since 1900-01-01
      const excelEpoch = new Date(1899, 11, 30);
      const msPerDay = 24 * 60 * 60 * 1000;
      const date = new Date(excelEpoch.getTime() + dateValue * msPerDay);
      
      // Extract date parts and create UTC midnight
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    }
    
    return null;
  };
  
  // Process sheets และแปลงวันที่
  const processSheet = (sheetData, dateColumns = []) => {
    return sheetData.map(row => {
      const processed = { ...row };
      
      // แปลงเฉพาะ columns ที่เป็นวันที่
      dateColumns.forEach(col => {
        if (processed[col]) {
          const parsed = parseDate(processed[col]);
          if (parsed) {
            processed[col] = parsed;
          }
        }
      });
      
      return processed;
    });
  };
  
  // อ่าน raw data ก่อน
  const ordersData = XLSX.utils.sheet_to_json(workbook.Sheets['orders']);
  const paymentsData = XLSX.utils.sheet_to_json(workbook.Sheets['payments']);
  
  return {
    orders: processSheet(ordersData, ['วันที่ส่งสินค้า']),
    payments: processSheet(paymentsData, ['วันที่ส่งสินค้า']),
    customers: XLSX.utils.sheet_to_json(workbook.Sheets['customers']),
    vegetables: XLSX.utils.sheet_to_json(workbook.Sheets['vegetables'])
  };
}


// Map payment method from Thai to English
function mapPaymentMethod(thaiMethod) {
  const mapping = {
    'เงินสด': 'cash',
    'โอนเงิน': 'transfer',
    'เครดิต': 'credit'
  };
  return mapping[thaiMethod] || 'cash';
}

// Migrate Customers
async function migrateCustomers(customersData) {
  
  const customerMap = new Map();
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of customersData) {
    try {
      // Check if customer already exists by phone or name
    //   const existingCustomer = await Customer.findOne({
    //     $or: [
    //       { telephone: row['phone_number'] || row['เบอร์โทร'] },
    //       { name: row['shop'] || row['ชื่อลูกค้า'] }
    //     ]
    //   });
      
    //   if (existingCustomer) {
    //     customerMap.set(row['shop'] || row['ชื่อลูกค้า'], existingCustomer._id);
    //     continue;
    //   }
      
      const customerData = {
        line_id: row['line_id'],
        line_name: row['line'],
        name: row['shop'] || row['ชื่อลูกค้า'],
        pay_method: mapPaymentMethod(row['pay_method']),
        tax_id: row['tax_id'],
        company_name: row['company'],
        address: row['address'],
        is_print: row['is_print'] === true || row['is_print'] === 'true',
        telephone: row['phone_number'] || row['เบอร์โทร']
      };
      
      const customer = await Customer.create(customerData);
      customerMap.set(customer.name, customer._id);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`❌ Error creating customer ${row['shop'] || row['ชื่อลูกค้า']}:`, error.message);
    }
  }
  
  return customerMap;
}

// Create missing customers from orders/payments (เฉพาะลูกค้าที่อยู่ในช่วง 2 เดือนล่าสุด)
async function createMissingCustomers(ordersData, paymentsData, customerMap, twoMonthsAgo) {
  
  // Filter data ในช่วง 2 เดือนล่าสุด
  const recentOrders = ordersData;
  
  const recentPayments = paymentsData;
  
  const allCustomerNames = new Set();
  recentOrders.forEach(o => allCustomerNames.add(o['ลูกค้า']));
  recentPayments.forEach(p => allCustomerNames.add(p['ลูกค้า']));
  
  let createdCount = 0;
  
  for (const customerName of allCustomerNames) {
    if (!customerMap.has(customerName)) {
      try {
        // Check if already exists in database
        // const existingCustomer = await Customer.findOne({ name: customerName });
        
        // if (existingCustomer) {
        //   customerMap.set(customerName, existingCustomer._id);
        //   continue;
        // }
        
        // Find payment method from payments data
        const paymentRecord = recentPayments.find(p => p['ลูกค้า'] === customerName);
        const payMethod = paymentRecord ? mapPaymentMethod(paymentRecord['ชำระโดย']) : 'cash';
        
        // Create new customer with minimal data
        const customerData = {
          name: customerName,
          pay_method: payMethod,
          telephone: '', // Default phone number
          is_print: payMethod !== 'cash' // Print for non-cash payments
        };
        
        const customer = await Customer.create(customerData);
        customerMap.set(customerName, customer._id);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating customer ${customerName}:`, error.message);
      }
    }
  }
  
  return customerMap;
}

// Migrate Vegetables
async function migrateVegetables(vegetablesData) {
  
  const vegetableMap = new Map();
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of vegetablesData) {
    try {
      // Check if vegetable already exists
    //   const existingVeg = await Vegetable.findOne({
    //     name_eng: row['ชื่อผักอังกฤษ']
    //   });
      
    //   if (existingVeg) {
    //     vegetableMap.set(row['ชื่อผักอังกฤษ'], existingVeg._id);
    //     continue;
    //   }
      
      const vegetableData = {
        name_th: row['ชื่อผักไทย'],
        name_eng: row['ชื่อผักอังกฤษ'],
        status: row['สถานะการใช้งาน'] === true || row['สถานะการใช้งาน'] === 'true' ? 'available' : 'discontinued',
        price: parseFloat(row['ราคา/กก.']) || 0,
        photo: row['รูปภาพ']
      };
      
      const vegetable = await Vegetable.create(vegetableData);
      vegetableMap.set(vegetable.name_eng, vegetable._id);
      successCount++;
    } catch (error) {
      errorCount++;
      console.error(`❌ Error creating vegetable ${row['ชื่อผักอังกฤษ']}:`, error.message);
    }
  }
  
  return vegetableMap;
}

// Process orders by grouping order details by customer and delivery date
async function migrateOrders(ordersData, paymentsData, customerMap, vegetableMap) {
  
  // ========== กำหนดช่วงเวลา 2 เดือนล่าสุด ==========
  // กำหนดวันนี้และ twoMonthsAgo ตามปฏิทินไทย แล้วทำให้เป็น UTC midnight
    const now = new Date();
    const [ty, tm, td] = BKK_FMT.format(now).split("-").map(Number);
    const today = new Date(Date.UTC(ty, tm - 1, td)); // 00:00Z ของ "วันนี้ตามไทย"

    const twoMonthsAgo = new Date(Date.UTC(ty, tm - 1, td));
    twoMonthsAgo.setUTCMonth(twoMonthsAgo.getUTCMonth() - 1); // ถอย 2 เดือนแบบ UTC-safe

  
  
  // Filter orders ในช่วง 2 เดือนล่าสุด
  const filteredOrders = ordersData;
  
  // Filter payments ในช่วง 2 เดือนล่าสุด
  const filteredPayments = paymentsData;
  
  
  // ========== DEBUG: ตรวจสอบ payment data ==========
  if (filteredPayments.length > 0) {
    const samplePayment = filteredPayments[0];
    
    // ตรวจสอบ column ที่อาจจะเป็น docnumber
    const possibleDocColumns = Object.keys(samplePayment).filter(key => 
      key.includes('เลข') || key.includes('ใบ') || key.includes('doc') || key.includes('Doc')
    );
    
    // แสดงตัวอย่างข้อมูล
    filteredPayments.slice(0, 3).forEach((payment, idx) => {
      possibleDocColumns.forEach(col => {
        if (payment[col]) {
        }
      });
    });
  }
  // ========== END DEBUG ==========
  
  // Group orders by customer and delivery date
  const orderGroups = new Map();
  
  // Process filtered orders sheet
  for (const row of filteredOrders) {
    const customerName = row['ลูกค้า'];
    const deliveryDate = convertExcelDateToThailand(row['วันที่ส่งสินค้า']);

    // ใช้ date key แบบ YYYY-MM-DD
    const dateKey = createDateKey(deliveryDate);
    const key = `${customerName}_${dateKey}`;
    
    if (!orderGroups.has(key)) {
      orderGroups.set(key, {
        customerName,
        deliveryDate,
        items: [],
        payMethod: mapPaymentMethod(row['ชำระโดย']),
        total: 0
      });
    }
    
    const group = orderGroups.get(key);
    group.items.push({
      vegetableName: row['รายการสินค้า'],
      quantity: parseFloat(row['ปริมาณ']) || 0,
      price: parseFloat(row['ราคาต่อหน่วย']) || 0,
      subtotal: parseFloat(row['ยอดรวม']) || 0
    });
    group.total += parseFloat(row['ยอดรวม']) || 0;
  }
  
  // Update payment status from filtered payments sheet
  const paymentMap = new Map();
  let docNumberCount = 0;
  
  for (const payment of filteredPayments) {
    const customerName = payment['ลูกค้า'];
    const deliveryDate = convertExcelDateToThailand(payment['วันที่ส่งสินค้า']);
    
    // ใช้ date key แบบ YYYY-MM-DD เหมือนกับ orders
    const dateKey = createDateKey(deliveryDate);
    const key = `${customerName}_${dateKey}`;
    
    // ลองหา docnumber จากหลาย column ที่เป็นไปได้
    let docnumber = payment['เลขที่ใบส่งสินค้า'] || 
                    payment['เลขที่'] || 
                    payment['Document No'] || 
                    payment['Doc No'] || 
                    payment['docnumber'] || 
                    '';
    
    if (docnumber && docnumber !== '') {
      docNumberCount++;
    }
    
    paymentMap.set(key, {
      docnumber: docnumber,
      paidStatus: payment['สถานะการชำระ'] === true || payment['สถานะการชำระ'] === 'true',
      total: parseFloat(payment['ยอดขาย']) || 0
    });
  }
  
  
  // Create orders and order details
  let orderSuccess = 0;
  let orderError = 0;
  let detailSuccess = 0;
  let detailError = 0;
  let ordersWithDocNumber = 0;
  
  for (const [key, group] of orderGroups) {
    const customerId = customerMap.get(group.customerName);
    
    if (!customerId) {
      console.error(`❌ Customer not found: ${group.customerName}`);
      orderError++;
      continue;
    }
    
    try {
      // Check if order already exists
      const existingOrder = await Order.findOne({
        customer_id: customerId,
        delivery_date: group.deliveryDate
      });
      
      if (existingOrder) {
        continue;
      }
      
      // Get payment info
      const paymentInfo = paymentMap.get(key);
      
      if (paymentInfo?.docnumber) {
        ordersWithDocNumber++;
      }
      
      // Create order with properly formatted date (no time component)
      const orderData = {
        created_date: new Date(),
        delivery_date: group.deliveryDate, // This should now be properly formatted
        customer_id: customerId,
        total: paymentInfo?.total || group.total,
        paid_status: paymentInfo?.paidStatus !== undefined ? paymentInfo.paidStatus : true,
        docnumber: paymentInfo?.docnumber || '',
        user: 'MIGRATION',
        created_by: 'MIGRATION'
      };
      
      const order = await Order.create(orderData);
      orderSuccess++;
      
      // Create order details
      for (const item of group.items) {
        try {
          // Find vegetable ID
          let vegetableId = vegetableMap.get(item.vegetableName);
          
          if (!vegetableId) {
            // Try to find in database
            const veg = await Vegetable.findOne({
              $or: [
                { name_eng: item.vegetableName },
                { name_th: item.vegetableName }
              ]
            });
            
            if (veg) {
              vegetableId = veg._id;
              vegetableMap.set(item.vegetableName, veg._id);
            } else {
              console.error(`  ❌ Vegetable not found: ${item.vegetableName}`);
              detailError++;
              continue;
            }
          }
          
          const orderDetailData = {
            order_id: order._id,
            vegetable_id: vegetableId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          };
          
          await OrderDetail.create(orderDetailData);
          detailSuccess++;
        } catch (error) {
          detailError++;
          console.error(`  ❌ Error creating order detail:`, error.message);
        }
      }
    } catch (error) {
      orderError++;
      console.error(`❌ Error creating order for ${group.customerName}:`, error.message);
    }
  }
  
  
  return twoMonthsAgo;
}

// Main migration function
export async function GET() {
  
  try {
    // Connect to MongoDB
    await dbConnect();

    await Customer.deleteMany({});
    await Vegetable.deleteMany({});
    await Order.deleteMany({});
    await OrderDetail.deleteMany({});
    
    // Read and parse Excel file

    const excelPath = path.join(process.cwd(), 'public/data/DeliveryPayment Record.xlsx');
    
    const data = await parseExcelFile(excelPath);
    
    // คำนวณวันที่ 2 เดือนย้อนหลัง
    const today = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(today.getMonth() - 2);
    
    // Migrate data in order
    const customerMap = await migrateCustomers(data.customers);
    const updatedCustomerMap = await createMissingCustomers(data.orders, data.payments, customerMap, twoMonthsAgo);
    const vegetableMap = await migrateVegetables(data.vegetables);
    await migrateOrders(data.orders, data.payments, updatedCustomerMap, vegetableMap);
    
    return NextResponse.json({ 
      message: 'Migration completed successfully',
      note: 'Only processed last 2 months of data',
      dateRange: {
        from: twoMonthsAgo.toISOString(),
        to: today.toISOString()
      }
    });
  } catch (error) {
    console.error('Migrate error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}