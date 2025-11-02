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

    // Get average performance from last 3 months for realistic targets
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);

    const historicalPerformance = await Order.aggregate([
      {
        $match: {
          delivery_date: { $gte: threeMonthsAgo, $lt: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$delivery_date' },
            month: { $month: '$delivery_date' }
          },
          monthlyOrders: { $sum: 1 },
          monthlyRevenue: { $sum: '$total' }
        }
      },
      {
        $group: {
          _id: null,
          avgOrders: { $avg: '$monthlyOrders' },
          avgRevenue: { $avg: '$monthlyRevenue' },
          avgOrderValue: { $avg: { $divide: ['$monthlyRevenue', '$monthlyOrders'] } }
        }
      }
    ]);

    const performance = monthlyPerformance[0] || { ordersActual: 0, revenueActual: 0 };
    const historical = historicalPerformance[0];

    // Calculate targets based on historical average + 10% growth
    let revenueTarget, ordersTarget;

    if (historical && historical.avgRevenue > 0) {
      // Use historical data with 10% growth target
      revenueTarget = Math.round(historical.avgRevenue * 1.1);
      ordersTarget = Math.round(historical.avgOrders * 1.1);
    } else {
      // Fallback to default values if no historical data
      revenueTarget = 100000; // 100,000 บาท
      ordersTarget = 200; // 200 ออเดอร์
    }

    return NextResponse.json({
      success: true,
      revenueActual: performance.revenueActual,
      revenueTarget,
      ordersActual: performance.ordersActual,
      ordersTarget,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
      // Add debug info
      historical: historical ? {
        avgOrders: Math.round(historical.avgOrders),
        avgRevenue: Math.round(historical.avgRevenue),
        avgOrderValue: Math.round(historical.avgOrderValue)
      } : null
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