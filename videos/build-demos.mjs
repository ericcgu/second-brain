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

const require = createRequire(import.meta.url);
const pwPath = '/Users/guer/.npm/_npx/db89d7302a373f10/node_modules/playwright';
const { chromium } = require(pwPath);

const ROOT = '/Users/guer/Documents/learning/second-brain';
const SITE_URL = 'file://' + path.join(ROOT, 'site/index.html');
const RENDERS_DIR = path.join(ROOT, 'videos');
const TMP_FRAMES_ROOT = '/private/tmp/sb-remotion-frames';
const BRAIN_PNG_PATH = path.join(RENDERS_DIR, 'digital-brain.png');
const BRAIN_DATA_URI = fs.existsSync(BRAIN_PNG_PATH)
  ? 'data:image/png;base64,' + fs.readFileSync(BRAIN_PNG_PATH).toString('base64')
  : '';

const FPS = 24;
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
        document.getElementById('remocn-stage').classList.add('hidden');
        document.getElementById('remocn-cursor').style.display = 'block';
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
      getBrandLogosHtml() {
        const pillStyle = `display: flex; align-items: center; justify-content: flex-start; gap: 12px; width: 100%; height: 54px; box-sizing: border-box; background: #ffffff; border: 2px solid rgba(17,17,19,0.12); box-shadow: 0 6px 18px rgba(17,17,19,0.06); padding: 0 20px; border-radius: 16px; font-size: 22px; font-weight: 600; color: #111113; letter-spacing: -0.02em; white-space: nowrap;`;
        const iconBox = `display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;`;
        const plusStyle = `display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #ff5e3a; width: 38px;`;
        return `
          <div style="display: flex; justify-content: center; margin-bottom: 26px;">
            <div style="display: inline-grid; grid-template-columns: 440px 38px 440px; align-items: center; row-gap: 14px;">
              <div style="${pillStyle}">
                <span style="${iconBox}">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 19,6.5 21,15.5 14,22 6,19.5 3,11" fill="#7C3AED"/>
                    <polygon points="12,2 19,6.5 13.5,12 7.5,7.5" fill="#A78BFA"/>
                    <polygon points="13.5,12 21,15.5 14,22 9,15.5" fill="#5B21B6"/>
                    <polygon points="7.5,7.5 13.5,12 9,15.5 3,11" fill="#8B5CF6"/>
                  </svg>
                </span>
                <span>Obsidian Mind Map & Graph</span>
              </div>
              <div style="${plusStyle}">+</div>
              <div style="${pillStyle}">
                <span style="${iconBox}">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" fill="#2563EB"/>
                    <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" fill="#60A5FA"/>
                    <path d="M7 8h3M7 11.5h3M14 8h3M14 11.5h3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                </span>
                <span>Developer Docs</span>
              </div>

              <div style="${pillStyle}">
                <span style="${iconBox}">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <circle cx="10.5" cy="10.5" r="6.5" stroke="#ff5e3a" stroke-width="2.6"/>
                    <path d="M15.5 15.5L20.5 20.5" stroke="#111113" stroke-width="2.6" stroke-linecap="round"/>
                  </svg>
                </span>
                <span>Fast Accurate Search</span>
              </div>
              <div style="${plusStyle}">+</div>
              <div style="${pillStyle}">
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
       * @remocn/strikethrough-replace + @remocn/marker-highlight
       * Draws a coral #ff5e3a strike across `from`, then reveals `to` with a warm #facc15 marker sweep.
       */
      renderStrikethroughScene(frame, totalFrames, { eyebrow, from, toBefore, toHighlight, toAfter, sub }) {
        const stageEl = document.getElementById('remocn-stage');
        stageEl.classList.remove('hidden');
        document.getElementById('remocn-cursor').style.display = 'none';

        const strikeEnd = totalFrames * 0.36;
        const swapEnd = totalFrames * 0.50;

        const linePct = interp(frame, [4, strikeEnd], [0, 100], easeOutCubic);
        const fromOpacity = interp(frame, [strikeEnd, swapEnd], [1, 0.18], easeOutCubic);
        const fromY = interp(frame, [strikeEnd, swapEnd], [0, -48], easeOutCubic);
        const fromScale = interp(frame, [strikeEnd, swapEnd], [1, 0.74], easeOutCubic);

        const toOpacity = interp(frame, [strikeEnd - 2, swapEnd + 2], [0, 1], easeOutCubic);
        const toY = interp(frame, [strikeEnd - 2, swapEnd + 4], [28, 16], easeOutQuint);
        const markerW = springScale(frame, swapEnd - 2) * 100;
        const subOpacity = interp(frame, [swapEnd + 3, swapEnd + 13], [0, 1], easeOutCubic);

        const content = document.getElementById('remocn-stage-content');
        content.style.textAlign = 'center';
        content.innerHTML = `
          <div style="font-size: 62px; font-weight: 700; color: #111113; margin-bottom: 32px; letter-spacing: -0.035em; line-height: 1.12;">
            New AI concepts & ideas <span style="color: #ff5e3a;">moving too fast?</span>
          </div>
          <div style="position: relative; height: 165px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; font-size: 66px; font-weight: 600; color: #171717; letter-spacing: -0.035em; white-space: nowrap; opacity: ${fromOpacity.toFixed(3)}; transform: translateY(${fromY.toFixed(1)}px) scale(${fromScale.toFixed(3)});">
              <span style="position: relative; display: inline-block;">
                ${from}
                <span style="position: absolute; left: -1%; top: 52%; height: 8px; width: ${linePct.toFixed(1)}%; background: #ff5e3a; border-radius: 4px; transform: translateY(-50%);"></span>
              </span>
            </div>
            <div style="position: absolute; font-size: 94px; font-weight: 700; color: #111113; letter-spacing: -0.04em; white-space: nowrap; opacity: ${toOpacity.toFixed(3)}; transform: translateY(${toY.toFixed(1)}px);">
              ${toBefore}<span style="position: relative; display: inline-block; padding: 0 16px; margin: 0 4px;">
                <span style="position: absolute; left: 0; top: 8%; bottom: 6%; width: ${markerW.toFixed(1)}%; background: #facc15; border-radius: 12px; z-index: 0;"></span>
                <span style="position: relative; z-index: 1; color: #111113;">${toHighlight}</span>
              </span>${toAfter || ''}
            </div>
          </div>
          <div style="margin-top: 34px; font-size: 38px; font-weight: 600; color: #3F3E3A; letter-spacing: -0.02em; opacity: ${subOpacity.toFixed(3)};">
            ${sub || ''}
          </div>
        `;
      },

      /**
       * @remocn/feature-headline (Light Theme #F5F4F0)
       * Expanding pill + 92px masked word-by-word rise + marker highlight + 38px subhead
       */
      renderFeatureHeadlineScene(frame, totalFrames, { tag, label, lines, highlightWord, subhead }) {
        const stageEl = document.getElementById('remocn-stage');
        stageEl.classList.remove('hidden');
        document.getElementById('remocn-cursor').style.display = 'none';
        window.__remocn.setSpot(0, 0, 0, 0, 999, 0);

        const pillT = interp(frame, [0, 10], [0, 1], easeOutQuint);
        const clipRight = (1 - pillT) * 100;

        let wordIndex = 0;
        const hlTokens = highlightWord
          ? highlightWord.split(' ').map((s) => s.replace(/[.,]/g, ''))
          : [];
        const linesHtml = lines.map((lineStr) => {
          const words = lineStr.split(' ');
          const spans = words.map((w) => {
            const idx = wordIndex++;
            const t = interp(frame, [2 + idx * 2, 14 + idx * 2], [0, 1], easeOutQuint);
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

        const subStart = 10 + wordIndex * 1.4;
        const subT = interp(frame, [subStart, subStart + 12], [0, 1], easeOutCubic);
        const subY = (1 - subT) * 14;

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
          <div style="margin-top: 32px; font-size: 38px; font-weight: 500; color: #3F3E3A; line-height: 1.36; letter-spacing: -0.02em; opacity: ${subT.toFixed(3)}; transform: translateY(${subY.toFixed(1)}px);">
            ${subhead}
          </div>
        `;
      },

      /**
       * @remocn/per-character-rise + @remocn/kinetic-center-build Outro Lockup
       */
      renderOutroLockup(frame, totalFrames, { title, instant = false, showBadges = true }) {
        const stageEl = document.getElementById('remocn-stage');
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

        const brainInlineHtml = window.__brainSrc
          ? `<img src="${window.__brainSrc}" style="height: 122px; width: auto; display: inline-block; vertical-align: middle; margin-left: 22px; opacity: ${brainT.toFixed(3)}; transform: translateY(-4px) scale(${brainScale.toFixed(3)}); pointer-events: none;" />`
          : '';

        const badgesHtml = showBadges
          ? `<div style="margin-bottom: 8px;">${window.__remocn.getBrandLogosHtml()}</div>`
          : '';

        const content = document.getElementById('remocn-stage-content');
        content.style.textAlign = 'center';
        content.innerHTML = `
          ${badgesHtml}
          <div style="display: inline-flex; align-items: center; justify-content: center; font-size: 100px; font-weight: 700; color: #111113; letter-spacing: -0.045em; line-height: 1.0;">
            <span>${charsHtml}</span>${brainInlineHtml}
          </div>
          <div style="margin-top: 24px; font-size: 36px; font-weight: 600; color: #111113; letter-spacing: -0.025em; opacity: ${tagT.toFixed(3)}; transform: translateY(${tagY.toFixed(1)}px);">
            <span style="background: #facc15; padding: 5px 16px; border-radius: 10px;">Simple & Easy to Use.</span> Zero Dependencies. Works with Any AI Agent.
          </div>
          <div style="margin-top: 26px; opacity: ${pillsT.toFixed(3)};">
            <span style="display: inline-flex; align-items: center; background: #ffffff; border: 2px solid rgba(17,17,19,0.14); box-shadow: 0 12px 32px rgba(17,17,19,0.08); padding: 12px 30px; border-radius: 16px; font-size: 34px; font-weight: 700; letter-spacing: -0.025em;">
              <span style="color: #ff5e3a;">ericcgu.github.io</span><span style="color: #111113;">/second-brain</span>
            </span>
          </div>
        `;
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
    await this.captureFrames(frames);
  }
}

async function recordFullLaunchDemo(browser) {
  const framesDir = path.join(TMP_FRAMES_ROOT, 'demo');
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 2 });
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

  const scene0Frames = Math.round(2.1 * FPS);
  await rec.captureFrames(scene0Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderOutroLockup(f, total, {
        title: 'Second Brain',
        instant: true,
        showBadges: true
      });
    }, [i, scene0Frames]);
  });

  fs.copyFileSync(path.join(framesDir, 'frame-0000.jpg'), '/private/tmp/scene0-cover-preview.jpg');

  // =========================================================================
  // SCENE 1 (3.6s = 86f): @remocn/strikethrough-replace + @remocn/marker-highlight
  // Human-first hook on #F5F4F0 light stage with large 62px/94px typography
  // =========================================================================
  const scene1Frames = Math.round(3.6 * FPS);
  await rec.captureFrames(scene1Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderStrikethroughScene(f, total, {
        eyebrow: 'New AI concepts & ideas moving too fast?',
        from: 'Scattered notes and folders',
        toBefore: 'See how everything ',
        toHighlight: 'connects.',
        toAfter: '',
        sub: 'Map your ideas visually. Let your AI file the notes.'
      });
    }, [i, scene1Frames]);
  });

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 4).padStart(4, '0')}.jpg`), '/private/tmp/scene1-preview.jpg');

  // =========================================================================
  // SCENE 2 (2.9s = 70f): @remocn/feature-headline — Interactive Mind Map
  // =========================================================================
  const mmStartSec = rec.frameIdx / FPS;
  const scene2Frames = Math.round(2.9 * FPS);
  await rec.captureFrames(scene2Frames, async (i) => {
    await page.evaluate(([f, total]) => {
      window.__remocn.renderFeatureHeadlineScene(f, total, {
        tag: '01',
        label: 'Interactive Mind Map',
        lines: ['Simple, easy to use,', 'in plain Markdown.'],
        highlightWord: 'plain Markdown.',
        subhead: 'Start folded. Open one branch at a time, zoom in, and read notes right in place.'
      });
    }, [i, scene2Frames]);
  });

  fs.copyFileSync(path.join(framesDir, `frame-${String(rec.frameIdx - 4).padStart(4, '0')}.jpg`), '/private/tmp/scene2-preview.jpg');

  // =========================================================================
  // SCENE 3 (6.2s): Butter-smooth Mind Map Expansion, Highlight Halo, & Slide-Over
  // =========================================================================
  await page.evaluate(() => {
    window.__remocn.hideStage();
    setTheme('paper');
    setViewSwitch('split');
    openDoc('index.md');
    expandAll(false);
    fitView();
    window.__remocn.setHud('Split View', 'Read your docs right next to the Mind Map', true);
  });
  await page.waitForTimeout(40);
  await rec.hold(0.95);

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
  // SCENE 5 (6.2s): Live Product — Force-Directed Graph + Multi-Node Drag + Longer Hold
  // =========================================================================
  await page.evaluate(() => {
    window.__remocn.hideStage();
    setViewSwitch('graph');
  });
  await page.waitForTimeout(45);
  await page.evaluate(() => {
    for (let i = 0; i < 140; i++) stepForceGraph();
    graphNodes.forEach(n => {
      if (n.r < 11.5) n.r = 12;
    });
    fitView();
    window.__remocn.setHud('Knowledge Graph', 'Drag nodes around to explore connected ideas', true);
  });
  await rec.hold(1.0);

  // Drag 1: Google Open Knowledge Format (OKF) node
  const okfPos = await page.evaluate(() => window.__remocn.getGraphNodeScreenPos('reference/open-knowledge-format.md'));
  await rec.moveCursor(okfPos.x, okfPos.y, 0.55, false);
  await page.evaluate(() => {
    const n = graphNodes.find(x => x.id === 'reference/open-knowledge-format.md');
    if (n) {
      draggingGraphNode = n;
      hoveredGraphNode = n;
    }
  });

  const drag1Frames = Math.round(1.15 * FPS);
  await rec.captureFrames(drag1Frames, async (_i, p) => {
    const e = easeInOutCubic(p);
    const nx = lerp(okfPos.x, okfPos.x - 125, e);
    const ny = lerp(okfPos.y, okfPos.y - 68, e);
    rec.cx = nx;
    rec.cy = ny;
    await page.evaluate(([sx, sy]) => {
      window.__remocn.setCursor(sx, sy, 0);
      window.__remocn.setSpot(sx, sy, 48, 48, 999, 0.85);
      const rect = canvas.getBoundingClientRect();
      const w = screenToWorld(sx - rect.left, sy - rect.top);
      if (draggingGraphNode) {
        draggingGraphNode.gx = w.x;
        draggingGraphNode.gy = w.y;
        draggingGraphNode.vx = 0;
        draggingGraphNode.vy = 0;
      }
      for (let k = 0; k < 2; k++) stepForceGraph();
    }, [nx, ny]);
  });
  await page.evaluate(() => {
    draggingGraphNode = null;
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
  });
  await rec.hold(0.65);

  // Drag 2: Second Brain Quickstart node
  const qsPos = await page.evaluate(() => window.__remocn.getGraphNodeScreenPos('onboarding/second-brain-quickstart.md'));
  await rec.moveCursor(qsPos.x, qsPos.y, 0.55, false);
  await page.evaluate(() => {
    const n = graphNodes.find(x => x.id === 'onboarding/second-brain-quickstart.md');
    if (n) {
      draggingGraphNode = n;
      hoveredGraphNode = n;
    }
  });

  const drag2Frames = Math.round(1.1 * FPS);
  await rec.captureFrames(drag2Frames, async (_i, p) => {
    const e = easeInOutCubic(p);
    const nx = lerp(qsPos.x, qsPos.x + 110, e);
    const ny = lerp(qsPos.y, qsPos.y - 58, e);
    rec.cx = nx;
    rec.cy = ny;
    await page.evaluate(([sx, sy]) => {
      window.__remocn.setCursor(sx, sy, 0);
      window.__remocn.setSpot(sx, sy, 48, 48, 999, 0.85);
      const rect = canvas.getBoundingClientRect();
      const w = screenToWorld(sx - rect.left, sy - rect.top);
      if (draggingGraphNode) {
        draggingGraphNode.gx = w.x;
        draggingGraphNode.gy = w.y;
        draggingGraphNode.vx = 0;
        draggingGraphNode.vy = 0;
      }
      for (let k = 0; k < 2; k++) stepForceGraph();
    }, [nx, ny]);
  });
  await page.evaluate(() => {
    draggingGraphNode = null;
    window.__remocn.setSpot(0, 0, 0, 0, 999, 0);
  });
  await rec.hold(0.75);

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
  // SCENE 6 (2.7s = 65f): @remocn/feature-headline — Fast Concept Search
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
        label: 'Fast Accurate Search',
        lines: ['Find any concept', 'in milliseconds.'],
        highlightWord: 'in milliseconds.',
        subhead: 'Search titles, headings, and #tags as you type.'
      });
    }, [i, scene6Frames]);
  });

  // =========================================================================
  // SCENE 7 (5.0s): Live Product — Fast Search for "Open Knowledge Format" + Table Highlight
  // =========================================================================
  await page.evaluate(() => {
    window.__remocn.hideStage();
    setViewSwitch('docs');
    openDoc('index.md');
    window.__remocn.setHud('Fast Search', 'Search for Open Knowledge Format (OKF) from anywhere', true);
  });
  await page.waitForTimeout(40);

  // Brief scroll on index.md before clicking Search
  await rec.captureFrames(10, async (_i, p) => {
    await page.evaluate((prog) => {
      const sc = document.getElementById('doc-scroll');
      if (sc) sc.scrollTop = prog * 140;
    }, easeInOutCubic(p));
  });
  await rec.hold(0.25);

  const searchBtnPos = await page.evaluate(() => window.__remocn.getElementCenter('.header-search-btn'));
  await rec.moveCursor(searchBtnPos.x, searchBtnPos.y, 0.5, true);
  await page.evaluate(() => openSearchModal());

  const querySteps = [
    'Open',
    'Open Know',
    'Open Knowledge',
    'Open Knowledge Format',
    'Open Knowledge Format (OKF)'
  ];
  for (const sub of querySteps) {
    await page.evaluate((q) => {
      const inp = document.getElementById('search-modal-input');
      if (inp) inp.value = q;
      renderSpotlightHits(q);
      // Highlight matched terms inside search results list
      const items = document.querySelectorAll('.search-hit-item');
      items.forEach((el, idx) => {
        el.innerHTML = el.innerHTML.replace(
          /(Google Open Knowledge Format \(OKF\)|Open Knowledge Format \(OKF\)|Open Knowledge Format|OKF)/gi,
          '<mark style="background:#facc15; color:#111113; padding:1px 6px; border-radius:5px; font-weight:700;">$1</mark>'
        );
        if (idx === 0) {
          el.style.border = '2.5px solid #facc15';
          el.style.background = 'rgba(250, 204, 21, 0.14)';
          el.style.boxShadow = '0 6px 20px rgba(250, 204, 21, 0.22)';
        }
      });
    }, sub);
    await rec.hold(0.16);
  }
  await rec.hold(0.85);

  const hitPos = await page.evaluate(() => window.__remocn.getElementCenter('.search-hit-item'));
  await rec.moveCursor(hitPos.x, hitPos.y, 0.55, true);
  await page.evaluate(() => {
    closeSearchModal();
    openDoc('reference/open-knowledge-format.md');
    window.__remocn.setHud('Concept Found', 'Scroll down to inspect the Open Knowledge Format (OKF) table', true);
  });
  await rec.hold(0.55);

  // Smoothly scroll down to the Open Knowledge Format (OKF) table and highlight the matched table row!
  const scrollTarget = await page.evaluate(() => {
    const tbl = document.querySelector('#doc-body table');
    const sc = document.getElementById('doc-scroll');
    if (!tbl || !sc) return 220;
    const tblRect = tbl.getBoundingClientRect();
    const scRect = sc.getBoundingClientRect();
    return Math.max(0, sc.scrollTop + (tblRect.top - scRect.top) - 150);
  });

  const scrollFrames = Math.round(0.75 * FPS);
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

  await rec.moveCursor(tableRowPos.x, tableRowPos.y, 0.5, false);
  await rec.hold(1.45);
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
