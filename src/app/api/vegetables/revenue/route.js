import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OrderDetail from '@/models/OrderDetail';
import Vegetable from '@/models/Vegetable';

// GET vegetable revenue statistics
export async function GET(request) {
  try {
    await dbConnect();


    // Aggregate revenue by vegetable
    const revenueStats = await OrderDetail.aggregate([
      {
        $group: {
          _id: "$vegetable_id",
          totalRevenue: {
            $sum: "$subtotal"
          },
          totalQuantity: {
            $sum: "$quantity"
          },
          orderCount: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          totalRevenue: -1 // Sort by revenue descending
        }
      }
    ]);


    // Get vegetable details and add ranking
    const vegetablesWithRevenue = await Promise.all(
      revenueStats.map(async (stat, index) => {
        try {
          const vegetable = await Vegetable.findById(stat._id).lean();

          if (!vegetable) {
            return null;
          }

          return {
            ...vegetable,
            totalRevenue: stat.totalRevenue,
            totalQuantity: stat.totalQuantity,
            orderCount: stat.orderCount,
            ranking: index + 1 // 1-based ranking
          };
        } catch (error) {
          console.error('Error fetching vegetable:', stat._id, error);
          return null;
        }
      })
    );

    // Filter out null values (vegetables that couldn't be found)
    const validVegetables = vegetablesWithRevenue.filter(v => v !== null);


    return NextResponse.json({
      vegetables: validVegetables,
      totalVegetables: validVegetables.length
    });
  } catch (error) {
    console.error('Vegetable revenue statistics error:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}