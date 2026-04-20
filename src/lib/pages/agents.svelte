<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		Zap,
		Battery,
		MapPin,
		Database,
		LayoutGrid,
		Settings,
		ChevronRight,
		Clock,
		Bot,
		Cpu
	} from '@lucide/svelte';

	// Svelte 5 State
	let agents = $state([
		{
			id: 1,
			name: 'Bleep-Bop',
			status: 'Roaming',
			scanRate: 840,
			location: 'Sector 7-G',
			battery: 82,
			harvested: '1.2 GB',
			uptime: '10h',
			level: 5
		}
	]);

	function upgrade(id: number) {
		const agent = agents.find((a) => a.id === id);
		if (agent) {
			agent.level++;
			agent.scanRate = Math.round(agent.scanRate * 1.12);
		}
	}
</script>

<div
	class="flex h-screen w-full flex-col overflow-hidden bg-[#08090a] px-5 pt-10 font-sans text-zinc-100 selection:bg-blue-500/30"
>
	<header class="flex items-center justify-between pt-15 pb-6">
		<div class="space-y-1">
			<h1 class="text-sm font-bold tracking-tight text-white">My Agents</h1>
			<div class="flex items-center gap-2">
				<span class="flex h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
				<p class="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
					{agents.filter((a) => a.status === 'Roaming').length} Bots Active
				</p>
			</div>
		</div>
		<Button class="flex flex-row items-center gap-1 rounded-xl  bg-blue-600 p-5 text-xs text-white">
			Buy Agents

			<Bot size={20} />
		</Button>
	</header>

	<main class="flex-1 space-y-4 overflow-y-auto pb-32">
		{#each agents as agent (agent.id)}
			<div
				class="group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3 backdrop-blur-sm transition-all hover:border-blue-500/30 hover:bg-zinc-900/60"
			>
				<div class="mb-5 flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div
							class="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-600/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
						>
							<div class="flex gap-1">
								<span
									class="h-1.5 w-1.5 rounded-full bg-blue-400 {agent.status === 'Roaming'
										? 'animate-bounce'
										: ''}"
								></span>
								<span
									class="h-1.5 w-1.5 rounded-full bg-blue-400 {agent.status === 'Roaming'
										? 'animate-bounce [animation-delay:0.2s]'
										: ''}"
								></span>
							</div>
							<div
								class="absolute -top-1 left-1/2 h-2 w-[2px] -translate-x-1/2 bg-blue-500/40"
							></div>
						</div>

						<div>
							<h2 class="text-sm font-bold tracking-wide text-zinc-200">{agent.name}</h2>
							<div class="mt-1 flex items-center gap-2">
								<span
									class="rounded-md bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-blue-400 uppercase"
									>Lvl {agent.level}</span
								>
								<span class="text-[9px] font-bold tracking-tighter text-zinc-500 uppercase"
									>{agent.status}</span
								>
							</div>
						</div>
					</div>

					<div class="flex flex-col items-end gap-1">
						<div class="flex items-center gap-1 text-zinc-500">
							<MapPin size={10} />
							<span class="font-mono text-[9px]">{agent.location}</span>
						</div>
					</div>
				</div>

				<div class="mb-5 grid grid-cols-3 gap-2">
					<div class="rounded-xl border border-zinc-800/30 bg-black/20 p-2.5">
						<span class="mb-1 block text-[8px] font-black tracking-widest text-zinc-600 uppercase"
							>Scan</span
						>
						<p class="font-mono text-xs text-blue-100">{agent.scanRate}</p>
					</div>
					<div class="rounded-xl border border-zinc-800/30 bg-black/20 p-2.5">
						<span class="mb-1 block text-[8px] font-black tracking-widest text-zinc-600 uppercase"
							>Data</span
						>
						<p class="font-mono text-xs text-blue-100">{agent.harvested}</p>
					</div>
					<div class="rounded-xl border border-zinc-800/30 bg-black/20 p-2.5">
						<span class="mb-1 block text-[8px] font-black tracking-widest text-zinc-600 uppercase"
							>Time</span
						>
						<p class="font-mono text-xs text-blue-100">{agent.uptime}</p>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between px-1">
						<div class="flex w-[150px] items-center gap-2">
							<div class="relative">
								<Battery size={12} class={agent.battery < 20 ? 'text-red-500' : 'text-blue-400'} />
								{#if agent.battery < 20}
									<span class="absolute -top-1 -right-1 flex h-2 w-2">
										<span
											class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
										></span>
										<span class="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
									</span>
								{/if}
							</div>
							<span
								class="font-mono text-[10px] font-bold {agent.battery < 20
									? 'text-red-500'
									: 'text-zinc-400'}"
							>
								{agent.battery}% ENERGY
							</span>
						</div>

						<div class="h-1 w-full overflow-hidden rounded-full bg-zinc-800/80">
							<div
								class="h-full transition-all duration-1000 {agent.battery < 20
									? 'bg-red-500'
									: 'bg-blue-500'}"
								style="width: {agent.battery}%"
							></div>
						</div>
					</div>

					<div class="flex gap-2">
						<button
							onclick={() => {
								/* add recharge logic */
							}}
							class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 py-2.5 text-[10px] font-black tracking-widest text-blue-400 uppercase transition-all hover:bg-blue-500/10 active:scale-95"
						>
							<Zap size={12} fill="currentColor" />
							Recharge
						</button>

						<button
							onclick={() => upgrade(agent.id)}
							class="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-95"
						>
							<ChevronRight size={14} strokeWidth={3} />
							Power Up
						</button>
					</div>
				</div>
			</div>
		{/each}
	</main>
</div>

<style>
	main::-webkit-scrollbar {
		display: none;
	}
	main {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Subtle float animation for the robot card */
	@keyframes float {
		0% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-3px);
		}
		100% {
			transform: translateY(0px);
		}
	}

	.group:hover {
		animation: float 3s ease-in-out infinite;
	}
</style>
