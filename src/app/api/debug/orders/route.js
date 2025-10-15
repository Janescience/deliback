import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    await dbConnect();

    // Get sample orders to debug
    const sampleOrders = await Order.find({ customer_id: { $ne: null } })
      .populate('customer_id', 'name')
      .limit(10)
      .lean();

    console.log('Sample orders:', sampleOrders);

    // Check day of week calculation
    const dayOfWeekTest = await Order.aggregate([
      {
        $match: {
          customer_id: { $ne: null }
        }
      },
      {
        $addFields: {
          dayOfWeek: { $dayOfWeek: '$delivery_date' },
          deliveryDateString: { $dateToString: { format: "%Y-%m-%d", date: '$delivery_date' } },
          isoWeekday: { $isoDayOfWeek: '$delivery_date' }
        }
      },
      {
        $limit: 10
      }
    ]);

    console.log('Day of week test:', dayOfWeekTest);

    return NextResponse.json({
      success: true,
      sampleOrders,
      dayOfWeekTest,
      totalOrderCount: await Order.countDocuments({ customer_id: { $ne: null } })
    });

  } catch (error) {
    console.error('Debug orders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}