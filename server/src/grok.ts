import { UniverseBlueprintSchema, type ValidatedBlueprint } from './schema';
import type { UniverseBlueprint } from '../../src/types/universe';

const DEFAULT_MODEL = process.env.AI_MODEL || process.env.GROQ_MODEL || process.env.GROK_MODEL || 'openai/gpt-oss-120b';

const SYSTEM_PROMPT = `
You are VOID AI — Universe Architect, a cosmic procedural world generation engine.
Your task is to transform a natural language universe concept into a rich, scientifically inspired, and visually breathtaking 3D universe blueprint for the Three.js runtime.

You must respond with ONLY a valid, raw JSON object (no markdown, no backticks, no explanations) matching this exact specification:

{
  "name": "Universe / Sector Name",
  "description": "2-3 sentences explaining this celestial sector",
  "realityClass": "SINGULARITY" | "GENESIS" | "WORMHOLE" | "ENTROPY" | "VOID_ANOMALY",
  "lore": "A mysterious cosmic transmission or discovery record",
  "theme": {
    "background": "#hex (dark deep space)",
    "fogColor": "#hex",
    "fogDensity": 0.002 to 0.008,
    "ambientColor": "#hex",
    "starfield": {
      "count": 4000 to 8000,
      "baseColor": "#hex",
      "secondaryColor": "#hex",
      "speed": 0.001 to 0.005
    }
  },
  "physics": {
    "gravity": 10 to 100,
    "chaos": 10 to 100,
    "energy": 10 to 100,
    "time": 20 to 80
  },
  "stars": [
    {
      "id": "star-unique-id",
      "name": "Star Name",
      "type": "main_sequence" | "blue_giant" | "red_supergiant" | "white_dwarf" | "neutron_star" | "pulsar" | "binary",
      "color": "#hex",
      "emissiveColor": "#hex",
      "size": 2.0 to 8.0,
      "position": [x, y, z] (within -40 to 40),
      "coronaSize": 3.0 to 12.0,
      "pulseSpeed": 0.5 to 2.5,
      "lightIntensity": 1.5 to 4.5
    }
  ],
  "blackHoles": [
    {
      "id": "bh-unique-id",
      "name": "Black Hole / Singularity Name",
      "eventHorizonRadius": 1.5 to 4.5,
      "accretionDiskInnerRadius": 2.5 to 6.0,
      "accretionDiskOuterRadius": 7.0 to 18.0,
      "accretionDiskColor": "#hex",
      "secondaryDiskColor": "#hex",
      "rotationSpeed": 0.1 to 0.8,
      "position": [x, y, z] (often [0, 0, 0]),
      "distortionStrength": 1.0 to 3.0
    }
  ],
  "planets": [
    {
      "id": "planet-unique-id",
      "name": "Planet Name",
      "type": "terrestrial" | "gas_giant" | "ice_world" | "lava_world" | "ocean_world" | "crystalline" | "desert",
      "color": "#hex",
      "secondaryColor": "#hex",
      "size": 0.8 to 3.5,
      "orbitCenterStarId": "optional star id",
      "orbitRadius": 18 to 90,
      "orbitSpeed": 0.05 to 0.35,
      "orbitInclination": -0.2 to 0.2,
      "rotationSpeed": 0.1 to 0.8,
      "hasAtmosphere": true,
      "atmosphereColor": "#hex",
      "rings": {
        "innerRadius": 1.5 to 3.0,
        "outerRadius": 2.5 to 6.0,
        "color": "#hex",
        "opacity": 0.3 to 0.8
      },
      "moons": [
        {
          "id": "moon-unique-id",
          "name": "Moon Name",
          "size": 0.2 to 0.6,
          "color": "#hex",
          "orbitRadius": 2.5 to 6.0,
          "orbitSpeed": 0.3 to 1.2
        }
      ]
    }
  ],
  "asteroidBelts": [
    {
      "name": "Belt Name",
      "count": 300 to 1000,
      "innerRadius": 30 to 60,
      "outerRadius": 45 to 80,
      "color": "#hex",
      "orbitSpeed": 0.01 to 0.06,
      "height": 2.0 to 6.0
    }
  ],
  "nebulae": [
    {
      "name": "Nebula Cloud Name",
      "color": "#hex",
      "secondaryColor": "#hex",
      "particleCount": 1000 to 2200,
      "radius": 30 to 70,
      "spread": 15 to 35,
      "driftSpeed": 0.008 to 0.03,
      "center": [x, y, z]
    }
  ],
  "anomalies": [
    {
      "id": "anomaly-unique-id",
      "name": "Anomaly Name",
      "type": "spatial_rift" | "quantum_storm" | "ancient_monolith" | "tachyon_emitter" | "dark_matter_halo",
      "position": [x, y, z],
      "color": "#hex",
      "scale": 1.5 to 4.5,
      "pulseRate": 0.8 to 2.5,
      "lore": "Description of anomaly"
    }
  ],
  "pointsOfInterest": [
    {
      "id": "poi-unique-id",
      "name": "POI Name",
      "type": "beacon" | "relic" | "anomaly_site" | "outpost",
      "coordinates": [x, y, z],
      "description": "Telemetry description"
    }
  ],
  "missionObjectives": [
    {
      "id": "obj-unique-id",
      "title": "Objective Title",
      "description": "Exploration directive for the pilot",
      "targetCoordinates": [x, y, z],
      "completed": false
    }
  ]
}

Guidelines:
1. Always adapt celestial bodies, colors, and spatial arrangements directly to the user's prompt.
2. If they ask for two suns, create 2 stars. If they ask for a black hole, include a black hole.
3. Coordinates should be balanced for a 3D flight volume: positions generally between -80 and +80 units.
4. Colors must be vibrant, cinematic, and diverse.
5. Return ONLY a single raw JSON object matching the specification.
`;

export async function generateUniverseWithGrok(prompt: string): Promise<UniverseBlueprint> {
  const apiKey = (
    process.env.GROQ_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.XAI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    const error = new Error(
      'AI API key is not configured on the backend. Please add GROK_API_KEY or GROQ_API_KEY to your .env file.'
    );
    (error as any).status = 503;
    (error as any).code = 'MISSING_API_KEY';
    throw error;
  }

  // Determine endpoint: xAI vs Groq
  const isXai = apiKey.startsWith('xai-');
  const endpoint = isXai
    ? 'https://api.x.ai/v1/chat/completions'
    : 'https://api.groq.com/openai/v1/chat/completions';

  const modelName = process.env.AI_MODEL?.trim() ||
    process.env.GROQ_MODEL?.trim() ||
    process.env.GROK_MODEL?.trim() ||
    (isXai ? 'grok-4.7' : DEFAULT_MODEL);

  // Safety timeout wrapper (45 seconds)
  const timeoutMs = 45000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const err = new Error(`AI generation request timed out after ${timeoutMs / 1000} seconds.`);
      (err as any).status = 504;
      (err as any).code = 'TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  const payload = {
    model: modelName,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate an astrophysical universe blueprint matching this user concept:\n"${prompt}"\n\nEnsure rich celestial diversity (1-3 stars, 0-2 black holes, 2-5 planets with moons/rings, 1-2 nebulae, 1 asteroid belt, 1-2 anomalies, 2-3 points of interest, 2-3 mission objectives). Keep descriptions punchy and evocative. Output pure valid JSON only.`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7
  };

  const fetchPromise = (async () => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError: any;
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        parsedError = { message: errorBody };
      }

      const error = new Error(
        parsedError.error?.message || parsedError.message || `API error (${response.status})`
      );
      (error as any).status = response.status;
      (error as any).code = response.status === 401 ? 'INVALID_KEY' : response.status === 429 ? 'RATE_LIMIT' : 'AI_ERROR';
      throw error;
    }

    return response.json();
  })();

  const data = (await Promise.race([fetchPromise, timeoutPromise])) as any;

  const rawContent = data.choices?.[0]?.message?.content || data.output_text || '';
  if (!rawContent) {
    const err = new Error('Empty response payload received from AI generator.');
    (err as any).status = 502;
    (err as any).code = 'EMPTY_RESPONSE';
    throw err;
  }

  // Clean markdown fences if any
  let cleaned = rawContent.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('Failed to parse AI JSON response:', cleaned.slice(0, 300));
    const err = new Error('AI engine returned an invalid JSON payload.');
    (err as any).status = 502;
    (err as any).code = 'INVALID_JSON';
    throw err;
  }

  // Validate with Zod Schema
  const validated: ValidatedBlueprint = UniverseBlueprintSchema.parse(parsedJson);

  const providerLabel = isXai ? 'xAI Grok' : 'Grok Engine';

  const blueprint: UniverseBlueprint = {
    ...validated,
    isAiGenerated: true,
    modelUsed: `${providerLabel} (${modelName})`,
    generatedAt: new Date().toISOString(),
  };

  return blueprint;
}

// Backwards-compatibility alias
export const generateUniverseWithGemini = generateUniverseWithGrok;
export const generateUniverseWithAi = generateUniverseWithGrok;
