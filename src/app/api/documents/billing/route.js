import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Customer from '@/models/Customer';
import BillingHistory from '@/models/BillingHistory';
import mongoose from 'mongoose';
import { getThailandToday, getThailandMonthRange, addThailandDays } from '@/lib/thailand-time';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const selectedPeriod = searchParams.get('period'); // Format: YYYY-MM (billing month)

    let billingYear, billingMonth;

    if (selectedPeriod) {
      [billingYear, billingMonth] = selectedPeriod.split('-').map(Number);
    } else {
      // Default to current period using Thailand timezone
      const today = getThailandToday();
      billingYear = today.getUTCFullYear();
      billingMonth = today.getUTCMonth() + 1; // Convert to 1-based month
    }

    const billingDay = 15;

    // Calculate billing period: 15th of previous month to 14th of selected month using Thailand timezone
    let startDate, endDate, billingDate;

    // Previous month 15th
    if (billingMonth === 1) {
      // January - previous month is December of previous year
      startDate = new Date(Date.UTC(billingYear - 1, 11, billingDay, 0, 0, 0, 0));
    } else {
      startDate = new Date(Date.UTC(billingYear, billingMonth - 2, billingDay, 0, 0, 0, 0));
    }

    // Selected month 14th (end of day)
    endDate = new Date(Date.UTC(billingYear, billingMonth - 1, billingDay - 1, 23, 59, 59, 999));

    // Billing date (15th of selected month)
    billingDate = new Date(Date.UTC(billingYear, billingMonth - 1, billingDay, 0, 0, 0, 0));
    

    // Find orders with document numbers in the billing period using aggregation to include details
    const orders = await Order.aggregate([
      {
        $match: {
          delivery_date: { $gte: startDate, $lte: endDate },
          docnumber: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_id'
        }
      },
      {
        $unwind: '$customer_id'
      },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order_id',
          as: 'details'
        }
      }
    ]);


    // Filter for credit customers only and group by customer
    const creditOrders = orders.filter(order =>
      order.customer_id && order.customer_id.pay_method === 'credit'
    );

    
    const groupedByCustomer = {};
    creditOrders.forEach(order => {
      const customerId = order.customer_id._id.toString();
      const customerName = order.customer_id.name;
      
      if (!groupedByCustomer[customerId]) {
        groupedByCustomer[customerId] = {
          customer: order.customer_id,
          orders: [],
          totalAmount: 0,
          deliveryNotes: []
        };
      }
      
      groupedByCustomer[customerId].orders.push(order);
      groupedByCustomer[customerId].totalAmount += order.total || 0;
      
      // Add delivery note info
      groupedByCustomer[customerId].deliveryNotes.push({
        docNumber: order.docnumber,
        date: order.delivery_date,
        amount: order.total || 0,
        quantity: order.details?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0
      });
    });
    
    return NextResponse.json({
      billingPeriod: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        billingDate: billingDate.toISOString().split('T')[0],
        displayText: `${startDate.getUTCDate()}/${String(startDate.getUTCMonth() + 1).padStart(2, '0')}/${startDate.getUTCFullYear()} - ${endDate.getUTCDate()}/${String(endDate.getUTCMonth() + 1).padStart(2, '0')}/${endDate.getUTCFullYear()}`
      },
      customers: Object.values(groupedByCustomer),
      totalCustomers: Object.keys(groupedByCustomer).length,
      selectedPeriod: selectedPeriod || `${billingYear}-${String(billingMonth).padStart(2, '0')}`
    });
    
  } catch (error) {
    console.error('Billing data fetch error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { selectedCustomers, billingDate } = body;

    console.log('Received selectedCustomers:', JSON.stringify(selectedCustomers.slice(0, 1), null, 2)); // Log first customer for debugging
    
    
    const documents = [];
    let runNumberStart = 1;
    
    // Use current Thailand date as the actual billing date (when user generates the bill)
    const actualBillingDate = getThailandToday();
    const dateStr = actualBillingDate.toISOString().slice(2, 10).replace(/-/g, '').slice(0, 6); // YYMMDD format

    // Calculate due date (+7 days from billing date using Thailand timezone)
    const dueDate = addThailandDays(actualBillingDate, 7);

    // Calculate period dates for display (from selected period)
    const selectedPeriod = body.selectedPeriod;
    let billingYear, billingMonth;
    if (selectedPeriod) {
      [billingYear, billingMonth] = selectedPeriod.split('-').map(Number);
    } else {
      const today = getThailandToday();
      billingYear = today.getUTCFullYear();
      billingMonth = today.getUTCMonth() + 1; // Convert to 1-based month
    }

    // Calculate period dates using Thailand timezone
    let periodStart, periodEnd;
    if (billingMonth === 1) {
      // January - previous month is December of previous year
      periodStart = new Date(Date.UTC(billingYear - 1, 11, 15, 0, 0, 0, 0));
    } else {
      periodStart = new Date(Date.UTC(billingYear, billingMonth - 2, 15, 0, 0, 0, 0));
    }
    periodEnd = new Date(Date.UTC(billingYear, billingMonth - 1, 14, 23, 59, 59, 999));

    for (const customerData of selectedCustomers) {
      const { customer, deliveryNotes, totalAmount } = customerData;

      // Generate document number
      const paddedNumber = String(runNumberStart++).padStart(3, '0');
      const docNumber = `INV${dateStr}${paddedNumber}`;

      // Group delivery notes by document number for display
      const deliveryMap = {};
      deliveryNotes.forEach(note => {
        const dateStr = new Date(note.date).toLocaleDateString('th-TH');
        const label = `${note.docNumber} (${dateStr})`;
        if (!deliveryMap[label]) {
          deliveryMap[label] = { quantity: 0, amount: 0 };
        }
        deliveryMap[label].quantity += note.quantity;
        deliveryMap[label].amount += note.amount;
      });

      const documentData = {
        docNumber,
        docType: 'billing',
        actualBillingDate: actualBillingDate.toISOString().split('T')[0], // วันที่วางบิล (วันที่สร้าง)
        dueDate: dueDate.toISOString().split('T')[0], // กำหนดชำระ (+7 วัน)
        periodMonth: `${billingMonth}/${billingYear}`, // รอบบิล (เดือน/ปี)
        periodDisplay: `${billingMonth}/${billingYear} (${periodStart.getUTCDate()}/${periodStart.getUTCMonth() + 1} - ${periodEnd.getUTCDate()}/${periodEnd.getUTCMonth() + 1})`, // รอบบิลพร้อมช่วงวันที่
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        customer: {
          name: customer.name,
          companyName: customer.company_name || '',
          taxId: customer.tax_id || '',
          address: customer.address || '',
          telephone: customer.telephone || ''
        },
        deliveryNotes: Object.entries(deliveryMap).map(([label, data]) => ({
          description: label,
          quantity: data.quantity,
          amount: data.amount
        })),
        totalAmount
      };
      
      documents.push(documentData);
    }
    
    // Save billing history
    const billingHistoryData = {
      billing_period: selectedPeriod,
      created_by: 'admin', // You can get this from authentication
      total_amount: selectedCustomers.reduce((sum, customer) => sum + (customer.totalAmount || 0), 0),
      total_customers: selectedCustomers.length,
      total_invoices: documents.length,
      customers: selectedCustomers.map((customer, index) => ({
        customer_id: customer.customer?._id || customer._id,
        customer_name: customer.customer?.name || customer.name,
        company_name: customer.customer?.company_name || customer.company_name || '',
        amount: customer.totalAmount || 0,
        order_count: customer.orders?.length || 0,
        date_range: {
          from: customer.earliestDate || startDate,
          to: customer.latestDate || endDate
        },
        invoice_number: documents[index]?.docNumber || `B${dateStr}${String(index + 1).padStart(3, '0')}`
      })),
      delivery_method: 'print'
    };

    console.log('Saving billing history:', JSON.stringify(billingHistoryData, null, 2));

    try {
      const savedHistory = await BillingHistory.create(billingHistoryData);
      console.log('Billing history saved successfully:', savedHistory._id);
    } catch (historyError) {
      console.error('Failed to save billing history:', historyError);
      // Don't fail the entire operation if history saving fails
    }

    return NextResponse.json({
      success: true,
      documents,
      actualBillingDate: actualBillingDate.toISOString().split('T')[0],
      billingHistory: billingHistoryData,
      message: `สร้างใบวางบิล ${documents.length} ฉบับเรียบร้อยแล้ว`
    });
    
  } catch (error) {
    console.error('Billing document generation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}