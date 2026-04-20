export function generateName() {
  const prefixes = [
    // Original & Expanded Tactical
    'ALPHA', 'BRAVO', 'SIGMA', 'VOID', 'NEON', 'GHOST', 'IRON', 'CYBER', 'ZENITH', 'APEX',
    // Corporate/Industrial
    'OMNI', 'NEXUS', 'AETHER', 'CORTEX', 'SENTRY', 'OSIRIS', 'TITAN', 'VULCAN',
    // Glitch/Underground
    'NULL', 'CRYPT', 'VALT', 'ZERO', 'BIT', 'HACK', 'ROUGE', 'EXO', 'SYNTH',
    // Elemental/Dark
    'ABYSS', 'SOLAR', 'LUNAR', 'PLASMA', 'QUARTZ', 'CARBON', 'RADAR', 'SONIC'
  ];
  
  const suffixes = [
    // Original & Expanded Tactical
    'RECON', 'STRIKE', 'PROTOCOL', 'VANGUARD', 'WRAITH', 'BLADE', 'SHADOW', 'CORE', 'TITAN', 'UNIT',
    // Hardware/Infrastructure
    'FRAME', 'DRIVE', 'LOGIC', 'SERVER', 'PORT', 'HUB', 'WAVE', 'WIRE', 'CIRCUIT',
    // AI/Digital Life
    'SOUL', 'MIND', 'GHOST', 'SPARK', 'SENTINEL', 'WATCH', 'TRON', 'EYE',
    // Combat/Action
    'SLAYER', 'BREAKER', 'CRASH', 'LIMIT', 'POINT', 'ZONE', 'SECTOR', 'BURST'
  ];

  // Using padStart for that "cleaner" serial number look (e.g., 01, 09, 42)
  const randomNum = (Math.floor(Math.random() * 99) + 1).toString().padStart(2, '0');
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${p}-${s}-${randomNum}`;
}