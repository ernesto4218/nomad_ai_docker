<script lang="ts">
	import { pageView } from '$lib/stores/pageView';
	import {
		House,
		Users,
		ListTodo,
		CircleStar,
		Droplets,
		Bot,
		CircleFadingArrowUp
	} from '@lucide/svelte';

	// ─── Navigation Items ─────────────────────────────────────────────────────────
	const NAV_ITEMS = [
		{ view: 'home', label: 'Home', icon: House },
		{ view: 'upgrades', label: 'Upgrades', icon: CircleFadingArrowUp },
		{ view: 'tasks', label: 'Tasks', icon: ListTodo },
		{ view: 'club', label: 'Clubs', icon: CircleStar },
		{ view: 'pool', label: 'Pool', icon: Droplets }
	];
</script>

<footer
	class="absolute bottom-0 flex w-full flex-row items-center justify-around
         border-t border-zinc-800 bg-zinc-900/60 px-2 py-3 backdrop-blur-xs"
>
	{#each NAV_ITEMS as { view, label, icon: Icon }}
		{@const isActive = $pageView === view}
		<button
			onclick={() => ($pageView = view)}
			class="relative flex flex-col items-center gap-1 rounded-xl px-3 py-1 transition-all duration-200
             {isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300 active:scale-95'}"
		>
			<!-- Active indicator pill -->
			{#if isActive}
				<span class="absolute -top-1 h-0.5 w-6 rounded-full bg-blue-400"></span>
			{/if}

			<div class="rounded-lg p-1 transition-colors duration-200 {isActive ? 'bg-zinc-800' : ''}">
				<svelte:component
					this={Icon}
					class="size-5 transition-all duration-200 {isActive ? 'text-blue-400' : ''}"
					strokeWidth={isActive ? 2.5 : 2}
				/>
			</div>

			<span class="text-[11px] font-medium transition-colors duration-200">{label}</span>
		</button>
	{/each}
</footer>
