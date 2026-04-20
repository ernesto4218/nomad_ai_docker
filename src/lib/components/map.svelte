<script lang="ts">
	import { CENTER_POINT, MAP_RADIOUS } from '$lib/stores/variables';
	import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import { onMount, onDestroy, tick } from 'svelte';
	import circle from '@turf/circle';
	import { AVATARS, MOCK_CLASSES } from './agents/config';
	import type { Agent } from '$lib/interface';
	import { agents } from '$lib/stores/agents';
	import Agents from '$lib/pages/agents.svelte';
	import Returned from './agents/returned.svelte';
	import { getAgentStyle } from '$lib/helper/agentstyle';
	import Topdisplay from './agents/topdisplay.svelte';
	import DDeploy from './agents/D_deploy.svelte';
	import Recharge from './agents/recharge.svelte';
	import { finishedAgents } from '$lib/stores/finishedAgents';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { pageView } from '$lib/stores/pageView';
	// Props

	// Internal State
	let map = $state<mapboxgl.Map>();
	let mapContainer: HTMLElement;
	let isLoading = $state(true);
	let isMapReady = $state(false);
	const landingMarkers: { [key: string]: mapboxgl.Marker } = {};
	const movingMarkers: Record<string, mapboxgl.Marker> = {};
	const pointMarkers: Record<string, mapboxgl.Marker[]> = {};
	let selectedAgentForRecharge = $state<Agent | null>(null);

	onMount(() => {
		//@ts-ignore
		const webApp = window.Telegram?.WebApp;
		const locationManager = webApp?.LocationManager;

		mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

		if (locationManager) {
			locationManager.init(() => {
				// Check if GPS is enabled on the device hardware level
				if (!locationManager.isLocationAvailable) {
					console.warn('Location services are disabled on device.');
					$pageView = 'allowlocation';
					return;
				}

				// Request the high-accuracy location from Telegram
				//@ts-ignore
				locationManager.getLocation((data) => {
					if (data) {
						// Telegram returns { latitude, longitude, ... }
						const { longitude, latitude } = data;
						$CENTER_POINT = [longitude, latitude];
						initMap([longitude, latitude]);
					} else {
						// User denied permission or error occurred
						console.error('Telegram location access denied.');
						$pageView = 'allowlocation';
					}
				});
			});
		} else {
			// Fallback for browser testing or older Telegram versions
			console.warn('Telegram LocationManager not found, using browser API.');
			handleBrowserFallback();
		}

		// if ('geolocation' in navigator) {
		// 	navigator.geolocation.getCurrentPosition(
		// 		(position) => {
		// 			const { longitude, latitude } = position.coords;
		// 			$CENTER_POINT = [longitude, latitude];
		// 			initMap([longitude, latitude]);
		// 		},
		// 		(error) => {
		// 			console.error('Location error, loading fallback:', error);
		// 			$pageView = 'allowlocation';
		// 		}
		// 	);
		// } else {
		// 	// initMap([-71.06776, 42.35816]);
		// 	$pageView = 'allowlocation';
		// }
	});

	function handleBrowserFallback() {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { longitude, latitude } = position.coords;
					$CENTER_POINT = [longitude, latitude];
					initMap([longitude, latitude]);
				},
				() => {
					$pageView = 'allowlocation';
				}
			);
		} else {
			$pageView = 'allowlocation';
		}
	}

	function initMap(coords: [number, number]) {
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/dark-v11',
			center: coords,
			zoom: 15,
			minZoom: 13,
			maxZoom: 20,
			attributionControl: false
		});

		map.on('load', () => {
			const layers = map?.getStyle().layers;
			if (layers) {
				layers.forEach((layer) => {
					if (layer.type === 'symbol') {
						map?.setLayoutProperty(layer.id, 'visibility', 'none');
					}
				});
			}

			// 1. INITIALIZE ALL SOURCES
			// We create these once so we can update them later with .setData()
			map?.addSource('radius-source', {
				type: 'geojson',
				data: circle(coords, $MAP_RADIOUS, { steps: 64, units: 'meters' })
			});

			map?.addSource('center-point', {
				type: 'geojson',
				data: {
					type: 'Feature',
					geometry: { type: 'Point', coordinates: coords },
					properties: {}
				}
			});

			map?.addSource('route-source', {
				type: 'geojson',
				data: { type: 'FeatureCollection', features: [] }
			});

			// 2. ADD LAYERS
			map?.addLayer({
				id: 'radius-fill',
				type: 'fill',
				source: 'radius-source',
				paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }
			});

			map?.addLayer({
				id: 'radius-stroke',
				type: 'line',
				source: 'radius-source',
				paint: {
					'line-color': '#0096FF',
					'line-width': 2,
					'line-dasharray': [2, 2]
				}
			});

			map?.addLayer({
				id: 'location-dot',
				type: 'circle',
				source: 'center-point',
				paint: {
					'circle-radius': 6,
					'circle-color': '#3b82f6',
					'circle-stroke-width': 2,
					'circle-stroke-color': '#ffffff'
				}
			});

			isLoading = false;
			isMapReady = true;
			loadDatatoMap();
		});
	}

	function resetMapElements() {
		if (!map) return;

		// 1. Remove all Moving Markers
		Object.keys(movingMarkers).forEach((key) => {
			movingMarkers[key].remove();
			delete movingMarkers[key];
		});

		// 2. Remove all Point Markers
		Object.keys(pointMarkers).forEach((key) => {
			pointMarkers[key].forEach((m) => m.remove());
			delete pointMarkers[key];
		});

		// 3. Remove Mapbox Layers and Sources (Routes)
		// We look for any layer starting with 'route-'
		const style = map.getStyle();
		if (style && style.layers) {
			style.layers.forEach((layer) => {
				if (layer.id.startsWith('route-')) {
					map?.removeLayer(layer.id);
				}
			});
		}

		Object.keys(landingMarkers).forEach((key) => {
			landingMarkers[key].remove();
			delete landingMarkers[key];
		});

		// Remove the sources associated with those layers
		const sources = map.getStyle().sources;
		Object.keys(sources).forEach((sourceId) => {
			if (sourceId.startsWith('route-')) {
				map?.removeSource(sourceId);
			}
		});
	}

	function loadDatatoMap() {
		resetMapElements();
		console.log('Agents : ', $agents);
		const currentAgents = $agents as Agent[];
		const currentMarkers: mapboxgl.Marker[] = [];
		const bounds = new mapboxgl.LngLatBounds();

		currentAgents.forEach((agent, agentIndex) => {
			const agentPointKey = `agent-points-${agentIndex}`;
			pointMarkers[agentPointKey] = [];

			// 1. Handle Markers (Points)
			agent.generatedPoints.forEach((coords, pointIdx) => {
				// Inside loadDatatoMap -> agent.generatedPoints.forEach
				const el = document.createElement('div');
				el.className = 'flex items-center justify-center agent-marker-point'; // Added a class
				el.innerHTML = `
				<span class="relative flex size-3">
					<span class="dot-ping absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
					<span class="dot-main relative inline-flex size-3 rounded-full bg-orange-500"></span>
				</span>`;

				const m = new mapboxgl.Marker({ element: el, anchor: 'center' })
					.setLngLat(coords as mapboxgl.LngLatLike)
					.addTo(map!);

				pointMarkers[agentPointKey].push(m); // Store the reference
				currentMarkers.push(m);
				bounds.extend(coords as mapboxgl.LngLatLike);
			});

			// 2. Handle Paths (Lines)
			agent.paths.forEach((path, pathIndex) => {
				const sourceId = `route-${agentIndex}-${pathIndex}`;

				// Check if source already exists to avoid crashes on re-renders
				if (!map?.getSource(sourceId)) {
					map?.addSource(sourceId, {
						type: 'geojson',
						data: {
							type: 'Feature',
							properties: {},
							geometry: {
								type: 'LineString',
								//@ts-ignore
								coordinates: path
							}
						}
					});

					map?.addLayer({
						id: sourceId,
						type: 'line',
						source: sourceId,
						layout: {
							'line-join': 'round',
							'line-cap': 'round'
						},
						paint: {
							'line-color': '#f97316',
							'line-width': 2,
							'line-opacity': 0.3,
							'line-dasharray': [2, 2]
						}
					});
				}
			});

			// 3. Landing point
			const el = document.createElement('div');
			el.className = 'flex items-center justify-center';
			el.innerHTML = `
						<span class="relative flex size-6"> 
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
								
								<span class="relative inline-flex size-6 items-center justify-center rounded-full bg-emerald-500 p-1 shadow-sm">
										<svg 
												xmlns="http://www.w3.org/2000/svg" 
												viewBox="0 0 24 24" 
												fill="none" 
												stroke="white" 
												stroke-width="2.5" 
												stroke-linecap="round" 
												stroke-linejoin="round" 
												class="size-4"
										>
												<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>
										</svg>
								</span>
						</span>
				`;

			//4. animation
			// Inside your loadDatatoMap loop
			if (map && agent.paths.length > 0) {
				// Flattening the path chunks [0...99], [100...199] into one array
				const fullPath = agent.paths.flat() as unknown as [number, number][];
				if (fullPath.length > 0) {
					animateAgentWalking(map!, fullPath, agent, agentIndex);
				}
			}

			// Ensure coordinates are valid numbers to prevent Mapbox errors
			const lng = Number(agent.deployedLng);
			const lat = Number(agent.deployedLat);

			if (!isNaN(lng) && !isNaN(lat)) {
				const landingCoords: [number, number] = [lng, lat];

				// Check if map exists before adding
				if (map) {
					const m = new mapboxgl.Marker({
						element: el,
						anchor: 'center'
					})
						.setLngLat(landingCoords)
						.addTo(map);

					const landingKey = `landing-${agentIndex}`;
					landingMarkers[landingKey] = m;

					currentMarkers.push(m);
					bounds.extend(landingCoords);
				}
			} else {
				console.error('Invalid coordinates for agent:', agent);
			}
		});

		// // Fit map to markers
		// if (!bounds.isEmpty()) {
		// 	map?.fitBounds(bounds, { padding: 50 });
		// }
	}

	// Helper to animate a marker along a path
	function animateAgentWalking(
		map: mapboxgl.Map,
		pathCoords: [number, number][],
		agent: Agent,
		agentIndex: number
	) {
		const markerKey = `agent-${agentIndex}`;
		const style = getAgentStyle(agent.classId);

		// 1. TIMING CALCULATIONS
		const totalDurationMs = 60 * 60 * (agent.duration_hr * 1000);
		const deployedTime = new Date(agent.deployedAt).getTime();
		const now = Date.now();
		const elapsed = now - deployedTime;

		// Determine if agent is dead
		const isDead = agent.batteryLevel <= 0;

		// 2. CALCULATE STOP POSITION
		// We determine where the agent is RIGHT NOW based on elapsed time
		let currentProgress = elapsed / totalDurationMs;
		if (currentProgress < 0) currentProgress = 0;
		if (currentProgress > 1) currentProgress = 1;

		// Find the coordinate in the path for this progress
		const stopIndex = Math.floor(currentProgress * (pathCoords.length - 1));
		const initialPos = pathCoords[stopIndex] || pathCoords[0];

		if (isNaN(deployedTime) || movingMarkers[markerKey]) return;

		// 3. UI THEME
		const themeColor = isDead ? '#ff3333' : agent.batteryLevel < 20 ? '#facc15' : style.color;

		const el = document.createElement('div');
		el.className = 'relative flex flex-col items-center';
		el.innerHTML = `
			<div class="group relative flex flex-col items-center">
				<div class="mb-2 flex items-center gap-1.5 rounded-md border bg-black/90 px-2 py-1 text-[9px] font-black uppercase tracking-tighter shadow-xl"
						style="color: ${themeColor}; border-color: ${themeColor}66;">
					${isDead ? '⚠️ LOW' : agent.name}
				</div>

				<div class="relative z-10 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-950 shadow-2xl transition-transform"
						style="border-color: ${themeColor}; box-shadow: 0 0 20px ${themeColor}44;">
					
					<img 
						src="${agent.avatar}" 
						alt="${agent.name}" 
						class="h-full w-full object-cover ${isDead ? 'grayscale opacity-50' : ''}"
					/>
					
					${
						isDead
							? `
						<div class="absolute inset-0 flex items-center justify-center rounded-full bg-red-950/40">
							<div class="h-8 w-8 animate-ping rounded-full border border-red-500/50"></div>
						</div>
					`
							: ''
					}
				</div>

				<div class="h-4 w-[2px]" style="background: linear-gradient(to bottom, ${themeColor}, transparent);"></div>
				<div class="-mt-1 h-2.5 w-2.5 rounded-full border-2 border-white/80 shadow-lg" style="background-color: ${themeColor};"></div>
			</div>
		`;

		el.addEventListener('click', (e) => {
			e.stopPropagation(); // Prevent map click events

			// Only allow recharge if battery is low/dead
			if (agent.batteryLevel < 100) {
				selectedAgentForRecharge = agent;
			}
		});

		// Important: Add cursor pointer to the element style
		el.style.cursor = 'pointer';

		// Initialize marker at the calculated initialPos (where it "paused")
		const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
			.setLngLat(initialPos as [number, number])
			.addTo(map);

		movingMarkers[markerKey] = marker;

		// 4. PATH CLEANUP (Remove dots up to the pause point)
		const agentPointKey = `agent-points-${agentIndex}`;
		const markers = pointMarkers[agentPointKey];
		if (markers) {
			const passedThreshold = Math.floor(currentProgress * markers.length);
			for (let i = 0; i <= passedThreshold; i++) {
				if (markers[i]) markers[i].remove();
			}
		}

		// 5. ANIMATION LOOP
		// If dead, we never start the walk function, so it stays at initialPos
		if (isDead) return;

		let hasCompleted = false;
		function walk() {
			const currentNow = Date.now();
			const currentElapsed = currentNow - deployedTime;
			let progress = Math.min(Math.max(currentElapsed / totalDurationMs, 0), 1);

			const coordIndex = Math.floor(progress * (pathCoords.length - 1));
			const currentPos = pathCoords[coordIndex];

			if (currentPos) marker.setLngLat(currentPos as [number, number]);

			// Cleanup waypoints as we move
			if (markers) {
				const passed = Math.floor(progress * markers.length);
				if (markers[passed]) markers[passed].remove();
			}

			if (progress < 1 && movingMarkers[markerKey]) {
				requestAnimationFrame(walk);
			} else if (progress >= 1 && !hasCompleted) {
				hasCompleted = true;
				console.log('Agent is complete: ', agent);
				handleAgentReturn(agent);
			}
		}

		walk();
	}

	function handleAgentReturn(agent: Agent) {
		// Check if agent is already in the finished list to prevent duplicates
		finishedAgents.update((list) => {
			const exists = list.find((a) => a.id === agent.id);
			if (!exists) {
				return [...list, agent]; // Triggers global reactivity
			}
			return list;
		});
	}

	async function handleAgentRedeploy(updatedAgents: any[]) {
		$agents = [...updatedAgents];

		await tick();
		loadDatatoMap();
	}

	async function handlePointsUpdate(updatedAgents: any[]) {
		$agents = [...updatedAgents];
		await tick();
		console.log('Agents deployed : ', updatedAgents);
		loadDatatoMap();
	}

	async function handleRechargeComplete(updatedAgents: any[]) {
		$agents = [...updatedAgents];
		console.log('Recharge agents: ', updatedAgents);

		await tick();
		loadDatatoMap();
	}

	// Effect: Update the radius circle when stores change
	$effect(() => {
		if (!map || !isMapReady) return;

		const currentRadius = $MAP_RADIOUS;
		const currentCenter = $CENTER_POINT;

		const radiusSource = map.getSource('radius-source') as mapboxgl.GeoJSONSource;
		const centerSource = map.getSource('center-point') as mapboxgl.GeoJSONSource;

		if (radiusSource) {
			radiusSource.setData(circle(currentCenter, currentRadius, { steps: 64, units: 'meters' }));
		}

		if (centerSource) {
			centerSource.setData({
				type: 'Feature',
				geometry: { type: 'Point', coordinates: currentCenter },
				properties: {}
			});
		}
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<div class="relative h-screen w-full bg-slate-900">
	{#if isLoading}
		<div
			class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm"
		>
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
			></div>
			<p class="mt-4 font-medium text-slate-300">Targeting Coordinates...</p>
		</div>
	{/if}

	<div bind:this={mapContainer} class="h-full w-full" />

	{#if isMapReady}
		<Topdisplay map={map!} {movingMarkers} />
	{/if}

	<Returned
		bind:queue={$finishedAgents}
		onPointsUpdate={handleAgentRedeploy}
		onComplete={(agent) => {
			// 1. Log the removal
			console.log(`Agent Removed: ${agent.name} (ID: ${agent.id})`);

			// 2. Remove from global store
			$finishedAgents = $finishedAgents.filter((a) => a.id !== agent.id);
			console.log('Finished Agents : ', $finishedAgents);
			// 3. Refresh the map
			loadDatatoMap();
		}}
	/>

	<DDeploy onPointsUpdate={handlePointsUpdate} />

	<Recharge
		agent={selectedAgentForRecharge}
		onClose={() => (selectedAgentForRecharge = null)}
		onPointsUpdate={handleRechargeComplete}
	/>
</div>

<style>
	:global(.mapboxgl-ctrl-bottom-left),
	:global(.mapboxgl-ctrl-bottom-right),
	:global(.mapboxgl-ctrl-logo) {
		display: none !important;
	}
</style>
