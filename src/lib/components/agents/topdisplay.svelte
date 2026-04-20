<script lang="ts">
	import type { Agent } from '$lib/interface';
	import { getAgentStyle } from '$lib/helper/agentstyle';
	import { agents } from '$lib/stores/agents';

	let {
		map,
		movingMarkers
	}: {
		map: mapboxgl.Map;
		movingMarkers: Record<string, mapboxgl.Marker>;
	} = $props();

	// Helper functions
	const getBatteryColor = (level: number) => {
		if (level > 60) return '#4ade80';
		if (level > 25) return '#facc15';
		return '#f87171';
	};

	const getBatterySegments = (level: number) => Math.round((level / 100) * 4);

	function flyToAgent(agent: Agent) {
		// Better way to find the index if keys are numeric strings
		//@ts-ignore
		const agentIndex = Object.keys($agents).find((key) => $agents[key] === agent);
		const marker = movingMarkers[`agent-${agentIndex}`];

		if (!marker || !map) return;

		const { lng, lat } = marker.getLngLat();
		map.flyTo({
			center: [lng, lat],
			zoom: 18,
			duration: 1200,
			essential: true
		});
	}
</script>

<div class="absolute top-24 right-4 z-10 flex max-w-[80%] flex-col items-end gap-2">
	{#if $agents}
		<p class="mb-0.5 text-[10px] font-medium tracking-widest text-white/30 uppercase">
			Network Nodes
		</p>

		<div class="flex flex-row flex-wrap justify-end gap-x-4 gap-y-2">
			{#each Object.values($agents) as agent, i (agent.id || i)}
				{@const style = getAgentStyle(agent.classId)}
				{@const delay = (i * 0.8) % 3}
				{@const isLowBattery = agent.batteryLevel < 20}
				{@const segments = getBatterySegments(agent.batteryLevel)}

				<button
					class="group relative flex cursor-pointer flex-col items-center gap-2"
					onclick={() => flyToAgent(agent)}
				>
					<div class="relative flex h-10 w-10 items-center justify-center">
						<div
							class="animate-ping-slow absolute inset-0 rounded-full border opacity-0"
							style="border-color: {isLowBattery
								? '#ef4444'
								: style.color}; animation-delay: {delay}s;"
						></div>

						{#if isLowBattery}
							<div
								class="animate-pulse-red absolute inset-0 rounded-full bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
							></div>
						{/if}

						<div
							class="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black/90 text-lg backdrop-blur-sm transition-all duration-200 group-hover:scale-110"
							style="
								border: 1.5px solid {isLowBattery ? '#ef4444' : style.color};
								box-shadow: 0 0 10px {isLowBattery ? '#ef4444' : style.color}33;
							"
						>
							<img
								src={agent.avatar}
								alt={agent.name}
								class="h-full w-full object-cover {isLowBattery ? 'opacity-60 grayscale' : ''}"
							/>

							<div
								class="{isLowBattery
									? 'animate-flicker-fast bg-red-500'
									: 'animate-flicker bg-white'} absolute -top-0.5 -right-0.5 z-20 h-2 w-2 rounded-full border border-black"
								style="animation-delay: {delay * 0.5}s;"
							></div>
						</div>

						{#if isLowBattery}
							<div
								class="absolute -right-1 -bottom-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-lg"
							>
								!
							</div>
						{/if}
					</div>

					<div class="flex flex-col items-center gap-1">
						<div class="flex flex-row items-center gap-[2px]">
							{#each Array(4) as _, bIndex}
								<div
									class="h-1.5 w-1.5 rounded-[1px] transition-all duration-300 {isLowBattery
										? 'animate-pulse'
										: ''}"
									style="background-color: {bIndex < segments
										? getBatteryColor(agent.batteryLevel)
										: 'rgba(255,255,255,0.1)'};"
								></div>
							{/each}
						</div>

						<div class="flex flex-col items-center">
							<span
								class="font-mono text-[8px] tracking-tighter {isLowBattery
									? 'font-bold text-red-400'
									: 'text-white/50'}"
							>
								{agent.batteryLevel}%
							</span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>
