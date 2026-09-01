// server/deviceTokens.ts
export type PlatformType = 'ios' | 'android';
export interface DeviceToken {
  token: string;
  userId: number;
  platform: PlatformType;
  updatedAt: Date;
}

const byToken = new Map<string, DeviceToken>();

export const deviceTokenStore = {
  upsert(input: { token: string; userId: number; platform: PlatformType }) {
    const now = new Date();
    const existing = byToken.get(input.token);
    if (existing) {
      byToken.set(input.token, { ...existing, userId: input.userId, platform: input.platform, updatedAt: now });
    } else {
      byToken.set(input.token, { token: input.token, userId: input.userId, platform: input.platform, updatedAt: now });
    }
  },

  remove(token: string, userId?: number) {
    const existing = byToken.get(token);
    if (!existing) return false;
    if (userId !== undefined && existing.userId !== userId) return false;
    return byToken.delete(token);
  },

  removeAllForUser(userId: number) {
    let count = 0;
    for (const [t, rec] of byToken.entries()) {
      if (rec.userId === userId) {
        byToken.delete(t);
        count++;
      }
    }
    return count;
  },

  async getByUserId(userId: number): Promise<string[]> {
    const out: string[] = [];
    for (const rec of byToken.values()) {
      if (rec.userId === userId) out.push(rec.token);
    }
    return out;
  },

  debugListForUser(userId: number): string[] {
    return Array.from(byToken.values())
      .filter(r => r.userId === userId)
      .map(r => `${r.token.slice(0, 12)}... (${r.platform})`);
  },
};