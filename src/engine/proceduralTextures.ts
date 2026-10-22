import * as THREE from 'three';
import type { PlanetType } from '../types/universe';

// Generates procedural surface canvas textures for planets based on their type and colors
export function createPlanetTexture(type: PlanetType, baseColorHex: string, secondaryColorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const base = baseColorHex;
  const sec = secondaryColorHex;

  // Background
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (type === 'gas_giant') {
    // Jupiter-like bands and storm swirls
    const numBands = 24;
    for (let i = 0; i < numBands; i++) {
      const y = (i / numBands) * canvas.height;
      const h = canvas.height / numBands;
      ctx.fillStyle = i % 2 === 0 ? sec : base;
      ctx.globalAlpha = 0.45 + (Math.sin(i * 1.5) * 0.3);
      ctx.fillRect(0, y, canvas.width, h);
    }
    // Great storm spot
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = sec;
    ctx.beginPath();
    ctx.ellipse(320, 160, 48, 22, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'ocean_world' || type === 'terrestrial') {
    // Continents / islands
    ctx.fillStyle = sec;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 18; i++) {
      const cx = (Math.sin(i * 99) * 0.5 + 0.5) * canvas.width;
      const cy = (Math.cos(i * 33) * 0.5 + 0.5) * canvas.height;
      const r = 25 + (i * 7) % 55;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cloud swirls
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.28;
    for (let y = 30; y < canvas.height; y += 45) {
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, y, canvas.width * 0.45, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'lava_world') {
    // Dark crust with glowing lava fissures
    ctx.fillStyle = '#14080a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = base;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      let x = (i * 37) % canvas.width;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < canvas.height) {
        x += (Math.random() - 0.5) * 40;
        y += 20 + Math.random() * 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  } else if (type === 'ice_world') {
    // Crystalline fracture lines and pale polar gradients
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = sec;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  } else {
    // Crystalline / Desert / default noise patches
    ctx.fillStyle = sec;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const s = 15 + Math.random() * 40;
      ctx.fillRect(x, y, s, s);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Procedural swirl texture for accretion disks
export function createAccretionDiskTexture(primaryColor: string, secondaryColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // Radial gradient from transparent to blazing plasma to outer edge
  const gradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, 250);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.25, primaryColor);
  gradient.addColorStop(0.65, secondaryColor);
  gradient.addColorStop(0.9, primaryColor);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Concentric spiral ripples
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  for (let r = 80; r < 240; r += 12) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
