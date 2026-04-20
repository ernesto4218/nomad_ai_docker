<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		MapPin,
		Cpu,
		Trophy,
		Signal,
		Database,
		Navigation,
		CheckCheck,
		Zap,
		AlertCircle,
		Coins,
		Calendar1
	} from '@lucide/svelte';
	import { Button } from '../ui/button';
	import { fly, fade, scale } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { Agent, DeployResponse } from '$lib/interface';
	import { userBalance } from '$lib/stores/balance';
	import { TOKEN } from '$lib/constants';
	import { agents } from '$lib/stores/agents';

	// Imported to map the hero styles (glow, colors, labels)
	import { MOCK_CLASSES } from '$lib/components/agents/config';

	interface Props {
		queue: Agent[];
		onComplete: (agent: Agent) => void;
		onPointsUpdate: (userAgents: any[]) => void;
	}

	let { queue = $bindable(), onComplete, onPointsUpdate }: Props = $props();

	let isOpen = $derived(queue.length > 0);
	let currentAgent = $derived(queue.length > 0 ? queue[0] : null);
	let deploying = $state(false);
	let errorMessage = $state<string | null>(null);

	const progress = tweened(0, { duration: 1800, easing: cubicOut });
	let visibleLines = $state(0);
	let showReward = $state(false);

	const intelLines = [
		'Perimeter scanned — no anomalies',
		'Resource nodes mapped: 3 active',
		'Signal relay contact confirmed',
		'Extraction route logged',
		'Data packet integrity: 100%'
	];

	// Helper to get class styling (fallback added just in case)
	const getCls = (id: string) =>
		MOCK_CLASSES?.find((c) => c.id === id) || { hex: '#10b981', label: id };

	$effect(() => {
		if (currentAgent) {
			deploying = false; // reset before new agent intro
			runIntro();
		}
	});

	async function sleep(ms: number) {
		return new Promise((r) => setTimeout(r, ms));
	}

	async function runIntro() {
		progress.set(0, { duration: 0 });
		visibleLines = 0;
		showReward = false;

		await sleep(200);
		progress.set(100);

		for (let i = 1; i <= intelLines.length; i++) {
			await sleep((1800 / intelLines.length) * i * 0.9);
			visibleLines = i;
		}

		await sleep(300);
		showReward = true;
	}

	async function handleConfirm(agent: any) {
		deploying = true;
		errorMessage = null;

		try {
			const response = await fetch('/API/POST/redeploy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ agentid: agent.id })
			});

			const result = (await response.json()) as DeployResponse;

			if (!response.ok) {
				// Catch specific server-side errors (like battery level)
				//@ts-ignore
				throw new Error(result.message || 'Deployment failed');
			}

			//@ts-ignore
			if (result.success) {
				deploying = false;
				//@ts-ignore
				$userBalance = result.balance;
				//@ts-ignore
				// $agents = result.userAgents;
				//@ts-ignore
				onPointsUpdate(result.userAgents);
				const finished = queue[0];
				queue = queue.slice(1); // ✅ reassign instead of mutate
				if (finished) onComplete(finished);
			}
		} catch (err: any) {
			deploying = false; // Stop loading state
			errorMessage = err.message; // Set the message to show in UI
			console.error(err);
		}
	}

	function handleClose() {
		if (deploying) return;
		queue = [];
		errorMessage = null;
		progress.set(0, { duration: 0 });
		visibleLines = 0;
		showReward = false;
	}
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(v) => {
		if (!v) handleClose();
	}}
>
	<Dialog.Content
		onInteractOutside={(e) => {
			e.preventDefault();
		}}
		onEscapeKeydown={(e) => {
			e.preventDefault();
		}}
		class="max-w-[90%] overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-950 p-0 shadow-2xl"
	>
		{#if currentAgent}
			{@const cls = getCls(currentAgent.classId)}

			<div
				class="relative z-10 flex items-center justify-between border-b border-zinc-800/60 px-4 py-2.5"
			>
				<div class="flex items-center gap-2">
					<span
						class="relative flex size-2 rounded-full {deploying
							? 'bg-orange-400'
							: 'bg-emerald-400'}"
					>
						<span
							class="absolute inline-flex size-full animate-ping rounded-full opacity-60 {deploying
								? 'bg-orange-400'
								: 'bg-emerald-400'}"
						></span>
					</span>
					<span class="text-[10px] tracking-widest text-zinc-500 uppercase">
						{deploying ? 'Redeploying' : 'Agent Returned'}
					</span>
				</div>
				<div class="flex items-center gap-1.5">
					<Signal class="size-3 {deploying ? 'text-orange-500' : 'text-emerald-500'}" />
					<span class="text-[10px] {deploying ? 'text-orange-500' : 'text-emerald-500'}">
						{deploying ? 'Departing' : 'Online'}
					</span>
				</div>
			</div>

			<div
				class="relative w-full overflow-hidden border-b border-zinc-800/40"
				style="height: 220px;"
			>
				{#key deploying}
					<img
						in:scale={{ duration: 400, start: 1.05 }}
						src={currentAgent.avatar}
						alt={currentAgent.name}
						class="absolute inset-0 h-full w-full object-contain object-top transition-all duration-500 {deploying
							? 'scale-105 opacity-80'
							: 'opacity-100'}"
					/>
				{/key}

				<div
					class="absolute inset-0 opacity-20 mix-blend-color"
					style="background-color: {cls.hex}"
				></div>

				<div
					class="absolute right-0 bottom-0 left-0 h-28"
					style="background: linear-gradient(to bottom, transparent, rgb(9 9 11))"
				></div>

				<div
					class="absolute inset-0"
					style="background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)"
				></div>

				<div class="absolute top-3 left-3 flex items-center gap-2">
					<span
						class="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase backdrop-blur-sm"
						style="color: {cls.hex}"
					>
						<span
							class="size-1.5 rounded-full {deploying ? 'animate-pulse bg-orange-400' : ''}"
							style="background-color: {deploying ? '' : cls.hex}"
						></span>
						{cls.label}
					</span>
				</div>

				{#if !deploying}
					<div
						in:scale={{ duration: 250, delay: 400 }}
						class="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
					>
						<CheckCheck class="size-3.5 text-zinc-950" />
					</div>
				{/if}

				<div class="absolute right-0 bottom-0 left-0 px-5 pb-4">
					<h3 class="text-xl font-black tracking-wide text-white uppercase drop-shadow-lg">
						{currentAgent.name}
					</h3>
					{#if currentAgent.deployedAt}
						<div
							class="mt-1 flex items-center gap-2 text-[9px] font-medium text-zinc-400 uppercase"
						>
							<Calendar1 class="size-3 text-zinc-500" />
							<span>{new Date(currentAgent.deployedAt).toLocaleDateString()}</span>
						</div>
					{/if}
				</div>
			</div>
			<div class="space-y-3 px-5 pt-3 pb-5">
				{#if errorMessage && !deploying}
					<div
						in:fly={{ y: -10, duration: 300 }}
						class="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-center"
					>
						<div class="flex size-10 items-center justify-center rounded-full bg-red-500/10">
							<AlertCircle class="size-6 text-red-500" />
						</div>
						<div>
							<p class="text-xs font-bold tracking-widest text-red-400 uppercase">System Error</p>
							<p class="mt-1 text-sm text-zinc-300">{errorMessage}</p>
						</div>

						<Button
							onclick={() => {
								errorMessage = null;
								const finished = queue[0];
								queue = queue.slice(1); // Remove from the modal's queue
								if (finished) onComplete(finished); // Tell the parent component it's "done"
							}}
							class="mt-2 w-full rounded-xl bg-red-500/10 py-5 text-xs font-semibold text-red-500 uppercase transition-all hover:bg-red-500/20"
						>
							Dismiss
						</Button>
					</div>
				{:else if deploying}
					<div
						in:scale={{ duration: 300, start: 0.95 }}
						class="rounded-xl border border-orange-500/20 bg-zinc-900/50 p-6 text-center"
					>
						<div
							class="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-orange-500/10"
						>
							<Navigation class="size-5 animate-pulse text-orange-400" />
						</div>
						<p class="text-sm font-semibold text-white">Redeploying {currentAgent.name}</p>
						<div class="mt-4 flex justify-center gap-1.5">
							<span
								class="size-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.3s]"
							></span>
							<span
								class="size-1.5 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.15s]"
							></span>
							<span class="size-1.5 animate-bounce rounded-full bg-orange-500"></span>
						</div>
						<p class="mt-3 animate-pulse text-[10px] tracking-widest text-orange-500/60 uppercase">
							Routing to next objective...
						</p>
					</div>

					<div
						in:fly={{ y: 6, duration: 300 }}
						class="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3"
					>
						<div class="flex items-center gap-2">
							<img src="./coinpng.png" class="size-10" alt="coin" />
							<span class="text-xs text-zinc-400">Added to your account</span>
						</div>
						<span class="text-sm font-bold text-white">+{currentAgent.currentPoints} {TOKEN}</span>
					</div>
				{:else}
					<div
						in:fly={{ y: 8, duration: 300 }}
						class="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
					>
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<Database class="size-3.5 text-emerald-400" />
								<span class="text-[10px] tracking-widest text-zinc-400 uppercase">Intel Report</span
								>
							</div>
							<span class="text-[10px] text-emerald-400">{Math.round($progress)}%</span>
						</div>

						<div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
							<div
								class="h-full rounded-full bg-emerald-500 transition-all"
								style="width: {$progress}%"
							></div>
						</div>

						<ul class="mt-3 min-h-[72px] space-y-2">
							{#each intelLines.slice(0, visibleLines) as line}
								<li in:fly={{ y: 5, duration: 250 }} class="flex items-center gap-2">
									<span class="size-1.5 shrink-0 rounded-full bg-emerald-500"></span>
									<span class="text-[10px] text-zinc-500">{line}</span>
								</li>
							{/each}
						</ul>
					</div>

					{#if showReward}
						<div
							in:fly={{ y: 10, duration: 350 }}
							class="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3"
						>
							<div class="flex size-9 shrink-0 items-center justify-center rounded-lg">
								<img src="./coinpng.png" class="size-10" alt="coin" />
							</div>
							<div>
								<p class="text-[10px] tracking-widest text-zinc-500 uppercase">Rewards Secured</p>
								<div class="flex items-baseline gap-1">
									<span class="text-xl font-black text-white">
										+{Math.floor(currentAgent.currentPoints).toLocaleString()}
									</span> <span class="text-[10px] font-bold text-yellow-400">{TOKEN}</span>
								</div>
							</div>
						</div>
					{:else}
						<div
							class="flex items-center gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/20 px-4 py-3"
						>
							<Coins class="size-3.5 text-zinc-700" />
							<span class="text-[10px] tracking-widest text-zinc-700 uppercase"
								>Calculating rewards...</span
							>
						</div>
					{/if}

					<Button
						onclick={() => handleConfirm(currentAgent)}
						disabled={!showReward}
						class="w-full rounded-xl py-6 text-xs font-semibold uppercase transition-all
            {showReward
							? 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400'
							: 'cursor-not-allowed bg-zinc-900 text-zinc-600'}"
					>
						{#if showReward}
							<span in:fade={{ duration: 200 }} class="flex items-center gap-2">
								Confirm & Redeploy <CheckCheck class="size-4" />
							</span>
						{:else}
							<span class="flex animate-pulse items-center gap-2"> Downloading intel... </span>
						{/if}
					</Button>
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>
