import { pgTable, text, integer, serial, boolean, timestamp, doublePrecision, jsonb, bigint, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // IMPORTANT: Telegram user IDs exceed the 32-bit integer limit. 
  // You must use bigint to prevent out-of-range errors when real users connect.
  userId: bigint('user_id', { mode: 'number' }).primaryKey(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  username: text('username'),
  languageCode: text('language_code'),
  isPremium: boolean('is_premium'), // Native boolean!
  photoUrl: text('photo_url'),
  invitedBy: bigint('invited_by', { mode: 'number' }),
  lastOnline: timestamp('last_online').defaultNow(),
});

export const balances = pgTable('balances', {
    // serial replaces integer + autoIncrement
    id: serial('id').primaryKey(),
    
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .unique()
        .references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    balance: integer('balance').default(1000).notNull(),
    
    // Native timestamps replace the strftime SQL hacks
    dateCreated: timestamp('date_created').defaultNow(),
    dateUpdated: timestamp('date_updated').defaultNow(),
});

export const user_map_values = pgTable('user_map_values', {
    id: serial('id').primaryKey(),
    
    userId: bigint('user_id', { mode: 'number' })
        .notNull()
        .unique()
        .references(() => users.userId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    
    radious: integer('radious').default(1000).notNull(),
    nodes: integer('nodes').default(5).notNull(),
    maxAgents: integer('maxagents').default(5).notNull(),
    
    // doublePrecision is highly recommended over real for Mapbox coordinates 
    // to prevent microscopic drift when saving Lng/Lat
    locked_lat: doublePrecision('locked_lat'),
    locked_lng: doublePrecision('locked_lng'),
    
    dateCreated: timestamp('date_created').defaultNow(),
    dateUpdated: timestamp('date_updated').defaultNow(),
});

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  avatar: text('avatar').notNull().default('🤖'),
  classId: text('class_id').notNull(), 
  duration_hr: integer('duration').notNull().default(1), 
  
  deployedLat: doublePrecision('deployed_lat').notNull(),
  deployedLng: doublePrecision('deployed_lng').notNull(),

  // --- TURF DATA ARRAYS ---
  // JSONB is much faster than standard JSON text storage. 
  // Postgres can index and query directly inside these coordinate arrays if needed.
  generatedPoints: jsonb('generated_points')
    .$type<[number, number][]>(),
  
  randomPoints: jsonb('random_points')
    .$type<[number, number][]>(),
  
  paths: jsonb('paths')
    .$type<[number, number][][]>(),

  currentPoints: integer('current_points').default(100),

  status: text('status').notNull().default('scavenging'),
  batteryLevel: doublePrecision('battery_level').notNull().default(100.0),
  
  deployedAt: timestamp('deployed_at').defaultNow(),
});

export const dailyTasks = pgTable('daily_tasks', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  desc: text('desc').notNull(),
  icon: text('icon').notNull(),
  reward: integer('reward').notNull().default(0), 
  last_completed: timestamp('last_completed'),
  created_at: timestamp('created_at').defaultNow(),
});

export const cronLogs = pgTable('cron_logs', {
  id: serial('id').primaryKey(),
  jobName: text('job_name').notNull(),
  userId:  text('user_id').notNull(),
  success: boolean('success').notNull(),
  message: text('message'),
  ranAt:   timestamp('ran_at').defaultNow().notNull(),
});