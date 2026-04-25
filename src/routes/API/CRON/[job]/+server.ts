import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getJob } from '$lib/cron/index';
import { logCronRun } from '$lib/cron/logger';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ params, request }) => {
  // 1. Auth check
  const secret = request.headers.get('x-cron-secret');
  console.log(secret);
  if (!secret || secret !== env.CRON_SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Find the job
  const job = getJob(params.job);
  if (!job) {
    return json({ error: `Unknown job: ${params.job}` }, { status: 404 });
  }

  // 3. Parse body
  const { userId } = await request.json();
  if (!userId) {
    return json({ error: 'Missing userId in body' }, { status: 400 });
  }

  // 4. Run the job
  let result;
  try {
    result = await job.run({ userId });
  } catch (err) {
    result = { success: false, message: String(err) };
  }

  // 5. Log it
  await logCronRun({ jobName: params.job, userId, ...result });

  return json(result);
};