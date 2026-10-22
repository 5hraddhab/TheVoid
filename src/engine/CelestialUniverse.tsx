import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import type { UniverseBlueprint } from '../types/universe';
import { createPlanetTexture, createAccretionDiskTexture } from './proceduralTextures';

export interface SelectedCelestialObject {
  id: string;
  name: string;
  category: 'STAR' | 'BLACK_HOLE' | 'PLANET' | 'MOON' | 'ANOMALY' | 'POI';
  details: string;
  coordinates: [number, number, number];
  color: string;
  distance?: number;
}

interface CelestialUniverseProps {
  blueprint: UniverseBlueprint;
  paused: boolean;
  onSelectObject: (obj: SelectedCelestialObject | null) => void;
  onTelemetryUpdate?: (telemetry: {
    coordinates: [number, number, number];
    speed: number;
    nearestObject?: string;
    distanceToNearest?: number;
  }) => void;
}

export function CelestialUniverse({
  blueprint,
  paused,
  onSelectObject,
  onTelemetryUpdate,
}: CelestialUniverseProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const blueprintRef = useRef(blueprint);
  const onSelectRef = useRef(onSelectObject);
  const onTelemetryRef = useRef(onTelemetryUpdate);

  pausedRef.current = paused;
  blueprintRef.current = blueprint;
  onSelectRef.current = onSelectObject;
  onTelemetryRef.current = onTelemetryUpdate;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const currentTheme = blueprint.theme;
    scene.background = new THREE.Color(currentTheme.background || '#04060b');
    scene.fog = new THREE.FogExp2(
      currentTheme.fogColor || '#070a14',
      currentTheme.fogDensity || 0.0035
    );

    const camera = new THREE.PerspectiveCamera(
      60,
      host.clientWidth / host.clientHeight,
      0.1,
      2500
    );
    // Initial pilot view position overlooking the sector
    camera.position.set(0, 14, 48);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    host.appendChild(renderer.domElement);

    // 2. Flight Controls (PointerLockControls)
    const controls = new PointerLockControls(camera, renderer.domElement);
    const keys = new Set<string>();

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        controls.isLocked &&
        ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight'].includes(
          event.code
        )
      ) {
        event.preventDefault();
      }
      keys.add(event.code);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys.delete(event.code);
    };

    const onCanvasClick = () => {
      if (!controls.isLocked) {
        controls.lock();
      }
    };

    renderer.domElement.addEventListener('click', onCanvasClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    controls.addEventListener('unlock', () => {
      keys.clear();
    });

    // Root node for all celestial entities
    const celestialRoot = new THREE.Group();
    scene.add(celestialRoot);

    // Dynamic objects to animate during the render loop
    interface Updatable {
      update: (elapsed: number, dt: number) => void;
      dispose: () => void;
    }
    const updatables: Updatable[] = [];

    // Interactive pickable items for raycasting selection
    interface PickableItem {
      mesh: THREE.Object3D;
      meta: SelectedCelestialObject;
    }
    const pickables: PickableItem[] = [];

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(
      currentTheme.ambientColor || '#151b2e',
      1.2
    );
    scene.add(ambientLight);

    // Directional celestial key light
    const keyLight = new THREE.DirectionalLight('#ffffff', 0.8);
    keyLight.position.set(50, 40, 30);
    scene.add(keyLight);

    // 3. Starfield Particles
    const starfieldSpec = currentTheme.starfield || {
      count: 5500,
      baseColor: '#b4caff',
      secondaryColor: '#9d79ff',
      speed: 0.002,
    };
    const starCount = starfieldSpec.count;
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starPhases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 25 + Math.random() * 260;
      const theta = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const phi = Math.acos(u);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      starSizes[i] = 0.6 + Math.random() * 2.2;
      starPhases[i] = Math.random() * Math.PI * 2;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));

    const starMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(starfieldSpec.baseColor) },
        uSecColor: { value: new THREE.Color(starfieldSpec.secondaryColor) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (280.0 / max(1.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 0.35 + 0.65 * abs(sin(uTime * 0.8 + aPhase));
        }
      `,
      fragmentShader: `
        uniform vec3 uBaseColor;
        uniform vec3 uSecColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, d);
          vec3 col = mix(uBaseColor, uSecColor, sin(vAlpha * 3.1415) * 0.5 + 0.5);
          gl_FragColor = vec4(col, glow * vAlpha);
        }
      `,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    celestialRoot.add(stars);

    // 4. Reference Spacetime Grid
    const grid = new THREE.GridHelper(300, 75, '#25324b', '#0e1624');
    grid.position.y = -26;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.18;
    celestialRoot.add(grid);

    // 5. Populate Stars
    const starMap = new Map<string, THREE.Vector3>();

    blueprint.stars.forEach((starSpec) => {
      const starGroup = new THREE.Group();
      const pos = new THREE.Vector3(
        starSpec.position[0] || 0,
        starSpec.position[1] || 0,
        starSpec.position[2] || 0
      );
      starGroup.position.copy(pos);
      starMap.set(starSpec.id, pos);

      // Star core
      const coreGeo = new THREE.SphereGeometry(starSpec.size, 36, 36);
      const coreMat = new THREE.MeshBasicMaterial({
        color: starSpec.color,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      starGroup.add(coreMesh);

      // Corona halo
      const coronaGeo = new THREE.SphereGeometry(starSpec.size * (starSpec.coronaSize ? starSpec.coronaSize / 3 : 1.6), 32, 32);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: starSpec.emissiveColor,
        transparent: true,
        opacity: 0.28,
        side: THREE.BackSide,
      });
      const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      starGroup.add(coronaMesh);

      // Star light source
      const starLight = new THREE.PointLight(
        starSpec.color,
        starSpec.lightIntensity || 3.0,
        350,
        1.2
      );
      starGroup.add(starLight);

      // Equator energy rings
      const ringGeo = new THREE.TorusGeometry(starSpec.size * 1.8, 0.04, 8, 80);
      const ringMat = new THREE.MeshBasicMaterial({
        color: starSpec.emissiveColor,
        transparent: true,
        opacity: 0.5,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.4;
      starGroup.add(ringMesh);

      celestialRoot.add(starGroup);

      // Register for click selection
      pickables.push({
        mesh: coreMesh,
        meta: {
          id: starSpec.id,
          name: starSpec.name,
          category: 'STAR',
          details: `Type: ${starSpec.type.toUpperCase().replace('_', ' ')} • Radiance: ${starSpec.lightIntensity} GW • Core Radius: ${starSpec.size.toFixed(1)} AU`,
          coordinates: [pos.x, pos.y, pos.z],
          color: starSpec.color,
        },
      });

      updatables.push({
        update: (elapsed) => {
          const pulse = Math.sin(elapsed * (starSpec.pulseSpeed || 1.0)) * 0.06;
          coronaMesh.scale.setScalar(1 + pulse);
          ringMesh.rotation.z += 0.008;
          coreMesh.rotation.y += 0.004;
        },
        dispose: () => {
          coreGeo.dispose();
          coreMat.dispose();
          coronaGeo.dispose();
          coronaMat.dispose();
          ringGeo.dispose();
          ringMat.dispose();
        },
      });
    });

    // 6. Populate Black Holes & Singularities
    blueprint.blackHoles.forEach((bh) => {
      const bhGroup = new THREE.Group();
      const pos = new THREE.Vector3(bh.position[0] || 0, bh.position[1] || 0, bh.position[2] || 0);
      bhGroup.position.copy(pos);

      // Absolute black event horizon sphere
      const ehGeo = new THREE.SphereGeometry(bh.eventHorizonRadius, 48, 48);
      const ehMat = new THREE.MeshBasicMaterial({ color: '#000002' });
      const ehMesh = new THREE.Mesh(ehGeo, ehMat);
      bhGroup.add(ehMesh);

      // Luminous photon ring / gravitational lens halo
      const lensGeo = new THREE.SphereGeometry(bh.eventHorizonRadius * 1.14, 40, 40);
      const lensMat = new THREE.MeshBasicMaterial({
        color: bh.secondaryDiskColor || '#55e8d1',
        transparent: true,
        opacity: 0.35,
        side: THREE.BackSide,
      });
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      bhGroup.add(lensMesh);

      // Swirling Accretion Disk
      const diskGeo = new THREE.RingGeometry(
        bh.accretionDiskInnerRadius,
        bh.accretionDiskOuterRadius,
        96,
        1
      );
      // Tilt disk realistically
      diskGeo.rotateX(-Math.PI / 2.6);

      const diskTexture = createAccretionDiskTexture(
        bh.accretionDiskColor || '#9d79ff',
        bh.secondaryDiskColor || '#55e8d1'
      );
      const diskMat = new THREE.MeshBasicMaterial({
        map: diskTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const diskMesh = new THREE.Mesh(diskGeo, diskMat);
      bhGroup.add(diskMesh);

      // Secondary perpendicular relativistic warp ring
      const warpGeo = new THREE.TorusGeometry(bh.accretionDiskOuterRadius * 0.85, 0.08, 12, 120);
      const warpMat = new THREE.MeshBasicMaterial({
        color: bh.accretionDiskColor,
        transparent: true,
        opacity: 0.5,
      });
      const warpMesh = new THREE.Mesh(warpGeo, warpMat);
      warpMesh.rotation.y = Math.PI / 3;
      bhGroup.add(warpMesh);

      celestialRoot.add(bhGroup);

      pickables.push({
        mesh: ehMesh,
        meta: {
          id: bh.id,
          name: bh.name,
          category: 'BLACK_HOLE',
          details: `Event Horizon: ${bh.eventHorizonRadius} R_s • Relativistic Disk: ${bh.accretionDiskOuterRadius.toFixed(1)} AU • Distortion Index: ${bh.distortionStrength}κ`,
          coordinates: [pos.x, pos.y, pos.z],
          color: bh.accretionDiskColor || '#9d79ff',
        },
      });

      updatables.push({
        update: (elapsed, dt) => {
          diskMesh.rotation.z += dt * (bh.rotationSpeed || 0.4);
          warpMesh.rotation.x += dt * 0.15;
          warpMesh.rotation.z += dt * 0.2;
          const pulse = Math.sin(elapsed * 2.2) * 0.05;
          lensMesh.scale.setScalar(1 + pulse);
        },
        dispose: () => {
          ehGeo.dispose();
          ehMat.dispose();
          lensGeo.dispose();
          lensMat.dispose();
          diskGeo.dispose();
          diskMat.dispose();
          diskTexture.dispose();
          warpGeo.dispose();
          warpMat.dispose();
        },
      });
    });

    // 7. Populate Planetary Systems & Moons
    blueprint.planets.forEach((planetSpec) => {
      // Find orbit center position
      let centerPos = new THREE.Vector3(0, 0, 0);
      if (planetSpec.orbitCenterStarId && starMap.has(planetSpec.orbitCenterStarId)) {
        centerPos = starMap.get(planetSpec.orbitCenterStarId)!;
      }

      // Orbital pivot group
      const orbitPivot = new THREE.Group();
      orbitPivot.position.copy(centerPos);
      orbitPivot.rotation.x = planetSpec.orbitInclination || 0;
      orbitPivot.rotation.z = (planetSpec.orbitInclination || 0) * 0.5;
      celestialRoot.add(orbitPivot);

      // Visual orbital path loop
      const pathCurve = new THREE.EllipseCurve(
        0, 0,
        planetSpec.orbitRadius, planetSpec.orbitRadius,
        0, 2 * Math.PI,
        false, 0
      );
      const pathPoints = pathCurve.getPoints(90);
      const pathGeo = new THREE.BufferGeometry().setFromPoints(
        pathPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
      );
      const pathMat = new THREE.LineBasicMaterial({
        color: planetSpec.color,
        transparent: true,
        opacity: 0.16,
      });
      const pathLine = new THREE.LineLoop(pathGeo, pathMat);
      orbitPivot.add(pathLine);

      // Planet body holder
      const planetHolder = new THREE.Group();
      planetHolder.position.set(planetSpec.orbitRadius, 0, 0);
      orbitPivot.add(planetHolder);

      // Planet Sphere Mesh
      const planetGeo = new THREE.SphereGeometry(planetSpec.size, 32, 32);
      const planetTexture = createPlanetTexture(
        planetSpec.type,
        planetSpec.color,
        planetSpec.secondaryColor
      );
      const planetMat = new THREE.MeshStandardMaterial({
        map: planetTexture,
        roughness: 0.65,
        metalness: 0.15,
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      planetHolder.add(planetMesh);

      // Atmosphere Fresnel glow (if applicable)
      let atmoMesh: THREE.Mesh | null = null;
      let atmoGeo: THREE.SphereGeometry | null = null;
      let atmoMat: THREE.MeshBasicMaterial | null = null;
      if (planetSpec.hasAtmosphere) {
        atmoGeo = new THREE.SphereGeometry(planetSpec.size * 1.15, 32, 32);
        atmoMat = new THREE.MeshBasicMaterial({
          color: planetSpec.atmosphereColor || planetSpec.color,
          transparent: true,
          opacity: 0.22,
          side: THREE.BackSide,
        });
        atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
        planetHolder.add(atmoMesh);
      }

      // Planetary Rings (if present)
      let ringsMesh: THREE.Mesh | null = null;
      let ringsGeo: THREE.RingGeometry | null = null;
      let ringsMat: THREE.MeshBasicMaterial | null = null;
      if (planetSpec.rings) {
        ringsGeo = new THREE.RingGeometry(
          planetSpec.rings.innerRadius,
          planetSpec.rings.outerRadius,
          64
        );
        ringsGeo.rotateX(Math.PI / 2.3);
        ringsMat = new THREE.MeshBasicMaterial({
          color: planetSpec.rings.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: planetSpec.rings.opacity || 0.6,
        });
        ringsMesh = new THREE.Mesh(ringsGeo, ringsMat);
        planetHolder.add(ringsMesh);
      }

      // Moons (if present)
      const moonUpdatables: { update: (elapsed: number, dt: number) => void; dispose: () => void }[] = [];
      if (planetSpec.moons && planetSpec.moons.length > 0) {
        planetSpec.moons.forEach((moon) => {
          const moonPivot = new THREE.Group();
          planetHolder.add(moonPivot);

          const moonGeo = new THREE.SphereGeometry(moon.size, 16, 16);
          const moonMat = new THREE.MeshStandardMaterial({
            color: moon.color,
            roughness: 0.8,
          });
          const moonMesh = new THREE.Mesh(moonGeo, moonMat);
          moonMesh.position.set(moon.orbitRadius, 0, 0);
          moonPivot.add(moonMesh);

          pickables.push({
            mesh: moonMesh,
            meta: {
              id: moon.id,
              name: moon.name,
              category: 'MOON',
              details: `Satellite of ${planetSpec.name} • Orbit: ${moon.orbitRadius.toFixed(1)}k km • Diameter: ${moon.size.toFixed(2)} Mm`,
              coordinates: [planetHolder.position.x, planetHolder.position.y, planetHolder.position.z],
              color: moon.color,
            },
          });

          moonUpdatables.push({
            update: (_elapsed, dt) => {
              moonPivot.rotation.y += dt * (moon.orbitSpeed || 0.6);
            },
            dispose: () => {
              moonGeo.dispose();
              moonMat.dispose();
            },
          });
        });
      }

      pickables.push({
        mesh: planetMesh,
        meta: {
          id: planetSpec.id,
          name: planetSpec.name,
          category: 'PLANET',
          details: `Class: ${planetSpec.type.toUpperCase()} • Radius: ${planetSpec.size.toFixed(1)} R_e • Atmosphere: ${planetSpec.hasAtmosphere ? 'Detected' : 'None'} • Moons: ${planetSpec.moons?.length || 0}`,
          coordinates: [planetHolder.position.x, planetHolder.position.y, planetHolder.position.z],
          color: planetSpec.color,
        },
      });

      updatables.push({
        update: (elapsed, dt) => {
          // Orbit around central star
          orbitPivot.rotation.y += dt * (planetSpec.orbitSpeed || 0.15);
          // Axial spin
          planetMesh.rotation.y += dt * (planetSpec.rotationSpeed || 0.3);
          if (ringsMesh) {
            ringsMesh.rotation.z += dt * 0.02;
          }
          moonUpdatables.forEach((m) => m.update(elapsed, dt));
        },
        dispose: () => {
          pathGeo.dispose();
          pathMat.dispose();
          planetGeo.dispose();
          planetMat.dispose();
          planetTexture.dispose();
          if (atmoGeo) atmoGeo.dispose();
          if (atmoMat) atmoMat.dispose();
          if (ringsGeo) ringsGeo.dispose();
          if (ringsMat) ringsMat.dispose();
          moonUpdatables.forEach((m) => m.dispose());
        },
      });
    });

    // 8. Asteroid Belts
    blueprint.asteroidBelts.forEach((belt) => {
      const beltGroup = new THREE.Group();
      const count = belt.count || 450;
      const rockGeo = new THREE.DodecahedronGeometry(0.3, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: belt.color || '#8892a0',
        roughness: 0.9,
        metalness: 0.1,
      });

      const instancedMesh = new THREE.InstancedMesh(rockGeo, rockMat, count);
      const dummy = new THREE.Object3D();

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = belt.innerRadius + Math.random() * (belt.outerRadius - belt.innerRadius);
        const y = (Math.random() - 0.5) * (belt.height || 4);

        dummy.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        const scale = 0.4 + Math.random() * 1.2;
        dummy.scale.set(scale, scale, scale);
        dummy.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      beltGroup.add(instancedMesh);
      celestialRoot.add(beltGroup);

      updatables.push({
        update: (_elapsed, dt) => {
          beltGroup.rotation.y += dt * (belt.orbitSpeed || 0.03);
        },
        dispose: () => {
          rockGeo.dispose();
          rockMat.dispose();
          instancedMesh.dispose();
        },
      });
    });

    // 9. Volumetric Nebulae
    blueprint.nebulae.forEach((neb) => {
      const count = neb.particleCount || 1200;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const colA = new THREE.Color(neb.color || '#6849b8');
      const colB = new THREE.Color(neb.secondaryColor || '#1d8b90');

      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const r = (neb.radius || 40) * Math.cbrt(u);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);

        positions[i * 3] = (neb.center[0] || 0) + r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = (neb.center[1] || 0) + (r * Math.cos(phi) * (neb.spread ? neb.spread / 40 : 0.6));
        positions[i * 3 + 2] = (neb.center[2] || 0) + r * Math.sin(phi) * Math.sin(theta);

        const mixed = colA.clone().lerp(colB, Math.random());
        colors[i * 3] = mixed.r;
        colors[i * 3 + 1] = mixed.g;
        colors[i * 3 + 2] = mixed.b;
      }

      const nebGeo = new THREE.BufferGeometry();
      nebGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      nebGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const nebMat = new THREE.PointsMaterial({
        size: 0.55,
        vertexColors: true,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const nebPoints = new THREE.Points(nebGeo, nebMat);
      celestialRoot.add(nebPoints);

      updatables.push({
        update: (_elapsed, dt) => {
          nebPoints.rotation.y += dt * (neb.driftSpeed || 0.015);
        },
        dispose: () => {
          nebGeo.dispose();
          nebMat.dispose();
        },
      });
    });

    // 10. Cosmic Anomalies & Spatial Rifts
    blueprint.anomalies.forEach((anomaly) => {
      const anomalyGroup = new THREE.Group();
      anomalyGroup.position.set(
        anomaly.position[0] || 0,
        anomaly.position[1] || 0,
        anomaly.position[2] || 0
      );

      let geo: THREE.BufferGeometry;
      if (anomaly.type === 'ancient_monolith') {
        geo = new THREE.BoxGeometry(0.8 * anomaly.scale, 3.2 * anomaly.scale, 0.4 * anomaly.scale);
      } else if (anomaly.type === 'quantum_storm') {
        geo = new THREE.IcosahedronGeometry(anomaly.scale, 1);
      } else {
        // Spatial rift / tachyon emitter
        geo = new THREE.OctahedronGeometry(anomaly.scale, 0);
      }

      const mat = new THREE.MeshBasicMaterial({
        color: anomaly.color || '#ff5983',
        wireframe: anomaly.type !== 'ancient_monolith',
        transparent: true,
        opacity: 0.85,
      });

      const mesh = new THREE.Mesh(geo, mat);
      anomalyGroup.add(mesh);

      // Pulsing energy halo
      const haloGeo = new THREE.SphereGeometry(anomaly.scale * 1.5, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: anomaly.color,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      anomalyGroup.add(haloMesh);

      celestialRoot.add(anomalyGroup);

      pickables.push({
        mesh,
        meta: {
          id: anomaly.id,
          name: anomaly.name,
          category: 'ANOMALY',
          details: `Type: ${anomaly.type.toUpperCase().replace('_', ' ')} • Signature: ${anomaly.lore}`,
          coordinates: [anomalyGroup.position.x, anomalyGroup.position.y, anomalyGroup.position.z],
          color: anomaly.color,
        },
      });

      updatables.push({
        update: (elapsed, dt) => {
          mesh.rotation.x += dt * 0.4;
          mesh.rotation.y += dt * 0.6;
          haloMesh.rotation.z -= dt * 0.2;
          const p = Math.sin(elapsed * (anomaly.pulseRate || 1.2)) * 0.15;
          haloMesh.scale.setScalar(1 + p);
        },
        dispose: () => {
          geo.dispose();
          mat.dispose();
          haloGeo.dispose();
          haloMat.dispose();
        },
      });
    });

    // 11. Points of Interest (POIs) & Beacons
    blueprint.pointsOfInterest.forEach((poi) => {
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(
        poi.coordinates[0] || 0,
        poi.coordinates[1] || 0,
        poi.coordinates[2] || 0
      );

      const beaconGeo = new THREE.ConeGeometry(0.6, 1.4, 4);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: '#55e8d1',
        wireframe: true,
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconGroup.add(beaconMesh);

      const pingGeo = new THREE.RingGeometry(0.8, 1.0, 32);
      pingGeo.rotateX(Math.PI / 2);
      const pingMat = new THREE.MeshBasicMaterial({
        color: '#55e8d1',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const pingMesh = new THREE.Mesh(pingGeo, pingMat);
      beaconGroup.add(pingMesh);

      celestialRoot.add(beaconGroup);

      pickables.push({
        mesh: beaconMesh,
        meta: {
          id: poi.id,
          name: poi.name,
          category: 'POI',
          details: `Designation: ${poi.type.toUpperCase()} • Telemetry: ${poi.description}`,
          coordinates: [beaconGroup.position.x, beaconGroup.position.y, beaconGroup.position.z],
          color: '#55e8d1',
        },
      });

      updatables.push({
        update: (elapsed, dt) => {
          beaconMesh.rotation.y += dt * 1.2;
          const pulse = (Math.sin(elapsed * 2) * 0.5 + 0.5);
          pingMesh.scale.setScalar(1 + pulse * 1.5);
          pingMat.opacity = 0.8 - pulse * 0.6;
        },
        dispose: () => {
          beaconGeo.dispose();
          beaconMat.dispose();
          pingGeo.dispose();
          pingMat.dispose();
        },
      });
    });

    // 12. Raycasting for Object Inspection & Targeting
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerClick = (event: MouseEvent) => {
      // Only trigger raycast selection if NOT locked in flight mode
      if (controls.isLocked) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const pickableMeshes = pickables.map((p) => p.mesh);
      const intersects = raycaster.intersectObjects(pickableMeshes, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        // Match back to pickable item
        const item = pickables.find(
          (p) => p.mesh === hit.object || Boolean(p.mesh.getObjectById(hit.object.id))
        );
        if (item) {
          const dist = camera.position.distanceTo(new THREE.Vector3(...item.meta.coordinates));
          onSelectRef.current({
            ...item.meta,
            distance: Math.round(dist * 10) / 10,
          });
        }
      }
    };
    renderer.domElement.addEventListener('click', onPointerClick);

    // 13. Subtle pointer-tracking parallax when flight mode is unlocked
    let pointerX = 0;
    let pointerY = 0;
    const onMouseMove = (event: MouseEvent) => {
      if (controls.isLocked) return;
      pointerX = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerY = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // 14. Main Animation & Telemetry Loop
    let animFrameId = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    let telemetryThrottle = 0;

    const animate = (now: number) => {
      animFrameId = requestAnimationFrame(animate);

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const bp = blueprintRef.current;
      const isPaused = pausedRef.current;

      if (!isPaused) {
        const timeMultiplier = (bp.physics?.time || 50) / 50;
        elapsed += dt * timeMultiplier;

        // Animate all active celestial bodies
        updatables.forEach((u) => u.update(elapsed, dt * timeMultiplier));
        starMaterial.uniforms.uTime.value = elapsed;
      }

      // Flight Controls Movement (when pointer lock is active)
      if (controls.isLocked && !isPaused) {
        const isBoosting = keys.has('ShiftLeft') || keys.has('ShiftRight');
        const speed = isBoosting ? 0.45 : 0.16;

        if (keys.has('KeyW')) controls.moveForward(speed);
        if (keys.has('KeyS')) controls.moveForward(-speed);
        if (keys.has('KeyA')) controls.moveRight(-speed);
        if (keys.has('KeyD')) controls.moveRight(speed);
        if (keys.has('Space')) camera.position.y += speed;
        if (keys.has('ControlLeft') || keys.has('ControlRight')) camera.position.y -= speed;
      }

      // Gentle parallax drifting when not locked
      if (!controls.isLocked) {
        celestialRoot.rotation.y += (pointerX * 0.08 - celestialRoot.rotation.y) * 0.02;
        celestialRoot.rotation.x += (-pointerY * 0.05 - celestialRoot.rotation.x) * 0.02;
      }

      // Periodic Telemetry Updates to parent component
      telemetryThrottle += dt;
      if (telemetryThrottle > 0.25) {
        telemetryThrottle = 0;
        if (onTelemetryRef.current) {
          const camPos: [number, number, number] = [
            Math.round(camera.position.x * 10) / 10,
            Math.round(camera.position.y * 10) / 10,
            Math.round(camera.position.z * 10) / 10,
          ];

          // Compute nearest celestial body
          let nearestName: string | undefined;
          let nearestDist = Infinity;
          for (const p of pickables) {
            const d = camera.position.distanceTo(new THREE.Vector3(...p.meta.coordinates));
            if (d < nearestDist) {
              nearestDist = d;
              nearestName = p.meta.name;
            }
          }

          onTelemetryRef.current({
            coordinates: camPos,
            speed: (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 240 : 80,
            nearestObject: nearestName,
            distanceToNearest: nearestDist !== Infinity ? Math.round(nearestDist * 10) / 10 : undefined,
          });
        }
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    // 15. Viewport Resizing
    const handleResize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 16. Comprehensive Cleanup on Unmount or Blueprint Change
    return () => {
      cancelAnimationFrame(animFrameId);
      controls.unlock();
      renderer.domElement.removeEventListener('click', onCanvasClick);
      renderer.domElement.removeEventListener('click', onPointerClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      keys.clear();

      // Dispose all updatable mesh resources
      updatables.forEach((u) => u.dispose());

      // Dispose common resources
      starGeometry.dispose();
      starMaterial.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      ambientLight.dispose();
      keyLight.dispose();

      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [blueprint]);

  return (
    <div
      className="universe-canvas"
      ref={hostRef}
      aria-label="Interactive AI Procedural Universe"
    />
  );
}
