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
    if (agent.batteryLevel <= 0) {
        return json({ 
            success: false, 
            message: "Agent battery is depleted! Please recharge before deploying." 
        }, { status: 400 });
    }

    // --- EXPIRY CHECK ---
    const currentTime = Date.now();
    let isExpired = false;

    if (agent.deployedAt) {
        const durationMs = agent.duration_hr * 60 * 60 * 1000;
        const expiryTime = agent.deployedAt.getTime() + durationMs;
        isExpired = currentTime > expiryTime;
    } else {
        isExpired = true; 
    }

    if (agent.status === 'scavenging' && !isExpired) {
        return json({ 
            success: false, 
            message: "Agent is still busy scavenging!" 
        }, { status: 400 });
    }

    // --- DATA GENERATION ---
    const values = await userrepo.getUserMapValues(locals.user.userId);
    const center: [number, number] = [agent.deployedLng, agent.deployedLat];
    const radiusInMeters = values?.radious || 1000;
    const numberOfPoints = values?.nodes || 5;

    const generated_points = Array.from({ length: numberOfPoints }).map(() => 
        generateRandomPoint(center, radiusInMeters)
    );

    const points = [center, ...generated_points, center];

    const paths: [number, number][][] = [];
    for (let i = 0; i < points.length - 1; i++) {
        paths.push(generateCurvyPath(points[i], points[i + 1]));
    }

    try {
        // Perform update
        await agentrepo.updateAgentDeployment(locals.user.userId, agentid, {
            generatedPoints: generated_points,
            randomPoints: points,
            paths: paths,
            currentPoints: 100,
            status: 'scavenging',
            // Decrement battery - using Math.max as a safety fallback
            batteryLevel: Math.max(0, agent.batteryLevel - 20), 
            deployedAt: new Date() 
        });

        const reward = Number(agent.currentPoints) || 0;
        const balance = await userrepo.updateBalance(locals.user.userId, reward);
        
        const userAgents = await agentrepo.getUserAgents(locals.user.userId);

        return json({
            success: true,
            userAgents,
            balance
        });

    } catch (err) {
        console.error("Deployment Error:", err);
        throw error(500, 'Failed to update agent deployment');
    }
}