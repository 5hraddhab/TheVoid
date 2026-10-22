import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { generateUniverseWithGrok } from './grok';
import { BUILT_IN_DEMO_UNIVERSE } from './demoUniverse';
import type { HealthResponse, GenerateUniverseResponse } from '../../src/types/universe';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// CORS configuration for local frontend development
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
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

// Start Express server
const server = app.listen(PORT, () => {
  const { configured, model, provider } = getAiConfig();
  console.log(`\n🌌 THE VOID — Backend Server Online`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Engine: ${provider}`);
  console.log(`🔑 AI Configured: ${configured ? 'YES' : 'NO (Add GROK_API_KEY to .env)'}`);
  console.log(`🎯 Default Model: ${model}\n`);
});

export default app;
