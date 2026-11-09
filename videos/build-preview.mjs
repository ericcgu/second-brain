import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_INDEX = path.join(ROOT, 'site', 'index.html');
const BRAIN_PNG = path.join(ROOT, 'videos', 'digital-brain.png');
const OUT_HTML = path.join(ROOT, 'site', 'remotion-preview.html');

const siteHtml = fs.readFileSync(SITE_INDEX, 'utf8');
const brainB64 = fs.existsSync(BRAIN_PNG)
  ? `data:image/png;base64,${fs.readFileSync(BRAIN_PNG).toString('base64')}`
  : '';

const remotionPreviewAddon = `
<style>
  /* Remotion Studio Player Chrome */
  :root {
    --rm-bar-h: 112px;
    --rm-top-h: 52px;
  }
  body.rm-studio-active {
    padding-top: var(--rm-top-h) !important;
    padding-bottom: var(--rm-bar-h) !important;
    box-sizing: border-box !important;
  }
  body.rm-studio-active .app-shell,
  body.rm-studio-active #remocn-stage {
    top: var(--rm-top-h) !important;
    bottom: var(--rm-bar-h) !important;
    height: calc(100vh - var(--rm-top-h) - var(--rm-bar-h)) !important;
  }

  #rm-topbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--rm-top-h);
    background: #141417;
    border-bottom: 1px solid #27272c;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 2000000;
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #f4f4f6;
    user-select: none;
  }
  .rm-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
  }
  .rm-badge {
    background: #0b84f3;
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 5px;
    letter-spacing: 0.02em;
  }
  .rm-meta {
    color: #8e8e98;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
  }
  .rm-scene-pills {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
  }
  .rm-scene-btn {
    background: #1f1f24;
    border: 1px solid #2f2f37;
    color: #d4d4dc;
    font-size: 11.5px;
    font-weight: 600;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.12s ease;
    white-space: nowrap;
  }
  .rm-scene-btn:hover {
    background: #2b2b33;
    color: #fff;
  }
  .rm-scene-btn.active {
    background: #0b84f3;
    border-color: #389bff;
    color: #fff;
  }

  #rm-bottombar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: var(--rm-bar-h);
    background: #141417;
    border-top: 1px solid #27272c;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 20px 14px;
    z-index: 2000000;
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #f4f4f6;
    user-select: none;
  }
  .rm-controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .rm-transport {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .rm-btn {
    background: #232329;
    border: 1px solid #32323b;
    color: #f4f4f6;
    height: 32px;
    padding: 0 12px;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .rm-btn:hover {
    background: #2e2e36;
  }
  .rm-btn.primary {
    background: #0b84f3;
    border-color: #2b95f8;
    color: #fff;
    min-width: 84px;
    justify-content: center;
  }
  .rm-timecode {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    color: #b4b4be;
    background: #1c1c21;
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid #292930;
  }
  .rm-timeline-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .rm-segments {
    display: flex;
    width: 100%;
    height: 22px;
    gap: 2px;
    border-radius: 5px;
    overflow: hidden;
  }
  .rm-seg {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.92);
    cursor: pointer;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0 4px;
    transition: filter 0.12s;
  }
  .rm-seg:hover {
    filter: brightness(1.18);
  }
  #rm-scrubber {
    width: 100%;
    accent-color: #0b84f3;
    cursor: pointer;
    margin: 0;
  }

  /* Remocn stage & overlays */
  #remocn-stage {
    position: fixed;
    left: 0; right: 0;
    background:
      radial-gradient(circle at 14% 16%, rgba(124, 58, 237, 0.08), transparent 44%),
      radial-gradient(circle at 86% 20%, rgba(255, 94, 58, 0.08), transparent 44%),
      radial-gradient(circle at 50% 88%, rgba(250, 204, 21, 0.14), transparent 50%),
      #F5F4F0;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #111113;
    overflow: hidden;
    user-select: none;
  }
  #remocn-stage.hidden {
    display: none !important;
  }
  #remocn-stage-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(17,17,19,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(17,17,19,0.03) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, #000 35%, transparent 100%);
    pointer-events: none;
  }
  #remocn-stage-content {
    position: relative;
    z-index: 2;
    width: 1180px;
    max-width: 94vw;
    transform: translateY(-38px);
  }
  #remocn-spot {
    position: fixed;
    left: 0; top: 0;
    width: 0; height: 0;
    border-radius: 16px;
    border: 3.5px solid #ff5e3a;
    background: rgba(250, 204, 21, 0.18);
    box-shadow:
      0 0 0 6px rgba(255, 94, 58, 0.22),
      0 14px 36px rgba(255, 94, 58, 0.28);
    pointer-events: none;
    z-index: 999996;
    opacity: 0;
    transform: translate(-50%, -50%);
  }
  #remocn-cursor {
    position: fixed;
    top: -100px; left: -100px;
    width: 34px; height: 34px;
    pointer-events: none;
    z-index: 1000000;
    filter: drop-shadow(0 8px 18px rgba(0,0,0,0.32));
    display: none;
  }
  #remocn-cursor-ring {
    position: fixed;
    top: -100px; left: -100px;
    width: 60px; height: 60px;
    margin-left: -30px; margin-top: -30px;
    border-radius: 50%;
    border: 3.5px solid #ff5e3a;
    background: rgba(250, 204, 21, 0.28);
    pointer-events: none;
    z-index: 999998;
    opacity: 0;
    transform: scale(0.3);
  }
  tr.remocn-table-hl td {
    background: rgba(250, 204, 21, 0.34) !important;
    box-shadow: inset 0 0 0 2px rgba(255, 94, 58, 0.55);
  }
  .search-hit.remocn-hit-hl {
    background: rgba(250, 204, 21, 0.38) !important;
    border-color: #ff5e3a !important;
    box-shadow: 0 0 0 3px rgba(255, 94, 58, 0.28), 0 10px 24px rgba(17, 17, 19, 0.10) !important;
  }
</style>

<div id="rm-topbar">
  <div class="rm-brand">
    <span class="rm-badge">REMOTION PREVIEW</span>
    <span>SecondBrainLaunch</span>
    <span class="rm-meta">1280×720 · 24 FPS · Interactive Scrubber</span>
  </div>
  <div class="rm-scene-pills" id="rm-scene-pills"></div>
</div>

<div id="remocn-stage">
  <div id="remocn-stage-grid"></div>
  <div id="remocn-stage-content"></div>
</div>
<div id="remocn-spot"></div>
<div id="remocn-cursor-ring"></div>
<div id="remocn-cursor">
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 3.2L22.8 13.1C23.8 13.7 23.5 15.2 22.3 15.4L15.2 16.7L11.4 23.2C10.8 24.2 9.3 23.9 9.1 22.7L4.2 4.5C3.9 3.4 4.6 2.7 5.5 3.2Z" fill="#111113" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>
  </svg>
</div>

<div id="rm-bottombar">
  <div class="rm-controls-row">
    <div class="rm-transport">
      <button class="rm-btn primary" id="rm-play-btn">⏸ Pause</button>
      <button class="rm-btn" id="rm-restart-btn" title="Restart">⏮</button>
      <button class="rm-btn" id="rm-prev-btn" title="Previous Frame (←)">◀ -1f</button>
      <button class="rm-btn" id="rm-next-btn" title="Next Frame (→)">+1f ▶</button>
      <button class="rm-btn" id="rm-speed-btn" title="Playback Speed">1.0x</button>
    </div>
    <div class="rm-timecode" id="rm-timecode">Frame 000 / 000 · 00.00s · Scene 0</div>
  </div>
  <div class="rm-timeline-wrap">
    <div class="rm-segments" id="rm-segments"></div>
    <input type="range" id="rm-scrubber" min="0" max="800" value="0" step="1" />
  </div>
</div>

<script>
(() => {
  document.body.classList.add('rm-studio-active');
  window.__brainSrc = ${JSON.stringify(brainB64)};

  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
  const easeOutQuint = (t) => 1 - Math.pow(1 - clamp01(t), 5);
  const easeInOutCubic = (t) => {
    const x = clamp01(t);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };
  const interp = (f, [f0, f1], [v0, v1], fn = (x) => x) => {
    if (f <= f0) return v0;
    if (f >= f1) return v1;
    return v0 + (v1 - v0) * fn((f - f0) / (f1 - f0));
  };
  const springScale = (f, startF) => {
    const dt = f - startF;
    if (dt <= 0) return 0;
    const t = dt / 24;
    return 1 - Math.exp(-10 * t) * Math.cos(13 * t);
  };

  function build3DBrainMesh() {
    if (window.__brain3DMesh) return window.__brain3DMesh;
    const gyri = [];
    const filaments = [];
    const synapses = [];
    const nodePalette = ['#facc15', '#ff5e3a', '#38bdf8', '#a78bfa'];

    // Helper: anatomical 3D brain surface point (u = front-to-back [0..1], v = medial-to-lateral-to-bottom [0..1], hemi = -1 or +1)
    function cortexPoint(u, v, hemi) {
      // z goes from +1.15 (frontal pole) to -1.15 (occipital pole)
      const z = (0.5 - u) * 2.28;
      // Longitudinal arch height
      const uArch = Math.sin(u * Math.PI);
      const crown = Math.pow(uArch, 0.72) * (1.04 - 0.12 * (u - 0.45));

      // Cross-sectional profile from medial fissure (v=0) -> top vault (v=0.25) -> lateral wall (v=0.65) -> inferior base (v=1.0)
      const angle = v * Math.PI;
      // Distinct longitudinal fissure gap at v near 0
      const xMag = (0.09 + Math.pow(Math.sin(angle), 0.75) * 0.76) * Math.pow(uArch, 0.76);
      // Flat/sculpted inferior base instead of boat hull:
      let y = (Math.cos(angle) * 0.66 + 0.22) * crown;
      // Frontal orbital floor lift (u < 0.35, v > 0.7)
      if (u < 0.38 && v > 0.65) {
        y += (0.38 - u) * (v - 0.65) * 0.95;
      }
      // Occipital notch above cerebellum (u > 0.62, v > 0.6)
      if (u > 0.62 && v > 0.58) {
        y += (u - 0.62) * (v - 0.58) * 1.35;
      }
      // Temporal lobe protrusion (u in [0.28..0.66], v in [0.58..0.95])
      const tempMask = Math.exp(-Math.pow((u - 0.46) / 0.16, 2)) * Math.exp(-Math.pow((v - 0.78) / 0.16, 2));
      const sylvianCrease = Math.exp(-Math.pow((u - 0.44) / 0.18, 2)) * Math.exp(-Math.pow((v - 0.54) / 0.07, 2));

      const xFinal = hemi * (xMag + 0.16 * tempMask - 0.09 * sylvianCrease);
      const yFinal = y - 0.28 * tempMask - 0.08 * sylvianCrease;
      const zFinal = z + 0.14 * tempMask;
      return { x: xFinal, y: yFinal, z: zFinal };
    }

    // Generate winding 3D Cortical Gyri Ribbons & Volumetric Gyri Spheres on both hemispheres
    for (let hIdx = 0; hIdx < 2; hIdx++) {
      const hemi = hIdx === 0 ? -1 : 1;
      const U_RINGS = 15;
      const V_STRIPS = 10;

      for (let iu = 1; iu < U_RINGS; iu++) {
        const uBase = iu / U_RINGS;
        for (let iv = 0; iv <= V_STRIPS; iv++) {
          const vBase = iv / V_STRIPS;
          // Winding gyri perturbation so lobes look like organic brain folds
          const wiggleU = 0.025 * Math.sin(iv * 2.4 + iu * 1.7 + hIdx);
          const wiggleV = 0.025 * Math.cos(iu * 2.1 - iv * 1.9);
          const p = cortexPoint(
            Math.max(0.04, Math.min(0.96, uBase + wiggleU)),
            Math.max(0.02, Math.min(0.98, vBase + wiggleV)),
            hemi
          );
          const isTemporal = uBase > 0.30 && uBase < 0.64 && vBase > 0.60;
          const radius = (0.145 + 0.035 * Math.sin(iu * 3.1 + iv * 2.3)) * (1 - 0.18 * Math.abs(uBase - 0.5));
          gyri.push({
            x: p.x, y: p.y, z: p.z,
            r: radius,
            hemi,
            part: isTemporal ? 'temporal' : 'cortex',
            sulcusFactor: 0.85 + 0.15 * Math.cos(iu * 4 + iv * 3)
          });

          if ((iu + iv) % 2 === 0 && vBase > 0.12 && vBase < 0.92) {
            synapses.push({
              x: p.x * 1.04, y: p.y * 1.04, z: p.z * 1.04,
              color: nodePalette[(iu * 3 + iv * 5 + hIdx) % nodePalette.length],
              phase: iu * 0.7 + iv * 1.1
            });
          }
        }
      }

      // Add 3D winding sulci/neural filaments along each hemisphere
      for (let iv = 1; iv < V_STRIPS; iv += 2) {
        const vBase = iv / V_STRIPS;
        const pathPts = [];
        for (let step = 1; step <= 18; step++) {
          const u = step / 19;
          const vWobble = vBase + 0.045 * Math.sin(step * 1.3 + iv);
          const pt = cortexPoint(u, Math.max(0.05, Math.min(0.95, vWobble)), hemi);
          pathPts.push({ x: pt.x * 1.03, y: pt.y * 1.03, z: pt.z * 1.03 });
        }
        filaments.push({ pts: pathPts, hemi, part: 'cortex' });
      }
    }

    // Cerebellum (Left & Right Hindbrain Lobes with horizontal folia layers tucked under occipital pole)
    for (let hIdx = 0; hIdx < 2; hIdx++) {
      const hemi = hIdx === 0 ? -1 : 1;
      for (let layer = 0; layer < 5; layer++) {
        const y = -0.22 - layer * 0.075;
        const layerScale = Math.sin(((layer + 0.8) / 5.6) * Math.PI);
        for (let step = 0; step <= 6; step++) {
          const t = (step / 6) * Math.PI;
          const x = hemi * (0.08 + Math.sin(t) * 0.36 * layerScale);
          const z = -0.64 - Math.cos(t) * 0.28 * layerScale;
          gyri.push({
            x, y, z,
            r: 0.105,
            hemi,
            part: 'cerebellum',
            sulcusFactor: layer % 2 === 0 ? 1.0 : 0.82
          });
        }
      }
    }

    // Brainstem / Pons descending at the inferior center-back
    for (let s = 0; s < 6; s++) {
      const t = s / 5;
      const y = -0.28 - t * 0.42;
      const z = -0.18 - t * 0.14;
      for (let side of [-1, 1]) {
        gyri.push({
          x: side * (0.075 * (1 - t * 0.25)),
          y, z,
          r: 0.10 * (1 - t * 0.2),
          hemi: side,
          part: 'stem',
          sulcusFactor: 0.9
        });
      }
    }

    window.__brain3DMesh = { gyri, filaments, synapses };
    return window.__brain3DMesh;
  }

  function render3DBrainCanvas(canvasEl, frame) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const W = canvasEl.width;
    const H = canvasEl.height;
    ctx.clearRect(0, 0, W, H);

    const { gyri, filaments, synapses } = build3DBrainMesh();
    // Slow rotisserie rotation around Y axis + 14deg top-down pitch so central fissure & both hemispheres show clearly
    const rotY = frame === 999 ? 2.22 : 2.22 + frame * 0.038;
    const pitchX = 0.24;

    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(pitchX), sinX = Math.sin(pitchX);

    const fov = 3.8;
    const scaleBase = W * 0.37;
    const cx = W * 0.50;
    const cy = H * 0.49;

    function project3D(p) {
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const persp = fov / (fov - z2);
      return {
        sx: cx + x1 * scaleBase * persp,
        sy: cy - y2 * scaleBase * persp,
        x: x1, y: y2, z: z2,
        persp
      };
    }

    // 1. Depth-sort and render 3D Volumetric Cortical Gyri Convolutions
    const projGyri = gyri.map((g) => {
      const pr = project3D(g);
      return { ...g, ...pr, sr: g.r * scaleBase * pr.persp };
    }).sort((a, b) => a.z - b.z);

    for (const g of projGyri) {
      const depthT = Math.max(0.18, Math.min(1, (g.z + 1.25) / 2.35));
      // 3D normal approximation from center of brain for directional lighting
      const nx = g.x * 0.8, ny = g.y + 0.2, nz = g.z + 0.4;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      const light = Math.max(0.2, Math.min(1, ((nx / nLen) * -0.35 + (ny / nLen) * 0.65 + (nz / nLen) * 0.65))) * g.sulcusFactor;

      const grad = ctx.createRadialGradient(
        g.sx - g.sr * 0.28,
        g.sy - g.sr * 0.32,
        g.sr * 0.08,
        g.sx,
        g.sy,
        g.sr
      );

      if (g.part === 'cerebellum') {
        grad.addColorStop(0, \`rgba(244, 114, 182, \${0.88 * depthT})\`);
        grad.addColorStop(0.65, \`rgba(192, 38, 211, \${0.82 * depthT})\`);
        grad.addColorStop(1, \`rgba(107, 33, 168, \${0.75 * depthT})\`);
      } else if (g.part === 'stem') {
        grad.addColorStop(0, \`rgba(167, 139, 250, \${0.78 * depthT})\`);
        grad.addColorStop(1, \`rgba(76, 29, 149, \${0.70 * depthT})\`);
      } else if (g.hemi < 0) {
        // Left hemisphere: sculpted Royal Amethyst / Violet
        const hiR = Math.round(145 + light * 75);
        const hiG = Math.round(95 + light * 65);
        const hiB = Math.round(235 + light * 20);
        grad.addColorStop(0, \`rgba(\${hiR}, \${hiG}, \${hiB}, \${0.92 * depthT})\`);
        grad.addColorStop(0.68, \`rgba(109, 40, 217, \${0.86 * depthT})\`);
        grad.addColorStop(1, \`rgba(59, 7, 100, \${0.82 * depthT})\`);
      } else {
        // Right hemisphere: sculpted Electric Indigo / Cobalt Blue
        const hiR = Math.round(90 + light * 75);
        const hiG = Math.round(140 + light * 75);
        const hiB = Math.round(245 + light * 10);
        grad.addColorStop(0, \`rgba(\${hiR}, \${hiG}, \${hiB}, \${0.92 * depthT})\`);
        grad.addColorStop(0.68, \`rgba(37, 99, 235, \${0.86 * depthT})\`);
        grad.addColorStop(1, \`rgba(30, 58, 138, \${0.82 * depthT})\`);
      }

      ctx.beginPath();
      ctx.arc(g.sx, g.sy, g.sr, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // Subtle sulcus contour around each gyrus lobe
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = \`rgba(24, 16, 48, \${0.28 * depthT})\`;
      ctx.stroke();
    }

    // 2. Draw glowing 3D cortical neural filaments over foreground gyri
    for (const fil of filaments) {
      const pPts = fil.pts.map(project3D);
      const avgZ = pPts.reduce((s, p) => s + p.z, 0) / pPts.length;
      if (avgZ < -0.25) continue;
      const alpha = Math.max(0.15, Math.min(0.65, (avgZ + 0.25) / 1.1));
      ctx.beginPath();
      pPts.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.sx, pt.sy);
        else ctx.lineTo(pt.sx, pt.sy);
      });
      ctx.strokeStyle = fil.hemi < 0
        ? \`rgba(233, 213, 255, \${alpha})\`
        : \`rgba(191, 219, 254, \${alpha})\`;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }

    // 3. Draw small glowing synaptic nodes pulsing on the foreground cortex
    const projSyn = synapses.map((s) => ({ ...s, ...project3D(s) }))
      .filter((s) => s.z > -0.1)
      .sort((a, b) => a.z - b.z);

    for (const s of projSyn) {
      const depthT = Math.max(0.25, Math.min(1, (s.z + 0.1) / 1.2));
      const pulse = 0.85 + 0.25 * Math.sin((frame === 999 ? 0 : frame) * 0.2 + s.phase);
      const rad = (1.7 + depthT * 1.9) * pulse;
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, rad, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.72 + 0.28 * depthT;
      ctx.fill();
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = 'rgba(17, 17, 19, 0.5)';
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  window.__remocn = {
    setSpot(x, y, w, h, rx = 16, opacity = 1) {
      const el = document.getElementById('remocn-spot');
      if (!el) return;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      el.style.borderRadius = rx + 'px';
      el.style.opacity = String(opacity);
    },
    getBrandLogosHtml(frame = 999, slowReveal = false) {
      const b1 = slowReveal ? interp(frame, [0, 14], [0, 1], easeOutCubic) : 1;
      const b2 = slowReveal ? interp(frame, [11, 25], [0, 1], easeOutCubic) : 1;
      const b3 = slowReveal ? interp(frame, [22, 36], [0, 1], easeOutCubic) : 1;
      const b4 = slowReveal ? interp(frame, [33, 47], [0, 1], easeOutCubic) : 1;
      const y1 = (1 - b1) * 14;
      const y2 = (1 - b2) * 14;
      const y3 = (1 - b3) * 14;
      const y4 = (1 - b4) * 14;

      const pillStyle = 'display: flex; align-items: center; justify-content: flex-start; gap: 14px; width: 100%; height: 56px; box-sizing: border-box; background: #ffffff; border: 2px solid rgba(17,17,19,0.12); box-shadow: 0 6px 18px rgba(17,17,19,0.06); padding: 0 24px; border-radius: 16px; font-size: 22px; font-weight: 600; color: #111113; letter-spacing: -0.02em; white-space: nowrap;';
      const iconBox = 'display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;';
      const plusStyle = 'display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #ff5e3a; width: 54px;';
      return \`
        <div style="display: flex; justify-content: center; margin-bottom: 30px;">
          <div style="display: inline-grid; grid-template-columns: 456px 54px 456px; align-items: center; row-gap: 18px;">
            <div style="\${pillStyle} opacity: \${b1.toFixed(3)}; transform: translateY(\${y1.toFixed(1)}px);">
              <span style="\${iconBox}">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <polygon points="12,2 19,6.5 21,15.5 14,22 6,19.5 3,11" fill="#7C3AED"/>
                  <polygon points="12,2 19,6.5 13.5,12 7.5,7.5" fill="#A78BFA"/>
                  <polygon points="13.5,12 21,15.5 14,22 9,15.5" fill="#5B21B6"/>
                  <polygon points="7.5,7.5 13.5,12 9,15.5 3,11" fill="#8B5CF6"/>
                </svg>
              </span>
              <span>Obsidian-Style Mind Map & Graph</span>
            </div>
            <div style="\${plusStyle} opacity: \${b2.toFixed(3)}; transform: translateY(\${y2.toFixed(1)}px);">+</div>
            <div style="\${pillStyle} opacity: \${b2.toFixed(3)}; transform: translateY(\${y2.toFixed(1)}px);">
              <span style="\${iconBox}">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" fill="#2563EB"/>
                  <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" fill="#60A5FA"/>
                  <path d="M7 8h3M7 11.5h3M14 8h3M14 11.5h3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </span>
              <span>Developer Docs</span>
            </div>
            <div style="\${pillStyle} opacity: \${b3.toFixed(3)}; transform: translateY(\${y3.toFixed(1)}px);">
              <span style="\${iconBox}">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="#ff5e3a" stroke-width="2.6"/>
                  <path d="M15.5 15.5L20.5 20.5" stroke="#111113" stroke-width="2.6" stroke-linecap="round"/>
                </svg>
              </span>
              <span>Fast and Accurate Search</span>
            </div>
            <div style="\${plusStyle} opacity: \${b4.toFixed(3)}; transform: translateY(\${y4.toFixed(1)}px);">+</div>
            <div style="\${pillStyle} opacity: \${b4.toFixed(3)}; transform: translateY(\${y4.toFixed(1)}px);">
              <span style="\${iconBox}">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <circle cx="7" cy="7" r="4" fill="#4285F4"/>
                  <circle cx="17" cy="7" r="4" fill="#EA4335"/>
                  <circle cx="7" cy="17" r="4" fill="#FBBC05"/>
                  <circle cx="17" cy="17" r="4" fill="#34A853"/>
                </svg>
              </span>
              <span>Google Open Knowledge Format (OKF)</span>
            </div>
          </div>
        </div>
      \`;
    },

    renderStrikethroughScene(frame, { from, toBefore, toHighlight, toAfter, sub }) {
      const stageEl = document.getElementById('remocn-stage');
      stageEl.style.opacity = '1';
      stageEl.classList.remove('hidden');
      document.getElementById('remocn-cursor').style.display = 'none';
      window.__remocn.setSpot(0, 0, 0, 0, 16, 0);

      const qT = interp(frame, [0, 12], [0, 1], easeOutCubic);
      const qY = (1 - qT) * 18;

      const fromIn = interp(frame, [6, 16], [0, 1], easeOutCubic);
      const linePct = interp(frame, [16, 30], [0, 100], easeOutCubic);
      const fromFadeOut = interp(frame, [32, 44], [1, 0], easeOutCubic);
      const fromOpacity = fromIn * fromFadeOut;
      const fromMaxH = interp(frame, [32, 44], [76, 0], easeOutCubic);
      const fromMb = interp(frame, [32, 44], [24, 0], easeOutCubic);
      const fromScale = interp(frame, [32, 44], [1, 0.85], easeOutCubic);

      const toT = interp(frame, [34, 48], [0, 1], easeOutCubic);
      const toScale = interp(frame, [34, 52], [0.62, 1.0], easeOutQuint);
      const toY = (1 - toT) * 32;
      const markerW = springScale(frame, 42) * 100;

      const subT = interp(frame, [42, 58], [0, 1], easeOutCubic);
      const subScale = interp(frame, [42, 62], [0.55, 1.0], easeOutQuint);
      const subY = (1 - subT) * 28;

      const content = document.getElementById('remocn-stage-content');
      content.style.textAlign = 'center';
      content.innerHTML = \`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="font-size: 56px; font-weight: 700; color: #111113; margin-bottom: 24px; letter-spacing: -0.035em; line-height: 1.12; white-space: nowrap; opacity: \${qT.toFixed(3)}; transform: translateY(\${qY.toFixed(1)}px);">
            New AI concepts and ideas <span style="color: #ff5e3a;">moving too fast?</span>
          </div>
          <div style="overflow: hidden; max-height: \${fromMaxH.toFixed(1)}px; margin-bottom: \${fromMb.toFixed(1)}px; font-size: 52px; font-weight: 600; color: #52514E; letter-spacing: -0.03em; white-space: nowrap; opacity: \${fromOpacity.toFixed(3)}; transform: scale(\${fromScale.toFixed(3)});">
            <span style="position: relative; display: inline-block; padding: 4px 8px;">
              \${from}
              <span style="position: absolute; left: 0; top: 53%; height: 7px; width: \${linePct.toFixed(1)}%; background: #ff5e3a; border-radius: 4px; transform: translateY(-50%);"></span>
            </span>
          </div>
          <div style="font-size: 94px; font-weight: 700; color: #111113; letter-spacing: -0.04em; line-height: 1.05; white-space: nowrap; opacity: \${toT.toFixed(3)}; transform: translateY(\${toY.toFixed(1)}px) scale(\${toScale.toFixed(3)});">
            \${toBefore}<span style="position: relative; display: inline-block; padding: 0 16px; margin: 0 4px;">
              <span style="position: absolute; left: 0; top: 8%; bottom: 6%; width: \${markerW.toFixed(1)}%; background: #facc15; border-radius: 12px; z-index: 0;"></span>
              <span style="position: relative; z-index: 1; color: #111113;">\${toHighlight}</span>
            </span>\${toAfter || ''}
          </div>
          <div style="margin-top: 30px; font-size: 48px; font-weight: 700; color: #111113; line-height: 1.26; letter-spacing: -0.03em; opacity: \${subT.toFixed(3)}; transform: translateY(\${subY.toFixed(1)}px) scale(\${subScale.toFixed(3)});">
            \${sub || ''}
          </div>
        </div>
      \`;
    },

    renderFeatureHeadlineScene(frame, { tag, label, lines, highlightWord, subhead }) {
      const stageEl = document.getElementById('remocn-stage');
      stageEl.style.opacity = '1';
      stageEl.classList.remove('hidden');
      document.getElementById('remocn-cursor').style.display = 'none';
      window.__remocn.setSpot(0, 0, 0, 0, 999, 0);

      const pillT = interp(frame, [0, 14], [0, 1], easeOutQuint);
      const clipRight = (1 - pillT) * 100;

      let wordIndex = 0;
      const hlTokens = highlightWord
        ? highlightWord.split(' ').map((s) => s.replace(/[.,]/g, ''))
        : [];
      const linesHtml = lines.map((lineStr) => {
        const words = lineStr.split(' ');
        const spans = words.map((w) => {
          const idx = wordIndex++;
          const t = interp(frame, [4 + idx * 4.5, 22 + idx * 4.5], [0, 1], easeOutQuint);
          const yPct = (1 - t) * 108;
          const isHl = hlTokens.includes(w.replace(/[.,]/g, ''));
          const hlBg = isHl
            ? 'background: linear-gradient(180deg, transparent 54%, #facc15 54%, #facc15 92%, transparent 92%); padding: 0 8px; margin: 0 -4px; border-radius: 4px;'
            : '';
          return \`
            <span style="display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: 0.14em; margin-bottom: -0.14em;">
              <span style="display: inline-block; transform: translateY(\${yPct.toFixed(1)}%); \${hlBg}">
                \${w}
              </span>
            </span>
          \`;
        }).join(' ');
        return \`<div style="line-height: 1.06;">\${spans}</div>\`;
      }).join('');

      const subStart = 16 + wordIndex * 3.8;
      const subT = interp(frame, [subStart, subStart + 18], [0, 1], easeOutCubic);
      const subY = (1 - subT) * 16;

      const content = document.getElementById('remocn-stage-content');
      content.style.textAlign = 'left';
      content.innerHTML = \`
        <div style="display: inline-flex; align-items: center; gap: 14px; height: 58px; padding: 0 26px 0 12px; border-radius: 999px; background: rgba(255,255,255,0.96); box-shadow: inset 0 0 0 2px rgba(17,17,19,0.12), 0 6px 18px rgba(17,17,19,0.05); clip-path: inset(0 \${clipRight.toFixed(1)}% 0 0 round 999px); margin-bottom: 32px;">
          <span style="display: inline-flex; align-items: center; height: 40px; padding: 0 18px; border-radius: 999px; background: #111113; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
            \${tag}
          </span>
          <span style="font-size: 26px; font-weight: 600; color: #111113; letter-spacing: -0.015em;">
            \${label}
          </span>
        </div>
        <div style="font-size: 92px; font-weight: 700; color: #111113; letter-spacing: -0.04em;">
          \${linesHtml}
        </div>
        <div style="margin-top: 32px; font-size: 40px; font-weight: 500; color: #3F3E3A; line-height: 1.36; letter-spacing: -0.02em; opacity: \${subT.toFixed(3)}; transform: translateY(\${subY.toFixed(1)}px);">
          \${subhead}
        </div>
      \`;
    },

    renderOutroLockup(frame, { title, showBadges = true, slowRevealBadges = false }) {
      const stageEl = document.getElementById('remocn-stage');
      stageEl.style.opacity = '1';
      stageEl.classList.remove('hidden');
      document.getElementById('remocn-cursor').style.display = 'none';
      window.__remocn.setSpot(0, 0, 0, 0, 999, 0);

      const chars = Array.from(title);
      const charsHtml = chars.map((ch, i) => {
        const local = frame - i * 0.9;
        const opacity = interp(local, [0, 12], [0, 1], easeOutCubic);
        const y = interp(local, [0, 9], [28, 0], easeOutQuint);
        return \`<span style="display: inline-block; white-space: pre; opacity: \${opacity.toFixed(3)}; transform: translateY(\${y.toFixed(1)}px);">\${ch}</span>\`;
      }).join('');

      const tagT = interp(frame, [6, 18], [0, 1], easeOutCubic);
      const tagY = (1 - tagT) * 12;
      const pillsT = interp(frame, [10, 22], [0, 1], easeOutCubic);
      const brainT = interp(frame, [2, 16], [0, 1], easeOutCubic);
      const brainScale = interp(frame, [2, 18], [0.88, 1], easeOutQuint);

      const brainInlineHtml = \`<span style="display: inline-flex; align-items: center; justify-content: center; position: relative; vertical-align: middle; margin-left: 36px; opacity: \${brainT.toFixed(3)}; transform: scale(\${brainScale.toFixed(3)}); pointer-events: none;">
           <canvas id="remocn-brain-canvas" width="320" height="260" style="width: 160px; height: 130px;"></canvas>
         </span>\`;

      const badgesHtml = showBadges
        ? \`<div style="margin-bottom: 8px;">\${window.__remocn.getBrandLogosHtml(frame, slowRevealBadges)}</div>\`
        : '';

      const content = document.getElementById('remocn-stage-content');
      content.style.textAlign = 'center';
      content.innerHTML = \`
        \${badgesHtml}
        <div style="display: inline-flex; align-items: center; justify-content: center; font-size: 100px; font-weight: 700; color: #111113; letter-spacing: -0.045em; line-height: 1.0;">
          <span>\${charsHtml}</span>\${brainInlineHtml}
        </div>
        <div style="margin-top: 24px; font-size: 33px; font-weight: 600; color: #111113; letter-spacing: -0.025em; white-space: nowrap; opacity: \${tagT.toFixed(3)}; transform: translateY(\${tagY.toFixed(1)}px);">
          <span style="background: #facc15; padding: 5px 16px; border-radius: 10px;">Simple & Easy to Use.</span> Zero Dependencies. Works with Any AI Agent.
        </div>
        <div style="margin-top: 26px; opacity: \${pillsT.toFixed(3)};">
          <span style="display: inline-flex; align-items: center; background: #ffffff; border: 2px solid rgba(17,17,19,0.14); box-shadow: 0 12px 32px rgba(17,17,19,0.08); padding: 12px 30px; border-radius: 16px; font-size: 34px; font-weight: 700; letter-spacing: -0.025em;">
            <span style="color: #ff5e3a;">ericcgu.github.io</span><span style="color: #111113;">/second-brain</span>
          </span>
        </div>
      \`;
      render3DBrainCanvas(document.getElementById('remocn-brain-canvas'), frame);
    }
  };

  // Define the 9 Remotion Timeline Scenes (24 FPS)
  const SCENES = [
    { id: 0, name: '00 Cover (3D Brain)', frames: 84, color: '#7c3aed' },
    { id: 1, name: '01 Hook (Fade & Grow)', frames: 100, color: '#ff5e3a' },
    { id: 2, name: '02 Mind Map Title', frames: 100, color: '#2563eb' },
    { id: 3, name: '03 Live Mind Map', frames: 120, color: '#0891b2' },
    { id: 4, name: '04 Graph Title', frames: 70, color: '#4f46e5' },
    { id: 5, name: '05 Live Force Graph', frames: 120, color: '#0d9488' },
    { id: 6, name: '06 Search Title', frames: 70, color: '#d97706' },
    { id: 7, name: '07 Live Search', frames: 120, color: '#ea580c' },
    { id: 8, name: '08 Outro Lockup', frames: 66, color: '#7c3aed' }
  ];

  let startAcc = 0;
  SCENES.forEach((s) => {
    s.start = startAcc;
    s.end = startAcc + s.frames - 1;
    startAcc += s.frames;
  });
  const TOTAL_FRAMES = startAcc;

  const scrubber = document.getElementById('rm-scrubber');
  scrubber.max = String(TOTAL_FRAMES - 1);

  const pillsEl = document.getElementById('rm-scene-pills');
  const segsEl = document.getElementById('rm-segments');

  SCENES.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'rm-scene-btn';
    btn.textContent = s.name;
    btn.onclick = () => seekTo(s.start);
    s.btnEl = btn;
    pillsEl.appendChild(btn);

    const seg = document.createElement('div');
    seg.className = 'rm-seg';
    seg.style.flex = String(s.frames);
    seg.style.background = s.color;
    seg.textContent = s.name;
    seg.onclick = () => seekTo(s.start);
    segsEl.appendChild(seg);
  });

  let currentFrame = 0;
  let playing = true;
  let speed = 1.0;
  let lastAppliedScene = -1;

  function renderAtFrame(globalF) {
    currentFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(globalF)));
    scrubber.value = String(currentFrame);

    const scene = SCENES.find((s) => currentFrame >= s.start && currentFrame <= s.end) || SCENES[0];
    const localF = currentFrame - scene.start;

    SCENES.forEach((s) => s.btnEl.classList.toggle('active', s.id === scene.id));
    document.getElementById('rm-timecode').textContent =
      \`Frame \${String(currentFrame).padStart(3, '0')} / \${TOTAL_FRAMES} · \${(currentFrame / 24).toFixed(2)}s · \${scene.name}\`;

    if (scene.id === 0) {
      closeSearchModal();
      window.__remocn.renderOutroLockup(localF, {
        title: 'Second Brain',
        showBadges: true,
        slowRevealBadges: true
      });
    } else if (scene.id === 1) {
      closeSearchModal();
      window.__remocn.renderStrikethroughScene(localF, {
        from: 'Scattered notes and folders',
        toBefore: 'See how everything ',
        toHighlight: 'connects.',
        toAfter: '',
        sub: 'Map your ideas visually.<br>Let your AI Agent organize and file your notes!'
      });
    } else if (scene.id === 2) {
      closeSearchModal();
      window.__remocn.renderFeatureHeadlineScene(localF, {
        tag: '01',
        label: 'Interactive Mind Map',
        lines: ['Find, relate, and', 'connect ideas.'],
        highlightWord: 'connect ideas.',
        subhead: 'Simple and easy to use in plain Markdown. Zoom into any topic and read notes right in place.'
      });
    } else if (scene.id === 3) {
      // Live Mind Map scene
      const stageEl = document.getElementById('remocn-stage');
      stageEl.classList.add('hidden');
      closeSearchModal();
      if (lastAppliedScene !== 3) {
        setTheme('paper');
        setViewSwitch('mindmap');
        setMmMode('topic');
      }
      const expandAt = 32;
      if (localF < expandAt) {
        const refNode = (function findRef(n) {
          if (n.label === 'Reference' || n.id === 'topic:reference') return n;
          for (const c of n.children || []) { const r = findRef(c); if (r) return r; }
          return null;
        })(rootTree);
        if (refNode) refNode.collapsed = true;
        closeGraphPeek();
        fitMindMap();
      } else {
        const refNode = (function findRef(n) {
          if (n.label === 'Reference' || n.id === 'topic:reference') return n;
          for (const c of n.children || []) { const r = findRef(c); if (r) return r; }
          return null;
        })(rootTree);
        if (refNode) refNode.collapsed = false;
        computeTreeLayout(rootTree);
        const zT = interp(localF, [32, 68], [0, 1], easeInOutCubic);
        const rect = canvas.getBoundingClientRect();
        const refFound = visibleNodes.find(n => n.label === 'Reference');
        if (refFound) {
          zoom = 1.0 + 0.32 * zT;
          camX = rect.width * (0.48 - 0.14 * interp(localF, [72, 100], [0, 1], easeInOutCubic)) - (refFound.x + refFound.w) * zoom;
          camY = rect.height * 0.50 - refFound.y * zoom;
        }
        if (localF >= 74) {
          openDoc('reference/open-knowledge-format.md');
        } else {
          closeGraphPeek();
        }
        renderFrame();
      }
    } else if (scene.id === 4) {
      closeSearchModal();
      window.__remocn.renderFeatureHeadlineScene(localF, {
        tag: '02',
        label: 'Force-Directed Graph',
        lines: ['Every Markdown link', 'becomes a live edge.'],
        highlightWord: 'live edge.',
        subhead: 'Drag nodes to explore clusters. Click any concept to read its Architecture Decision Record.'
      });
    } else if (scene.id === 5) {
      const stageEl = document.getElementById('remocn-stage');
      stageEl.classList.add('hidden');
      closeSearchModal();
      if (lastAppliedScene !== 5) {
        setTheme('paper');
        setViewSwitch('graph');
        closeGraphPeek();
        fitGraphView();
      }
      if (localF >= 84) {
        openDoc('decisions/adr-001-okf-markdown-knowledge-base.md');
      } else {
        closeGraphPeek();
      }
      renderFrame();
    } else if (scene.id === 6) {
      closeSearchModal();
      window.__remocn.renderFeatureHeadlineScene(localF, {
        tag: '03',
        label: 'Fast and Accurate Search',
        lines: ['Jump straight to', 'any section.'],
        highlightWord: 'any section.',
        subhead: 'Fuzzy search across titles, tags, and headings—built for both humans and AI agents.'
      });
    } else if (scene.id === 7) {
      const stageEl = document.getElementById('remocn-stage');
      stageEl.classList.add('hidden');
      if (localF < 75) {
        openSearchModal();
        const q = 'Open Knowledge Format';
        const chars = Math.min(q.length, Math.floor(interp(localF, [8, 42], [0, q.length])));
        const input = document.getElementById('searchInput');
        if (input) {
          input.value = q.slice(0, chars);
          renderSearchResults(input.value);
        }
        if (localF >= 44) {
          const hit = document.querySelector('#searchResults .search-hit');
          if (hit) hit.classList.add('remocn-hit-hl');
        }
      } else {
        closeSearchModal();
        setViewSwitch('docs');
        openDoc('reference/open-knowledge-format.md');
      }
    } else if (scene.id === 8) {
      closeSearchModal();
      window.__remocn.renderOutroLockup(localF, {
        title: 'Second Brain',
        showBadges: false,
        slowRevealBadges: false
      });
    }
    lastAppliedScene = scene.id;
  }

  function seekTo(f) {
    renderAtFrame(f);
  }

  scrubber.addEventListener('input', (e) => {
    playing = false;
    updatePlayBtn();
    seekTo(Number(e.target.value));
  });

  function updatePlayBtn() {
    document.getElementById('rm-play-btn').textContent = playing ? '⏸ Pause' : '▶ Play';
  }

  document.getElementById('rm-play-btn').onclick = () => {
    playing = !playing;
    updatePlayBtn();
  };
  document.getElementById('rm-restart-btn').onclick = () => {
    seekTo(0);
    playing = true;
    updatePlayBtn();
  };
  document.getElementById('rm-prev-btn').onclick = () => {
    playing = false;
    updatePlayBtn();
    seekTo(currentFrame - 1);
  };
  document.getElementById('rm-next-btn').onclick = () => {
    playing = false;
    updatePlayBtn();
    seekTo(currentFrame + 1);
  };
  document.getElementById('rm-speed-btn').onclick = (e) => {
    const speeds = [0.5, 1.0, 1.5];
    speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    e.target.textContent = speed.toFixed(1) + 'x';
  };

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.id !== 'rm-scrubber') return;
    if (e.code === 'Space') {
      e.preventDefault();
      playing = !playing;
      updatePlayBtn();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      playing = false;
      updatePlayBtn();
      seekTo(currentFrame - 1);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      playing = false;
      updatePlayBtn();
      seekTo(currentFrame + 1);
    }
  });

  let lastTick = performance.now();
  let fracFrame = 0;
  function tick(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (playing) {
      fracFrame += dt * 24 * speed;
      if (fracFrame >= 1) {
        const step = Math.floor(fracFrame);
        fracFrame -= step;
        const nextF = (currentFrame + step) % TOTAL_FRAMES;
        renderAtFrame(nextF);
      }
    }
    requestAnimationFrame(tick);
  }

  renderAtFrame(0);
  requestAnimationFrame(tick);
})();
</script>
`;

const out = siteHtml.replace('</body>', `${remotionPreviewAddon}\n</body>`);
fs.writeFileSync(OUT_HTML, out, 'utf8');
console.log('✅ Built interactive Remotion Studio preview at:', OUT_HTML);
