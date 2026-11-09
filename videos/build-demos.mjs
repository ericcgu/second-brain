#!/usr/bin/env node
/**
 * Remocn Component-Driven Launch Video & GIF Builder for Second Brain
 *
 * Uses the exact math, typography, and light palette (#F5F4F0, #111113, #6E6C67, #ff5e3a, #facc15)
 * from the official @remocn/* components downloaded in `videos/remocn-docs/r/`:
 *   - @remocn/strikethrough-replace (72px editorial strike -> replacement reveal)
 *   - @remocn/marker-highlight      (72px spring marker sweep #facc15)
 *   - @remocn/feature-headline      (92px masked word-by-word rise + expanding pill + 28px subhead)
 *   - @remocn/kinetic-center-build  (80px words entering from right and pushing phrase to center)
 *   - @remocn/per-character-rise    (92px per-character staircase rise)
 *
 * Alternates dedicated full-screen Remocn kinetic typography scenes with live Second Brain
 * product interactions accompanied by oversized 30px light editorial callout banners so text
 * is 100% legible even in a small GitHub README GIF preview.
 * Zero dark-theme or blue-green "vibe-coded" colors.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  const pwFallback = process.env.PLAYWRIGHT_PATH || '/Users/guer/.npm/_npx/db89d7302a373f10/node_modules/playwright';
  ({ chromium } = require(pwFallback));
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'file://' + path.join(ROOT, 'site/index.html');
const RENDERS_DIR = path.join(ROOT, 'videos');
const TMP_FRAMES_ROOT = '/private/tmp/sb-remotion-frames';
const BRAIN_PNG_PATH = path.join(RENDERS_DIR, 'digital-brain.png');
const BRAIN_DATA_URI = fs.existsSync(BRAIN_PNG_PATH)
  ? 'data:image/png;base64,' + fs.readFileSync(BRAIN_PNG_PATH).toString('base64')
  : '';

const FPS = 15;
const WIDTH = 1280;
const HEIGHT = 720; // Canonical Remocn 1280x720 @ 16:9 canvas

function ensureDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

async function injectRemocnEngine(page, brainDataUri) {
  await page.evaluate((brainSrc) => {
    window.__brainSrc = brainSrc;
    const style = document.createElement('style');
    style.textContent = `
      .kbd-badge { display: none !important; }
      .content-split.peek main.doc-pane {
        animation: none !important;
        transition: none !important;
      }
      #remocn-stage, #remocn-stage *, #remocn-hud, #remocn-hud * {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif !important;
        -webkit-font-smoothing: antialiased !important;
      }

      /* Full-screen Remocn Kinetic Typography Stage (#F5F4F0 PALETTES.light) */
      #remocn-stage {
        position: fixed !important;
        inset: 0 !important;
        z-index: 9999 !important;
        background: #F5F4F0 !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        pointer-events: none !important;
      }
      #remocn-stage.hidden {
        display: none !important;
      }
      #remocn-stage-ground {
        position: absolute !important;
        inset: 0 !important;
        background:
          radial-gradient(95% 120% at 108% 118%, rgba(217, 119, 87, 0.12) 0%, rgba(250, 204, 21, 0.10) 45%, transparent 75%),
          radial-gradient(45% 60% at 6% 12%, rgba(236, 220, 242, 0.28) 0%, transparent 80%) !important;
        pointer-events: none !important;
      }
      #remocn-stage-content {
        position: relative !important;
        z-index: 2 !important;
        width: 100% !important;
        max-width: 1140px !important;
        padding: 0 56px !important;
        box-sizing: border-box !important;
        transform: translateY(-38px) !important;
      }

      /* Large, Readable Light Editorial Callout Banner during Product Scenes (28px title!) */
      #remocn-hud {
        position: fixed !important;
        left: 50% !important;
        bottom: 22px !important;
        transform: translateX(-50%) !important;
        z-index: 9998 !important;
        background: rgba(255, 255, 255, 0.98) !important;
        border: 2px solid rgba(17, 17, 19, 0.14) !important;
        box-shadow: 0 18px 44px rgba(17, 17, 19, 0.15), 0 2px 8px rgba(17, 17, 19, 0.06) !important;
        border-radius: 22px !important;
        padding: 15px 30px 15px 18px !important;
        display: flex !important;
        align-items: center !important;
        gap: 16px !important;
        font-family: "Geist", -apple-system, BlinkMacSystemFont, sans-serif !important;
        pointer-events: none !important;
      }
      #remocn-hud.hidden {
        display: none !important;
      }
      #hint, .hint, .canvas-hint {
        display: none !important;
      }
      #remocn-hud-tag {
        font-size: 23px !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em !important;
        color: #111113 !important;
        background: #facc15 !important;
        padding: 8px 20px !important;
        border-radius: 14px !important;
        white-space: nowrap !important;
      }
      #remocn-hud-text {
        font-size: 30px !important;
        font-weight: 600 !important;
        color: #111113 !important;
        letter-spacing: -0.025em !important;
        white-space: nowrap !important;
      }

      /* Simulated Cursor (@remocn/simulated-cursor) */
      #remocn-cursor {
        position: fixed !important;
        left: 640px;
        top: 360px;
        width: 36px !important;
        height: 36px !important;
        z-index: 10000 !important;
        pointer-events: none !important;
        transform: translate(-4px, -4px) scale(1);
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.22));
      }
      #remocn-cursor-ring {
        position: fixed !important;
        left: 640px;
        top: 360px;
        width: 48px !important;
        height: 48px !important;
        margin-left: -24px !important;
        margin-top: -24px !important;
        border-radius: 50% !important;
        border: 3px solid #111113 !important;
        background: rgba(250, 204, 21, 0.32) !important;
        z-index: 9999 !important;
        pointer-events: none !important;
        opacity: 0;
        transform: scale(0.5);
      }
      #remocn-spot {
        position: fixed !important;
        left: 0;
        top: 0;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        border: 3px solid #facc15 !important;
        background: rgba(250, 204, 21, 0.22) !important;
        box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.18) !important;
        z-index: 9997 !important;
        pointer-events: none !important;
        opacity: 0;
        transform: translate(-50%, -50%);
      }
    `;
    document.head.appendChild(style);

    const stage = document.createElement('div');
    stage.id = 'remocn-stage';
    stage.innerHTML = `<div id="remocn-stage-ground"></div><div id="remocn-stage-content"></div>`;
    document.body.appendChild(stage);

    const hud = document.createElement('div');
    hud.id = 'remocn-hud';
    hud.className = 'hidden';
    hud.innerHTML = `<span id="remocn-hud-tag">01</span><span id="remocn-hud-text">Interactive Mind Map</span>`;
    document.body.appendChild(hud);

    const spot = document.createElement('div');
    spot.id = 'remocn-spot';
    document.body.appendChild(spot);

    const ring = document.createElement('div');
    ring.id = 'remocn-cursor-ring';
    document.body.appendChild(ring);

    const cursor = document.createElement('div');
    cursor.id = 'remocn-cursor';
    cursor.innerHTML = `
      <svg viewBox="0 0 36 36" width="36" height="36">
        <path d="M7 4 L29 16.5 L19 19.5 L23.5 30 L18.5 32 L14 21.5 L7 27 Z" fill="#111113" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>
    `;
    document.body.appendChild(cursor);

    // Math helpers matching Remotion interpolate / Easing.bezier(0.22, 1, 0.36, 1)
    function clamp01(v) {
      return Math.max(0, Math.min(1, v));
    }
    function interp(frame, [f0, f1], [v0, v1], easeFn) {
      const t = clamp01((frame - f0) / Math.max(0.0001, f1 - f0));
      const e = easeFn ? easeFn(t) : t;
      return v0 + (v1 - v0) * e;
    }
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }
    function springScale(frame, delay = 0) {
      const f = Math.max(0, frame - delay);
      const progress = 1 - Math.exp(-0.22 * f) * Math.cos(0.38 * f);
      return Math.max(0, Math.min(1.04, progress));
    }

    window.__remocn = {
      hideStage() {
        const st = document.getElementById('remocn-stage');
        st.style.opacity = '1';
        st.classList.add('hidden');
        document.getElementById('remocn-cursor').style.display = 'block';
      },
      setStageOpacity(alpha) {
        const st = document.getElementById('remocn-stage');
        st.classList.remove('hidden');
        st.style.opacity = String(alpha);
        document.getElementById('remocn-cursor').style.display = alpha < 0.5 ? 'block' : 'none';
      },
      setHud(tag, text, visible = true) {
        const el = document.getElementById('remocn-hud');
        document.getElementById('remocn-hud-tag').textContent = tag;
        document.getElementById('remocn-hud-text').textContent = text;
        el.classList.toggle('hidden', !visible);
      },
      setSpot(x, y, w = 48, h = 48, radius = 999, opacity = 0) {
        const sp = document.getElementById('remocn-spot');
        sp.style.left = `${x}px`;
        sp.style.top = `${y}px`;
        sp.style.width = `${w}px`;
        sp.style.height = `${h}px`;
        sp.style.borderRadius = `${radius}px`;
        sp.style.opacity = String(opacity);
      },
      getBrandLogosHtml(rawFrame = 999, slowReveal = false) {
        const frame = rawFrame === 999 ? 999 : rawFrame * 1.6;
        const b1 = slowReveal ? interp(frame, [0, 14], [0, 1], easeOutCubic) : 1;
        const b2 = slowReveal ? interp(frame, [11, 25], [0, 1], easeOutCubic) : 1;
        const b3 = slowReveal ? interp(frame, [22, 36], [0, 1], easeOutCubic) : 1;
        const b4 = slowReveal ? interp(frame, [33, 47], [0, 1], easeOutCubic) : 1;

        const y1 = (1 - b1) * 14;
        const y2 = (1 - b2) * 14;
        const y3 = (1 - b3) * 14;
        const y4 = (1 - b4) * 14;

        const pillStyle = `display: flex; align-items: center; justify-content: flex-start; gap: 14px; width: 100%; height: 56px; box-sizing: border-box; background: #ffffff; border: 2px solid rgba(17,17,19,0.12); box-shadow: 0 6px 18px rgba(17,17,19,0.06); padding: 0 24px; border-radius: 16px; font-size: 22px; font-weight: 600; color: #111113; letter-spacing: -0.02em; white-space: nowrap;`;
        const iconBox = `display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;`;
        const plusStyle = `display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #ff5e3a; width: 54px;`;
        return `
          <div style="display: flex; justify-content: center; margin-bottom: 30px;">
            <div style="display: inline-grid; grid-template-columns: 456px 54px 456px; align-items: center; row-gap: 18px;">
              <div style="${pillStyle} opacity: ${b1.toFixed(3)}; transform: translateY(${y1.toFixed(1)}px);">
                <span style="${iconBox}">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 19,6.5 21,15.5 14,22 6,19.5 3,11" fill="#7C3AED"/>
                    <polygon points="12,2 19,6.5 13.5,12 7.5,7.5" fill="#A78BFA"/>
                    <polygon points="13.5,12 21,15.5 14,22 9,15.5" fill="#5B21B6"/>
                    <polygon points="7.5,7.5 13.5,12 9,15.5 3,11" fill="#8B5CF6"/>
                  </svg>
                </span>
                <span>Obsidian-Style Mind Map & Graph</span>
              </div>
              <div style="${plusStyle} opacity: ${b2.toFixed(3)}; transform: translateY(${y2.toFixed(1)}px);">+</div>
              <div style="${pillStyle} opacity: ${b2.toFixed(3)}; transform: translateY(${y2.toFixed(1)}px);">
                <span style="${iconBox}">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" fill="#2563EB"/>
                    <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" fill="#60A5FA"/>
                    <path d="M7 8h3M7 11.5h3M14 8h3M14 11.5h3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </span>
                <span>Developer Docs</span>
              </div>

              <div style="${pillStyle} opacity: ${b3.toFixed(3)}; transform: translateY(${y3.toFixed(1)}px);">
                <span style="${iconBox}">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="10.5" cy="10.5" r="6.5" stroke="#ff5e3a" stroke-width="2.6"/>
                    <path d="M15.5 15.5L20.5 20.5" stroke="#111113" stroke-width="2.6" stroke-linecap="round"/>
                  </svg>
                </span>
                <span>Fast and Accurate Search</span>
              </div>
              <div style="${plusStyle} opacity: ${b4.toFixed(3)}; transform: translateY(${y4.toFixed(1)}px);">+</div>
              <div style="${pillStyle} opacity: ${b4.toFixed(3)}; transform: translateY(${y4.toFixed(1)}px);">
                <span style="${iconBox}">
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
        `;
      },

      /**
       * Scene 1:
       * 1. "New AI concepts and ideas moving too fast?"
       * 2. "Scattered notes and folders" -> struck through -> fades away completely (opacity -> 0, height -> 0)
       * 3. "See how everything connects." + "Map your ideas visually. Let your AI Agent organize and file your notes!"
       *    grow up big into center stage!
       */
      renderStrikethroughScene(rawFrame, totalFrames, { from, toBefore, toHighlight, toAfter, sub }) {
        const frame = rawFrame * 1.6;
        const stageEl = document.getElementById('remocn-stage');
        stageEl.style.opacity = '1';
        stageEl.classList.remove('hidden');
        document.getElementById('remocn-cursor').style.display = 'none';

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
        content.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="font-size: 56px; font-weight: 700; color: #111113; margin-bottom: 24px; letter-spacing: -0.035em; line-height: 1.12; white-space: nowrap; opacity: ${qT.toFixed(3)}; transform: translateY(${qY.toFixed(1)}px);">
              New AI concepts and ideas <span style="color: #ff5e3a;">moving too fast?</span>
            </div>
            <div style="overflow: hidden; max-height: ${fromMaxH.toFixed(1)}px; margin-bottom: ${fromMb.toFixed(1)}px; font-size: 52px; font-weight: 600; color: #52514E; letter-spacing: -0.03em; white-space: nowrap; opacity: ${fromOpacity.toFixed(3)}; transform: scale(${fromScale.toFixed(3)});">
              <span style="position: relative; display: inline-block; padding: 4px 8px;">
                ${from}
                <span style="position: absolute; left: 0; top: 53%; height: 7px; width: ${linePct.toFixed(1)}%; background: #ff5e3a; border-radius: 4px; transform: translateY(-50%);"></span>
              </span>
            </div>
            <div style="font-size: 94px; font-weight: 700; color: #111113; letter-spacing: -0.04em; line-height: 1.05; white-space: nowrap; opacity: ${toT.toFixed(3)}; transform: translateY(${toY.toFixed(1)}px) scale(${toScale.toFixed(3)});">
              ${toBefore}<span style="position: relative; display: inline-block; padding: 0 16px; margin: 0 4px;">
                <span style="position: absolute; left: 0; top: 8%; bottom: 6%; width: ${markerW.toFixed(1)}%; background: #facc15; border-radius: 12px; z-index: 0;"></span>
                <span style="position: relative; z-index: 1; color: #111113;">${toHighlight}</span>
              </span>${toAfter || ''}
            </div>
            <div style="margin-top: 30px; font-size: 48px; font-weight: 700; color: #111113; line-height: 1.26; letter-spacing: -0.03em; opacity: ${subT.toFixed(3)}; transform: translateY(${subY.toFixed(1)}px) scale(${subScale.toFixed(3)});">
              ${sub || ''}
            </div>
          </div>
        `;
      },

      /**
       * @remocn/feature-headline (Light Theme #F5F4F0)
       * Expanding pill + 92px masked word-by-word rise + marker highlight + 38px subhead
       */
      renderFeatureHeadlineScene(rawFrame, totalFrames, { tag, label, lines, highlightWord, subhead }) {
        const frame = rawFrame * 1.6;
        const stageEl = document.getElementById('remocn-stage');
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
              ? `background: linear-gradient(180deg, transparent 54%, #facc15 54%, #facc15 92%, transparent 92%); padding: 0 8px; margin: 0 -4px; border-radius: 4px;`
              : '';
            return `
              <span style="display: inline-block; overflow: hidden; vertical-align: top; padding-bottom: 0.14em; margin-bottom: -0.14em;">
                <span style="display: inline-block; transform: translateY(${yPct.toFixed(1)}%); ${hlBg}">
                  ${w}
                </span>
              </span>
            `;
          }).join(' ');
          return `<div style="line-height: 1.06;">${spans}</div>`;
        }).join('');

        const subStart = 16 + wordIndex * 3.8;
        const subT = interp(frame, [subStart, subStart + 18], [0, 1], easeOutCubic);
        const subY = (1 - subT) * 16;

        const content = document.getElementById('remocn-stage-content');
        content.style.textAlign = 'left';
        content.innerHTML = `
          <div style="display: inline-flex; align-items: center; gap: 14px; height: 58px; padding: 0 26px 0 12px; border-radius: 999px; background: rgba(255,255,255,0.96); box-shadow: inset 0 0 0 2px rgba(17,17,19,0.12), 0 6px 18px rgba(17,17,19,0.05); clip-path: inset(0 ${clipRight.toFixed(1)}% 0 0 round 999px); margin-bottom: 32px;">
            <span style="display: inline-flex; align-items: center; height: 40px; padding: 0 18px; border-radius: 999px; background: #111113; color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;">
              ${tag}
            </span>
            <span style="font-size: 26px; font-weight: 600; color: #111113; letter-spacing: -0.015em;">
              ${label}
            </span>
          </div>
          <div style="font-size: 92px; font-weight: 700; color: #111113; letter-spacing: -0.04em;">
            ${linesHtml}
          </div>
          <div style="margin-top: 32px; font-size: 40px; font-weight: 500; color: #3F3E3A; line-height: 1.36; letter-spacing: -0.02em; opacity: ${subT.toFixed(3)}; transform: translateY(${subY.toFixed(1)}px);">
            ${subhead}
          </div>
        `;
      },

      /**
       * @remocn/per-character-rise + @remocn/kinetic-center-build Outro Lockup
       */
      renderOutroLockup(rawFrame, totalFrames, { title, instant = false, showBadges = true, slowRevealBadges = false }) {
        const frame = rawFrame === 999 ? 999 : rawFrame * 1.6;
        const stageEl = document.getElementById('remocn-stage');
        stageEl.style.opacity = '1';
        stageEl.classList.remove('hidden');
        document.getElementById('remocn-cursor').style.display = 'none';
        window.__remocn.setSpot(0, 0, 0, 0, 999, 0);

        const chars = Array.from(title);
        const charsHtml = chars.map((ch, i) => {
          if (instant) {
            return `<span style="display: inline-block; white-space: pre;">${ch}</span>`;
          }
          const local = frame - i * 0.9;
          const opacity = interp(local, [0, 12], [0, 1], easeOutCubic);
          const y = interp(local, [0, 9], [28, 0], easeOutQuint);
          return `<span style="display: inline-block; white-space: pre; opacity: ${opacity.toFixed(3)}; transform: translateY(${y.toFixed(1)}px);">${ch}</span>`;
        }).join('');

        const tagT = instant ? 1 : interp(frame, [6, 18], [0, 1], easeOutCubic);
        const tagY = instant ? 0 : (1 - tagT) * 12;
        const pillsT = instant ? 1 : interp(frame, [10, 22], [0, 1], easeOutCubic);
        const brainT = instant ? 1 : interp(frame, [2, 16], [0, 1], easeOutCubic);
        const brainScale = instant ? 1 : interp(frame, [2, 18], [0.88, 1], easeOutQuint);

        const brainInlineHtml = `<span style="display: inline-flex; align-items: center; justify-content: center; position: relative; vertical-align: middle; margin-left: 36px; opacity: ${brainT.toFixed(3)}; transform: scale(${brainScale.toFixed(3)}); pointer-events: none;">
             <canvas id="remocn-brain-canvas" width="320" height="260" style="width: 160px; height: 130px;"></canvas>
           </span>`;

        const badgesHtml = showBadges
          ? `<div style="margin-bottom: 8px;">${window.__remocn.getBrandLogosHtml(rawFrame, slowRevealBadges)}</div>`
          : '';

        const content = document.getElementById('remocn-stage-content');
        content.style.textAlign = 'center';
        content.innerHTML = `
          ${badgesHtml}
          <div style="display: inline-flex; align-items: center; justify-content: center; font-size: 100px; font-weight: 700; color: #111113; letter-spacing: -0.045em; line-height: 1.0;">
            <span>${charsHtml}</span>${brainInlineHtml}
          </div>
          <div style="margin-top: 24px; font-size: 33px; font-weight: 600; color: #111113; letter-spacing: -0.025em; white-space: nowrap; opacity: ${tagT.toFixed(3)}; transform: translateY(${tagY.toFixed(1)}px);">
            <span style="background: #facc15; padding: 5px 16px; border-radius: 10px;">Simple & Easy to Use.</span> Zero Dependencies. Works with Any AI Agent.
          </div>
          <div style="margin-top: 26px; opacity: ${pillsT.toFixed(3)};">
            <span style="display: inline-flex; align-items: center; background: #ffffff; border: 2px solid rgba(17,17,19,0.14); box-shadow: 0 12px 32px rgba(17,17,19,0.08); padding: 12px 30px; border-radius: 16px; font-size: 34px; font-weight: 700; letter-spacing: -0.025em;">
              <span style="color: #ff5e3a;">ericcgu.github.io</span><span style="color: #111113;">/second-brain</span>
            </span>
          </div>
        `;
        window.__remocn.render3DBrainCanvas(document.getElementById('remocn-brain-canvas'), frame);
      },

      build3DBrainMesh() {
        if (window.__brain3DMesh) return window.__brain3DMesh;
        const gyri = [];
        const filaments = [];
        const synapses = [];
        const nodePalette = ['#facc15', '#ff5e3a', '#38bdf8', '#a78bfa'];

        function cortexPoint(u, v, hemi) {
          const z = (0.5 - u) * 2.28;
          const uArch = Math.sin(u * Math.PI);
          const crown = Math.pow(uArch, 0.72) * (1.04 - 0.12 * (u - 0.45));

          const angle = v * Math.PI;
          const xMag = (0.09 + Math.pow(Math.sin(angle), 0.75) * 0.76) * Math.pow(uArch, 0.76);
          let y = (Math.cos(angle) * 0.66 + 0.22) * crown;
          if (u < 0.38 && v > 0.65) {
            y += (0.38 - u) * (v - 0.65) * 0.95;
          }
          if (u > 0.62 && v > 0.58) {
            y += (u - 0.62) * (v - 0.58) * 1.35;
          }
          const tempMask = Math.exp(-Math.pow((u - 0.46) / 0.16, 2)) * Math.exp(-Math.pow((v - 0.78) / 0.16, 2));
          const sylvianCrease = Math.exp(-Math.pow((u - 0.44) / 0.18, 2)) * Math.exp(-Math.pow((v - 0.54) / 0.07, 2));

          const xFinal = hemi * (xMag + 0.16 * tempMask - 0.09 * sylvianCrease);
          const yFinal = y - 0.28 * tempMask - 0.08 * sylvianCrease;
          const zFinal = z + 0.14 * tempMask;
          return { x: xFinal, y: yFinal, z: zFinal };
        }

        for (let hIdx = 0; hIdx < 2; hIdx++) {
          const hemi = hIdx === 0 ? -1 : 1;
          const U_RINGS = 15;
          const V_STRIPS = 10;

          for (let iu = 1; iu < U_RINGS; iu++) {
            const uBase = iu / U_RINGS;
            for (let iv = 0; iv <= V_STRIPS; iv++) {
              const vBase = iv / V_STRIPS;
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
      },

      render3DBrainCanvas(canvasEl, frame) {
        if (!canvasEl) return;
        const ctx = canvasEl.getContext('2d');
        const W = canvasEl.width;
        const H = canvasEl.height;
        ctx.clearRect(0, 0, W, H);

        const { gyri, filaments, synapses } = window.__remocn.build3DBrainMesh();
        // Slow rotisserie rotation around Y axis starting at iconic 3/4 two-hemisphere view
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

        const projGyri = gyri.map((g) => {
          const pr = project3D(g);
          return { ...g, ...pr, sr: g.r * scaleBase * pr.persp };
        }).sort((a, b) => a.z - b.z);

        for (const g of projGyri) {
          const depthT = Math.max(0.18, Math.min(1, (g.z + 1.25) / 2.35));
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
            grad.addColorStop(0, `rgba(244, 114, 182, ${0.88 * depthT})`);
            grad.addColorStop(0.65, `rgba(192, 38, 211, ${0.82 * depthT})`);
            grad.addColorStop(1, `rgba(107, 33, 168, ${0.75 * depthT})`);
          } else if (g.part === 'stem') {
            grad.addColorStop(0, `rgba(167, 139, 250, ${0.78 * depthT})`);
            grad.addColorStop(1, `rgba(76, 29, 149, ${0.70 * depthT})`);
          } else if (g.hemi < 0) {
            const hiR = Math.round(145 + light * 75);
            const hiG = Math.round(95 + light * 65);
            const hiB = Math.round(235 + light * 20);
            grad.addColorStop(0, `rgba(${hiR}, ${hiG}, ${hiB}, ${0.92 * depthT})`);
            grad.addColorStop(0.68, `rgba(109, 40, 217, ${0.86 * depthT})`);
            grad.addColorStop(1, `rgba(59, 7, 100, ${0.82 * depthT})`);
          } else {
            const hiR = Math.round(90 + light * 75);
            const hiG = Math.round(140 + light * 75);
            const hiB = Math.round(245 + light * 10);
            grad.addColorStop(0, `rgba(${hiR}, ${hiG}, ${hiB}, ${0.92 * depthT})`);
            grad.addColorStop(0.68, `rgba(37, 99, 235, ${0.86 * depthT})`);
            grad.addColorStop(1, `rgba(30, 58, 138, ${0.82 * depthT})`);
          }

          ctx.beginPath();
          ctx.arc(g.sx, g.sy, g.sr, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.lineWidth = 0.9;
          ctx.strokeStyle = `rgba(24, 16, 48, ${0.28 * depthT})`;
          ctx.stroke();
        }

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
            ? `rgba(233, 213, 255, ${alpha})`
            : `rgba(191, 219, 254, ${alpha})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }

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
      },

      setCursor(x, y, clickProgress = 0) {
        const c = document.getElementById('remocn-cursor');
        const r = document.getElementById('remocn-cursor-ring');
        const scale = clickProgress > 0 ? 1 - 0.18 * Math.sin(clickProgress * Math.PI) : 1;
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
        c.style.transform = `translate(-4px, -4px) scale(${scale.toFixed(3)})`;
        r.style.left = `${x}px`;
        r.style.top = `${y}px`;
        if (clickProgress > 0) {
          r.style.opacity = `${(1 - clickProgress).toFixed(3)}`;
          r.style.transform = `scale(${(0.5 + clickProgress * 1.1).toFixed(3)})`;
        } else {
          r.style.opacity = '0';
        }
      },
      getMindMapNodeScreenPos(predicate) {
        computeTreeLayout(rootTree);
        const rect = canvas.getBoundingClientRect();
        const found = visibleNodes.find(predicate);
        if (!found) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: 180, h: 64, badgeX: 640, badgeY: 360 };
        const sx = rect.left + camX + (found.x + found.w / 2) * zoom;
        const sy = rect.top + camY + found.y * zoom;
        const badgeX = rect.left + camX + (found.x + found.w + 14) * zoom;
        return {
          x: sx,
          y: sy,
          w: found.w * zoom,
          h: found.h * zoom,
          badgeX,
          badgeY: sy,
          badgeSize: 30 * zoom
        };
      },
      getGraphNodeScreenPos(docId) {
        const rect = canvas.getBoundingClientRect();
        const found = graphNodes.find(n => n.id === docId) || graphNodes[0];
        if (!found) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        return {
          x: rect.left + camX + found.gx * zoom,
          y: rect.top + camY + found.gy * zoom
        };
      },
      getElementCenter(selector) {
        const el = document.querySelector(selector);
        if (!el) return { x: 640, y: 360 };
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    };
  }, brainDataUri);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function encodeMp4AndGif(framesDir, baseName, gifWidth = 960, gifFps = 15) {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
  const mp4Out = path.join(RENDERS_DIR, `${baseName}.mp4`);
  const gifOut = path.join(RENDERS_DIR, `${baseName}.gif`);
  const palettePath = `/private/tmp/${baseName}-palette.png`;

  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(framesDir, 'frame-%04d.jpg'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-preset', 'fast',
    '-movflags', '+faststart',
    mp4Out
  ], { stdio: 'ignore' });

  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-y',
    '-i', mp4Out,
    '-vf', `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos,palettegen=max_colors=128:stats_mode=diff`,
    palettePath
  ], { stdio: 'ignore' });

  execFileSync('/opt/homebrew/bin/ffmpeg', [
    '-y',
    '-i', mp4Out,
    '-i', palettePath,
    '-lavfi', `fps=${gifFps},scale=${gifWidth}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    gifOut
  ], { stdio: 'ignore' });

  const mp4Size = (fs.statSync(mp4Out).size / 1024 / 1024).toFixed(2);
  const gifSize = (fs.statSync(gifOut).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Built ${baseName}: MP4 = ${mp4Size} MB, GIF = ${gifSize} MB`);
}

class TimelineRecorder {
  constructor(page, framesDir) {
    this.page = page;
    this.framesDir = framesDir;
    this.frameIdx = 0;
    this.cx = 640;
    this.cy = 360;
    ensureDir(framesDir);
  }

  async captureFrames(count, onFrame) {
    for (let i = 0; i < count; i++) {
      const progress = count > 1 ? i / (count - 1) : 1;
      if (onFrame) await onFrame(i, progress);
      await this.page.evaluate(() => {
        if (typeof renderFrame === 'function') renderFrame();
      });
      const file = path.join(this.framesDir, `frame-${String(this.frameIdx).padStart(4, '0')}.jpg`);
      await this.page.screenshot({ path: file, type: 'jpeg', quality: 94 });
      this.frameIdx++;
    }
  }

  async moveCursor(toX, toY, durationSec, clickAtEnd = true) {
    const startX = this.cx;
    const startY = this.cy;
    const moveFrames = Math.max(4, Math.round(durationSec * FPS));
    await this.captureFrames(moveFrames, async (_i, p) => {
      const e = easeInOutCubic(p);
      this.cx = lerp(startX, toX, e);
      this.cy = lerp(startY, toY, e);
      await this.page.evaluate(([x, y]) => window.__remocn.setCursor(x, y, 0), [this.cx, this.cy]);
    });
    if (clickAtEnd) {
      const clickFrames = 5;
      await this.captureFrames(clickFrames, async (_i, p) => {
        await this.page.evaluate(([x, y, cp]) => window.__remocn.setCursor(x, y, cp), [this.cx, this.cy, p]);
      });
    }
  }

  async hold(durationSec) {
    const frames = Math.max(1, Math.round(durationSec * FPS));
    const firstFile = path.join(this.framesDir, `frame-${String(this.frameIdx).padStart(4, '0')}.jpg`);
    await this.page.screenshot({ path: firstFile, type: 'jpeg', quality: 92 });
    this.frameIdx++;
    for (let i = 1; i < frames; i++) {
      const dst = path.join(this.framesDir, `frame-${String(this.frameIdx).padStart(4, '0')}.jpg`);
      fs.copyFileSync(firstFile, dst);
      this.frameIdx++;
    }
  }
}

async function recordFullLaunchDemo(browser) {
  const framesDir = path.join(TMP_FRAMES_ROOT, 'demo');
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1.5 });
  await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  await injectRemocnEngine(page, BRAIN_DATA_URI);

  const rec = new TimelineRecorder(page, framesDir);

  // =========================================================================
  // SCENE 0 (1.6s = 38f): Cover Page (Same as Last Page — Digital Brain + Second Brain Lockup)
  // Starts 100% visible at Frame 0 so the cover thumbnail is crystal clear
  // =========================================================================
  await page.evaluate(() => {
    setTheme('paper');
    setViewSwitch('split');
    openDoc('index.md');
    expandAll(false);
    fitView();
    window.__remocn.setHud('', '', false);
  });
  await page.waitForTimeout(40);

  // Frame 0: Full cover lockup so static video/GIF thumbnail is 100% populated
  await rec.captureFrames(1, async () => {
    await page.evaluate(() => {
      window.__remocn.renderOutroLockup(999, 999, {
        title: 'Second Brain',
        instant: true,
        showBadges: true,
        slowRevealBadges: false
      });
    });
  });

  // Frames 1..84 (3.5s): Slow staggered reveal of the 4-Pillar badges + hold
  const scene0Frames = Math.round(3.5 * FPS);
  await rec.captureFrames(scene0Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderOutroLockup(f, total, {
        title: 'Second Brain',
        instant: true,
        showBadges: true,
        slowRevealBadges: true
      });
    }, [i, scene0Frames]);
  });

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 2).padStart(4, '0')}.jpg`), '/private/tmp/scene0-cover-preview.jpg');

  // =========================================================================
  // SCENE 1 (4.2s): "Scattered notes and folders" fades away completely -> "See how everything connects." + subtitle grow up big
  // =========================================================================
  const scene1Frames = Math.round(4.2 * FPS);
  await rec.captureFrames(scene1Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderStrikethroughScene(f, total, {
        from: 'Scattered notes and folders',
        toBefore: 'See how everything ',
        toHighlight: 'connects.',
        toAfter: '',
        sub: 'Map your ideas visually.<br>Let your AI Agent organize and file your notes!'
      });
    }, [i, scene1Frames]);
  });

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 4).padStart(4, '0')}.jpg`), '/private/tmp/scene1-preview.jpg');

  // =========================================================================
  // SCENE 2 (4.2s): @remocn/feature-headline — Interactive Mind Map (Humanized & slowed down)
  // =========================================================================
  const mmStartSec = rec.frameIdx / FPS;
  const scene2Frames = Math.round(4.2 * FPS);
  await rec.captureFrames(scene2Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderFeatureHeadlineScene(f, total, {
        tag: '01',
        label: 'Interactive Mind Map',
        lines: ['Find, relate, and', 'connect ideas.'],
        highlightWord: 'connect ideas.',
        subhead: 'Simple and easy to use in plain Markdown. Zoom into any topic and read notes right in place.'
      });
    }, [i, scene2Frames]);
  });

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 4).padStart(4, '0')}.jpg`), '/private/tmp/scene2-preview.jpg');

  // =========================================================================
  // SCENE 3 (6.2s): Butter-smooth Mind Map Expansion, Highlight Halo, & Slide-Over
  // =========================================================================
  await page.evaluate(() => {
    setTheme('paper');
    setViewSwitch('split');
    openDoc('index.md');
    expandAll(false);
    fitView();
    window.__remocn.setHud('Split View', 'Read your docs right next to the Mind Map', true);
  });
  await page.waitForTimeout(40);
  await rec.captureFrames(Math.round(0.4 * FPS), async (_i, p) => {
    await page.evaluate((prog) => {
      window.__remocn.setStageOpacity(1 - prog);
    }, easeInOutCubic(p));
  });
  await page.evaluate(() => window.__remocn.hideStage());
  await rec.hold(0.8);

  const mmSegPos = await page.evaluate(() => window.__remocn.getElementCenter('#seg-mindmap'));
  await rec.moveCursor(mmSegPos.x, mmSegPos.y, 0.55, true);
  await page.evaluate(() => {
    setViewSwitch('mindmap');
    resizeCanvas();
    fitView();
    window.__remocn.setHud('Mind Map', 'Click + on any topic to open its notes', true);
  });
  await page.waitForTimeout(40);
  await rec.hold(0.6);

  // Move cursor smoothly to Reference +2 badge while fading in the yellow highlight halo
  const refPos = await page.evaluate(() => window.__remocn.getMindMapNodeScreenPos(n => n.label === 'Reference'));
  const startX1 = rec.cx, startY1 = rec.cy;
  const moveToBadgeFrames = Math.round(0.65 * FPS);
  await rec.captureFrames(moveToBadgeFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    rec.cx = lerp(startX1, refPos.badgeX, e);
    rec.cy = lerp(startY1, refPos.badgeY, e);
    const spotAlpha = Math.max(0, (p - 0.35) / 0.65);
    await page.evaluate(([x, y, bx, by, a]) => {
      window.__remocn.setCursor(x, y, 0);
      window.__remocn.setSpot(bx, by, 44, 44, 999, a);
    }, [rec.cx, rec.cy, refPos.badgeX, refPos.badgeY, spotAlpha]);
  });
  await rec.hold(0.35);

  // Click pulse on +2 badge (5 frames) and smoothly interpolate camX, camY, zoom over 14 frames
  await rec.captureFrames(5, async (_i, p) => {
    await page.evaluate(([x, y, bx, by, cp]) => {
      window.__remocn.setCursor(x, y, cp);
      window.__remocn.setSpot(bx, by, 44, 44, 999, 1 - cp);
    }, [rec.cx, rec.cy, refPos.badgeX, refPos.badgeY, p]);
  });

  // Expand Reference AND zoom in (1.32x) directly onto Reference + its 2 unfolded concept cards!
  const camInterp = await page.evaluate(() => {
    const sCamX = camX, sCamY = camY, sZoom = zoom;
    const n = visibleNodes.find(x => x.label === 'Reference');
    if (n) n.collapsed = false;
    computeTreeLayout(rootTree);
    const refNode = visibleNodes.find(x => x.label === 'Reference');
    const okfNode = visibleNodes.find(x => x.label.includes('Open Knowledge'));
    const glsNode = visibleNodes.find(x => x.label.includes('Glossary'));
    const eZoom = 1.32;
    const focusWorldX = refNode && okfNode
      ? (refNode.x + okfNode.x + okfNode.w) / 2
      : (refNode ? refNode.x + refNode.w : 400);
    const focusWorldY = refNode && okfNode && glsNode
      ? (glsNode.y + okfNode.y) / 2
      : (refNode ? refNode.y : 0);
    const eCamX = (width * 0.54) - focusWorldX * eZoom;
    const eCamY = (height * 0.48) - focusWorldY * eZoom;
    window.__remocn.setHud('Expand & Zoom In', 'Opened Reference and zoomed in on its 2 concept notes', true);
    return { sCamX, sCamY, sZoom, eCamX, eCamY, eZoom };
  });

  const expandFrames = Math.round(0.68 * FPS);
  await rec.captureFrames(expandFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    await page.evaluate(([scx, scy, sz, ecx, ecy, ez, t]) => {
      camX = scx + (ecx - scx) * t;
      camY = scy + (ecy - scy) * t;
      zoom = sz + (ez - sz) * t;
      const n = visibleNodes.find(x => x.label === 'Reference');
      if (n) {
        const rect = canvas.getBoundingClientRect();
        const bx = rect.left + camX + (n.x + n.w + 14) * zoom;
        const by = rect.top + camY + n.y * zoom;
        window.__remocn.setCursor(bx, by, 0);
      }
    }, [camInterp.sCamX, camInterp.sCamY, camInterp.sZoom, camInterp.eCamX, camInterp.eCamY, camInterp.eZoom, e]);
  });

  const refAfter = await page.evaluate(() => window.__remocn.getMindMapNodeScreenPos(n => n.label === 'Reference'));
  rec.cx = refAfter.badgeX;
  rec.cy = refAfter.badgeY;
  await rec.hold(0.5);

  // Move cursor smoothly to the zoomed-in Google Open Knowledge Format card and fade in card highlight halo
  const okfCardPos = await page.evaluate(() => window.__remocn.getMindMapNodeScreenPos(n => n.label.includes('Open Knowledge')));
  const startX2 = rec.cx, startY2 = rec.cy;
  const moveToCardFrames = Math.round(0.65 * FPS);
  await rec.captureFrames(moveToCardFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    rec.cx = lerp(startX2, okfCardPos.x, e);
    rec.cy = lerp(startY2, okfCardPos.y, e);
    const spotAlpha = Math.max(0, (p - 0.25) / 0.75);
    await page.evaluate(([x, y, cx, cy, cw, ch, a]) => {
      window.__remocn.setCursor(x, y, 0);
      window.__remocn.setSpot(cx, cy, cw + 16, ch + 16, 18, a);
    }, [rec.cx, rec.cy, okfCardPos.x, okfCardPos.y, okfCardPos.w, okfCardPos.h, spotAlpha]);
  });
  await rec.hold(0.55);

  // Click card (5 frames) and smoothly slide in the Reader Drawer while panning zoomed-in card into left half!
  await rec.captureFrames(5, async (_i, p) => {
    await page.evaluate(([x, y, cx, cy, cw, ch, cp]) => {
      window.__remocn.setCursor(x, y, cp);
      window.__remocn.setSpot(cx, cy, cw + 16, ch + 16, 18, 1 - cp * 0.3);
    }, [rec.cx, rec.cy, okfCardPos.x, okfCardPos.y, okfCardPos.w, okfCardPos.h, p]);
  });

  const slideTargetCamX = await page.evaluate(() => {
    openDoc('reference/open-knowledge-format.md');
    openPeek();
    const dp = document.getElementById('doc-pane');
    if (dp) dp.style.transform = 'translateX(100%)';
    window.__remocn.setHud('Read in Place', 'Click any card to read the note on the right', true);
    const okfNode = visibleNodes.find(x => x.label.includes('Open Knowledge'));
    const leftVisibleCenter = (width - Math.min(640, width * 0.92)) * 0.52;
    return okfNode ? leftVisibleCenter - (okfNode.x + okfNode.w / 2) * zoom : camX - 320;
  });

  const slideFrames = Math.round(0.6 * FPS);
  await rec.captureFrames(slideFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    await page.evaluate(([targetCamX, prog]) => {
      const dp = document.getElementById('doc-pane');
      if (dp) dp.style.transform = `translateX(${((1 - prog) * 100).toFixed(2)}%)`;
      const baseCamX = window.__baseCamX ?? (window.__baseCamX = camX);
      camX = baseCamX + (targetCamX - baseCamX) * prog;
      const pos = window.__remocn.getMindMapNodeScreenPos(n => n.label.includes('Open Knowledge'));
      window.__remocn.setCursor(pos.x, pos.y, 0);
      window.__remocn.setSpot(pos.x, pos.y, pos.w + 14, pos.h + 14, 18, 0.9);
    }, [slideTargetCamX, e]);
  });
  await page.evaluate(() => { delete window.__baseCamX; });
  const okfPannedPos = await page.evaluate(() => window.__remocn.getMindMapNodeScreenPos(n => n.label.includes('Open Knowledge')));
  rec.cx = okfPannedPos.x;
  rec.cy = okfPannedPos.y;
  await rec.hold(1.45);

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 2).padStart(4, '0')}.jpg`), '/private/tmp/mm-peek-smooth.jpg');
  await page.evaluate(() => {
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
    const dp = document.getElementById('doc-pane');
    if (dp) dp.style.transform = '';
    closePeek();
  });
  const mmEndSec = rec.frameIdx / FPS;

  // =========================================================================
  // SCENE 4 (2.7s = 65f): @remocn/feature-headline — Interactive Knowledge Graph
  // =========================================================================
  const graphStartSec = rec.frameIdx / FPS;
  await page.evaluate(() => window.__remocn.setHud('', '', false));
  const scene4Frames = Math.round(2.7 * FPS);
  await rec.captureFrames(scene4Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderFeatureHeadlineScene(f, total, {
        tag: '02',
        label: 'Interactive Knowledge Graph',
        lines: ['See how your ideas', 'link together.'],
        highlightWord: 'link together.',
        subhead: 'Every link between Markdown files shows up on the graph automatically.'
      });
    }, [i, scene4Frames]);
  });

  // =========================================================================
  // SCENE 5 (6.5s): Smooth Dissolve Transition into Force-Directed Graph + Deterministic 24fps Physics
  // =========================================================================
  await page.evaluate(() => {
    setViewSwitch('graph');
  });
  await page.waitForTimeout(45);

  const graphInitZoom = await page.evaluate(() => {
    if (!window.__realStepForceGraph) {
      window.__realStepForceGraph = stepForceGraph;
    }
    for (let i = 0; i < 240; i++) window.__realStepForceGraph();
    // Lock stepForceGraph so wall-clock rAF does not advance physics 7x between screenshots
    stepForceGraph = () => {};
    fitView();
    window.__remocn.setHud('Knowledge Graph', 'Drag nodes around to explore connected ideas', true);
    return { camX, camY, zoom };
  });

  // Smooth 0.5s (12f) cross-dissolve from Scene 4 title card into the live Graph with gentle zoom-in
  const dissolveGraphFrames = Math.round(0.5 * FPS);
  await rec.captureFrames(dissolveGraphFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    await page.evaluate(([baseX, baseY, baseZ, prog]) => {
      window.__remocn.setStageOpacity(1 - prog);
      const zScale = 0.90 + 0.22 * prog; // 0.90 -> 1.12
      zoom = baseZ * zScale;
      camX = (width / 2) - ((width / 2 - baseX) / baseZ) * zoom;
      camY = (height / 2) - ((height / 2 - baseY) / baseZ) * zoom;
    }, [graphInitZoom.camX, graphInitZoom.camY, graphInitZoom.zoom, e]);
  });
  await page.evaluate(() => window.__remocn.hideStage());
  await rec.hold(0.85);

  // Drag 1: Google Open Knowledge Format (OKF) node (deterministic 1 physics step per frame)
  const okfPos = await page.evaluate(() => window.__remocn.getGraphNodeScreenPos('reference/open-knowledge-format.md'));
  await rec.moveCursor(okfPos.x, okfPos.y, 0.55, false);
  await page.evaluate(() => {
    const n = graphNodes.find(x => x.id === 'reference/open-knowledge-format.md');
    if (n) draggingGraphNode = n;
  });

  const drag1Frames = Math.round(1.15 * FPS);
  await rec.captureFrames(drag1Frames, async (_i, p) => {
    const e = easeInOutCubic(p);
    const nx = lerp(okfPos.x, okfPos.x - 115, e);
    const ny = lerp(okfPos.y, okfPos.y - 62, e);
    rec.cx = nx;
    rec.cy = ny;
    await page.evaluate(([sx, sy]) => {
      window.__remocn.setCursor(sx, sy, 0);
      window.__remocn.setSpot(sx, sy, 46, 46, 999, 0.85);
      const rect = canvas.getBoundingClientRect();
      const w = screenToWorld(sx - rect.left, sy - rect.top);
      if (draggingGraphNode) {
        draggingGraphNode.gx = w.x;
        draggingGraphNode.gy = w.y;
        draggingGraphNode.vx = 0;
        draggingGraphNode.vy = 0;
      }
      if (window.__realStepForceGraph) window.__realStepForceGraph();
    }, [nx, ny]);
  });
  await page.evaluate(() => {
    draggingGraphNode = null;
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
  });
  // Smooth 1-step-per-frame settle after releasing Drag 1
  await rec.captureFrames(Math.round(0.65 * FPS), async () => {
    await page.evaluate(() => {
      if (window.__realStepForceGraph) window.__realStepForceGraph();
    });
  });

  // Drag 2: Second Brain Quickstart node
  const qsPos = await page.evaluate(() => window.__remocn.getGraphNodeScreenPos('onboarding/second-brain-quickstart.md'));
  await rec.moveCursor(qsPos.x, qsPos.y, 0.55, false);
  await page.evaluate(() => {
    const n = graphNodes.find(x => x.id === 'onboarding/second-brain-quickstart.md');
    if (n) draggingGraphNode = n;
  });

  const drag2Frames = Math.round(1.1 * FPS);
  await rec.captureFrames(drag2Frames, async (_i, p) => {
    const e = easeInOutCubic(p);
    const nx = lerp(qsPos.x, qsPos.x + 105, e);
    const ny = lerp(qsPos.y, qsPos.y - 54, e);
    rec.cx = nx;
    rec.cy = ny;
    await page.evaluate(([sx, sy]) => {
      window.__remocn.setCursor(sx, sy, 0);
      window.__remocn.setSpot(sx, sy, 46, 46, 999, 0.85);
      const rect = canvas.getBoundingClientRect();
      const w = screenToWorld(sx - rect.left, sy - rect.top);
      if (draggingGraphNode) {
        draggingGraphNode.gx = w.x;
        draggingGraphNode.gy = w.y;
        draggingGraphNode.vx = 0;
        draggingGraphNode.vy = 0;
      }
      if (window.__realStepForceGraph) window.__realStepForceGraph();
    }, [nx, ny]);
  });
  await page.evaluate(() => {
    draggingGraphNode = null;
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
  });
  // Smooth 1-step-per-frame settle after releasing Drag 2
  await rec.captureFrames(Math.round(0.75 * FPS), async () => {
    await page.evaluate(() => {
      if (window.__realStepForceGraph) window.__realStepForceGraph();
    });
  });

  // Click ADR-001 node and smoothly slide in the Reader Drawer + pan graph left
  const adrPos = await page.evaluate(() => window.__remocn.getGraphNodeScreenPos('decisions/adr-001-okf-markdown-knowledge-base.md'));
  await rec.moveCursor(adrPos.x, adrPos.y, 0.6, true);

  const graphSlideTargetCamX = await page.evaluate(() => {
    openDoc('decisions/adr-001-okf-markdown-knowledge-base.md');
    openPeek();
    const dp = document.getElementById('doc-pane');
    if (dp) dp.style.transform = 'translateX(100%)';
    window.__remocn.setHud('Connected Notes', 'Click any node to highlight its links and read it', true);
    const adrNode = graphNodes.find(n => n.id === 'decisions/adr-001-okf-markdown-knowledge-base.md');
    const leftVisibleCenter = (width - Math.min(640, width * 0.92)) * 0.50;
    return adrNode ? leftVisibleCenter - adrNode.gx * zoom : camX - 280;
  });

  const graphSlideFrames = Math.round(0.6 * FPS);
  await rec.captureFrames(graphSlideFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    await page.evaluate(([targetCamX, prog]) => {
      const dp = document.getElementById('doc-pane');
      if (dp) dp.style.transform = `translateX(${((1 - prog) * 100).toFixed(2)}%)`;
      const baseCamX = window.__graphBaseCamX ?? (window.__graphBaseCamX = camX);
      camX = baseCamX + (targetCamX - baseCamX) * prog;
      const pos = window.__remocn.getGraphNodeScreenPos('decisions/adr-001-okf-markdown-knowledge-base.md');
      window.__remocn.setCursor(pos.x, pos.y, 0);
      window.__remocn.setSpot(pos.x, pos.y, 50, 50, 999, 0.88);
    }, [graphSlideTargetCamX, e]);
  });
  await page.evaluate(() => { delete window.__graphBaseCamX; });
  await rec.hold(1.6);
  const graphEndSec = rec.frameIdx / FPS;

  // =========================================================================
  // SCENE 6 (2.7s = 65f): @remocn/feature-headline — Fast and Accurate Search
  // =========================================================================
  const searchStartSec = rec.frameIdx / FPS;
  await page.evaluate(() => {
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
    const dp = document.getElementById('doc-pane');
    if (dp) dp.style.transform = '';
    closePeek();
    window.__remocn.setHud('', '', false);
  });
  const scene6Frames = Math.round(2.7 * FPS);
  await rec.captureFrames(scene6Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderFeatureHeadlineScene(f, total, {
        tag: '03',
        label: 'Fast and Accurate Search',
        lines: ['Find any concept', 'in milliseconds.'],
        highlightWord: 'in milliseconds.',
        subhead: 'Search titles, headings, and #tags as you type.'
      });
    }, [i, scene6Frames]);
  });

  // =========================================================================
  // SCENE 7 (5.6s): Live Product — Type Search Term -> Find & Highlight Search Item -> Open & Inspect
  // =========================================================================
  await page.evaluate(() => {
    setViewSwitch('docs');
    openDoc('index.md');
    window.__remocn.setHud('Fast Search', 'Type your search term to find any concept instantly', true);
  });
  await page.waitForTimeout(40);

  // Smooth 0.4s dissolve into Docs view
  await rec.captureFrames(Math.round(0.4 * FPS), async (_i, p) => {
    await page.evaluate((prog) => {
      window.__remocn.setStageOpacity(1 - prog);
    }, easeInOutCubic(p));
  });
  await page.evaluate(() => window.__remocn.hideStage());

  const searchBtnPos = await page.evaluate(() => window.__remocn.getElementCenter('.header-search-btn'));
  await rec.moveCursor(searchBtnPos.x, searchBtnPos.y, 0.5, true);
  await page.evaluate(() => openSearchModal());
  await rec.hold(0.25);

  // Type "Open Knowledge Format" character-by-character into the search input
  const fullQuery = 'Open Knowledge Format';
  for (let c = 1; c <= fullQuery.length; c++) {
    const sub = fullQuery.slice(0, c);
    await page.evaluate((q) => {
      const inp = document.getElementById('search-modal-input');
      if (inp) inp.value = q;
      renderSpotlightHits(q);
    }, sub);
    await rec.captureFrames(c % 2 === 0 ? 2 : 1);
  }
  await rec.hold(0.35);

  // Move cursor to the matching search item and highlight the found search item!
  const hitBox = await page.evaluate(() => {
    const el = document.querySelector('.search-hit-item');
    if (!el) return { x: 640, y: 260, w: 560, h: 64 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width * 0.48, y: r.top + r.height / 2, w: r.width, h: r.height };
  });

  const sStartX = rec.cx, sStartY = rec.cy;
  const moveToHitFrames = Math.round(0.6 * FPS);
  await rec.captureFrames(moveToHitFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    rec.cx = lerp(sStartX, hitBox.x, e);
    rec.cy = lerp(sStartY, hitBox.y, e);
    const hlAlpha = Math.max(0, (p - 0.3) / 0.7);
    await page.evaluate(([x, y, hx, hy, hw, hh, a]) => {
      window.__remocn.setCursor(x, y, 0);
      window.__remocn.setSpot(hx, hy, hw + 12, hh + 10, 14, a * 0.92);
      if (a > 0.4) {
        const el = document.querySelector('.search-hit-item');
        if (el && !el.dataset.highlighted) {
          el.dataset.highlighted = '1';
          el.innerHTML = el.innerHTML.replace(
            /(Google Open Knowledge Format \(OKF\)|Open Knowledge Format \(OKF\)|Open Knowledge Format)/gi,
            '<mark style="background:#facc15; color:#111113; padding:2px 8px; border-radius:6px; font-weight:700;">$1</mark>'
          );
          el.style.border = '2.5px solid #facc15';
          el.style.background = 'rgba(250, 204, 21, 0.18)';
          el.style.boxShadow = '0 8px 24px rgba(250, 204, 21, 0.25)';
        }
        window.__remocn.setHud('Match Highlighted', 'Found Google Open Knowledge Format (OKF) in milliseconds', true);
      }
    }, [rec.cx, rec.cy, hitBox.x, hitBox.y, hitBox.w, hitBox.h, hlAlpha]);
  });

  // Hold clearly on the highlighted search result item before clicking!
  await rec.hold(1.45);
  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 2).padStart(4, '0')}.jpg`), '/private/tmp/search-hit-highlighted.jpg');

  // Click the highlighted search result to open the concept note
  await rec.captureFrames(5, async (_i, p) => {
    await page.evaluate(([x, y, cp]) => {
      window.__remocn.setCursor(x, y, cp);
    }, [rec.cx, rec.cy, p]);
  });
  await page.evaluate(() => {
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
    closeSearchModal();
    openDoc('reference/open-knowledge-format.md');
    window.__remocn.setHud('Concept Found', 'Scroll down to inspect the Open Knowledge Format (OKF) table', true);
  });
  await rec.hold(0.5);

  // Smoothly scroll down to the Open Knowledge Format (OKF) table so the full table sits cleanly above the bottom HUD banner!
  const scrollTarget = await page.evaluate(() => {
    const tbl = document.querySelector('#doc-body table');
    const sc = document.getElementById('doc-scroll');
    if (!tbl || !sc) return 320;
    const tblRect = tbl.getBoundingClientRect();
    const scRect = sc.getBoundingClientRect();
    return Math.max(0, sc.scrollTop + (tblRect.top - scRect.top) - 65);
  });

  const scrollFrames = Math.round(0.7 * FPS);
  await rec.captureFrames(scrollFrames, async (_i, p) => {
    const e = easeInOutCubic(p);
    await page.evaluate(([targetY, prog]) => {
      const sc = document.getElementById('doc-scroll');
      if (sc) sc.scrollTop = targetY * prog;
    }, [scrollTarget, e]);
  });

  // Highlight the Open Knowledge Format (OKF) header & Concept row in the table
  const tableRowPos = await page.evaluate(() => {
    const tbl = document.querySelector('#doc-body table');
    if (tbl) {
      tbl.style.border = '2px solid rgba(250, 204, 21, 0.85)';
      tbl.style.boxShadow = '0 10px 28px rgba(250, 204, 21, 0.18)';
      const cells = tbl.querySelectorAll('th, td');
      cells.forEach(c => {
        c.innerHTML = c.innerHTML.replace(
          /(Open Knowledge Format \(OKF\)|3\. Concept &amp; Note Cards|3\. Concept & Note Cards|`concept`)/g,
          '<mark style="background:#facc15; color:#111113; padding:2px 7px; border-radius:6px; font-weight:700;">$1</mark>'
        );
      });
      const rows = tbl.querySelectorAll('tbody tr');
      const targetRow = rows[2] || rows[0];
      if (targetRow) {
        targetRow.style.background = 'rgba(250, 204, 21, 0.24)';
        targetRow.style.outline = '2.5px solid #facc15';
        const r = targetRow.getBoundingClientRect();
        return { x: r.left + r.width * 0.42, y: r.top + r.height / 2, w: r.width, h: r.height };
      }
    }
    return { x: 640, y: 420, w: 600, h: 48 };
  });

  await rec.moveCursor(tableRowPos.x, tableRowPos.y, 0.45, false);
  await rec.hold(1.25);
  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 2).padStart(4, '0')}.jpg`), '/private/tmp/search-table-preview.jpg');
  const searchEndSec = rec.frameIdx / FPS;

  // =========================================================================
  // SCENE 8 (2.4s = 58f): @remocn/per-character-rise Outro Lockup (No repeated badges)
  // =========================================================================
  await page.evaluate(() => window.__remocn.setHud('', '', false));
  const scene8Frames = Math.round(2.4 * FPS);
  await rec.captureFrames(scene8Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderOutroLockup(f, total, {
        title: 'Second Brain',
        showBadges: false
      });
    }, [i, scene8Frames]);
  });

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 4).padStart(4, '0')}.jpg`), '/private/tmp/scene8-preview.jpg');

  await page.close();
  encodeMp4AndGif(framesDir, 'second-brain-launch', 920, 15);

  // Also update local README preview GIFs in assets/
  const mp4Full = path.join(RENDERS_DIR, 'second-brain-launch.mp4');
  const gifFull = path.join(RENDERS_DIR, 'second-brain-launch.gif');
  const assetsDir = path.join(ROOT, 'assets');
  fs.copyFileSync(gifFull, path.join(assetsDir, 'demo.gif'));
  fs.copyFileSync(mp4Full, path.join(assetsDir, 'demo.mp4'));

  const sliceGif = (start, dur, outName) => {
    execFileSync('ffmpeg', [
      '-y', '-ss', start.toFixed(2), '-t', dur.toFixed(2), '-i', mp4Full,
      '-vf', 'fps=15,scale=920:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
      path.join(assetsDir, outName)
    ], { stdio: 'ignore' });
  };
  sliceGif(mmStartSec, mmEndSec - mmStartSec, 'mindmap.gif');
  sliceGif(graphStartSec, graphEndSec - graphStartSec, 'graph.gif');
  sliceGif(searchStartSec, searchEndSec - searchStartSec, 'code.gif');
}

(async () => {
  console.log('🎬 Rendering Remocn Kinetic Typography + Product Launch Video...');
  const browser = await chromium.launch({ headless: true });
  try {
    await recordFullLaunchDemo(browser);
    fs.rmSync(TMP_FRAMES_ROOT, { recursive: true, force: true });
    console.log('🎉 Done! Saved videos/second-brain-launch.mp4 and videos/second-brain-launch.gif');
  } finally {
    await browser.close();
  }
})();
