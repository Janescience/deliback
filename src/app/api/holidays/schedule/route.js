import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Holiday from '@/models/Holiday';

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

export async function GET() {
  try {
    await dbConnect();

    // Get all 7 days of week
    let holidays = await Holiday.find({})
      .sort({ day_of_week: 1 })
      .lean();
      
    // Transform to schedule format
    const schedule = {};
    holidays.forEach(holiday => {
      // Use !is_holiday because the question asks for schedule (working days), not holidays
      // true = วันทำงาน (ไม่ใช่วันหยุด), false = วันหยุด
      schedule[holiday.day_name] = !holiday.is_holiday;
    });

    return NextResponse.json({ schedule }, { headers: corsHeaders });
  } catch (error) {
    console.error('GET holidays schedule error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}