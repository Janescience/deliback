import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';

export async function GET(request) {
  try {
    await dbConnect();

    // Get customers by order frequency using aggregation
    const customersByOrderFrequency = await Order.aggregate([
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
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalWeight: {
            $sum: {
              $sum: '$orderDetails.quantity'
            }
          }
        }
      },
      {
        $match: {
          orderCount: { $gte: 1 } // Only customers with at least 1 order
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
          orderCount: 1,
          totalRevenue: 1,
          totalWeight: 1
        }
      },
      {
        $sort: { orderCount: -1 } // Sort by highest order count first
      },
      {
        $limit: 50
      }
    ]);

    return NextResponse.json({
      success: true,
      customers: customersByOrderFrequency
    });

  } catch (error) {
    console.error('Failed to fetch customers by order frequency:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}