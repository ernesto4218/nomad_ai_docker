// src/routes/api/users/[id]/+server.ts
import { json, error } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
    const userId = parseInt(params.id);

    // 1. Safety check for the ID
    if (isNaN(userId)) {
        throw error(400, 'Invalid user ID');
    }

    // 2. Safety check for the DB binding
    if (!platform?.env.DB) {
        throw error(500, 'Database connection missing');
    }

    const db = drizzle(platform.env.DB);

    try {
        // 3. Fetch the user using Drizzle's "eq" (equals) filter
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .get(); // .get() returns a single object instead of an array

        if (!user) {
            throw error(404, 'User not found');
        }

        return json(user);
    } catch (e) {
        console.error(e);
        throw error(500, 'Internal Server Error');
    }
};