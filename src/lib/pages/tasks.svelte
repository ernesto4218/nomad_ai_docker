<script lang="ts">
	import { onMount } from 'svelte';
	import { TOKEN } from '$lib/constants';
	import * as Icons from '@lucide/svelte';
	import {
		Zap,
		ChevronRight,
		CheckCircle2,
		ExternalLink,
		Users,
		Wallet,
		Send,
		Tv,
		CalendarCheck,
		Cpu,
		BirdIcon
	} from '@lucide/svelte';
	import { userBalance } from '$lib/stores/balance';
	import type { DatafromTaskCompelte } from '$lib/interface';

	// 1. Map string names from DB to Lucide Components
	const iconMap: Record<string, any> = {
		Tv,
		CalendarCheck,
		Zap,
		Cpu,
		Send,
		BirdIcon,
		Wallet,
		Users,
		CheckCircle2
	};

	interface Task {
		name: string;
		desc: string;
		reward: number;
		icon: string; // From DB it is a string
		isCompleted?: boolean; // <-- ADDED THIS
	}

	// 2. State management
	let dailyTasks = $state<Task[]>([]);
	let activeTab = $state<'daily' | 'onetime'>('daily');
	let loading = $state(true);
	let processingTasks = $state<Set<string>>(new Set());

	// Static One-time tasks (Hardcoded since these usually aren't dynamic)
	const oneTimeTasks: Task[] = [
		{ name: 'First Agent', desc: 'Deploy your first agent', reward: 500, icon: 'Zap' },
		{ name: 'Join Channel', desc: 'Join official Nomad AI Telegram', reward: 100, icon: 'Send' },
		{ name: 'Follow on X', desc: 'Follow for updates', reward: 150, icon: 'BirdIcon' },
		{ name: 'Connect Wallet', desc: 'Connect your TON or EVM wallet', reward: 100, icon: 'Wallet' },
		{ name: 'Refer a Nomad', desc: 'Invite 3 friends', reward: 1000, icon: 'Users' },
		{
			name: 'Username Sync',
			desc: "Add '🤖 Nomad' to your name",
			reward: 250,
			icon: 'CheckCircle2'
		}
	];

	// 3. Fetch Function
	async function fetchTasks() {
		try {
			const res = await fetch('/API/GET/tasks'); // Path to your GET handler
			const data = await res.json();
			//@ts-ignore
			if (data.success) {
				//@ts-ignore
				dailyTasks = data.tasks;
			}
		} catch (e) {
			console.error('Failed to load tasks', e);
		} finally {
			loading = false;
		}
	}

	async function handleTaskClick(task: Task) {
		if (task.isCompleted || processingTasks.has(task.name)) return;

		// Add to processing state
		processingTasks.add(task.name);
		processingTasks = new Set(processingTasks); // trigger Svelte 5 reactivity

		try {
			const res = await fetch('/API/POST/complete-task', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ taskName: task.name, type: activeTab })
			});

			const data = (await res.json()) as DatafromTaskCompelte;

			if (data.success) {
				// Find the task in our local state and mark it completed
				const taskIndex = dailyTasks.findIndex((t) => t.name === task.name);
				if (taskIndex !== -1) {
					dailyTasks[taskIndex].isCompleted = true;
					// Trigger reactivity for the array
					dailyTasks = [...dailyTasks];
					$userBalance += data.balance;
				}
			} else {
				console.error(data.message);
			}
		} catch (e) {
			console.error('Network error completing task', e);
		} finally {
			// Remove from processing state
			processingTasks.delete(task.name);
			processingTasks = new Set(processingTasks);
		}
	}

	onMount(() => {
		fetchTasks();
	});

	// Derived list based on active tab
	let currentTasks = $derived(activeTab === 'daily' ? dailyTasks : oneTimeTasks);
</script>

<div
	class="flex h-screen w-full flex-col overflow-hidden bg-[#08090a] px-5 pt-10 font-sans text-zinc-100"
>
	<header class="flex flex-col items-center justify-center pt-10 pb-8 text-center">
		<div class="relative mb-4">
			<div class="absolute inset-0 animate-pulse rounded-full bg-blue-500/20 blur-2xl"></div>
			<img src="./coinpng.png" class="relative size-28 object-contain" alt="token" />
		</div>
		<h1 class="text-xl font-black tracking-tight text-white uppercase">Earn More {TOKEN}</h1>
		<p class="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
			System Tasks & Protocols
		</p>
	</header>

	<div class="mb-6 flex gap-2 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-1.5">
		<button
			onclick={() => (activeTab = 'daily')}
			class="flex-1 rounded-xl py-2 text-[10px] font-black tracking-widest uppercase transition-all {activeTab ===
			'daily'
				? 'bg-blue-600 text-white'
				: 'text-zinc-500'}"
		>
			Daily Ops
		</button>
		<button
			onclick={() => (activeTab = 'onetime')}
			class="flex-1 rounded-xl py-2 text-[10px] font-black tracking-widest uppercase transition-all {activeTab ===
			'onetime'
				? 'bg-blue-600 text-white'
				: 'text-zinc-500'}"
		>
			Milestones
		</button>
	</div>

	<main class="flex-1 space-y-3 overflow-y-auto pb-32">
		{#if loading && activeTab === 'daily'}
			<div class="flex flex-col items-center justify-center py-10 opacity-50">
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
				></div>
				<span class="mt-2 text-[10px] font-bold tracking-widest uppercase">Syncing Data...</span>
			</div>
		{:else}
			{#each currentTasks as task}
				<div
					class="group relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40 p-3 backdrop-blur-sm transition-all hover:border-blue-500/30"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-4">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-600/10 text-blue-400"
							>
								<svelte:component this={iconMap[task.icon] || Icons.HelpCircle} size={18} />
							</div>

							<div>
								<h2 class="text-sm font-bold tracking-wide text-zinc-200">{task.name}</h2>
								<p class="text-xs font-medium text-zinc-500">{task.desc}</p>

								<div class="mt-1.5 flex items-center gap-1.5">
									<img src="./coinpng.png" class="size-7" alt="token" />
									<span class="font-mono text-[10px] font-bold text-white"
										>+{task.reward} {TOKEN}</span
									>
								</div>
							</div>
						</div>

						<button
							onclick={() => handleTaskClick(task)}
							disabled={task.isCompleted || processingTasks.has(task.name)}
							class="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 transition-all {task.isCompleted
								? 'cursor-not-allowed text-zinc-600 opacity-50'
								: 'text-zinc-400 hover:bg-blue-600 hover:text-white active:scale-90'}"
						>
							{#if processingTasks.has(task.name)}
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent"
								></div>
							{:else if task.isCompleted}
								<CheckCircle2 size={16} />
							{:else if task.name.includes('Join') || task.name.includes('Follow')}
								<ExternalLink size={14} />
							{:else}
								<ChevronRight size={16} />
							{/if}
						</button>
					</div>
					<div
						class="absolute bottom-0 left-0 h-[1px] w-0 bg-blue-500 transition-all duration-500 group-hover:w-full"
					></div>
				</div>
			{/each}
		{/if}
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
</style>
