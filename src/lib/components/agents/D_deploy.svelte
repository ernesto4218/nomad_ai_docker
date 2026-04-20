<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Cpu, Bot, Zap, Dices } from '@lucide/svelte';
	import { Button } from '../ui/button';
	import { CENTER_POINT } from '$lib/stores/variables';
	import type { DeployResponse } from '$lib/interface';
	import { DEPLOYMENT_COST, MOCK_CLASSES } from './config';
	import { userBalance } from '$lib/stores/balance';
	import { TOKEN } from '$lib/constants';
	import { generateName } from '$lib/helper/namegenerator';
	import { maxAgentDeployed } from '$lib/stores/agents';

	// --- STATE ---
	let isOpen = $state(false);
	let isDeploying = $state(false);
	let agentName = $state('');
	let selectedClass = $state('scout');
	let { onPointsUpdate } = $props();

	let notEnoughBalance = $state(false);
	let maxAgent = $state(false);

	// Derives all data for the chosen class, including its image
	const activeClass = $derived(MOCK_CLASSES.find((c) => c.id === selectedClass)!);
	const selectedAvatar = $derived(activeClass.img);

	// --- NAME GENERATOR ---
	async function generateNameFunc() {
		agentName = generateName();
	}

	async function handleDeploy() {
		if (!agentName.trim()) return;
		const [lng, lat] = $CENTER_POINT;

		notEnoughBalance = false;

		try {
			isDeploying = true;
			const response = await fetch('/API/POST/deploy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					longitude: lng,
					latitude: lat,
					agentName,
					selectedClass,
					selectedAvatar
				})
			});

			if (!response.ok) throw new Error('Deployment failed');

			const result = (await response.json()) as DeployResponse;

			//@ts-ignore
			if (result.success) {
				//@ts-ignore
				onPointsUpdate(result.newAgents);
				//@ts-ignore
				isOpen = false;
				isDeploying = false;
				agentName = '';
				selectedClass = 'scout';
				//@ts-ignore
				$userBalance = result.newBalance;
			} else {
				//@ts-ignore
				if (result.message === 'Not enough balance.') {
					notEnoughBalance = true;
					setTimeout(() => {
						notEnoughBalance = false;
					}, 3000);
					//@ts-ignore
				} else if (result.message === 'Maximum agents reached.') {
					maxAgent = true;
					setTimeout(() => {
						maxAgent = false;
					}, 3000);
				}

				isDeploying = false;
			}
		} catch (err) {
			console.error(err);
			isDeploying = false;
		}
	}
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger>
		<Button
			disabled={$maxAgentDeployed}
			class="absolute bottom-23 left-1/2 flex w-[90%] -translate-x-1/2 items-center justify-between rounded-xl bg-emerald-500 px-5 py-6 text-xs font-medium shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none disabled:hover:bg-gray-400"
		>
			<div class="flex items-center gap-2">
				<Bot class="size-4" />
				Deploy New Agent
			</div>
			<div class="flex items-center gap-1.5 px-2.5 py-1.5">
				<img src="./coinpng.png" class="size-7" alt="coins" />
				<span class="text-sm text-yellow-100">{DEPLOYMENT_COST.toLocaleString()} {TOKEN}</span>
			</div>
		</Button>
	</Dialog.Trigger>

	<Dialog.Content
		class="max-w-[92%] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-0 shadow-2xl"
	>
		{#if isDeploying}
			<div class="flex flex-col items-center justify-center gap-5 px-8 py-14 text-center">
				<div class="relative">
					<div
						class="size-28 animate-spin rounded-full border-2 border-zinc-800 border-t-emerald-400"
					></div>
					<div class="absolute inset-0 flex items-center justify-center">
						<img
							src={selectedAvatar}
							alt="Deploying Avatar"
							class="size-20 rounded-full object-cover shadow-xl shadow-emerald-500/20"
						/>
					</div>
				</div>
				<div class="space-y-1.5">
					<p class="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase">
						Fabricating Agent
					</p>
					<p class="text-[10px] text-zinc-500">
						{agentName} · {activeClass.label} · {DEPLOYMENT_COST.toLocaleString()}
						{TOKEN}
					</p>
				</div>
			</div>
		{:else}
			<div class="flex items-center justify-between border-b border-zinc-800/60 px-6 py-5">
				<div>
					<Dialog.Title class="flex items-center gap-2 text-xs font-medium text-white uppercase">
						<Cpu class="size-3.5 text-emerald-400" />
						Agent Deployment
					</Dialog.Title>
					<Dialog.Description class="mt-0.5 text-xs text-zinc-600">
						Initialize a specialized field unit.
					</Dialog.Description>
				</div>
			</div>

			<div class="max-h-[70vh] space-y-6 overflow-y-auto px-4 py-4">
				<div class="flex justify-center py-2">
					<div
						class="relative rounded-2xl border p-1 {activeClass.accent} {activeClass.glow} shadow-2xl transition-all duration-300"
					>
						<img
							src={selectedAvatar}
							alt={activeClass.label}
							class="h-56 w-56 rounded-2xl object-cover"
						/>
						<div class="absolute inset-x-0 -bottom-3 flex justify-center">
							<span
								class="rounded-full border border-zinc-700/50 bg-zinc-900 px-5 py-2 text-sm font-bold tracking-wide text-white shadow-lg"
							>
								{activeClass.label} Unit
							</span>
						</div>
					</div>
				</div>

				<div class="h-2"></div>

				<div class="space-y-2">
					<label class="block text-[8px] font-bold tracking-wider text-zinc-500 uppercase">
						Agent Class
					</label>
					<div class="grid grid-cols-4 gap-1.5">
						{#each MOCK_CLASSES as cls}
							{@const Icon = cls.icon}
							<button
								onclick={() => (selectedClass = cls.id)}
								class="group flex flex-col items-center justify-center rounded-lg border px-1 py-2 transition-all {selectedClass ===
								cls.id
									? `${cls.accent} ${cls.glow}`
									: 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}"
							>
								<img
									src={cls.img}
									alt={cls.label}
									class="mb-2 size-8 rounded object-cover transition-all {selectedClass !==
										cls.id &&
										'opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0'}"
								/>
								<span
									class="text-[7px] leading-none font-black uppercase {selectedClass === cls.id
										? 'text-white'
										: 'text-zinc-600'}"
								>
									{cls.label}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="space-y-2.5">
					<label class="block text-[9px] font-bold text-zinc-500 uppercase"> Designation </label>
					<div class="flex gap-2">
						<div class="relative flex-1">
							<input
								bind:value={agentName}
								placeholder="e.g. ALPHA-RECON"
								maxlength={20}
								class="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white uppercase focus:border-emerald-500/60 focus:outline-none"
							/>
						</div>
						<button
							type="button"
							onclick={generateNameFunc}
							class="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
							title="Generate Random Name"
						>
							<Dices class="size-5" />
						</button>
					</div>
				</div>

				<div class="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-3">
					<div class="mb-2 flex items-center gap-2">
						<Zap class="size-3 {activeClass.color}" />
						<span class="text-[9px] font-bold tracking-widest text-zinc-400 uppercase"
							>Class Specialties</span
						>
					</div>
					<div class="space-y-2">
						{#each activeClass.specialties as spec}
							<div class="flex items-start gap-2 text-[10px] text-zinc-300">
								<div class="mt-1 size-1 rounded-full bg-zinc-700"></div>
								{spec}
							</div>
						{/each}
					</div>
				</div>

				<div class="space-y-3">
					{#if notEnoughBalance}
						<button
							disabled
							class="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-red-600 py-3 text-xs font-bold text-white transition-all"
						>
							<span>NOT ENOUGH BALANCE</span>
						</button>
					{:else if maxAgent}
						<button
							disabled
							class="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-red-600 py-3 text-xs font-bold text-white transition-all"
						>
							<span>MAXIMUM AGENTS REACHED</span>
						</button>
					{:else}
						<button
							onclick={handleDeploy}
							disabled={!agentName.trim() || isDeploying}
							class="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-25"
						>
							<span>DEPLOY UNIT</span>
							<div class="ml-1 flex items-center gap-1 border-l border-white/20 pl-2">
								<img src="./coinpng.png" class="size-7" alt="cost" />
								<span class="text-sm">{DEPLOYMENT_COST.toLocaleString()} {TOKEN}</span>
							</div>
						</button>
					{/if}
				</div>
			</div>

			<Dialog.Close
				class="block w-full border-t border-zinc-800/50 bg-zinc-900/40 py-4 text-center text-[10px] font-semibold text-zinc-600 uppercase hover:text-zinc-300"
			>
				Abort Sequence
			</Dialog.Close>
		{/if}
	</Dialog.Content>
</Dialog.Root>
