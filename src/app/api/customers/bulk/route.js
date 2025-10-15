import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

// DELETE - Bulk delete customers
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'กรุณาระบุรายการลูกค้าที่ต้องการลบ' },
        { status: 400 }
      );
    }

    const result = await Customer.deleteMany({
      _id: { $in: ids }
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `ลบลูกค้า ${result.deletedCount} รายการสำเร็จ`
    });
    
  } catch (error) {
    console.error('Error bulk deleting customers:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบลูกค้าได้' },
      { status: 500 }
    );
  }
}