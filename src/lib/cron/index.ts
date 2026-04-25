import { telegramNotifyJob } from './jobs/telegram_notify';
import type { CronJob } from './types';

const jobs: Record<string, CronJob> = {
  'telegram-notify': telegramNotifyJob,
  // 'email-digest': emailDigestJob,  ← future jobs just go here
};

export function getJob(name: string): CronJob | null {
  return jobs[name] ?? null;
}