import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import Customer from '@/models/Customer';

// POST - Create database indexes for better performance
export async function POST(request) {
  try {
    await connectDB();

    const results = [];

    // Orders collection indexes
    try {
      // Index for payments API query
      await Order.collection.createIndex({
        paid_status: 1,
        delivery_date: 1,
        customer_id: 1
      }, { background: true });
      results.push('Orders: paid_status + delivery_date + customer_id');

      // Index for customer_id lookups
      await Order.collection.createIndex({ customer_id: 1 }, { background: true });
      results.push('Orders: customer_id');

      // Index for delivery_date range queries
      await Order.collection.createIndex({ delivery_date: 1 }, { background: true });
      results.push('Orders: delivery_date');

    } catch (error) {
      console.log('Orders indexes may already exist:', error.message);
    }

    // OrderDetails collection indexes
    try {
      // Index for order_id lookups
      await OrderDetail.collection.createIndex({ order_id: 1 }, { background: true });
      results.push('OrderDetails: order_id');

      // Index for vegetable_id lookups
      await OrderDetail.collection.createIndex({ vegetable_id: 1 }, { background: true });
      results.push('OrderDetails: vegetable_id');

    } catch (error) {
      console.log('OrderDetails indexes may already exist:', error.message);
    }

    // Customers collection indexes
    try {
      // Index for pay_method filtering
      await Customer.collection.createIndex({ pay_method: 1 }, { background: true });
      results.push('Customers: pay_method');

      // Index for name searches
      await Customer.collection.createIndex({ name: 1 }, { background: true });
      results.push('Customers: name');

    } catch (error) {
      console.log('Customers indexes may already exist:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Database indexes created successfully',
      indexes: results
    });

  } catch (error) {
    console.error('Error creating indexes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET - Check existing indexes
export async function GET(request) {
  try {
    await connectDB();

    const ordersIndexes = await Order.collection.getIndexes();
    const orderDetailsIndexes = await OrderDetail.collection.getIndexes();
    const customersIndexes = await Customer.collection.getIndexes();

    return NextResponse.json({
      orders: ordersIndexes,
      orderDetails: orderDetailsIndexes,
      customers: customersIndexes
    });

  } catch (error) {
    console.error('Error getting indexes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}