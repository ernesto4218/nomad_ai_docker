import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyTasks } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CompleteTasks } from '$lib/interface';
import { userRepository } from '$lib/server/repositories/user';
import { agentRepository } from '$lib/server/repositories/agents.js';
import { _ } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals, platform }) {
    if (!locals.user) throw error(401, 'Unauthorized');

    const userId = locals.user.userId;
    const userrepo = userRepository(db);
    const agentrepo = agentRepository(db);

  
    try {
        const body = (await request.json()) as CompleteTasks;
        const { taskName, type } = body;
        let reward = 0;

        if (type === 'daily'){

            const [task] = await db.select()
                .from(dailyTasks)
                .where(
                    and(
                        eq(dailyTasks.userId, userId),
                        eq(dailyTasks.name, taskName)
                    )
                );

            if (!task) {
                return json({ success: false, message: 'Task not found' }, { status: 404 });
            }

            reward = task.reward;

            if (taskName === 'Agent Maintenance'){
                const agent = await agentrepo.getFullyChargedUserAgents(locals.user.userId);
                console.log(agent);
                if (!agent || agent.length === 0){
                    return json({ success: false, message: "No charged agent." });
                }
            }

            // 2. Validate Cooldowns
            const now = new Date();
            
            if (task.last_completed) {
                const lastCompletedDate = task.last_completed;
                
                if (task.name === 'Watch Ad') {
                    const tenMinutesMs = 10 * 60 * 1000;
                    if ((now.getTime() - lastCompletedDate.getTime()) < tenMinutesMs) {
                        return json({ success: false, message: 'Ad is still on cooldown' }, { status: 400 });
                    }

                } else if (task.name === 'Daily Check-in') {
                    const twelveHoursMs = 12 * 60 * 60 * 1000;
                    if ((now.getTime() - lastCompletedDate.getTime()) < twelveHoursMs) {
                        return json({ success: false, message: 'Check-in is still on cooldown' }, { status: 400 });
                    }
                } else {
                    if (lastCompletedDate.toDateString() === now.toDateString()) {
                        return json({ success: false, message: 'Task already completed today' }, { status: 400 });
                    }
                }
            }

            await db.update(dailyTasks)
                .set({ last_completed: now }) 
                .where(
                    and(
                        eq(dailyTasks.userId, userId),
                        eq(dailyTasks.name, taskName)
                    )
                );

            const balance = await userrepo.updateBalance(locals.user.userId, reward);
            return json({ success: true, balance: balance });
        } else if (type === 'onetime') {

        } else {
            return json({ success: true, message: "No type provided." });
        }
        
    } catch (err) {
        console.error('Failed to complete task:', err);
        throw error(500, 'Internal Server Error');
    }
}