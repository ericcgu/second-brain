import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_INDEX = path.join(ROOT, 'site', 'index.html');
const OUT_HTML = path.join(ROOT, 'site', 'video-preview.html');

const siteHtml = fs.readFileSync(SITE_INDEX, 'utf8');

const studioPreviewAddon = `
<style>
  :root {
    --sb-bar-h: 112px;
    --sb-top-h: 52px;
  }
  body.sb-studio-active {
    padding-top: var(--sb-top-h) !important;
    padding-bottom: var(--sb-bar-h) !important;
    box-sizing: border-box !important;
  }
  body.sb-studio-active .app-shell,
  body.sb-studio-active #sb-stage {
    top: var(--sb-top-h) !important;
    bottom: var(--sb-bar-h) !important;
    height: calc(100vh - var(--sb-top-h) - var(--sb-bar-h)) !important;
  }

  #sb-topbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: var(--sb-top-h);
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
  .sb-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
  }
  .sb-badge {
    background: #0b84f3;
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 5px;
    letter-spacing: 0.02em;
  }
  .sb-meta {
    color: #8e8e98;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px;
  }
  .sb-scene-pills {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
  }
  .sb-scene-btn {
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
  .sb-scene-btn:hover {
    background: #2b2b33;
    color: #fff;
  }
  .sb-scene-btn.active {
    background: #0b84f3;
    border-color: #389bff;
    color: #fff;
  }

  #sb-bottombar {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: var(--sb-bar-h);
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
  .sb-controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sb-transport {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sb-btn {
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
  .sb-btn:hover {
    background: #2e2e36;
  }
  .sb-btn.primary {
    background: #0b84f3;
    border-color: #2b95f8;
    color: #fff;
    min-width: 84px;
    justify-content: center;
  }
  .sb-timecode {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12.5px;
    color: #b4b4be;
    background: #1c1c21;
    padding: 5px 12px;
    border-radius: 6px;
    border: 1px solid #292930;
  }
  .sb-timeline-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sb-segments {
    display: flex;
    width: 100%;
    height: 22px;
    gap: 2px;
    border-radius: 5px;
    overflow: hidden;
  }
  .sb-seg {
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
  .sb-seg:hover {
    filter: brightness(1.18);
  }
  #sb-scrubber {
    width: 100%;
    accent-color: #0b84f3;
    cursor: pointer;
    margin: 0;
  }

  #sb-stage {
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
  #sb-stage.hidden {
    display: none !important;
  }
  #sb-stage-grid {
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
  #sb-stage-content {
    position: relative;
    z-index: 2;
    width: 1180px;
    max-width: 94vw;
    transform: translateY(-38px);
  }
  #sb-spot {
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
  #sb-cursor {
    position: fixed;
    top: -100px; left: -100px;
    width: 34px; height: 34px;
    pointer-events: none;
    z-index: 1000000;
    filter: drop-shadow(0 8px 18px rgba(0,0,0,0.32));
    display: none;
  }
  #sb-cursor-ring {
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
  tr.sb-table-hl td {
    background: rgba(250, 204, 21, 0.34) !important;
    box-shadow: inset 0 0 0 2px rgba(255, 94, 58, 0.55);
  }
  .search-hit.sb-hit-hl {
    background: rgba(250, 204, 21, 0.38) !important;
    border-color: #ff5e3a !important;
    box-shadow: 0 0 0 3px rgba(255, 94, 58, 0.28), 0 10px 24px rgba(17, 17, 19, 0.10) !important;
  }
</style>

<div id="sb-topbar">
  <div class="sb-brand">
    <span class="sb-badge">STUDIO PREVIEW</span>
    <span>SecondBrainLaunch</span>
    <span class="sb-meta">1280×720 · 24 FPS · Interactive Scrubber</span>
  </div>
  <div class="sb-scene-pills" id="sb-scene-pills"></div>
</div>

<div id="sb-stage">
  <div id="sb-stage-grid"></div>
  <div id="sb-stage-content"></div>
</div>
<div id="sb-spot"></div>
<div id="sb-cursor-ring"></div>
<div id="sb-cursor">
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 3.2L22.8 13.1C23.8 13.7 23.5 15.2 22.3 15.4L15.2 16.7L11.4 23.2C10.8 24.2 9.3 23.9 9.1 22.7L4.2 4.5C3.9 3.4 4.6 2.7 5.5 3.2Z" fill="#111113" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round"/>
  </svg>
</div>

<div id="sb-bottombar">
  <div class="sb-controls-row">
    <div class="sb-transport">
      <button class="sb-btn primary" id="sb-play-btn">⏸ Pause</button>
      <button class="sb-btn" id="sb-restart-btn" title="Restart">⏮</button>
      <button class="sb-btn" id="sb-prev-btn" title="Previous Frame (←)">◀ -1f</button>
      <button class="sb-btn" id="sb-next-btn" title="Next Frame (→)">+1f ▶</button>
      <button class="sb-btn" id="sb-speed-btn" title="Playback Speed">1.0x</button>
    </div>
    <div class="sb-timecode" id="sb-timecode">Frame 000 / 000 · 00.00s · Scene 0</div>
  </div>
  <div class="sb-timeline-wrap">
    <div class="sb-segments" id="sb-segments"></div>
    <input type="range" id="sb-scrubber" min="0" max="800" value="0" step="1" />
  </div>
</div>

<script>
(() => {
  document.body.classList.add('sb-studio-active');

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

  /**
   * Half-Human (Left Hemisphere: Sculpted Organic Cortical Gyri)
   * + Half-Digital AI (Right Hemisphere: 3D Geodesic Plexus Network, Glowing Nodes & Data Pulses)
   */
  function build3DBrainMesh() {
    if (window.__brain3DMesh) return window.__brain3DMesh;

    function brainSurfacePoint(u, v, hemi) {
      const z = (0.5 - u) * 2.28;
      const uArch = Math.sin(u * Math.PI);
      const crown = Math.pow(uArch, 0.73) * (1.04 - 0.12 * (u - 0.45));

      const angle = v * Math.PI;
      const xMag = (0.08 + Math.pow(Math.sin(angle), 0.74) * 0.78) * Math.pow(uArch, 0.76);
      let y = (Math.cos(angle) * 0.66 + 0.21) * crown;

      if (u < 0.38 && v > 0.62) y += (0.38 - u) * (v - 0.62) * 0.95;
      if (u > 0.62 && v > 0.56) y += (u - 0.62) * (v - 0.56) * 1.35;

      const tempMask = Math.exp(-Math.pow((u - 0.45) / 0.16, 2)) * Math.exp(-Math.pow((v - 0.76) / 0.16, 2));
      const sylvian = Math.exp(-Math.pow((u - 0.43) / 0.18, 2)) * Math.exp(-Math.pow((v - 0.52) / 0.07, 2));

      const xFinal = hemi * (xMag + 0.16 * tempMask - 0.08 * sylvian);
      const yFinal = y - 0.27 * tempMask - 0.07 * sylvian;
      const zFinal = z + 0.14 * tempMask;
      return { x: xFinal, y: yFinal, z: zFinal };
    }

    // 1. LEFT HEMISPHERE (hemi = -1): Organic Human Brain (Sculpted Cortical Gyri Convolutions + Sulci)
    const humanGyri = [];
    const humanSulci = [];
    const U_RINGS = 18;
    const V_STRIPS = 12;

    for (let iu = 1; iu < U_RINGS; iu++) {
      const uBase = iu / U_RINGS;
      for (let iv = 0; iv <= V_STRIPS; iv++) {
        const vBase = iv / V_STRIPS;
        const wiggleU = 0.022 * Math.sin(iv * 2.7 + iu * 1.9);
        const wiggleV = 0.022 * Math.cos(iu * 2.3 - iv * 2.1);
        const p = brainSurfacePoint(
          Math.max(0.04, Math.min(0.96, uBase + wiggleU)),
          Math.max(0.02, Math.min(0.98, vBase + wiggleV)),
          -1
        );
        const radius = (0.118 + 0.024 * Math.sin(iu * 3.3 + iv * 2.5)) * (1 - 0.16 * Math.abs(uBase - 0.5));
        humanGyri.push({
          x: p.x, y: p.y, z: p.z,
          r: radius,
          part: 'cortex',
          shade: 0.88 + 0.12 * Math.cos(iu * 4 + iv * 3)
        });
      }
    }

    // Organic sulci fold ribbons on the Human Hemisphere
    for (let iv = 1; iv < V_STRIPS; iv += 2) {
      const vBase = iv / V_STRIPS;
      const pts = [];
      for (let s = 1; s <= 16; s++) {
        const u = s / 17;
        const vWobble = vBase + 0.05 * Math.sin(s * 1.4 + iv);
        const pt = brainSurfacePoint(u, Math.max(0.05, Math.min(0.95, vWobble)), -1);
        pts.push({ x: pt.x * 1.02, y: pt.y * 1.02, z: pt.z * 1.02 });
      }
      humanSulci.push(pts);
    }

    // Human Left Cerebellum lobe
    for (let layer = 0; layer < 5; layer++) {
      const y = -0.22 - layer * 0.072;
      const layerScale = Math.sin(((layer + 0.8) / 5.6) * Math.PI);
      for (let step = 0; step <= 6; step++) {
        const t = (step / 6) * Math.PI;
        const x = -(0.08 + Math.sin(t) * 0.36 * layerScale);
        const z = -0.64 - Math.cos(t) * 0.28 * layerScale;
        humanGyri.push({
          x, y, z,
          r: 0.105,
          part: 'cerebellum',
          shade: layer % 2 === 0 ? 1.0 : 0.82
        });
      }
    }

    // 2. RIGHT HEMISPHERE (hemi = +1): Digital AI Networking Brain (3D Geodesic Plexus + Glowing Hubs + Pulses)
    const aiNodes = [];
    const aiEdges = [];
    const aiFacets = [];
    const aiPulses = [];
    const aiPalette = ['#38bdf8', '#2563eb', '#facc15', '#ff5e3a', '#8b5cf6'];

    const AU = 12;
    const AV = 8;
    for (let iu = 0; iu <= AU; iu++) {
      const u = 0.04 + (iu / AU) * 0.92;
      for (let iv = 0; iv <= AV; iv++) {
        const v = 0.03 + (iv / AV) * 0.94;
        const jU = (iu > 0 && iu < AU) ? Math.sin(iu * 3.7 + iv * 2.3) * 0.018 : 0;
        const jV = (iv > 0 && iv < AV) ? Math.cos(iu * 2.9 - iv * 3.1) * 0.018 : 0;
        const pt = brainSurfacePoint(u + jU, v + jV, 1);
        const isHub = (iu * 3 + iv * 2) % 4 === 0 && iu > 0 && iu < AU;
        const color = aiPalette[(iu * 5 + iv * 3) % aiPalette.length];
        aiNodes.push({
          x: pt.x, y: pt.y, z: pt.z,
          isHub,
          color,
          r: isHub ? 3.5 : 2.1
        });
      }
    }

    const rowLen = AV + 1;
    for (let iu = 0; iu < AU; iu++) {
      for (let iv = 0; iv < AV; iv++) {
        const a = iu * rowLen + iv;
        const b = a + 1;
        const c = a + rowLen;
        const d = c + 1;
        aiEdges.push([a, b, 'surface']);
        aiEdges.push([a, c, 'surface']);
        if ((iu + iv) % 2 === 0) {
          aiEdges.push([a, d, 'diag']);
          aiFacets.push([a, b, d, 'cortex']);
          aiFacets.push([a, d, c, 'cortex']);
        } else {
          aiEdges.push([b, c, 'diag']);
          aiFacets.push([a, b, c, 'cortex']);
          aiFacets.push([b, d, c, 'cortex']);
        }
      }
    }

    // Digital AI Right Cerebellum sub-network
    const cBase = aiNodes.length;
    const CU = 5, CV = 4;
    for (let iu = 0; iu <= CU; iu++) {
      const u = (iu / CU) * Math.PI;
      for (let iv = 0; iv <= CV; iv++) {
        const v = (iv / CV) * Math.PI;
        const x = +(0.07 + Math.sin(u) * Math.sin(v) * 0.38);
        const y = -0.38 + Math.sin(u) * Math.cos(v) * 0.22;
        const z = -0.64 + Math.cos(u) * 0.30;
        const isHub = (iu + iv) % 2 === 0;
        aiNodes.push({
          x, y, z,
          isHub,
          color: isHub ? '#facc15' : '#ff5e3a',
          r: isHub ? 2.8 : 1.9
        });
      }
    }
    const cRow = CV + 1;
    for (let iu = 0; iu < CU; iu++) {
      for (let iv = 0; iv < CV; iv++) {
        const a = cBase + iu * cRow + iv;
        const b = a + 1;
        const c = a + cRow;
        const d = c + 1;
        aiEdges.push([a, b, 'cerebellum']);
        aiEdges.push([a, c, 'cerebellum']);
        aiFacets.push([a, b, c, 'cerebellum']);
      }
    }

    // Internal Digital AI Core Synapses & Cross-Hemisphere Bridges
    const coreStart = aiNodes.length;
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const angle = i * 2.1;
      const z = (0.5 - t) * 1.45;
      const y = Math.sin(angle) * 0.26 + 0.06;
      const x = 0.16 + Math.abs(Math.cos(angle)) * 0.32;
      aiNodes.push({
        x, y, z,
        isHub: true,
        color: i % 2 === 0 ? '#facc15' : '#38bdf8',
        r: 2.8
      });
    }
    for (let cIdx = coreStart; cIdx < aiNodes.length; cIdx++) {
      const cn = aiNodes[cIdx];
      let best1 = 0, best2 = 1, d1 = 999, d2 = 999;
      for (let sIdx = 0; sIdx < cBase; sIdx++) {
        const sn = aiNodes[sIdx];
        const dist = Math.hypot(cn.x - sn.x, cn.y - sn.y, cn.z - sn.z);
        if (dist < d1) { d2 = d1; best2 = best1; d1 = dist; best1 = sIdx; }
        else if (dist < d2) { d2 = dist; best2 = sIdx; }
      }
      aiEdges.push([cIdx, best1, 'core']);
      aiEdges.push([cIdx, best2, 'core']);
      if (cIdx > coreStart) aiEdges.push([cIdx - 1, cIdx, 'core']);
    }

    for (let i = 0; i < aiEdges.length; i += 4) {
      aiPulses.push({
        edgeIdx: i,
        speed: 0.038 + (i % 4) * 0.012,
        offset: (i * 0.17) % 1,
        color: i % 2 === 0 ? '#facc15' : '#ff5e3a'
      });
    }

    window.__brain3DMesh = { humanGyri, humanSulci, aiNodes, aiEdges, aiFacets, aiPulses };
    return window.__brain3DMesh;
  }

  function render3DBrainCanvas(canvasEl, frame) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const W = canvasEl.width;
    const H = canvasEl.height;
    ctx.clearRect(0, 0, W, H);

    const { humanGyri, humanSulci, aiNodes, aiEdges, aiFacets, aiPulses } = build3DBrainMesh();
    const fVal = frame === 999 ? 0 : frame;
    // Start at iconic split-hemisphere 3/4 angle so BOTH Digital AI Network and Human Cortex show right from Frame 0 and rotate like a rotisserie!
    const rotY = 2.96 + fVal * 0.038;
    const pitchX = 0.25;

    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(pitchX), sinX = Math.sin(pitchX);

    const fov = 3.8;
    const scaleBase = W * 0.38;
    const cx = W * 0.50;
    const cy = H * 0.50;

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

    // Unified 3D Z-buffer render queue so Human Hemisphere & Digital AI Hemisphere occlude each other accurately at every rotisserie angle
    const queue = [];

    // Queue Human Gyri (Left Hemisphere)
    for (const g of humanGyri) {
      const pr = project3D(g);
      queue.push({
        type: 'gyrus',
        z: pr.z,
        g,
        pr,
        sr: g.r * scaleBase * pr.persp
      });
    }

    // Queue Human Sulci Ribbons
    for (const ribbon of humanSulci) {
      const pPts = ribbon.map(project3D);
      const avgZ = pPts.reduce((s, p) => s + p.z, 0) / pPts.length;
      queue.push({
        type: 'sulcus',
        z: avgZ + 0.04,
        pPts
      });
    }

    // Project Digital AI Nodes (Right Hemisphere)
    const projAI = aiNodes.map((n) => ({ ...project3D(n), n }));

    // Queue Digital AI Facets
    for (const f of aiFacets) {
      const pa = projAI[f[0]], pb = projAI[f[1]], pc = projAI[f[2]];
      const zAvg = (pa.z + pb.z + pc.z) / 3;
      queue.push({
        type: 'facet',
        z: zAvg,
        pa, pb, pc,
        part: f[3]
      });
    }

    // Queue Digital AI Edges
    for (const e of aiEdges) {
      const pa = projAI[e[0]], pb = projAI[e[1]];
      const zAvg = (pa.z + pb.z) * 0.5;
      queue.push({
        type: 'edge',
        z: zAvg + 0.01,
        pa, pb,
        kind: e[2]
      });
    }

    // Queue Digital AI Pulses
    for (const p of aiPulses) {
      const edge = aiEdges[p.edgeIdx];
      if (!edge) continue;
      const pa = projAI[edge[0]], pb = projAI[edge[1]];
      const zAvg = (pa.z + pb.z) * 0.5;
      const t = (p.offset + fVal * p.speed) % 1;
      queue.push({
        type: 'pulse',
        z: zAvg + 0.02,
        sx: pa.sx + (pb.sx - pa.sx) * t,
        sy: pa.sy + (pb.sy - pa.sy) * t,
        color: p.color
      });
    }

    // Queue Digital AI Nodes
    for (const p of projAI) {
      queue.push({
        type: 'node',
        z: p.z + 0.03,
        p
      });
    }

    // Sort back-to-front
    queue.sort((a, b) => a.z - b.z);

    for (const item of queue) {
      if (item.type === 'gyrus') {
        const { g, pr, sr } = item;
        const depthT = Math.max(0.22, Math.min(1, (pr.z + 1.25) / 2.35));
        const grad = ctx.createRadialGradient(
          pr.sx - sr * 0.28,
          pr.sy - sr * 0.32,
          sr * 0.08,
          pr.sx,
          pr.sy,
          sr
        );
        if (g.part === 'cerebellum') {
          grad.addColorStop(0, \`rgba(251, 146, 60, \${0.92 * depthT})\`);
          grad.addColorStop(0.65, \`rgba(234, 88, 12, \${0.86 * depthT})\`);
          grad.addColorStop(1, \`rgba(154, 52, 18, \${0.80 * depthT})\`);
        } else {
          // Warm Human Cortex (Coral-Rose -> Terracotta -> Warm Amethyst)
          const hiR = Math.round(252 * g.shade);
          const hiG = Math.round(142 * g.shade);
          const hiB = Math.round(138 * g.shade);
          grad.addColorStop(0, \`rgba(\${hiR}, \${hiG}, \${hiB}, \${0.94 * depthT})\`);
          grad.addColorStop(0.65, \`rgba(225, 68, 92, \${0.88 * depthT})\`);
          grad.addColorStop(1, \`rgba(136, 19, 55, \${0.84 * depthT})\`);
        }
        ctx.beginPath();
        ctx.arc(pr.sx, pr.sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = \`rgba(68, 12, 32, \${0.28 * depthT})\`;
        ctx.stroke();
      } else if (item.type === 'sulcus') {
        if (item.z < -0.2) continue;
        const alpha = Math.max(0.12, Math.min(0.45, (item.z + 0.2) / 1.1));
        ctx.beginPath();
        item.pPts.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        });
        ctx.strokeStyle = \`rgba(254, 215, 170, \${alpha})\`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (item.type === 'facet') {
        const { pa, pb, pc, part, z } = item;
        const depthT = Math.max(0.12, Math.min(0.85, (z + 1.25) / 2.2));
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        ctx.lineTo(pc.sx, pc.sy);
        ctx.closePath();
        ctx.fillStyle = part === 'cerebellum'
          ? \`rgba(124, 58, 237, \${0.18 * depthT})\`
          : \`rgba(37, 99, 235, \${0.18 * depthT})\`;
        ctx.fill();
      } else if (item.type === 'edge') {
        const { pa, pb, kind, z } = item;
        const depthT = Math.max(0.15, Math.min(1, (z + 1.2) / 2.2));
        ctx.beginPath();
        ctx.moveTo(pa.sx, pa.sy);
        ctx.lineTo(pb.sx, pb.sy);
        if (kind === 'core') {
          ctx.strokeStyle = \`rgba(250, 204, 21, \${0.62 * depthT})\`;
          ctx.lineWidth = 1.2 * depthT;
        } else if (kind === 'cerebellum') {
          ctx.strokeStyle = \`rgba(139, 92, 246, \${0.68 * depthT})\`;
          ctx.lineWidth = 1.2 * depthT;
        } else {
          ctx.strokeStyle = \`rgba(37, 99, 235, \${(kind === 'diag' ? 0.42 : 0.78) * depthT})\`;
          ctx.lineWidth = (kind === 'diag' ? 0.95 : 1.45) * depthT;
        }
        ctx.stroke();
      } else if (item.type === 'pulse') {
        if (item.z < -0.25) continue;
        ctx.beginPath();
        ctx.arc(item.sx, item.sy, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
      } else if (item.type === 'node') {
        const { p } = item;
        const depthT = Math.max(0.20, Math.min(1, (p.z + 1.15) / 2.2));
        const rad = p.n.r * (0.65 + 0.50 * depthT);
        if (p.n.isHub && p.z > -0.15) {
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, rad + 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = p.n.color;
          ctx.globalAlpha = 0.45 * depthT;
          ctx.lineWidth = 1.15;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fillStyle = p.n.color;
        ctx.globalAlpha = 0.55 + 0.45 * depthT;
        ctx.fill();
        if (p.z > -0.2) {
          ctx.lineWidth = 0.85;
          ctx.strokeStyle = 'rgba(17, 17, 19, 0.65)';
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  window.__sbStudio = {
    setSpot(x, y, w, h, rx = 16, opacity = 1) {
      const el = document.getElementById('sb-spot');
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
      const stageEl = document.getElementById('sb-stage');
      stageEl.style.opacity = '1';
      stageEl.classList.remove('hidden');
      document.getElementById('sb-cursor').style.display = 'none';
      window.__sbStudio.setSpot(0, 0, 0, 0, 16, 0);

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

      const content = document.getElementById('sb-stage-content');
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
      const stageEl = document.getElementById('sb-stage');
      stageEl.style.opacity = '1';
      stageEl.classList.remove('hidden');
      document.getElementById('sb-cursor').style.display = 'none';
      window.__sbStudio.setSpot(0, 0, 0, 0, 999, 0);

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

      const content = document.getElementById('sb-stage-content');
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
      const stageEl = document.getElementById('sb-stage');
      stageEl.style.opacity = '1';
      stageEl.classList.remove('hidden');
      document.getElementById('sb-cursor').style.display = 'none';
      window.__sbStudio.setSpot(0, 0, 0, 0, 999, 0);

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
           <canvas id="sb-brain-canvas" width="320" height="260" style="width: 160px; height: 130px;"></canvas>
         </span>\`;

      const badgesHtml = showBadges
        ? \`<div style="margin-bottom: 8px;">\${window.__sbStudio.getBrandLogosHtml(frame, slowRevealBadges)}</div>\`
        : '';

      const content = document.getElementById('sb-stage-content');
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
      render3DBrainCanvas(document.getElementById('sb-brain-canvas'), frame);
    }
  };

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

  const scrubber = document.getElementById('sb-scrubber');
  scrubber.max = String(TOTAL_FRAMES - 1);

  const pillsEl = document.getElementById('sb-scene-pills');
  const segsEl = document.getElementById('sb-segments');

  SCENES.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'sb-scene-btn';
    btn.textContent = s.name;
    btn.onclick = () => seekTo(s.start);
    s.btnEl = btn;
    pillsEl.appendChild(btn);

    const seg = document.createElement('div');
    seg.className = 'sb-seg';
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
    document.getElementById('sb-timecode').textContent =
      \`Frame \${String(currentFrame).padStart(3, '0')} / \${TOTAL_FRAMES} · \${(currentFrame / 24).toFixed(2)}s · \${scene.name}\`;

    if (scene.id === 0) {
      closeSearchModal();
      window.__sbStudio.renderOutroLockup(localF, {
        title: 'Second Brain',
        showBadges: true,
        slowRevealBadges: true
      });
    } else if (scene.id === 1) {
      closeSearchModal();
      window.__sbStudio.renderStrikethroughScene(localF, {
        from: 'Scattered notes and folders',
        toBefore: 'See how everything ',
        toHighlight: 'connects.',
        toAfter: '',
        sub: 'Map your ideas visually.<br>Let your AI Agent organize and file your notes!'
      });
    } else if (scene.id === 2) {
      closeSearchModal();
      window.__sbStudio.renderFeatureHeadlineScene(localF, {
        tag: '01',
        label: 'Interactive Mind Map',
        lines: ['Find, relate, and', 'connect ideas.'],
        highlightWord: 'connect ideas.',
        subhead: 'Simple and easy to use in plain Markdown. Zoom into any topic and read notes right in place.'
      });
    } else if (scene.id === 3) {
      const stageEl = document.getElementById('sb-stage');
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
      window.__sbStudio.renderFeatureHeadlineScene(localF, {
        tag: '02',
        label: 'Force-Directed Graph',
        lines: ['Every Markdown link', 'becomes a live edge.'],
        highlightWord: 'live edge.',
        subhead: 'Drag nodes to explore clusters. Click any concept to read its Architecture Decision Record.'
      });
    } else if (scene.id === 5) {
      const stageEl = document.getElementById('sb-stage');
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
      window.__sbStudio.renderFeatureHeadlineScene(localF, {
        tag: '03',
        label: 'Fast and Accurate Search',
        lines: ['Jump straight to', 'any section.'],
        highlightWord: 'any section.',
        subhead: 'Fuzzy search across titles, tags, and headings—built for both humans and AI agents.'
      });
    } else if (scene.id === 7) {
      const stageEl = document.getElementById('sb-stage');
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
          if (hit) hit.classList.add('sb-hit-hl');
        }
      } else {
        closeSearchModal();
        setViewSwitch('docs');
        openDoc('reference/open-knowledge-format.md');
      }
    } else if (scene.id === 8) {
      closeSearchModal();
      window.__sbStudio.renderOutroLockup(localF, {
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
    document.getElementById('sb-play-btn').textContent = playing ? '⏸ Pause' : '▶ Play';
  }

  document.getElementById('sb-play-btn').onclick = () => {
    playing = !playing;
    updatePlayBtn();
  };
  document.getElementById('sb-restart-btn').onclick = () => {
    seekTo(0);
    playing = true;
    updatePlayBtn();
  };
  document.getElementById('sb-prev-btn').onclick = () => {
    playing = false;
    updatePlayBtn();
    seekTo(currentFrame - 1);
  };
  document.getElementById('sb-next-btn').onclick = () => {
    playing = false;
    updatePlayBtn();
    seekTo(currentFrame + 1);
  };
  document.getElementById('sb-speed-btn').onclick = (e) => {
    const speeds = [0.5, 1.0, 1.5];
    speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    e.target.textContent = speed.toFixed(1) + 'x';
  };

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.id !== 'sb-scrubber') return;
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

const out = siteHtml.replace('</body>', `${studioPreviewAddon}\n</body>`);
fs.writeFileSync(OUT_HTML, out, 'utf8');
console.log('✅ Built interactive Studio preview at:', OUT_HTML);
