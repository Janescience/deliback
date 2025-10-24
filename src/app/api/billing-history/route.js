import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BillingHistory from '@/models/BillingHistory';

// GET billing history
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Optional filters
    const period = searchParams.get('period');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // Build query
    const query = {};
    if (period) {
      query.billing_period = period;
    }
    if (fromDate || toDate) {
      query.created_date = {};
      if (fromDate) {
        query.created_date.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.created_date.$lte = new Date(toDate);
      }
    }

    // Get billing history with pagination
    const billingHistory = await BillingHistory.find(query)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customers.customer_id', 'name company_name')
      .lean();

    console.log(`Found ${billingHistory.length} billing history records`);
    if (billingHistory.length > 0) {
      console.log('First record:', JSON.stringify(billingHistory[0], null, 2));
    }

    const total = await BillingHistory.countDocuments(query);

    // Calculate summary statistics
    const totalAmountAll = await BillingHistory.aggregate([
      { $match: query },
      { $group: { _id: null, totalAmount: { $sum: '$total_amount' } } }
    ]);

    const summary = {
      total_records: total,
      total_amount_all: totalAmountAll[0]?.totalAmount || 0,
      total_customers_all: await BillingHistory.aggregate([
        { $match: query },
        { $group: { _id: null, totalCustomers: { $sum: '$total_customers' } } }
      ]).then(result => result[0]?.totalCustomers || 0),
      total_invoices_all: await BillingHistory.aggregate([
        { $match: query },
        { $group: { _id: null, totalInvoices: { $sum: '$total_invoices' } } }
      ]).then(result => result[0]?.totalInvoices || 0)
    };

    return NextResponse.json({
      success: true,
      data: billingHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary
    });

  } catch (error) {
    console.error('GET billing history error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST new billing history record
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['billing_period', 'total_amount', 'total_customers', 'total_invoices', 'customers'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate customers array
    if (!Array.isArray(body.customers) || body.customers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'customers must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each customer
    for (let i = 0; i < body.customers.length; i++) {
      const customer = body.customers[i];
      const requiredCustomerFields = ['customer_id', 'customer_name', 'amount', 'order_count', 'date_range', 'invoice_number'];

      for (const field of requiredCustomerFields) {
        if (!customer[field]) {
          return NextResponse.json(
            { success: false, error: `customers[${i}].${field} is required` },
            { status: 400 }
          );
        }
      }

      // Validate date_range
      if (!customer.date_range.from || !customer.date_range.to) {
        return NextResponse.json(
          { success: false, error: `customers[${i}].date_range.from and date_range.to are required` },
          { status: 400 }
        );
      }
    }

    // Create billing history record
    const billingHistory = await BillingHistory.create(body);

    return NextResponse.json({
      success: true,
      data: billingHistory,
      message: 'Billing history created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('POST billing history error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}