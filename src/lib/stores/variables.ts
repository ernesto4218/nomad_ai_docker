import { writable } from 'svelte/store';
const initialCoords: [number, number] = [-71.06776, 42.35816];

export let MAP_RADIOUS = writable(1000);
export let DEFAULT_NODES = writable(10);
export let CENTER_POINT = writable(initialCoords);