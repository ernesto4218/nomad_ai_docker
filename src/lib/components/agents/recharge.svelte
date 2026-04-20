<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		BatteryWarning,
		AlertTriangle,
		Cpu,
		ShieldAlert,
		PlugZap,
		PowerOff,
		Loader2,
		CheckCircle2
	} from '@lucide/svelte';
	import { Button } from '../ui/button';
	import { fly, fade } from 'svelte/transition';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { Agent } from '$lib/interface';
	import { agents } from '$lib/stores/agents';

	// Import config for class labels and colors
	import { MOCK_CLASSES } from '$lib/components/agents/config';

	interface Props {
		agent: Agent | null;
		onClose: () => void;
		onPointsUpdate: (userAgents: any[]) => void;
	}

	let { agent, onClose, onPointsUpdate }: Props = $props();

	let isCharging = $state(false);
	let chargeSuccess = $state(false);
	let errorMessage = $state<string | null>(null);
	let diagnosticsComplete = $state(false);

	const batteryProgress = tweened(0, { duration: 800, easing: cubicOut });
	let visibleSteps = $state(0);

	const diagnosticSteps = [
		'Connection to unit lost...',
		'Running remote diagnostics...',
		'ERR: Primary thermal core depleted',
		'Deployment suspended.',
		'Awaiting manual power restore.'
	];

	// Helper to get class styling
	const getCls = (id: string | undefined) =>
		MOCK_CLASSES?.find((c) => c.id === id) || { hex: '#10b981', label: id || 'UNKNOWN' };

	$effect(() => {
		if (agent) {
			runFailureDiagnostics();
		}
	});

	async function sleep(ms: number) {
		return new Promise((r) => setTimeout(r, ms));
	}

	async function runFailureDiagnostics() {
		if (!agent) return;
		batteryProgress.set(agent.batteryLevel || 0, { duration: 0 });
		visibleSteps = 0;
		diagnosticsComplete = false;
		isCharging = false;
		chargeSuccess = false;

		for (let i = 1; i <= diagnosticSteps.length; i++) {
			await sleep(500);
			visibleSteps = i;
		}

		await sleep(1000);
		diagnosticsComplete = true;
	}

	async function handleConfirmCharge() {
		if (!agent) return;
		isCharging = true;
		errorMessage = null;

		try {
			const response = await fetch('/API/POST/recharge', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					agentid: agent.id
				})
			});

			if (!response.ok) throw new Error('Deployment failed');

			const result = await response.json();

			//@ts-ignore
			if (result.success) {
				await batteryProgress.set(100, { duration: 1500, easing: cubicOut });

				chargeSuccess = true;
				isCharging = false;

				await sleep(1500);

				//@ts-ignore
				$agents = [...result.userAgents];
				//@ts-ignore
				onPointsUpdate(result.userAgents);
				onClose();
			}
		} catch (err: any) {
			isCharging = false;
			chargeSuccess = false;
			errorMessage = err.message;
			batteryProgress.set(agent.batteryLevel || 0);
		}
	}
</script>

<Dialog.Root
	open={!!agent}
	onOpenChange={(v) => {
		if (!v) onClose();
	}}
>
	<Dialog.Content
		class="max-w-[90%] overflow-hidden rounded-2xl border bg-zinc-950 p-0 shadow-2xl transition-colors duration-500
           {chargeSuccess
			? 'border-emerald-500/50 shadow-emerald-900/30'
			: 'border-red-900/60 shadow-red-900/20'}"
	>
		{#if agent}
			{@const cls = getCls(agent.classId)}

			<div
				class="relative z-10 flex items-center justify-between border-b px-4 py-3 transition-colors duration-500
                {chargeSuccess
					? 'border-emerald-900/40 bg-emerald-500/5'
					: 'border-red-900/40 bg-red-500/5'}"
			>
				<div
					class="flex items-center gap-2 transition-colors duration-500
                    {chargeSuccess ? 'text-emerald-400' : 'text-red-500'}"
				>
					{#if chargeSuccess}
						<CheckCircle2 class="size-4" />
					{:else}
						<AlertTriangle class="size-4 animate-pulse" />
					{/if}
					<span class="text-[10px] font-bold tracking-[0.2em] uppercase">
						{chargeSuccess ? 'Ready for Deployment' : 'Deployment Halted'}
					</span>
				</div>

				<div
					class="transition-colors duration-500 {chargeSuccess
						? 'text-emerald-500'
						: 'text-red-500'}"
				>
					<BatteryWarning class="size-4" />
				</div>
			</div>

			<div
				class="relative w-full overflow-hidden border-b border-zinc-800/40 bg-zinc-900"
				style="height: 220px;"
			>
				<img
					src={agent.avatar}
					alt={agent.name}
					class="absolute inset-0 h-full w-full object-contain object-top transition-all duration-700
            {chargeSuccess
						? 'scale-105 opacity-100'
						: isCharging
							? 'opacity-80'
							: 'opacity-40 grayscale'}"
				/>

				{#if !chargeSuccess && !isCharging}
					<div
						class="absolute inset-0 flex items-center justify-center bg-red-950/40 backdrop-blur-[2px] transition-all duration-500"
					>
						<PowerOff class="size-16 animate-pulse text-red-500/60" />
					</div>
				{/if}
				{#if isCharging}
					<div
						class="absolute inset-0 flex items-center justify-center bg-yellow-950/20 backdrop-blur-[1px] transition-all duration-500"
					>
						<Loader2 class="size-12 animate-spin text-yellow-500/80" />
					</div>
				{/if}

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
							class="size-1.5 rounded-full {chargeSuccess
								? 'bg-emerald-400'
								: isCharging
									? 'animate-pulse bg-yellow-400'
									: 'animate-pulse bg-red-400'}"
						></span>
						{cls.label}
					</span>
				</div>

				<div class="absolute right-0 bottom-0 left-0 px-5 pb-4">
					<h3 class="text-xl font-black tracking-wide text-white uppercase drop-shadow-lg">
						{agent.name}
					</h3>
					<div class="mt-1 flex items-center gap-2">
						<span
							class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors duration-500
                     {chargeSuccess
								? 'bg-emerald-500/20 text-emerald-400'
								: isCharging
									? 'bg-yellow-500/20 text-yellow-500'
									: 'bg-red-500/20 text-red-500'}"
						>
							{chargeSuccess ? 'ONLINE' : isCharging ? 'CHARGING' : 'OFFLINE'}
						</span>
					</div>
				</div>
			</div>
			<div class="space-y-4 px-6 pt-4 pb-6">
				{#if errorMessage}
					<div
						in:fade
						class="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400"
					>
						<ShieldAlert class="size-5 shrink-0" />
						<p class="text-xs font-medium">{errorMessage}</p>
					</div>
				{/if}

				<div
					class="rounded-2xl border bg-zinc-900/40 p-5 transition-colors duration-500
                    {chargeSuccess ? 'border-emerald-900/30' : 'border-red-900/30'}"
				>
					<div class="mb-4 flex items-end justify-between">
						<div>
							<p class="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
								Core Energy
							</p>
							<p
								class="text-2xl font-black transition-colors duration-500
                        {chargeSuccess
									? 'text-emerald-400'
									: isCharging
										? 'text-yellow-500'
										: 'text-red-500'}"
							>
								{Math.round($batteryProgress)}%
							</p>
						</div>
						<div class="flex flex-col items-end">
							<span class="font-mono text-[10px] text-zinc-500">STATUS</span>
							<span
								class="text-[10px] font-bold uppercase transition-colors duration-500
                           {chargeSuccess
									? 'text-emerald-400'
									: isCharging
										? 'text-yellow-500'
										: 'text-red-500'}"
							>
								{#if chargeSuccess}Optimal{:else if isCharging}Recharging...{:else}Depleted{/if}
							</span>
						</div>
					</div>

					<div class="flex h-3 gap-1">
						{#each Array(10) as _, i}
							<div
								class="h-full flex-1 rounded-sm transition-all duration-300"
								style="
        background: {$batteryProgress > i * 10
									? chargeSuccess
										? 'linear-gradient(to bottom, #10b981, #059669)' // Green when done
										: 'linear-gradient(to bottom, #facc15, #ca8a04)' // Yellow while filling
									: '#18181b'};
        box-shadow: {$batteryProgress > i * 10
									? chargeSuccess
										? '0 0 10px #10b98140'
										: isCharging
											? 'none'
											: '0 0 8px #ef444440'
									: 'none'};
        opacity: {!isCharging && !chargeSuccess && $batteryProgress <= 10 && i === 0 ? '0.5' : '1'};
        animation: {!isCharging && !chargeSuccess && $batteryProgress <= 10 && i === 0
									? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
									: 'none'};
      "
							></div>
						{/each}
					</div>

					<div class="mt-4 h-[90px] space-y-1.5 overflow-hidden">
						{#if chargeSuccess}
							<div
								in:fly={{ y: 10 }}
								class="flex items-center gap-2 font-mono text-[9px] text-emerald-400"
							>
								<CheckCircle2 class="size-3 text-emerald-500" />
								Power link stable. All cells energized.
							</div>
							<div
								in:fly={{ y: 10, delay: 100 }}
								class="flex items-center gap-2 font-mono text-[9px] text-emerald-500/80"
							>
								<span class="text-emerald-600">›</span>
								Resuming primary deployment directive.
							</div>
						{:else if isCharging}
							<div in:fade class="flex items-center gap-2 font-mono text-[9px] text-yellow-500">
								<span class="animate-spin text-yellow-500">⟳</span>
								Restoring power link...
							</div>
						{:else}
							{#each diagnosticSteps.slice(0, visibleSteps) as step, i}
								<div
									in:fly={{ x: -5, duration: 200 }}
									class="flex items-center gap-2 font-mono text-[9px] {i >= 2
										? 'text-red-400/80'
										: 'text-zinc-500'}"
								>
									<span class={i >= 2 ? 'text-red-500' : 'text-zinc-500'}>›</span>
									{step}
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<Button
					onclick={handleConfirmCharge}
					disabled={!diagnosticsComplete || isCharging || chargeSuccess}
					class="group relative h-14 w-full overflow-hidden rounded-xl border-none text-xs font-semibold uppercase transition-all duration-500
                 {chargeSuccess
						? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
						: diagnosticsComplete && !isCharging
							? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:bg-red-500'
							: 'bg-zinc-900 text-zinc-600'}"
				>
					{#if chargeSuccess}
						<div class="flex items-center gap-2">Initializing...</div>
					{:else if isCharging}
						<div class="flex items-center gap-2 text-yellow-500">
							<Loader2 class="size-4 animate-spin" /> Energizing Core...
						</div>
					{:else if diagnosticsComplete && !isCharging}
						<div class="flex items-center gap-2">
							<PlugZap class="size-4" /> Recharge to Resume
						</div>
					{:else}
						<span class="animate-pulse">Analyzing Failure...</span>
					{/if}

					{#if diagnosticsComplete && !isCharging && !chargeSuccess}
						<div
							class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
						></div>
					{/if}
				</Button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Custom glows for text */
	:global(.text-red-500) {
		text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
	}
	:global(.text-yellow-500) {
		text-shadow: 0 0 8px rgba(234, 179, 8, 0.3);
	}
	:global(.text-emerald-400) {
		text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
	}
</style>
