import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';

// POST - Migrate existing customers to add active field
export async function POST(request) {
  try {
    await connectDB();

    // Update all customers without active field to active: true
    const result = await Customer.updateMany(
      { active: { $exists: false } },
      { $set: { active: true } }
    );

    // Get count of customers with active field
    const totalCustomers = await Customer.countDocuments({});
    const activeCustomers = await Customer.countDocuments({ active: true });
    const inactiveCustomers = await Customer.countDocuments({ active: false });

    return NextResponse.json({
      success: true,
      message: 'Customer migration completed successfully',
      updated: result.modifiedCount,
      summary: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers
      }
    });

  } catch (error) {
    console.error('Customer migration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET - Check migration status
export async function GET(request) {
  try {
    await connectDB();

    const totalCustomers = await Customer.countDocuments({});
    const customersWithActive = await Customer.countDocuments({ active: { $exists: true } });
    const customersWithoutActive = await Customer.countDocuments({ active: { $exists: false } });
    const activeCustomers = await Customer.countDocuments({ active: true });
    const inactiveCustomers = await Customer.countDocuments({ active: false });

    return NextResponse.json({
      total: totalCustomers,
      withActiveField: customersWithActive,
      withoutActiveField: customersWithoutActive,
      active: activeCustomers,
      inactive: inactiveCustomers,
      migrationNeeded: customersWithoutActive > 0
    });

  } catch (error) {
    console.error('Migration status check error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}