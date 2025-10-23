import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PaymentLog from '@/models/PaymentLog';
import Order from '@/models/Order';

// POST - Undo a payment action
export async function POST(request) {
  try {
    await connectDB();

    const { logId, reason = 'ผู้ใช้ขอย้อนคืน' } = await request.json();

    if (!logId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ Log ID ที่ต้องการย้อนคืน' },
        { status: 400 }
      );
    }

    // Find the original log
    const originalLog = await PaymentLog.findById(logId);

    if (!originalLog) {
      return NextResponse.json(
        { error: 'ไม่พบบันทึกการชำระเงินที่ระบุ' },
        { status: 404 }
      );
    }

    // Check if already undone
    if (originalLog.is_undone) {
      return NextResponse.json(
        { error: 'การชำระเงินนี้ถูกย้อนคืนแล้ว' },
        { status: 400 }
      );
    }

    // Check if undo is allowed (within 24 hours for mark_paid actions)
    const timeDiff = new Date() - new Date(originalLog.createdAt);
    const maxUndoTime = 24 * 60 * 60 * 1000; // 24 hours

    if (originalLog.action === 'mark_paid' && timeDiff > maxUndoTime) {
      return NextResponse.json(
        { error: 'ไม่สามารถย้อนคืนได้ เกินเวลาที่กำหนด (24 ชั่วโมง)' },
        { status: 400 }
      );
    }

    // Get current state of orders to verify they haven't been changed
    const currentOrders = await Order.find({
      _id: { $in: originalLog.order_ids }
    }).lean();

    // Verify orders are still in the state we expect
    const stateChanged = currentOrders.some(order => {
      const expectedState = originalLog.new_state.find(
        state => state.order_id.toString() === order._id.toString()
      );
      return !expectedState ||
             order.paid_status !== expectedState.paid_status ||
             (order.paid_date && expectedState.paid_date &&
              Math.abs(new Date(order.paid_date) - new Date(expectedState.paid_date)) > 1000);
    });

    if (stateChanged) {
      return NextResponse.json(
        { error: 'ไม่สามารถย้อนคืนได้ เนื่องจากสถานะของรายการได้ถูกเปลี่ยนแปลงแล้ว' },
        { status: 400 }
      );
    }

    // Restore previous state
    const bulkOps = originalLog.previous_state.map(prevState => ({
      updateOne: {
        filter: { _id: prevState.order_id },
        update: {
          $set: {
            paid_status: prevState.paid_status,
            paid_date: prevState.paid_date,
            updatedAt: new Date()
          }
        }
      }
    }));

    const result = await Order.bulkWrite(bulkOps);

    // Mark original log as undone
    await PaymentLog.findByIdAndUpdate(logId, {
      is_undone: true,
      undone_at: new Date(),
      undone_by: 'admin', // TODO: Get from session/auth
      undo_reason: reason
    });

    // Create undo log entry
    const undoLog = await PaymentLog.create({
      action: originalLog.action === 'mark_paid' ? 'mark_unpaid' : 'mark_paid',
      action_type: originalLog.action_type,
      order_ids: originalLog.order_ids,
      customer_id: originalLog.customer_id,
      previous_state: originalLog.new_state, // What we're changing from
      new_state: originalLog.previous_state, // What we're changing to
      total_amount: originalLog.total_amount,
      billing_cycle: originalLog.billing_cycle,
      user: 'admin', // TODO: Get from session/auth
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      original_log_id: logId
    });

    return NextResponse.json({
      success: true,
      undoLogId: undoLog._id,
      originalLogId: logId,
      restoredCount: result.modifiedCount,
      message: `ย้อนคืนการชำระเงินสำเร็จ ${result.modifiedCount} รายการ`
    });

  } catch (error) {
    console.error('Error undoing payment:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถย้อนคืนการชำระเงินได้' },
      { status: 500 }
    );
  }
}