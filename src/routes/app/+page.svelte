<script lang="ts">
	import { page } from '$app/state';
	import BottomNavbar from '$lib/components/bottomNavbar.svelte';
	import TopNavbar from '$lib/components/topNavbar.svelte';
	import Agents from '$lib/pages/agents.svelte';
	import Allowlocation from '$lib/pages/allowlocation.svelte';
	import Home from '$lib/pages/home.svelte';
	import Loading from '$lib/pages/loading.svelte';
	import Tasks from '$lib/pages/tasks.svelte';
	import Upgrades from '$lib/pages/upgrades.svelte';
	import { agents, maxAgentDeployed } from '$lib/stores/agents';
	import { pageView } from '$lib/stores/pageView';
	import { CENTER_POINT } from '$lib/stores/variables';

	let animationDone = $state(false);

	$effect(() => {
		if (!animationDone) return;

		if (!page.data.userMap?.locked_lat || !page.data.userMap?.locked_lng) {
			console.log('no locked location');
			$pageView = 'allowlocation';
		} else {
			$CENTER_POINT = [page.data.userMap.locked_lng, page.data.userMap.locked_lat];
			$pageView = 'home';
		}
	});

	console.log('Page Data: ', page.data.userMap);

	$agents = page.data.agents;
	$maxAgentDeployed = page.data.maxAgentDeployed;
	const NAVBAR_PAGES = ['home', 'upgrades', 'tasks'];
</script>

{#if $pageView === 'loading'}
	<Loading onDone={() => (animationDone = true)} />
{:else}
	{#if NAVBAR_PAGES.includes($pageView)}
		<TopNavbar />
	{/if}

	{#if $pageView === 'home'}
		<Home />
	{:else if $pageView === 'upgrades'}
		<Upgrades />
	{:else if $pageView === 'tasks'}
		<Tasks />
	{:else if $pageView === 'allowlocation'}
		<Allowlocation />
	{/if}

	{#if NAVBAR_PAGES.includes($pageView)}
		<BottomNavbar />
	{/if}
{/if}
