import { AVATARS, MOCK_CLASSES } from "$lib/components/agents/config";

export function getAgentStyle(className: string | undefined | null) {
		// 1. Fallback to 'scout' if className is missing/undefined to prevent .toLowerCase() crash
		const safeClassName = (className || 'scout').toLowerCase();

		// 2. Find the config, defaulting to the first class if no match is found
		const config = MOCK_CLASSES.find((c) => c.id === safeClassName) || MOCK_CLASSES[0];

		const colorMap: Record<string, string> = {
			scout: '#10b981',
			extraction: '#f59e0b',
			energy: '#3b82f6',
			stealth: '#8b5cf6'
		};

		// 3. Use the config ID to get the color, or a default hex if the map lookup fails
		const color = colorMap[config.id] || '#10b981';

		return {
			color: color,
			label: config.label,
			avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)]
		};
	}