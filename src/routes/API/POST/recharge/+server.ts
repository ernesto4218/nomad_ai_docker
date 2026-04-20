import { db } from '$lib/server/db';
import { userRepository } from '$lib/server/repositories/user';
import { json, error } from '@sveltejs/kit';
import type { DeployAgentMapRequest } from '$lib/interface';
import { agents } from '$lib/server/db/schema';
import { agentRepository } from '$lib/server/repositories/agents';
import { generateCurvyPath, generateRandomPoint } from '$lib/server/helper';

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals, platform, request }) {
    if (!locals.user) throw error(401, 'Unauthorized');

    const body = (await request.json()) as DeployAgentMapRequest;
    const { agentid } = body;
    
    if (isNaN(agentid)) throw error(400, 'Invalid agent ID');

    const agentrepo = agentRepository(db);
    const userrepo = userRepository(db);

    const agent = await agentrepo.getUserAgentById(locals.user.userId, agentid);

    if (!agent) {
        throw error(400, 'Agent does not exist.');
    }


    // --- BATTERY CHECK ---
    // Check if battery is 0 or less before allowing deployment
    if (agent.batteryLevel > 0) {
        return json({ 
            success: false, 
            message: "Agent battery is not low." 
        }, { status: 400 });
    }

    try {
        // Perform update
        await agentrepo.updateagentBattery(locals.user.userId, agentid);
        const userAgents = await agentrepo.getUserAgents(locals.user.userId);

        return json({
            success: true,
            userAgents,
        });

    } catch (err) {
        console.error("Charging Error:", err);
        throw error(500, 'Failed to charge agent');
    }
}