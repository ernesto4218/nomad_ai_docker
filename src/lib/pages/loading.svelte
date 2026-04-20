<script lang="ts">
	import { Loader2, CheckCircle } from '@lucide/svelte';

	let { onDone }: { onDone: () => void } = $props();

	const steps = [
		{ label: 'Loading your data' },
		{ label: 'Checking location' },
		{ label: 'Preparing agents' }
	];

	let currentStep = $state(0);

	$effect(() => {
		const interval = setInterval(() => {
			if (currentStep < steps.length - 1) {
				currentStep++;
			} else {
				clearInterval(interval);
				onDone(); // 👈 notify parent animation is done
			}
		}, 900);

		return () => clearInterval(interval);
	});
</script>

<div class="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6">
	<div class="w-full max-w-sm space-y-4">
		<div class="space-y-2 text-center">
			<div
				class="mx-auto flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900"
			>
				{#if currentStep === steps.length - 1}
					<CheckCircle class="size-7 text-emerald-500" />
				{:else}
					<Loader2 class="size-7 animate-spin text-emerald-500" />
				{/if}
			</div>
			<h1 class="text-sm font-bold text-white">Initializing</h1>
			<p class="text-xs text-zinc-500">
				{steps[currentStep].label}...
			</p>
		</div>

		<div class="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
			{#each steps as step, i}
				{#if i !== 0}
					<div class="h-px bg-zinc-800"></div>
				{/if}
				<div class="flex items-center gap-3">
					{#if i < currentStep}
						<div class="size-1.5 rounded-full bg-emerald-500"></div>
						<p class="text-xs text-emerald-500">{step.label}</p>
					{:else if i === currentStep}
						<div class="size-1.5 animate-pulse rounded-full bg-emerald-500"></div>
						<p class="text-xs text-zinc-400">{step.label}</p>
					{:else}
						<div class="size-1.5 rounded-full bg-zinc-700"></div>
						<p class="text-xs text-zinc-600">{step.label}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
