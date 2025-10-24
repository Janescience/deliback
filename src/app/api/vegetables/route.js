import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Vegetable from '@/models/Vegetable';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const query = search
      ? {
          $or: [
            { name_th: { $regex: search, $options: 'i' } },
            { name_eng: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const vegetables = await Vegetable.find(query).sort({ name_th: 1 });

    return NextResponse.json(vegetables);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    const vegetable = await Vegetable.create(body);
    
    return NextResponse.json(vegetable, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, ...updateData } = body;
    
    const vegetable = await Vegetable.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!vegetable) {
      return NextResponse.json(
        { error: 'Vegetable not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(vegetable);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    const vegetable = await Vegetable.findByIdAndDelete(id);
    
    if (!vegetable) {
      return NextResponse.json(
        { error: 'Vegetable not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Vegetable deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}