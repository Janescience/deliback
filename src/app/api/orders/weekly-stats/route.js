import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    await dbConnect();

    // Get day-of-week statistics for orders
    const weeklyStats = await Order.aggregate([
      {
        $match: {
          customer_id: { $ne: null },
          delivery_date: { $exists: true },
          total: { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$delivery_date' },
          orderRevenue: '$total',
          deliveryDateOnly: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: '$delivery_date'
            }
          }
        }
      },
      {
        $group: {
          _id: '$dayOfWeek',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$orderRevenue' },
          uniqueDates: { $addToSet: '$deliveryDateOnly' }
        }
      },
      {
        $addFields: {
          uniqueDaysCount: { $size: '$uniqueDates' },
          averageOrdersPerDay: { $divide: ['$totalOrders', '$uniqueDaysCount'] },
          averageRevenuePerDay: { $divide: ['$totalRevenue', '$uniqueDaysCount'] }
        }
      },
      {
        $project: {
          dayOfWeek: '$_id',
          totalOrders: 1,
          totalRevenue: 1,
          uniqueDays: '$uniqueDaysCount',
          averageOrdersPerDay: { $round: [{ $divide: ['$totalOrders', '$uniqueDaysCount'] }, 1] },
          averageRevenuePerDay: { $round: [{ $divide: ['$totalRevenue', '$uniqueDaysCount'] }, 0] },
          _id: 0
        }
      },
      {
        $sort: { dayOfWeek: 1 }
      }
    ]);

    // Convert MongoDB dayOfWeek to Thai day names
    // MongoDB: 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday, 7=Saturday
    const dayNames = {
      1: { th: 'อาทิตย์', en: 'Sunday' },
      2: { th: 'จันทร์', en: 'Monday' },
      3: { th: 'อังคาร', en: 'Tuesday' },
      4: { th: 'พุธ', en: 'Wednesday' },
      5: { th: 'พฤหัสบดี', en: 'Thursday' },
      6: { th: 'ศุกร์', en: 'Friday' },
      7: { th: 'เสาร์', en: 'Saturday' }
    };

    // Map results and ensure all days are present
    const completeWeekStats = [];

    for (let dayNum = 2; dayNum <= 7; dayNum++) { // Monday to Saturday
      const dayData = weeklyStats.find(day => day.dayOfWeek === dayNum);
      completeWeekStats.push({
        dayOfWeek: dayNum,
        dayName: dayNames[dayNum],
        totalOrders: dayData?.totalOrders || 0,
        totalRevenue: dayData?.totalRevenue || 0,
        uniqueDays: dayData?.uniqueDays || 0,
        averageOrdersPerDay: dayData?.averageOrdersPerDay || 0,
        averageRevenuePerDay: dayData?.averageRevenuePerDay || 0
      });
    }

    // Add Sunday at the end
    const sundayData = weeklyStats.find(day => day.dayOfWeek === 1);
    completeWeekStats.push({
      dayOfWeek: 1,
      dayName: dayNames[1],
      totalOrders: sundayData?.totalOrders || 0,
      totalRevenue: sundayData?.totalRevenue || 0,
      uniqueDays: sundayData?.uniqueDays || 0,
      averageOrdersPerDay: sundayData?.averageOrdersPerDay || 0,
      averageRevenuePerDay: sundayData?.averageRevenuePerDay || 0
    });

    return NextResponse.json({
      success: true,
      weeklyStats: completeWeekStats
    });

  } catch (error) {
    console.error('Failed to fetch weekly order statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}