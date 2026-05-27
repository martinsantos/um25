/**
 * pretextFx v5 — Bespoke per-vertical text effects with 60fps polish
 *
 * Built on @chenglou/pretext 0.0.5. Each effect is industry-tied with
 * GPU-only animations, choreographed enter sequences, and idle loops.
 */

import { prepareWithSegments, layoutWithLines, prepare, layout, measureLineStats } from '@chenglou/pretext';
import type { PreparedTextWithSegments, LayoutLine } from '@chenglou/pretext';

const H_FONT = '"Poppins","Futura PT","Century Gothic",sans-serif';
const B_FONT = '"Open Sans",system-ui,sans-serif';
const SVG_NS = 'http://www.w3.org/2000/svg';

// ── Writing styles ──
export type WritingStyle =
  // Sector bespoke
  | 'ecg' | 'splitflap3d' | 'liquid' | 'drafting' | 'dotmatrix'
  | 'conveyor' | 'excavate' | 'cctv' | 'compile'
  // Service bespoke
  | 'packets' | 'tune' | 'ticket' | 'dossier' | 'alarm' | 'surge'
  // Generic
  | 'typewriter' | 'word' | 'decode' | 'scramble' | 'fade' | 'stamp'
  // Legacy aliases
  | 'heartbeat' | 'departure' | 'pour' | 'blueprint' | 'official'
  | 'assembly' | 'drill' | 'surveillance' | 'terminal' | 'code'
  | 'pulse' | 'flipboard' | 'signal' | 'uptime';

interface HeroOpts {
  lines?: number; color?: string; speed?: number; weight?: number;
  style?: WritingStyle; onDone?: () => void;
  ambient?: 'pulse' | 'drift' | 'scan' | false;
}

interface BuildResult {
  chars: HTMLSpanElement[];
  segs: HTMLSpanElement[];
  lines: HTMLDivElement[];
  widths: number[];
  el: HTMLElement;
  fontSize: number;
}

const CHAR_EFFECTS = new Set<string>(['typewriter','decode','scramble','fade','ecg','heartbeat','pulse','compile','terminal','code','cctv','surveillance','tune','alarm','surge','dotmatrix','official','excavate','drill']);
const SEG_EFFECTS = new Set<string>(['splitflap3d','departure','flipboard','liquid','pour','conveyor','assembly','word','packets']);
const LINE_EFFECTS = new Set<string>(['drafting','blueprint','stamp','dossier','ticket']);

// ── 1.1× responsive scale ──
function rSize(): number {
  const vw = window.innerWidth;
  if (vw >= 1024) return 40;
  if (vw >= 640) return 33;
  return 26;
}

// Faster fitFont via measureLineStats (pretext 0.0.5)
export function fitFont(text: string, maxWidth: number, targetLines: number, weight = 700): number {
  const ceil = rSize();
  let lo = 20, hi = ceil, best = 20;
  while (hi - lo > 0.5) {
    const mid = (lo + hi) / 2;
    const p = prepareWithSegments(text, `${weight} ${mid}px ${H_FONT}`);
    const stats = measureLineStats(p, maxWidth);
    if (stats.lineCount <= targetLines) { best = mid; lo = mid; } else { hi = mid; }
  }
  return best;
}

// ── CSS injection ──
let _css = false;
function css() {
  if (_css) return;
  _css = true;
  const s = document.createElement('style');
  s.textContent = `
/* ═══ Base layers ═══ */
.ptfx-line{position:relative;will-change:transform,opacity}
.ptfx-seg{display:inline-block;vertical-align:baseline}
.ptfx-char{display:inline;opacity:0}
.ptfx-char.on{opacity:1}

/* Cursor */
.ptfx-cursor{display:inline-block;width:3px;margin-left:2px;background:var(--c,#DC2626);animation:_bk .53s steps(1) infinite;vertical-align:baseline}
@keyframes _bk{0%,49%{opacity:1}50%,100%{opacity:0}}

/* ═══ Ambient life layer (v6) ═══ */
.ptfx-amb-pulse{animation:_ambPulse 1.2s ease;color:var(--c)}
@keyframes _ambPulse{0%,100%{opacity:1}50%{opacity:.35}}
.ptfx-amb-drift{animation:_ambDrift 1.6s ease;display:inline-block}
@keyframes _ambDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
.ptfx-amb-scan{position:relative}
.ptfx-amb-scan::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.18) 50%,transparent 100%);background-size:40% 100%;background-repeat:no-repeat;animation:_ambScan 1.8s ease;mix-blend-mode:overlay}
@keyframes _ambScan{from{background-position:-40% 0}to{background-position:140% 0}}

/* Line-width enhancements */
.ptfx-ul{position:absolute;bottom:-4px;left:0;height:2px;border-radius:1px;background:var(--c);transform-origin:left;transform:scaleX(0);transition:transform .55s cubic-bezier(.22,1,.36,1)}
.ptfx-ul.on{transform:scaleX(1)}
.ptfx-hl{position:absolute;top:0;left:0;height:100%;background:var(--c);opacity:.06;border-radius:2px;transform-origin:left;transform:scaleX(0);transition:transform .6s cubic-bezier(.22,1,.36,1)}
.ptfx-hl.on{transform:scaleX(1)}

/* ═══ ECG / heartbeat ═══ */
.ptfx-char.beat{display:inline-block;animation:_beat .25s ease;color:var(--c)}
@keyframes _beat{0%{transform:scale(1)}40%{transform:scale(1.45) translateY(-3px)}100%{transform:scale(1)}}
.ptfx-ecg{height:22px;margin-top:10px;position:relative;overflow:hidden;
  background:
    linear-gradient(rgba(34,197,94,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.08) 1px, transparent 1px),
    linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px);
  background-size: 25px 25px, 25px 25px, 5px 5px, 5px 5px;
  border-top:1px solid rgba(34,197,94,0.15);
  border-bottom:1px solid rgba(34,197,94,0.15);
}
.ptfx-ecg svg{position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible}
.ptfx-ecg path{fill:none;stroke:var(--c);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px var(--c));stroke-dasharray:1000;stroke-dashoffset:1000;transition:stroke-dashoffset 2s linear}
.ptfx-ecg.on path{stroke-dashoffset:0}
.ptfx-ecg-label{position:absolute;right:10px;top:50%;transform:translateY(-50%);
  font:600 9px/1 'SF Mono','Fira Code',monospace;color:var(--c);opacity:0;
  transition:opacity .4s ease;letter-spacing:.08em;
  padding:2px 6px;background:rgba(0,0,0,0.5);border-radius:2px;
  border:1px solid rgba(34,197,94,0.3)}
.ptfx-ecg-label.on{opacity:.75}

/* ═══ SPLITFLAP3D ═══ */
.ptfx-flap{display:inline-block;perspective:600px;transform-style:preserve-3d}
.ptfx-flap-inner{display:inline-block;transform-origin:center;transform:rotateX(0);transition:transform .12s ease-out}
.ptfx-flap.landed{animation:_landed .3s cubic-bezier(.34,1.56,.64,1)}
@keyframes _landed{
  0%{transform:scale(1);filter:brightness(1)}
  30%{transform:scale(1.08) translateY(1px);filter:brightness(1.6) drop-shadow(0 0 6px rgba(251,191,36,0.6))}
  60%{transform:scale(.98);filter:brightness(1.1)}
  100%{transform:scale(1);filter:brightness(1)}
}

/* ═══ LIQUID ═══ */
.ptfx-seg.liq{position:relative;color:transparent;
  background:linear-gradient(180deg,rgba(255,255,255,1) 0%,var(--c) 100%);
  -webkit-background-clip:text;background-clip:text;
  clip-path:inset(100% 0 0 0);
  transition:clip-path 1.6s cubic-bezier(.22,1,.36,1);
  text-shadow:0 1px 8px color-mix(in srgb, var(--c) 40%, transparent)}
.ptfx-seg.liq.on{
  clip-path:polygon(0 2%, 5% 0, 10% 3%, 15% 0, 20% 3%, 25% 0, 30% 3%, 35% 0, 40% 3%, 45% 0, 50% 3%, 55% 0, 60% 3%, 65% 0, 70% 3%, 75% 0, 80% 3%, 85% 0, 90% 3%, 95% 0, 100% 2%, 100% 100%, 0 100%)
}
.ptfx-seg.liq::after{content:attr(data-text);position:absolute;inset:0;color:white;clip-path:inset(0 0 100% 0);transition:clip-path 1.6s cubic-bezier(.22,1,.36,1)}
.ptfx-seg.liq.on::after{clip-path:inset(0)}

/* ═══ DRAFTING ═══ */
.ptfx-line.drf{transform:scaleX(0);transform-origin:left;opacity:0;transition:transform .5s cubic-bezier(.22,1,.36,1),opacity .25s}
.ptfx-line.drf.on{transform:scaleX(1);opacity:1}
.ptfx-line.drf .ptfx-seg{color:var(--c);transition:color 1s ease .4s;text-shadow:0 0 6px color-mix(in srgb,var(--c) 40%,transparent)}
.ptfx-line.drf.on.settled .ptfx-seg{color:white;text-shadow:none}
.ptfx-line.drf::before{content:'';position:absolute;top:-6px;left:0;right:0;height:1px;background:repeating-linear-gradient(90deg,var(--c) 0 4px,transparent 4px 12px);opacity:0;transition:opacity .3s ease .2s}
.ptfx-line.drf.on::before{opacity:.4}
/* Corner L-bracket (bottom-right) drawn after settle */
.ptfx-line.drf::after{content:'';position:absolute;bottom:-6px;right:-2px;width:16px;height:16px;
  border-right:2px solid var(--c);border-bottom:2px solid var(--c);
  opacity:0;transform:translate(6px,6px);
  transition:opacity .35s ease .6s, transform .45s cubic-bezier(.22,1,.36,1) .6s}
.ptfx-line.drf.on.settled::after{opacity:.6;transform:translate(0,0)}

/* ═══ DOTMATRIX ═══ */
.ptfx-char.dot{display:inline-block;font-family:'VT323','Courier New',monospace;color:white;text-shadow:0 0 2px var(--c)}
.ptfx-stamp{position:absolute;display:inline-block;color:#DC2626;border:3px solid #DC2626;padding:4px 14px;font:700 18px/1 var(--um-font-display, 'Poppins', sans-serif);text-transform:uppercase;letter-spacing:.15em;border-radius:4px;opacity:0;transform:scale(3.5) rotate(-18deg);pointer-events:none;mix-blend-mode:multiply;filter:drop-shadow(0 1px 0 rgba(0,0,0,.3))}
.ptfx-stamp.on{animation:_stamp .65s cubic-bezier(.22,1,.36,1) forwards}
@keyframes _stamp{
  0%{opacity:0;transform:scale(3.5) rotate(-18deg)}
  35%{opacity:.95;transform:scale(.88) rotate(-12deg)}
  55%{opacity:1;transform:scale(1.08) rotate(-11deg)}
  75%{opacity:.95;transform:scale(.97) rotate(-12deg)}
  100%{opacity:.92;transform:scale(1) rotate(-12deg)}
}
/* Splash ring on stamp land */
.ptfx-stamp::before{content:'';position:absolute;inset:-6px;
  border:2px solid #DC2626;border-radius:6px;opacity:0;
  transform:scale(1)}
.ptfx-stamp.on::before{animation:_stamp-splash .5s ease-out .35s forwards}
@keyframes _stamp-splash{
  0%{opacity:.8;transform:scale(1)}
  100%{opacity:0;transform:scale(2)}
}

/* ═══ CONVEYOR ═══ */
.ptfx-seg.conv{transform:translateX(40px);opacity:0;transition:transform .5s cubic-bezier(.68,-.55,.265,1.55),opacity .25s}
.ptfx-seg.conv.on{transform:translateX(0);opacity:1}
.ptfx-seg.conv.click{animation:_click .15s ease}
@keyframes _click{0%{transform:scale(1)}50%{transform:scale(1.04)}100%{transform:scale(1)}}
.ptfx-conveyor-belt{height:4px;margin-top:12px;
  background:repeating-linear-gradient(-45deg,#fbbf24 0,#fbbf24 6px,#111 6px,#111 12px);
  background-size:17px 4px;opacity:.5;
  animation:_belt-scroll 1.5s linear infinite;border-radius:1px}
@keyframes _belt-scroll{to{background-position:-17px 0}}

/* ═══ EXCAVATE ═══ */
.ptfx-char.exc{display:inline-block;transform:translateY(110%) rotate(0);opacity:0;transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .15s}
.ptfx-char.exc.on{transform:translateY(0) rotate(0);opacity:1}
.ptfx-char-wrap.exc-wrap{display:inline-block;overflow:hidden;vertical-align:bottom}
.ptfx-dust{position:absolute;width:3px;height:3px;background:var(--c);border-radius:50%;pointer-events:none;opacity:0}
.ptfx-dust.go{animation:_dust .6s ease-out forwards}
@keyframes _dust{0%{opacity:.6;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}
.ptfx-excavate-crack{position:relative;margin-bottom:10px;height:2px;
  background:linear-gradient(90deg,transparent 10%,rgba(249,115,22,0.5) 25%,rgba(249,115,22,0.7) 50%,rgba(249,115,22,0.5) 75%,transparent 90%);
  transform:scaleX(0);transform-origin:center;
  transition:transform .7s cubic-bezier(.22,1,.36,1);
  box-shadow:0 0 8px rgba(249,115,22,0.4)}
.ptfx-excavate-crack.on{transform:scaleX(1)}

/* ═══ CCTV ═══ */
.ptfx-cctv{position:relative}
.ptfx-cctv::before{content:'';position:absolute;inset:-8px;background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(0,0,0,.06) 2px 3px);pointer-events:none;mix-blend-mode:multiply}
.ptfx-cctv::after{content:'';position:absolute;inset:-12px;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.45) 100%);pointer-events:none}
.ptfx-char.glitch{position:relative}
.ptfx-char.glitch::before,.ptfx-char.glitch::after{content:attr(data-f);position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.ptfx-char.glitch::before{color:#DC2626;transform:translateX(-1px);mix-blend-mode:screen}
.ptfx-char.glitch::after{color:#22d3ee;transform:translateX(1px);mix-blend-mode:screen}
.ptfx-cctv.cut{animation:_cut .2s steps(2)}
@keyframes _cut{0%,100%{opacity:1}50%{opacity:0}}
.ptfx-hud{position:absolute;top:-22px;right:0;font:600 9px/1 'SF Mono','Fira Code',monospace;color:var(--c);letter-spacing:.05em;display:flex;gap:8px;align-items:center}
.ptfx-hud .rec{color:#DC2626;animation:_bk 1s steps(1) infinite}

/* ═══ COMPILE ═══ */
.ptfx-comp{font-family:'SF Mono','Fira Code','Cascadia Code',monospace}
.ptfx-comp .cmd{color:#7ee787;display:block;font-size:.65em;opacity:0;transition:opacity .3s}
.ptfx-comp .cmd.on{opacity:.9}
.ptfx-comp .prg{color:#c9d1d9;display:block;font-size:.6em;opacity:0;transition:opacity .3s;margin-top:2px}
.ptfx-comp .prg.on{opacity:.7}
.ptfx-comp .out{display:block;margin-top:6px}
.ptfx-comp .ok{color:#7ee787;display:block;font-size:.55em;opacity:0;transition:opacity .4s ease;margin-top:8px;letter-spacing:.03em}
.ptfx-comp .ok.on{opacity:.85}

/* ═══ PACKETS ═══ */
.ptfx-seg.pkt{position:relative;transform:translateX(-20px);opacity:0;transition:transform .25s ease,opacity .15s;margin-top:14px}
.ptfx-seg.pkt::before{content:'';position:absolute;left:-10px;top:0;height:100%;width:6px;background:linear-gradient(90deg,transparent,var(--c));opacity:0;transition:opacity .15s}
.ptfx-seg.pkt.on{transform:translateX(0);opacity:1}
.ptfx-seg.pkt.on::before{opacity:.5;animation:_pktfade .4s ease forwards}
@keyframes _pktfade{to{opacity:0}}
.ptfx-seg.pkt[data-pkt]::after{content:attr(data-pkt);position:absolute;top:-14px;left:0;
  font:600 8px/1 'SF Mono','Fira Code',monospace;color:var(--c);opacity:.5;letter-spacing:.05em}

/* ═══ TUNE — Radio frequency tuning ═══ */
.ptfx-tune-wrap{position:relative}
.ptfx-tune-wrap::before{
  content:'◢ TUNING   88.5 MHz  FM';
  position:absolute;top:-24px;left:0;
  font:600 9px/1 'SF Mono','Fira Code',monospace;
  color:var(--c);opacity:.55;letter-spacing:.1em;
}
.ptfx-tune-dial{
  position:absolute;top:-12px;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--c) 50%,transparent);
  transform-origin:left;transform:scaleX(0);
  transition:transform 1.5s cubic-bezier(.22,1,.36,1);
  opacity:.6;
}
.ptfx-tune-wrap.on .ptfx-tune-dial{transform:scaleX(1)}
.ptfx-char.tune{display:inline-block;filter:blur(4px);opacity:.4;transition:filter .25s ease,opacity .2s}
.ptfx-char.tune.clear{filter:blur(0);opacity:1}
.ptfx-char.tune.clear::after{
  content:'';position:absolute;width:3px;height:100%;top:0;left:0;
  background:var(--c);opacity:0;
}

/* ═══ TICKET — Thermal printer receipt ═══ */
.ptfx-ticket{position:relative;padding:8px 22px;background:rgba(255,255,255,0.02);
  border-left:1px dashed rgba(255,255,255,0.18);
  border-right:1px dashed rgba(255,255,255,0.18);
}
.ptfx-ticket::before{
  content:'════ TICKET #SPT-2026-04-08 ════   24/7';
  display:block;font:600 9px/1.4 'SF Mono',monospace;
  color:var(--c);opacity:.55;letter-spacing:.08em;
  margin-bottom:6px;padding-bottom:4px;
  border-bottom:1px dashed rgba(255,255,255,0.15);
}
.ptfx-ticket::after{
  content:'─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─';
  display:block;font:9px/1.2 monospace;color:rgba(255,255,255,0.15);
  margin-top:4px;letter-spacing:4px;overflow:hidden;white-space:nowrap;
}
.ptfx-line.tkt{clip-path:inset(0 0 100% 0);opacity:0;
  transition:clip-path .55s cubic-bezier(.22,1,.36,1),opacity .3s}
.ptfx-line.tkt.on{clip-path:inset(0);opacity:1}

/* ═══ DOSSIER (page flip) ═══ */
.ptfx-line.dos{transform:rotateY(-90deg);transform-origin:left center;opacity:0;transition:transform .55s cubic-bezier(.22,1,.36,1),opacity .25s}
.ptfx-line.dos.on{transform:rotateY(0);opacity:1}

/* ═══ ALARM ═══ */
.ptfx-alarm{position:relative}
.ptfx-alarm::before{content:'';position:absolute;inset:-8px;border:2px solid #DC2626;opacity:.1;animation:_alarm 1.2s ease-in-out infinite;pointer-events:none}
@keyframes _alarm{0%,100%{opacity:.08}50%{opacity:.45}}
.ptfx-char.alm{display:inline-block}
.ptfx-char.alm.flash{animation:_almflash .4s ease}
@keyframes _almflash{0%{color:#DC2626;text-shadow:0 0 8px #DC2626}100%{color:white;text-shadow:none}}

/* ═══ SURGE (LED warmup) ═══ */
.ptfx-surge{filter:brightness(0)}
.ptfx-surge.go{animation:_surge .8s ease-out forwards}
@keyframes _surge{
  0%{filter:brightness(0)}
  10%{filter:brightness(1.6)}
  20%{filter:brightness(.3)}
  35%{filter:brightness(1.2)}
  50%{filter:brightness(.7)}
  65%{filter:brightness(1.1)}
  100%{filter:brightness(1) drop-shadow(0 0 6px var(--c))}
}

/* ═══ Generic effects (legacy) ═══ */
.ptfx-char.fi{display:inline-block;animation:_fi .7s ease forwards}
@keyframes _fi{from{opacity:0;filter:blur(8px);transform:scale(.8)}to{opacity:1;filter:blur(0);transform:scale(1)}}
.ptfx-char.res{color:var(--c);opacity:.6}
.ptfx-char.fin{opacity:1;color:white;transition:color .15s}
.ptfx-line.stmp{opacity:0;transform:translateY(20px) scale(1.08);transition:opacity .2s,transform .3s cubic-bezier(.34,1.56,.64,1)}
.ptfx-line.stmp.on{opacity:1;transform:translateY(0) scale(1)}

.ptfx-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:var(--c);opacity:.4;margin-bottom:.5rem}

@media (prefers-reduced-motion: reduce){
  .ptfx-char.beat,.ptfx-char.fi,.ptfx-flap.landed,.ptfx-cctv.cut,.ptfx-surge.go,
  .ptfx-seg.pkt.on::before,.ptfx-alarm::before,.ptfx-line.tkt{
    animation:none !important;transition:opacity .3s ease !important
  }
}
`;
  document.head.appendChild(s);
}

// ── Segment walker ──
interface Seg { text: string; kind: string; width: number; idx: number; }

function getSegs(prepared: PreparedTextWithSegments, line: LayoutLine): Seg[] {
  const out: Seg[] = [];
  const startSeg = line.start.segmentIndex;
  const endSeg = line.end.segmentIndex;
  const endGr = line.end.graphemeIndex;
  for (let i = startSeg; i <= endSeg; i++) {
    if (i >= prepared.segments.length) break;
    if (i === endSeg && endGr === 0) break;
    const kind = (prepared as any).kinds[i] as string;
    if (kind === 'hard-break' || kind === 'soft-hyphen' || kind === 'zero-width-break') continue;
    const text = prepared.segments[i];
    const width = (prepared as any).widths[i] as number;
    out.push({ text, kind, width, idx: i });
  }
  return out;
}

// ── Build ECG SVG via DOM API (no innerHTML) ──
function buildEcgSvg(totalW: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${Math.round(totalW)} 18`);
  svg.setAttribute('preserveAspectRatio', 'none');
  const path = document.createElementNS(SVG_NS, 'path');
  // PQRST waveform: flat, P-wave bump, QRS spike, flat, T bump, repeat
  const w = totalW;
  const d = [
    `M 0 9`,
    `L ${w*0.15} 9`,
    `L ${w*0.18} 4`, // P wave up
    `L ${w*0.21} 14`, // QRS spike
    `L ${w*0.24} 9`,
    `L ${w*0.45} 9`,
    `L ${w*0.48} 2`,
    `L ${w*0.51} 16`,
    `L ${w*0.54} 9`,
    `L ${w*0.75} 9`,
    `L ${w*0.78} 4`,
    `L ${w*0.81} 14`,
    `L ${w*0.84} 9`,
    `L ${w} 9`,
  ].join(' ');
  path.setAttribute('d', d);
  svg.appendChild(path);
  return svg;
}

// ── DOM builder ──
function build(el: HTMLElement, text: string, lines: number, weight: number, color: string, style: WritingStyle, responsive: boolean): BuildResult {
  css();
  el.style.setProperty('--c', color);
  el.style.position = 'relative';

  const norm = aliasOf(style);

  const maxW = el.clientWidth;
  const fs = responsive ? rSize() : fitFont(text, maxW, lines, weight);
  const font = `${weight} ${fs}px ${H_FONT}`;
  const lh = fs * 1.12;

  const prepared = prepareWithSegments(text, font);
  const result = layoutWithLines(prepared, maxW, lh);

  el.replaceChildren();

  const allChars: HTMLSpanElement[] = [];
  const allSegs: HTMLSpanElement[] = [];
  const lineDivs: HTMLDivElement[] = [];
  const lineWidths: number[] = [];

  // Container wrappers
  let container: HTMLElement = el;
  if (norm === 'cctv') {
    const wrap = document.createElement('div');
    wrap.className = 'ptfx-cctv';
    const hud = document.createElement('div');
    hud.className = 'ptfx-hud';
    const now = new Date();
    const ts = [now.getHours(), now.getMinutes(), now.getSeconds()].map(n => String(n).padStart(2,'0')).join(':');
    const rec = document.createElement('span');
    rec.className = 'rec';
    rec.textContent = '●';
    hud.appendChild(rec);
    hud.appendChild(document.createTextNode(`REC ${ts} CAM-01`));
    wrap.appendChild(hud);
    el.appendChild(wrap);
    container = wrap;
  }
  if (norm === 'alarm') {
    const wrap = document.createElement('div');
    wrap.className = 'ptfx-alarm';
    el.appendChild(wrap);
    container = wrap;
  }
  if (norm === 'surge') {
    const wrap = document.createElement('div');
    wrap.className = 'ptfx-surge';
    el.appendChild(wrap);
    container = wrap;
  }
  if (norm === 'tune') {
    const wrap = document.createElement('div');
    wrap.className = 'ptfx-tune-wrap';
    const dial = document.createElement('div');
    dial.className = 'ptfx-tune-dial';
    wrap.appendChild(dial);
    el.appendChild(wrap);
    container = wrap;
  }
  if (norm === 'ticket') {
    const wrap = document.createElement('div');
    wrap.className = 'ptfx-ticket';
    el.appendChild(wrap);
    container = wrap;
  }
  if (norm === 'compile') {
    const wrap = document.createElement('div');
    wrap.className = 'ptfx-comp';
    const cmd = document.createElement('span');
    cmd.className = 'cmd';
    cmd.textContent = '$ npm run deploy --production';
    wrap.appendChild(cmd);
    const prg = document.createElement('span');
    prg.className = 'prg';
    prg.textContent = '[████████░░] 80%  building bundle...';
    wrap.appendChild(prg);
    const out = document.createElement('span');
    out.className = 'out';
    wrap.appendChild(out);
    const ok = document.createElement('span');
    ok.className = 'ok';
    ok.textContent = '✓ Built in 3.24s · deployed to production';
    wrap.appendChild(ok);
    el.appendChild(wrap);
    container = out;
    (el as any)._cmd = cmd;
    (el as any)._prg = prg;
    (el as any)._ok = ok;
  }
  if (norm === 'excavate') {
    const crack = document.createElement('div');
    crack.className = 'ptfx-excavate-crack';
    el.appendChild(crack);
    (el as any)._crack = crack;
  }

  result.lines.forEach((line: any, li: number) => {
    const lineDiv = document.createElement('div');
    let cls = 'ptfx-line';
    if (norm === 'drafting') cls += ' drf';
    else if (norm === 'stamp') cls += ' stmp';
    else if (norm === 'dossier') cls += ' dos';
    else if (norm === 'ticket') cls += ' tkt';
    lineDiv.className = cls;
    if (norm === 'dossier') (lineDiv.style as any).transitionDelay = `${li * 0.18}s`;
    if (norm === 'ticket') (lineDiv.style as any).transitionDelay = `${li * 0.35}s`;
    lineDiv.style.cssText += `font-size:${fs}px;line-height:${lh}px;font-family:${H_FONT};font-weight:${weight};color:white;letter-spacing:-0.02em;`;

    const segments = getSegs(prepared, line);

    segments.forEach((seg) => {
      if (seg.kind === 'space' || seg.kind === 'preserved-space' || seg.kind === 'tab') {
        lineDiv.appendChild(document.createTextNode(' '));
        return;
      }

      const segSpan = document.createElement('span');
      segSpan.className = 'ptfx-seg';
      segSpan.dataset.text = seg.text;

      // Segment-level CSS modifier classes
      if (norm === 'liquid') segSpan.classList.add('liq');
      else if (norm === 'conveyor') segSpan.classList.add('conv');
      else if (norm === 'packets') {
        segSpan.classList.add('pkt');
        segSpan.dataset.pkt = `[${String(allSegs.length + 1).padStart(4, '0')}]`;
      }

      if (CHAR_EFFECTS.has(norm)) {
        for (const ch of seg.text) {
          if (norm === 'excavate') {
            const wrap = document.createElement('span');
            wrap.className = 'ptfx-char-wrap exc-wrap';
            const span = document.createElement('span');
            span.className = 'ptfx-char exc';
            span.textContent = ch;
            span.dataset.f = ch;
            wrap.appendChild(span);
            segSpan.appendChild(wrap);
            allChars.push(span);
          } else if (norm === 'dotmatrix') {
            const span = document.createElement('span');
            span.className = 'ptfx-char dot';
            span.textContent = ch;
            span.dataset.f = ch;
            const dx = (Math.random() - 0.5) * 1.5;
            const dy = (Math.random() - 0.5) * 1.5;
            span.style.transform = `translate(${dx}px,${dy}px)`;
            span.style.display = 'inline-block';
            segSpan.appendChild(span);
            allChars.push(span);
          } else if (norm === 'alarm') {
            const span = document.createElement('span');
            span.className = 'ptfx-char alm';
            span.textContent = ch;
            span.dataset.f = ch;
            segSpan.appendChild(span);
            allChars.push(span);
          } else if (norm === 'surge') {
            const span = document.createElement('span');
            span.className = 'ptfx-char on';
            span.textContent = ch;
            span.dataset.f = ch;
            segSpan.appendChild(span);
            allChars.push(span);
          } else if (norm === 'tune') {
            const span = document.createElement('span');
            span.className = 'ptfx-char tune';
            span.textContent = ch;
            span.dataset.f = ch;
            segSpan.appendChild(span);
            allChars.push(span);
          } else {
            const span = document.createElement('span');
            span.className = 'ptfx-char';
            span.textContent = ch;
            span.dataset.f = ch;
            segSpan.appendChild(span);
            allChars.push(span);
          }
        }
      } else if (norm === 'splitflap3d') {
        for (const ch of seg.text) {
          const flap = document.createElement('span');
          flap.className = 'ptfx-flap';
          const inner = document.createElement('span');
          inner.className = 'ptfx-flap-inner';
          inner.textContent = ch;
          inner.dataset.f = ch;
          flap.appendChild(inner);
          segSpan.appendChild(flap);
          allChars.push(inner);
        }
      } else {
        segSpan.textContent = seg.text;
      }

      lineDiv.appendChild(segSpan);
      allSegs.push(segSpan);
    });

    container.appendChild(lineDiv);
    lineDivs.push(lineDiv);
    lineWidths.push(line.width);
  });

  // Cursor (excluded from purely visual effects)
  const noCursor = ['liquid', 'drafting', 'dossier', 'splitflap3d', 'surge', 'alarm'];
  if (!noCursor.includes(norm)) {
    const cursor = document.createElement('span');
    cursor.className = 'ptfx-cursor';
    cursor.style.height = `${fs * 0.85}px`;
    if (norm === 'compile') {
      cursor.style.width = '0.55em';
      cursor.style.background = '#7ee787';
    }
    const last = container.lastElementChild;
    if (last) last.appendChild(cursor);
  }

  // ECG SVG + label
  if (norm === 'ecg') {
    const ecg = document.createElement('div');
    ecg.className = 'ptfx-ecg';
    const totalW = lineWidths.length ? Math.max(...lineWidths) : 200;
    ecg.appendChild(buildEcgSvg(totalW));
    const label = document.createElement('span');
    label.className = 'ptfx-ecg-label';
    label.textContent = '72 BPM · SINUS';
    ecg.appendChild(label);
    container.appendChild(ecg);
    (el as any)._ecg = ecg;
    (el as any)._ecgLabel = label;
  }

  // Stamp (dotmatrix)
  if (norm === 'dotmatrix') {
    const stamp = document.createElement('div');
    stamp.className = 'ptfx-stamp';
    stamp.textContent = 'CERTIFICADO';
    stamp.style.right = '5%';
    stamp.style.top = '50%';
    el.appendChild(stamp);
    (el as any)._stamp = stamp;
  }

  // Conveyor belt (industria)
  if (norm === 'conveyor') {
    const belt = document.createElement('div');
    belt.className = 'ptfx-conveyor-belt';
    container.appendChild(belt);
  }

  return { chars: allChars, segs: allSegs, lines: lineDivs, widths: lineWidths, el, fontSize: fs };
}

// ── Alias resolver ──
function aliasOf(style: WritingStyle): string {
  switch (style) {
    case 'heartbeat': case 'pulse': return 'ecg';
    case 'departure': case 'flipboard': return 'splitflap3d';
    case 'pour': return 'liquid';
    case 'blueprint': return 'drafting';
    case 'official': return 'dotmatrix';
    case 'assembly': return 'conveyor';
    case 'drill': return 'excavate';
    case 'surveillance': return 'cctv';
    case 'terminal': case 'code': return 'compile';
    case 'signal': return 'tune';
    case 'uptime': return 'ticket';
    default: return style;
  }
}

// Public alias resolver — v6 export
export function resolveStyle(style: string): WritingStyle {
  return aliasOf(style as WritingStyle) as WritingStyle;
}

// ── Ambient life layer (v6) ──
// Low-amplitude re-animation after the main effect settles.
// Guarded by IntersectionObserver + prefers-reduced-motion.
function startAmbient(el: HTMLElement, mode: 'pulse' | 'drift' | 'scan') {
  if (typeof window === 'undefined') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let visible = false;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) visible = e.isIntersecting;
  }, { threshold: 0.1 });
  io.observe(el);

  const cadence = 8000 + Math.random() * 4000;
  const timer = setInterval(() => {
    if (!visible) return;
    if (mode === 'pulse') {
      const chars = el.querySelectorAll<HTMLElement>('.ptfx-char.on');
      if (!chars.length) return;
      const pick = chars[Math.floor(Math.random() * chars.length)];
      pick.classList.add('ptfx-amb-pulse');
      setTimeout(() => pick.classList.remove('ptfx-amb-pulse'), 1200);
    } else if (mode === 'drift') {
      const segs = el.querySelectorAll<HTMLElement>('.ptfx-seg');
      if (!segs.length) return;
      const pick = segs[Math.floor(Math.random() * segs.length)];
      pick.classList.add('ptfx-amb-drift');
      setTimeout(() => pick.classList.remove('ptfx-amb-drift'), 1600);
    } else if (mode === 'scan') {
      el.classList.add('ptfx-amb-scan');
      setTimeout(() => el.classList.remove('ptfx-amb-scan'), 1800);
    }
  }, cadence);

  // Auto-cleanup if element is detached
  const mo = new MutationObserver(() => {
    if (!document.body.contains(el)) {
      clearInterval(timer);
      io.disconnect();
      mo.disconnect();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

// ═══════════════ EFFECT ENGINES ═══════════════

function runTypewriter(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / speed;
  (function t() {
    if (i < b.chars.length) { b.chars[i++].classList.add('on'); setTimeout(t, iv); }
    else done();
  })();
}

function runWord(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / (speed / 3);
  b.segs.forEach(s => s.style.opacity = '0');
  (function t() {
    if (i < b.segs.length) { b.segs[i++].style.opacity = '1'; setTimeout(t, iv); }
    else done();
  })();
}

function runEcg(b: BuildResult, done: () => void) {
  const ecg = (b.el as any)._ecg as HTMLElement;
  if (ecg) setTimeout(() => ecg.classList.add('on'), 80);
  const label = (b.el as any)._ecgLabel as HTMLElement | undefined;
  let i = 0;
  const pattern = [55, 55, 380, 55, 55, 380, 55, 55, 380];
  let p = 0;
  (function t() {
    if (i < b.chars.length) {
      const c = b.chars[i];
      c.classList.add('on');
      if (p % 3 < 2) c.classList.add('beat');
      i++; setTimeout(t, pattern[p++ % pattern.length]);
    } else {
      if (label) setTimeout(() => label.classList.add('on'), 300);
      done();
    }
  })();
}

function runSplitflap(b: BuildResult, speed: number, done: () => void) {
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.,';
  let completed = 0;
  if (!b.chars.length) { done(); return; }
  b.chars.forEach((ch, idx) => {
    const final = ch.dataset.f || '';
    if (final === ' ') { completed++; if (completed === b.chars.length) done(); return; }
    const flapEl = ch.parentElement as HTMLElement;
    const startDelay = idx * (1000 / speed);
    const flips = 5 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      let f = 0;
      const iv = setInterval(() => {
        if (f < flips) {
          ch.textContent = ALPHA[Math.floor(Math.random() * ALPHA.length)];
          ch.style.transform = `rotateX(${(f % 2 ? -25 : 0)}deg)`;
          f++;
        } else {
          clearInterval(iv);
          ch.textContent = final;
          ch.style.transform = 'rotateX(0)';
          flapEl.classList.add('landed');
          completed++;
          if (completed === b.chars.length) done();
        }
      }, 55);
    }, startDelay);
  });
}

function runLiquid(b: BuildResult, done: () => void) {
  const lineGroups: HTMLSpanElement[][] = b.lines.map(ld => Array.from(ld.querySelectorAll<HTMLSpanElement>('.ptfx-seg.liq')));
  let li = 0;
  (function t() {
    if (li < lineGroups.length) {
      lineGroups[li].forEach(s => s.classList.add('on'));
      li++;
      setTimeout(t, 400);
    } else done();
  })();
}

function runDrafting(b: BuildResult, done: () => void) {
  let i = 0;
  setTimeout(function t() {
    if (i < b.lines.length) {
      const line = b.lines[i];
      line.classList.add('on');
      setTimeout(() => line.classList.add('settled'), 700);
      i++;
      setTimeout(t, 320);
    } else done();
  }, 120);
}

function runDotmatrix(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / speed;
  (function t() {
    if (i < b.chars.length) { b.chars[i++].classList.add('on'); setTimeout(t, iv); }
    else {
      const stamp = (b.el as any)._stamp as HTMLElement;
      if (stamp) setTimeout(() => stamp.classList.add('on'), 250);
      done();
    }
  })();
}

function runConveyor(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / (speed / 2);
  (function t() {
    if (i < b.segs.length) {
      const seg = b.segs[i];
      seg.classList.add('on');
      setTimeout(() => seg.classList.add('click'), 500);
      i++; setTimeout(t, iv);
    } else done();
  })();
}

function runExcavate(b: BuildResult, speed: number, done: () => void) {
  const crack = (b.el as any)._crack as HTMLElement | undefined;
  if (crack) setTimeout(() => crack.classList.add('on'), 80);
  let i = 0; const iv = 1000 / (speed / 2);
  const chunk = 2;
  setTimeout(function t() {
    if (i < b.chars.length) {
      for (let j = 0; j < chunk && i + j < b.chars.length; j++) {
        const ch = b.chars[i + j];
        ch.classList.add('on');
        spawnDust(ch, b.el);
      }
      i += chunk;
      setTimeout(t, iv);
    } else done();
  }, 450);
}

function spawnDust(ch: HTMLElement, container: HTMLElement) {
  setTimeout(() => {
    const rect = ch.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.bottom - containerRect.top;
    for (let i = 0; i < 3; i++) {
      const d = document.createElement('span');
      d.className = 'ptfx-dust';
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      const dx = (Math.random() - 0.5) * 30;
      const dy = -10 - Math.random() * 20;
      d.style.setProperty('--dx', `${dx}px`);
      d.style.setProperty('--dy', `${dy}px`);
      container.appendChild(d);
      requestAnimationFrame(() => d.classList.add('go'));
      setTimeout(() => d.remove(), 700);
    }
  }, 300);
}

function runCctv(b: BuildResult, speed: number, done: () => void) {
  const wrap = b.el.querySelector('.ptfx-cctv') as HTMLElement;
  let i = 0; const iv = 1000 / speed;
  (function t() {
    if (i < b.chars.length) {
      b.chars[i].classList.add('on');
      if (Math.random() < 0.18) b.chars[i].classList.add('glitch');
      i++; setTimeout(t, iv + (Math.random() < 0.08 ? 180 : 0));
    } else {
      done();
      if (wrap) {
        setInterval(() => {
          if (Math.random() < 0.4) {
            wrap.classList.add('cut');
            setTimeout(() => wrap.classList.remove('cut'), 200);
          }
        }, 4500);
      }
    }
  })();
}

function runCompile(b: BuildResult, speed: number, done: () => void) {
  const cmd = (b.el as any)._cmd as HTMLElement;
  const prg = (b.el as any)._prg as HTMLElement;
  const ok = (b.el as any)._ok as HTMLElement | undefined;
  if (cmd) setTimeout(() => cmd.classList.add('on'), 100);
  if (prg) setTimeout(() => prg.classList.add('on'), 600);
  setTimeout(() => {
    let i = 0; const iv = 1000 / speed;
    (function t() {
      if (i < b.chars.length) { b.chars[i++].classList.add('on'); setTimeout(t, iv); }
      else {
        if (ok) setTimeout(() => ok.classList.add('on'), 400);
        done();
      }
    })();
  }, 1100);
}

function runPackets(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / speed;
  (function t() {
    if (i < b.segs.length) { b.segs[i++].classList.add('on'); setTimeout(t, iv); }
    else done();
  })();
}

// TUNE — radio frequency tuning: blur-to-sharp lock-in with dial sweep
function runTune(b: BuildResult, speed: number, done: () => void) {
  const wrap = b.el.querySelector('.ptfx-tune-wrap') as HTMLElement;
  if (wrap) setTimeout(() => wrap.classList.add('on'), 50);
  let i = 0; const iv = 1000 / speed;
  (function t() {
    if (i < b.chars.length) {
      b.chars[i].classList.add('clear');
      i++; setTimeout(t, iv);
    } else done();
  })();
}

// TICKET — thermal printer reveal line by line (tkt class on lines)
function runTicket(b: BuildResult, done: () => void) {
  let i = 0;
  (function t() {
    if (i < b.lines.length) { b.lines[i++].classList.add('on'); setTimeout(t, 400); }
    else done();
  })();
}

function runDossier(b: BuildResult, done: () => void) {
  let i = 0;
  (function t() {
    if (i < b.lines.length) { b.lines[i++].classList.add('on'); setTimeout(t, 220); }
    else done();
  })();
}

function runAlarm(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / speed;
  (function t() {
    if (i < b.chars.length) {
      const c = b.chars[i];
      c.classList.add('on', 'flash');
      i++; setTimeout(t, iv);
    } else done();
  })();
}

function runSurge(b: BuildResult, done: () => void) {
  const wrap = b.el.querySelector('.ptfx-surge') as HTMLElement;
  if (wrap) {
    setTimeout(() => wrap.classList.add('go'), 200);
    setTimeout(done, 1100);
  } else done();
}

function runDecode(b: BuildResult, speed: number, done: () => void) {
  const G = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
  b.chars.forEach(c => { c.classList.add('on','res'); if (c.dataset.f !== ' ') c.textContent = G[~~(Math.random()*G.length)]; });
  let r = 0;
  const si = setInterval(() => { for (let j = r; j < b.chars.length; j++) if (b.chars[j].dataset.f !== ' ') b.chars[j].textContent = G[~~(Math.random()*G.length)]; }, 45);
  setTimeout(function t() {
    if (r < b.chars.length) { const c = b.chars[r]; c.textContent = c.dataset.f || ''; c.classList.remove('res'); c.classList.add('fin'); r++; setTimeout(t, 1000/speed); }
    else { clearInterval(si); done(); }
  }, 250);
}

function runScramble(b: BuildResult, speed: number, done: () => void) {
  const M = 'アイウエオカキクケコサシスセソタチツテト0123456789';
  b.chars.forEach(c => { c.classList.add('on','res'); c.style.color = 'var(--c)'; if (c.dataset.f !== ' ') c.textContent = M[~~(Math.random()*M.length)]; });
  let r = 0;
  const si = setInterval(() => { for (let j = r; j < b.chars.length; j++) if (b.chars[j].dataset.f !== ' ') b.chars[j].textContent = M[~~(Math.random()*M.length)]; }, 30);
  setTimeout(function t() {
    if (r < b.chars.length) { const c = b.chars[r]; c.textContent = c.dataset.f || ''; c.classList.remove('res'); c.classList.add('fin'); c.style.color = 'white'; r++; setTimeout(t, 1000/speed); }
    else { clearInterval(si); done(); }
  }, 600);
}

function runFade(b: BuildResult, speed: number, done: () => void) {
  let i = 0; const iv = 1000 / speed;
  (function t() { if (i < b.chars.length) { b.chars[i++].classList.add('on','fi'); setTimeout(t, iv); } else done(); })();
}

function runStamp(b: BuildResult, done: () => void) {
  b.lines.forEach(d => d.querySelectorAll('.ptfx-char').forEach(ch => ch.classList.add('on')));
  let i = 0;
  setTimeout(function t() { if (i < b.lines.length) { b.lines[i++].classList.add('on'); setTimeout(t, 200); } else done(); }, 100);
}

function run(style: WritingStyle, b: BuildResult, speed: number, done: () => void) {
  const norm = aliasOf(style);
  switch (norm) {
    case 'ecg':         runEcg(b, done); break;
    case 'splitflap3d': runSplitflap(b, speed, done); break;
    case 'liquid':      runLiquid(b, done); break;
    case 'drafting':    runDrafting(b, done); break;
    case 'dotmatrix':   runDotmatrix(b, speed, done); break;
    case 'conveyor':    runConveyor(b, speed, done); break;
    case 'excavate':    runExcavate(b, speed, done); break;
    case 'cctv':        runCctv(b, speed, done); break;
    case 'compile':     runCompile(b, speed, done); break;
    case 'packets':     runPackets(b, speed, done); break;
    case 'tune':        runTune(b, speed, done); break;
    case 'ticket':      runTicket(b, done); break;
    case 'dossier':     runDossier(b, done); break;
    case 'alarm':       runAlarm(b, speed, done); break;
    case 'surge':       runSurge(b, done); break;
    case 'typewriter':  runTypewriter(b, speed, done); break;
    case 'word':        runWord(b, speed, done); break;
    case 'decode':      runDecode(b, speed, done); break;
    case 'scramble':    runScramble(b, speed, done); break;
    case 'fade':        runFade(b, speed * 0.7, done); break;
    case 'stamp':       runStamp(b, done); break;
    default:            runTypewriter(b, speed, done);
  }
}

// ═══════════════ PUBLIC API ═══════════════

export function heroFx(selector: string | HTMLElement, text: string, opts: HeroOpts = {}) {
  const el = typeof selector === 'string' ? document.querySelector(selector) as HTMLElement : selector;
  if (!el || !text) return;
  const { lines = 3, color = '#DC2626', speed = 18, weight = 700, style = 'typewriter', onDone, ambient } = opts;
  const resolvedStyle = aliasOf(style) as WritingStyle;
  const b = build(el, text, lines, weight, color, style, true);
  run(style, b, speed, () => {
    onDone?.();
    if (ambient) startAmbient(el, ambient);
  });
  void resolvedStyle;
}

interface ShowcaseEntry { text: string; style: WritingStyle; color: string; label: string; }
interface ShowcaseOpts { lines?: number; weight?: number; speed?: number; pause?: number; onFirstDone?: () => void; }

export function showcaseFx(selector: string | HTMLElement, entries: ShowcaseEntry[], opts: ShowcaseOpts = {}) {
  css();
  const el = typeof selector === 'string' ? document.querySelector(selector) as HTMLElement : selector;
  if (!el || !entries.length) return;
  const { lines = 3, weight = 700, speed = 18, pause = 2500, onFirstDone } = opts;
  let idx = 0, first = false;
  function next() {
    const e = entries[idx % entries.length];
    const lbl = document.createElement('div');
    lbl.className = 'ptfx-lbl';
    lbl.style.setProperty('--c', e.color);
    lbl.textContent = e.label;
    const div = document.createElement('div');
    div.style.position = 'relative';
    el.replaceChildren(lbl, div);
    el.style.setProperty('--c', e.color);
    const b = build(div, e.text, lines, weight, e.color, e.style, false);
    run(e.style, b, speed, () => {
      if (!first) { first = true; onFirstDone?.(); }
      idx++; setTimeout(next, pause);
    });
  }
  next();
}

export function paragraphFx(selector: string | HTMLElement, text: string, opts: { fontSize?: number; color?: string } = {}) {
  css();
  const el = typeof selector === 'string' ? document.querySelector(selector) as HTMLElement : selector;
  if (!el || !text) return;
  const { fontSize = 14, color = '#6b7280' } = opts;
  const maxWidth = el.clientWidth;
  const font = `400 ${fontSize}px ${B_FONT}`;
  const lineHeight = fontSize * 1.65;
  const ps = text.split('\n').filter(p => p.trim());
  el.replaceChildren();
  ps.forEach(para => {
    const pEl = document.createElement('div');
    pEl.style.marginBottom = '0.75rem';
    const prep = prepareWithSegments(para.trim(), font);
    const res = layoutWithLines(prep, maxWidth, lineHeight);
    res.lines.forEach((line: any) => {
      const d = document.createElement('div');
      d.style.cssText = `font-size:${fontSize}px;line-height:${lineHeight}px;color:${color};opacity:0;transition:opacity .3s ease;`;
      d.textContent = line.text;
      pEl.appendChild(d);
    });
    el.appendChild(pEl);
  });
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (!e.isIntersecting) return; e.target.querySelectorAll<HTMLElement>(':scope > div').forEach((l, i) => setTimeout(() => l.style.opacity = '1', i * 30)); obs.unobserve(e.target); });
  }, { threshold: 0.15 });
  el.querySelectorAll(':scope > div').forEach(p => obs.observe(p));
}

export function cardFx(container: string | HTMLElement, _opts?: { color?: string }) {
  css();
  const root = typeof container === 'string' ? document.querySelector(container) as HTMLElement : container;
  if (!root) return;
  const obs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const card = e.target as HTMLElement;
      const tEl = card.querySelector('[data-ptfx-title]') as HTMLElement;
      if (tEl) {
        const t = tEl.dataset.ptfxTitle || '', mw = tEl.clientWidth;
        const r = layoutWithLines(prepareWithSegments(t, `700 16px ${B_FONT}`), mw, 22.4);
        tEl.replaceChildren();
        r.lines.forEach((l: any) => { const d = document.createElement('div'); d.style.cssText = 'font-size:16px;line-height:22.4px;font-weight:700;'; d.textContent = l.text; tEl.appendChild(d); });
      }
      const dEl = card.querySelector('[data-ptfx-desc]') as HTMLElement;
      if (dEl) {
        const t = dEl.dataset.ptfxDesc || '', mw = dEl.clientWidth;
        const r = layoutWithLines(prepareWithSegments(t, `400 14px ${B_FONT}`), mw, 21.7);
        dEl.replaceChildren();
        r.lines.forEach((l: any) => { const d = document.createElement('div'); d.style.cssText = 'font-size:14px;line-height:21.7px;color:#6b7280;'; d.textContent = l.text; dEl.appendChild(d); });
      }
      obs.unobserve(card);
    });
  }, { threshold: 0.1 });
  root.querySelectorAll('[data-ptfx-card]').forEach(c => obs.observe(c));
}

// Auto-wire cardFx across the document. Call once per page.
export function wireCardFx(selector = '[data-ptfx-card]', opts?: { color?: string }) {
  css();
  if (typeof document === 'undefined') return;
  const cards = document.querySelectorAll<HTMLElement>(selector);
  if (!cards.length) return;
  const obs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const card = e.target as HTMLElement;
      const tEl = card.querySelector<HTMLElement>('[data-ptfx-title]');
      if (tEl) {
        const t = tEl.dataset.ptfxTitle || '';
        const mw = tEl.clientWidth;
        if (t && mw) {
          const r = layoutWithLines(prepareWithSegments(t, `700 16px ${B_FONT}`), mw, 22.4);
          tEl.replaceChildren();
          r.lines.forEach((l: any) => {
            const d = document.createElement('div');
            d.style.cssText = 'font-size:16px;line-height:22.4px;font-weight:700;';
            d.textContent = l.text;
            tEl.appendChild(d);
          });
        }
      }
      const dEl = card.querySelector<HTMLElement>('[data-ptfx-desc]');
      if (dEl) {
        const t = dEl.dataset.ptfxDesc || '';
        const mw = dEl.clientWidth;
        if (t && mw) {
          const r = layoutWithLines(prepareWithSegments(t, `400 14px ${B_FONT}`), mw, 21.7);
          dEl.replaceChildren();
          r.lines.forEach((l: any) => {
            const d = document.createElement('div');
            d.style.cssText = 'font-size:14px;line-height:21.7px;color:#6b7280;';
            d.textContent = l.text;
            dEl.appendChild(d);
          });
        }
      }
      card.classList.add('ptfx-card-revealed');
      obs.unobserve(card);
    }
  }, { threshold: 0.12 });
  cards.forEach((c) => obs.observe(c));
  void opts;
}
