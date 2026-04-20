import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

// We use dynamic/private so SvelteKit reads the DATABASE_URL 
// injected by Dokploy when the Docker container starts.
const queryClient = postgres(env.DATABASE_URL);

// Export a single database instance
export const db = drizzle(queryClient, { schema });