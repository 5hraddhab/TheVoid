import { useCallback, useEffect, useState } from 'react';
import {
  Activity, AudioLines, CircleHelp, Crosshair, Gauge, Globe2, Orbit,
  Pause, Play, Radio, RotateCcw, Sparkles, Zap, AlertTriangle, RefreshCw,
  Compass, CheckCircle2, Circle
} from 'lucide-react';
import type {
  UniverseBlueprint,
  RealityClass,
  UniversePhysics,
  HealthResponse,
} from './types/universe';
import { BUILT_IN_DEMO_UNIVERSE } from './data/demoUniverse';
import { CelestialUniverse, type SelectedCelestialObject } from './engine/CelestialUniverse';

interface ModeOption {
  id: RealityClass;
  subtitle: string;
  color: string;
}

const MODES: ModeOption[] = [
  { id: 'SINGULARITY', subtitle: 'GRAVITATIONAL COLLAPSE', color: '#9d79ff' },
  { id: 'GENESIS', subtitle: 'COSMIC INFLATION', color: '#55e8d1' },
  { id: 'WORMHOLE', subtitle: 'SPACETIME TOPOLOGY', color: '#ff9f70' },
  { id: 'ENTROPY', subtitle: 'THERMODYNAMIC DECAY', color: '#ff668e' },
  { id: 'VOID_ANOMALY', subtitle: 'EXOTIC QUANTUM FIELD', color: '#ffd166' },
];

const EXAMPLE_PROMPTS = [
  'Create a universe with two suns and a massive black hole.',
  'Generate a colorful galaxy with habitable planets and asteroid belts.',
  'Create a dark universe with unstable stars and mysterious anomalies.',
  'Build a scientifically inspired solar system with moons and orbital motion.',
];

function App() {
  // Universe blueprint state
  const [blueprint, setBlueprint] = useState<UniverseBlueprint>(BUILT_IN_DEMO_UNIVERSE);
  const [params, setParams] = useState<UniversePhysics>(BUILT_IN_DEMO_UNIVERSE.physics);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(847291);
  const [discoveries, setDiscoveries] = useState(3);

  // AI Generation state
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<{ message: string; code?: string } | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthResponse | null>(null);

  // Inspector and Navigation state
  const [selectedObject, setSelectedObject] = useState<SelectedCelestialObject | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [objectives, setObjectives] = useState(BUILT_IN_DEMO_UNIVERSE.missionObjectives);
  const [telemetry, setTelemetry] = useState<{
    coordinates: [number, number, number];
    speed: number;
    nearestObject?: string;
    distanceToNearest?: number;
  }>({
    coordinates: [0, 14, 48],
    speed: 80,
    nearestObject: 'Cygnus Prime (Blue Supergiant)',
    distanceToNearest: 32.4,
  });

  // Check backend health on initial load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: HealthResponse | null) => {
        if (data) {
          setHealthInfo(data);
        }
      })
      .catch((err) => {
        console.warn('Backend /api/health check not reachable yet:', err.message);
      });
  }, []);

  // Update objectives and physics whenever a new blueprint is set
  const applyBlueprint = (newBlueprint: UniverseBlueprint) => {
    setBlueprint(newBlueprint);
    setParams(newBlueprint.physics || { gravity: 65, chaos: 35, energy: 70, time: 50 });
    setObjectives(newBlueprint.missionObjectives || []);
    setSelectedObject(null);
    setDiscoveries((d) => d + (newBlueprint.anomalies?.length || 1));
    setSeed(Math.floor(100000 + Math.random() * 900000));
  };

  // Switch Reality Class mode
  const setMode = (newMode: RealityClass) => {
    setBlueprint((prev) => ({
      ...prev,
      realityClass: newMode,
    }));
  };

  // Adjust Universal Constants
  const changeParam = (key: keyof UniversePhysics, value: number) => {
    setParams((p) => {
      const updated = { ...p, [key]: value };
      setBlueprint((prev) => ({
        ...prev,
        physics: updated,
      }));
      return updated;
    });
  };

  // Reset simulation to fresh state
  const resetSimulation = () => {
    setPaused(false);
    setSelectedObject(null);
    setApiError(null);
    setSeed(Math.floor(100000 + Math.random() * 900000));
  };

  // Load Built-in Demo Universe
  const handleLoadDemo = () => {
    setApiError(null);
    applyBlueprint(BUILT_IN_DEMO_UNIVERSE);
  };

  // Generate Universe via Gemini Backend
  const handleGenerateUniverse = useCallback(
    async (overridePrompt?: string) => {
      const targetPrompt = (overridePrompt ?? prompt).trim();
      if (!targetPrompt) {
        setApiError({
          message: 'Please enter a cosmic concept or idea to generate a universe.',
        });
        return;
      }

      setIsGenerating(true);
      setApiError(null);

      try {
        const response = await fetch('/api/generate-universe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: targetPrompt }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || `Generation failed (HTTP ${response.status})`);
        }

        applyBlueprint(data.blueprint);
      } catch (err: any) {
        console.error('Universe generation failed:', err);
        setApiError({
          message:
            err.message ||
            'Unable to connect to the universe generator backend. Please verify that the backend server is running on port 3001 and your GEMINI_API_KEY is configured.',
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [prompt]
  );

  // Toggle mission objective completed status
  const toggleObjective = (id: string) => {
    setObjectives((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, completed: !obj.completed } : obj))
    );
  };

  // All celestial objects for quick selection
  const allCelestialObjects: SelectedCelestialObject[] = [
    ...blueprint.stars.map((s) => ({
      id: s.id,
      name: s.name,
      category: 'STAR' as const,
      details: `Type: ${s.type.toUpperCase()} • Radiance: ${s.lightIntensity} GW • Radius: ${s.size} AU`,
      coordinates: s.position,
      color: s.color,
    })),
    ...blueprint.blackHoles.map((b) => ({
      id: b.id,
      name: b.name,
      category: 'BLACK_HOLE' as const,
      details: `Horizon: ${b.eventHorizonRadius} R_s • Disk: ${b.accretionDiskOuterRadius.toFixed(1)} AU`,
      coordinates: b.position,
      color: b.accretionDiskColor,
    })),
    ...blueprint.planets.map((p) => ({
      id: p.id,
      name: p.name,
      category: 'PLANET' as const,
      details: `Type: ${p.type.toUpperCase()} • Radius: ${p.size} R_e • Orbit: ${p.orbitRadius} AU`,
      coordinates: [p.orbitRadius, 0, 0] as [number, number, number],
      color: p.color,
    })),
    ...blueprint.anomalies.map((a) => ({
      id: a.id,
      name: a.name,
      category: 'ANOMALY' as const,
      details: `Type: ${a.type.toUpperCase()} • Lore: ${a.lore}`,
      coordinates: a.position,
      color: a.color,
    })),
  ];

  return (
    <main className="app-shell">
      {/* Top Bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Orbit size={19} />
          </div>
          <div>
            <div className="brand-name">
              THE VOID<span>®</span>
            </div>
            <div className="brand-sub">AI PROCEDURAL UNIVERSE SIMULATOR</div>
          </div>
        </div>

        <div className="top-status">
          {healthInfo?.geminiConfigured ? (
            <span className="provenance-badge badge-ai">
              <span className="live-dot" /> GEMINI HOSTED ENGINE READY
            </span>
          ) : (
            <span className="provenance-badge badge-demo">
              <span className="tiny-dot" /> DEMO MODE (KEY REQUIRED FOR AI)
            </span>
          )}
          <span className="status-divider">/</span>
          <span>BUILD 0.3.0</span>
        </div>

        <button
          className="icon-button help-button"
          onClick={() => setShowHelp((v) => !v)}
          aria-label="Toggle flight controls guide"
          title="Flight Controls & Help"
        >
          <CircleHelp size={17} />
        </button>
      </header>

      {/* Workspace Grid */}
      <div className="workspace">
        {/* Left Sidebar: Reality Configuration & Constants */}
        <aside className="sidebar">
          <div className="section-kicker">
            <span>01</span> REALITY CONFIGURATION
          </div>
          <div className="mode-list">
            {MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-card ${blueprint.realityClass === m.id ? 'selected' : ''}`}
                onClick={() => setMode(m.id)}
                style={{ '--mode-color': m.color } as React.CSSProperties}
              >
                <span className="mode-symbol">
                  {m.id === 'SINGULARITY' ? (
                    <Crosshair size={17} />
                  ) : m.id === 'GENESIS' ? (
                    <Sparkles size={17} />
                  ) : m.id === 'WORMHOLE' ? (
                    <Orbit size={17} />
                  ) : m.id === 'ENTROPY' ? (
                    <Activity size={17} />
                  ) : (
                    <Zap size={17} />
                  )}
                </span>
                <span className="mode-copy">
                  <strong>{m.id}</strong>
                  <small>{m.subtitle}</small>
                </span>
                <span className="mode-state">
                  {blueprint.realityClass === m.id ? '●' : '○'}
                </span>
              </button>
            ))}
          </div>

          <div className="section-kicker sliders-kicker">
            <span>02</span> UNIVERSAL CONSTANTS
          </div>
          <Slider
            label="GRAVITY WELL"
            value={params.gravity}
            onChange={(v) => changeParam('gravity', v)}
            icon={<Orbit size={14} />}
          />
          <Slider
            label="CHAOS INDEX"
            value={params.chaos}
            onChange={(v) => changeParam('chaos', v)}
            icon={<Activity size={14} />}
          />
          <Slider
            label="DARK ENERGY"
            value={params.energy}
            onChange={(v) => changeParam('energy', v)}
            icon={<Zap size={14} />}
          />
          <Slider
            label="TIME DILATION"
            value={params.time}
            onChange={(v) => changeParam('time', v)}
            icon={<Gauge size={14} />}
          />

          <div className="sidebar-bottom">
            <div className="seed-row">
              <span>UNIVERSE SEED</span>
              <strong>{seed.toString().padStart(6, '0')}</strong>
            </div>
            <div className="seed-row">
              <span>SECTOR ENTITIES</span>
              <strong>
                {blueprint.stars.length}★ / {blueprint.planets.length}● /{' '}
                {blueprint.blackHoles.length}◎
              </strong>
            </div>
            <div className="seed-row">
              <span>DISCOVERIES LOGGED</span>
              <strong>{discoveries.toString().padStart(3, '0')}</strong>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              <button
                className="reset-button"
                onClick={() => setPaused((p) => !p)}
                style={{ flex: 1 }}
              >
                {paused ? <Play size={13} /> : <Pause size={13} />}
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
              <button
                className="reset-button"
                onClick={resetSimulation}
                style={{ flex: 1 }}
              >
                <RotateCcw size={13} /> RESET
              </button>
            </div>
          </div>
        </aside>

        {/* Main Center Stage: 3D Universe + Telemetry + AI Architect */}
        <section className="main-stage">
          <div className="stage-heading">
            <div>
              <div className="stage-eyebrow">
                OBSERVATION CHAMBER <span> / SECTOR 7G</span>
              </div>
              <h1>{blueprint.name}</h1>
              <p className="stage-description">{blueprint.description}</p>
            </div>
            <div className="coordinates">
              {blueprint.isAiGenerated ? (
                <span className="provenance-badge badge-ai">
                  <Sparkles size={11} /> AI ARCHITECTED ({blueprint.modelUsed || 'Gemini'})
                </span>
              ) : (
                <span className="provenance-badge badge-demo">
                  <Globe2 size={11} /> BUILT-IN SPECIMEN (Non-AI)
                </span>
              )}
              <strong>
                0x{seed.toString(16).toUpperCase().slice(0, 4)} : 7F.29
              </strong>
            </div>
          </div>

          {/* Real Three.js Viewport */}
          <div className="scene-panel">
            <CelestialUniverse
              blueprint={blueprint}
              paused={paused}
              onSelectObject={setSelectedObject}
              onTelemetryUpdate={setTelemetry}
            />

            <div className="scene-topline">
              <span>
                <span className="tiny-dot" /> LIVE 3D RENDER / THREE.JS
              </span>
              <span>SECTOR {seed % 999} // {blueprint.realityClass}</span>
            </div>

            <div className="scene-bottomline">
              <span>
                STARS <b>{blueprint.stars.length}</b>
              </span>
              <span>
                PLANETS <b>{blueprint.planets.length}</b>
              </span>
              <span>
                SINGULARITIES <b>{blueprint.blackHoles.length}</b>
              </span>
              <span>
                PARTICLES <b>{(blueprint.theme.starfield.count / 1000).toFixed(1)}K</b>
              </span>
            </div>

            <div className="flight-hint">
              <span>◉ CLICK CANVAS TO ENTER FLIGHT MODE</span>
              <span>
                WASD MOVE · MOUSE LOOK · SHIFT BOOST · SPACE UP · CTRL DOWN · ESC EXIT
              </span>
            </div>

            {paused && (
              <div className="pause-overlay">
                <div className="pause-symbol">
                  <Pause size={25} />
                </div>
                <strong>SIMULATION PAUSED</strong>
                <span>TIME HAS NO MEANING HERE.</span>
              </div>
            )}

            {showHelp && (
              <div className="help-popover">
                <button
                  className="help-close"
                  onClick={() => setShowHelp(false)}
                  aria-label="Close help"
                >
                  ×
                </button>
                <strong>HOW TO EXPLORE THE UNIVERSE</strong>
                <p>
                  <strong>First-Person Flight:</strong> Click inside the 3D canvas to lock
                  the pointer and fly.
                </p>
                <p>
                  • <strong>WASD:</strong> Fly forward, left, backward, and right.
                  <br />• <strong>Mouse:</strong> Look around the cosmic 3D space.
                  <br />• <strong>Shift:</strong> Engage warp thrusters (Boost).
                  <br />• <strong>Space / Ctrl:</strong> Ascend and descend vertically.
                  <br />• <strong>Escape:</strong> Release the mouse to use UI buttons.
                </p>
                <p>
                  <strong>Object Inspector:</strong> When pointer lock is released, click on
                  stars, black holes, planets, or anomalies in 3D to view scientific
                  telemetry in Mission Control.
                </p>
              </div>
            )}
          </div>

          {/* Upgraded Telemetry Row */}
          <div className="telemetry">
            <Telemetry
              label="GRAVITY WELL"
              value={`${params.gravity}%`}
              percent={params.gravity}
            />
            <Telemetry
              label="SHIP COORDINATES"
              value={`${telemetry.coordinates[0]}, ${telemetry.coordinates[1]}, ${telemetry.coordinates[2]}`}
              percent={Math.min(
                100,
                Math.abs(telemetry.coordinates[0]) + Math.abs(telemetry.coordinates[2])
              )}
            />
            <Telemetry
              label="VELOCITY"
              value={`${telemetry.speed} km/s`}
              percent={telemetry.speed === 240 ? 100 : 35}
            />
            <div className="telemetry-card">
              <div className="telemetry-label">
                <Compass size={12} /> PROXIMITY ANCHOR
              </div>
              <div
                className="engine-value"
                style={{
                  fontSize: '11px',
                  color: '#55e8d1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {telemetry.nearestObject || 'Deep Void Space'}
              </div>
              <div className="engine-note">
                {telemetry.distanceToNearest
                  ? `DISTANCE: ${telemetry.distanceToNearest} AU`
                  : 'SCANNING...'}
              </div>
            </div>
          </div>

          {/* VOID AI — Universe Architect Generator Panel */}
          <div className="generator-panel">
            <div className="generator-head">
              <div>
                <Sparkles size={16} />
                <strong>VOID AI — UNIVERSE ARCHITECT</strong>
                <span> / GOOGLE GEMINI POWERED</span>
              </div>
              <span className="beta-tag">
                {healthInfo?.model || 'GEMINI 2.5 FLASH'}
              </span>
            </div>

            <form
              className="prompt-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateUniverse();
              }}
            >
              <span className="prompt-glyph">✳</span>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe a universe... e.g. a binary star system with ringed water worlds and a dormant black hole"
                aria-label="Describe a universe prompt"
                disabled={isGenerating}
              />

              <div className="generator-actions">
                <button
                  type="submit"
                  className="action-primary"
                  disabled={isGenerating || !prompt.trim()}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={12} className="spinning-radar" /> SYNTHESIZING...
                    </>
                  ) : (
                    <>
                      GENERATE UNIVERSE <span>↗</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="action-secondary"
                  onClick={handleLoadDemo}
                  disabled={isGenerating}
                  title="Load handcrafted reference universe"
                >
                  <Globe2 size={12} /> DEMO
                </button>
              </div>
            </form>

            {/* Loading Indicator State */}
            {isGenerating && (
              <div className="generator-loading">
                <div className="spinning-radar" />
                <span>
                  Querying Google Gemini hosted API & synthesizing 3D astrophysical
                  blueprint...
                </span>
              </div>
            )}

            {/* Error Message and Recovery State */}
            {apiError && (
              <div className="generator-error">
                <div className="error-head">
                  <AlertTriangle size={15} /> GENERATION ERROR
                </div>
                <div className="error-msg">{apiError.message}</div>
                <div className="error-actions">
                  <button
                    className="error-btn"
                    onClick={() => handleGenerateUniverse()}
                  >
                    Retry Prompt
                  </button>
                  <button className="error-btn" onClick={handleLoadDemo}>
                    Load Built-in Demo Universe
                  </button>
                </div>
              </div>
            )}

            <div className="generator-footer">
              <span>
                <span className="tiny-dot" />{' '}
                {isGenerating
                  ? 'TRANSMITTING TO GEMINI API...'
                  : blueprint.isAiGenerated
                  ? `ARCHITECTED VIA ${blueprint.modelUsed}`
                  : 'EXPLORING BUILT-IN SPECIMEN'}
              </span>
              <span>ENGINE V.0.3 // STRICT ZOD VALIDATED BLUEPRINT</span>
            </div>
          </div>

          {/* Quick Example Prompts */}
          <div className="quick-prompts">
            <span>TRY A CONCEPT:</span>
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPrompt(p);
                  handleGenerateUniverse(p);
                }}
                disabled={isGenerating}
              >
                <span>↗</span> {p}
              </button>
            ))}
          </div>
        </section>

        {/* Right Sidebar: Mission Control & Celestial Object Inspector */}
        <aside className="rightbar">
          <div className="section-kicker">
            <span>03</span> MISSION CONTROL
          </div>

          <div className="mission-state">
            <div className="mission-orb">
              <Globe2 size={22} />
            </div>
            <div>
              <strong>{blueprint.realityClass}</strong>
              <span>REALITY CLASSIFICATION</span>
            </div>
          </div>

          <p className="mission-description">{blueprint.lore}</p>

          <div className="right-divider" />

          {/* Celestial Object Inspector */}
          <div className="readout-heading">
            CELESTIAL INSPECTOR{' '}
            <span>{selectedObject ? 'TARGET LOCKED' : 'SELECT ENTITY'}</span>
          </div>

          {selectedObject ? (
            <div className="inspector-card">
              <div className="inspector-top">
                <span
                  className="inspector-type"
                  style={{ color: selectedObject.color }}
                >
                  {selectedObject.category}
                </span>
                <button
                  className="help-close"
                  style={{ position: 'static', fontSize: '15px' }}
                  onClick={() => setSelectedObject(null)}
                  title="Clear inspection"
                >
                  ×
                </button>
              </div>
              <div className="inspector-name">{selectedObject.name}</div>
              <div className="inspector-details">{selectedObject.details}</div>
              <div className="inspector-coords">
                <span>
                  COORDINATES: [{selectedObject.coordinates.join(', ')}]
                </span>
                {selectedObject.distance !== undefined && (
                  <span>RANGE: {selectedObject.distance} AU</span>
                )}
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              Click any celestial body in the 3D scene or select a chip below to view
              telemetry.
            </div>
          )}

          {/* Quick Object Selection Chips */}
          <div className="object-chips">
            {allCelestialObjects.slice(0, 8).map((obj) => (
              <button
                key={obj.id}
                className={`object-chip ${selectedObject?.id === obj.id ? 'active' : ''}`}
                onClick={() => setSelectedObject(obj)}
              >
                {obj.category === 'STAR'
                  ? '★ '
                  : obj.category === 'BLACK_HOLE'
                  ? '◎ '
                  : obj.category === 'PLANET'
                  ? '● '
                  : '✦ '}
                {obj.name}
              </button>
            ))}
          </div>

          <div className="right-divider" />

          {/* Discovery Log & Mission Objectives */}
          <div className="readout-heading">
            DISCOVERY LOG & OBJECTIVES <span>SECTOR TASKS</span>
          </div>

          <div className="objective-list">
            {objectives.map((obj) => (
              <div
                key={obj.id}
                className="objective-item"
                onClick={() => toggleObjective(obj.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ marginTop: '2px', color: obj.completed ? '#55e8d1' : '#687b92' }}>
                  {obj.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </div>
                <div>
                  <strong
                    style={{
                      textDecoration: obj.completed ? 'line-through' : 'none',
                      color: obj.completed ? '#8da0b6' : '#e7edf6',
                    }}
                  >
                    {obj.title}
                  </strong>
                  <small>{obj.description}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="right-divider" />

          {/* Live Telemetry Readouts */}
          <div className="readout-heading">
            LIVE METRICS <span>ASTROPHYSICAL</span>
          </div>
          <Readout
            label="SPACETIME CURVATURE"
            value={(params.gravity * 0.0873).toFixed(3)}
            unit="κ"
          />
          <Readout
            label="ENTROPY DENSITY"
            value={(params.chaos * 1.43).toFixed(1)}
            unit="S/k"
          />
          <Readout
            label="VACUUM ENERGY"
            value={(params.energy * 0.0062).toFixed(3)}
            unit="ρ"
          />
          <Readout
            label="TIME MULTIPLIER"
            value={(params.time / 50).toFixed(2)}
            unit="×"
          />

          <div className="signal-heading">
            <AudioLines size={14} /> QUANTUM TELEMETRY LINK{' '}
            <strong>99.4%</strong>
          </div>
          <div className="signal-track">
            <span />
          </div>
          <div className="signal-caption">LINK STABLE · CARRIER LOCK ACTIVE</div>

          <div className="observation-card">
            <div className="observation-icon">
              <Sparkles size={15} />
            </div>
            <div>
              <strong>PROCEDURAL OBSERVER</strong>
              <p>
                Every universe generated with Gemini constructs real 3D entities in
                Three.js with orbital physics.
              </p>
            </div>
          </div>

          <div className="system-footer">
            <span>
              VOID CORE <b>● ONLINE</b>
            </span>
            <span>
              LATENCY <b>{healthInfo ? '8MS' : 'OFFLINE'}</b>
            </span>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="footer">
        <span>THE VOID © 2025–26 — AI UNIVERSE SIMULATOR</span>
        <span>
          HOSTED AI PROVIDER: GOOGLE GEMINI{' '}
          <span className="footer-star">✳</span>
        </span>
        <span>NOTHING IS FIXED. EVERYTHING IS POSSIBLE.</span>
      </footer>
    </main>
  );
}

function Slider({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="slider-block">
      <div className="slider-top">
        <span>
          {icon}
          {label}
        </span>
        <strong>
          {value}
          <small>%</small>
        </strong>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--range-progress': `${value}%` } as React.CSSProperties}
        aria-label={label}
      />
      <div className="slider-scale">
        <span>MIN</span>
        <span>MAX</span>
      </div>
    </div>
  );
}

function Telemetry({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="telemetry-card">
      <div className="telemetry-label">{label}</div>
      <div className="telemetry-value">{value}</div>
      <div className="mini-track">
        <span style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
      <div className="telemetry-foot">
        <span>0</span>
        <span>MAX</span>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="readout">
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
    </div>
  );
}

export default App;
