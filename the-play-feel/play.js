// THE PLAY — FEEL MVP. Rough on purpose. Scripted outcomes, placeholder staging. Reuses F01 faces (procedural SVG) + BTF sprites.
import {face, crate} from './faces.mjs';

const Q = new URLSearchParams(location.search);
const SPEED = +Q.get('speed') || 1;          // ?speed=4 for fast testing
const FORCE = (Q.get('fate') || '').toUpperCase();   // ?fate=A|B|C
const AUTO = Q.get('choice');                // ?choice=out|keep  (skips the decision prompt)
const AS = './assets/';
const BTF = AS;
const GUNS = AS + 'gun/E-gun-';

// ---------------------------------------------------------------- data
const WEAPONS = [
  {id: 'SHOTGUN', type: 'SHOTGUN', nick: 'Sapporo Shotgun', img: GUNS + 'sapporo_shotgun-held.png', pow: 3, sfx: 'GUN_SHOTGUN'},
  {id: 'PISTOL', type: 'PISTOL', nick: 'Lil Oga', img: GUNS + 'lil_oga-held.png', pow: 2, sfx: 'GUN_LILOGA'},
  {id: 'SNIPER', type: 'SNIPER', nick: 'Chopstick Sniper', img: GUNS + 'chopstick_sniper-held.png', pow: 3, sfx: 'GUN_SNIPER'},
  {id: 'RPG', type: 'RPG', nick: 'The RPG', img: GUNS + 'the_rpg-held.png', pow: 4, sfx: 'GUN_RPG'},
  {id: 'HANDS', type: 'BARE HANDS', nick: '', img: null, pow: 0, sfx: 'HIT_HEAVY'}
];
const W = id => WEAPONS.find(w => w.id === id);
const OGAS0 = [
  {id: 'tunde', name: 'TUNDE', cls: 'MUSCLE', w: 'SHOTGUN'},
  {id: 'dre', name: 'DRE', cls: 'TALKER', w: 'PISTOL'},
  {id: 'young_mazi', name: 'MAZI', cls: 'WHEELS', w: 'PISTOL'},
  {id: 'half_pint', name: 'HALF-PINT', cls: 'GHOST', w: 'PISTOL'},
  {id: 'sunday_best', name: 'SUNDAY BEST', cls: 'SHOOTER', w: 'SNIPER'}
];
const RECRUIT_NAMES = ['BAYO', 'KELE', 'OBI', 'FEMI', 'SEUN', 'TITI', 'DAPO', 'EMEKA'];
let recruitN = 0;
const CARS = {
  SUPRA: {name: 'SUPRA', kind: 'img', src: AS + 'supra_mk4_world.png'},
  HOOPTIE: {name: 'HOOPTIE', kind: 'svg'}
};
const HOOPTIE_SVG = `<svg viewBox="0 0 136 50" shape-rendering="crispEdges"><rect x="6" y="22" width="124" height="16" rx="3" fill="#b79a63" stroke="#120c1c" stroke-width="2"/><path d="M30 22 L42 8 H92 L106 22Z" fill="#a08650" stroke="#120c1c" stroke-width="2"/><path d="M45 11 H63 V22 H35Z M67 11 H90 L101 22 H67Z" fill="#37d5e8" opacity=".8"/><rect x="2" y="26" width="6" height="7" fill="#fff7c2"/><rect x="128" y="26" width="6" height="6" fill="#ff3b4d"/><circle cx="60" cy="30" r="4" fill="#8a3a1a" opacity=".7"/><rect x="82" y="26" width="12" height="4" fill="#8a3a1a" opacity=".6"/><g fill="#0b0b12"><circle cx="32" cy="38" r="8"/><circle cx="106" cy="38" r="8"/></g><g fill="#777"><circle cx="32" cy="38" r="3.5"/><circle cx="106" cy="38" r="3.5"/></g></svg>`;

const G = {   // persistent-in-tab state
  bank: 0,
  roster: OGAS0.map(o => ({...o})),
  crew: [0, 1, 2],   // roster ids currently sent (ids)
  car: 'SUPRA',
  carsLost: {},
  plays: 0
};
G.crew = ['tunde', 'dre', 'young_mazi'];

const PLAY = {name: 'MUSEUM RUN', cash: '$80K', min: 3, caller: 'UNCLE GBENGA', place: 'CITY MUSEUM'};

// ---------------------------------------------------------------- tiny engine
const stage = document.getElementById('stage');
const world = document.getElementById('world');
const fadeEl = document.getElementById('fade');
const sleep = ms => new Promise(r => setTimeout(r, ms / SPEED));
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const money = n => '$' + Math.round(n).toLocaleString('en-US');

function fit() {
  const s = Math.min(innerWidth / 270, innerHeight / 480);
  stage.style.transform = `scale(${s})`;
  stage.style.left = (innerWidth - 270 * s) / 2 + 'px';
  stage.style.top = (innerHeight - 480 * s) / 2 + 'px';
}
addEventListener('resize', fit); fit();

function el(cls, html, parent, css) {
  const d = document.createElement('div');
  if (cls) d.className = cls;
  if (html != null) d.innerHTML = html;
  if (css) Object.assign(d.style, css);
  (parent || world).appendChild(d);
  return d;
}
function pos(e, x, y, w, h) {
  e.style.left = x + 'px'; e.style.top = y + 'px';
  if (w != null) e.style.width = w + 'px';
  if (h != null) e.style.height = h + 'px';
  return e;
}
function anim(e, kf, ms, o = {}) {
  const a = e.animate(kf, {duration: ms / SPEED, fill: 'forwards', easing: 'ease-in-out', ...o});
  return a.finished.catch(() => {});
}
const fadeTo = (v, ms) => anim(fadeEl, [{opacity: +getComputedStyle(fadeEl).opacity}, {opacity: v}], ms, {easing: 'linear'}).then(() => { fadeEl.style.opacity = v; });
function clear() { world.innerHTML = ''; }
function bg(name, filter) {
  const i = document.createElement('img');
  i.className = 'bg'; i.src = BTF + 'env/' + name.split('/').pop();
  if (filter) i.style.filter = filter;
  world.appendChild(i); return i;
}
const BG_STREET = 'street_night/street_night_270x480.png';
const BG_ROOM = 'portobello_bedroom/portobello_beige_bedroom_270x480.png';
const BG_MUSEUM = 'castle_exterior/castle_exterior_night_270x480.png';

// ---------------------------------------------------------------- audio (all synthesized, plus existing combat sfx)
let AC = null;
function ac() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) {} return AC; }
function tone(f, d, type = 'square', v = .05, slideTo) {
  const c = ac(); if (!c) return;
  try {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .02);
  } catch (e) {}
}
const buzz = () => { tone(110, .22, 'sawtooth', .09); setTimeout(() => tone(110, .22, 'sawtooth', .09), 260); };
const notif = () => { tone(880, .08, 'sine', .06); setTimeout(() => tone(1320, .12, 'sine', .05), 90); };
const tick = () => tone(2000 + Math.random() * 300, .025, 'square', .025);
const thud = () => tone(120, .18, 'sine', .25, 40);
const engine = (d = 1.6) => tone(55, d, 'sawtooth', .07, 150);
const heartbeat = () => { tone(55, .12, 'sine', .3, 35); setTimeout(() => tone(50, .14, 'sine', .22, 32), 170); };
function sfx(name, vol = .35) {
  try { const a = new Audio(AS + 'sfx/' + name + '.mp3'); a.volume = vol; a.play().catch(() => {}); } catch (e) {}
}

// ---------------------------------------------------------------- shared builders
const ogaById = id => G.roster.find(o => o.id === id);
const crewObjs = () => G.crew.map(ogaById);
const firstName = o => o.name.split(' ')[0];

function bust(o, size = 34, st = {}) {
  const b = el('bust', face({id: o.id, name: o.name, cls: o.cls}, st));
  b.style.width = b.style.height = size + 'px';
  if (o.w && W(o.w).img && !st.noGun) {
    const g = document.createElement('img'); g.className = 'wp'; g.src = W(o.w).img;
    g.style.width = size * .85 + 'px'; g.style.height = size * .42 + 'px';
    g.style.left = size * .42 + 'px'; g.style.top = size * .62 + 'px';
    b.appendChild(g);
  }
  return b;
}
function makeCar(id, x, y) {
  const c = CARS[id];
  const car = el('car', '', null, {left: x + 'px', top: y + 'px'});
  const body = el('body', c.kind === 'img' ? `<img src="${c.src}">` : HOOPTIE_SVG, car);
  el('hl', '', car);
  car._sh = el('shadow', '', world, {left: x + 6 + 'px', top: y + 44 + 'px', width: '124px', height: '10px'});
  car.moveTo = (nx) => { car._sh.style.left = nx + 6 + 'px'; };
  return car;
}
function puffs(car, n = 6) {
  const x = parseFloat(car.style.left) - 2 + (car._dx || 0), y = parseFloat(car.style.top) + 36;
  for (let i = 0; i < n; i++) {
    const p = el('puff', '', null, {left: x + 'px', top: y + 'px'});
    setTimeout(() => anim(p, [{transform: 'translate(0,0) scale(.6)', opacity: .7}, {transform: `translate(${-rnd(10, 30)}px,${-rnd(4, 16)}px) scale(2.2)`, opacity: 0}], 900).then(() => p.remove()), i * 90 / SPEED);
  }
}
// drive the car element (and its shadow) from its current left to `to`
async function drive(car, to, ms, easing) {
  const from = parseFloat(car.style.left);
  const a1 = anim(car, [{left: from + 'px'}, {left: to + 'px'}], ms, {easing});
  const a2 = anim(car._sh, [{left: from + 6 + 'px'}, {left: to + 6 + 'px'}], ms, {easing});
  await Promise.all([a1, a2]);
  car.style.left = to + 'px';
}

// ---------------------------------------------------------------- SCENE 0: title (unlocks audio)
async function title() {
  clear();
  const t = el('title', '<h1>THE PLAY</h1><p>TAP TO START</p>');
  await new Promise(r => t.addEventListener('click', r, {once: true}));
  ac(); buzz();
  await fadeTo(1, 500);
}

// ---------------------------------------------------------------- SCENE 1: the phone rings
async function phoneScene(again) {
  clear(); ensureRoster();
  bg(BG_ROOM, 'brightness(.5) saturate(.8)');
  el('dim');
  el('bank', 'BANK ' + money(G.bank));
  const rich = el('rich', '', null, {left: '110px', top: '300px', transform: 'scale(1.5)'});
  await fadeTo(0, 700);
  await sleep(again ? 900 : 1500);
  let choice = null;
  while (choice !== 'answer') {
    const call = el('call', `<div class="who">${PLAY.caller}</div><div class="ring">INCOMING CALL</div>
      <div class="pname">${PLAY.name}</div><div class="cash">${PLAY.cash}</div><div class="min">${PLAY.min} OGA MIN.</div>
      <div class="btns"><button class="b-ans">Answer</button><button class="b-dec">Decline</button></div>`);
    anim(call, [{transform: 'translateY(420px)'}, {transform: 'translateY(0)'}], 350, {easing: 'ease-out'});
    setTimeout(() => call.classList.add('buzzing'), 400 / SPEED);
    const ring = setInterval(buzz, 1300 / SPEED); buzz();
    choice = await new Promise(r => {
      call.querySelector('.b-ans').onclick = () => r('answer');
      call.querySelector('.b-dec').onclick = () => r('decline');
    });
    clearInterval(ring);
    call.classList.remove('buzzing');
    if (choice === 'decline') {
      await anim(call, [{transform: 'translateY(0)'}, {transform: 'translateY(480px)'}], 300);
      call.remove();
      await sleep(2200);           // he calls back
    } else { tone(660, .1, 'sine', .08); await sleep(250); }
  }
  await fadeTo(1, 500);
}

// ---------------------------------------------------------------- SCENE 2: the alley — who, with what, in which car
function ensureRoster() {
  G.roster = G.roster.filter(o => !o.dead);
  while (G.roster.length < 3) {
    const n = RECRUIT_NAMES[recruitN++ % RECRUIT_NAMES.length];
    G.roster.push({id: 'r_' + n.toLowerCase() + recruitN, name: n, cls: pick(['MUSCLE', 'SHOOTER', 'GHOST', 'TALKER']), w: 'PISTOL'});
  }
  G.crew = G.crew.filter(id => ogaById(id));
  for (const o of G.roster) { if (G.crew.length >= 3) break; if (!G.crew.includes(o.id)) G.crew.push(o.id); }
  if (G.carsLost[G.car]) G.car = availableCars()[0];
}
const availableCars = () => Object.keys(CARS).filter(c => c === 'HOOPTIE' || !G.carsLost[c]);

async function prepScene() {
  clear();
  bg(BG_STREET);
  const car = makeCar(G.car, 6, 316);
  car.style.transform = '';
  el('grad');
  const top = el('pre-top', `<div class="n">${PLAY.name}</div><div class="m">${PLAY.cash} · ${PLAY.min} OGA MIN.</div>`);
  const carpick = el('carpick', '', null, {left: '30px', top: '290px'});
  const drawCarpick = () => { carpick.textContent = '◂ ' + CARS[G.car].name + ' ▸'; };
  drawCarpick();
  carpick.onclick = car.onclick = () => {
    const l = availableCars(); if (l.length < 2) return;
    G.car = l[(l.indexOf(G.car) + 1) % l.length];
    car.querySelector('.body').innerHTML = CARS[G.car].kind === 'img' ? `<img src="${CARS[G.car].src}">` : HOOPTIE_SVG;
    drawCarpick(); tone(300, .06, 'square', .05);
  };
  car.style.cursor = 'pointer';

  const cardsWrap = el('', '', null, {position: 'absolute', inset: 0, pointerEvents: 'none'});
  const draw = () => {
    cardsWrap.innerHTML = '';
    crewObjs().forEach((o, i) => {
      const c = el('card', '', cardsWrap, {left: 5 + i * 88 + 'px', top: '366px', pointerEvents: 'auto'});
      const fc = el('fc', face({id: o.id, name: o.name, cls: o.cls}), c);
      el('nm', o.name, c);
      const sw = el('sw', '⇄', c); sw.title = 'swap Oga';
      const w = W(o.w);
      const ws = el('wslot', (w.img ? `<img src="${w.img}">` : `<span class="hands">✊</span>`) +
        `<div><span class="wt">${w.type}</span>${w.nick ? `<span class="wn">"${w.nick}"</span>` : ''}</div>`, c);
      ws.onclick = () => { o.w = WEAPONS[(WEAPONS.findIndex(x => x.id === o.w) + 1) % WEAPONS.length].id; tone(500, .05, 'square', .05); draw(); };
      sw.onclick = e => { e.stopPropagation(); openBench(i, c); };
    });
  };
  let benchEl = null;
  const openBench = (i, card) => {
    if (benchEl) { benchEl.remove(); benchEl = null; }
    const bench = G.roster.filter(o => !G.crew.includes(o.id));
    if (!bench.length) return;
    benchEl = el('bench', '', null, {left: '8px', top: '300px'});
    bench.forEach(o => {
      const b = el('bi', `<div class="f">${face({id: o.id, name: o.name, cls: o.cls})}</div>${o.name}<br><span style="color:#9aa0b8">${W(o.w).type}</span>`, benchEl);
      b.onclick = () => { G.crew[i] = o.id; benchEl.remove(); benchEl = null; tone(400, .06, 'square', .05); draw(); };
    });
    tone(350, .05, 'square', .04);
  };
  draw();
  const btn = document.createElement('button'); btn.className = 'send'; btn.textContent = "SEND 'EM";
  world.appendChild(btn);
  await fadeTo(0, 700);
  await new Promise(r => { btn.onclick = r; });
  if (benchEl) benchEl.remove();
  tone(200, .12, 'square', .08); thud();
  return {car, cardsWrap, top, carpick, btn};
}

// ---------------------------------------------------------------- SCENE 3: departure
async function departScene(p) {
  const {car, cardsWrap, top, carpick, btn} = p;
  await Promise.all([anim(cardsWrap, [{opacity: 1}, {opacity: 0}], 400), anim(btn, [{opacity: 1}, {opacity: 0}], 300), anim(top, [{opacity: 1}, {opacity: 0}], 400), anim(carpick, [{opacity: 1}, {opacity: 0}], 300), anim(world.querySelector('.grad'), [{opacity: 1}, {opacity: 0}], 500)]);
  cardsWrap.remove(); btn.remove(); top.remove(); carpick.remove(); world.querySelector('.grad').remove();
  const crew = crewObjs();
  // crew walk up from the pavement to the car's doors, then climb in one at a time
  const busts = crew.map((o, i) => {
    const b = bust(o, 34);
    pos(b, 30 + i * 32, 420);
    return b;
  });
  await Promise.all(busts.map((b, i) => anim(b, [{top: '405px'}, {top: '340px'}], 700 + i * 150, {easing: 'ease-out'})));
  await sleep(500);
  for (let i = 0; i < busts.length; i++) {
    const b = busts[i]; thud();
    await anim(b, [{transform: 'translate(0,0) scale(1)', opacity: 1}, {transform: `translate(${60 + i * 6 - parseFloat(b.style.left) + 30}px,-14px) scale(.35)`, opacity: 0}], 420, {easing: 'ease-in'});
    b.remove();
    anim(car, [{transform: 'translateY(0)'}, {transform: 'translateY(2px)'}, {transform: 'translateY(0)'}], 200);
    await sleep(160);
  }
  await sleep(450);
  car.classList.add('on'); engine(1.8);
  // rumble
  const rumble = car.animate([{transform: 'translate(0,0)'}, {transform: 'translate(1px,1px)'}, {transform: 'translate(-1px,0)'}, {transform: 'translate(0,0)'}], {duration: 90 / SPEED, iterations: 14});
  await sleep(1300);
  puffs(car, 8);
  await sleep(500);
  rumble.cancel();
  drive(car, 300, 1500, 'cubic-bezier(.6,0,.9,.5)');
  puffs(car, 6);
  await sleep(300); tone(90, 1.2, 'sawtooth', .08, 260);
  await sleep(1300);
  await fadeTo(1, 500);
}

// ---------------------------------------------------------------- SCENE 4: arrival at the target
async function arriveScene() {
  clear();
  bg(BG_MUSEUM);
  const car = makeCar(G.car, -150, 330);
  car.classList.add('on');
  el('cap', PLAY.place + ' · 11:47 PM', null, {top: '16px'});
  await fadeTo(0, 700);
  tone(70, 1.3, 'sawtooth', .06, 45);
  drive(car, 128, 1500, 'cubic-bezier(.1,.7,.3,1)');
  await sleep(1200);
  puffs(car, 4);
  await sleep(700);
  car.classList.remove('on');
  thud();
  await sleep(400);
  const crew = crewObjs();
  for (let i = 0; i < crew.length; i++) {
    const b = bust(crew[i], 30);
    pos(b, 172 - i * 4, 322);
    await anim(b, [{top: '322px', opacity: 0}, {top: '328px', opacity: 1}], 250);
    await anim(b, [{left: 172 - i * 4 + 'px', top: '328px', transform: 'scale(1)', opacity: 1}, {left: 138 + i * 3 + 'px', top: '270px', transform: 'scale(.55)', opacity: 1}], 900, {easing: 'ease-in'});
    await anim(b, [{opacity: 1}, {opacity: 0}], 240);
    b.remove();
    await sleep(120);
  }
  await sleep(900);
  await fadeTo(1, 700);
}

// ---------------------------------------------------------------- outcome plan
function planFate() {
  const crew = crewObjs();
  const power = crew.reduce((s, o) => s + W(o.w).pow, 0);
  const pC = Math.max(.1, Math.min(.5, .4 - power * .03));
  const pA = (1 - pC) * Math.min(.7, .3 + power * .04);
  const r = Math.random();
  let fate = r < pC ? 'C' : r < pC + pA ? 'A' : 'B';
  if (FORCE === 'A' || FORCE === 'B' || FORCE === 'C') fate = FORCE;
  return fate;
}

// ---------------------------------------------------------------- SCENE 5: live phone
async function liveScene(fate) {
  clear();
  const crew = crewObjs();
  const [L, S, T] = crew;          // lead / second / third
  bg(BG_ROOM, 'brightness(.35) saturate(.5)');
  const wash = el('redwash');
  el('vig');
  const rich = el('rich', '', null, {left: '6px', top: '340px', transform: 'scale(1.2) scaleX(-1)', filter: 'brightness(.55)'});
  const flash = el('flash');
  const phone = el('phone', `<div class="ph-head">${crew.map(o => `<div class="av">${face({id: o.id, name: o.name, cls: o.cls})}</div>`).join('')}<span class="t">THE PLAY</span><span class="s">LIVE</span></div>`);
  const msgs = el('msgs', '', phone);
  let alive = true;
  const beat = setInterval(() => { if (alive) heartbeat(); }, 1300 / SPEED);
  await fadeTo(0, 900);
  await sleep(1500);

  const fade = () => { [...msgs.children].reverse().forEach((c, i) => { c.style.opacity = i < 4 ? 1 : Math.max(.15, 1 - (i - 3) * .28); }); };
  const vib = () => { phone.classList.remove('vib'); void phone.offsetWidth; phone.classList.add('vib'); };
  const say = async (o, text, after = 1800) => {
    const b = el('bub', `<span class="fr" style="color:${'#' + ({MUSCLE: 'e0603a', SHOOTER: 'e8c14a', WHEELS: '3fd0e0', TALKER: 'b07ae8', GHOST: '7f8cff'}[o.cls] || '9aa0b8')}">${o.name}</span>${text}`, msgs);
    fade(); vib(); notif(); await sleep(after);
  };
  const me = async (text, after = 1200) => { el('bub me', text, msgs); fade(); tone(700, .05, 'sine', .04); await sleep(after); };
  const type = async (o, ms) => {
    const b = el('bub typing', `<span class="fr" style="color:#9aa0b8">${o.name}</span><span class="dots"><span></span><span></span><span></span></span>`, msgs);
    fade(); await sleep(ms); b.remove(); fade();
  };
  const shots = async (n, gap = 260) => {
    for (let i = 0; i < n; i++) {
      const w = W(pick(crew).w);
      sfx(w.sfx === 'HIT_HEAVY' ? 'GUN_LILOGA' : w.sfx, .28);
      anim(flash, [{opacity: .55}, {opacity: 0}], 220, {easing: 'ease-out'});
      vib(); await sleep(gap + rnd(0, 180));
    }
  };
  const wait = ms => sleep(ms);

  // ---- shared opening
  await say(L, 'WE IN.', 2600);
  await say(S, 'BACK DOOR OPEN.', 3000);
  await type(T, 2400);
  await wait(1200);
  await say(L, 'CAMERAS DOWN.', 3400);
  await say(T, 'TWO IN THE HALL.', 2200);
  await say(L, "FLOOR'S LIVE. VAULT'S RIGHT THERE. YOUR CALL.", 800);

  // ---- the one decision (silence = keep going)
  let choice = AUTO;
  if (!choice) {
    msgs.style.paddingBottom = '78px';
    const d = el('decide', `<div class="row"><button class="d-out">GET OUT NOW</button><button class="d-go">KEEP GOING</button></div><div class="bar"><i></i></div>`, phone);
    const bar = d.querySelector('.bar i');
    const timer = bar.animate([{width: '100%'}, {width: '0%'}], {duration: 9000 / SPEED, fill: 'forwards', easing: 'linear'});
    choice = await new Promise(r => {
      d.querySelector('.d-out').onclick = () => r('out');
      d.querySelector('.d-go').onclick = () => r('keep');
      timer.finished.then(() => r('keep')).catch(() => {});
    });
    timer.cancel(); d.remove(); msgs.style.paddingBottom = '';
  }
  await me(choice === 'out' ? 'GET OUT NOW' : 'KEEP GOING', 1600);

  // ---- resolve the real outcome
  let R;
  if (choice === 'out') {
    if (fate === 'C') R = {shape: 'B', survivors: [{o: L, hurt: true}], lost: [S, T], take: ri(21, 30) * 100, bags: 1, loot: [], carBack: true, script: 'out-c'};
    else R = {shape: 'A', survivors: crew.map(o => ({o})), lost: [], take: ri(52, 90) * 100, bags: 2, loot: [{k: 'crate', rar: 'COMMON', label: 'CRATE'}], carBack: true, script: 'out-a'};
  } else if (fate === 'A') R = {shape: 'A', survivors: crew.map(o => ({o})), lost: [], take: ri(150, 210) * 100, bags: 4, loot: [{k: 'gun', label: 'MAC-10'}, {k: 'crate', rar: 'RARE', label: 'RARE CRATE'}, {k: 'blood', label: 'BLOOD X'}], carBack: true, script: 'keep-a'};
  else if (fate === 'B') R = {shape: 'B', survivors: [{o: L}, {o: T, hurt: true}], lost: [S], take: ri(61, 98) * 100, bags: 2, loot: [{k: 'blood', label: 'BLOOD X'}], carBack: true, script: 'keep-b'};
  else R = {shape: 'C', survivors: [], lost: crew, take: 0, bags: 0, loot: [], carBack: false, script: 'keep-c'};

  // ---- scripted second half
  switch (R.script) {
    case 'out-a':
      await say(L, 'SAY LESS.', 3000);
      await say(T, 'MOVING.', 3200);
      await type(S, 2600);
      await say(S, 'GOT WHAT WE CAN CARRY.', 2400);
      await say(L, 'CAR OUT FRONT.', 1800);
      await say(L, 'COMING OUT.', 2400);
      await say(S, 'WE OUT.', 2000);
      break;
    case 'keep-a':
      await say(L, 'COPY.', 3800);
      await type(S, 2800);
      await wait(2200);
      await say(S, "IT'S ALL HERE.", 2200);
      await say(L, 'WE GOT IT.', 1800);
      await say(T, 'CAR OUT FRONT.', 1600);
      await say(L, 'COMING OUT.', 2400);
      await shots(1);
      await wait(1000);
      await say(T, 'GO GO GO', 1800);
      await say(S, 'WE OUT.', 2000);
      break;
    case 'keep-b':
      await say(L, 'COPY.', 3200);
      await shots(3, 220);
      await say(T, "I'M HIT.", 1500);
      await say(L, 'KEEP MOVING KEEP MOVING', 900);
      await shots(4, 240);
      await wait(2600);
      await type(S, 3400);
      await wait(1600);
      await say(L, 'WE GOT IT.', 1800);
      await say(L, 'CAR OUT FRONT.', 2800);
      await shots(2, 400);
      await say(L, `${firstName(S)}?`, 2400);
      await say(L, `${firstName(S)}!!`, 3400);
      await say(T, 'LEAVE HIM. GO.', 1800);
      await say(L, 'COMING OUT. TWO OF US.', 2000);
      break;
    case 'out-c':
      await say(L, 'GOING.', 2200);
      await shots(3, 200);
      await say(T, "I'M HIT.", 1400);
      await shots(3, 220);
      await wait(2600);
      await say(L, `${firstName(S)} DOWN.`, 2000);
      await say(L, `${firstName(T)} DOWN.`, 3200);
      await say(L, 'CAR OUT FRONT.', 2200);
      await say(L, "I'M COMING OUT. ONLY ME.", 2000);
      break;
    case 'keep-c':
      await say(L, 'COPY.', 3000);
      await shots(3, 200);
      await say(T, "I'M HIT.", 1200);
      await say(S, "WE'RE PINNED.", 900);
      await shots(5, 260);
      await wait(2400);
      await type(L, 3800);
      await shots(2, 520);
      await wait(2800);
      await type(L, 2600);
      await wait(1500);
      // silence
      alive = false; clearInterval(beat);
      await wait(7000);
      await me('??', 3500);
      await me('SAY SOMETHING', 2000);
      msgs.appendChild(el('delivered', 'DELIVERED'));
      await wait(6500);
      anim(phone, [{opacity: 1, filter: 'brightness(1)'}, {opacity: .0, filter: 'brightness(.2)'}], 3500);
      anim(wash, [{opacity: 1}, {opacity: .0}], 3500);
      await wait(5000);
      break;
  }
  alive = false; clearInterval(beat);
  await wait(R.shape === 'C' ? 800 : 2200);
  await fadeTo(1, R.shape === 'C' ? 1800 : 900);
  return R;
}

// ---------------------------------------------------------------- SCENE 6: the return / payoff
function duffelSVG(open) {
  return `<svg viewBox="0 0 40 26"><ellipse cx="20" cy="24.5" rx="17" ry="2" fill="#0007"/>
  ${open ? '<rect x="8" y="2" width="9" height="6" fill="#6fd07d" stroke="#2c7a3a" transform="rotate(-8 12 5)"/><rect x="20" y="0" width="10" height="6" fill="#6fd07d" stroke="#2c7a3a" transform="rotate(10 25 3)"/>' : ''}
  <path d="M12 8 Q20 -4 28 8" fill="none" stroke="#222" stroke-width="2.4"/>
  <rect x="3" y="7" width="34" height="16" rx="7" fill="#1f2d24" stroke="#0b120e" stroke-width="1.5"/>
  <path d="M6 12 H34" stroke="#3a4a40" stroke-width="1.5"/><rect x="17" y="10" width="6" height="5" rx="1" fill="#c9a227"/>
  <text x="20" y="20.5" font-size="7" text-anchor="middle" fill="#6fd07d" font-family="monospace" font-weight="700">$</text></svg>`;
}
async function returnScene(R) {
  clear();
  bg(BG_STREET, 'brightness(.9)');
  const rich = el('rich', '', null, {left: '206px', top: '354px', transform: 'scale(1.2)'});
  await fadeTo(0, 900);
  await sleep(1200);

  if (R.shape === 'C') {                 // nobody comes home
    rich.style.transform = 'scale(1.2) scaleX(-1)';
    G.carsLost[G.car] = true;
    G.roster.forEach(o => { if (R.lost.includes(o)) o.dead = true; });
    await sleep(7000);
    return finishAgain();
  }
  // car rolls back in
  const car = makeCar(G.car, -150, 318);
  car.classList.add('on');
  tone(70, 1.3, 'sawtooth', .06, 45);
  await drive(car, 4, 1500, 'cubic-bezier(.1,.7,.3,1)');
  car.classList.remove('on'); puffs(car, 4); thud();
  await sleep(700);
  G.roster.forEach(o => { if (R.lost.includes(o)) o.dead = true; });
  // whoever made it steps out; the missing get a faint empty spot
  const crew = crewObjs();
  const slots = crew.map((o, i) => 150 + i * 36);
  let outs = [];
  for (let i = 0; i < crew.length; i++) {
    const o = crew[i], s = R.survivors.find(x => x.o === o);
    if (!s) { const g = el('', '', null, {position: 'absolute', left: slots[i] + 'px', top: '286px', width: '30px', height: '34px', border: '1px dashed #ffffff33', borderRadius: '50% 50% 4px 4px', opacity: 0}); anim(g, [{opacity: 0}, {opacity: 1}], 900); continue; }
    const b = bust(o, 32, {hurt: !!s.hurt, zone: s.hurt ? 'SHAKY' : 'STEADY'});
    pos(b, 110, 322); b.style.opacity = 0;
    anim(b, [{opacity: 0, left: '110px', top: '322px'}, {opacity: 1, left: slots[i] + 'px', top: '288px'}], 600, {easing: 'ease-out'});
    if (s.hurt) b.style.filter = 'saturate(.7)';
    outs.push(b);
    thud(); await sleep(450);
  }
  await sleep(1200);
  // bags land in front of Rich
  const bagBox = [];
  const n = R.bags;
  const sizes = n >= 4 ? 44 : n >= 2 ? 38 : 30;
  for (let i = 0; i < n; i++) {
    const w = sizes, h = w * 26 / 40;
    const x = 96 + (i % 3) * (w * .8) + (i >= 3 ? w * .4 : 0), y = 404 - (i >= 3 ? h * .8 : 0) + (i % 2) * 4;
    const bag = el('bag', duffelSVG(i === 0 || n >= 4 && i === 2), null, {left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', opacity: 0});
    bagBox.push(bag);
    await anim(bag, [{opacity: 1, transform: 'translateY(-70px)'}, {opacity: 1, transform: 'translateY(0)'}], 360, {easing: 'cubic-bezier(.5,0,1,.6)'});
    thud(); await sleep(220);
  }
  await sleep(900);
  // Rich counts. crude loop: bob + bills flicking.
  const cnt = el('count', '<div class="amt"></div><div class="sub"></div>');
  const amt = cnt.querySelector('.amt'), sub = cnt.querySelector('.sub');
  const bob = rich.animate([{transform: 'scale(1.2) translateY(0) rotate(0)'}, {transform: 'scale(1.2) translateY(3px) rotate(-2deg)'}, {transform: 'scale(1.2) translateY(0) rotate(2deg)'}], {duration: 260 / SPEED, iterations: Infinity});
  let billTimer = setInterval(() => {
    const bx = 130 + rnd(-30, 30), by = 405;
    const b = el('bill', '', null, {left: bx + 'px', top: by + 'px'});
    anim(b, [{transform: 'translate(0,0) rotate(0)', opacity: 1}, {transform: `translate(${rnd(20, 50)}px,${-rnd(35, 70)}px) rotate(${rnd(-120, 120)}deg)`, opacity: 0}], 700, {easing: 'ease-out'}).then(() => b.remove());
    tick();
  }, 110 / SPEED);
  const T = R.take;
  const marks = [.12, .43, .79].map(f => Math.round(T * f / 100) * 100);
  let cur = 0;
  const roll = async (to, ms) => {
    const t0 = performance.now(), from = cur;
    await new Promise(res => {
      const step = () => {
        const p = Math.min(1, (performance.now() - t0) * SPEED / ms);
        cur = Math.round((from + (to - from) * p) / 100) * 100; amt.textContent = money(cur);
        p < 1 ? requestAnimationFrame(step) : res();
      }; step();
    });
  };
  for (const m of marks) {
    await roll(m, 1400);
    clearInterval(billTimer);           // pause the flicking on the "..."
    sub.textContent = '. . .'; await sleep(1100); sub.textContent = '';
    billTimer = setInterval(() => { const b = el('bill', '', null, {left: 130 + rnd(-30, 30) + 'px', top: '405px'}); anim(b, [{transform: 'translate(0,0)', opacity: 1}, {transform: `translate(${rnd(20, 50)}px,${-rnd(35, 70)}px) rotate(${rnd(-120, 120)}deg)`, opacity: 0}], 700).then(() => b.remove()); tick(); }, 110 / SPEED);
  }
  await roll(T, 1200);
  clearInterval(billTimer); bob.cancel();
  amt.classList.add('final'); amt.textContent = 'TAKE: ' + money(T);
  tone(880, .12, 'sine', .08); setTimeout(() => tone(1320, .2, 'sine', .07), 120);
  G.bank += T;
  await sleep(1400);
  // loot, one at a time, physically dropped beside the bags
  const spots = [[118, 338], [172, 334], [222, 336]];
  for (let i = 0; i < R.loot.length; i++) {
    const L = R.loot[i], [x, y] = spots[i] || [40 + i * 30, 420];
    const cols = {COMMON: '#cfd3e6', RARE: '#37d5e8', LEGENDARY: '#ffd23f'};
    let inner, w = 40, h = 40;
    if (L.k === 'gun') { inner = `<img src="${GUNS}holy_baby_drake-held.png" style="width:56px;height:28px;transform:rotate(-14deg)">`; w = 56; h = 28; }
    else if (L.k === 'blood') { inner = `<img src="${AS}gun/E-blood_held.png" style="width:30px;height:40px">`; w = 30; h = 40; }
    else { inner = crate({cat: 'WEIRD', rar: L.rar}, 44); w = 44; h = 44; }
    const it = el('lootitem', inner, null, {left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', opacity: 0});
    el('shadow', '', null, {left: x + 'px', top: y + h - 3 + 'px', width: w + 'px', height: '7px'});
    await anim(it, [{opacity: 1, transform: 'translateY(-120px) rotate(-20deg)'}, {opacity: 1, transform: 'translateY(0) rotate(0)'}, {opacity: 1, transform: 'translateY(-10px)'}, {opacity: 1, transform: 'translateY(0)'}], 620, {easing: 'ease-in'});
    thud(); 
    const c = cols[L.rar] || (L.k === 'blood' ? '#e0284a' : '#ffd23f');
    const lab = el('lootlab', L.label, it, {color: c, borderColor: c, marginBottom: 3 + (i % 2) * 13 + 'px'});
    tone(1000 + i * 250, .1, 'triangle', .07);
    await sleep(1500);
  }
  await sleep(600);
  return finishAgain();
}
function finishAgain() {
  const b = document.createElement('button'); b.className = 'again'; b.textContent = 'RUN ANOTHER PLAY';
  world.appendChild(b);
  return new Promise(r => { b.onclick = async () => { tone(400, .08, 'square', .06); await fadeTo(1, 500); r(); }; });
}

// ---------------------------------------------------------------- main loop
async function main() {
  await title();
  let first = true;
  for (;;) {
    G.plays++;
    await phoneScene(!first); first = false;
    const prep = await prepScene();
    const fate = planFate();
    await departScene(prep);
    await arriveScene();
    const R = await liveScene(fate);
    await returnScene(R);
  }
}
main();
