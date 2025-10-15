import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';

export async function GET(request) {
  try {
    await dbConnect();

    // Get customer revenue using aggregation
    const customerRevenue = await Order.aggregate([
      {
        $match: {
          customer_id: { $ne: null }
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
        $group: {
          _id: '$customer_id',
          totalRevenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
          totalWeight: {
            $sum: {
              $sum: '$orderDetails.quantity'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          _id: '$customer._id',
          name: '$customer.name',
          payMethod: '$customer.pay_method',
          totalRevenue: 1,
          orderCount: 1,
          totalWeight: 1
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 50
      }
    ]);

    return NextResponse.json({
      success: true,
      customers: customerRevenue
    });

  } catch (error) {
    console.error('Failed to fetch top customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}