import bezierSpline from '@turf/bezier-spline';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import destination from '@turf/destination';
import { point, lineString } from '@turf/helpers';

export function generateCurvyPath(startCoords: [number, number], endCoords: [number, number]): [number, number][] {
    const start = point(startCoords);
    const end = point(endCoords);

    const dist = distance(start, end, { units: 'meters' });
    const brg = bearing(start, end);

    const segments = 4;
    const segmentLength = dist / segments;
    const pathCoords: [number, number][] = [startCoords];

    for (let i = 1; i < segments; i++) {
        const currentDist = i * segmentLength;
        const basePoint = destination(start, currentDist, brg, { units: 'meters' });

        const offsetDist = (Math.random() - 0.5) * (dist * 0.20);
        const offsetBearing = brg + 90;

        const offsetPoint = destination(basePoint, offsetDist, offsetBearing, { units: 'meters' });
        pathCoords.push(offsetPoint.geometry.coordinates as [number, number]);
    }

    pathCoords.push(endCoords);

    const roughLine = lineString(pathCoords);
    const curved = bezierSpline(roughLine, { sharpness: 0.85 });

    return curved.geometry.coordinates as [number, number][];
}