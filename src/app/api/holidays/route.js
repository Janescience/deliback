import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

// GET all weekly holidays
export async function GET(request) {
  try {
    await dbConnect();

    // Get all 7 days of week
    let holidays = await Holiday.find({})
      .sort({ day_of_week: 1 })
      .lean();

    // Auto-initialize if no data exists
    if (holidays.length === 0) {
      const defaultHolidays = [
        { day_of_week: 0, day_name: 'อาทิตย์', is_holiday: true },
        { day_of_week: 1, day_name: 'จันทร์', is_holiday: false },
        { day_of_week: 2, day_name: 'อังคาร', is_holiday: false },
        { day_of_week: 3, day_name: 'พุธ', is_holiday: false },
        { day_of_week: 4, day_name: 'พฤหัสบดี', is_holiday: false },
        { day_of_week: 5, day_name: 'ศุกร์', is_holiday: false },
        { day_of_week: 6, day_name: 'เสาร์', is_holiday: true }
      ];

      await Holiday.insertMany(defaultHolidays);
      holidays = await Holiday.find({}).sort({ day_of_week: 1 }).lean();
    }

    return NextResponse.json({
      holidays,
      total: holidays.length
    });
  } catch (error) {
    console.error('GET holidays error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT update weekly holiday status
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { day_of_week, is_holiday } = body;
    
    
    if (day_of_week === undefined) {
      return NextResponse.json(
        { error: 'day_of_week is required' },
        { status: 400 }
      );
    }
    
    const holiday = await Holiday.findOneAndUpdate(
      { day_of_week },
      { is_holiday },
      { new: true, runValidators: true }
    );
    
    if (!holiday) {
      return NextResponse.json(
        { error: 'Holiday not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Holiday update error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}