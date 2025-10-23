import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CompanySettings from '@/models/CompanySettings';

// GET - Get company settings
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';

    const settings = await CompanySettings.getSettings(userId);

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    );
  }
}

// PUT - Update company settings
export async function PUT(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId = 'default', ...updateData } = body;

    let settings = await CompanySettings.findOne({ userId });

    if (!settings) {
      // Create new settings if none exist
      settings = await CompanySettings.create({ userId, ...updateData });
    } else {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key])) {
          // Handle nested objects (like address, documentSettings, etc.)
          settings[key] = { ...settings[key], ...updateData[key] };
        } else {
          settings[key] = updateData[key];
        }
      });

      await settings.save();
    }

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    );
  }
}

// POST - Create default company settings
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId = 'default', ...settingsData } = body;

    // Check if settings already exist
    const existingSettings = await CompanySettings.findOne({ userId });
    if (existingSettings) {
      return NextResponse.json(
        { error: 'Company settings already exist for this user' },
        { status: 400 }
      );
    }

    const settings = await CompanySettings.create({ userId, ...settingsData });

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error creating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to create company settings' },
      { status: 500 }
    );
  }
}