// RAINMAKER / MAKE IT RAIN — CORE MECHANIC (F06-A, OL-011 PARALLEL_SAFE Wave 0)
//
// Pure, DOM-free, deterministic game-state logic for the STACK + TARGET + BEAT sandbox loop.
// This is the reusable half of the fragment: the future full RAINMAKER scene embeds this core
// and supplies its own adapter (renderer/input/scene). The sandbox adapter is disposable.
//
// AUTHORED BEHAVIOR (binding, OPEN RAINMAKER source):
//   STACK    : thumb-drag along the cash roll loads 1-20 bills; longer drag loads more.
//   FLICK    : swipe up + release; direction = aim; speed = arc; release consumes bills; stack thins.
//   ON BEAT  : release inside beat window -> x1.5 HYPE.
//   SPOTLIGHT: aim into the active target moment -> x2 HYPE.
//   FAN      : 10+ bills with a long smooth thumb action -> wider fan, larger visual, CROWD bonus.
//   STREAK   : consecutive good flicks -> combo multiplier up to x5.
//   OVERTHROW: flick while the target is NOT in its active spotlight moment -> money wasted on floor.
//   METERS   : HYPE, CROWD, RAIN SCORE = hype generated per dollar spent.
//
// Where the source is silent on exact timings/physics, every value comes from RAMakeItRainTunables.
// No randomness unless hype.jitter > 0, in which case a seeded/injected rng is used.
(function (global) {
  'use strict';

  var CORE_VERSION = 1;

  function clamp(value, lo, hi) { return value < lo ? lo : (value > hi ? hi : value); }
  function num(value, fallback) { return (typeof value === 'number' && isFinite(value)) ? value : fallback; }
  function hypot(x, y) { return Math.sqrt(x * x + y * y); }

  // Deterministic xorshift32. Seeded so tests are reproducible.
  function makeRng(seed) {
    var state = (seed >>> 0) || 0x9e3779b9;
    return function () {
      state ^= state << 13; state >>>= 0;
      state ^= state >>> 17;
      state ^= state << 5; state >>>= 0;
      return state / 4294967296;
    };
  }

  function resolveTunables(options) {
    var source = (options && options.tunables) || global.RAMakeItRainTunables;
    if (!source) throw new Error('RAMakeItRainCore requires RAMakeItRainTunables (load make_it_rain_tunables.js first)');
    return source.defaults || source;
  }

  function MakeItRain(options) {
    options = options || {};
    this.T = resolveTunables(options);
    this.seed = num(options.seed, 1);
    this.rng = (typeof options.rng === 'function') ? options.rng : makeRng(this.seed);
    this.reset(options);
  }

  MakeItRain.prototype.version = CORE_VERSION;

  // ---------------------------------------------------------------- round / reset
  MakeItRain.prototype.reset = function (options) {
    options = options || {};
    var T = this.T;
    if (options.seed != null) {
      this.seed = num(options.seed, this.seed);
      this.rng = (typeof options.rng === 'function') ? options.rng : makeRng(this.seed);
    }
    this.budget = Math.max(0, num(options.budget, T.round.defaultBudget));
    this.cash = this.budget;

    this.spent = 0;
    this.waste = 0;
    this.hype = 0;
    this.crowd = num(T.hype.crowdStart, 0);
    this.streak = 0;
    this.bestStreak = 0;

    this.flicks = 0;
    this.hits = 0;
    this.misses = 0;
    this.overthrows = 0;
    this.invalid = 0;

    this.nowMs = 0;
    this.ended = false;
    this.phase = 'idle';
    this.lastOutcome = null;
    this.history = [];
    this.drag = null;
    this.availableBills = Math.floor(this.cash / T.stack.billValue);
    return this.state();
  };

  // ---------------------------------------------------------------- time-driven
  MakeItRain.prototype.advance = function (t) {
    var T = this.T;
    t = num(t, this.nowMs);
    var dt = Math.max(0, t - this.nowMs);
    if (dt > 0 && T.hype.crowdDecayPerMs) {
      this.crowd = clamp(this.crowd - dt * T.hype.crowdDecayPerMs, 0, T.hype.crowdMax);
    }
    this.nowMs = Math.max(this.nowMs, t);
    if (!this.ended && this.nowMs >= T.round.durationMs) this.endRound();
    return this.state();
  };

  MakeItRain.prototype.beatAt = function (t) {
    var T = this.T;
    var interval = 60000 / T.beat.bpm;
    var phase = ((t % interval) + interval) % interval;
    var delta = Math.min(phase, interval - phase);
    return {
      interval: interval,
      phase: phase,
      delta: delta,
      index: Math.floor(t / interval),
      onBeat: delta <= T.beat.windowMs,
      perfect: delta <= T.beat.perfectWindowMs
    };
  };

  MakeItRain.prototype.targetX = function (t) {
    var T = this.T;
    var angle = (2 * Math.PI * t) / T.target.driftPeriodMs + T.target.driftPhase;
    return clamp(0.5 + T.target.driftAmplitude * Math.sin(angle), 0, 1);
  };

  MakeItRain.prototype.spotlightActive = function (t) {
    var T = this.T;
    var period = T.target.spotlightPeriodMs;
    var phase = ((t + T.target.spotlightOffsetMs) % period + period) % period;
    return phase < T.target.spotlightOnMs;
  };

  // ---------------------------------------------------------------- STACK / drag
  MakeItRain.prototype.hasCash = function () { return this.availableBills > 0; };

  MakeItRain.prototype.billsForDistance = function (distance) {
    var T = this.T;
    if (!(distance > 0)) return 0;
    var per = T.stack.loadDistancePerBill || 0.03;
    return clamp(Math.ceil(distance / per), 0, T.stack.maxBills);
  };

  MakeItRain.prototype.smoothnessOf = function (drag) {
    if (!drag) return 0;
    var T = this.T;
    var efficiency = drag.totalPath > 0 ? (drag.maxDistance / drag.totalPath) : 1;
    return clamp(efficiency * (1 - drag.reversals * T.stack.reversalPenalty), 0, 1);
  };

  MakeItRain.prototype.beginDrag = function (point) {
    point = point || {};
    if (this.ended) return this.state();
    var t = num(point.t, this.nowMs);
    this.nowMs = Math.max(this.nowMs, t);
    var x = num(point.x, 0.5), y = num(point.y, 0.9);
    this.drag = {
      startX: x, startY: y, lastX: x, lastY: y,
      startT: t, lastT: t,
      maxDistance: 0, totalPath: 0, reversals: 0, samples: 0,
      lastUx: 0, lastUy: 0
    };
    this.phase = 'loading';
    return this.state();
  };

  MakeItRain.prototype.dragTo = function (point) {
    if (!this.drag) return this.state();
    point = point || {};
    var d = this.drag;
    var x = num(point.x, d.lastX), y = num(point.y, d.lastY);
    var t = num(point.t, this.nowMs);
    var dx = x - d.lastX, dy = y - d.lastY;
    var segment = hypot(dx, dy);
    d.totalPath += segment;
    var distance = hypot(x - d.startX, y - d.startY);
    if (distance > d.maxDistance) d.maxDistance = distance;
    if (segment > 0.0005) {
      var ux = dx / segment, uy = dy / segment;
      if (d.samples > 0 && (ux * d.lastUx + uy * d.lastUy) < 0) d.reversals += 1;
      d.lastUx = ux; d.lastUy = uy; d.samples += 1;
    }
    d.lastX = x; d.lastY = y; d.lastT = t;
    this.nowMs = Math.max(this.nowMs, t);
    return this.state();
  };

  MakeItRain.prototype.cancelDrag = function () {
    // Pointer left the interaction area / cancelled: no bills are consumed.
    if (this.drag) { this.drag = null; if (!this.ended) this.phase = 'idle'; }
    return this.state();
  };

  // ---------------------------------------------------------------- FLICK / release
  // point may carry explicit {vx, vy} (normalized units/ms) from the adapter, or the core
  // derives velocity from the last drag samples. Tests may pass explicit load metrics.
  MakeItRain.prototype.release = function (point) {
    point = point || {};
    var T = this.T;

    if (this.ended) return this.outcome('invalid', { reason: 'ended' });

    var hasDrag = !!this.drag;
    if (!hasDrag && point.bills == null) return this.outcome('invalid', { reason: 'no-drag' });

    var d = this.drag || {
      startX: 0, startY: 0, lastX: 0, lastY: 0,
      startT: this.nowMs, lastT: this.nowMs,
      maxDistance: 0, totalPath: 0, reversals: 0, samples: 0
    };
    var t = num(point.t, this.nowMs);
    this.nowMs = Math.max(this.nowMs, t);

    var endX = num(point.x, d.lastX), endY = num(point.y, d.lastY);
    // Do NOT sanitize an explicitly provided non-finite velocity into a real flick.
    var vx = (point.vx != null) ? point.vx : (endX - d.lastX);
    var vy = (point.vy != null) ? point.vy : (endY - d.lastY);
    var loadDurationMs = num(point.loadDurationMs, d.lastT - d.startT);
    var smoothness = (point.smoothness != null) ? point.smoothness : this.smoothnessOf(d);

    var bills = (point.bills != null) ? point.bills : this.billsForDistance(d.maxDistance);
    bills = clamp(Math.floor(num(bills, 0)), 0, T.stack.maxBills);

    this.drag = null;

    // --- invalid / cancel guards (no consumption) ---
    if (!isFinite(vx) || !isFinite(vy) || !isFinite(bills)) return this.outcome('invalid', { reason: 'bad-velocity', bills: 0 });
    if (bills < T.stack.minBills) return this.outcome('invalid', { reason: 'no-bills', bills: bills });
    if (this.availableBills <= 0) return this.outcome('invalid', { reason: 'out-of-cash', bills: bills });

    var speed = hypot(vx, vy);
    var up = -vy;
    var upwardShare = speed > 0 ? (up / speed) : -1;
    if (up <= 0 || upwardShare < T.aim.minUpward || speed < T.aim.minSpeed) {
      return this.outcome('invalid', { reason: 'not-a-flick', bills: bills, speed: speed });
    }

    // Never throw more bills than the stack still holds.
    if (bills > this.availableBills) bills = this.availableBills;

    // --- consume immediately (source: every flick consumes the selected bills) ---
    var dollars = bills * T.stack.billValue;
    this.cash = Math.max(0, this.cash - dollars);
    this.spent += dollars;
    this.availableBills = Math.floor(this.cash / T.stack.billValue);
    this.flicks += 1;

    // --- aim + target resolution ---
    var ratio = vx / Math.max(up, 1e-6);
    var landingX = clamp(0.5 + ratio * T.aim.aimSpread, 0, 1);
    var targetX = this.targetX(t);
    var active = this.spotlightActive(t);
    var fan = bills >= T.fan.minBills &&
      loadDurationMs >= T.fan.minDurationMs &&
      smoothness >= T.fan.minSmoothness;
    var tolerance = T.target.radius + (fan ? T.fan.radiusBonus : 0);
    var hit = active && Math.abs(landingX - targetX) <= tolerance;
    var beat = this.beatAt(t);

    var kind = hit ? 'hit' : (active ? 'miss' : 'overthrow');
    var result = {
      kind: kind,
      bills: bills,
      dollars: dollars,
      landingX: landingX,
      targetX: targetX,
      active: active,
      onBeat: beat.onBeat,
      perfect: beat.perfect,
      fan: fan,
      smoothness: smoothness,
      loadDurationMs: loadDurationMs,
      speed: speed,
      beat: beat,
      multiplier: 1,
      streak: this.streak,
      hypeGained: 0,
      crowd: this.crowd,
      reason: null
    };

    if (hit) {
      this.hits += 1;
      var mult = 1;
      if (beat.onBeat) mult *= T.hype.onBeat;
      mult *= T.hype.spotlight;
      if (fan) mult *= (1 + T.fan.hypeBonus);

      var goodForStreak = T.streak.goodRequires === 'onBeat' ? beat.onBeat : true;
      if (goodForStreak) {
        this.streak += 1;
        if (this.streak > this.bestStreak) this.bestStreak = this.streak;
      }
      var streakMult = this.streakMultiplier(this.streak);
      mult *= streakMult;

      var crowdGain = T.hype.crowdGainGood + (fan ? T.fan.crowdBonus : 0);
      this.crowd = clamp(this.crowd + crowdGain, 0, T.hype.crowdMax);
      var crowdMult = 1 + this.crowd * T.hype.crowdHypeScale;

      var base = bills * T.hype.perBill + T.hype.perFlick;
      var jitter = T.hype.jitter > 0 ? (1 + (this.rng() * 2 - 1) * T.hype.jitter) : 1;
      var gained = base * mult * crowdMult * jitter;
      this.hype += gained;

      result.multiplier = mult;
      result.crowd = this.crowd;
      result.crowdMultiplier = crowdMult;
      result.streak = this.streak;
      result.streakMultiplier = streakMult;
      result.hypeGained = gained;
    } else {
      this.streak = num(T.streak.decayOnMiss, 0);
      this.waste += dollars;
      if (kind === 'overthrow') this.overthrows += 1; else this.misses += 1;
      result.streak = this.streak;
    }

    this.phase = 'idle';
    this.lastOutcome = result;
    this.history.push({
      kind: kind, bills: bills, dollars: dollars, t: t,
      targetX: targetX, landingX: landingX, active: active,
      onBeat: beat.onBeat, fan: fan, hype: result.hypeGained
    });
    return result;
  };

  MakeItRain.prototype.streakMultiplier = function (streak) {
    var T = this.T;
    if (streak <= 1) return 1;
    return Math.min(T.streak.max, 1 + (streak - 1) * T.streak.step);
  };

  MakeItRain.prototype.outcome = function (kind, extra) {
    // Invalid/cancel paths never consume bills but are still reported.
    if (kind === 'invalid') { this.invalid += 1; this.drag = null; if (!this.ended) this.phase = 'idle'; }
    var result = { kind: kind, bills: 0, dollars: 0, multiplier: 1, hypeGained: 0, streak: this.streak, reason: null };
    if (extra) for (var key in extra) if (Object.prototype.hasOwnProperty.call(extra, key)) result[key] = extra[key];
    this.lastOutcome = result;
    return result;
  };

  // ---------------------------------------------------------------- results
  MakeItRain.prototype.rainScore = function () {
    var T = this.T;
    return Math.round((this.hype / Math.max(1, this.spent)) * T.score.scale);
  };

  MakeItRain.prototype.endRound = function () {
    if (!this.ended) {
      this.ended = true;
      this.phase = 'ended';
      if (this.drag) this.drag = null;
    }
    return this.summary();
  };

  MakeItRain.prototype.summary = function () {
    return {
      budget: this.budget,
      spent: this.spent,
      waste: this.waste,
      cash: this.cash,
      hype: this.hype,
      crowd: this.crowd,
      bestStreak: this.bestStreak,
      streak: this.streak,
      flicks: this.flicks,
      hits: this.hits,
      misses: this.misses,
      overthrows: this.overthrows,
      invalid: this.invalid,
      rainScore: this.rainScore(),
      ended: this.ended
    };
  };

  MakeItRain.prototype.state = function () {
    var T = this.T;
    var drag = this.drag;
    return {
      phase: this.phase,
      ended: this.ended,
      nowMs: this.nowMs,
      roundDurationMs: T.round.durationMs,
      timeLeftMs: Math.max(0, T.round.durationMs - this.nowMs),
      cash: this.cash,
      budget: this.budget,
      spent: this.spent,
      waste: this.waste,
      availableBills: this.availableBills,
      hype: this.hype,
      crowd: this.crowd,
      streak: this.streak,
      bestStreak: this.bestStreak,
      flicks: this.flicks,
      hits: this.hits,
      misses: this.misses,
      overthrows: this.overthrows,
      invalid: this.invalid,
      beat: this.beatAt(this.nowMs),
      target: { x: this.targetX(this.nowMs), active: this.spotlightActive(this.nowMs) },
      load: drag ? {
        bills: this.billsForDistance(drag.maxDistance),
        smoothness: this.smoothnessOf(drag),
        durationMs: drag.lastT - drag.startT,
        distance: drag.maxDistance
      } : null
    };
  };

  var api = {
    version: CORE_VERSION,
    MakeItRain: MakeItRain,
    create: function (options) { return new MakeItRain(options); },
    makeRng: makeRng,
    clamp: clamp
  };

  global.RAMakeItRainCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
