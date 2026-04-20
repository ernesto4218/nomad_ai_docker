import type { Agent } from '$lib/interface';
import { writable } from 'svelte/store';

export const agents = writable<Agent[]>([]);
export const maxAgentDeployed = writable(false);
