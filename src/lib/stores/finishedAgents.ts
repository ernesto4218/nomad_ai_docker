// $lib/stores/finishedAgents.ts
import { writable } from 'svelte/store';
import type { Agent } from '$lib/interface';

// This lives outside the lifecycle of any single component
export const finishedAgents = writable<Agent[]>([]);