import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Notification from '../../../../../models/Notification.js';

// Get user notifications
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const filter = {
      userId: user._id,
    };

    if (isRead !== null && isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    const notifications = await Notification.find(filter)
      .populate('chatId', 'participants')
      .populate('groupId', 'name')
      .populate('messageId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      isRead: false,
    });

    return NextResponse.json({
      notifications,
      page,
      limit,
      total,
      unreadCount,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds, markAllRead } = await request.json();

    if (markAllRead) {
      await Notification.updateMany(
        { userId: user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          userId: user._id,
        },
        { isRead: true, readAt: new Date() }
      );
    } else {
      return NextResponse.json(
        { error: 'Notification IDs or markAllRead flag is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

// Delete notifications
export async function DELETE(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationIds = searchParams.get('ids')?.split(',');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      await Notification.deleteMany({ userId: user._id });
    } else if (notificationIds && notificationIds.length > 0) {
      await Notification.deleteMany({
        _id: { $in: notificationIds },
        userId: user._id,
      });
    } else {
      return NextResponse.json(
        { error: 'Notification IDs or deleteAll flag is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Notifications deleted successfully',
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}

