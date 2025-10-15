import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import mongoose from 'mongoose';
import { getThailandToday, getThailandCurrentYear } from '@/lib/thailand-time';

export async function GET(request) {
  try {
    await dbConnect();
    
    const startTime = Date.now();
    
    // Use Thailand timezone for current year calculation
    const today = getThailandToday();
    const currentYear = today.getUTCFullYear();
    const { start: yearStart, end: yearEnd } = getThailandCurrentYear();

    // Use MongoDB aggregation pipeline for optimal performance
    const result = await Order.aggregate([
      {
        // Filter orders for current year only using Thailand timezone
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
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order_id',
          as: 'details'
        }
      },
      {
        // Group by month and calculate total revenue and total weight
        $group: {
          _id: { $month: '$delivery_date' },
          revenue: { $sum: '$total' },
          totalWeight: {
            $sum: {
              $reduce: {
                input: '$details',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.quantity'] }
              }
            }
          }
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
    
    // Get current month (1-based) using Thailand timezone
    const currentMonth = today.getUTCMonth() + 1;
    
    // Initialize only months up to current month
    const monthlyData = Array.from({ length: currentMonth }, (_, index) => ({
      month: index + 1,
      monthName: monthNames[index],
      revenue: 0,
      totalWeight: 0,
      monthNumber: index + 1
    }));
    
    // Fill in actual revenue and weight data (only for months up to current month)
    result.forEach(item => {
      const monthIndex = item._id - 1; // MongoDB months are 1-based
      if (monthIndex >= 0 && monthIndex < currentMonth) {
        monthlyData[monthIndex].revenue = item.revenue || 0;
        monthlyData[monthIndex].totalWeight = item.totalWeight || 0;
      }
    });
    
    return NextResponse.json({
      year: currentYear,
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