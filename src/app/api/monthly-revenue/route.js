import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import mongoose from 'mongoose';
import { getThailandToday, getThailandCurrentYear } from '@/lib/thailand-time';

export async function GET(request) {
  try {
    await dbConnect();

    // Get year from query params or use current year
    const { searchParams } = new URL(request.url);
    const today = getThailandToday();
    const currentYear = today.getUTCFullYear();
    const selectedYear = parseInt(searchParams.get('year')) || currentYear;

    // Calculate year range for selected year
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999));

    // Use MongoDB aggregation pipeline with better join handling
    const result = await Order.aggregate([
      {
        // Filter orders for selected year
        $match: {
          delivery_date: {
            $gte: yearStart,
            $lte: yearEnd
          }
        }
      },
      {
        // Lookup order details to get vegetable quantities
        $lookup: {
          from: 'orderdetails', // Collection name should match exactly
          localField: '_id',
          foreignField: 'order_id',
          as: 'orderDetails',
          pipeline: [
            {
              $project: {
                quantity: 1,
                subtotal: 1
              }
            }
          ]
        }
      },
      {
        // Add calculated fields
        $addFields: {
          totalWeight: {
            $sum: '$orderDetails.quantity'
          },
          calculatedTotal: {
            $sum: '$orderDetails.subtotal'
          }
        }
      },
      {
        // Group by date first to count unique days
        $group: {
          _id: {
            month: { $month: '$delivery_date' },
            day: { $dayOfMonth: '$delivery_date' }
          },
          dailyRevenue: { $sum: { $ifNull: ['$total', '$calculatedTotal'] } },
          dailyWeight: { $sum: '$totalWeight' },
          dailyOrders: { $sum: 1 }
        }
      },
      {
        // Then group by month to get totals and count unique days
        $group: {
          _id: '$_id.month',
          revenue: { $sum: '$dailyRevenue' },
          totalWeight: { $sum: '$dailyWeight' },
          orderCount: { $sum: '$dailyOrders' },
          workingDays: { $sum: 1 },
          avgOrdersPerDay: { $avg: '$dailyOrders' },
          avgWeightPerDay: { $avg: '$dailyWeight' }
        }
      },
      {
        // Sort by month
        $sort: { '_id': 1 }
      }
    ]);
    
    const endTime = Date.now();
    
    // Create array for all 12 months with Thai names
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    // Initialize all 12 months
    const monthlyData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      monthName: monthNames[index],
      revenue: 0,
      totalWeight: 0,
      orderCount: 0,
      workingDays: 0,
      avgOrdersPerDay: 0,
      avgWeightPerDay: 0,
      monthNumber: index + 1
    }));

    // Fill in actual data for months that have data
    result.forEach(item => {
      const monthIndex = item._id - 1; // MongoDB months are 1-based
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].revenue = item.revenue || 0;
        monthlyData[monthIndex].totalWeight = item.totalWeight || 0;
        monthlyData[monthIndex].orderCount = item.orderCount || 0;
        monthlyData[monthIndex].workingDays = item.workingDays || 0;
        monthlyData[monthIndex].avgOrdersPerDay = Math.round((item.avgOrdersPerDay || 0) * 10) / 10;
        monthlyData[monthIndex].avgWeightPerDay = Math.round((item.avgWeightPerDay || 0) * 10) / 10;
      }
    });

    // Get available years from orders
    const yearsResult = await Order.aggregate([
      {
        $group: {
          _id: { $year: '$delivery_date' }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    const availableYears = yearsResult.map(y => y._id).filter(y => y);

    return NextResponse.json({
      year: selectedYear,
      availableYears,
      data: monthlyData
    });

  } catch (error) {
    console.error('Monthly revenue error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}