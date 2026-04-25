export interface CronJobContext {
  userId: number;
  // extendable per job in the future
}

export interface CronJobResult {
  success: boolean;
  message?: string;
}

export interface CronJob {
  name: string;
  run(ctx: CronJobContext): Promise<CronJobResult>;
}