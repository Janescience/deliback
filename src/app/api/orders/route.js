import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import Customer from '@/models/Customer';
import Vegetable from '@/models/Vegetable';
import { getThailandDayRange } from '@/lib/thailand-time';

// GET all orders
export async function GET(request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build search query
    const query = {};
    
    // Document number search
    if (searchParams.get('docnumber')) {
      const docnumber = searchParams.get('docnumber');
      if (docnumber.toLowerCase().includes('เงินสด') || docnumber.toLowerCase().includes('cash')) {
        query.docnumber = null;
      } else {
        query.docnumber = { $regex: docnumber, $options: 'i' };
      }
    }
    
    // Customer search
    if (searchParams.get('customer_id')) {
      query.customer_id = searchParams.get('customer_id');
    }
    
    // Payment status search
    if (searchParams.get('paid_status')) {
      query.paid_status = searchParams.get('paid_status') === 'true';
    }
    
    // Delivery date range using Thailand timezone
    if (searchParams.get('delivery_date_from') || searchParams.get('delivery_date_to')) {
      query.delivery_date = {};
      if (searchParams.get('delivery_date_from')) {
        const { start } = getThailandDayRange(searchParams.get('delivery_date_from'));
        query.delivery_date.$gte = start;
      }
      if (searchParams.get('delivery_date_to')) {
        const { end } = getThailandDayRange(searchParams.get('delivery_date_to'));
        query.delivery_date.$lte = end;
      }
    }
    
    // Payment method search
    let customerQuery = {};
    if (searchParams.get('pay_method')) {
      customerQuery.pay_method = searchParams.get('pay_method');
    }
    
    console.log('Fetching orders with query:', query, { page, limit, skip });
    console.log('Customer query for pay_method:', customerQuery);
    
    let orders;
    
    // If we need to filter by payment method, we need to join with customers
    if (searchParams.get('pay_method')) {
      const customersWithPayMethod = await Customer.find(customerQuery).select('_id').lean();
      const customerIds = customersWithPayMethod.map(customer => customer._id);
      query.customer_id = { $in: customerIds };
    }
    
    // First try query with filters
    orders = await Order.find(query)
      .sort({ created_date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    console.log('Basic orders fetch successful, now populating...');
    
    // Manually populate to have better error control
    const populatedOrders = await Promise.all(
      orders.map(async (order) => {
        try {
          // Get customer info
          const customer = await Customer.findById(order.customer_id).select('name company_name telephone pay_method is_print tax_id address').lean();
          
          // Get order details with vegetable info
          const orderDetails = await OrderDetail.find({ order_id: order._id }).lean();
          const populatedDetails = await Promise.all(
            orderDetails.map(async (detail) => {
              const vegetable = await Vegetable.findById(detail.vegetable_id).select('name_th name_eng price status photo').lean();
              return {
                ...detail,
                vegetable_id: vegetable || { name_th: 'ผักที่ถูกลบ', name_eng: null, price: 0, status: 'discontinued', photo: null }
              };
            })
          );
          
          return {
            ...order,
            customer_id: customer || { name: 'ลูกค้าที่ถูกลบ', company_name: null, telephone: '', pay_method: 'cash', is_print: false },
            details: populatedDetails
          };
        } catch (populateError) {
          console.error('Error populating order:', order._id, populateError);
          return {
            ...order,
            customer_id: { name: 'Error loading customer', company_name: null, telephone: '', pay_method: 'cash', is_print: false },
            details: []
          };
        }
      })
    );
      
    console.log('Found orders:', populatedOrders.length);
    
    const total = await Order.countDocuments(query);
    
    return NextResponse.json({
      orders: populatedOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('GET orders error:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

// POST new order
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    console.log('Creating order with data:', body);
    
    // Validate required fields
    if (!body.delivery_date) {
      return NextResponse.json(
        { error: 'delivery_date is required' },
        { status: 400 }
      );
    }
    
    if (!body.customer_id) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      );
    }
    
    if (!body.details || !Array.isArray(body.details) || body.details.length === 0) {
      return NextResponse.json(
        { error: 'details with at least one item is required' },
        { status: 400 }
      );
    }
    
    if (!body.user) {
      return NextResponse.json(
        { error: 'user is required' },
        { status: 400 }
      );
    }
    
    // Validate each detail item
    for (let i = 0; i < body.details.length; i++) {
      const detail = body.details[i];
      if (!detail.vegetable_id) {
        return NextResponse.json(
          { error: `vegetable_id is required for item ${i + 1}` },
          { status: 400 }
        );
      }
      if (!detail.quantity || detail.quantity <= 0) {
        return NextResponse.json(
          { error: `quantity must be greater than 0 for item ${i + 1}` },
          { status: 400 }
        );
      }
      if (detail.price === undefined || detail.price < 0) {
        return NextResponse.json(
          { error: `price must be 0 or greater for item ${i + 1}` },
          { status: 400 }
        );
      }
    }
    
    // Calculate total from details
    const total = body.details.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);
    
    // Create order
    const order = await Order.create({
      delivery_date: body.delivery_date,
      customer_id: body.customer_id,
      user: body.user,
      total: total
    });
    
    // Create order details
    const orderDetails = await Promise.all(
      body.details.map(detail => 
        OrderDetail.create({
          order_id: order._id,
          vegetable_id: detail.vegetable_id,
          quantity: detail.quantity,
          price: detail.price,
          subtotal: detail.quantity * detail.price
        })
      )
    );
    
    return NextResponse.json({ order, details: orderDetails }, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// PUT update order
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, details, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // If details are provided, update them
    if (details && Array.isArray(details)) {
      // Delete existing order details
      await OrderDetail.deleteMany({ order_id: id });
      
      // Validate each detail item
      for (let i = 0; i < details.length; i++) {
        const detail = details[i];
        if (!detail.vegetable_id) {
          return NextResponse.json(
            { error: `vegetable_id is required for item ${i + 1}` },
            { status: 400 }
          );
        }
        if (!detail.quantity || detail.quantity <= 0) {
          return NextResponse.json(
            { error: `quantity must be greater than 0 for item ${i + 1}` },
            { status: 400 }
          );
        }
        if (detail.price === undefined || detail.price < 0) {
          return NextResponse.json(
            { error: `price must be 0 or greater for item ${i + 1}` },
            { status: 400 }
          );
        }
      }
      
      // Create new order details
      const orderDetails = await Promise.all(
        details.map(detail => 
          OrderDetail.create({
            order_id: id,
            vegetable_id: detail.vegetable_id,
            quantity: detail.quantity,
            price: detail.price,
            subtotal: detail.quantity * detail.price
          })
        )
      );
      
      // Calculate new total
      updateData.total = details.reduce((sum, detail) => sum + (detail.quantity * detail.price), 0);
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

// DELETE order
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Delete order details first
    await OrderDetail.deleteMany({ order_id: id });
    
    // Delete order
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Order deletion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}