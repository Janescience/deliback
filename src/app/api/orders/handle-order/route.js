import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import OrderDetail from '@/models/OrderDetail';
import Customer from '@/models/Customer';
import Vegetable from '@/models/Vegetable';
import UserOrderHistory from '@/models/UserOrderHistory';
import { broadcastOrderUpdate } from '../stream/route';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    

    // Validate required fields
    if (!data.deliveryDate) {
      return NextResponse.json({ error: 'deliveryDate is required' }, { status: 400 });
    }

  
    if (!data.payMethod) {
      return NextResponse.json({ error: 'payMethod is required' }, { status: 400 });
    }
    
    if (!data.order || !Array.isArray(data.order) || data.order.length === 0) {
      return NextResponse.json({ error: 'order items are required' }, { status: 400 });
    }

    const orderDate = new Date();
    const deliveryDate = new Date(data.deliveryDate);
    const user = data.user || "ไม่ทราบชื่อ";
    const userId = data.userId || "ADMIN";
    const payMethod = mapPaymentMethod(data.payMethod);
    const orderItems = data.order;


    let customerId;
    const isPrintDoc = payMethod === 'credit';

    // --- Customer Management Section ---
    if(userId === 'ADMIN'){
      let customer = await Customer.findOne({ name : user.trim() });

      if (!customer) {
        const newCustomer = await Customer.create({
          line_id: userId,
          line_name: data.userLine,
          name: user.trim(),
          pay_method: payMethod,
          is_print: isPrintDoc
        });
        customerId = newCustomer._id;
      }else{
        customerId = customer._id;
      }
    }else{
      let customer = await Customer.findOne({ name : user.trim(), line_id: userId });
      if (!customer) {
        const newCustomer = await Customer.create({
          line_id: userId,
          line_name: data.userLine,
          name: user.trim(),
          pay_method: payMethod,
          is_print: isPrintDoc
        });
        customerId = newCustomer._id;
      }else{
        customerId = customer._id;
      }
    }
    

    // --- Order Management Section (Simple Logic) ---
    // Find existing order for same customer and delivery date
    let existingOrder = await Order.findOne({
      customer_id: customerId,
      delivery_date: {
        $gte: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate()),
        $lt: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate() + 1)
      }
    });

    let order;
    let isReplacement = false;
    
    if (existingOrder) {
      isReplacement = true;
      
      // Delete existing order details
      await OrderDetail.deleteMany({ order_id: existingOrder._id });
      
      // Update existing order
      existingOrder.user = user;
      existingOrder.created_date = orderDate;
      existingOrder.total = 0; // Will be updated below
      order = existingOrder;
    } else {
      // Create new order
      order = await Order.create({
        delivery_date: deliveryDate,
        customer_id: customerId,
        user: user,
        created_date: orderDate,
        total: 0
      });
    }

    // Prepare new order items
    const newOrderDetails = [];
    let totalAmount = 0;

    for (const item of orderItems) {
      // Find vegetable by name (try both name_th and name_eng)
      let vegetable = await Vegetable.findOne({ name_th: item.name });
      if (!vegetable) {
        vegetable = await Vegetable.findOne({ name_eng: item.name });
      }
      
      if (!vegetable) {
        console.warn(`Vegetable not found: ${item.name}`);
        continue;
      }

      const quantity = parseFloat(item.amount);
      const pricePerUnit = parseFloat(item.price);
      const subtotal = pricePerUnit * quantity;
      totalAmount += subtotal;

      newOrderDetails.push({
        order_id: order._id,
        vegetable_id: vegetable._id,
        vegetable_name: vegetable.name_th, // Add vegetable name for broadcast
        quantity: quantity,
        price: pricePerUnit,
        subtotal: subtotal
      });
    }

    // Create new order details
    if (newOrderDetails.length > 0) {
      await OrderDetail.insertMany(newOrderDetails);
    }

    // Update order total and save
    order.total = totalAmount;
    await order.save(); // This will trigger pre('save') hook

    // Update user order history (shop names)
    await updateUserOrderHistory(userId, user.trim(), payMethod);

    // Get customer info for broadcast
    const customerInfo = await Customer.findById(customerId);
    
    // Broadcast real-time update - format to match frontend expectations
    const orderUpdateData = {
      _id: order._id,
      delivery_date: deliveryDate,
      customer_id: {
        _id: customerId,
        name: user,
        company_name: customerInfo?.company_name || null,
        telephone: customerInfo?.telephone || '',
        pay_method: payMethod
      },
      user: user,
      total: totalAmount,
      paid_status: payMethod === 'cash',
      created_date: new Date(),
      details: newOrderDetails.map(item => ({
        _id: `temp_${Date.now()}_${Math.random()}`, // Temporary ID for new details
        vegetable_id: {
          _id: item.vegetable_id,
          name_th: item.vegetable_name,
          name_eng: null,
          price: item.price,
          status: 'available'
        },
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      timestamp: new Date(),
      isReplacement: isReplacement // Add flag to indicate if this is a replacement
    };

    try {
      broadcastOrderUpdate(orderUpdateData);
    } catch (broadcastError) {
      console.error('Failed to broadcast update:', broadcastError);
    }

    // Send LINE notification
    try {
      await sendOrderMessageToLineUser({
        order: orderItems,
        user: user,
        payMethod: reverseMapPaymentMethod(payMethod),
        deliveryDate: deliveryDate,
        userId: userId
      });
    } catch (lineError) {
      console.error('Failed to send LINE notification:', lineError);
    }

    return NextResponse.json({
      status: 'success',
      orderId: order._id,
      message: 'Order processed successfully',
      totalItems: newOrderDetails.length,
      totalAmount: totalAmount,
      isReplacement: isReplacement
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error in handleOrderPost:', error);
    console.error('Stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
        status: 'error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

function mapPaymentMethod(thaiMethod) {
  const mapping = {
    'เงินสด': 'cash',
    'โอนเงิน': 'transfer',
    'เครดิต': 'credit'
  };
  return mapping[thaiMethod] || 'cash';
}

async function updateUserOrderHistory(userId, shopName, payMethod) {
  try {
    // Convert payMethod back to Thai
    const thaiPayMethod = reverseMapPaymentMethod(payMethod);

    // Find existing history for this user
    let userHistory = await UserOrderHistory.findOne({ userId });

    if (!userHistory) {
      // Create new history record
      userHistory = await UserOrderHistory.create({
        userId,
        shops: [{
          shopName,
          payMethod: thaiPayMethod,
          userName: shopName // Using shopName as userName for now
        }]
      });
    } else {
      // Check if this shop already exists (regardless of payMethod)
      const existingShopIndex = userHistory.shops.findIndex(shop =>
        shop.shopName === shopName
      );

      if (existingShopIndex >= 0) {
        // Update existing shop's payment method
        userHistory.shops[existingShopIndex].payMethod = thaiPayMethod;
        await userHistory.save();
      } else {
        // Add new shop
        userHistory.shops.push({
          shopName,
          payMethod: thaiPayMethod,
          userName: shopName // Using shopName as userName for now
        });
        await userHistory.save();
      }
    }
  } catch (error) {
    console.error('Error updating user order history:', error);
    // Don't throw error to prevent breaking the main order flow
  }
}

function reverseMapPaymentMethod(englishMethod) {
  const mapping = {
    'cash': 'เงินสด',
    'transfer': 'โอนเงิน',
    'credit': 'เครดิต'
  };
  return mapping[englishMethod] || 'เงินสด';
}

// LINE Bot Functions
async function sendOrderMessageToLineUser(data) {
  try {
    const newOrders = data.order;
    const user = data.user;
    const shop = resolveShopName(user);
    const payMethod = data.payMethod;
    const deliveryDate = data.deliveryDate;
    const userId = data.userId;

    // Skip LINE notification for ADMIN orders
    if (userId === 'ADMIN') {
      console.log('Skipping LINE notification for ADMIN order');
      return;
    }

    // รวมยอด
    let totalAmount = 0;
    let totalPrice = 0;
    const summaryList = [];

    for (const item of newOrders) {
      const name = item.name;
      const amount = parseFloat(item.amount);
      const subtotal = parseFloat(item.subtotal);

      totalAmount += amount;
      totalPrice += subtotal;

      summaryList.push({
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: name,
            size: "sm",
            color: "#000000",
            flex: 4
          },
          {
            type: "text",
            text: `${amount.toFixed(2)} กก.`,
            size: "sm",
            color: "#555555",
            align: "end",
            flex: 3
          },
          {
            type: "text",
            text: `${subtotal.toLocaleString("th-TH", { minimumFractionDigits: 0 })} บ.`,
            size: "sm",
            color: "#000000",
            align: "end",
            flex: 3
          }
        ]
      });
    }

    const flexMessage = {
      type: "flex",
      altText: `สั่งผักเรียบร้อยแล้ว`,
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "สั่งผักเรียบร้อยแล้ว",
              weight: "bold",
              size: "lg",
              color: "#1DB446",
              wrap: true
            },
            {
              type: "text",
              text: `ร้าน: ${shop}`,
              size: "sm",
              color: "#555555",
              wrap: true
            },
            {
              type: "text",
              text: `การชำระเงิน: ${payMethod}`,
              size: "sm",
              color: "#555555",
              wrap: true
            },
            {
              type: "text",
              text: `วันที่จัดส่ง: ${formatDateThai(deliveryDate)}`,
              size: "sm",
              color: "#555555",
              wrap: true
            },
            {
              "type": "separator",
              "margin": "md"
            },
            {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              margin: "md",
              contents: summaryList
            },
            {
              "type": "separator",
              "margin": "md"
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `รวม`,
                  weight: "bold",
                  size: "sm",
                  flex: 4
                },
                {
                  type: "text",
                  text: `${totalAmount.toFixed(2)} กก.`,
                  weight: "bold",
                  align: "end",
                  size: "sm",
                  flex: 3
                },
                {
                  type: "text",
                  text: `${totalPrice.toLocaleString("th-TH", { minimumFractionDigits: 0 })} บ.`,
                  weight: "bold",
                  align: "end",
                  size: "sm",
                  flex: 3
                }
              ]
            }
          ]
        }
      }
    };

    // ส่งกลับหา User
    await pushFlexMessage(userId, flexMessage);
  } catch (err) {
    console.error("❌ Error in sendOrderMessageToLineUser:", err);
  }
}

async function pushFlexMessage(id, message) {
  try {
    const url = "https://api.line.me/v2/bot/message/push";
    console.log("📬 pushFlexMessage id:", id);

    const payload = {
      to: id,
      messages: [message]
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.LINE_CHANNEL_ACCESS_TOKEN
      },
      body: JSON.stringify(payload)
    };

    const response = await fetch(url, options);
    const result = await response.text();
    console.log("📬 pushFlexMessage response:", result);

    if (!response.ok) {
      console.error("LINE API Error:", response.status, result);
    }
  } catch (error) {
    console.error("❌ Error in pushFlexMessage:", error);
  }
}

function resolveShopName(user) {
  // Add your shop name resolution logic here
  // This could be based on user name or some mapping
  return user || "ไม่ระบุร้าน";
}

function formatDateThai(dateString) {
  try {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    return date.toLocaleDateString('th-TH', options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}