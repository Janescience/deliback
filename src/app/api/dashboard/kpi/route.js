import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import {
  getThailandToday,
  getThailandDayRange,
  getThailandCurrentMonth,
  addThailandDays
} from '@/lib/thailand-time';

export async function GET(request) {
  try {
    await dbConnect();

    // Use Thailand timezone for all date calculations
    const today = getThailandToday();
    const { start: todayStart, end: todayEnd } = getThailandDayRange(today);

    const yesterday = addThailandDays(today, -1);
    const { start: yesterdayStart, end: yesterdayEnd } = getThailandDayRange(yesterday);

    const { start: thisMonthStart } = getThailandCurrentMonth();

    // Calculate last month range
    const lastMonth = addThailandDays(thisMonthStart, -1);
    const lastMonthYear = lastMonth.getUTCFullYear();
    const lastMonthMonth = lastMonth.getUTCMonth();
    const lastMonthStart = new Date(Date.UTC(lastMonthYear, lastMonthMonth, 1, 0, 0, 0, 0));
    const lastMonthEnd = new Date(Date.UTC(lastMonthYear, lastMonthMonth + 1, 0, 23, 59, 59, 999));

    // Get total customers
    const totalCustomers = await Customer.countDocuments();

    // Get new customers this month vs last month
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: thisMonthStart }
    });

    const newCustomersLastMonth = await Customer.countDocuments({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Get today's orders and revenue
    const [todayOrders, yesterdayOrders] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            delivery_date: { $gte: todayStart, $lte: todayEnd }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            delivery_date: { $gte: yesterdayStart, $lte: yesterdayEnd }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ])
    ]);

    const todayOrdersCount = todayOrders[0]?.count || 0;
    const todayRevenue = todayOrders[0]?.revenue || 0;
    const yesterdayOrdersCount = yesterdayOrders[0]?.count || 0;
    const yesterdayRevenue = yesterdayOrders[0]?.revenue || 0;

    // Calculate growth percentages with better logic
    const calculateGrowth = (current, previous) => {
      if (previous === 0 && current === 0) return 0;
      if (previous === 0 && current > 0) return 100;
      if (previous > 0 && current === 0) return -100;
      return Math.round(((current - previous) / previous) * 100);
    };

    const customerGrowth = lastMonthStart.getMonth() === today.getMonth() ? 0 :
      calculateGrowth(newCustomersThisMonth, newCustomersLastMonth);

    const todayOrdersGrowth = calculateGrowth(todayOrdersCount, yesterdayOrdersCount);

    const todayRevenueGrowth = calculateGrowth(todayRevenue, yesterdayRevenue);

    const newCustomersGrowth = calculateGrowth(newCustomersThisMonth, newCustomersLastMonth);

    // Calculate average daily weight from all orders (last 30 days)
    const thirtyDaysAgo = addThailandDays(today, -30);
    const { start: thirtyDaysStart } = getThailandDayRange(thirtyDaysAgo);

    const dailyAverageData = await Order.aggregate([
      {
        $match: {
          delivery_date: { $gte: thirtyDaysStart, $lte: todayEnd }
        }
      },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order_id',
          as: 'orderDetails'
        }
      },
      {
        $addFields: {
          totalWeight: { $sum: '$orderDetails.quantity' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$delivery_date" }
          },
          dailyWeight: { $sum: '$totalWeight' }
        }
      },
      {
        $group: {
          _id: null,
          avgDailyWeight: { $avg: '$dailyWeight' },
          totalDays: { $sum: 1 }
        }
      }
    ]);

    const avgDailyWeight = dailyAverageData[0]?.avgDailyWeight || 0;
    const previousPeriodStart = addThailandDays(thirtyDaysStart, -30);
    const previousPeriodEnd = addThailandDays(thirtyDaysStart, -1);

    // Get previous 30 days average for comparison
    const prevDailyAverageData = await Order.aggregate([
      {
        $match: {
          delivery_date: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
        }
      },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order_id',
          as: 'orderDetails'
        }
      },
      {
        $addFields: {
          totalWeight: { $sum: '$orderDetails.quantity' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$delivery_date" }
          },
          dailyWeight: { $sum: '$totalWeight' }
        }
      },
      {
        $group: {
          _id: null,
          avgDailyWeight: { $avg: '$dailyWeight' }
        }
      }
    ]);

    const prevAvgDailyWeight = prevDailyAverageData[0]?.avgDailyWeight || 0;
    const dailyWeightGrowth = calculateGrowth(avgDailyWeight, prevAvgDailyWeight);

    return NextResponse.json({
      success: true,
      totalCustomers,
      todayOrders: todayOrdersCount,
      todayRevenue,
      avgDailyWeight: Math.round(avgDailyWeight * 100) / 100, // round to 2 decimals
      customerGrowth,
      todayOrdersGrowth,
      todayRevenueGrowth,
      dailyWeightGrowth
    });

  } catch (error) {
    console.error('Failed to fetch dashboard KPI:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}