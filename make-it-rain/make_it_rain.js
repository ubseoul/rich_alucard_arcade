// RAINMAKER / MAKE IT RAIN — SANDBOX ADAPTER (F06-A, OL-011 PARALLEL_SAFE Wave 0)
// PRESENTATION PASS F06-A-P1: cold-neon-noir, pixel-native presentation over the UNCHANGED core.
//
// Grey-box harness around the reusable core (js/systems/rainmaker/make_it_rain_core.js).
// This file owns rendering + pointer input + round lifecycle for the SANDBOX ONLY.
// The future full RAINMAKER scene replaces this adapter and keeps the core intact.
//
// ISOLATION: no shared registration, no WAKE hooks, no phone app, no persistence by default.
// ART: neutral geometric DEVELOPMENT PLACEHOLDER shapes only. No characters, no identity.
// AUDIO: inert hooks only. No sound is loaded, sourced or played.
//
// PRESENTATION CONTRACT: this file READS core state (state(), beatAt(), targetX(), spotlightActive(),
// summary()) and tunables. It never writes gameplay values, never re-derives an outcome, and never
// alters input handling: pointer -> core.beginDrag/dragTo/release is exactly the F06-A path.
//
// RENDER MODEL: a low-resolution logical canvas (about 180-215 px wide) scaled by an integer 2x with
// nearest-neighbour filtering, like the main game's pixelated #screen. All layout is normalized or
// anchored, so the pointer->core coordinate mapping is unchanged.
(function (global) {
  'use strict';

  var VERSION = 1;
  var PRESENTATION = 2;
  var SCALE = 2;

  function noop() {}

  function defaultAudioHooks() {
    // Authored hook opportunities preserved for the full build. All inert (silent) in the sandbox.
    return {
      onRoundStart: noop,
      onLoad: noop,
      onFlick: noop,
      onHit: noop,
      onMiss: noop,
      onOverthrow: noop,
      onBeat: noop,
      onFan: noop,
      onStreak: noop,
      onStorm: noop,
      onResult: noop
    };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function hsh(n) {
    n = (n | 0) ^ 61; n = n ^ (n >>> 16); n = (n + (n << 3)) | 0; n = n ^ (n >>> 4);
    n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
    return (n >>> 0) / 4294967296;
  }

  function formatMoney(n) {
    n = Math.round(n || 0);
    return '$' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function formatNum(n) {
    return Math.round(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Game-native palette (from the main game's CSS: bone cream, near-black, nocturnal purple,
  // dried blood, muted gold) pushed cold: cyan pulse, magenta hype, gold = lit opportunity.
  var PAL = {
    ink: '#10101b', void: '#07060f',
    purple: '#17142c', purple2: '#241a45', purple3: '#33255b',
    blood: '#7d194b', red: '#d7193f', hot: '#ff4d6d', waste: '#ff5a5f', orange: '#ff8a4a',
    gold: '#c18b3c', goldHi: '#f6c85a', goldPale: '#ffe6a1',
    cream: '#f6efd9', dim: '#a49fc0', dim2: '#6b6690', lav: '#b7b1df', lav2: '#403b72',
    cyan: '#5fe3ff', cyanDim: '#1d6c86', cyanDeep: '#0f3a52',
    pink: '#ff4fa3', pinkHi: '#ff8cc6', pinkDim: '#8a2a66',
    cash: '#6ff0a4', white: '#ffffff'
  };
  var BILL = {
    g: { a: '#2fbf6a', b: '#1a7a45', c: '#a6f5c2', e: '#0b3b22' },
    d: { a: '#3c5f63', b: '#26403f', c: '#6f9296', e: '#0b1618' },
    gold: { a: '#e8b64a', b: '#9a6b25', c: '#ffe6a1', e: '#3a2508' }
  };
  var MONO = 'Monogram, "Courier New", monospace';
  var PSTART = '"Press Start 2P", "Courier New", monospace';

  function createGame(canvas, options) {
    options = options || {};
    var T = global.RAMakeItRainTunables;
    var Core = global.RAMakeItRainCore;
    if (!T || !Core) throw new Error('make_it_rain adapter requires tunables + core');
    var tunables = T.merge(T.defaults, options.tunables || {});
    var hooks = Object.assign(defaultAudioHooks(), options.audio || {});
    var onRoundStart = typeof options.onRoundStart === 'function' ? options.onRoundStart : noop;
    var onRoundEnd = typeof options.onRoundEnd === 'function' ? options.onRoundEnd : noop;

    var core = Core.create({ tunables: tunables, seed: options.seed });

    var ctx = canvas.getContext('2d');
    var bg = null, bgDirty = true;   // cached static backdrop (wall bands, slats, floor grid, deck planks)
    var host = canvas.parentElement || null;
    var W = 180, H = 320;
    var running = false, resultAnim = false, rafId = 0;
    var roundStart = 0, roundStartReal = 0;
    var lastDraw = 0, frameNo = 0;
    var animations = [];
    var popups = [];
    var particles = [];
    var litter = [];
    var rain = [];
    var shake = 0;
    var flashes = { white: null, red: null, gold: null };
    var pointer = null;          // {id, samples:[{x,y,t}], lastX, lastY, startX, startY, active}
    var lastBeatIndex = -1;
    var stormed = false;
    var resultStart = 0;
    var shownStreak = 0;
    var streakPopAt = 0;
    var lostStreak = null;
    var hit = { at: -9999, perfect: false };
    var poolPulse = { at: -9999, x: 0, kind: '' };
    var vis = { cash: 0, hype: 0, bills: 0 };
    var pop = { cash: -9999, hype: -9999, waste: -9999, spent: -9999 };
    var last = { cash: 0, hype: 0, waste: 0, spent: 0 };
    var hintDone = false;
    var reduce = false;
    try { reduce = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

    // ---------------- coordinate helpers ----------------
    function fit() {
      var cw = host ? host.clientWidth : 0, ch = host ? host.clientHeight : 0;
      if (!(cw > 0 && ch > 0)) { var rect = canvas.getBoundingClientRect(); cw = rect.width; ch = rect.height; }
      var nw = Math.max(90, Math.floor(cw / SCALE)), nh = Math.max(160, Math.floor(ch / SCALE));
      if (nw === W && nh === H && canvas.width === W && canvas.height === H) return;
      W = nw; H = nh;
      canvas.width = W; canvas.height = H;
      canvas.style.width = (W * SCALE) + 'px';
      canvas.style.height = (H * SCALE) + 'px';
      ctx.imageSmoothingEnabled = false;
      bgDirty = true;
    }
    function toNorm(clientX, clientY) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1),
        y: clamp((clientY - rect.top) / Math.max(1, rect.height), 0, 1)
      };
    }
    function now() {
      return (global.performance && global.performance.now) ? global.performance.now() : Date.now();
    }

    // ---------------- round lifecycle ----------------
    function startRound(budget) {
      core.reset({ budget: budget == null ? tunables.round.defaultBudget : budget });
      animations.length = 0; popups.length = 0; particles.length = 0; litter.length = 0; rain.length = 0;
      shake = 0; flashes.white = flashes.red = flashes.gold = null;
      stormed = false; lastBeatIndex = -1; pointer = null;
      shownStreak = 0; lostStreak = null; streakPopAt = 0;
      hit.at = -9999; poolPulse.at = -9999;
      resultStart = 0; resultAnim = false; hintDone = false;
      var budgetNow = core.budget;
      vis.cash = core.cash; vis.hype = 0; vis.bills = core.availableBills;
      last.cash = core.cash; last.hype = 0; last.waste = 0; last.spent = 0;
      pop.cash = pop.hype = pop.waste = pop.spent = -9999;
      roundStart = now();
      roundStartReal = roundStart;
      running = true;
      hooks.onRoundStart({ budget: budgetNow });
      onRoundStart({ budget: budgetNow });
      if (!rafId) rafId = requestAnimationFrame(frame);
      return core.state();
    }
    function reset() { return startRound(core.budget); }

    // ---------------- pointer input (unchanged F06-A path) ----------------
    function velocityFromSamples(samples, t) {
      var windowMs = options.velocityWindowMs || 110;
      var fresh = samples.filter(function (s) { return t - s.t <= windowMs; });
      if (fresh.length < 2) fresh = samples.slice(-2);
      if (fresh.length < 2) return { vx: 0, vy: 0 };
      var a = fresh[0], b = fresh[fresh.length - 1];
      var dt = Math.max(1, b.t - a.t);
      return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
    }

    function onDown(ev) {
      if (core.ended) return;
      var p = toNorm(ev.clientX, ev.clientY);
      if (p.y < (tunables.stack.startZoneTop == null ? 0.42 : tunables.stack.startZoneTop)) return; // must begin on the roll
      ev.preventDefault();
      if (canvas.setPointerCapture && ev.pointerId != null) { try { canvas.setPointerCapture(ev.pointerId); } catch (e) {} }
      var t = now() - roundStart;
      pointer = { id: ev.pointerId, active: true, samples: [{ x: p.x, y: p.y, t: t }], lastX: p.x, lastY: p.y, startX: p.x, startY: p.y };
      hintDone = true;
      core.beginDrag({ x: p.x, y: p.y, t: t });
    }
    function onMove(ev) {
      if (!pointer || !pointer.active || (ev.pointerId != null && pointer.id != null && ev.pointerId !== pointer.id)) return;
      ev.preventDefault();
      var p = toNorm(ev.clientX, ev.clientY);
      var t = now() - roundStart;
      pointer.samples.push({ x: p.x, y: p.y, t: t });
      if (pointer.samples.length > 24) pointer.samples.shift();
      pointer.lastX = p.x; pointer.lastY = p.y;
      core.dragTo({ x: p.x, y: p.y, t: t });
      var load = core.state().load;
      if (load) hooks.onLoad({ bills: load.bills });
    }
    function onUp(ev) {
      if (!pointer || !pointer.active) return;
      if (ev.pointerId != null && pointer.id != null && ev.pointerId !== pointer.id) return;
      ev.preventDefault();
      pointer.active = false;
      var t = now() - roundStart;
      var v = velocityFromSamples(pointer.samples, t);
      var p = toNorm(ev.clientX, ev.clientY);
      var load = core.state().load;
      var result = core.release({ vx: v.vx, vy: v.vy, x: p.x, y: p.y, t: t });
      resolveFeedback(result, load);
      pointer = null;
    }
    function onCancel(ev) {
      if (!pointer) return;
      if (ev && ev.pointerId != null && pointer.id != null && ev.pointerId !== pointer.id) return;
      pointer = null;
      core.cancelDrag();
    }

    // ---------------- feedback events (presentation only) ----------------
    function flashAt(name, a, dur) { flashes[name] = { at: now(), a: a, dur: dur }; }
    function addPopup(p) {
      var N = now();
      p.t0 = N + (p.delay || 0);
      // one live message per group: newer feedback replaces the older one instead of stacking
      if (p.group) popups.forEach(function (o) { if (o.group === p.group && !o.kill) o.kill = N; });
      popups.push(p);
      if (popups.length > 8) popups.shift();
    }
    function burst(x, y, n, colors, spread, up, life) {
      var N = now();
      for (var i = 0; i < n; i++) {
        var a = hsh(frameNo * 31 + i * 7 + Math.round(x)) * Math.PI * 2;
        var s = (0.4 + hsh(i * 13 + Math.round(y)) * 0.9) * spread;
        particles.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - up, g: 0.0009,
          t0: N, life: life * (0.6 + hsh(i * 3 + 1) * 0.6),
          c: colors[i % colors.length], s: i % 3 === 0 ? 2 : 1
        });
      }
      if (particles.length > 160) particles.splice(0, particles.length - 160);
    }

    function resolveFeedback(result, load) {
      if (!result) return;
      var N = now();
      var geo = stackGeo();
      var cx = W / 2;
      if (result.kind === 'invalid') {
        if (result.reason === 'not-a-flick') {
          addPopup({ text: 'FLICK UP FAST', x: cx, y: geo.top - 30, ttl: 900, color: PAL.dim, size: 16, mono: true, rise: 6, group: 'timing' });
        } else if (result.reason === 'no-bills') {
          addPopup({ text: 'DRAG UP TO LOAD', x: cx, y: geo.top - 30, ttl: 900, color: PAL.dim, size: 16, mono: true, rise: 6, group: 'timing' });
        }
        return;
      }
      hooks.onFlick(result);
      var speed = clamp(result.speed / tunables.aim.maxSpeed, 0, 1);
      var bills = [];
      var floorTop = Math.round(H * 0.6), floorSpan = Math.round(H * 0.12);
      var wasteful = result.kind !== 'hit';
      for (var i = 0; i < result.bills; i++) {
        var f = result.bills === 1 ? 0 : (i / (result.bills - 1) - 0.5);
        var sd = result.bills * 7 + result.dollars + i * 13;
        bills.push({
          f: f, delay: Math.round(i * (result.fan ? 9 : 14) * (0.6 + hsh(sd) * 0.8)),
          spin: 0.6 + hsh(sd + 1) * 1.2, seed: sd,
          restX: (result.landingX + f * (result.fan ? 0.30 : 0.18) + (hsh(sd + 2) - 0.5) * 0.12),
          restY: floorTop + hsh(sd + 3) * floorSpan
        });
      }
      var dur = tunables.feedback.billFlyMs;
      var anim = {
        kind: result.kind, count: result.bills, t0: N, dur: dur, fall: 460,
        life: dur + (wasteful ? 460 + 400 : 700) + 260,
        arc: 0.10 + speed * tunables.aim.arcSpeedScale,
        spread: result.fan ? 0.22 : 0.10, fan: !!result.fan,
        toX: result.landingX, bills: bills
      };
      animations.push(anim);

      // stack-side feedback: what it cost
      addPopup({ text: '-' + formatMoney(result.dollars), x: Math.round(geo.x0 - 26), y: geo.top + 4, ttl: 900, color: wasteful ? PAL.waste : PAL.cream, size: 16, mono: true, rise: -12, group: 'cost' });

      if (result.kind === 'hit') {
        hit.at = N; hit.perfect = !!result.perfect;
        poolPulse.at = N; poolPulse.x = result.targetX; poolPulse.kind = 'hit';
        var tx = result.targetX * W, ty = Math.round(H * 0.34);
        addPopup({ text: 'HIT', x: tx, y: ty - 22, ttl: 700, color: PAL.cream, size: 16, mono: true, rise: 8, delay: dur - 90, group: 'target' });
        addPopup({ text: '+' + formatNum(result.hypeGained), x: tx, y: ty - 6, ttl: 950, color: PAL.pinkHi, size: 32, mono: true, rise: 20, delay: dur - 90, group: 'target2' });
        if (result.perfect) {
          addPopup({ text: 'PERFECT', x: cx, y: geo.top - 26, ttl: 780, color: PAL.goldPale, size: 8, rise: 6, glow: PAL.goldHi, group: 'timing' });
          flashAt('white', 0.30, 130); flashAt('gold', 0.18, 220);
        } else if (result.onBeat) {
          addPopup({ text: 'ON BEAT', x: cx, y: geo.top - 26, ttl: 700, color: PAL.cyan, size: 8, rise: 6, group: 'timing' });
        }
        if (result.fan) {
          addPopup({ text: 'FAN +CROWD', x: cx, y: geo.top - 40, ttl: 780, color: PAL.goldHi, size: 8, rise: 6, group: 'fan' });
        }
        burst(tx, ty, result.perfect ? 26 : 14, [PAL.goldHi, PAL.pinkHi, PAL.cyan, PAL.goldPale], result.perfect ? 0.07 : 0.05, 0.03, 620);
        if (result.streak >= 2) streakPopAt = N;
        shownStreak = result.streak;
        hooks.onHit(result);
        if (result.fan) hooks.onFan(result);
        if (result.onBeat) hooks.onBeat(result);
        if (result.streak >= 2) hooks.onStreak(result);
      } else {
        var isOver = result.kind === 'overthrow';
        var lx = clamp(result.landingX, 0.08, 0.92) * W, ly = Math.round(H * 0.34);
        addPopup(isOver
          ? { text: 'OVERTHROW', x: lx, y: ly - 8, ttl: 1100, color: PAL.hot, size: 32, mono: true, rise: 10, delay: dur - 160, shadow: PAL.void, group: 'target2' }
          : { text: 'MISS', x: lx, y: ly - 8, ttl: 1000, color: PAL.orange, size: 32, mono: true, rise: 10, delay: dur - 160, shadow: PAL.void, group: 'target2' });
        addPopup(isOver
          ? { text: 'IN THE DARK', x: lx, y: ly + 16, ttl: 1100, color: PAL.dim, size: 16, mono: true, rise: 8, delay: dur - 160, group: 'target' }
          : { text: 'OFF TARGET', x: lx, y: ly + 16, ttl: 1000, color: PAL.dim, size: 16, mono: true, rise: 8, delay: dur - 160, group: 'target' });
        if (!reduce) shake = tunables.feedback.shakeMs;
        flashAt('red', 0.22, 200);
        if (shownStreak >= 2) lostStreak = { n: shownStreak, t0: N };
        shownStreak = 0;
        // money on the floor: persistent litter, appears when each bill lands
        for (var k = 0; k < bills.length; k++) {
          litter.push({ x: bills[k].restX, y: bills[k].restY, seed: bills[k].seed, landAt: N + bills[k].delay + dur + anim.fall, tone: isOver ? 'd' : 'g' });
        }
        if (litter.length > 80) litter.splice(0, litter.length - 80);
        hooks.onMiss(result);
        if (isOver) hooks.onOverthrow(result);
      }
    }

    // ---------------- update ----------------
    function frame() {
      rafId = 0;
      if (!running && !resultAnim) return;
      fit();
      var N = now();
      var t = N - roundStart;
      if (running) {
        core.advance(t);

        var beat = core.beatAt(t);
        if (beat.onBeat && beat.index !== lastBeatIndex) {
          lastBeatIndex = beat.index;
          hooks.onBeat({ index: beat.index, perfect: beat.perfect });
        }
        if (!stormed && core.crowd >= tunables.hype.stormThreshold) { stormed = true; hooks.onStorm({ crowd: core.crowd }); }
      }

      if (core.ended) {
        if (running) {
          running = false;
          resultAnim = true;
          resultStart = N;
          buildRain(core.summary(), N);
          hooks.onResult(core.summary());
          onRoundEnd(core.summary());
        }
        var el = N - resultStart;
        draw(tunables.round.durationMs);
        drawResult(el);
        if (el > 5600) { resultAnim = false; return; }
        rafId = requestAnimationFrame(frame);
        return;
      }
      draw(t);
      rafId = requestAnimationFrame(frame);
    }

    function trim(N) {
      animations = animations.filter(function (a) { return N - a.t0 < a.life; });
      popups = popups.filter(function (p) { return N - p.t0 < p.ttl; });
      particles = particles.filter(function (p) { return N - p.t0 < p.life; });
      if (shake > 0) shake = Math.max(0, shake - 16);
    }

    // ---------------- primitives ----------------
    function R(x, y, w, h, color) {
      if (w <= 0 || h <= 0) return;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    function RA(x, y, w, h, color, a) {
      var g = ctx.globalAlpha; ctx.globalAlpha = g * a; R(x, y, w, h, color); ctx.globalAlpha = g;
    }
    function fillEllipse(cx, cy, rx, ry, color, a) {
      var g = ctx.globalAlpha; ctx.globalAlpha = g * (a == null ? 1 : a);
      ctx.fillStyle = color;
      ry = Math.max(1, Math.round(ry));
      for (var dy = -ry; dy <= ry; dy++) {
        var half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
        ctx.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2 + 1, 1);
      }
      ctx.globalAlpha = g;
    }
    function ringEllipse(cx, cy, rx, ry, color, a, dash) {
      var g = ctx.globalAlpha; ctx.globalAlpha = g * (a == null ? 1 : a);
      ctx.fillStyle = color;
      var steps = Math.max(12, Math.round((rx + ry) * 3.2));
      var prev = '';
      for (var i = 0; i < steps; i++) {
        if (dash && (i % (dash * 2)) >= dash) continue;
        var ang = (i / steps) * Math.PI * 2;
        var px = Math.round(cx + Math.cos(ang) * rx), py = Math.round(cy + Math.sin(ang) * ry);
        var key = px + ',' + py;
        if (key === prev) continue;
        prev = key;
        ctx.fillRect(px, py, 1, 1);
      }
      ctx.globalAlpha = g;
    }
    function disc(cx, cy, r, color) {
      ctx.fillStyle = color;
      for (var dy = -r; dy <= r; dy++) {
        var half = Math.round(Math.sqrt(Math.max(0, r * r + 0.4 - dy * dy)));
        ctx.fillRect(Math.round(cx) - half, Math.round(cy) + dy, half * 2 + 1, 1);
      }
    }
    function text(str, x, y, color, size, align, opt) {
      opt = opt || {};
      ctx.font = size + 'px ' + (opt.mono === false ? PSTART : MONO);
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'top';
      x = Math.round(x); y = Math.round(y);
      var sh = opt.shadow || PAL.void;
      if (opt.glow) {
        var g = ctx.globalAlpha; ctx.globalAlpha = g * 0.5; ctx.fillStyle = opt.glow;
        ctx.fillText(str, x - 1, y); ctx.fillText(str, x + 1, y); ctx.fillText(str, x, y - 1); ctx.fillText(str, x, y + 1);
        ctx.globalAlpha = g;
      }
      if (sh !== 'none') { ctx.fillStyle = sh; ctx.fillText(str, x + 1, y + 1); ctx.fillText(str, x + 1, y); ctx.fillText(str, x, y + 1); }
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    }
    function tw(str, size, mono) {
      ctx.font = size + 'px ' + (mono === false ? PSTART : MONO);
      return ctx.measureText(str).width;
    }
    // Bill sprite: spin frame 0 flat, 1 tilted, 2 flat-reverse, 3 edge-on.
    function bill(x, y, frameIdx, tone, alpha) {
      var c = BILL[tone] || BILL.g;
      var g = ctx.globalAlpha; ctx.globalAlpha = g * alpha;
      x = Math.round(x); y = Math.round(y);
      switch (frameIdx & 3) {
        case 0: R(x - 4, y - 2, 9, 5, c.e); R(x - 3, y - 1, 7, 3, c.a); R(x - 1, y, 3, 1, c.c); break;
        case 1: R(x - 4, y - 1, 9, 3, c.e); R(x - 3, y, 7, 1, c.a); R(x - 1, y, 2, 1, c.c); break;
        case 2: R(x - 4, y - 2, 9, 5, c.e); R(x - 3, y - 1, 7, 3, c.b); R(x - 2, y, 1, 1, c.a); break;
        default: R(x - 2, y - 2, 5, 5, c.e); R(x - 1, y - 1, 3, 3, c.a); break;
      }
      ctx.globalAlpha = g;
    }

    // Larger bill sprite for FAN visuals (source: "larger visual").
    function billBig(x, y, frameIdx, tone, alpha) {
      var c = BILL[tone] || BILL.g;
      var g = ctx.globalAlpha; ctx.globalAlpha = g * alpha;
      x = Math.round(x); y = Math.round(y);
      switch (frameIdx & 3) {
        case 0: R(x - 6, y - 3, 13, 7, c.e); R(x - 5, y - 2, 11, 5, c.a); R(x - 2, y - 1, 5, 3, c.c); R(x - 1, y, 3, 1, c.a); break;
        case 1: R(x - 6, y - 2, 13, 5, c.e); R(x - 5, y - 1, 11, 3, c.a); R(x - 2, y, 4, 1, c.c); break;
        case 2: R(x - 6, y - 3, 13, 7, c.e); R(x - 5, y - 2, 11, 5, c.b); R(x - 3, y, 2, 1, c.a); break;
        default: R(x - 3, y - 3, 7, 7, c.e); R(x - 2, y - 2, 5, 5, c.a); break;
      }
      ctx.globalAlpha = g;
    }

    // ---------------- layout + derived visuals (read-only over the core) ----------------
    function layout() {
      var deckTop = Math.round(H * 0.43);
      var deckH = Math.round(H * 0.075);
      return {
        deckTop: deckTop, deckH: deckH, wallH: deckTop,
        lipBottom: deckTop + deckH + 4,
        crowdBase: deckTop + deckH + 22,
        counterTop: Math.round(H * 0.78)
      };
    }
    function stackGeo() {
      var sw = Math.round(clamp(W * 0.5, 84, 112));
      var base = Math.round(H * 0.95);
      var maxH = 46, depth = 6;
      var initial = Math.max(1, Math.floor(core.budget / tunables.stack.billValue));
      var frac = clamp(vis.bills / initial, 0, 1);
      var h = vis.bills > 0.4 ? Math.max(3, Math.round(maxH * frac)) : 0;
      var x0 = Math.round(W / 2 - sw / 2 - depth / 2);
      return { sw: sw, base: base, h: h, depth: depth, x0: x0, top: base - h - depth, frontTop: base - h, cx: Math.round(W / 2), maxH: maxH, initial: initial, frac: frac };
    }
    function beatEnv(t) {
      var b = core.beatAt(t);
      var half = b.interval / 2;
      var level = b.perfect ? 2 : (b.onBeat ? 1 : 0);
      var glow = level === 2 ? 1 : (level === 1 ? 0.78 : 0.3 * clamp(1 - (b.delta - tunables.beat.windowMs) / Math.max(1, half - tunables.beat.windowMs), 0, 1));
      var until = b.interval - b.phase;
      if (until >= b.interval) until = 0;
      return { level: level, glow: glow, until: until, interval: b.interval, phase: b.phase, index: b.index, delta: b.delta };
    }
    function spotlightMode(t) {
      // read-only look-ahead of the same spotlight function the core uses
      var active = core.spotlightActive(t);
      var closing = active && !core.spotlightActive(t + 260);
      var warming = !active && core.spotlightActive(t + 300);
      return { active: active, closing: closing, warming: warming };
    }

    // ---------------- draw ----------------
    function draw(t) {
      var N = now();
      var dt = lastDraw ? Math.min(64, N - lastDraw) : 16;
      lastDraw = N; frameNo++;
      trim(N);
      var s = core.state();
      var L = layout();
      var env = beatEnv(t);
      var spot = spotlightMode(t);
      var tx = core.targetX(t) * W;
      updateVis(s, dt, N);

      ctx.save();
      ctx.globalAlpha = 1;
      if (shake > 0 && !reduce) ctx.translate(Math.round((hsh(frameNo) * 2 - 1) * shake / 90), Math.round((hsh(frameNo + 999) * 2 - 1) * shake / 130));
      drawBackdrop(L, env, s);
      drawDeck(L, env, spot, tx);
      drawCrowd(L, env, s, N);
      drawTarget(L, tx, spot, N);
      drawLitter(N);
      drawCounter(L, env);
      drawStack(L, env, s, N);
      drawDragFan(env, N);
      drawAnimations(N);
      drawParticles(N);
      scanlines();
      drawFlashes();
      drawHud(t, s, env, N);
      drawCrowdLabel(L, s, N);
      drawStreakBadge(s, N);
      drawPopups(N);
      if (!hintDone && core.flicks === 0 && !(pointer && pointer.active) && (N - roundStartReal) < 9000) drawHint(t, N);
      drawFrameGlow(env, s);
      ctx.restore();
    }

    function updateVis(s, dt, N) {
      var k = Math.min(1, dt / 130);
      vis.cash += (s.cash - vis.cash) * Math.min(1, dt / 160);
      vis.hype += (s.hype - vis.hype) * Math.min(1, dt / 220);
      if (Math.abs(vis.cash - s.cash) < 0.6) vis.cash = s.cash;
      if (Math.abs(vis.hype - s.hype) < 0.6) vis.hype = s.hype;
      var lifted = (pointer && pointer.active && s.load) ? s.load.bills : 0;
      var target = Math.max(0, s.availableBills - lifted);
      vis.bills += (target - vis.bills) * k;
      if (Math.abs(vis.bills - target) < 0.05) vis.bills = target;
      if (s.cash < last.cash) pop.cash = N;
      if (s.hype > last.hype + 0.4) pop.hype = N;
      if (s.waste > last.waste + 0.4) pop.waste = N;
      if (s.spent > last.spent + 0.4) pop.spent = N;
      last.cash = s.cash; last.hype = s.hype; last.waste = s.waste; last.spent = s.spent;
    }

    // Static layers are drawn once per size into an offscreen canvas (the frame budget matters on phones).
    function buildBg(L) {
      if (!bg) bg = global.document.createElement('canvas');
      bg.width = W; bg.height = H;
      var main = ctx;
      ctx = bg.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      var bands = ['#07060f', '#0a0818', '#0d0a1f', '#110c26', '#150f2e', '#1a1236', '#1d1440', '#20174a'];
      var bh = Math.ceil(L.wallH / bands.length);
      for (var i = 0; i < bands.length; i++) R(0, i * bh, W, bh + 1, bands[i]);
      R(0, L.wallH, W, H - L.wallH, '#0b0917');
      // audience floor: perspective grid toward the stage
      var fy0 = L.lipBottom, fy1 = L.counterTop;
      for (var gi = -8; gi <= 8; gi++) {
        for (var gy = fy0; gy < fy1; gy += 1) {
          var gx = W / 2 + gi * lerp(6, 34, (gy - fy0) / Math.max(1, fy1 - fy0));
          RA(gx, gy, 1, 1, PAL.lav2, 0.32);
        }
      }
      for (var gk = 1; gk < 7; gk++) RA(0, fy0 + Math.pow(gk / 7, 1.7) * (fy1 - fy0), W, 1, PAL.lav2, 0.22);
      // curtain slats
      for (var x = 4; x < W; x += 12) RA(x, 58, 1, L.wallH - 58, PAL.lav, 0.05);
      // stage deck: surface, perspective planks, lip base
      var dt0 = L.deckTop, dh = L.deckH;
      R(0, dt0, W, dh, '#241a45');
      R(0, dt0, W, 1, '#4a3a86');
      for (var pi = -5; pi <= 5; pi++) {
        for (var py = 0; py < dh; py += 1) RA(W / 2 + pi * lerp(9, 24, py / dh), dt0 + py, 1, 1, PAL.lav2, 0.35);
      }
      R(0, dt0 + dh, W, 4, '#0a0714');
      ctx = main;
      bgDirty = false;
    }

    function drawBackdrop(L, env, s) {
      if (bgDirty || !bg) buildBg(L);
      ctx.drawImage(bg, 0, 0);
      // neon tubes (cold cyan left, magenta right), lifted by the beat
      var glow = 0.35 + 0.65 * env.glow;
      var top = 62, bottom = L.wallH - 6;
      RA(Math.round(W * 0.07) - 4, top, 9, bottom - top, PAL.cyan, 0.05 + 0.10 * glow);
      RA(Math.round(W * 0.93) - 4, top, 9, bottom - top, PAL.pink, 0.05 + 0.10 * glow);
      R(Math.round(W * 0.07), top, 2, bottom - top, glow > 0.6 ? PAL.cyan : PAL.cyanDim);
      R(Math.round(W * 0.93) - 1, top, 2, bottom - top, glow > 0.6 ? PAL.pinkHi : PAL.pinkDim);
      // distant bokeh
      for (var b = 0; b < 9; b++) {
        var bx = Math.round(hsh(b * 5 + 1) * W), by = 62 + Math.round(hsh(b * 5 + 2) * (L.wallH - 80));
        var col = b % 3 === 0 ? PAL.cyan : (b % 3 === 1 ? PAL.pink : PAL.gold);
        RA(bx, by, 2, 2, col, 0.18 + 0.22 * (((frameNo >> 4) + b) % 3 === 0 ? 1 : 0.4) * glow);
      }
    }

    function drawDeck(L, env, spot, tx) {
      var dt0 = L.deckTop, dh = L.deckH;
      // (deck surface, planks and lip base live in the cached backdrop)
      // front lip lights, pulsing with the beat
      for (var x = 2; x < W; x += 8) {
        var c = ((x >> 3) & 1) ? PAL.cyan : PAL.pinkHi;
        RA(x, dt0 + dh + 1, 4, 2, c, 0.25 + 0.75 * env.glow);
      }
      // pool = the real hit zone (core radius); widened dotted rim while a FAN is ready
      var poolY = dt0 + Math.round(dh * 0.5);
      var rx = tunables.target.radius * W;
      var ry = Math.max(4, Math.round(dh * 0.36));
      var load = pointer && pointer.active ? core.state().load : null;
      var fanReady = load && isFanReady(load);
      var N = now();
      var flick = (spot.closing || spot.warming) && (((N / 70) | 0) % 2 === 0) ? 0.55 : 1;
      if (spot.active) {
        fillEllipse(tx, poolY, rx * 1.18, ry * 1.25, PAL.goldHi, 0.16 * flick);
        fillEllipse(tx, poolY, rx, ry, PAL.goldHi, 0.30 * flick);
        fillEllipse(tx, poolY, rx * 0.6, ry * 0.6, PAL.goldPale, 0.40 * flick);
        ringEllipse(tx, poolY, rx, ry, PAL.goldPale, 0.95 * flick);
      } else {
        fillEllipse(tx, poolY, rx, ry, '#0a0816', 0.55);
        ringEllipse(tx, poolY, rx, ry, spot.warming ? PAL.gold : PAL.dim2, spot.warming ? 0.85 * flick : 0.7, 2);
        // hazard cross: dark = risky / waste
        var cxx = Math.round(tx), cyy = Math.round(poolY);
        for (var d = -3; d <= 3; d++) { RA(cxx + d, cyy + d, 1, 1, PAL.red, 0.55); RA(cxx + d, cyy - d, 1, 1, PAL.red, 0.55); }
      }
      if (fanReady) ringEllipse(tx, poolY, (tunables.target.radius + tunables.fan.radiusBonus) * W, ry * 1.25, PAL.goldHi, 0.75, 2);
      // landing pulse
      var pp = (N - poolPulse.at) / 380;
      if (pp >= 0 && pp < 1) ringEllipse(poolPulse.x * W, poolY, rx * (1 + pp * 0.9), ry * (1 + pp * 0.9), PAL.white, 0.9 * (1 - pp));
      // the beam from the tracking lamp
      var lampY = 61;
      var poolC = poolY;
      if (spot.active || spot.warming) {
        var inten = spot.active ? 1 : 0.45;
        var span = poolC - lampY;
        for (var yy = 0; yy < span; yy++) {
          var half = lerp(3, rx * 0.98, yy / span);
          RA(tx - half, lampY + yy, half * 2 + 1, 1, PAL.goldHi, 0.09 * inten * flick);
          RA(tx - half * 0.5, lampY + yy, half + 1, 1, PAL.goldPale, 0.07 * inten * flick);
        }
      }
      // lamp head
      R(tx - 5, lampY - 5, 11, 5, PAL.ink);
      R(tx - 4, lampY - 4, 9, 3, '#2a2452');
      R(tx - 3, lampY - 1, 7, 2, spot.active ? PAL.goldPale : (spot.warming ? PAL.gold : '#302a55'));
    }

    // Neutral mannequin silhouette. No identity, no face, no gendered cues.
    function targetHalfWidth(row) {
      if (row <= 8) { var dy = row - 4; return Math.round(Math.sqrt(Math.max(0, 4.6 * 4.6 - dy * dy))); }
      if (row <= 10) return 2;
      if (row === 11) return 8;
      if (row <= 13) return 11;
      if (row === 14) return 10;
      if (row === 15) return 9;
      if (row <= 28) return Math.round(lerp(9, 6, (row - 16) / 12));
      if (row <= 37) return Math.round(lerp(6, 8, (row - 29) / 8));
      if (row <= 50) return 7;
      return 6;
    }
    function drawTarget(L, tx, spot, N) {
      var FH = 52;
      var feetY = L.deckTop + Math.round(L.deckH * 0.55);
      var hitAge = N - hit.at;
      var jump = hitAge >= 0 && hitAge < 240 ? Math.round(3 * (1 - hitAge / 240)) : 0;
      var top = feetY - FH - jump;
      fillEllipse(tx, feetY, 13, 2, '#000000', 0.55);
      var cx = Math.round(tx);
      var body, lite, dark, rimL, rimR;
      if (spot.active) { body = '#d19b3e'; lite = '#f6c85a'; dark = '#8a5a1f'; rimL = PAL.goldPale; rimR = PAL.goldHi; }
      else { body = '#1c1740'; lite = '#2b2460'; dark = '#100c26'; rimL = PAL.cyanDim; rimR = PAL.pinkDim; }
      var r;
      for (r = -1; r <= FH; r++) { // outline pass
        var hwo = targetHalfWidth(clamp(r, 0, FH - 1)) + 1;
        R(cx - hwo, top + r, hwo * 2 + 1, 1, PAL.ink);
      }
      for (r = 0; r < FH; r++) {
        var hw = targetHalfWidth(r);
        var y = top + r;
        R(cx - hw, y, hw * 2 + 1, 1, body);
        R(cx - hw, y, Math.max(1, Math.round(hw * 0.7)), 1, lite);
        R(cx + Math.round(hw * 0.35), y, Math.max(1, hw - Math.round(hw * 0.35) + 1), 1, dark);
        R(cx - hw, y, 1, 1, rimL);
        R(cx + hw, y, 1, 1, rimR);
      }
      R(cx - 3, top, 7, 1, spot.active ? PAL.goldPale : '#3b3378'); // crown light
      if (hitAge >= 0 && hitAge < 150) {
        ctx.globalAlpha = 0.75 * (1 - hitAge / 150);
        for (r = 0; r < FH; r++) { var hf = targetHalfWidth(r); R(cx - hf, top + r, hf * 2 + 1, 1, PAL.white); }
        ctx.globalAlpha = 1;
      }
    }

    function drawCrowd(L, env, s, N) {
      var crowd = s.crowd;
      var frac = clamp(crowd / Math.max(1, tunables.hype.crowdMax), 0, 1);
      var base = L.crowdBase;
      var bob = 2 * Math.PI * (env.phase / env.interval);
      var storm = crowd >= tunables.hype.stormThreshold;
      // the room jumps when a throw lands (presentation-only reaction to the hit event)
      var react = hit.at > 0 ? clamp(1 - (N - hit.at) / 480, 0, 1) : 0;
      // stage-light spill on the floor behind the crowd so the silhouettes read against it
      for (var rr = 0; rr < 38; rr++) RA(0, L.lipBottom + rr, W, 1, '#6a58c8', (0.22 + 0.10 * env.glow) * (1 - rr / 38));
      function person(x, hy, big, i, awake, up, row) {
        var col = row ? (awake ? '#05040b' : '#0a0817') : '#140e2e';
        var rim = i % 2 ? PAL.cyan : PAL.pinkHi;
        if (big) {
          R(x - 9, hy + 9, 19, 12 + up, col);
          R(x - 8, hy + 8, 17, 1, col);
          disc(x, hy + 4, 4, col);
          RA(x - 4, hy, 9, 1, rim, awake ? 0.6 : 0.22);
          RA(x - 9, hy + 9, 4, 1, rim, awake ? 0.5 : 0.18);
        } else {
          R(x - 6, hy + 6, 13, 8, col);
          disc(x, hy + 3, 3, col);
          RA(x - 3, hy, 7, 1, rim, awake ? 0.35 : 0.15);
        }
      }
      var i;
      // back row (smaller, lighter: depth)
      var backSlots = 9, backCount = 4 + Math.floor(frac * 5);
      for (i = 0; i < backSlots; i++) {
        var bx = Math.round((i + 0.5) * (W / backSlots) + (hsh(i * 5 + 40) - 0.5) * 6);
        var ba = i < backCount || hsh(i * 3 + 9) < frac;
        var bup = ba && crowd > 12 ? Math.round(Math.max(0, Math.sin(bob + i * 1.3)) * 1.5) : 0;
        person(bx, base - 25 - bup, false, i + 1, ba, 0, 0);
      }
      // front row
      var slots = 13;
      var count = 6 + Math.floor(frac * 7);
      var order = [];
      for (i = 0; i < slots; i++) order.push({ i: i, r: hsh(i * 17 + 5) });
      order.sort(function (a, b) { return a.r - b.r; });
      var active = {};
      for (i = 0; i < count && i < slots; i++) active[order[i].i] = true;
      for (i = 0; i < slots; i++) {
        var awake = !!active[i];
        var x = Math.round((i + 0.5) * (W / slots) + (hsh(i * 9 + 2) - 0.5) * 5);
        var up = awake ? Math.round(Math.max(0, Math.sin(bob + i * 0.7)) * (0.8 + crowd / 45) + react * 3) : 0;
        var hy = base - 23 - up + (awake ? 0 : 3);
        var col = awake ? '#05040b' : '#0a0817';
        person(x, hy, true, i, awake, up, 1);
        // arms raised as the room heats up (and for a beat after every hit)
        if (awake && (crowd > 30 || react > 0.25) && (i % 2 === 0 || crowd > 62 || react > 0.5)) {
          var ah = 8 + Math.round(Math.max(0, Math.sin(bob + i)) * 3);
          R(x - 11, hy + 9 - ah, 3, ah, col);
          if (crowd > 55 && (i + env.index) % 3 === 0) { R(x - 13, hy + 9 - ah - 2, 7, 3, BILL.g.a); R(x - 13, hy + 9 - ah - 2, 7, 1, BILL.g.c); }
        }
        if (awake && crowd > 68 && (i + (frameNo >> 3)) % 4 === 0) R(x + 7, hy - 3 - up, 2, 2, PAL.white);
        if (storm && awake && (frameNo + i * 3) % 7 === 0) R(x + 4, hy - 6, 1, 3, PAL.goldPale);
      }
    }

    function drawCrowdLabel(L, s, N) {
      var y = L.crowdBase + 2;
      var storm = s.crowd >= tunables.hype.stormThreshold;
      var label = 'CROWD ' + Math.round(s.crowd);
      text(label, 4, y, storm ? PAL.goldHi : PAL.cyan, 16, 'left', { glow: storm ? PAL.pinkDim : null });
      if (storm) {
        var on = ((N / 180) | 0) % 2 === 0;
        text('STORM', 4 + tw(label, 16) + 5, y, on ? PAL.white : PAL.pinkHi, 16, 'left', { glow: PAL.pink });
      }
    }

    function drawLitter(N) {
      for (var i = 0; i < litter.length; i++) {
        var b = litter[i];
        if (N < b.landAt) continue;
        var fr = hsh(b.seed) < 0.5 ? 1 : 2;
        bill(b.x * W, b.y, fr, b.tone, 0.95);
      }
    }

    function drawCounter(L, env) {
      var y0 = L.counterTop;
      R(0, y0, W, H - y0, '#0a0815');
      R(0, y0, W, 2, env.level >= 1 ? PAL.cyan : PAL.cyanDeep);
      RA(0, y0 + 2, W, 3, PAL.cyan, 0.05 + 0.13 * env.glow);
      for (var x = 6; x < W; x += 14) RA(x, y0 + 8, 6, 1, PAL.lav2, 0.35);
      for (var y = y0 + 14; y < H; y += 9) RA(0, y, W, 1, PAL.lav2, 0.10);
    }

    function isFanReady(load) {
      return load.bills >= tunables.fan.minBills &&
        load.durationMs >= tunables.fan.minDurationMs &&
        load.smoothness >= tunables.fan.minSmoothness;
    }

    function drawStack(L, env, s, N) {
      var g = stackGeo();
      var x0 = g.x0, sw = g.sw, d = g.depth, fh = g.h, ft = g.frontTop;
      var glowLvl = env.level;
      // press pad + converging beat ring (cue sits where the thumb is)
      var padCy = g.base + 4;
      fillEllipse(g.cx, padCy, sw * 0.62, 4, PAL.cyan, 0.10 + 0.12 * env.glow);
      if (fh > 0) {
        var until = env.until;
        var rr = clamp(until / env.interval, 0, 1);
        var ringA = 0.10 + 0.75 * (1 - rr);
        ringEllipse(g.cx, ft - fh * 0 + 6, sw * 0.5 + 4 + rr * 40, 8 + rr * 16, glowLvl === 2 ? PAL.white : PAL.cyan, ringA, 0);
        // outward kick right after the beat
        var since = env.phase;
        if (since < 260) { var kk = since / 260; ringEllipse(g.cx, ft + 6, sw * 0.5 + 4 + kk * 26, 8 + kk * 10, PAL.cyan, 0.5 * (1 - kk)); }
      }
      if (fh === 0) {
        text('OUT OF CASH', g.cx, g.base - 16, PAL.waste, 16, 'center');
        return;
      }
      if (glowLvl >= 1) {
        fillEllipse(g.cx + 2, g.base - fh * 0.4, sw * 0.62, fh * 0.55 + 8, glowLvl === 2 ? PAL.white : PAL.cyan, glowLvl === 2 ? 0.16 : 0.10);
      }
      // top face
      var k;
      for (k = 1; k <= d; k++) R(x0 + k, ft - k, sw, 1, k === d ? '#c8ffdc' : '#7cf0ac');
      // right face
      for (k = 1; k <= d; k++) R(x0 + sw + k - 1, ft - k, 1, fh, '#0b5230');
      // front face: paper edges
      for (var y = 0; y < fh; y += 2) {
        R(x0, ft + y, sw, Math.min(2, fh - y), (y / 2) % 2 ? '#1f8f52' : '#2fbf6a');
      }
      R(x0, ft, sw, 1, '#a6f5c2');
      R(x0, ft + fh - 1, sw, 1, '#0b3b22');
      // outline
      var oc = glowLvl === 2 ? PAL.white : (glowLvl === 1 ? PAL.cyan : PAL.ink);
      R(x0 - 1, ft - 1, 1, fh + 2, oc); R(x0 + sw, ft + fh, 1, 1, oc);
      R(x0 - 1, ft + fh, sw + 1, 1, oc);
      R(x0 + d, ft - d - 1, sw + 1, 1, oc);
      R(x0 + sw + d, ft - d, 1, fh, oc);
      // belly band with $
      if (fh >= 14) {
        R(g.cx - 8, ft, 16, fh, PAL.cream);
        R(g.cx - 8, ft, 1, fh, '#b8ad8a'); R(g.cx + 7, ft, 1, fh, '#b8ad8a');
        text('$', g.cx, ft + Math.round((fh - 11) / 2) - 1, PAL.ink, 16, 'center', { shadow: 'none' });
      } else if (fh >= 6) {
        R(g.cx - 8, ft, 16, fh, PAL.cream);
      }
    }

    function drawDragFan(env, N) {
      if (!pointer || !pointer.active) return;
      var s = core.state(), load = s.load;
      var g = stackGeo();
      var px = pointer.lastX * W, py = pointer.lastY * H;
      var sx = pointer.startX * W, sy = pointer.startY * H;
      // drag trail
      var tlen = Math.hypot(px - sx, py - sy);
      for (var q = 0; q < tlen; q += 5) RA(lerp(sx, px, q / tlen), lerp(sy, py, q / tlen), 1, 1, PAL.cream, 0.28);
      var n = load ? load.bills : 0;
      var ready = load && isFanReady(load);
      if (n > 0) {
        var ax = g.cx, ay = g.top + 2;
        var vx = px - ax, vy = py - ay;
        var len = Math.max(6, Math.hypot(vx, vy));
        var nx = -vy / len, ny = vx / len; // perpendicular
        var baseAng = Math.atan2(vy, vx);
        for (var i = 0; i < n; i++) {
          var u = n === 1 ? 1 : i / (n - 1);
          var bx, by;
          if (ready) {
            // FAN: the load opens into a hand of bills at the thumb (wider = the FAN bonus)
            var ang = baseAng + (u - 0.5) * 1.15;
            var rad = len * (i % 3 === 0 ? 0.62 : (i % 3 === 1 ? 0.78 : 0.94));
            bx = ax + Math.cos(ang) * rad; by = ay + Math.sin(ang) * rad;
            billBig(bx, by, (i % 4 === 0 ? 1 : 0), 'gold', 1);
            continue;
          } else {
            // LOAD: bills queue up along the drag path, one per step of drag
            var sdist = 0.16 + 0.8 * u;
            var wob = (hsh(i * 7 + 3) - 0.5) * 5;
            bx = ax + vx * sdist + nx * wob; by = ay + vy * sdist + ny * wob;
          }
          bill(bx, by, ready ? (i % 4 === 0 ? 1 : 0) : (i % 5 === 0 ? 1 : 0), ready ? 'gold' : 'g', 1);
        }
        // count bubble near the thumb (offset so the finger does not hide it)
        var side = px > W * 0.55 ? -1 : 1;
        var lx = px + side * 16;
        var ly = Math.max(py - 30, 78); // never slide under the HUD when the thumb is high
        text('x' + n, lx, ly, ready ? PAL.goldHi : PAL.cash, 32, side > 0 ? 'left' : 'right', { glow: ready ? PAL.gold : null });
        text(formatMoney(n * tunables.stack.billValue), lx, ly + 24, PAL.cream, 16, side > 0 ? 'left' : 'right');
        if (ready) text('FAN', lx, ly - 12, PAL.goldPale, 16, side > 0 ? 'left' : 'right', { glow: PAL.gold });
      }
      // thumb marker
      ringEllipse(px, py, 7, 7, PAL.cream, 0.85);
      RA(px - 1, py - 1, 3, 3, PAL.cream, 0.9);
    }

    function billFrame(seed, elapsed, spin) {
      return Math.floor(elapsed / (70 / spin) + seed) & 3;
    }
    function drawAnimations(N) {
      var g = stackGeo();
      var Sx = g.cx, Sy = g.top + 4;
      var Gy = H * 0.34;
      for (var a = 0; a < animations.length; a++) {
        var an = animations[a];
        var Gx = clamp(an.toX, 0.02, 0.98) * W;
        var arcPx = an.arc * H * 0.55;
        for (var i = 0; i < an.bills.length; i++) {
          var b = an.bills[i];
          var el = N - an.t0 - b.delay;
          if (el < 0) continue;
          var p = clamp(el / an.dur, 0, 1);
          var e = easeOut(p);
          var endX = Gx + b.f * (an.fan ? 0.16 : 0.08) * W;
          var midX = (Sx + endX) / 2 + b.f * an.spread * W * 1.2;
          var midY = lerp(Sy, Gy, 0.5) - arcPx;
          var px = quad(Sx, midX, endX, e);
          var py = quad(Sy, midY, Gy, e);
          var fr = billFrame(b.seed, el, b.spin);
          if (el <= an.dur) {
            if (an.fan) billBig(px, py, fr, 'gold', 1); else bill(px, py, fr, 'g', 1);
            continue;
          }
          var q = (el - an.dur);
          if (an.kind === 'hit') {
            var tq = clamp(q / 520, 0, 1);
            var fx = endX + Math.sin(tq * 9 + b.seed) * 4 + b.f * 10 * tq;
            var fy = Gy + tq * tq * 26 - (1 - tq) * 2;
            bill(fx, fy, fr, tq > 0.45 ? 'gold' : 'g', 1 - tq * tq);
          } else {
            var fq = clamp(q / an.fall, 0, 1);
            var rx = b.restX * W, ry = b.restY;
            var fxx = lerp(endX, rx, fq), fyy = lerp(Gy, ry, fq * fq);
            if (N < an.t0 + b.delay + an.dur + an.fall) bill(fxx, fyy, fr, an.kind === 'overthrow' ? 'd' : 'g', 1);
          }
        }
      }
    }
    function quad(a, b, c, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; }

    function drawParticles(N) {
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var el = N - p.t0;
        if (el < 0 || el >= p.life) continue;
        var x = p.x + p.vx * el, y = p.y + p.vy * el + p.g * el * el;
        RA(x, y, p.s, p.s, p.c, 1 - el / p.life);
      }
    }

    function scanlines() {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      for (var y = 1; y < H; y += 3) ctx.fillRect(0, y, W, 1);
    }
    function drawFlashes() {
      if (reduce) return;
      var N = now();
      var names = ['white', 'gold', 'red'], cols = [PAL.white, PAL.goldHi, PAL.red];
      for (var i = 0; i < 3; i++) {
        var fl = flashes[names[i]];
        if (!fl) continue;
        var k = 1 - (N - fl.at) / fl.dur;
        if (k <= 0) { flashes[names[i]] = null; continue; }
        ctx.globalAlpha = fl.a * k; R(0, 0, W, H, cols[i]); ctx.globalAlpha = 1;
      }
    }
    function drawFrameGlow(env, s) {
      var storm = s.crowd >= tunables.hype.stormThreshold;
      var a = 0.10 + 0.55 * env.glow;
      var col = storm ? PAL.pinkHi : (env.level === 2 ? PAL.white : PAL.cyan);
      if (storm) a = 0.25 + 0.65 * env.glow;
      RA(0, 0, W, 1, col, a); RA(0, H - 1, W, 1, col, a);
      RA(0, 0, 1, H, col, a); RA(W - 1, 0, 1, H, col, a);
      RA(1, 1, W - 2, 1, col, a * 0.4); RA(1, H - 2, W - 2, 1, col, a * 0.4);
      RA(1, 1, 1, H - 2, col, a * 0.4); RA(W - 2, 1, 1, H - 2, col, a * 0.4);
    }

    // ---------------- HUD ----------------
    function drawHud(t, s, env, N) {
      R(0, 0, W, 58, 'rgba(7,6,15,0.82)');
      R(0, 58, W, 1, PAL.lav2);
      // time strip along the very top edge
      var frac = clamp(s.timeLeftMs / s.roundDurationMs, 0, 1);
      var timeLeft = Math.ceil(s.timeLeftMs / 1000);
      var low = timeLeft <= 5;
      R(0, 0, W, 2, '#1a1636');
      R(0, 0, W * frac, 2, low ? PAL.waste : PAL.cyan);
      // labels
      text('CASH', 6, 3, PAL.gold, 16, 'left');
      text('HYPE', W - 6, 3, PAL.pinkDim, 16, 'right');
      var tcol = low ? (((N / 250) | 0) % 2 ? PAL.waste : PAL.white) : PAL.cream;
      text(String(timeLeft), Math.round(W / 2), 3, tcol, 16, 'center');
      // CASH: it leaves your hands, so flash red on every spend
      var cashAge = N - pop.cash;
      var cashCol = cashAge < 320 ? PAL.waste : PAL.cash;
      text(formatMoney(vis.cash), 6, 11 + (cashAge < 140 ? 1 : 0), cashCol, 32, 'left');
      // HYPE: rolls up, flashes on gain
      var hypeAge = N - pop.hype;
      var hypeCol = hypeAge < 240 ? PAL.white : PAL.pinkHi;
      text(formatNum(vis.hype), W - 6, 11 - (hypeAge < 140 ? 1 : 0), hypeCol, 32, 'right', { glow: hypeAge < 240 ? PAL.pink : null });
      // money ledger row
      var spentAge = N - pop.spent, wasteAge = N - pop.waste;
      text('SPENT ' + formatMoney(s.spent), 6, 42, spentAge < 260 ? PAL.white : PAL.dim, 16, 'left');
      text('WASTED ' + formatMoney(s.waste), W - 6, 42, wasteAge < 300 ? PAL.white : PAL.waste, 16, 'right');
    }

    function drawStreakBadge(s, N) {
      var g = stackGeo();
      var x = W - 7, y = g.base - 46;
      if (s.streak >= 2) {
        var age = N - streakPopAt;
        var jump = age >= 0 && age < 220 ? Math.round(4 * (1 - age / 220)) : 0;
        var hot = s.streak >= 3;
        text('STREAK', x, y - 12 - jump, hot ? PAL.goldHi : PAL.dim, 16, 'right');
        text('x' + s.streak, x, y - jump + 2, hot ? PAL.goldHi : PAL.cream, 32, 'right', { glow: hot ? PAL.gold : null });
      }
      if (lostStreak) {
        var la = (N - lostStreak.t0) / 500;
        if (la < 1) {
          ctx.globalAlpha = 1 - la;
          text('x' + lostStreak.n, x, y + 2 + Math.round(la * 22), PAL.red, 32, 'right');
          ctx.globalAlpha = 1;
        } else lostStreak = null;
      }
    }

    function drawPopups(N) {
      for (var i = 0; i < popups.length; i++) {
        var p = popups[i];
        var el = N - p.t0;
        if (el < 0) continue;
        var k = clamp(el / p.ttl, 0, 1);
        var settle = el < 90 ? Math.round((1 - el / 90) * 4) : 0;
        var a = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
        if (p.kill) a *= clamp(1 - (N - p.kill) / 140, 0, 1);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        var y = p.y - (p.rise || 0) * easeOut(k) + settle;
        var half = tw(p.text, p.size, p.mono === true) / 2;
        var x = clamp(p.x, half + 3, W - half - 3);
        text(p.text, x, y, p.color, p.size, 'center', { mono: p.mono === true, glow: p.glow, shadow: p.shadow });
        ctx.globalAlpha = 1;
      }
    }

    function drawHint(t, N) {
      var g = stackGeo();
      var cyc = ((N - roundStartReal) % 2600) / 2600;
      // ghost thumb: press on the roll, drag up loading bills, flick
      var gx = g.cx, gy0 = g.top + 8, gy1 = Math.round(H * 0.6);
      var u = cyc < 0.55 ? easeOut(cyc / 0.55) : 1;
      var gy = lerp(gy0, gy1, u);
      var trailN = Math.floor(u * 9);
      for (var i = 0; i <= trailN; i++) bill(gx, lerp(gy0, gy, i / 9), 0, 'g', 0.55);
      if (cyc >= 0.55 && cyc < 0.75) {
        var fk = (cyc - 0.55) / 0.2;
        for (var l = 0; l < 4; l++) RA(gx - 10 + l * 7, gy1 - 6 - fk * 22 - l * 2, 1, 8, PAL.cream, 0.6 * (1 - fk));
      }
      ringEllipse(gx, gy, 7, 7, PAL.cream, 0.9);
      RA(gx - 1, gy - 1, 3, 3, PAL.cream, 0.9);
      var pulse = 0.55 + 0.45 * Math.sin(N / 180);
      ctx.globalAlpha = pulse;
      var hy = Math.min(Math.round(H * 0.66), g.top - 31);
      text('DRAG UP = LOAD', g.cx, hy, PAL.cream, 16, 'center');
      text('FLICK = THROW', g.cx, hy + 12, PAL.cyan, 16, 'center');
      ctx.globalAlpha = 1;
      // title card fades out over the first seconds
      var age = N - roundStartReal;
      if (age < 1800) {
        ctx.globalAlpha = age < 1300 ? 1 : 1 - (age - 1300) / 500;
        text('MAKE IT RAIN', Math.round(W / 2), 66, PAL.goldPale, 8, 'center', { mono: false, glow: PAL.gold });
        ctx.globalAlpha = 1;
      }
    }

    // ---------------- result ----------------
    function buildRain(sm, N) {
      rain.length = 0;
      var n = Math.min(64, 12 + sm.hits * 3 + Math.floor(sm.hype / 250));
      for (var i = 0; i < n; i++) {
        rain.push({
          x: hsh(i * 3 + 11), delay: hsh(i * 5 + 3) * 2400, speed: 0.05 + hsh(i * 7 + 1) * 0.06,
          sway: 3 + hsh(i * 11) * 5, seed: i * 13 + 7, tone: hsh(i * 17) < 0.2 ? 'gold' : 'g'
        });
      }
    }

    function drawResult(el) {
      var s = core.summary();
      var full = !(isFinite(el)) || el > 2600;
      ctx.save();
      ctx.globalAlpha = 1;
      var fade = clamp(el / 240, 0, 1);
      ctx.globalAlpha = 0.9 * fade; R(0, 0, W, H, PAL.void); ctx.globalAlpha = fade;
      var pad = 8;
      var px = pad, pw = W - pad * 2;
      var py = 8, ph = H - 44 - py;
      // short phones: drop the title + caption and tighten the row pitch so nothing spills out of the card
      var avail = ph - 18;
      var compact = avail < 250;
      var vs = avail < 194 ? Math.max(0.65, avail / 194) : 1;
      var rowPitch = Math.round((compact ? 21 : 23) * vs);
      // panel: purple card, lavender border, ink outline, dried-blood offset shadow (game card language)
      R(px + 3, py + 3, pw, ph, PAL.blood);
      R(px - 1, py - 1, pw + 2, ph + 2, PAL.ink);
      R(px, py, pw, ph, PAL.lav);
      R(px + 1, py + 1, pw - 2, ph - 2, PAL.purple);
      R(px + 3, py + 3, pw - 6, ph - 6, PAL.purple2);
      R(px + 4, py + 4, pw - 8, ph - 8, PAL.purple);
      // content is ~250 logical px tall; centre it in the card when there is spare room
      var contentH = compact ? 194 : 250;
      var y = py + 9 + clamp(Math.floor((ph - 18 - contentH) / 2), 0, 14);
      var cx = Math.round(W / 2);
      if (!compact) { text('MAKE IT RAIN', cx, y, PAL.goldPale, 8, 'center', { mono: false, glow: PAL.gold }); y += 15; }
      text('RAIN SCORE', cx, y, PAL.dim, 16, 'center'); y += 12;
      var shownScore = full ? s.rainScore : Math.round(s.rainScore * easeOut(clamp((el - 200) / 1100, 0, 1)));
      var scoreStr = formatNum(shownScore);
      var popScore = (el > 1300 && el < 1600) ? -2 : 0;
      text(scoreStr, cx, y - 10 + popScore, PAL.goldHi, 64, 'center', { glow: PAL.gold });
      y += 40;
      if (!compact) { text('HYPE PER $100 SPENT', cx, y, PAL.dim2, 16, 'center'); y += 16; }
      R(px + 8, y, pw - 16, 1, PAL.lav2); y += 6;
      var rows = [
        ['SPENT', formatMoney(s.spent), PAL.cream],
        ['HYPE', formatNum(s.hype), PAL.pinkHi],
        ['WASTED', formatMoney(s.waste), PAL.waste]
      ];
      var shown = 0;
      for (var i = 0; i < rows.length; i++) {
        var appear = 700 + i * 160;
        if (!full && el < appear) continue;
        shown++;
        text(rows[i][0], px + 10, y + 8, PAL.dim, 16, 'left');
        text(rows[i][1], px + pw - 9, y, rows[i][2], 32, 'right');
        y += rowPitch;
      }
      y += 2;
      R(px + 8, y, pw - 16, 1, PAL.lav2); y += 6;
      if (full || el > 1200) {
        text('BEST STREAK', px + 10, y + 8, PAL.dim, 16, 'left');
        text('x' + s.bestStreak, px + pw - 9, y, s.bestStreak >= 3 ? PAL.goldHi : PAL.cream, 32, 'right');
        y += Math.round((compact ? 26 : 29) * vs);
      }
      if (full || el > 1400) {
        var cells = [['HITS', s.hits, PAL.goldHi], ['MISSES', s.misses, PAL.orange], ['OVERTHROW', s.overthrows, PAL.hot]];
        var cfrac = [0.17, 0.47, 0.80];
        for (var c = 0; c < 3; c++) {
          var cxx = px + Math.round(pw * cfrac[c]);
          text(cells[c][0], cxx, y, PAL.dim, 16, 'center');
          text(String(cells[c][1]), cxx, y + 10, cells[c][2], 32, 'center');
        }
        y += 44;
      }
      if (s.spent === 0) text('NOTHING THROWN', cx, py + ph - 16, PAL.dim2, 16, 'center');
      // celebration: bills fall through the card
      if (!full || el < 5600) {
        for (var r = 0; r < rain.length; r++) {
          var rb = rain[r];
          var e2 = el - rb.delay;
          if (e2 < 0 || !isFinite(el)) continue;
          var ry = -8 + e2 * rb.speed;
          if (ry > H + 8) continue;
          var rx = rb.x * W + Math.sin(e2 / 240 + rb.seed) * rb.sway;
          bill(rx, ry, Math.floor(e2 / 80 + rb.seed) & 3, rb.tone, 1);
        }
      }
      ctx.restore();
    }

    // ---------------- wiring ----------------
    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onUp, { passive: false });
    canvas.addEventListener('pointercancel', onCancel, { passive: false });
    if (global.ResizeObserver) {
      var ro = new ResizeObserver(function () { fit(); if (!running && !resultAnim && core.ended) { draw(tunables.round.durationMs); drawResult(Infinity); } });
      ro.observe(host || canvas);
    }
    if (global.document && global.document.fonts && global.document.fonts.load) {
      var redraw = function () {
        fit();
        if (!running && !resultAnim) {
          if (core.ended) { draw(tunables.round.durationMs); drawResult(Infinity); } else if (roundStart) draw(now() - roundStart);
        }
      };
      Promise.all([
        global.document.fonts.load('16px Monogram'),
        global.document.fonts.load('32px Monogram'),
        global.document.fonts.load('8px "Press Start 2P"')
      ]).then(redraw, redraw);
    }
    fit();

    var api = {
      version: VERSION,
      presentation: PRESENTATION,
      tunables: tunables,
      core: core,
      startRound: startRound,
      reset: reset,
      stop: function () { running = false; resultAnim = false; },
      setSeed: function (seed) { core.reset({ budget: core.budget, seed: seed }); },
      getState: function () { return core.state(); },
      getSummary: function () { return core.summary(); },
      setAudio: function (next) { hooks = Object.assign(defaultAudioHooks(), next || {}); },
      // Deterministic hooks used by the real-browser test harness. Not used by pointer input.
      debug: {
        advance: function (t) { return core.advance(t); },
        beginDrag: function (p) { return core.beginDrag(p); },
        dragTo: function (p) { return core.dragTo(p); },
        cancelDrag: function () { return core.cancelDrag(); },
        release: function (p) { var r = core.release(p); resolveFeedback(r, null); return r; },
        state: function () { return core.state(); },
        summary: function () { return core.summary(); },
        // Force a synchronous layout+draw. Lets review harnesses capture a frame even when
        // requestAnimationFrame is throttled (background/hidden tabs).
        render: function () { fit(); draw(now() - roundStart); return core.state(); },
        tick: function (t) { core.advance(t); fit(); draw(t); return core.state(); },
        forceEnd: function () {
          core.advance(tunables.round.durationMs); running = false; resultAnim = false;
          fit(); buildRain(core.summary(), now()); draw(tunables.round.durationMs); drawResult(Infinity);
          onRoundEnd(core.summary());
          return core.summary();
        },
        animations: function () { return animations.length; },
        litter: function () { return litter.length; },
        // Game-time clock (ms since round start) for harnesses that schedule real pointer gestures.
        clock: function () { return now() - roundStart; },
        // Live feedback labels (QA: verifies the feedback hierarchy without reading pixels).
        popups: function () {
          var N = now();
          return popups.filter(function (p) { return !p.kill && N - p.t0 < p.ttl; }).map(function (p) { return p.text; });
        }
      }
    };
    return api;
  }

  global.RAMakeItRainSandbox = {
    version: VERSION,
    presentation: PRESENTATION,
    mount: function (canvas, options) { return createGame(canvas, options); },
    createGame: createGame,
    formatMoney: formatMoney,
    defaultAudioHooks: defaultAudioHooks
  };
})(typeof window !== 'undefined' ? window : globalThis);
