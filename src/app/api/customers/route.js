import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    await dbConnect();
    
    // Drop line_id index if it exists to prevent duplicate key errors
    try {
      await Customer.collection.dropIndex('line_id_1');
      console.log('Dropped line_id index successfully');
    } catch (dropError) {
      console.log('line_id index drop failed (expected if index does not exist):', dropError.message);
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { company_name: { $regex: search, $options: 'i' } },
            { telephone: { $regex: search, $options: 'i' } }
          ]
        }
      : {};
    
    const customers = await Customer.find(query).sort({ name: 1 }).lean();

    // Get latest order dates for all customers in one query
    const orderDates = await Order.aggregate([
      {
        $group: {
          _id: '$customer_id',
          latest_order_date: { $max: '$delivery_date' }
        }
      }
    ]);

    // Map order dates to customers
    const customersWithDates = customers.map(customer => ({
      ...customer,
      latest_order_date: orderDates.find(od => od._id?.toString() === customer._id.toString())?.latest_order_date || null
    }));
    
    return NextResponse.json(customersWithDates);
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
    
    const customer = await Customer.create(body);
    
    return NextResponse.json(customer, { status: 201 });
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
    
    const customer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(customer);
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
    
    const customer = await Customer.findByIdAndDelete(id);
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}