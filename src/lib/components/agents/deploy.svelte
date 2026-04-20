<script>
	import { CENTER_POINT } from '$lib/stores/variables';
	import Button from '../ui/button/button.svelte';

	let { onPointsUpdate } = $props();

	async function deployAgent() {
		const [lng, lat] = $CENTER_POINT;

		const response = await fetch('/API/POST/deploy', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ longitude: lng, latitude: lat })
		});

		const result = await response.json();
		if (result.randomPoints) {
			onPointsUpdate(result.generated_points, result.paths);
		}
	}
</script>

<Button
	onclick={deployAgent}
	class="absolute bottom-23 left-1/2 flex w-[90%] -translate-x-1/2 rounded-lg bg-emerald-500 px-3 py-5 text-xs font-semibold"
>
	Deploy AI Agent
</Button>
