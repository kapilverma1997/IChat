import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Message from '../../../../../models/Message.js';
import GroupMessage from '../../../../../models/GroupMessage.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';

// Search messages
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const chatId = searchParams.get('chatId');
    const groupId = searchParams.get('groupId');
    const senderId = searchParams.get('senderId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const fileType = searchParams.get('fileType');
    const onlyStarred = searchParams.get('onlyStarred') === 'true';
    const onlyImages = searchParams.get('onlyImages') === 'true';
    const onlyDocuments = searchParams.get('onlyDocuments') === 'true';
    const onlyVideos = searchParams.get('onlyVideos') === 'true';
    const onlyLinks = searchParams.get('onlyLinks') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build search filter
    const filter = {
      isDeleted: false,
    };

    // Chat or group filter
    if (chatId) {
      // Verify user has access
      const chat = await Chat.findOne({
        _id: chatId,
        participants: user._id,
      });
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      filter.chatId = chatId;
    } else if (groupId) {
      // Verify user has access
      const group = await Group.findOne({
        _id: groupId,
        'members.userId': user._id,
      });
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      filter.groupId = groupId;
    } else {
      // Global search - get all chats/groups user has access to
      const userChats = await Chat.find({
        participants: user._id,
      }).select('_id');
      const userGroups = await Group.find({
        'members.userId': user._id,
      }).select('_id');

      filter.$or = [
        { chatId: { $in: userChats.map((c) => c._id) } },
        { groupId: { $in: userGroups.map((g) => g._id) } },
      ];
    }

    // Sender filter
    if (senderId) {
      filter.senderId = senderId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // File type filter
    if (fileType) {
      filter.type = fileType;
    } else {
      if (onlyImages) {
        filter.type = 'image';
      } else if (onlyDocuments) {
        filter.type = 'file';
      } else if (onlyVideos) {
        filter.type = 'video';
      } else if (onlyLinks) {
        filter.metadata = { $exists: true };
        filter['metadata.url'] = { $exists: true };
      }
    }

    // Starred filter
    if (onlyStarred) {
      filter.isStarred = true;
    }

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Search in 1:1 messages
    const messages = await Message.find(filter)
      .populate('senderId', 'name email profilePhoto')
      .populate('chatId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Search in group messages
    const groupMessages = await GroupMessage.find(filter)
      .populate('senderId', 'name email profilePhoto')
      .populate('groupId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Combine results
    const allMessages = [...messages, ...groupMessages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Get total count
    const messageCount = await Message.countDocuments(filter);
    const groupMessageCount = await GroupMessage.countDocuments(filter);
    const total = messageCount + groupMessageCount;

    return NextResponse.json({
      messages: allMessages.slice(0, limit),
      page,
      limit,
      total,
      hasMore: total > page * limit,
    });
  } catch (error) {
    console.error('Search messages error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search messages' },
      { status: 500 }
    );
  }
}

