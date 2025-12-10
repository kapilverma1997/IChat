import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import IPWhitelist from '../../../../../models/IPWhitelist.js';
import User from '../../../../../models/User.js';

// Check if user is admin (you should implement proper admin check)
async function isAdmin(userId) {
  const user = await User.findById(userId);
  // For now, check if user email contains 'admin' or you can add an isAdmin field
  return user?.email?.includes('admin') || false;
}

// Get client IP
function getClientIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// Add IP to whitelist
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isAdmin(user._id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { ipAddress, description, expiresAt } = await request.json();

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress) && ipAddress !== 'localhost') {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    const whitelist = await IPWhitelist.findOneAndUpdate(
      { ipAddress },
      {
        ipAddress,
        description,
        addedBy: user._id,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'IP address added to whitelist',
      whitelist,
    });
  } catch (error) {
    console.error('Add IP whitelist error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add IP to whitelist' },
      { status: 500 }
    );
  }
}

// Get all whitelisted IPs
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isAdmin(user._id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const whitelists = await IPWhitelist.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    })
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      whitelists,
    });
  } catch (error) {
    console.error('Get IP whitelist error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get whitelist' },
      { status: 500 }
    );
  }
}

// Remove IP from whitelist
export async function DELETE(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!(await isAdmin(user._id))) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ipAddress = searchParams.get('ipAddress');

    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    await IPWhitelist.findOneAndUpdate(
      { ipAddress },
      { isActive: false }
    );

    return NextResponse.json({
      message: 'IP address removed from whitelist',
    });
  } catch (error) {
    console.error('Remove IP whitelist error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove IP from whitelist' },
      { status: 500 }
    );
  }
}

// Check if current IP is whitelisted (middleware helper)
export async function checkIPWhitelist(request) {
  try {
    await connectDB();

    const clientIP = getClientIP(request);

    // Allow localhost in development
    if (process.env.NODE_ENV === 'development' && (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost')) {
      return true;
    }

    const whitelist = await IPWhitelist.findOne({
      ipAddress: clientIP,
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    return !!whitelist;
  } catch (error) {
    console.error('Check IP whitelist error:', error);
    return false;
  }
}

