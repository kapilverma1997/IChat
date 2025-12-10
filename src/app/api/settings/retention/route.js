import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import MessageRetention from '../../../../../models/MessageRetention.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import Message from '../../../../../models/Message.js';
import GroupMessage from '../../../../../models/GroupMessage.js';

// Set retention policy for a chat/group
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, groupId, retentionPeriod } = await request.json();

    if (!chatId && !groupId) {
      return NextResponse.json(
        { error: 'Chat ID or Group ID is required' },
        { status: 400 }
      );
    }

    if (!retentionPeriod || !['24h', '7d', '30d', 'forever'].includes(retentionPeriod)) {
      return NextResponse.json(
        { error: 'Valid retention period is required' },
        { status: 400 }
      );
    }

    // Verify user has access
    if (chatId) {
      const chat = await Chat.findOne({
        _id: chatId,
        participants: user._id,
      });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
    } else {
      const group = await Group.findOne({
        _id: groupId,
        'members.userId': user._id,
      });
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
    }

    // Calculate retention days
    let retentionDays = null;
    if (retentionPeriod === '24h') {
      retentionDays = 1;
    } else if (retentionPeriod === '7d') {
      retentionDays = 7;
    } else if (retentionPeriod === '30d') {
      retentionDays = 30;
    }

    // Calculate next purge date
    let nextPurgeAt = null;
    if (retentionDays) {
      nextPurgeAt = new Date();
      nextPurgeAt.setDate(nextPurgeAt.getDate() + retentionDays);
    }

    const retention = await MessageRetention.findOneAndUpdate(
      { $or: [{ chatId }, { groupId }] },
      {
        chatId: chatId || null,
        groupId: groupId || null,
        retentionPeriod,
        retentionDays,
        setBy: user._id,
        nextPurgeAt,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Retention policy set successfully',
      retention,
    });
  } catch (error) {
    console.error('Set retention policy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set retention policy' },
      { status: 500 }
    );
  }
}

// Get retention policy
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    if (!chatId && !groupId) {
      return NextResponse.json(
        { error: 'Chat ID or Group ID is required' },
        { status: 400 }
      );
    }

    const retention = await MessageRetention.findOne({
      $or: [{ chatId }, { groupId }],
      isActive: true,
    });

    if (!retention) {
      return NextResponse.json({
        retentionPeriod: 'forever',
        retentionDays: null,
      });
    }

    return NextResponse.json({
      retentionPeriod: retention.retentionPeriod,
      retentionDays: retention.retentionDays,
      nextPurgeAt: retention.nextPurgeAt,
    });
  } catch (error) {
    console.error('Get retention policy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get retention policy' },
      { status: 500 }
    );
  }
}

// Delete retention policy (set to forever)
export async function DELETE(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');

    if (!chatId && !groupId) {
      return NextResponse.json(
        { error: 'Chat ID or Group ID is required' },
        { status: 400 }
      );
    }

    await MessageRetention.findOneAndUpdate(
      { $or: [{ chatId }, { groupId }] },
      { isActive: false }
    );

    return NextResponse.json({
      message: 'Retention policy removed',
    });
  } catch (error) {
    console.error('Delete retention policy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete retention policy' },
      { status: 500 }
    );
  }
}

