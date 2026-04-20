import { db } from '$lib/server/db';
import { userRepository } from '$lib/server/repositories/user';
import { json, error } from '@sveltejs/kit';
import type { DeployAgentMapRequest } from '$lib/interface';
import { agentRepository } from '$lib/server/repositories/agents';
import { AGENT_UPGRADE_COST_BASE, AGENT_UPGRADE_COST_BASE_MULTIPLIER, UPGRADE_MULTIPLIER } from '$lib/constants.js';

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


    try {
        // Perform update
        const balance = await userrepo.getBalance(locals.user.userId);
        const upgradeCosts = Number(agent.currentPoints) * AGENT_UPGRADE_COST_BASE_MULTIPLIER * (Number(agent.level) ?? 1);
        const total_add =  (Number(agent.currentPoints) * UPGRADE_MULTIPLIER) - Number(agent.currentPoints);

        console.log("total_add: ", total_add);
        if (balance === null || balance < upgradeCosts) {
            return json({
                success: false,
                message: "Not enough balance.",
            });
        }
        
        const newbalance = await userrepo.updateBalance(locals.user.userId, -upgradeCosts);
        await agentrepo.updateAgentPoints(locals.user.userId, agentid, +total_add);
        const userAgents = await agentrepo.getUserAgents(locals.user.userId);

        return json({
            success: true,
            message: "Upgrade AI Agent",
            userAgents,
            newbalance
        });

    } catch (err) {
        console.error("Error:", err);
        return json({
            success: true,
            message: "Something went wrong.",
        });
    }
}