import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    await dbConnect();

    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Get this month's actual performance
    const monthlyPerformance = await Order.aggregate([
      {
        $match: {
          delivery_date: { $gte: thisMonthStart, $lt: thisMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
          ordersActual: { $sum: 1 },
          revenueActual: { $sum: '$total' }
        }
      }
    ]);

    const performance = monthlyPerformance[0] || { ordersActual: 0, revenueActual: 0 };

    // Set monthly targets (realistic targets based on actual business)
    const revenueTarget = 100000; // 100,000 บาท
    const ordersTarget = 200; // 200 ออเดอร์

    return NextResponse.json({
      success: true,
      revenueActual: performance.revenueActual,
      revenueTarget,
      ordersActual: performance.ordersActual,
      ordersTarget,
      month: today.getMonth() + 1,
      year: today.getFullYear()
    });

  } catch (error) {
    console.error('Failed to fetch monthly goals:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}