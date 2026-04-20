import { users, balances, user_map_values, agents } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

export const userRepository = (db: PostgresJsDatabase<typeof schema>) => ({
    /**
     * Finds a user by their unique ID
     */
    async findByUserId(userId: number) {
        const [user] = await db.select()
            .from(users)
            .where(eq(users.userId, userId));
            
        return user ?? null;
    },

    async getBalance(userId: number) {
        const [result] = await db.select({
                balance: balances.balance, 
            })
            .from(balances)
            .where(eq(balances.userId, userId));

        return result?.balance ?? null;
    },

    async updateBalance(userId: number, amount: number) {
        const [result] = await db
            .update(balances)
            .set({ balance: sql`${balances.balance} + ${amount}` })
            .where(eq(balances.userId, userId))
            .returning({ balance: balances.balance });

        return result?.balance ?? null;
    },

    async getUserMapValues(userId: number) {
        const [result] = await db.select({
                radious: user_map_values.radious,
                nodes: user_map_values.nodes,
                maxAgents: user_map_values.maxAgents,
                locked_lat: user_map_values.locked_lat,
                locked_lng: user_map_values.locked_lng,
            })
            .from(user_map_values)
            .where(eq(user_map_values.userId, userId));

        return result ?? null;
    },

    async updateUserMapValuesIfNoLatLng(userId: number, lat: number, lng: number) {
        const [existing] = await db.select({
                locked_lat: user_map_values.locked_lat,
                locked_lng: user_map_values.locked_lng,
            })
            .from(user_map_values)
            .where(eq(user_map_values.userId, userId));

        if (!existing) return null;

        const hasLatLng = existing.locked_lat != null && existing.locked_lng != null;
        if (hasLatLng) return existing;

        const [result] = await db.update(user_map_values)
            .set({
                locked_lat: lat,
                locked_lng: lng,
            })
            .where(eq(user_map_values.userId, userId))
            .returning();

        return result ?? null;
    },

    /**
     * Upserts user data and initializes balance if new
     */
    async upsert(userData: typeof users.$inferInsert, invitedBy: number | null) {
        const payload = {
            ...userData,
            firstName: userData.firstName ?? null,
            lastName: userData.lastName ?? null,
            username: userData.username ?? null,
            languageCode: userData.languageCode ?? null,
            isPremium: userData.isPremium ?? false,
            photoUrl: userData.photoUrl ?? null,
        };

        await db.insert(users)
            .values({
                ...payload,
                invitedBy: invitedBy 
            })
            .onConflictDoUpdate({
                target: users.userId,
                set: {
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    username: payload.username,
                    languageCode: payload.languageCode,
                    isPremium: payload.isPremium,
                    photoUrl: payload.photoUrl,
                }
            });

        await db.insert(balances)
            .values({ 
                userId: payload.userId as number, 
                balance: 1000 
            })
            .onConflictDoNothing({
                target: balances.userId 
            });

        await db.insert(user_map_values)
            .values({ 
                userId: payload.userId as number,
            })
            .onConflictDoNothing({
                target: user_map_values.userId
            });
            
        return await this.findByUserId(payload.userId as number);
    }
});