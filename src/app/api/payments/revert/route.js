import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import PaymentLog from '@/models/PaymentLog';

export async function POST(request) {
  try {
    await dbConnect();

    const { orderIds } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'orderIds array จำเป็นต้องระบุ' },
        { status: 400 }
      );
    }

    // ดึงข้อมูล orders ก่อนอัพเดท เพื่อบันทึกลง PaymentLog
    const ordersBeforeUpdate = await Order.find({
      _id: { $in: orderIds },
      paid_status: true
    })
    .populate('customer_id')
    .lean();

    if (ordersBeforeUpdate.length === 0) {
      return NextResponse.json(
        { error: 'ไม่พบรายการที่สามารถยกเลิกการชำระได้' },
        { status: 404 }
      );
    }

    // คำนวณยอดรวมและข้อมูลลูกค้า
    const totalAmount = ordersBeforeUpdate.reduce((sum, order) => sum + (order.total || 0), 0);
    const customerId = ordersBeforeUpdate[0].customer_id._id;

    // บันทึกสถานะเดิมก่อนอัพเดท
    const previousState = ordersBeforeUpdate.map(order => ({
      order_id: order._id,
      paid_status: order.paid_status,
      paid_date: order.paid_date
    }));

    // อัพเดท orders ให้กลับเป็น unpaid
    const now = new Date();
    const result = await Order.updateMany(
      {
        _id: { $in: orderIds },
        paid_status: true
      },
      {
        $set: {
          paid_status: false,
          paid_date: null,
          updatedAt: now
        }
      }
    );

    // บันทึกสถานะใหม่หลังอัพเดท
    const newState = ordersBeforeUpdate.map(order => ({
      order_id: order._id,
      paid_status: false,
      paid_date: null
    }));

    // สร้าง PaymentLog สำหรับการยกเลิกการชำระเงิน
    const paymentLog = await PaymentLog.create({
      action: 'revert_payment',
      action_type: 'manual_revert',
      order_ids: orderIds,
      customer_id: customerId,
      previous_state: previousState,
      new_state: newState,
      total_amount: totalAmount,
      user: 'admin', // TODO: Get from session/auth
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      message: `ยกเลิกการชำระเงินของ ${result.modifiedCount} รายการเรียบร้อย`,
      modifiedCount: result.modifiedCount,
      logId: paymentLog._id
    });

  } catch (error) {
    console.error('POST revert payment error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}