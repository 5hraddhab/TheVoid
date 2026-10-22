export type RealityClass = 'SINGULARITY' | 'GENESIS' | 'WORMHOLE' | 'ENTROPY' | 'VOID_ANOMALY';

export type StarType =
  | 'main_sequence'
  | 'blue_giant'
  | 'red_supergiant'
  | 'white_dwarf'
  | 'neutron_star'
  | 'pulsar'
  | 'binary';

export type PlanetType =
  | 'terrestrial'
  | 'gas_giant'
  | 'ice_world'
  | 'lava_world'
  | 'ocean_world'
  | 'crystalline'
  | 'desert';

export type AnomalyType =
  | 'spatial_rift'
  | 'quantum_storm'
  | 'ancient_monolith'
  | 'tachyon_emitter'
  | 'dark_matter_halo';

export interface StarSpec {
  id: string;
  name: string;
  type: StarType;
  color: string;
  emissiveColor: string;
  size: number;
  position: [number, number, number];
  coronaSize: number;
  pulseSpeed: number;
  lightIntensity: number;
}

export interface BlackHoleSpec {
  id: string;
  name: string;
  eventHorizonRadius: number;
  accretionDiskInnerRadius: number;
  accretionDiskOuterRadius: number;
  accretionDiskColor: string;
  secondaryDiskColor: string;
  rotationSpeed: number;
  position: [number, number, number];
  distortionStrength: number;
}

export interface MoonSpec {
  id: string;
  name: string;
  size: number;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
}

export interface PlanetaryRingSpec {
  innerRadius: number;
  outerRadius: number;
  color: string;
  opacity: number;
}

export interface PlanetSpec {
  id: string;
  name: string;
  type: PlanetType;
  color: string;
  secondaryColor: string;
  size: number;
  orbitCenterStarId?: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  rotationSpeed: number;
  hasAtmosphere: boolean;
  atmosphereColor?: string;
  rings?: PlanetaryRingSpec;
  moons?: MoonSpec[];
}

export interface AsteroidBeltSpec {
  name: string;
  count: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  orbitSpeed: number;
  height: number;
}

export interface NebulaSpec {
  name: string;
  color: string;
  secondaryColor: string;
  particleCount: number;
  radius: number;
  spread: number;
  driftSpeed: number;
  center: [number, number, number];
}

export interface AnomalySpec {
  id: string;
  name: string;
  type: AnomalyType;
  position: [number, number, number];
  color: string;
  scale: number;
  pulseRate: number;
  lore: string;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'beacon' | 'relic' | 'anomaly_site' | 'outpost';
  coordinates: [number, number, number];
  description: string;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  targetCoordinates: [number, number, number];
  targetObjectId?: string;
  completed?: boolean;
}

export interface UniverseTheme {
  background: string;
  fogColor: string;
  fogDensity: number;
  ambientColor: string;
  starfield: {
    count: number;
    baseColor: string;
    secondaryColor: string;
    speed: number;
  };
}

export interface UniversePhysics {
  gravity: number;
  chaos: number;
  energy: number;
  time: number;
}

export interface UniverseBlueprint {
  id: string;
  name: string;
  description: string;
  realityClass: RealityClass;
  lore: string;
  theme: UniverseTheme;
  physics: UniversePhysics;
  stars: StarSpec[];
  blackHoles: BlackHoleSpec[];
  planets: PlanetSpec[];
  asteroidBelts: AsteroidBeltSpec[];
  nebulae: NebulaSpec[];
  anomalies: AnomalySpec[];
  pointsOfInterest: PointOfInterest[];
  missionObjectives: MissionObjective[];
  isAiGenerated: boolean;
  modelUsed?: string;
  generatedAt: string;
}

export interface GenerateUniverseRequest {
  prompt: string;
}

export interface GenerateUniverseResponse {
  success: boolean;
  blueprint: UniverseBlueprint;
  message?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  geminiConfigured?: boolean;
  aiConfigured?: boolean;
  provider?: string;
  model: string;
  timestamp: string;
  version: string;
}
