# THE VOID — AI-Powered Procedural Universe Simulator

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Grok_AI-55e8d1)](https://groq.com/)
[![Graphics](https://img.shields.io/badge/3D_Engine-Three.js-8b70d6)](https://threejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An interactive, AI-powered procedural 3D universe simulator built with React, TypeScript, Three.js, Express, Zod, and the ultra-fast Grok engine.

Describe any cosmic concept in natural language, and **VOID AI — Universe Architect** generates an astrophysical 3D reality rendered in real time. Fly through your universe in first-person flight mode, orbit black holes, inspect habitable worlds, scan spatial anomalies, and complete sector mission objectives.

---

## Features

- **VOID AI — Universe Architect**: Powered by Grok high-performance inference engine. Generates structured, Zod-validated 3D universe blueprints from natural language prompts in milliseconds.
- **Dynamic Three.js Cosmic Engine**:
  - **Stars**: Coronas, relativistic point lights, flares, and equator energy rings.
  - **Black Holes**: Pitch-black event horizons, photon spheres, and relativistic swirling accretion disks.
  - **Planetary Systems**: Procedural textures (oceans, gas bands, lava fissures, ice plains), orbital motion loops, atmospheric Fresnel glow, rings, and orbiting moons.
  - **Asteroid Belts**: Instanced orbital rock fields with tumbling rotations.
  - **Volumetric Nebulae**: Volumetric particle clouds drifting through interstellar space.
  - **Cosmic Anomalies**: Pulsating spatial rifts, quantum storms, and ancient alien monoliths.
  - **Interactive Raycasting**: Click any celestial body in 3D to lock targets and inspect scientific telemetry.
- **First-Person Flight Mode**: Smooth Pointer Lock controls with WASD, mouse look, Shift thruster boost, Space/Ctrl altitude, and Esc unlock.
- **Built-in Reference Universe**: Includes a verified non-AI procedural specimen (*Cygnus Binary & The Abyssal Singularity*) for instant offline exploration when an API key is not configured.
- **Enterprise-Grade Backend**: Express & TypeScript backend with rate limiting, development CORS, strict Zod validation, request timeouts, and zero API key leakage to browser bundles.

---

## Flight Controls

| Control | Action |
| :--- | :--- |
| **Click Canvas** | Capture mouse & enter first-person flight mode |
| **W / A / S / D** | Fly forward, left, backward, right |
| **Mouse Look** | Direct pitch and yaw in 3D space |
| **Shift** | Engage warp thrusters (Boost speed 3x) |
| **Space** | Climb / ascend altitude (+Y) |
| **Ctrl** | Dive / descend altitude (-Y) |
| **Escape** | Exit pointer lock & release cursor for UI |
| **Mouse Click (when unlocked)** | Click any star, black hole, planet, or anomaly to inspect |

---

## Prerequisites

- **Node.js**: v20.0.0 or higher recommended (compatible with Node 18+)
- **npm**: v9.0.0 or higher
- **Grok / Groq API Key**

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (a `.env.example` template is provided):

```bash
cp .env.example .env
```

Open `.env` and insert your API key:

```env
# Backend Server Port
PORT=3001

# Grok / Groq API Key
GROK_API_KEY=your_actual_api_key_here

# AI Model Selection (default: openai/gpt-oss-120b)
AI_MODEL=openai/gpt-oss-120b
```

> **Security Note**: `GROK_API_KEY` is loaded exclusively on the backend server. It is never bundled into frontend assets or exposed in client requests. `.env` is ignored by Git.

### 3. Start the Full-Stack Application

Run both the Express backend and the Vite frontend concurrently with a single command:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173` (or `http://localhost:5174`)
- **Backend API**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`

### Alternative: Run Components Individually

```bash
# Terminal 1: Start Express backend
npm run server

# Terminal 2: Start Vite frontend
npm run client
```

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🚀 1-Click Deployment to Render

THE VOID is configured as a full-stack, single-service web application ready for instant deployment on [Render](https://render.com).

### Method A: Connect via Render Dashboard (Fastest)

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **New +** → **Web Service**.
2. Connect your GitHub repository: `https://github.com/5hraddhab/TheVoid`.
3. Configure the following settings:
   - **Name**: `the-void` (or your preferred name)
   - **Language / Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Under **Environment Variables**, add:
   - `GROK_API_KEY`: `your_grok_or_groq_api_key_here`
   - `AI_MODEL`: `openai/gpt-oss-120b` (or leave default)
   - `NODE_ENV`: `production`
5. Click **Create Web Service**. Render will install, build the Vite 3D frontend, bundle the static assets, and launch the Express backend with live AI generation on a free `.onrender.com` URL!

---

## How to Generate Universes

1. Open the application in your browser (`http://localhost:5173`).
2. Locate the **VOID AI — UNIVERSE ARCHITECT** panel at the bottom of the main stage.
3. Type an idea into the prompt editor, or click one of the quick concept buttons:
   - *"Create a universe with two suns and a massive black hole."*
   - *"Generate a colorful galaxy with habitable planets and asteroid belts."*
   - *"Create a dark universe with unstable stars and mysterious anomalies."*
   - *"Build a scientifically inspired solar system with moons and orbital motion."*
4. Click **GENERATE UNIVERSE ↗**.
5. The backend requests structured JSON from Grok, validates the blueprint with Zod, and streams the celestial schema to Three.js in milliseconds.
6. The 3D viewport smoothly cleans up previous assets and synthesizes the new stellar system, planets, black holes, and particle nebulae.
7. Click the canvas to fly through and explore your generated cosmos!

---

## Backend API Specification

### `GET /api/health`
Returns service status, model configuration, and secret-safe health checks.
- **Response**:
  ```json
  {
    "status": "healthy",
    "aiConfigured": true,
    "provider": "Grok Engine",
    "model": "openai/gpt-oss-120b",
    "timestamp": "2026-10-22T13:22:46.583Z",
    "version": "0.4.0"
  }
  ```

### `GET /api/demo-universe`
Returns the verified, built-in procedural specimen universe (*Cygnus Binary & The Abyssal Singularity*), stamped with `isAiGenerated: false`.

### `POST /api/generate-universe`
Generates a universe blueprint from a natural language prompt.
- **Request Body**:
  ```json
  {
    "prompt": "Create a universe with two suns and a massive black hole."
  }
  ```
- **Validation**:
  - Prompt must be a string between 3 and 600 characters.
  - Rate limited to 30 requests/minute per IP.
- **Response**:
  ```json
  {
    "success": true,
    "blueprint": {
      "id": "cosmos-1730000000000",
      "name": "Twin Suns of the Crimson Void",
      "description": "A dual stellar nexus orbiting a Kerr singularity.",
      "realityClass": "SINGULARITY",
      "lore": "Deep space probe telemetry indicates stable harmonic resonance.",
      "theme": { ... },
      "physics": { "gravity": 75, "chaos": 40, "energy": 80, "time": 50 },
      "stars": [ ... ],
      "blackHoles": [ ... ],
      "planets": [ ... ],
      "asteroidBelts": [ ... ],
      "nebulae": [ ... ],
      "anomalies": [ ... ],
      "pointsOfInterest": [ ... ],
      "missionObjectives": [ ... ],
      "isAiGenerated": true,
      "modelUsed": "Grok Engine (openai/gpt-oss-120b)"
    }
  }
  ```

---

## Troubleshooting

### 1. "AI API key is not configured"
- Ensure `.env` exists in the root directory.
- Verify that `GROK_API_KEY` or `GROQ_API_KEY` contains your API key.
- Restart the backend (`npm run dev`).
- If you don't have an API key right now, click the **DEMO** button in the UI or **LOAD BUILT-IN DEMO UNIVERSE** to explore the handcrafted universe with full flight mode and 3D features.

### 2. "Cannot connect to backend / Network Error"
- Make sure the backend is running (`npm run server` or `npm run dev`).
- Verify that port 3001 is available. You can change `PORT=3002` in `.env` and update the proxy target in `vite.config.ts` if 3001 is in use.

### 3. CORS Errors in Development
- The backend Express app includes CORS configured for `http://localhost:5173`, `http://localhost:5174`, and `http://localhost:3000`.
- Vite also proxies `/api` requests directly to `http://localhost:3001` to eliminate cross-origin restrictions in local dev.

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Three.js, Lucide Icons, Vite
- **Backend**: Node.js, Express, TypeScript (`tsx`), Zod, CORS, dotenv, express-rate-limit
- **AI Engine**: Grok / Groq high-speed inference engine
- **Procedural Generation**: Custom canvas shaders, procedural planetary surface generators, dynamic particle nebulae, and Keplerian orbital paths
