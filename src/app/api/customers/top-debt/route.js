import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';

export async function GET(request) {
  try {
    await dbConnect();

    // Get customers with outstanding debt using aggregation
    const customersWithDebt = await Order.aggregate([
      {
        $match: {
          customer_id: { $ne: null },
          paid_status: false // Only unpaid orders
        }
      },
      {
        $group: {
          _id: '$customer_id',
          unpaidAmount: { $sum: '$total' },
          unpaidOrders: { $sum: 1 }
        }
      },
      {
        $match: {
          unpaidAmount: { $gt: 0 } // Only customers with actual debt
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
          unpaidAmount: 1,
          unpaidOrders: 1
        }
      },
      {
        $sort: { unpaidAmount: -1 } // Sort by highest debt first
      },
      {
        $limit: 50
      }
    ]);

    return NextResponse.json({
      success: true,
      customers: customersWithDebt
    });

  } catch (error) {
    console.error('Failed to fetch customers with outstanding debt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}