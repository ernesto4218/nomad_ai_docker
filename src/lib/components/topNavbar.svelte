<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import { Wallet } from '@lucide/svelte';
	import { pageView } from '$lib/stores/pageView';
	import { page } from '$app/state';
	import { userBalance } from '$lib/stores/balance';
	import { TOKEN } from '$lib/constants';
	const user = page.data.user;
	$userBalance = page.data.balance;
</script>

<header
	class="absolute top-5 left-1/2 z-10 flex w-[95%] -translate-x-1/2 flex-row items-center justify-around gap-2
         rounded-xl bg-zinc-900/60 px-2 py-3 backdrop-blur-xs"
>
	<!-- Avatar -->
	<Avatar.Root class="size-11 shrink-0 rounded-full ring-2 ring-zinc-700">
		<Avatar.Image src={user.photoUrl} alt="@{user.username}" />
		<Avatar.Fallback class="rounded-xl bg-zinc-800 text-sm font-semibold text-white">
			{user.firstName?.charAt(0).toUpperCase()}
		</Avatar.Fallback>
	</Avatar.Root>

	<!-- User Info -->
	<div class="flex min-w-0 flex-1 flex-col">
		<p class="truncate text-sm font-semibold text-white">
			{user.firstName}
		</p>
		<p class="text-xs text-zinc-500">#{user.userId}</p>
	</div>

	<!-- Right: Balance + Wallet -->
	<div class="flex shrink-0 flex-row items-center gap-4">
		<div
			class="flex cursor-default items-center gap-1.5 rounded-lg transition-colors hover:bg-zinc-700"
		>
			<img src="./coinpng.png" class="size-10" />
			<span class="text-sm font-semibold text-white tabular-nums">
				{$userBalance.toLocaleString(undefined, {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}) || 0}
				{TOKEN}
			</span>
		</div>

		<Button
			onclick={() => {
				$pageView = 'wallet';
			}}
			variant="outline"
			size="icon"
			aria-label="Wallet"
			class="size-9 shrink-0 rounded-lg border-zinc-700 bg-zinc-800 transition-all 
             hover:border-zinc-600 hover:bg-zinc-700 active:scale-95"
		>
			<Wallet strokeWidth={2.5} class="size-4 text-blue-400" />
		</Button>
	</div>
</header>
