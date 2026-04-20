import { users, balances, user_map_values, agents } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';

export const agentRepository = (db: PostgresJsDatabase<typeof schema>) => ({
    
    async getUserAgentById(userId: number, agentId: number) {
        // Swapped .get() for array destructuring
        const [result] = await db.select({
                id: agents.id,
                name: agents.name,
                avatar: agents.avatar,
                classId: agents.classId,
                deployedLat: agents.deployedLat,
                deployedLng: agents.deployedLng,
                duration_hr: agents.duration_hr,
                generatedPoints: agents.generatedPoints,
                randomPoints: agents.randomPoints,
                paths: agents.paths,
                currentPoints: agents.currentPoints,
                level: sql<number>`floor(${agents.currentPoints} / 100)`.as('level'),
                status: agents.status,
                batteryLevel: agents.batteryLevel,
                deployedAt: agents.deployedAt
            })
            .from(agents)
            .where(
                and(
                    eq(agents.userId, userId),
                    eq(agents.id, agentId) 
                )
            );

        return result ?? null;
    },

    async updateAgentDeployment(userId: number, agentId: number, data: any) {
        // This one was already perfectly formatted for Postgres!
        const [updatedAgent] = await db.update(agents)
            .set({
                generatedPoints: data.generatedPoints,
                randomPoints: data.randomPoints,
                paths: data.paths,
                currentPoints: data.currentPoints,
                status: data.status,
                batteryLevel: data.batteryLevel,
                deployedAt: data.deployedAt
            })
            .where(
                and(
                    eq(agents.userId, userId),
                    eq(agents.id, agentId)
                )
            )
            .returning(); 

        return updatedAgent ?? null;
    },

    async updateagentBattery(userId: number, agentId: number) {
        // Also perfectly formatted
        const [updatedAgent] = await db.update(agents)
            .set({
                batteryLevel: 100,
            })
            .where(
                and(
                    eq(agents.userId, userId),
                    eq(agents.id, agentId)
                )
            )
            .returning(); 

        return updatedAgent ?? null;
    },

    
    async updateAgentPoints(userId: number, agentId: number, amount: number){
        // Swapped .get() for .returning() with array destructuring
        const [result] = await db
            .update(agents)
            .set({ currentPoints: sql`${agents.currentPoints} + ${amount}` })
            .where(
                and(
                    eq(agents.userId, userId),
                    eq(agents.id, agentId)
                )
            )
            .returning();

        return result ?? null;
    },

    async getUserMapValues(userId: number) {
        // Swapped .get() for array destructuring
        const [result] = await db.select({
                radious: user_map_values.radious,
                nodes: user_map_values.nodes,
            })
            .from(user_map_values)
            .where(eq(user_map_values.userId, userId));

        return result ?? null;
    },

    async getUserAgents(userId: number) {
        // Removed .all() — Postgres returns the array natively
        const result = await db.select({
                id: agents.id,
                name: agents.name,
                avatar: agents.avatar,
                classId: agents.classId,
                deployedLat: agents.deployedLat,
                deployedLng: agents.deployedLng,
                duration_hr: agents.duration_hr,
                generatedPoints: agents.generatedPoints,
                randomPoints: agents.randomPoints,
                paths: agents.paths,
                currentPoints: agents.currentPoints,
                level: sql<number>`floor(${agents.currentPoints} / 100)`.as('level'),
                status: agents.status,
                batteryLevel: agents.batteryLevel,
                deployedAt: agents.deployedAt
            })
            .from(agents)
            .where(eq(agents.userId, userId));

        return result ?? [];
    },

    async getFullyChargedUserAgents(userId: number) {
        // Removed .all() — Postgres returns the array natively
        const result = await db.select({
                id: agents.id,
                name: agents.name,
                batteryLevel: agents.batteryLevel,
            })
            .from(agents)
            .where(
                and(
                    eq(agents.userId, userId),
                    eq(agents.batteryLevel, 100)
                )
            );

        return result ?? [];
    },
});