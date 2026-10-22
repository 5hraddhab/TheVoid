import { z } from 'zod';
import type { UniverseBlueprint } from '../../src/types/universe';

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const colorSchema = z.string().refine((val) => hexColorRegex.test(val), {
  message: 'Must be a valid hex color string (e.g. #9d79ff or #ff0055)',
}).catch('#9d79ff');

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]).catch([0, 0, 0]);

export const StarSpecSchema = z.object({
  id: z.string().default(() => `star-${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1).default('Sol Alpha'),
  type: z.enum([
    'main_sequence',
    'blue_giant',
    'red_supergiant',
    'white_dwarf',
    'neutron_star',
    'pulsar',
    'binary',
  ]).catch('main_sequence'),
  color: colorSchema.default('#ffd27d'),
  emissiveColor: colorSchema.default('#ff8000'),
  size: z.number().min(0.5).max(30).catch(3.5),
  position: vector3Schema.default([0, 0, 0]),
  coronaSize: z.number().min(1).max(20).catch(5.0),
  pulseSpeed: z.number().min(0.1).max(10).catch(1.0),
  lightIntensity: z.number().min(0.5).max(10).catch(2.5),
});

export const BlackHoleSpecSchema = z.object({
  id: z.string().default(() => `singularity-${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1).default('Gargantua Prime'),
  eventHorizonRadius: z.number().min(0.8).max(20).catch(2.5),
  accretionDiskInnerRadius: z.number().min(1.2).max(25).catch(3.8),
  accretionDiskOuterRadius: z.number().min(2).max(60).catch(9.5),
  accretionDiskColor: colorSchema.default('#9d79ff'),
  secondaryDiskColor: colorSchema.default('#55e8d1'),
  rotationSpeed: z.number().min(0.01).max(5).catch(0.4),
  position: vector3Schema.default([0, 0, 0]),
  distortionStrength: z.number().min(0.1).max(5).catch(1.5),
});

export const MoonSpecSchema = z.object({
  id: z.string().default(() => `moon-${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1).default('Luna Minor'),
  size: z.number().min(0.1).max(4).catch(0.35),
  color: colorSchema.default('#cccccc'),
  orbitRadius: z.number().min(1.5).max(15).catch(3.0),
  orbitSpeed: z.number().min(0.1).max(5).catch(0.8),
});

export const PlanetaryRingSchema = z.object({
  innerRadius: z.number().min(0.5).max(15).catch(1.8),
  outerRadius: z.number().min(0.8).max(30).catch(3.6),
  color: colorSchema.default('#b0a4d8'),
  opacity: z.number().min(0.05).max(1).catch(0.65),
});

export const PlanetSpecSchema = z.object({
  id: z.string().default(() => `planet-${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1).default('Aethelgard'),
  type: z.enum([
    'terrestrial',
    'gas_giant',
    'ice_world',
    'lava_world',
    'ocean_world',
    'crystalline',
    'desert',
  ]).catch('terrestrial'),
  color: colorSchema.default('#55e8d1'),
  secondaryColor: colorSchema.default('#1c3b52'),
  size: z.number().min(0.4).max(12).catch(1.4),
  orbitCenterStarId: z.string().optional(),
  orbitRadius: z.number().min(8).max(280).catch(32),
  orbitSpeed: z.number().min(0.01).max(2).catch(0.15),
  orbitInclination: z.number().min(-0.8).max(0.8).catch(0.05),
  rotationSpeed: z.number().min(0.01).max(4).catch(0.4),
  hasAtmosphere: z.boolean().catch(true),
  atmosphereColor: colorSchema.optional(),
  rings: PlanetaryRingSchema.optional(),
  moons: z.array(MoonSpecSchema).optional().catch([]),
});

export const AsteroidBeltSpecSchema = z.object({
  name: z.string().min(1).default('Kuiper Verge'),
  count: z.number().min(50).max(3000).catch(450),
  innerRadius: z.number().min(15).max(300).catch(45),
  outerRadius: z.number().min(20).max(350).catch(65),
  color: colorSchema.default('#8892a0'),
  orbitSpeed: z.number().min(0.005).max(1).catch(0.04),
  height: z.number().min(0.5).max(30).catch(4),
});

export const NebulaSpecSchema = z.object({
  name: z.string().min(1).default('Orion Veil'),
  color: colorSchema.default('#6849b8'),
  secondaryColor: colorSchema.default('#1d8b90'),
  particleCount: z.number().min(200).max(5000).catch(1400),
  radius: z.number().min(15).max(220).catch(40),
  spread: z.number().min(5).max(100).catch(25),
  driftSpeed: z.number().min(0.001).max(0.5).catch(0.02),
  center: vector3Schema.default([0, 0, 0]),
});

export const AnomalySpecSchema = z.object({
  id: z.string().default(() => `anomaly-${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1).default('Chronos Rift'),
  type: z.enum([
    'spatial_rift',
    'quantum_storm',
    'ancient_monolith',
    'tachyon_emitter',
    'dark_matter_halo',
  ]).catch('spatial_rift'),
  position: vector3Schema.default([15, 5, -20]),
  color: colorSchema.default('#ff5983'),
  scale: z.number().min(0.5).max(15).catch(2.5),
  pulseRate: z.number().min(0.1).max(5).catch(1.2),
  lore: z.string().default('An incomprehensible distortion in localized spacetime.'),
});

export const PointOfInterestSchema = z.object({
  id: z.string().default(() => `poi-${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1).default('Beacon Prime'),
  type: z.enum(['beacon', 'relic', 'anomaly_site', 'outpost']).catch('beacon'),
  coordinates: vector3Schema.default([10, 0, 20]),
  description: z.string().default('Cosmic landmark transmitting anomalous telemetry.'),
});

export const MissionObjectiveSchema = z.object({
  id: z.string().default(() => `obj-${Math.random().toString(36).slice(2, 7)}`),
  title: z.string().min(1).default('Survey Sector Core'),
  description: z.string().default('Navigate coordinates to record gravitational telemetry.'),
  targetCoordinates: vector3Schema.default([0, 0, 0]),
  targetObjectId: z.string().optional(),
  completed: z.boolean().default(false),
});

export const UniverseBlueprintSchema = z.object({
  id: z.string().default(() => `cosmos-${Date.now()}`),
  name: z.string().min(1).max(120).default('Cosmos Incognita'),
  description: z.string().min(1).max(1500).default('A vast sector forged in the cosmic expanse.'),
  realityClass: z.enum(['SINGULARITY', 'GENESIS', 'WORMHOLE', 'ENTROPY', 'VOID_ANOMALY']).catch('GENESIS'),
  lore: z.string().default('Discovered at the outer fringe of mapped reality.'),
  theme: z.object({
    background: colorSchema.default('#04060b'),
    fogColor: colorSchema.default('#060911'),
    fogDensity: z.number().min(0.0001).max(0.05).catch(0.004),
    ambientColor: colorSchema.default('#1a2030'),
    starfield: z.object({
      count: z.number().min(500).max(12000).catch(5500),
      baseColor: colorSchema.default('#c8d8f8'),
      secondaryColor: colorSchema.default('#9d79ff'),
      speed: z.number().min(0.0001).max(0.1).catch(0.002),
    }).default({
      count: 5500,
      baseColor: '#c8d8f8',
      secondaryColor: '#9d79ff',
      speed: 0.002,
    }),
  }).default({
    background: '#04060b',
    fogColor: '#060911',
    fogDensity: 0.004,
    ambientColor: '#1a2030',
    starfield: {
      count: 5500,
      baseColor: '#c8d8f8',
      secondaryColor: '#9d79ff',
      speed: 0.002,
    },
  }),
  physics: z.object({
    gravity: z.number().min(0).max(100).catch(65),
    chaos: z.number().min(0).max(100).catch(35),
    energy: z.number().min(0).max(100).catch(70),
    time: z.number().min(5).max(100).catch(50),
  }).default({ gravity: 65, chaos: 35, energy: 70, time: 50 }),
  stars: z.array(StarSpecSchema).catch([]),
  blackHoles: z.array(BlackHoleSpecSchema).catch([]),
  planets: z.array(PlanetSpecSchema).catch([]),
  asteroidBelts: z.array(AsteroidBeltSpecSchema).catch([]),
  nebulae: z.array(NebulaSpecSchema).catch([]),
  anomalies: z.array(AnomalySpecSchema).catch([]),
  pointsOfInterest: z.array(PointOfInterestSchema).catch([]),
  missionObjectives: z.array(MissionObjectiveSchema).catch([]),
  isAiGenerated: z.boolean().default(false),
  modelUsed: z.string().optional(),
  generatedAt: z.string().default(() => new Date().toISOString()),
});

export type ValidatedBlueprint = z.infer<typeof UniverseBlueprintSchema>;
