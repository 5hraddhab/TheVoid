import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { generateUniverseWithGrok } from './grok';
import { BUILT_IN_DEMO_UNIVERSE } from './demoUniverse';
import type { HealthResponse, GenerateUniverseResponse } from '../../src/types/universe';

// Load environment variables from .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// CORS configuration (allow local dev ports as well as production deployed domains)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Rate limiter for generation endpoint
const generateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many universe generation requests. Please wait a moment before generating another universe.',
  },
});

// Helper to check key status
function getAiConfig() {
  const apiKey = (
    process.env.GROQ_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.XAI_API_KEY ||
    ''
  ).trim();

  const isXai = apiKey.startsWith('xai-');
  const configured = apiKey.length > 0;
  const model =
    process.env.AI_MODEL ||
    process.env.GROQ_MODEL ||
    process.env.GROK_MODEL ||
    (isXai ? 'grok-4.7' : 'openai/gpt-oss-120b');
  const provider = isXai ? 'xAI Grok' : 'Grok Engine';

  return { configured, model, provider };
}

// Health check endpoint (does NOT expose secrets)
app.get('/api/health', (_req, res) => {
  const { configured, model, provider } = getAiConfig();

  const healthData: HealthResponse = {
    status: 'healthy',
    geminiConfigured: configured, // backwards-compatible flag
    aiConfigured: configured,
    provider,
    model,
    timestamp: new Date().toISOString(),
    version: '0.4.0',
  };

  res.json(healthData);
});

// Built-in verified demo universe endpoint (instant, offline-capable)
app.get('/api/demo-universe', (_req, res) => {
  res.json({
    success: true,
    blueprint: BUILT_IN_DEMO_UNIVERSE,
    message: 'Loaded built-in procedural specimen universe.',
  });
});

// AI Universe Generation endpoint
app.post('/api/generate-universe', generateLimiter, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid text prompt is required.',
      });
    }

    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is too short. Please describe your desired universe in at least 3 characters.',
      });
    }

    if (trimmedPrompt.length > 600) {
      return res.status(400).json({
        success: false,
        message: 'Prompt exceeds the 600 character limit. Please shorten your description.',
      });
    }

    console.log(`[Universe Generator] Processing prompt: "${trimmedPrompt.slice(0, 80)}..."`);
    const blueprint = await generateUniverseWithGrok(trimmedPrompt);

    const responsePayload: GenerateUniverseResponse = {
      success: true,
      blueprint,
      message: `Universe "${blueprint.name}" successfully generated with ${blueprint.modelUsed}.`,
    };

    return res.json(responsePayload);
  } catch (error: any) {
    const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 600 ? error.status : 500;
    const errorMessage = error?.message || 'An unexpected error occurred during universe generation.';

    console.error(`[Universe Generator Error ${status}]:`, errorMessage);

    return res.status(status).json({
      success: false,
      message: errorMessage,
      code: error?.code || 'GENERATION_FAILED',
    });
  }
});

// Serve frontend static build if dist folder exists (Production Full-Stack Mode)
if (fs.existsSync(distPath)) {
  console.log(`📦 Serving production static assets from ${distPath}`);
  app.use(express.static(distPath));

  // Express 5 compatible SPA fallback
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

// Start Express server on 0.0.0.0
const server = app.listen(PORT, '0.0.0.0', () => {
  const { configured, model, provider } = getAiConfig();
  console.log(`\n🌌 THE VOID — Backend Server Online`);
  console.log(`📡 URL: http://0.0.0.0:${PORT}`);
  console.log(`⚡ Engine: ${provider}`);
  console.log(`🔑 AI Configured: ${configured ? 'YES' : 'NO (Add GROK_API_KEY to .env)'}`);
  console.log(`🎯 Default Model: ${model}\n`);
});

export default app;
