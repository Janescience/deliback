import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOrderHistory from '@/models/UserOrderHistory';

// Add new user/shop entry
export async function POST(request) {
  try {
    await dbConnect();
    const { userId, userName, shopName, payMethod } = await request.json();

    if (!userId || !userName || !shopName || !payMethod) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    let userHistory = await UserOrderHistory.findOne({ userId });

    if (!userHistory) {
      // Create new user
      userHistory = await UserOrderHistory.create({
        userId,
        shops: [{
          shopName,
          payMethod,
          userName
        }]
      });
    } else {
      // Check if shop already exists
      const existingShopIndex = userHistory.shops.findIndex(shop =>
        shop.shopName === shopName
      );

      if (existingShopIndex >= 0) {
        return NextResponse.json(
          { error: 'ร้านนี้มีอยู่แล้วสำหรับผู้ใช้นี้' },
          { status: 400 }
        );
      }

      // Add new shop
      userHistory.shops.push({
        shopName,
        payMethod,
        userName
      });
      await userHistory.save();
    }

    return NextResponse.json({
      success: true,
      message: 'เพิ่มข้อมูลสำเร็จ'
    });

  } catch (error) {
    console.error('POST user order history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Update existing shop entry
export async function PUT(request) {
  try {
    await dbConnect();
    const { userId, userName, shopName, payMethod } = await request.json();

    if (!userId || !userName || !shopName || !payMethod) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const userHistory = await UserOrderHistory.findOne({ userId });

    if (!userHistory) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    const shopIndex = userHistory.shops.findIndex(shop =>
      shop.shopName === shopName
    );

    if (shopIndex === -1) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลร้าน' },
        { status: 404 }
      );
    }

    // Update shop data
    userHistory.shops[shopIndex].userName = userName;
    userHistory.shops[shopIndex].payMethod = payMethod;
    await userHistory.save();

    return NextResponse.json({
      success: true,
      message: 'อัพเดทข้อมูลสำเร็จ'
    });

  } catch (error) {
    console.error('PUT user order history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Delete shop entry
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shopName = searchParams.get('shopName');

    if (!userId || !shopName) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const userHistory = await UserOrderHistory.findOne({ userId });

    if (!userHistory) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 404 }
      );
    }

    // Remove shop from array
    userHistory.shops = userHistory.shops.filter(shop =>
      shop.shopName !== shopName
    );

    if (userHistory.shops.length === 0) {
      // Delete entire user record if no shops left
      await UserOrderHistory.findByIdAndDelete(userHistory._id);
    } else {
      await userHistory.save();
    }

    return NextResponse.json({
      success: true,
      message: 'ลบข้อมูลสำเร็จ'
    });

  } catch (error) {
    console.error('DELETE user order history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}