// RAINMAKER / MAKE IT RAIN — SANDBOX TUNABLES (F06-A, OL-011 PARALLEL_SAFE Wave 0)
// Fragment: UBE_PORTAL_FRAGMENT_RAINMAKER_MAKE_IT_RAIN_SANDBOX
//
// SINGLE SOURCE OF TUNING. Every discretionary numeric value used by the sandbox lives here.
// The authored OPEN RAINMAKER source defines BEHAVIOR (stack/flick/target/beat/hype/crowd/waste);
// it does not define exact timings/physics. Those "intentionally open" values are centralized below
// and logged in the fragment return packet so Ube's feel gate can tune them in one place.
//
// Load order (sandbox page): tunables -> core -> adapter.
// No DOM here. No shared registration. No persistence.
(function (global) {
  'use strict';

  var defaults = {
    version: 1,

    // ---- ROUND ----
    round: {
      durationMs: 30000,          // 30-second sandbox result (source: sandbox spec)
      defaultBudget: 10000,       // dollars
      budgetPresets: [5000, 10000, 25000]
    },

    // ---- BEAT ----
    beat: {
      bpm: 120,                   // sandbox pulse tempo (source leaves BPM open)
      windowMs: 110,              // ON BEAT tolerance around each beat
      perfectWindowMs: 50,        // PERFECT sub-window (feedback only)
      pulseMs: 150                // beat indicator animation length
    },

    // ---- STACK ----
    stack: {
      minBills: 1,                // source: loaded amount range 1-20
      maxBills: 20,
      loadDistancePerBill: 0.030, // normalized drag distance that adds one bill
      reversalPenalty: 0.34,      // smoothness penalty per >90deg thumb reversal
      billValue: 100              // dollars per bill (existing RA cash scale)
    },

    // ---- FAN ("load 10+ bills with a long smooth thumb action") ----
    fan: {
      minBills: 10,
      minDurationMs: 500,
      minSmoothness: 0.60,
      radiusBonus: 0.05,          // wider fan -> larger landing tolerance
      crowdBonus: 6,              // CROWD bonus
      hypeBonus: 0.25             // larger visual/hype
    },

    // ---- TARGET (neutral silhouette; no identity) ----
    target: {
      radius: 0.13,               // normalized half-width hit tolerance
      driftAmplitude: 0.20,       // horizontal drift so aim direction matters
      driftPeriodMs: 4200,
      driftPhase: 0,
      spotlightPeriodMs: 2600,    // active/inactive spotlight cycle
      spotlightOnMs: 1050,        // "active spotlight/target moment"
      spotlightOffsetMs: 0
    },

    // ---- AIM / FLICK PHYSICS ----
    aim: {
      aimSpread: 0.80,            // horizontal drift per unit of upward flick
      minUpward: 0.20,            // minimum upward share of the flick vector
      minSpeed: 0.0009,           // normalized units/ms; below this it is a cancel
      maxSpeed: 0.020,            // clamp for arc scaling
      arcSpeedScale: 0.40         // source: flick speed determines arc (visual)
    },

    // ---- HYPE / CROWD / SCORE ----
    hype: {
      perBill: 10,                // base hype per bill
      perFlick: 5,                // base hype per valid flick
      onBeat: 1.5,                // ON BEAT multiplier (source: x1.5)
      spotlight: 2.0,             // SPOTLIGHT multiplier (source: x2)
      crowdStart: 0,
      crowdMax: 100,
      crowdGainGood: 3,
      crowdDecayPerMs: 0.0015,    // CROWD meter decay over time
      crowdHypeScale: 0.004,      // +fraction of hype per crowd point
      stormThreshold: 80,         // CROWD STORM visual threshold
      jitter: 0                   // 0 = fully deterministic; >0 uses seeded rng
    },

    // ---- STREAK (consecutive good flicks, up to x5) ----
    streak: {
      step: 0.35,                 // multiplier gained per consecutive good flick
      max: 5,                     // source: combo multiplier up to x5
      decayOnMiss: 0,             // reset value on a bad flick
      goodRequires: 'spotlight'   // 'spotlight' | 'onBeat' | 'either'
    },

    // ---- SCORE ----
    score: {
      scale: 100                  // RAIN SCORE = hype per dollar spent, displayed * scale
    },

    // ---- VISUAL FEEDBACK TIMING (adapter only) ----
    feedback: {
      billFlyMs: 520,
      hitPopMs: 260,
      missFadeMs: 480,
      shakeMs: 180,
      resultFadeMs: 320
    },

    // ---- VISUAL (grey-box / DEVELOPMENT PLACEHOLDER palette) ----
    visual: {
      stage: '#15151c',
      floor: '#23232c',
      rail: '#2f2f3a',
      stack: '#d8c48a',
      stackEdge: '#8f7b48',
      bill: '#8fd07a',
      billEdge: '#4f8f45',
      target: '#8a8f9c',
      targetEdge: '#5b606c',
      spotlightOn: '#ffd76a',
      spotlightOff: '#3a3f4a',
      beat: '#7ad6ff',
      hype: '#ff5fa2',
      crowd: '#7ad6ff',
      waste: '#e05a5a',
      text: '#f2ede2',
      dim: '#8b8fa0'
    },

    // ---- DIAGNOSTICS (optional; prototype only, never shipped state) ----
    diagnostics: {
      persist: false,
      storageKey: 'ra.make_it_rain.sandbox.diag'
    }
  };

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === 'object') {
      var out = {};
      for (var key in value) if (Object.prototype.hasOwnProperty.call(value, key)) out[key] = clone(value[key]);
      return out;
    }
    return value;
  }

  // Deep-merge overrides over defaults (used by tests + the debug panel).
  function merge(base, overrides) {
    var out = clone(base || defaults);
    if (!overrides) return out;
    for (var key in overrides) {
      if (!Object.prototype.hasOwnProperty.call(overrides, key)) continue;
      var value = overrides[key];
      if (value && typeof value === 'object' && !Array.isArray(value) &&
          out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
        out[key] = merge(out[key], value);
      } else {
        out[key] = clone(value);
      }
    }
    return out;
  }

  var api = {
    version: defaults.version,
    defaults: defaults,
    clone: clone,
    merge: merge,
    // Convenience: fresh full preset (budget in dollars, or a preset index).
    budget: function (which) {
      if (typeof which === 'number') return which;
      var idx = { '5k': 0, '10k': 1, '25k': 2 }[String(which)] || 1;
      return defaults.round.budgetPresets[idx];
    }
  };

  global.RAMakeItRainTunables = api;
})(typeof window !== 'undefined' ? window : globalThis);
