import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PaymentLog from '@/models/PaymentLog';

// GET - Fetch payment history logs
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Build query
    const query = {};
    if (customerId) {
      query.customer_id = customerId;
    }

    // Get payment logs with populated data
    const logs = await PaymentLog.find(query)
      .populate('customer_id', 'name company_name pay_method')
      .populate('order_ids', 'delivery_date docnumber total')
      .populate('original_log_id')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Get total count for pagination
    const totalCount = await PaymentLog.countDocuments(query);

    // Format the logs for display
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      action: log.action,
      action_type: log.action_type,
      customer: log.customer_id,
      order_count: log.order_ids.length,
      orders: log.order_ids,
      total_amount: log.total_amount,
      billing_cycle: log.billing_cycle,
      user: log.user,
      created_at: log.createdAt,
      is_undone: log.is_undone,
      undone_at: log.undone_at,
      undone_by: log.undone_by,
      undo_reason: log.undo_reason,
      can_undo: log.action === 'mark_paid' && !log.is_undone &&
                (new Date() - new Date(log.createdAt)) < (24 * 60 * 60 * 1000), // Can undo within 24 hours
      original_log: log.original_log_id
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        has_more: (offset + limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดประวัติการชำระเงินได้' },
      { status: 500 }
    );
  }
}