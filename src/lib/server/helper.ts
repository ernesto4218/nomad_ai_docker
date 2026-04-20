import destination from '@turf/destination';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import bezierSpline from '@turf/bezier-spline';
import { point, lineString } from '@turf/helpers';
import { AVATARS, MOCK_CLASSES } from '$lib/components/agents/config';

export  function generateRandomPoint(center: [number, number], radiusInMeters: number): [number, number] {
    const randomDistance = radiusInMeters * Math.sqrt(Math.random());
    const randomBearing = (Math.random() * 360) - 180;
    
    const centerPoint = point(center);
    const destPoint = destination(centerPoint, randomDistance, randomBearing, { units: 'meters' });
    
    return destPoint.geometry.coordinates as [number, number];
}

export  function generateCurvyPath(startCoords: [number, number], endCoords: [number, number]): [number, number][] {
    const start = point(startCoords);
    const end = point(endCoords);

    // Calculate straight-line distance and direction
    const dist = distance(start, end, { units: 'meters' });
    const brg = bearing(start, end);

    // Break the line into 4 segments to add "wobble"
    const segments = 4;
    const segmentLength = dist / segments;
    const pathCoords = [startCoords];

    for (let i = 1; i < segments; i++) {
        // Find the base point along the straight line
        const currentDist = i * segmentLength;
        const basePoint = destination(start, currentDist, brg, { units: 'meters' });

        // Add a random offset perpendicular to the main path (up to 20% of the total distance)
        const offsetDist = (Math.random() - 0.5) * (dist * 0.20); 
        const offsetBearing = brg + 90; // 90 degrees pushes it sideways

        // Calculate the new "wobbly" point
        const offsetPoint = destination(basePoint, offsetDist, offsetBearing, { units: 'meters' });
        pathCoords.push(offsetPoint.geometry.coordinates as [number, number]);
    }

    pathCoords.push(endCoords);

    // Create a rough line from our wobbly points
    const roughLine = lineString(pathCoords);
    
    // Let Turf smooth it into a beautiful curve
    const curved = bezierSpline(roughLine, { sharpness: 0.85 });

    return curved.geometry.coordinates as [number, number][];
}