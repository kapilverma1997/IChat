import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { getIO } from './socket.js';
import webpush from 'web-push';
import { sendEmail } from './email.js';

// Configure web push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ichat.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Create and send notification
export async function createNotification({
  userId,
  type,
  category,
  title,
  body,
  data = {},
  chatId,
  groupId,
  messageId,
  priority = 'normal',
}) {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      type,
      category: category || getCategoryFromType(type),
      title,
      body,
      data,
      chatId,
      groupId,
      messageId,
      priority,
    });

    // Get user preferences
    const user = await User.findById(userId);
    if (!user) {
      return notification;
    }

    // Send in-app notification via Socket.io
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        notification: notification.toObject(),
      });
    }

    // Send push notification if enabled
    if (
      user.notificationPreferences?.pushEnabled &&
      user.pushSubscription
    ) {
      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          data: {
            ...data,
            notificationId: notification._id.toString(),
          },
        });

        await webpush.sendNotification(user.pushSubscription, payload);
        notification.isPushed = true;
        await notification.save();
      } catch (error) {
        console.error('Push notification error:', error);
        // Remove invalid subscription
        if (error.statusCode === 410 || error.statusCode === 404) {
          user.pushSubscription = undefined;
          await user.save();
        }
      }
    }

    // Send email notification if enabled and category is allowed
    if (
      user.notificationPreferences?.emailEnabled &&
      user.notificationPreferences?.categories?.[getCategoryFromType(type)]
    ) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          html: body,
          text: body.replace(/<[^>]*>/g, ''),
        });
        notification.isEmailed = true;
        await notification.save();
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
}

// Create notification for new message
export async function notifyNewMessage({
  userId,
  senderName,
  messageContent,
  chatId,
  groupId,
  messageId,
  isMention = false,
}) {
  const title = isMention
    ? `${senderName} mentioned you`
    : `New message from ${senderName}`;
  const body = messageContent.substring(0, 100);
  const type = isMention ? 'mention' : 'message';

  return createNotification({
    userId,
    type,
    title,
    body,
    data: {
      senderName,
      messageContent,
    },
    chatId,
    groupId,
    messageId,
  });
}

// Create notification for reply
export async function notifyReply({
  userId,
  senderName,
  messageContent,
  chatId,
  groupId,
  messageId,
}) {
  return createNotification({
    userId,
    type: 'reply',
    category: 'replies',
    title: `${senderName} replied to your message`,
    body: messageContent.substring(0, 100),
    data: {
      senderName,
      messageContent,
    },
    chatId,
    groupId,
    messageId,
  });
}

// Create notification for reaction
export async function notifyReaction({
  userId,
  senderName,
  emoji,
  chatId,
  groupId,
  messageId,
}) {
  return createNotification({
    userId,
    type: 'reaction',
    category: 'replies',
    title: `${senderName} reacted with ${emoji}`,
    body: '',
    data: {
      senderName,
      emoji,
    },
    chatId,
    groupId,
    messageId,
    priority: 'low',
  });
}

// Create notification for file upload
export async function notifyFileUpload({
  userId,
  senderName,
  fileName,
  chatId,
  groupId,
  messageId,
}) {
  return createNotification({
    userId,
    type: 'file_upload',
    category: 'fileUploads',
    title: `${senderName} shared a file`,
    body: fileName,
    data: {
      senderName,
      fileName,
    },
    chatId,
    groupId,
    messageId,
  });
}

// Create notification for group invite
export async function notifyGroupInvite({
  userId,
  groupName,
  inviterName,
  groupId,
}) {
  return createNotification({
    userId,
    type: 'group_invite',
    category: 'groupInvites',
    title: `${inviterName} invited you to ${groupName}`,
    body: `You've been invited to join ${groupName}`,
    data: {
      groupName,
      inviterName,
    },
    groupId,
  });
}

// Create notification for suspicious login
export async function notifySuspiciousLogin({
  userId,
  ipAddress,
  location,
  reasons,
}) {
  return createNotification({
    userId,
    type: 'suspicious_login',
    category: 'adminAlerts',
    title: 'Suspicious Login Detected',
    body: `A login was detected from ${ipAddress}${location?.city ? ` in ${location.city}` : ''}`,
    data: {
      ipAddress,
      location,
      reasons,
    },
    priority: 'high',
  });
}

// Create notification for message expiration
export async function notifyMessageExpired({
  userId,
  messageId,
  chatId,
  groupId,
}) {
  return createNotification({
    userId,
    type: 'message_expired',
    category: 'system',
    title: 'Message Expired',
    body: 'A message you sent has expired and been deleted',
    data: {
      messageId,
    },
    chatId,
    groupId,
    messageId,
    priority: 'low',
  });
}

function getCategoryFromType(type) {
  const categoryMap = {
    mention: 'mentions',
    message: 'directMessages',
    reply: 'replies',
    reaction: 'replies',
    file_upload: 'fileUploads',
    system: 'system',
    admin_alert: 'adminAlerts',
    suspicious_login: 'adminAlerts',
    group_invite: 'groupInvites',
    message_expired: 'system',
    message_deleted: 'system',
  };
  return categoryMap[type] || 'directMessages';
}

