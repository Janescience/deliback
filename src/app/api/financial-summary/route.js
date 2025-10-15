import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    await dbConnect();
    
    console.log('Starting financial summary aggregation...');
    const startTime = Date.now();
    
    // Use MongoDB aggregation pipeline for better performance
    const result = await Order.aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ['$paid_status', true] }, '$total', 0]
            }
          },
          unpaidAmount: {
            $sum: {
              $cond: [{ $eq: ['$paid_status', false] }, '$total', 0]
            }
          },
          // Breakdown by payment method
          cashPaid: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customer.pay_method', 'cash'] },
                  { $eq: ['$paid_status', true] }
                ]},
                '$total',
                0
              ]
            }
          },
          cashUnpaid: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customer.pay_method', 'cash'] },
                  { $eq: ['$paid_status', false] }
                ]},
                '$total',
                0
              ]
            }
          },
          creditPaid: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customer.pay_method', 'credit'] },
                  { $eq: ['$paid_status', true] }
                ]},
                '$total',
                0
              ]
            }
          },
          creditUnpaid: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customer.pay_method', 'credit'] },
                  { $eq: ['$paid_status', false] }
                ]},
                '$total',
                0
              ]
            }
          },
          transferPaid: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customer.pay_method', 'transfer'] },
                  { $eq: ['$paid_status', true] }
                ]},
                '$total',
                0
              ]
            }
          },
          transferUnpaid: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$customer.pay_method', 'transfer'] },
                  { $eq: ['$paid_status', false] }
                ]},
                '$total',
                0
              ]
            }
          }
        }
      }
    ]);
    
    const endTime = Date.now();
    console.log(`Financial summary aggregation completed in ${endTime - startTime}ms`);
    
    if (!result || result.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paymentMethodBreakdown: {
          cash: { paid: 0, unpaid: 0 },
          credit: { paid: 0, unpaid: 0 },
          transfer: { paid: 0, unpaid: 0 }
        }
      });
    }
    
    const summary = result[0];
    
    const response = {
      totalRevenue: summary.totalRevenue || 0,
      paidAmount: summary.paidAmount || 0,
      unpaidAmount: summary.unpaidAmount || 0,
      paymentMethodBreakdown: {
        cash: { 
          paid: summary.cashPaid || 0, 
          unpaid: summary.cashUnpaid || 0 
        },
        credit: { 
          paid: summary.creditPaid || 0, 
          unpaid: summary.creditUnpaid || 0 
        },
        transfer: { 
          paid: summary.transferPaid || 0, 
          unpaid: summary.transferUnpaid || 0 
        }
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Financial summary error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}