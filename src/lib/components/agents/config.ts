import {
		Cpu,
		Check,
		Loader2,
		Bot,
		MapPin,
		Database,
		BatteryCharging,
		Zap,
		EyeOff
	} from '@lucide/svelte';


export const DEPLOYMENT_COST = 1000;
export const MOCK_CLASSES = [
  {
    id: 'scout',
    label: 'Pathfinder',
    img: 'agent-avatars/pathfinder/pathfinder.png',
    hex: '#34d399',
    description: 'Optimized for speed and wide-area coverage.',
    icon: MapPin,
    color: 'text-emerald-400',
    accent: 'border-emerald-500/60 bg-emerald-500/10',
    glow: 'shadow-emerald-500/20',
    specialties: [
      'Rapid Deployment: -15m flight time',
      'Signal Range: +25% discovery radius',
      'Evasion: 10% chance to ignore battery drain'
    ]
  },
  {
    id: 'extraction',
    label: 'Harvester',
    img: 'agent-avatars/Harvester/Harvester.png',
    description: 'Maximum data retrieval and resource processing.',
    icon: Database,
    hex: '#fbbf24',
    color: 'text-amber-400',
    accent: 'border-amber-500/60 bg-amber-500/10',
    glow: 'shadow-amber-500/20',
    specialties: [
      'Data Compression: +20% points earned',
      'Deep Scan: Increased rare data chance',
      'Storage Upgrade: Carry 2x more data'
    ]
  },
  {
    id: 'energy',
    label: 'Sustainer',
    img: 'agent-avatars/Sustainer/Sustainer.png',
    hex: '#60a5fa',
    description: 'Advanced power management for long-term ops.',
    icon: BatteryCharging,
    color: 'text-blue-400',
    accent: 'border-blue-500/60 bg-blue-500/10',
    glow: 'shadow-blue-500/20',
    specialties: [
      'Solar Cells: 50% faster day-recharge',
      'Power Reserve: +30m activity at 0%',
      'Efficient Drive: -20% roaming cost'
    ]
  },
  {
    id: 'stealth',
    label: 'Ghost',
    hex: '#a78bfa',
    img: 'agent-avatars/Ghost/Ghost.png',
    description: 'Low-signature operations and encrypted scouting.',
    icon: EyeOff, // Make sure to import EyeOff from lucide-svelte
    color: 'text-violet-400',
    accent: 'border-violet-500/60 bg-violet-500/10',
    glow: 'shadow-violet-500/20',
    specialties: [
      'Cloak: Undetectable by other players on map',
      'Encryption: +15% bonus points from Secure Nodes',
      'Silent Roam: Moves 10% faster between GPS points'
    ]
  }
];

export const AVATARS = ['agent-avatars/pathfinder/pathfinder.png', 'agent-avatars/Harvester/Harvester.png', 'agent-avatars/Sustainer/Sustainer.png', 'agent-avatars/Ghost/Ghost.png'];