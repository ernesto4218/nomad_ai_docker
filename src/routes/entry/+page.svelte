<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Svelte 5 Runes for state management
	let progress = $state(0);
	let loadingText = $state('Connecting to Rig...');

	// Track our API status
	let authComplete = $state(false);
	let authSuccess = $state(false);

	onMount(() => {
		// Wrap async logic in a function inside onMount
		const validateUser = async () => {
			try {
				//@ts-ignore
				const initData = window.Telegram?.WebApp?.initData ?? '';
				// @ts-ignore - Consider installing @twa-dev/types for proper TS support
				const ref = window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? '';

				console.log('Ref param:', ref);

				// if (!dev) {
				// 	// @ts-ignore
				// 	const platform = window.Telegram?.WebApp?.platform || 'unknown';
				// 	const isMobile = platform === 'android' || platform === 'ios';
				// 	const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				// 		navigator.userAgent
				// 	);

				// 	if (!isMobile && !isMobileUA) {
				// 		goto('/mobile-only');
				// 		return;
				// 	}

				// 	if (!initData) {
				// 		console.error('No initData found');
				// 		loadingText = 'Initialization Error!';
				// 		authComplete = true;
				// 		return;
				// 	}
				// } else {
				// 	console.log('Developer mode');
				// }

				const res = await fetch('/API/POST/validate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ initData, ref })
				});

				if (res.ok) {
					const data = await res.json();
					authSuccess = true;
				} else {
					console.error('Validation failed');
					loadingText = 'Connection Error!';
				}
			} catch (error) {
				console.error('Network error:', error);
				loadingText = 'Network Error!';
			} finally {
				authComplete = true;
			}
		};

		validateUser();
	});

	// Sync the visual progress with the actual API status
	$effect(() => {
		const interval = setInterval(() => {
			if (!authComplete) {
				// While waiting for the API, fake the progress up to a maximum of 85%
				if (progress < 85) {
					progress += Math.floor(Math.random() * 8) + 2;
				}
			} else {
				// API request finished!
				if (authSuccess) {
					// Accelerate to 100%
					progress += 15;

					if (progress >= 100) {
						progress = 100;
						loadingText = 'Ready to Drill!';
						clearInterval(interval);

						// Give the user a tiny delay to actually see "100%" before jumping
						setTimeout(() => {
							window.location.href = '/app';
						}, 300);
					}
				} else {
					// Stop loading if auth failed
					clearInterval(interval);
				}
			}

			// Only update text if we haven't hit an error
			if (progress < 100 && !loadingText.includes('Error')) {
				if (progress > 60) {
					loadingText = 'Preparing Crew...';
				} else if (progress > 30) {
					loadingText = 'Calibrating Equipment...';
				}
			}
		}, 250); // Slightly faster tick rate for smoother perception

		return () => clearInterval(interval);
	});
</script>

Loading..
