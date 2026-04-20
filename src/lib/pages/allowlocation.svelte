<script lang="ts">
	import { pageView } from '$lib/stores/pageView';
	import { MapPin, ShieldCheck, AlertCircle, Loader2, Lock } from '@lucide/svelte';

	let status = $state<'idle' | 'requesting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let coords = $state<{ lat: number; lng: number } | null>(null);
	let attempts = $state(0);

	async function sendLocation(lat: number, lng: number) {
		try {
			const res = await fetch('/API/POST/update-loc', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lat, lng })
			});

			if (!res.ok) throw new Error('Failed to send location');
		} catch (err) {
			console.error('Send location error:', err);
			status = 'error';
			errorMessage = 'Failed to save your location. Please try again.';
		}
	}

	function getLocation() {
		if (status === 'requesting') return;

		status = 'requesting';
		errorMessage = '';

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const lat = position.coords.latitude;
				const lng = position.coords.longitude;

				await sendLocation(lat, lng);

				if (status !== 'error') {
					coords = { lat, lng };
					status = 'success';
					attempts = 0;
				}
			},
			(error) => {
				if (error.code === 2 && attempts < 2) {
					attempts++;
					setTimeout(getLocation, 1500);
					return;
				}

				attempts = 0;
				status = 'error';

				if (error.code === 1)
					errorMessage = 'Location access denied. Please allow it in your browser settings.';
				else if (error.code === 2)
					errorMessage = 'Location unavailable. Please check your device settings.';
				else if (error.code === 3) errorMessage = 'Request timed out. Please try again.';
				else errorMessage = 'Could not get your location. Please try again.';
			},
			{ timeout: 10000, enableHighAccuracy: false, maximumAge: 30000 }
		);
	}
</script>

<div class="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6">
	<div class="w-full max-w-sm space-y-4">
		<div class="space-y-2 text-center">
			<div
				class="mx-auto flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900"
			>
				{#if status === 'success'}
					<ShieldCheck class="size-7 text-emerald-400" />
				{:else if status === 'error'}
					<AlertCircle class="size-7 text-red-400" />
				{:else}
					<Lock class="size-7 text-emerald-500" />
				{/if}
			</div>
			<h1 class="text-sm font-bold text-white">Location Access</h1>
			<p class="text-xs text-zinc-500">We need your location to continue.</p>
		</div>

		{#if status === 'success'}
			<div
				class="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center"
			>
				<p class="text-xs font-bold text-emerald-400">Location Confirmed</p>
				<div class="flex justify-center gap-3 font-mono text-xs text-zinc-400">
					<span>LAT {coords?.lat.toFixed(4)}</span>
					<span>LNG {coords?.lng.toFixed(4)}</span>
				</div>
			</div>
			<button
				onclick={() => {
					$pageView = 'home';
				}}
				class="w-full rounded-xl bg-white py-3 text-xs font-bold text-black"
			>
				Continue
			</button>
		{:else if status === 'error'}
			<div class="rounded-xl border border-red-900/30 bg-red-950/20 p-4">
				<p class="text-xs text-red-400">{errorMessage}</p>
			</div>
			<button
				onclick={getLocation}
				class="w-full rounded-xl bg-zinc-800 py-3 text-xs font-bold text-white hover:bg-zinc-700"
			>
				Try Again
			</button>
		{:else}
			<button
				onclick={getLocation}
				disabled={status === 'requesting'}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
			>
				{#if status === 'requesting'}
					<Loader2 class="size-4 animate-spin" />
					Getting location...
				{:else}
					<MapPin class="size-4" />
					Allow Location
				{/if}
			</button>
		{/if}
	</div>
</div>
