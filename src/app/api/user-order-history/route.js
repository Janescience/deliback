import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOrderHistory from '@/models/UserOrderHistory';

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

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find user order history
    const userHistory = await UserOrderHistory.findOne({ userId }).lean();

    if (!userHistory) {
      return NextResponse.json({
        customer: []
      }, { headers: corsHeaders });
    }

    // Transform data to required format
    const customer = userHistory.shops.map(shop => ({
      id: userHistory.userId,
      name: shop.userName,
      shop: shop.shopName,
      method: shop.payMethod
    }));

    return NextResponse.json({
      customer
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('GET user order history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}