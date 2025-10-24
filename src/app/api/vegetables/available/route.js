import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vegetable from '@/models/Vegetable';

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

    // Get only vegetables with status = 'available'
    const vegetables = await Vegetable.find({ status: 'available' }).sort({ name_th: 1 });

    // Transform data for HTML template compatibility
    const transformedVegetables = vegetables.map(veg => ({
      _id: veg._id,
      nameTh: veg.name_th,
      nameEng: veg.name_eng || '',
      price: veg.price,
      image: veg.photo || '/images/default-vegetable.png',
      status: veg.status
    }));

    return NextResponse.json(transformedVegetables, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}