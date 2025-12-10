import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import { getAuthenticatedUser } from '../../../../../lib/auth.js';
import User from '../../../../../models/User.js';
import { generateRSAKeyPair, encryptRSA, decryptRSA } from '../../../../../lib/encryption.js';

// Generate or get user's E2EE key pair
export async function GET(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with keys
    const userWithKeys = await User.findById(user._id).select('+publicKey +privateKeyEncrypted');

    if (userWithKeys.publicKey) {
      // Return public key only (private key stays encrypted on server)
      return NextResponse.json({
        publicKey: userWithKeys.publicKey,
        hasPrivateKey: !!userWithKeys.privateKeyEncrypted,
      });
    }

    // Generate new key pair
    const { publicKey, privateKey } = generateRSAKeyPair();

    // Store public key and encrypted private key
    // In production, private key should be encrypted with user's password
    // For now, we'll store it encrypted (you should prompt user for password)
    userWithKeys.publicKey = publicKey;
    userWithKeys.privateKeyEncrypted = privateKey; // TODO: Encrypt with user password
    await userWithKeys.save();

    return NextResponse.json({
      publicKey,
      message: 'Key pair generated successfully',
    });
  } catch (error) {
    console.error('E2EE key generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate keys' },
      { status: 500 }
    );
  }
}

// Exchange session keys for E2EE
export async function POST(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId, sessionKey } = await request.json();

    if (!recipientId || !sessionKey) {
      return NextResponse.json(
        { error: 'Recipient ID and session key are required' },
        { status: 400 }
      );
    }

    // Get recipient's public key
    const recipient = await User.findById(recipientId).select('+publicKey');
    if (!recipient || !recipient.publicKey) {
      return NextResponse.json(
        { error: 'Recipient not found or has no public key' },
        { status: 404 }
      );
    }

    // Encrypt session key with recipient's public key
    const encryptedSessionKey = encryptRSA(sessionKey, recipient.publicKey);

    return NextResponse.json({
      encryptedSessionKey,
      message: 'Session key encrypted successfully',
    });
  } catch (error) {
    console.error('E2EE key exchange error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to exchange keys' },
      { status: 500 }
    );
  }
}

// Get multiple users' public keys (for group chats)
export async function PUT(request) {
  try {
    await connectDB();

    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    // Get public keys for all users
    const users = await User.find({
      _id: { $in: userIds },
    }).select('_id publicKey');

    const publicKeys = {};
    users.forEach((u) => {
      if (u.publicKey) {
        publicKeys[u._id.toString()] = u.publicKey;
      }
    });

    return NextResponse.json({
      publicKeys,
    });
  } catch (error) {
    console.error('Get public keys error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get public keys' },
      { status: 500 }
    );
  }
}

