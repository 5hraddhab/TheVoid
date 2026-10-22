import { GoogleGenAI } from '@google/genai';
import { UniverseBlueprintSchema, type ValidatedBlueprint } from './schema';
import type { UniverseBlueprint } from '../../src/types/universe';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

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
      "hasAtmosphere": true | false,
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
1. Always adapt the celestial bodies, colors, and layout directly to the user's prompt.
2. If they ask for two suns, make sure 2 stars exist. If they ask for a black hole, include a black hole.
3. Ensure coordinates are balanced for a 3D flight volume: positions generally between -80 and +80 units.
4. Colors should be harmonious, vibrant, and cinematic. Avoid generic gray/white everywhere.
5. Return ONLY pure JSON.
`;

export async function generateUniverseWithGemini(prompt: string): Promise<UniverseBlueprint> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    const error = new Error(
      'Gemini API key is not configured on the backend. Please add GEMINI_API_KEY to your .env file. You can obtain a free API key from Google AI Studio (https://aistudio.google.com/).'
    );
    (error as any).status = 503;
    (error as any).code = 'MISSING_API_KEY';
    throw error;
  }

  const modelName = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const ai = new GoogleGenAI({ apiKey });

  // Safety timeout wrapper (60s to allow complex astrophysical generation)
  const timeoutMs = 60000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      const err = new Error(`Gemini API request timed out after ${timeoutMs / 1000} seconds.`);
      (err as any).status = 504;
      (err as any).code = 'TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  // Attempt generation with automatic retry for transient 503 demand spikes
  let lastError: any = null;
  const maxRetries = 3; // increased retries for transient high‑demand spikes

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const generationPromise = ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Generate an astrophysical universe blueprint matching this user concept:\n"${prompt}"\n\nEnsure rich celestial diversity (1-3 stars, 0-2 black holes, 2-5 planets with moons/rings, 1-2 nebulae, 1 asteroid belt, 1-2 anomalies, 2-3 points of interest, 2-3 mission objectives). Keep descriptions punchy and evocative. Output pure valid JSON only.`,
              },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const response = (await Promise.race([generationPromise, timeoutPromise])) as any;

      let responseText = '';
      if (typeof response?.text === 'string') {
        responseText = response.text;
      } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Received an empty response from Gemini API.');
      }

      // Strip markdown formatting if present
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', cleaned.slice(0, 300));
        const err = new Error('Gemini API returned an invalid JSON payload.');
        (err as any).status = 502;
        (err as any).code = 'INVALID_JSON';
        throw err;
      }

      // Validate with Zod
      const validated: ValidatedBlueprint = UniverseBlueprintSchema.parse(parsedJson);

      // Explicitly stamp AI provenance and metadata
      const blueprint: UniverseBlueprint = {
        ...validated,
        isAiGenerated: true,
        modelUsed: `Google Gemini (${modelName})`,
        generatedAt: new Date().toISOString(),
      };

      return blueprint;
    } catch (error: any) {
      lastError = error;
      const message = error?.message || String(error);

      // Check for transient 503 high demand spike
      const isHighDemand =
        message.includes('503') ||
        message.includes('high demand') ||
        message.includes('UNAVAILABLE') ||
        error?.status === 503;

      if (isHighDemand && attempt <= maxRetries) {
        console.warn(`[Gemini API] Temporary high demand spike (attempt ${attempt}/${maxRetries + 1}). Retrying in 2 seconds...`);
        await new Promise((res) => setTimeout(res, 2000 * attempt));
        continue;
      }

      // Not retryable or retries exhausted, handle below
      break;
    }
  }

  // Handle final error
  console.error('Gemini API generation error:', lastError?.message || lastError);

  if (lastError?.status && lastError?.code) {
    throw lastError;
  }

  const message = lastError?.message || String(lastError);

  if (message.includes('503') || message.includes('high demand') || message.includes('UNAVAILABLE')) {
    const err = new Error(
      'Google Gemini API is currently experiencing a high demand spike on the free tier. Please wait 10–15 seconds and click "Retry Prompt", or explore the built-in reference specimen universe in the meantime.'
    );
    (err as any).status = 503;
    (err as any).code = 'HIGH_DEMAND';
    throw err;
  }

  // Rate limit or quota exhaustion (429)
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
    const err = new Error(
      'Gemini API quota exhausted or rate limit reached. Please wait a minute or check your quota in Google AI Studio.'
    );
    (err as any).status = 429;
    (err as any).code = 'RATE_LIMIT';
    throw err;
  }

  // Invalid API key or permission denied (403 / 401 / 400)
  if (message.includes('API_KEY_INVALID') || message.includes('401') || message.includes('403')) {
    const err = new Error(
      'Invalid Google Gemini API key. Please verify your GEMINI_API_KEY in the backend .env file.'
    );
    (err as any).status = 401;
    (err as any).code = 'INVALID_KEY';
    throw err;
  }

  // Model not found or unavailable
  if (message.includes('404') || message.includes('not found') || message.includes('NOT_FOUND')) {
    const err = new Error(
      `Gemini model '${modelName}' is not available for your key or region. You can set GEMINI_MODEL in .env to another supported model.`
    );
    (err as any).status = 404;
    (err as any).code = 'MODEL_NOT_FOUND';
    throw err;
  }

  const genericErr = new Error(`Failed to generate universe via Gemini: ${message}`);
  (genericErr as any).status = 500;
  (genericErr as any).code = 'AI_ERROR';
  throw genericErr;
}

