import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vegetable from '@/models/Vegetable';

export async function GET(request) {
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

    return NextResponse.json(transformedVegetables);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}