import { userRepository } from '$lib/server/repositories/user';
import { json, error } from '@sveltejs/kit';
import { agentRepository } from '$lib/server/repositories/agents';
import { db } from '$lib/server/db';

interface UpdateLocaRequest {
    lat: number;
    lng: number;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ locals, platform, request }) {
    if (!locals.user) throw error(401, 'Unauthorized');

    const body = (await request.json()) as UpdateLocaRequest;
    const { lat, lng } = body;

    if (lat == null || lng == null) throw error(400, 'lat and lng are required');

    const userrepo = userRepository(db);

    try {
        const result = await userrepo.updateUserMapValuesIfNoLatLng(locals.user.userId, lat, lng);

        //@ts-ignore
        if (result.status === 'not_found') {
            throw error(404, 'User map values not found');
        }

        return json({
            success: true,
        //@ts-ignore
            updated: result.status === 'updated',
        //@ts-ignore
            data: result.data,
        });

    } catch (err) {
        console.error("Location Error:", err);
        throw error(500, 'Failed to set location');
    }
}