import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import ChatLock from '../../../../../models/ChatLock.js';
import Chat from '../../../../../models/Chat.js';
import Group from '../../../../../models/Group.js';
import { hashPassword, verifyPassword } from '../../../../../lib/utils.js';
import { encryptAES, decryptAES, generateKey } from '../../../../../lib/encryption.js';

// Lock a chat
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, groupId, lockType, lockValue, lockTimeout } = await request.json();

    if (!chatId && !groupId) {
      return NextResponse.json(
        { error: 'Chat ID or Group ID is required' },
        { status: 400 }
      );
    }

    if (!lockType || !lockValue) {
      return NextResponse.json(
        { error: 'Lock type and value are required' },
        { status: 400 }
      );
    }

    // Verify user has access to chat/group
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

    // Hash the lock value (PIN/password)
    const lockHash = await hashPassword(lockValue);

    // Generate encryption key for chat data
    const dataKey = generateKey();
    const encryptedDataKey = encryptAES(dataKey.toString('base64'), Buffer.from(lockValue.padEnd(32, '0').slice(0, 32)));

    // Create or update lock
    const lock = await ChatLock.findOneAndUpdate(
      { $or: [{ chatId }, { groupId }] },
      {
        chatId: chatId || null,
        groupId: groupId || null,
        userId: user._id,
        lockType,
        lockHash,
        encryptedDataKey: encryptedDataKey.encrypted,
        isLocked: true,
        lockTimeout: lockTimeout || 300,
        lastUnlockedAt: null,
        failedAttempts: 0,
        lockedUntil: null,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Chat locked successfully',
      lockId: lock._id,
    });
  } catch (error) {
    console.error('Lock chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to lock chat' },
      { status: 500 }
    );
  }
}

// Unlock a chat
export async function PUT(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, groupId, lockValue } = await request.json();

    if (!chatId && !groupId) {
      return NextResponse.json(
        { error: 'Chat ID or Group ID is required' },
        { status: 400 }
      );
    }

    if (!lockValue) {
      return NextResponse.json(
        { error: 'Lock value is required' },
        { status: 400 }
      );
    }

    const lock = await ChatLock.findOne({
      $or: [{ chatId }, { groupId }],
      userId: user._id,
    }).select('+lockHash');

    if (!lock) {
      return NextResponse.json({ error: 'Chat is not locked' }, { status: 404 });
    }

    // Check if locked due to failed attempts
    if (lock.lockedUntil && lock.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((lock.lockedUntil - new Date()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    // Verify lock value
    const isValid = await verifyPassword(lockValue, lock.lockHash);

    if (!isValid) {
      lock.failedAttempts += 1;
      if (lock.failedAttempts >= 5) {
        lock.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      await lock.save();

      return NextResponse.json(
        { error: 'Invalid lock value', attemptsLeft: 5 - lock.failedAttempts },
        { status: 401 }
      );
    }

    // Unlock chat
    lock.isLocked = false;
    lock.lastUnlockedAt = new Date();
    lock.failedAttempts = 0;
    lock.lockedUntil = null;
    await lock.save();

    // Decrypt data key
    const dataKey = decryptAES(lock.encryptedDataKey, Buffer.from(lockValue.padEnd(32, '0').slice(0, 32)));

    return NextResponse.json({
      message: 'Chat unlocked successfully',
      dataKey,
    });
  } catch (error) {
    console.error('Unlock chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unlock chat' },
      { status: 500 }
    );
  }
}

// Get lock status
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

    const lock = await ChatLock.findOne({
      $or: [{ chatId }, { groupId }],
      userId: user._id,
    });

    if (!lock) {
      return NextResponse.json({
        isLocked: false,
      });
    }

    // Check if lock has timed out
    if (lock.lastUnlockedAt) {
      const timeoutMs = lock.lockTimeout * 1000;
      const timeSinceUnlock = Date.now() - lock.lastUnlockedAt.getTime();
      if (timeSinceUnlock > timeoutMs) {
        lock.isLocked = true;
        await lock.save();
      }
    }

    return NextResponse.json({
      isLocked: lock.isLocked,
      lockType: lock.lockType,
      lockedUntil: lock.lockedUntil,
    });
  } catch (error) {
    console.error('Get lock status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get lock status' },
      { status: 500 }
    );
  }
}

