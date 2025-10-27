import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const month = searchParams.get('month');

    if (!customerId || !month) {
      return NextResponse.json(
        { error: 'customerId และ month จำเป็นต้องระบุ' },
        { status: 400 }
      );
    }

    // แปลง month string (YYYY-MM) เป็น date range
    const [year, monthNum] = month.split('-');
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59);

    // ค้นหา orders ที่ชำระแล้วในเดือนที่กำหนด
    const orders = await Order.find({
      customer_id: customerId,
      paid_status: true,
      delivery_date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('customer_id', 'name company_name')
    .sort({ delivery_date: -1 })
    .lean();

    // ค้นหา order details สำหรับแต่ละ order
    for (let order of orders) {
      const details = await OrderDetail.find({ order_id: order._id })
        .populate('vegetable_id', 'name_th name_eng')
        .lean();

      order.items = details.map(detail => ({
        name: detail.vegetable_id?.name_th || detail.vegetable_id?.name_eng || 'Unknown',
        quantity: detail.quantity,
        unit: 'กก.',
        price: detail.price,
        subtotal: detail.subtotal
      }));
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      count: orders.length
    });

  } catch (error) {
    console.error('GET paid orders error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}