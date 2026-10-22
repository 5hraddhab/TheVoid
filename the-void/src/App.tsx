import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {
  Activity, AudioLines, CircleHelp, Crosshair, Gauge, Globe2, Orbit,
  Pause, Play, Radio, RotateCcw, Sparkles, Zap
} from 'lucide-react';

type Mode = 'SINGULARITY' | 'GENESIS' | 'WORMHOLE' | 'ENTROPY';
type Params = { gravity: number; chaos: number; energy: number; time: number };
type UniverseState = { mode: Mode; params: Params; paused: boolean; seed: number };

const DEFAULT_PARAMS: Params = { gravity: 68, chaos: 34, energy: 72, time: 50 };
const MODES: { id: Mode; subtitle: string; color: string }[] = [
  { id: 'SINGULARITY', subtitle: 'GRAVITATIONAL COLLAPSE', color: '#9d79ff' },
  { id: 'GENESIS', subtitle: 'COSMIC INFLATION', color: '#55e8d1' },
  { id: 'WORMHOLE', subtitle: 'SPACETIME TOPOLOGY', color: '#ff9f70' },
  { id: 'ENTROPY', subtitle: 'THERMODYNAMIC DECAY', color: '#ff668e' },
];

function Universe({ state, onSelectMode }: { state: UniverseState; onSelectMode: (mode: Mode) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const onSelectRef = useRef(onSelectMode);
  stateRef.current = state;
  onSelectRef.current = onSelectMode;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05070b');
    scene.fog = new THREE.FogExp2('#05070b', 0.006);
    const camera = new THREE.PerspectiveCamera(60, host.clientWidth / host.clientHeight, 0.1, 1500);
    camera.position.set(0, 0, 34);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    // First-person flight controls: click the canvas to capture the mouse.
    const controls = new PointerLockControls(camera, renderer.domElement);
    const keys = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      if (controls.isLocked && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ControlLeft', 'ControlRight'].includes(event.code)) {
        event.preventDefault();
      }
      keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const onCanvasClick = () => {
      if (!controls.isLocked) controls.lock();
    };
    renderer.domElement.addEventListener('click', onCanvasClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    controls.addEventListener('unlock', () => keys.clear());

    const root = new THREE.Group();
    scene.add(root);

    // Star field.
    const starCount = 5200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const radius = 12 + Math.random() * 190;
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const phi = Math.acos(u);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.5 + Math.random() * 2.1;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    const starMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#b9d5ff') }, uEnergy: { value: 1 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        uniform float uEnergy;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.09 + aPhase) * 0.15;
          p.y += cos(uTime * 0.07 + aPhase) * 0.12;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (260.0 / max(1.0, -mvPosition.z)) * (0.7 + uEnergy * 0.55);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 0.35 + 0.65 * abs(sin(uTime * 0.6 + aPhase));
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, glow * vAlpha);
        }`,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    root.add(stars);

    // Glowing central object and its accretion rings.
    const coreMaterial = new THREE.MeshBasicMaterial({ color: '#8e68ff' });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 5), coreMaterial);
    root.add(core);
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(1.38, 48, 48),
      new THREE.MeshBasicMaterial({ color: '#030307' }),
    );
    root.add(inner);

    const rings = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.3 + i * 0.62, 0.018 + i * 0.002, 8, 180),
        new THREE.MeshBasicMaterial({ color: ['#9d79ff', '#5e8cff', '#ff8bd2', '#55e8d1', '#9d79ff'][i], transparent: true, opacity: 0.62 - i * 0.07 }),
      );
      ring.rotation.x = 0.85 + i * 0.12;
      ring.rotation.y = i * 0.31;
      rings.add(ring);
    }
    root.add(rings);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 48, 48),
      new THREE.MeshBasicMaterial({ color: '#6f48ff', transparent: true, opacity: 0.055, side: THREE.BackSide }),
    );
    root.add(halo);

    const grid = new THREE.GridHelper(260, 90, '#25324b', '#121b2a');
    grid.position.y = -19;
    grid.material.transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    root.add(grid);

    // Nebula clouds built from transparent points.
    const nebulaPositions = new Float32Array(1600 * 3);
    for (let i = 0; i < 1600; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.random() * 27;
      nebulaPositions[i * 3] = Math.cos(angle) * radius;
      nebulaPositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      nebulaPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const nebulaGeo = new THREE.BufferGeometry();
    nebulaGeo.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    const nebula = new THREE.Points(nebulaGeo, new THREE.PointsMaterial({ color: '#6546a8', size: 0.28, transparent: true, opacity: 0.3, depthWrite: false }));
    root.add(nebula);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickables: THREE.Object3D[] = [core, ...rings.children];
    const onDoubleClick = (event: MouseEvent) => {
      if (controls.isLocked) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickables, false)[0];
      if (hit) {
        const current = stateRef.current.mode;
        const next: Mode = current === 'SINGULARITY' ? 'WORMHOLE' : current === 'WORMHOLE' ? 'GENESIS' : current === 'GENESIS' ? 'ENTROPY' : 'SINGULARITY';
        onSelectRef.current(next);
      }
    };
    renderer.domElement.addEventListener('dblclick', onDoubleClick);

    let frame = 0;
    let elapsed = 0;
    let last = performance.now();
    let pointerX = 0;
    let pointerY = 0;
    const onMouseMove = (event: MouseEvent) => {
      if (controls.isLocked) return;
      pointerX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerY = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      const s = stateRef.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!s.paused) elapsed += dt * (s.params.time / 50);

      // Move through the universe while the mouse is captured.
      if (controls.isLocked && !s.paused) {
        const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 0.32 : 0.12;
        if (keys.has('KeyW')) controls.moveForward(speed);
        if (keys.has('KeyS')) controls.moveForward(-speed);
        if (keys.has('KeyA')) controls.moveRight(-speed);
        if (keys.has('KeyD')) controls.moveRight(speed);
        if (keys.has('Space')) camera.position.y += speed;
        if (keys.has('ControlLeft') || keys.has('ControlRight')) camera.position.y -= speed;
      }

      const mode = s.mode;
      const palette: Record<Mode, string> = {
        SINGULARITY: '#9d79ff', GENESIS: '#55e8d1', WORMHOLE: '#ff9f70', ENTROPY: '#ff668e',
      };
      const color = new THREE.Color(palette[mode]);
      coreMaterial.color.copy(color);
      (inner.material as THREE.MeshBasicMaterial).color.set(mode === 'SINGULARITY' ? '#030307' : '#090b14');
      starMaterial.uniforms.uTime.value = elapsed;
      starMaterial.uniforms.uColor.value.copy(color).lerp(new THREE.Color('#b9d5ff'), 0.6);
      starMaterial.uniforms.uEnergy.value = s.params.energy / 100;
      starMaterial.uniforms.uColor.value = color;
      core.scale.setScalar(0.82 + Math.sin(elapsed * (1 + s.params.chaos / 40)) * 0.06 + s.params.energy / 100 * 0.24);
      core.rotation.x += dt * (0.15 + s.params.chaos / 300);
      core.rotation.y += dt * (0.22 + s.params.chaos / 220);
      rings.rotation.z += dt * (mode === 'WORMHOLE' ? 0.8 : 0.12 + s.params.gravity / 220);
      rings.rotation.x = Math.sin(elapsed * 0.18) * 0.12;
      halo.scale.setScalar(1 + Math.sin(elapsed * 0.7) * 0.04 + s.params.energy / 500);
      nebula.rotation.y += dt * (0.012 + s.params.chaos / 5000);
      stars.rotation.y += dt * 0.002;
      if (!controls.isLocked) {
        root.rotation.y += (pointerX * 0.13 - root.rotation.y) * 0.018;
        root.rotation.x += (-pointerY * 0.09 - root.rotation.x) * 0.018;
      }
      if (mode === 'GENESIS') {
        stars.scale.setScalar(1 + Math.sin(elapsed * 0.7) * 0.05);
        rings.scale.setScalar(1 + Math.sin(elapsed * 0.5) * 0.1);
      } else if (mode === 'ENTROPY') {
        stars.scale.setScalar(1 + Math.sin(elapsed * 2.4) * 0.035);
        rings.scale.setScalar(0.94 + Math.sin(elapsed * 0.9) * 0.08);
      } else if (mode === 'WORMHOLE') {
        rings.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.14);
        stars.scale.setScalar(1);
      } else {
        rings.scale.setScalar(1);
        stars.scale.setScalar(1);
      }
      renderer.render(scene, camera);
    };
    animate(performance.now());

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      controls.unlock();
      renderer.domElement.removeEventListener('click', onCanvasClick);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      keys.clear();
      starGeometry.dispose();
      starMaterial.dispose();
      core.geometry.dispose();
      coreMaterial.dispose();
      inner.geometry.dispose();
      (inner.material as THREE.Material).dispose();
      rings.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      halo.geometry.dispose();
      (halo.material as THREE.Material).dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      nebulaGeo.dispose();
      (nebula.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="universe-canvas" ref={hostRef} aria-label="Interactive 3D universe" />;
}

function App() {
  const [mode, setMode] = useState<Mode>('SINGULARITY');
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(847291);
  const [prompt, setPrompt] = useState('');
  const [promptMessage, setPromptMessage] = useState('SYSTEM ONLINE — AWAITING COSMIC PARAMETERS');
  const [showHelp, setShowHelp] = useState(false);
  const [discoveries, setDiscoveries] = useState(0);

  const changeParam = (key: keyof Params, value: number) => setParams((p) => ({ ...p, [key]: value }));
  const reset = () => {
    setMode('SINGULARITY');
    setParams(DEFAULT_PARAMS);
    setPaused(false);
    setSeed(Math.floor(100000 + Math.random() * 900000));
    setPromptMessage('UNIVERSE REINITIALIZED — NEW SEED GENERATED');
    setDiscoveries(0);
  };
  const generate = useCallback(() => {
    const text = prompt.trim().toLowerCase();
    if (!text) {
      setPromptMessage('ENTER A COSMIC IDEA TO GENERATE A WORLD');
      return;
    }
    if (/wormhole|portal|tunnel|fold/.test(text)) {
      setMode('WORMHOLE'); setParams({ gravity: 54, chaos: 78, energy: 84, time: 32 });
      setPromptMessage('WORLD GENERATED: NON-EUCLIDEAN SPACETIME');
    } else if (/birth|genesis|create|life|bright|expan/.test(text)) {
      setMode('GENESIS'); setParams({ gravity: 28, chaos: 44, energy: 96, time: 68 });
      setPromptMessage('WORLD GENERATED: COSMIC INFLATION EVENT');
    } else if (/decay|entropy|death|cold|end|collapse/.test(text)) {
      setMode('ENTROPY'); setParams({ gravity: 72, chaos: 91, energy: 22, time: 88 });
      setPromptMessage('WORLD GENERATED: THERMODYNAMIC DECAY');
    } else if (/black hole|gravity|singular|dense|dark/.test(text)) {
      setMode('SINGULARITY'); setParams({ gravity: 96, chaos: 24, energy: 65, time: 24 });
      setPromptMessage('WORLD GENERATED: EXTREME GRAVITATIONAL WELL');
    } else {
      const n = text.split('').reduce((a, c) => a + c.charCodeAt(0), seed);
      const modes: Mode[] = ['SINGULARITY', 'GENESIS', 'WORMHOLE', 'ENTROPY'];
      setMode(modes[n % modes.length]);
      setParams({
        gravity: 18 + (n * 7 % 80),
        chaos: 10 + (n * 13 % 90),
        energy: 12 + (n * 17 % 88),
        time: 10 + (n * 19 % 90),
      });
      setPromptMessage('WORLD GENERATED FROM YOUR IDEA — PARAMETERS SYNTHESIZED');
    }
    setSeed((s) => (s * 9301 + 49297) % 233280);
    setDiscoveries((d) => d + 1);
  }, [prompt, seed]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Orbit size={19} /></div><div><div className="brand-name">THE VOID<span>®</span></div><div className="brand-sub">PROCEDURAL UNIVERSE ENGINE</div></div></div>
        <div className="top-status"><span className="live-dot" /> SIMULATION ACTIVE <span className="status-divider">/</span> BUILD 0.2.0</div>
        <button className="icon-button help-button" onClick={() => setShowHelp((v) => !v)} aria-label="Toggle help"><CircleHelp size={17} /></button>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="section-kicker"><span>01</span> REALITY CONFIGURATION</div>
          <div className="mode-list">
            {MODES.map((m) => <button key={m.id} className={`mode-card ${mode === m.id ? 'selected' : ''}`} onClick={() => setMode(m.id)} style={{ '--mode-color': m.color } as React.CSSProperties}>
              <span className="mode-symbol">{m.id === 'SINGULARITY' ? <Crosshair size={17} /> : m.id === 'GENESIS' ? <Sparkles size={17} /> : m.id === 'WORMHOLE' ? <Orbit size={17} /> : <Activity size={17} />}</span>
              <span className="mode-copy"><strong>{m.id}</strong><small>{m.subtitle}</small></span>
              <span className="mode-state">{mode === m.id ? '●' : '○'}</span>
            </button>)}
          </div>

          <div className="section-kicker sliders-kicker"><span>02</span> UNIVERSAL CONSTANTS</div>
          <Slider label="GRAVITY" value={params.gravity} onChange={(v) => changeParam('gravity', v)} icon={<Orbit size={14} />} />
          <Slider label="CHAOS INDEX" value={params.chaos} onChange={(v) => changeParam('chaos', v)} icon={<Activity size={14} />} />
          <Slider label="DARK ENERGY" value={params.energy} onChange={(v) => changeParam('energy', v)} icon={<Zap size={14} />} />
          <Slider label="TIME DILATION" value={params.time} onChange={(v) => changeParam('time', v)} icon={<Gauge size={14} />} />

          <div className="sidebar-bottom">
            <div className="seed-row"><span>UNIVERSE SEED</span><strong>{seed.toString().padStart(6, '0')}</strong></div>
            <div className="seed-row"><span>DISCOVERIES</span><strong>{discoveries.toString().padStart(3, '0')}</strong></div>
            <button className="reset-button" onClick={reset}><RotateCcw size={13} /> RESET SIMULATION</button>
          </div>
        </aside>

        <section className="main-stage">
          <div className="stage-heading"><div><div className="stage-eyebrow">OBSERVATION CHAMBER <span> / SECTOR 7G</span></div><h1>Reality is <em>editable.</em></h1></div><div className="coordinates"><span>COORDINATES</span><strong>0x{seed.toString(16).toUpperCase().slice(0, 4)} : 7F.29</strong></div></div>
          <div className="scene-panel">
            <Universe state={{ mode, params, paused, seed }} onSelectMode={setMode} />
            <div className="scene-topline"><span><span className="tiny-dot" /> LIVE RENDER</span><span>SECTOR {seed % 999} // UNMAPPED</span></div>
            <div className="scene-bottomline"><span>GRAVITATIONAL LENSING <b>ON</b></span><span>PARTICLES <b>5.2K</b></span><span>DIMENSION <b>3+1D</b></span></div>
            <div className="flight-hint"><span>◉ CLICK CANVAS TO ENTER FLIGHT MODE</span><span>WASD MOVE · MOUSE LOOK · SHIFT BOOST · SPACE/CTRL VERTICAL · ESC EXIT</span></div>
            {paused && <div className="pause-overlay"><div className="pause-symbol"><Pause size={25} /></div><strong>SIMULATION PAUSED</strong><span>TIME HAS NO MEANING HERE.</span></div>}
            {showHelp && <div className="help-popover"><button className="help-close" onClick={() => setShowHelp(false)}>×</button><strong>HOW TO EXPLORE</strong><p>Click the canvas to fly through the universe. Use WASD to move, move your mouse to look around, hold Shift to boost, Space to rise and Ctrl to descend. Press Esc to release the mouse.</p><p>Double-click the central object before entering flight mode to cycle reality types. Adjust the universal constants to alter the simulation.</p></div>}
          </div>

          <div className="telemetry">
            <Telemetry label="GRAVITY WELL" value={`${params.gravity}%`} percent={params.gravity} />
            <Telemetry label="CHAOS INDEX" value={`${params.chaos}%`} percent={params.chaos} />
            <Telemetry label="ENERGY DENSITY" value={`${params.energy}%`} percent={params.energy} />
            <div className="telemetry-card"><div className="telemetry-label"><Radio size={12} /> ENGINE STATUS</div><div className="engine-value"><span className="live-dot" /> NOMINAL</div><div className="engine-note">ALL SYSTEMS OPERATIONAL</div></div>
          </div>

          <div className="generator-panel">
            <div className="generator-head"><div><Sparkles size={15} /><strong>IMAGINATION ENGINE</strong><span> / NATURAL LANGUAGE INTERFACE</span></div><span className="beta-tag">EXPERIMENTAL</span></div>
            <form className="prompt-form" onSubmit={(e) => { e.preventDefault(); generate(); }}>
              <span className="prompt-glyph">✳</span><input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe a universe... e.g. a dying star inside a time loop" aria-label="Describe a universe" /><button type="submit">GENERATE <span>↗</span></button>
            </form>
            <div className="generator-footer"><span><span className="tiny-dot" /> {promptMessage}</span><span>ENGINE V.0.2 // HEURISTIC MODE</span></div>
          </div>
          <div className="quick-prompts"><span>TRY A CONCEPT</span>{['A portal to a parallel universe', 'The birth of a new galaxy', 'The heat death of everything'].map((p) => <button key={p} onClick={() => { setPrompt(p); }}><span>↗</span> {p}</button>)}</div>
        </section>

        <aside className="rightbar">
          <div className="section-kicker"><span>03</span> MISSION CONTROL</div>
          <div className="mission-state"><div className="mission-orb"><Globe2 size={24} /></div><div><strong>{mode}</strong><span>REALITY CLASS</span></div></div>
          <p className="mission-description">{mode === 'SINGULARITY' ? 'A region of spacetime where gravity is so intense that nothing, not even light, can escape.' : mode === 'GENESIS' ? 'A rapidly expanding cosmos where matter and energy begin to organize into new structures.' : mode === 'WORMHOLE' ? 'A theoretical bridge connecting distant points in spacetime through a traversable tunnel.' : 'A universe trending toward maximum entropy, where usable energy fades into equilibrium.'}</p>
          <div className="right-divider" />
          <div className="readout-heading">LIVE READOUT <span>REAL-TIME</span></div>
          <Readout label="SPACETIME CURVATURE" value={(params.gravity * 0.0873).toFixed(3)} unit="κ" />
          <Readout label="ENTROPY LEVEL" value={(params.chaos * 1.43).toFixed(1)} unit="S/k" />
          <Readout label="VACUUM ENERGY" value={(params.energy * 0.0062).toFixed(3)} unit="ρ" />
          <Readout label="TIME RATE" value={(params.time / 50).toFixed(2)} unit="×" />
          <div className="right-divider" />
          <div className="signal-heading"><AudioLines size={14} /> SIGNAL INTEGRITY <strong>98.7%</strong></div>
          <div className="signal-track"><span /></div>
          <div className="signal-caption">QUANTUM LINK STABLE</div>
          <div className="right-spacer" />
          <div className="observation-card"><div className="observation-icon"><Sparkles size={15} /></div><div><strong>OBSERVER EFFECT</strong><p>Your observation influences the state of this simulated reality. Experiment freely.</p></div></div>
          <div className="system-footer"><span>VOID CORE <b>● ONLINE</b></span><span>LATENCY <b>12MS</b></span></div>
        </aside>
      </div>
      <footer className="footer"><span>THE VOID © 2025–26</span><span>BUILT FOR THE CURIOUS <span className="footer-star">✳</span></span><span>NOTHING IS FIXED. EVERYTHING IS POSSIBLE.</span></footer>
    </main>
  );
}

function Slider({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon: React.ReactNode }) {
  return <div className="slider-block"><div className="slider-top"><span>{icon}{label}</span><strong>{value}<small>%</small></strong></div><input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ '--range-progress': `${value}%` } as React.CSSProperties} aria-label={label} /><div className="slider-scale"><span>MIN</span><span>MAX</span></div></div>;
}
function Telemetry({ label, value, percent }: { label: string; value: string; percent: number }) {
  return <div className="telemetry-card"><div className="telemetry-label">{label}</div><div className="telemetry-value">{value}</div><div className="mini-track"><span style={{ width: `${percent}%` }} /></div><div className="telemetry-foot"><span>0</span><span>100</span></div></div>;
}
function Readout({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div className="readout"><span>{label}</span><strong>{value}<small>{unit}</small></strong></div>;
}

export default App;
