import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

// DELETE - Delete all customers
export async function DELETE() {
  try {
    await connectDB();
    
    const result = await Customer.deleteMany({});

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `ลบลูกค้าทั้งหมด ${result.deletedCount} รายการสำเร็จ`
    });
    
  } catch (error) {
    console.error('Error deleting all customers:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบลูกค้าทั้งหมดได้' },
      { status: 500 }
    );
  }
}