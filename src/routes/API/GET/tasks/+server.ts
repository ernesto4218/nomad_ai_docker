import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyTasks } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, platform }) {
    if (!locals.user) throw error(401, 'Unauthorized');


    const userId = locals.user.userId; 

    try {
        let existingTasks = await db.select()
          .from(dailyTasks)
          .where(eq(dailyTasks.userId, userId))
          .orderBy(desc(dailyTasks.reward));

        // 1. Seed tasks if they don't exist
        if (existingTasks.length === 0) {
            const new_tasks_template = [
                { name: 'Watch Ad', desc: 'Watch advertisement every 10 mins', reward: 50, icon: 'Tv' },
                { name: 'Daily Check-in', desc: 'Maintain your streak', reward: 100, icon: 'CalendarCheck' },
                { name: 'Agent Maintenance', desc: 'Recharge your active agents', reward: 40, icon: 'Zap' },
            ];

            const tasksToInsert = new_tasks_template.map(task => ({
                ...task,
                userId: userId,
                // Ensure your schema allows lastCompletedAt to be null by default
                last_completed: null 
            }));

            existingTasks = await db.insert(dailyTasks)
                .values(tasksToInsert)
                .returning();

            existingTasks.sort((a, b) => b.reward - a.reward);
        }

        // 2. Evaluate Completion Status
        const now = new Date();
        const tenMinutesMs = 10 * 60 * 1000;

        const tasksWithStatus = existingTasks.map(task => {
            let isCompleted = false;

            if (task.last_completed) {
                const lastCompletedDate = new Date(task.last_completed);

                if (task.name === 'Watch Ad') {
                    // Check if the last completion was less than 10 minutes ago
                    isCompleted = (now.getTime() - lastCompletedDate.getTime()) < tenMinutesMs;
                } else {
                    // Check if it was already completed today (compares YYYY-MM-DD)
                    isCompleted = lastCompletedDate.toDateString() === now.toDateString();
                }
            }

            return {
                ...task,
                isCompleted
            };
        });

        return json({ success: true, tasks: tasksWithStatus });

    } catch (err) {
        console.error('Task Operation Failed:', err);
        throw error(500, 'Failed to sync daily tasks');
    }
}