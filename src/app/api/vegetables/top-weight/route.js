import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OrderDetail from '@/models/OrderDetail';
import Vegetable from '@/models/Vegetable';

export async function GET(request) {
  try {
    await dbConnect();

    // Get top vegetables by quantity sold (using OrderDetail)
    const topVegetablesByWeight = await OrderDetail.aggregate([
      {
        $group: {
          _id: '$vegetable_id',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$subtotal' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'vegetables',
          localField: '_id',
          foreignField: '_id',
          as: 'vegetable'
        }
      },
      {
        $unwind: '$vegetable'
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          vegetableName: '$vegetable.name_th',
          totalWeight: '$totalQuantity', // Using quantity as "weight"
          totalQuantity: '$totalQuantity',
          totalRevenue: '$totalRevenue',
          orderCount: '$orderCount',
          _id: 0
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      vegetables: topVegetablesByWeight
    });

  } catch (error) {
    console.error('Failed to fetch top vegetables by weight:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}