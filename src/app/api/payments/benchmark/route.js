import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';

// GET - Benchmark payments API performance
export async function GET(request) {
  try {
    await connectDB();

    const results = {};

    // Test 1: Current optimized aggregation approach
    const start1 = Date.now();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const unpaidOrdersAgg = await Order.aggregate([
      {
        $match: {
          paid_status: false,
          delivery_date: { $lte: today },
          customer_id: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_id'
        }
      },
      {
        $unwind: '$customer_id'
      },
      {
        $lookup: {
          from: 'orderdetails',
          localField: '_id',
          foreignField: 'order_id',
          as: 'details',
          pipeline: [
            {
              $lookup: {
                from: 'vegetables',
                localField: 'vegetable_id',
                foreignField: '_id',
                as: 'vegetable_id'
              }
            },
            {
              $unwind: '$vegetable_id'
            }
          ]
        }
      },
      {
        $sort: { delivery_date: -1 }
      }
    ]);

    const end1 = Date.now();
    results.optimizedAggregation = {
      timeMs: end1 - start1,
      recordCount: unpaidOrdersAgg.length
    };

    // Test 2: Simple query without joins (minimal data)
    const start2 = Date.now();
    const simpleOrders = await Order.find({
      paid_status: false,
      delivery_date: { $lte: today },
      customer_id: { $exists: true }
    }).select('_id customer_id total delivery_date');
    const end2 = Date.now();

    results.simpleQuery = {
      timeMs: end2 - start2,
      recordCount: simpleOrders.length
    };

    // Test 3: Count only (fastest)
    const start3 = Date.now();
    const count = await Order.countDocuments({
      paid_status: false,
      delivery_date: { $lte: today },
      customer_id: { $exists: true }
    });
    const end3 = Date.now();

    results.countOnly = {
      timeMs: end3 - start3,
      recordCount: count
    };

    return NextResponse.json({
      timestamp: new Date(),
      benchmarks: results,
      recommendation: results.optimizedAggregation.timeMs < 2000
        ? 'Performance is good (< 2 seconds)'
        : 'Consider adding more indexes or query optimization'
    });

  } catch (error) {
    console.error('Benchmark error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}