import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UserOrderHistory from '@/models/UserOrderHistory';

export async function GET() {
  try {
    await dbConnect();

    const users = await UserOrderHistory.find({})
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      users: users || []
    });

  } catch (error) {
    console.error('GET all user order history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}