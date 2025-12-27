import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import Chat from '../../../../../models/Chat.js';
import Message from '../../../../../models/Message.js';
import { getIO } from '../../../../../lib/socket.js';
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const chatId = formData.get('chatId');
    const type = formData.get('type') || 'file';
    const content = formData.get('content') || '';
    const replyTo = formData.get('replyTo');
    const quotedMessage = formData.get('quotedMessage');
    const metadataStr = formData.get('metadata');
    console.log("file", file);
    console.log("chatId", chatId);
    if (!file || !chatId) {
      return NextResponse.json(
        { error: 'File and chat ID are required' },
        { status: 400 }
      );
    }

    // Verify user is participant in chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: user._id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Parse metadata if provided
    let metadata = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }

    // File size limits (in bytes)
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB for videos
    const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB for images
    const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB for audio

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 500MB' },
        { status: 400 }
      );
    }

    // Determine file type and check specific limits
    let messageType = type;
    if (!messageType || messageType === 'file') {
      if (file.type.startsWith('image/')) {
        messageType = 'image';
        if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: 'Image size exceeds maximum limit of 50MB' },
            { status: 400 }
          );
        }
      } else if (file.type.startsWith('video/')) {
        messageType = 'video';
        if (file.size > MAX_VIDEO_SIZE) {
          return NextResponse.json(
            { error: 'Video size exceeds maximum limit of 200MB. Please compress your video or use a smaller file.' },
            { status: 400 }
          );
        }
      } else if (file.type.startsWith('audio/')) {
        messageType = 'audio';
        if (file.size > MAX_AUDIO_SIZE) {
          return NextResponse.json(
            { error: 'Audio size exceeds maximum limit of 100MB' },
            { status: 400 }
          );
        }
      } else {
        messageType = 'file';
      }
    }

    // Save file to public/uploads directory using streaming
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, fileName);

    // Use streaming instead of loading entire file into memory
    try {
      const fileStream = file.stream();
      const nodeReadable = Readable.fromWeb(fileStream);
      const writeStream = createWriteStream(filePath);
      await pipeline(nodeReadable, writeStream);
    } catch (streamError) {
      console.error('Error streaming file:', streamError);
      return NextResponse.json(
        { error: 'Error uploading file. Please try again.' },
        { status: 500 }
      );
    }

    // Create file URL
    const fileUrl = `/uploads/${fileName}`;

    // Create message
    const message = await Message.create({
      chatId,
      senderId: user._id,
      content: content || file.name,
      type: messageType,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      replyTo: replyTo || null,
      quotedMessage: quotedMessage || null,
      metadata,
      deliveredAt: new Date(),
    });

    // Update chat
    chat.messages.push(message._id);
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();

    // Increment unread count for other participants
    chat.participants.forEach((participantId) => {
      if (participantId.toString() !== user._id.toString()) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    // Populate message with sender info
    await message.populate('senderId', 'name email profilePhoto');
    if (message.replyTo) {
      await message.populate('replyTo');
    }
    if (message.quotedMessage) {
      await message.populate({
        path: 'quotedMessage',
        populate: {
          path: 'senderId',
          select: 'name email profilePhoto'
        }
      });
    }

    // Emit socket event
    try {
      const io = getIO();
      if (io) {
        const messageObj = message.toObject();
        if (messageObj.senderId && typeof messageObj.senderId === 'object') {
          messageObj.senderId = {
            _id: messageObj.senderId._id,
            name: messageObj.senderId.name,
            email: messageObj.senderId.email,
            profilePhoto: messageObj.senderId.profilePhoto,
          };
        }
        // Ensure quotedMessage senderId is properly formatted
        if (messageObj.quotedMessage && typeof messageObj.quotedMessage === 'object') {
          if (messageObj.quotedMessage.senderId && typeof messageObj.quotedMessage.senderId === 'object') {
            messageObj.quotedMessage.senderId = {
              _id: messageObj.quotedMessage.senderId._id,
              name: messageObj.quotedMessage.senderId.name,
              email: messageObj.quotedMessage.senderId.email,
              profilePhoto: messageObj.quotedMessage.senderId.profilePhoto,
            };
          }
        }
        io.to(`chat:${chatId}`).emit('receiveMessage', {
          message: messageObj,
          chatId: chatId.toString(),
        });
        io.to(`chat:${chatId}`).emit('message:mediaUploaded', {
          message: messageObj,
          chatId: chatId.toString(),
        });
      }
    } catch (socketError) {
      console.error('Socket error:', socketError);
    }

    return NextResponse.json({
      success: true,
      message: message.toObject(),
    });
  } catch (error) {
    console.error('Upload message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Configure route for large file uploads
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file uploads
