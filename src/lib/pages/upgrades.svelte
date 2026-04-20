<script lang="ts">
	import { TrendingUp, ArrowBigUpDash, ChevronRight, Clock, Zap } from '@lucide/svelte';
	import { agents } from '$lib/stores/agents';
	import { slide } from 'svelte/transition';
	import { MOCK_CLASSES } from '$lib/components/agents/config';
	import {
		AGENT_UPGRADE_COST_BASE,
		AGENT_UPGRADE_COST_BASE_MULTIPLIER,
		TOKEN,
		UPGRADE_MULTIPLIER
	} from '$lib/constants';
	import { userBalance } from '$lib/stores/balance';

	let upgradeMessage = $state('Upgrade AI Agent');
	let upgradingAgentId = $state<number | null>(null);
	let loadingAgentId = $state<number | null>(null);
	let errorAgentId = $state<number | null>(null);
	let errorMessage = $state<string>('');

	const getBatteryColor = (level: number) => {
		if (level > 60) return '#4ade80';
		if (level > 25) return '#facc15';
		return '#f87171';
	};

	async function handleUpgade(agent: any) {
		loadingAgentId = agent.id;
		errorAgentId = null;
		errorMessage = '';
		try {
			const response = await fetch('/API/POST/upgrade', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ agentid: agent.id })
			});

			if (!response.ok) throw new Error('Deployment failed');
			const result = await response.json();

			//@ts-ignore
			if (!result.success) {
				errorAgentId = agent.id;
				//@ts-ignore
				errorMessage = result.message || 'Upgrade failed.';
				return;
			}

			//@ts-ignore
			upgradeMessage = result.message;
			//@ts-ignore
			$userBalance = result.newbalance;
			//@ts-ignore
			$agents = result.userAgents;
		} catch (err) {
			errorAgentId = agent.id;
			errorMessage = 'Something went wrong.';
			console.error(err);
		} finally {
			loadingAgentId = null;
		}
	}

	const getBatterySegments = (level: number) => Math.round((level / 100) * 4);
	const getCls = (id: string) => MOCK_CLASSES.find((c) => c.id === id) || MOCK_CLASSES[0];
</script>

<div class="min-h-screen bg-zinc-950 pt-24 pb-24 text-zinc-100">
	<header
		class="sticky top-0 z-10 border-b border-zinc-800/50 bg-zinc-950/80 px-5 py-4 backdrop-blur-md"
	>
		<h1 class="text-[10px] font-black tracking-widest text-zinc-600 uppercase">
			Upgrade my agents
		</h1>
		<div class="flex items-center justify-between">
			<span class="text-2xl font-bold">{$agents.length} UNITS</span>
		</div>
	</header>

	<main class="space-y-5 p-4">
		{#each $agents as agent (agent.id)}
			{@const cls = getCls(agent.classId)}
			{@const isUpgrading = upgradingAgentId === agent.id}
			{@const isLowBattery = agent.batteryLevel < 20}
			{@const segments = getBatterySegments(agent.batteryLevel)}
			{@const isLoading = loadingAgentId === agent.id}
			{@const hasError = errorAgentId === agent.id}

			<button
				type="button"
				onclick={() => (upgradingAgentId = isUpgrading ? null : agent.id)}
				class="group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-300
          {isUpgrading
					? `${cls.accent} ${cls.glow} border-opacity-100`
					: 'border-zinc-800 bg-zinc-900/40'}"
			>
				<!-- ── HERO AVATAR SECTION ── -->
				<div class="relative w-full overflow-hidden" style="height: 220px;">
					<!-- Full-bleed avatar image -->
					<img
						src={agent.avatar}
						alt={agent.name}
						class="absolute inset-0 h-full w-full object-contain object-top transition-all duration-500
              {isLowBattery ? 'opacity-50 grayscale' : 'opacity-100'}
              {isUpgrading ? 'scale-105' : 'group-hover:scale-102'}"
					/>

					<!-- Ambient color wash from agent class -->
					<div
						class="absolute inset-0 opacity-20 mix-blend-color"
						style="background-color: {cls.hex}"
					></div>

					<!-- Bottom fade into card body -->
					<div
						class="absolute right-0 bottom-0 left-0 h-28"
						style="background: linear-gradient(to bottom, transparent, rgb(9 9 11))"
					></div>

					<!-- Side vignette -->
					<div
						class="absolute inset-0"
						style="background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)"
					></div>

					<!-- Top-left: status dot + class label -->
					<div class="absolute top-3 left-3 flex items-center gap-2">
						<span
							class="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase backdrop-blur-sm"
							style="color: {cls.hex}"
						>
							<span
								class="size-1.5 rounded-full {isLowBattery ? 'animate-pulse bg-red-400' : ''}"
								style="background-color: {isLowBattery ? '' : cls.hex}"
							></span>
							{cls.label}
						</span>
					</div>

					<!-- Top-right: battery + earnings -->
					<div class="absolute top-3 right-3 flex flex-col items-end gap-2">
						<!-- Battery -->
						<div
							class="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 backdrop-blur-sm"
						>
							<div class="flex gap-[2px]">
								{#each Array(4) as _, bIndex}
									<div
										class="h-2 w-2 rounded-[1px] transition-all duration-300"
										style="background-color: {bIndex < segments
											? getBatteryColor(agent.batteryLevel)
											: 'rgba(255,255,255,0.1)'};"
									></div>
								{/each}
							</div>
							<span
								class="text-[9px] font-bold {isLowBattery
									? 'animate-pulse text-red-400'
									: 'text-zinc-400'}"
							>
								{agent.batteryLevel}%
							</span>
						</div>

						<!-- Earnings rate -->
						<div
							class="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 backdrop-blur-sm"
						>
							<img src="./coinpng.png" class="size-4" alt="coins" />
							<span class="text-[10px] font-black text-white">
								{Number(agent.currentPoints.toFixed(0)).toLocaleString()}
							</span>
							<span class="text-[8px] text-zinc-500">/h</span>
						</div>
					</div>

					<!-- Bottom overlay: agent name + meta -->
					<div class="absolute right-0 bottom-0 left-0 px-4 pb-3">
						<h3 class="text-xl font-black tracking-wide text-white uppercase drop-shadow-lg">
							{agent.name}
						</h3>
						<div class="flex items-center gap-2 text-[9px] font-medium text-zinc-400 uppercase">
							<Clock class="size-3" />
							<span>{agent.duration_hr}h runtime</span>
							<span class="text-zinc-700">•</span>
							<TrendingUp class="size-3" />
							<span>+{Math.round(agent.currentPoints / 12)}/h {TOKEN}</span>
						</div>
					</div>
				</div>
				<!-- ── END HERO ── -->

				<!-- ── BOTTOM ACTION BAR ── -->
				<div
					class="flex items-center justify-between px-4 py-3 transition-colors
            {isUpgrading ? 'bg-zinc-900' : 'bg-zinc-900/60 group-hover:bg-zinc-900/80'}"
				>
					<span class="text-[9px] font-black tracking-widest text-zinc-500 uppercase">
						Level {agent.level ?? 1}
					</span>

					<div
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all
              {isUpgrading ? 'bg-zinc-800' : 'bg-zinc-800/50 group-hover:bg-zinc-800'}"
					>
						<ArrowBigUpDash
							class="size-4 transition-all"
							style="color: {isUpgrading ? cls.hex : 'rgb(82 82 91)'}"
						/>
						<span
							class="text-[9px] font-black tracking-wider uppercase"
							style="color: {isUpgrading ? cls.hex : 'rgb(113 113 122)'}"
						>
							{isUpgrading ? 'Hide' : 'Upgrade'}
						</span>
					</div>
				</div>

				<!-- ── UPGRADE PANEL ── -->
				{#if isUpgrading}
					<div
						transition:slide={{ duration: 200 }}
						class="px-4 pb-4 {cls.accent} border-t border-zinc-800/50"
					>
						<!-- Before / After -->
						<div
							class="mt-4 flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl"
						>
							<div class="flex flex-col">
								<span class="text-[8px] font-bold text-zinc-600 uppercase">Current</span>
								<span class="flex items-center gap-1 text-sm font-bold text-white">
									<img src="./coinpng.png" class="size-6" alt="coins" />
									{agent.currentPoints.toFixed(0)}
									<span class="text-[9px] font-normal text-gray-400">/h</span>
								</span>
							</div>
							<ChevronRight class="size-4 shrink-0" style="color: {cls.hex}" />
							<div class="flex flex-col items-end">
								<span class="text-[8px] font-bold uppercase" style="color: {cls.hex}"
									>After Upgrade</span
								>
								<span class="flex items-center gap-1 text-sm font-bold text-white">
									<img src="./coinpng.png" class="size-6" alt="coins" />
									{Math.floor(agent.currentPoints * UPGRADE_MULTIPLIER).toFixed(0)}
									<span class="text-[9px] font-normal text-gray-400">/h</span>
								</span>
							</div>
						</div>

						<!-- Error banner -->
						{#if hasError}
							<div
								class="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
							>
								<svg class="size-3.5 shrink-0 text-red-400" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
									/>
								</svg>
								<span class="text-[10px] font-bold text-red-400">{errorMessage}</span>
							</div>
						{/if}

						<!-- Upgrade button -->
						<!-- svelte-ignore node_invalid_placement_ssr -->
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleUpgade(agent);
							}}
							disabled={isLoading}
							class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-3 text-[10px] font-black text-zinc-950 uppercase shadow-lg shadow-white/5 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
						>
							{#if isLoading}
								<svg class="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									/>
								</svg>
								Upgrading...
							{:else}
								<img src="./coinpng.png" class="size-6" alt="coins" />
								<span class="text-sm font-bold text-black">
									{Math.floor(
										agent.currentPoints * AGENT_UPGRADE_COST_BASE_MULTIPLIER * (agent.level ?? 1)
									).toLocaleString(undefined, { maximumFractionDigits: 0 })}
								</span>
								<span class="text-[9px] font-normal text-zinc-500">{TOKEN}</span>
							{/if}
						</button>
					</div>
				{/if}
			</button>
		{/each}
	</main>
</div>
