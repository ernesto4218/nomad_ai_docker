// 1. Change the import from getDb to the direct db instance
import { db } from '$lib/server/db';
import { userRepository } from '$lib/server/repositories/user';
import { json, error } from '@sveltejs/kit';
import { AVATARS, DEPLOYMENT_COST, MOCK_CLASSES } from '$lib/components/agents/config';
import type { DeployAgentMapRequest } from '$lib/interface';
import { agents } from '$lib/server/db/schema';
import { generateCurvyPath, generateRandomPoint } from '$lib/server/helper';
import { agentRepository } from '$lib/server/repositories/agents.js';

const VALID_CLASS_IDS = new Set(MOCK_CLASSES.map(c => c.id));
const VALID_AVATARS = new Set(AVATARS);

/** @type {import('./$types').RequestHandler} */
// 2. Remove 'platform' from the destructured arguments
export async function POST({ locals, request }) {
    if (!locals.user) throw error(401, 'Unauthorized');
    
    // 3. REMOVED: The entire if (!platform?.env?.DB) block! 

    const body = (await request.json()) as DeployAgentMapRequest;
    const { longitude, latitude, agentName, selectedClass, selectedAvatar } = body;

    if (!isFinite(longitude) || !isFinite(latitude)) {
        throw error(400, 'Invalid coordinates provided');
    }

    if (!VALID_CLASS_IDS.has(selectedClass) || !VALID_AVATARS.has(selectedAvatar)) {
        throw error(400, 'Invalid agent configuration: class or avatar selection is invalid');
    }

    // 4. Initialize repositories using the globally imported 'db'
    const userrepo = userRepository(db);
    const agentrepo = agentRepository(db);

    // Parallel fetch — single round-trip
    const [balance, userAgents, mapValues] = await Promise.all([
        userrepo.getBalance(locals.user.userId),
        agentrepo.getUserAgents(locals.user.userId),
        userrepo.getUserMapValues(locals.user.userId),
    ]);

    const maxAgents = Number(mapValues?.maxAgents) ?? 5;

    if (userAgents.length >= maxAgents) {
        return json({ success: false, message: 'Maximum agents reached.' });
    }

    if (balance === null || balance < DEPLOYMENT_COST) {
        return json({ success: false, message: 'Not enough balance.' });
    }

    // Generate nodes and paths
    const center: [number, number] = [longitude, latitude];
    const radiusInMeters = mapValues?.radious ?? 1000;
    const numberOfPoints = mapValues?.nodes ?? 5;

    const generatedPoints = Array.from({ length: numberOfPoints }, () =>
        generateRandomPoint(center, radiusInMeters)
    );

    const waypoints = [center, ...generatedPoints, center];

    const paths: [number, number][][] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        paths.push(generateCurvyPath(waypoints[i], waypoints[i + 1]));
    }

    try {
        const [newBalance] = await Promise.all([
            userrepo.updateBalance(locals.user.userId, -DEPLOYMENT_COST),
            db.insert(agents).values({
                userId: locals.user.userId,
                name: agentName,
                avatar: selectedAvatar,
                classId: selectedClass,
                duration_hr: 1,
                deployedLat: latitude,
                deployedLng: longitude,
                generatedPoints: generatedPoints,
                randomPoints: waypoints,
                paths,
                status: 'scavenging',
                batteryLevel: 100.0,
            }),
        ]);

        const newAgents = await agentrepo.getUserAgents(locals.user.userId);
        console.log(newBalance);
        return json({ success: true,  newAgents, newBalance });
    } catch (err) {
        console.error('Failed to deploy agent:', err);
        throw error(500, 'Failed to save agent to database');
    }
}