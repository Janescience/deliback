import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import Customer from '@/models/Customer';
import Vegetable from '@/models/Vegetable';

// GET - Fetch unpaid orders grouped by customer
export async function GET() {
  try {
    await connectDB();

    // Find all orders - unpaid credit/transfer with delivery_date <= today
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    const unpaidOrders = await Order.find({
      paid_status: false,
      delivery_date: { $lte: today }
    }).populate('customer_id');

    // Cash orders that are unpaid and delivered (delivery_date <= today)
    const cashOrders = await Order.find({
      'customer_id': { $exists: true },
      paid_status: false,
      delivery_date: { $lte: today }
    }).populate('customer_id');

    // Filter orders that are credit or transfer only and unpaid
    const filteredOrders = unpaidOrders.filter(order => 
      order.customer_id && 
      ['credit', 'transfer'].includes(order.customer_id.pay_method)
    );

    // Filter cash orders for reconciliation (unpaid + delivered)
    const filteredCashOrders = cashOrders.filter(order =>
      order.customer_id &&
      order.customer_id.pay_method === 'cash'
    );

    // Get order details for each order
    const ordersWithDetails = await Promise.all(
      filteredOrders.map(async (order) => {
        const orderDetails = await OrderDetail.find({ order_id: order._id })
          .populate('vegetable_id');
        
        const orderObj = order.toObject();
        orderObj.details = orderDetails.map(detail => detail.toObject());
        return orderObj;
      })
    );

    // Helper function to get billing cycle from delivery date
    const getBillingCycle = (deliveryDate) => {
      const date = new Date(deliveryDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 0-based to 1-based
      const day = date.getDate();
      
      if (day >= 15) {
        // If day is 15 or later, billing cycle is next month
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
      } else {
        // If day is before 15, billing cycle is current month
        return `${year}-${month.toString().padStart(2, '0')}`;
      }
    };

    // Helper function to check if a billing cycle is overdue (after 22nd of billing month)
    const isBillingCycleOverdue = (billingCycle) => {
      const [year, month] = billingCycle.split('-').map(Number);
      const billDueDate = new Date(year, month - 1, 22); // 22nd of billing month
      billDueDate.setHours(23, 59, 59, 999); // End of 22nd
      
      return today > billDueDate;
    };

    // Helper function to calculate overdue days for billing cycle
    const getOverdueDays = (billingCycle) => {
      const [year, month] = billingCycle.split('-').map(Number);
      const billDueDate = new Date(year, month - 1, 22); // 22nd of billing month
      billDueDate.setHours(23, 59, 59, 999); // End of 22nd
      
      if (today <= billDueDate) return 0;
      
      const diffTime = today - billDueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // Helper function to calculate overdue days for individual order (transfer)
    const getOrderOverdueDays = (deliveryDate) => {
      const delivery = new Date(deliveryDate);
      delivery.setHours(23, 59, 59, 999); // End of delivery date
      
      if (today <= delivery) return 0;
      
      const diffTime = today - delivery;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // Group orders by customer
    const customerGroups = {};
    
    ordersWithDetails.forEach(order => {
      const customerId = order.customer_id?._id?.toString();
      if (!customerId) return;

      if (!customerGroups[customerId]) {
        customerGroups[customerId] = {
          customer: order.customer_id,
          payMethod: order.customer_id.pay_method,
          unpaidOrders: [],
          billingCycles: {},
          totalUnpaid: 0
        };
      }

      const customerGroup = customerGroups[customerId];
      
      // Add overdue days for transfer orders
      if (order.customer_id.pay_method === 'transfer') {
        order.overdueDays = getOrderOverdueDays(order.delivery_date);
      }
      
      customerGroup.unpaidOrders.push(order);
      customerGroup.totalUnpaid += order.total || 0;

      // If credit payment, also group by billing cycle
      if (order.customer_id.pay_method === 'credit') {
        const billingCycle = getBillingCycle(order.delivery_date);
        
        if (!customerGroup.billingCycles[billingCycle]) {
          customerGroup.billingCycles[billingCycle] = {
            cycle: billingCycle,
            orders: [],
            total: 0
          };
        }
        
        customerGroup.billingCycles[billingCycle].orders.push(order);
        customerGroup.billingCycles[billingCycle].total += order.total || 0;
      }
    });

    // Convert to arrays and filter credit customers to show only overdue bills
    const creditCustomers = Object.values(customerGroups)
      .filter(c => c.payMethod === 'credit')
      .map(customerGroup => {
        // Filter billing cycles to show only overdue ones
        const overdueBillingCycles = {};
        let overdueTotal = 0;
        
        Object.keys(customerGroup.billingCycles).forEach(cycle => {
          if (isBillingCycleOverdue(cycle)) {
            overdueBillingCycles[cycle] = {
              ...customerGroup.billingCycles[cycle],
              overdueDays: getOverdueDays(cycle)
            };
            overdueTotal += customerGroup.billingCycles[cycle].total;
          }
        });
        
        // Only return customer if they have overdue bills
        if (Object.keys(overdueBillingCycles).length > 0) {
          return {
            ...customerGroup,
            billingCycles: overdueBillingCycles,
            totalUnpaid: overdueTotal,
            unpaidOrders: Object.values(overdueBillingCycles).flatMap(cycle => cycle.orders)
          };
        }
        return null;
      })
      .filter(c => c !== null)
      .sort((a, b) => b.totalUnpaid - a.totalUnpaid);
      
    const transferCustomers = Object.values(customerGroups)
      .filter(c => c.payMethod === 'transfer')
      .sort((a, b) => b.totalUnpaid - a.totalUnpaid);

    // Get order details for cash orders too
    const cashOrdersWithDetails = await Promise.all(
      filteredCashOrders.map(async (order) => {
        const orderDetails = await OrderDetail.find({ order_id: order._id })
          .populate('vegetable_id');
        
        const orderObj = order.toObject();
        orderObj.details = orderDetails.map(detail => detail.toObject());
        return orderObj;
      })
    );

    // Group cash orders by customer (similar to credit/transfer)
    const cashGroups = {};
    cashOrdersWithDetails.forEach(order => {
      const customerId = order.customer_id?._id?.toString();
      if (!customerId) return;

      if (!cashGroups[customerId]) {
        cashGroups[customerId] = {
          customer: order.customer_id,
          payMethod: 'cash',
          orders: [],
          totalCash: 0
        };
      }

      cashGroups[customerId].orders.push(order);
      cashGroups[customerId].totalCash += order.total || 0;
    });

    const cashCustomers = Object.values(cashGroups)
      .sort((a, b) => b.totalCash - a.totalCash);

    return NextResponse.json({ 
      credit: creditCustomers,
      transfer: transferCustomers,
      cash: cashCustomers
    });
  } catch (error) {
    console.error('Error fetching unpaid orders:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการชำระเงินได้' },
      { status: 500 }
    );
  }
}

// PUT - Update payment status for orders
export async function PUT(request) {
  try {
    await connectDB();
    
    const { orderIds, customerId } = await request.json();

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json(
        { error: 'กรุณาระบุรายการคำสั่งซื้อที่ต้องการอัปเดต' },
        { status: 400 }
      );
    }

    // Update payment status
    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        $set: { 
          paid_status: true,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.modifiedCount,
      message: `อัปเดตสถานะการชำระเงินสำเร็จ ${result.modifiedCount} รายการ`
    });
    
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตสถานะการชำระเงินได้' },
      { status: 500 }
    );
  }
}