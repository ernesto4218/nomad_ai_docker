import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables so drizzle-kit can see DATABASE_URL
dotenv.config();

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // Changed from sqlite
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/nomad_ai',
  },
});