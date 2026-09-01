import admin from './firebaseAdmin';
import { deviceTokenStore } from './deviceTokens';

export async function sendPushToUser(userId: number, title: string, body: string, data: Record<string, string> = {}) {
  const tokens = await deviceTokenStore.getByUserId(userId);
  console.log('[FCM] getUserDeviceTokens for userId', userId, '=> count:', tokens.length);

  if (!tokens.length) return { sent: 0, failed: 0, note: 'No tokens for user' };

  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
  });

  if (res.failureCount > 0 && res.responses) {
    res.responses.forEach((r, idx) => {
      if (!r.success) console.warn('[FCM] send error for token', tokens[idx], '=>', r.error?.message);
    });
  }
  return { sent: res.successCount, failed: res.failureCount };
}