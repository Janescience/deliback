import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

// POST - Initialize weekly holidays with default 7 days
export async function POST(request) {
  try {
    await dbConnect();

    // Default 7-day holiday configuration
    const defaultHolidays = [
      { day_of_week: 0, day_name: 'อาทิตย์', is_holiday: true },  // Sunday - default holiday
      { day_of_week: 1, day_name: 'จันทร์', is_holiday: false },   // Monday - working day
      { day_of_week: 2, day_name: 'อังคาร', is_holiday: false },  // Tuesday - working day
      { day_of_week: 3, day_name: 'พุธ', is_holiday: false },     // Wednesday - working day
      { day_of_week: 4, day_name: 'พฤหัสบดี', is_holiday: false }, // Thursday - working day
      { day_of_week: 5, day_name: 'ศุกร์', is_holiday: false },   // Friday - working day
      { day_of_week: 6, day_name: 'เสาร์', is_holiday: true }     // Saturday - default holiday
    ];

    // Check if holidays already exist
    const existingHolidays = await Holiday.find({});

    if (existingHolidays.length > 0) {
      return NextResponse.json({
        message: 'Holiday data already exists',
        existing: existingHolidays.length,
        holidays: existingHolidays.sort((a, b) => a.day_of_week - b.day_of_week)
      });
    }

    // Insert default holidays
    const createdHolidays = await Holiday.insertMany(defaultHolidays);

    return NextResponse.json({
      message: 'Holiday data initialized successfully',
      created: createdHolidays.length,
      holidays: createdHolidays.sort((a, b) => a.day_of_week - b.day_of_week)
    });

  } catch (error) {
    console.error('Holiday initialization error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({
        message: 'Some holiday data already exists',
        error: 'Duplicate key error - holidays may already be initialized'
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET - Check initialization status
export async function GET(request) {
  try {
    await dbConnect();

    const holidays = await Holiday.find({}).sort({ day_of_week: 1 });

    return NextResponse.json({
      initialized: holidays.length === 7,
      count: holidays.length,
      holidays: holidays
    });

  } catch (error) {
    console.error('Holiday check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}