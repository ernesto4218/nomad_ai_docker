import { db } from "$lib/server/db";
import { cronLogs } from "$lib/server/db/schema";

export async function logCronRun(params: {
  jobName: string;
  userId: string;
  success: boolean;
  message?: string;
}) {
  await db.insert(cronLogs).values(params);
}