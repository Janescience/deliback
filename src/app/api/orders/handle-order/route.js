import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import Customer from '@/models/Customer';
import Vegetable from '@/models/Vegetable';
import { broadcastOrderUpdate } from '../stream/route';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    

    // Validate required fields
    if (!data.deliveryDate) {
      return NextResponse.json({ error: 'deliveryDate is required' }, { status: 400 });
    }

  
    if (!data.payMethod) {
      return NextResponse.json({ error: 'payMethod is required' }, { status: 400 });
    }
    
    if (!data.order || !Array.isArray(data.order) || data.order.length === 0) {
      return NextResponse.json({ error: 'order items are required' }, { status: 400 });
    }

    const orderDate = new Date();
    const deliveryDate = new Date(data.deliveryDate);
    const user = data.user || "ไม่ทราบชื่อ";
    const userId = data.userId || "ADMIN";
    const payMethod = mapPaymentMethod(data.payMethod);
    const orderItems = data.order;


    let customerId;
    const isPrintDoc = payMethod === 'credit';

    // --- Customer Management Section ---
    if(userId === 'ADMIN'){
      let customer = await Customer.findOne({ name : user.trim() });

      if (!customer) {
        const newCustomer = await Customer.create({
          line_id: userId,
          line_name: data.userLine,
          name: user.trim(),
          pay_method: payMethod,
          is_print: isPrintDoc
        });
        customerId = newCustomer._id;
      }else{
        customerId = customer._id;
      }
    }else{
      let customer = await Customer.findOne({ name : user.trim(), line_id: userId });
      if (!customer) {
        const newCustomer = await Customer.create({
          line_id: userId,
          line_name: data.userLine,
          name: user.trim(),
          pay_method: payMethod,
          is_print: isPrintDoc
        });
        customerId = newCustomer._id;
      }else{
        customerId = customer._id;
      }
    }
    

    // --- Order Management Section (Simple Logic) ---
    // Find existing order for same customer and delivery date
    let existingOrder = await Order.findOne({
      customer_id: customerId,
      delivery_date: {
        $gte: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate()),
        $lt: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate() + 1)
      }
    });

    let order;
    let isReplacement = false;
    
    if (existingOrder) {
      isReplacement = true;
      
      // Delete existing order details
      await OrderDetail.deleteMany({ order_id: existingOrder._id });
      
      // Update existing order
      existingOrder.user = user;
      existingOrder.created_date = orderDate;
      existingOrder.total = 0; // Will be updated below
      order = existingOrder;
    } else {
      // Create new order
      order = await Order.create({
        delivery_date: deliveryDate,
        customer_id: customerId,
        user: user,
        created_date: orderDate,
        total: 0
      });
    }

    // Prepare new order items
    const newOrderDetails = [];
    let totalAmount = 0;

    for (const item of orderItems) {
      // Find vegetable by name (try both name_th and name_eng)
      let vegetable = await Vegetable.findOne({ name_th: item.name });
      if (!vegetable) {
        vegetable = await Vegetable.findOne({ name_eng: item.name });
      }
      
      if (!vegetable) {
        console.warn(`Vegetable not found: ${item.name}`);
        continue;
      }

      const quantity = parseFloat(item.amount);
      const pricePerUnit = parseFloat(item.price);
      const subtotal = pricePerUnit * quantity;
      totalAmount += subtotal;

      newOrderDetails.push({
        order_id: order._id,
        vegetable_id: vegetable._id,
        vegetable_name: vegetable.name_th, // Add vegetable name for broadcast
        quantity: quantity,
        price: pricePerUnit,
        subtotal: subtotal
      });
    }

    // Create new order details
    if (newOrderDetails.length > 0) {
      await OrderDetail.insertMany(newOrderDetails);
    }

    // Update order total and save
    order.total = totalAmount;
    await order.save(); // This will trigger pre('save') hook


    // Get customer info for broadcast
    const customerInfo = await Customer.findById(customerId);
    
    // Broadcast real-time update - format to match frontend expectations
    const orderUpdateData = {
      _id: order._id,
      delivery_date: deliveryDate,
      customer_id: {
        _id: customerId,
        name: user,
        company_name: customerInfo?.company_name || null,
        telephone: customerInfo?.telephone || '',
        pay_method: payMethod
      },
      user: user,
      total: totalAmount,
      paid_status: payMethod === 'cash',
      created_date: new Date(),
      details: newOrderDetails.map(item => ({
        _id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID for new details
        vegetable_id: {
          _id: item.vegetable_id,
          name_th: item.vegetable_name,
          name_eng: null,
          price: item.price,
          status: 'available'
        },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      timestamp: new Date(),
      isReplacement: isReplacement // Add flag to indicate if this is a replacement
    };

    try {
      broadcastOrderUpdate(orderUpdateData);
    } catch (broadcastError) {
      console.error('Failed to broadcast update:', broadcastError);
    }

    return NextResponse.json({ 
      status: 'success',
      orderId: order._id,
      message: 'Order processed successfully',
      totalItems: newOrderDetails.length,
      totalAmount: totalAmount,
      isReplacement: isReplacement
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error in handleOrderPost:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        status: 'error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

function mapPaymentMethod(thaiMethod) {
  const mapping = {
    'เงินสด': 'cash',
    'โอนเงิน': 'transfer',
    'เครดิต': 'credit'
  };
  return mapping[thaiMethod] || 'cash';
}