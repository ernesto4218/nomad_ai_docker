import { db } from '$lib/server/db';
import { userRepository } from '$lib/server/repositories/user';
import type { CronJob } from '../types';
import { env } from '$env/dynamic/private';
import { and, eq, gte, lte } from 'drizzle-orm';
import { agentRepository } from '$lib/server/repositories/agents';

export const telegramNotifyJob: CronJob = {
  name: 'telegram-notify',

  async run({ userId }) {
    if (!userId) {
      return { success: false, message: 'No userId provided' };
    }

    const now = new Date();

    // 1. Fetch user
    const userrepo = userRepository(db);
    const user = await userrepo.findByUserId(userId);

    if (!user) {
      return { success: false, message: `User ${userId} not found` };
    }

    // 2. Check: last online was 3+ days ago
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    if (!user.lastOnline || user.lastOnline > threeDaysAgo) {
      return { success: false, message: `Skipping — user ${userId} was recently online` };
    }

    // 3. Check: has agent deployed 1+ hour ago still scavenging
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const agentrepo = agentRepository(db);
    const activeAgents = await agentrepo.findActiveByUserId(userId, oneHourAgo);

    if (activeAgents.length === 0) {
      return { success: false, message: `Skipping — no active agents for user ${userId}` };
    }

    // 4. Check: no successful message sent in last 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const recentLog = await db.query.cronLogs.findFirst({
      where: (log, { and, eq, gte }) =>
        and(
          eq(log.jobName, 'telegram-notify'),
          eq(log.userId, String(userId)),
          eq(log.success, true),
          gte(log.ranAt, twoHoursAgo)
        ),
    });

    if (recentLog) {
      return { success: false, message: `Skipping — user ${userId} already messaged within 2hrs` };
    }

    // 5. Build and send message
    const agentList = activeAgents.map(a => `${a.avatar} ${a.name}`).join('\n');
    const text =
      `👋 Hey ${user.firstName ?? user.username}! Your agents are still out there!\n\n` +
      `${agentList}\n\n` +
      `Come back and check on them 🗺️`;

    const res = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.userId,
          text,
        }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return { success: false, message: data.description };
    }

    return { success: true, message: `Sent to ${user.userId} — ${activeAgents.length} agent(s)` };
  },
};