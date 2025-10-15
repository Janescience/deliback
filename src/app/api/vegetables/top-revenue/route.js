import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OrderDetail from '@/models/OrderDetail';
import Vegetable from '@/models/Vegetable';

export async function GET(request) {
  try {
    await dbConnect();

    // Get top vegetables by revenue
    const topVegetablesByRevenue = await OrderDetail.aggregate([
      {
        $group: {
          _id: '$vegetable_id',
          totalRevenue: { $sum: '$subtotal' },
          totalQuantity: { $sum: '$quantity' },
          orderCount: { $sum: 1 },
          avgPrice: { $avg: '$price' }
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
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          vegetableName: '$vegetable.name_th',
          totalRevenue: '$totalRevenue',
          totalWeight: '$totalQuantity', // Using quantity as "weight"
          totalQuantity: '$totalQuantity',
          orderCount: '$orderCount',
          avgPricePerKg: { $round: ['$avgPrice', 2] },
          _id: 0
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      vegetables: topVegetablesByRevenue
    });

  } catch (error) {
    console.error('Failed to fetch top vegetables by revenue:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}