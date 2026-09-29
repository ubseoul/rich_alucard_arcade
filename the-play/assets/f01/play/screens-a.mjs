// THE PLAY sandbox — screens A: THE PITCH board, THE CAR (crew + seats + guns + approach), the menu / crew book.
import * as E from '../../../js/frag/F01/play/engine.mjs';
import * as W from '../../../js/frag/F01/play/world.mjs';
import * as C from '../../../js/frag/F01/play/content.mjs';
import {$,$$,h,esc,tap,tip,toast,tele,store,prefs,counter,clamp,zoneKey,wait} from './ui-core.mjs';
import {S,plate,setScreen,hud,saveWorld,statusLabel} from './ui-state.mjs';
import {carSVG,CAR_SEAT_POS,carNote,lootIcon,gunIcon} from './faces.mjs';
import * as SFX from './sfx.mjs';

const BIG_LINE={tunde:'[stops chewing] this is the one we don’t all get back from.',dre:'ok so this is the one where I say “we’re good” and mean a little less of it',half_pint:'everybody knows what this costs, right. I’m asking for me.',sunday_best:'We are not paid enough to be sentimental. We are about to be.',young_mazi:'it’s literally fine. (it is the least fine it has ever been)',auntie_grit:'Nobody here is promised. Sit up straight and come back anyway.',_:'I’ll go. Somebody remember that I went.'};
const UGLY={EASY:1,TOUGH:2,NASTY:3,'BIG PLAY':4};
const oga=(w,id)=>w.roster.find(o=>o.id===id);
const TW=k=>C.TRAIT_WORD[k]||k;
const traitLine=o=>o.traits.map(TW).join(' · ');

// ---------------------------------------------------------------------------------------------------------------- THE PITCH
export function pitchCardHTML(w,p,k){
 const job=p.job,card=p.card,who=oga(w,p.pitcher)||{id:p.pitcher,short:p.pitcher};
 const ready=W.readyOnes(w).length;const need=job.size[0];const locked=ready<need;
 const dots=[1,2,3,4].map(i=>`<i class="${i<=(UGLY[job.ugly]||2)?'on':''}"></i>`).join('');
 const kind=p.extract?'<span class="tag cyan">EXTRACT · FREE</span>':job.bigPlay?'<span class="tag gold">BIG PLAY · NAMED OGAS CAN BE LOST FOR GOOD</span>':p.notice?'<span class="tag red">RETALIATION · NO APPOINTMENT</span>':job.shape==='TAKE THE BLOCK'?'<span class="tag pink">LOUD</span>':'<span class="tag green">QUIET</span>';
 return `<div class="card pitch ${locked?'locked':''} ${p.notice?'notice':''}" data-k="${k}" role="button" tabindex="0" aria-label="${esc(card.name)}">
  <div class="quote">${plate(who,{},'lg')}<div class="bubble"><span class="who">${esc(who.short||'')}</span>${esc(p.quote)}</div></div>
  <div class="jobbody">
   <div class="row" style="align-items:center;justify-content:space-between;flex:none">${kind}${card.intel?'<span class="tag gold">BETTER PITCH · YOU CLOCKED THE SECOND DOOR</span>':''}</div>
   <div class="jobname">${esc(card.name)}</div>
   <div class="stats"><b>THE TAKE</b><span><span class="take">${p.extract?'A FRIEND BACK':'UP TO $'+card.top+'K'}</span> ${p.extract?'':`<span class="silh" style="margin-left:6px"><span class="box">${lootIcon(card.shown,24)}</span><span class="box q">?</span></span>`}</span>
    <b>HOW UGLY</b><span><span class="uglydots">${dots}</span> <span class="dim small">${esc(job.ugly)}</span></span>
    <b>WHO</b><span>${esc(job.faction)}</span></div>
   <div class="tellrow">${esc(job.tell)}</div>
   <div class="dim small">${locked?`<span style="color:var(--amber)">NEED ${need} READY OGAS — you have ${ready}.</span>`:`${need===job.size[1]?need:need+'–'+job.size[1]} Ogas · ${job.defense?'no car — your own house':'pick the car'}`}</div>
  </div></div>`;
}

// returns a promise resolved with the player's choice: {kind:'PLAY'|'EXTRACT'|'LAYLOW'|'REFRESH', ...}
export function pitchScreen(){
 return new Promise(res=>{
  const w=S.w,b=S.board;const ready=W.readyOnes(w);const alive=w.roster.length;
  const caps=W.captiveInfo(w);
  const nameOf=ids=>ids.map(id=>(oga(w,id)||{short:id}).short).join(' and ');
  const banners=caps.map(c=>`<div class="banner ${c.lastNight?'red':'amber'}"><span class="px" style="color:${c.lastNight?'var(--red)':'var(--amber)'}">${c.lastNight?'LAST NIGHT TO ACT':'HELD · '+c.clock+' NIGHTS LEFT'}</span>
   ${esc(nameOf(c.ids))} ${c.ids.length>1?'are':'is'} being held. ${c.lastNight?'After tonight they are gone for good — unless you pay.':'Getting them back is a free job: it never counts against tonight.'}
   ${c.lastNight?`<div style="margin-top:8px"><button class="btn gold sm" data-ransom="${c.gid}" ${c.affordable?'':'disabled'}>PAY RANSOM $${c.cost}K<span class="sub">${c.affordable?'they come home hurt but alive':'you have $'+Math.round(w.cash)+'K'}</span></button></div>`:''}</div>`).join('');
  const cards=b.pitches.map((p,k)=>pitchCardHTML(w,p,k)).join('');
  const crew=w.roster.map(o=>`<div class="pill">${plate(o,{state:o.status==='READY'?'UP':'DOWN'},'sm')}<span><b style="font-size:12px">${esc(o.short)}</b><br><span class="dim" style="font-size:10px">${esc(statusLabel(o,w))}</span></span></div>`).join('');
  const dead=alive<2;
  const el=h(`<div class="screen" id="pitch"><div class="scroll">
   <div class="h1">${b.notice?'SOMEBODY IS AT THE GATE.':'WHO’S PITCHING TONIGHT?'}</div>
   <div class="dim small" style="margin-bottom:10px">KOREATOWN · NIGHT ${w.night} ${b.notice?'· retaliation shows up unannounced':'· one job a night. Pick the one you can carry.'}</div>
   ${banners}${dead?`<div class="banner red"><span class="px" style="color:var(--red)">THE CREW IS FINISHED</span>Nobody left to run a job. Start a new career from the menu.</div>`:''}
   ${b.extracts.map((p,k)=>pitchCardHTML(w,p,'x'+k)).join('')}
   ${cards}
   <div class="h2">THE CREW</div><div>${crew}</div>
   <div class="mnote">Wounded Ogas heal overnight. Captured Ogas are on a clock. Every night the crew does not work, the heat cools.</div>
  </div>
  <div class="dock">${b.notice?`<div class="mnote" style="text-align:center;margin:0">The gate will not wait. Take the door.</div>`:`<button class="btn ghost" id="laylow">LAY LOW A NIGHT<span class="sub">heal up · heat cools · captive clocks keep ticking</span></button>`}</div></div>`);
  setScreen(el);hud();
  const choose=(v)=>{if(S.morningAt!=null&&!S.morningTapped){S.morningTapped=true;tele.log('M2P_TAP',{ms:tele.since('morning'),pick:v.kind==='PLAY'||v.kind==='EXTRACT'?v.job.id:v.kind});}res(v);};
  $$('.card.pitch',el).forEach(c=>{
   const k=c.dataset.k;const p=k[0]==='x'?b.extracts[+k.slice(1)]:b.pitches[+k];
   const need=p.job.size[0];
   const go=()=>{if(W.readyOnes(w).length<need){SFX.play('deny');toast(`Need ${need} READY Ogas for this one.`);return;}SFX.unlock();SFX.play('select');choose(p.extract?{kind:'EXTRACT',...p}:{kind:'PLAY',...p});};
   c.addEventListener('click',go);c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
  });
  $$('[data-ransom]',el).forEach(bn=>tap(bn,()=>{const ok=W.payRansom(w,bn.dataset.ransom);if(ok){saveWorld();toast('Ransom paid. They are home — hurt, but home.');tele.log('RANSOM_PAID',{});res({kind:'REFRESH'});}}));
  const ll=$('#laylow',el);if(ll)tap(ll,()=>{tele.log('LAY_LOW',{night:w.night});choose({kind:'LAYLOW'});},'tap');
  if(!counter.tipSeen('pitch')&&!b.notice)tip('pitch','TIP · THE PITCH','Tap a job to take it. The quote is one of your Ogas selling it. THE TAKE is the ceiling, the ? is a surprise in the trunk. One job a night.');
 });
}

// ---------------------------------------------------------------------------------------------------------------- THE CAR
const APPR={QUIET:['QUIET','starts calm. easy to spook later.'],LOUD:['LOUD','starts ALERT. fast and messy.'],OCTOPUS:['OCTOPUS BRAIN','a weird plan. starts in between.']};
const SEAT_NAME={DRIVER:'WHEELS',SHOTGUN:'SHOTGUN',BACK_L:'BACK L',BACK_M:'BACK MID',BACK_R:'BACK R',DOOR:'THE DOOR',HALL_L:'HALL L',HALL_R:'HALL R',INNER:'INNER ROOM'};
const LANE_WORD={DRIVER:'DRIVER',FRONT:'FRONT',MID:'MIDDLE',BACK:'BACK'};

export function carScreen(pr){
 return new Promise(res=>{
  const P=pr.P,job=pr.job,avail=pr.avail,w=S.w;const castle=!!job.defense;
  const opts=pr.options;let carId=(opts.find(o=>!o.disabled)||opts[0]).id;
  const startApproach=job.favors==='LOUD'?'LOUD':'QUIET';let approach=castle?'QUIET':startApproach;
  let seats={};let armed=null;let guns={};let arm=[...(pr.armory||[])];
  const laneOf=s=>C.SEAT_LANE[s];
  const seatList=()=>C.CARS[carId].seats;
  const effMax=()=>Math.min(pr.maxCrew,seatList().length,avail.length);
  const effMin=()=>Math.min(pr.minCrew,effMax());
  const placed=()=>Object.values(seats);
  const gunOf=o=>guns[o.id]||o.gun||'pistol';
  const known=P.known||{};
  const tells=pr.tells||[];
  const el=h(`<div class="screen" id="car"><div class="scroll" id="cscroll"></div><div class="dock" id="cdock"></div></div>`);
  setScreen(el);

  function tellStatus(t){
   const seated=Object.entries(seats).filter(([s,id])=>{const o=avail.find(x=>x.id===id);return o&&t.ok(o,laneOf(s));});
   const aboard=placed().some(id=>{const o=avail.find(x=>x.id===id);return o&&t.any(o);});
   const bench=avail.some(o=>!placed().includes(o.id)&&t.any(o));
   return {seated,aboard,bench,ok:seated.length>0};
  }
  function render(){
   // drop seated Ogas who no longer fit the chosen car
   for(const s of Object.keys(seats))if(!seatList().includes(s))delete seats[s];
   const sc=$('#cscroll',el),dock=$('#cdock',el);const cnt=placed().length;const full=cnt>=effMax();
   const carTabs=castle?'':`<div class="carrow">${opts.map(o=>`<button class="cartab ${o.id===carId?'sel':''} ${o.disabled?'dis':''}" data-car="${o.id}" ${o.disabled?'aria-disabled="true"':''}>
     <span class="mini">${carSVG(o.id)}</span><b>${o.id}</b><small>${o.seats} seats</small>${o.disabled?`<span class="why">${esc(o.disabled)}</span>`:''}</button>`).join('')}</div>`;
   const tellHTML=tells.length?`<div class="h2" style="margin-top:4px">WHAT’S WAITING</div><div class="tells">${tells.map(t=>{const st=tellStatus(t);
     return `<div class="t ${st.ok?'ok':''}"><span class="ic">${st.ok?'🛡':'⚠'}</span><span><b>${esc(t.line)}.</b><br><span class="dim">Counter: ${esc(t.counterLine)}. ${st.ok?'<span style="color:var(--green)">SEATED ✔</span>':st.aboard?'<span style="color:var(--amber)">They are aboard — wrong seat.</span>':st.bench?'<span style="color:var(--amber)">Somebody at home could do it.</span>':'<span style="color:var(--red)">Nobody in your crew is built for it.</span>'}</span></span></div>`;}).join('')}</div>`:'';
   const apprHTML=castle?`<div class="mnote">This one comes to you. Nobody drives. Seat the house.</div>`:`<div class="h2">HOW DO YOU ROLL UP?</div><div class="approach">${['QUIET','LOUD',...(job.octopus?['OCTOPUS']:[])].map(a=>`<button class="appr ${a===approach?'sel':''} ${(job.favors===a)?'fav':''}" data-appr="${a}"><b>${APPR[a][0]}</b>${a==='OCTOPUS'?esc(job.octopus):APPR[a][1]}</button>`).join('')}</div>`;
   const combos=E.previewCombos(P.crew=placed().map(id=>avail.find(o=>o.id===id)).filter(Boolean),seats,P.bonds);
   const comboHTML=[...combos].filter(c=>known[c]).map(c=>`<span class="combo">✦ ${esc(E.comboName(c))}</span>`).join('');
   const box=CAR_SEAT_POS[castle?'CASTLE':carId];
   const seatEls=seatList().map(s=>{
     const [x,y]=box[s]||[50,50];const id=seats[s];const o=id&&avail.find(x=>x.id===id);
     const ctr=o&&tells.some(t=>t.ok(o,laneOf(s)));
     const needs=!o&&tells.some(t=>!tellStatus(t).ok&&t.seatLane===laneOf(s));
     const lock=!o&&full;
     return `<button class="seat ${o?'full':''} ${armed===s?'armed':''} ${ctr?'counter':''} ${needs?'needs':''} ${lock?'lock':''}" style="left:${x}%;top:${y}%" data-seat="${s}" aria-label="${SEAT_NAME[s]}">
      ${o?plate(o):`<span>${SEAT_NAME[s]}<span class="lane">${LANE_WORD[laneOf(s)]}</span></span>`}${ctr?'<span class="shield">🛡</span>':''}${o?`<span class="lbl">${esc(o.short)}</span>`:''}</button>`;}).join('');
   const tray=avail.map(o=>{const inSeat=placed().includes(o.id);const cm=tells.some(t=>t.any(o));const z=E.zoneN(o.base??o.nerve);const g=C.GUNS[gunOf(o)]||C.GUNS.pistol;
     return `<div class="chip ${inSeat?'used':''} ${cm?'cm':''}" data-oga="${o.id}" role="button" tabindex="0">${plate(o)}<span class="nm">${esc(o.short)}${o.nick?`<br><span style="color:var(--gold)">“${esc(o.nick)}”</span>`:''}</span>
      <span class="tr">${esc(TW(o.traits[0]))}${o.traits[1]?' · '+esc(TW(o.traits[1])):''}${o.scars[0]?`<br>${esc(o.scars[0])}`:''}</span>
      <span class="ne"><span class="zone ${zoneKey(z)}"></span>${z}</span>
      <button class="gunbtn" data-gun="${o.id}">${gunIcon(11)} ${esc(g.name)}</button></div>`;}).join('');
   const seatedNamed=placed().map(id=>avail.find(o=>o.id===id)).filter(o=>o&&o.named);
   const voice=seatedNamed[0]||avail.find(o=>o.named)||avail[0];
   const bigHTML=job.bigPlay?`<div class="bigplay"><span class="tag gold">BIG PLAY</span><b>Everybody who goes is on the line.</b> A named Oga who falls here can be <b>GONE</b> for good. Nobody is coming to get them.<div class="greedq" style="margin-top:8px">${plate(voice)}<div class="bubble"><span class="who">${esc(voice.short)}</span>${esc(BIG_LINE[voice.id]||BIG_LINE._)}</div></div></div>`:'';
   sc.innerHTML=`<div class="h1">${esc(P.jobName)}</div>${bigHTML}
    <div class="dim small" style="margin-bottom:6px">${esc(job.tell)}. ${castle?'They are coming to you.':''}</div>
    ${carTabs}
    ${tellHTML}
    <div class="carbox ${castle?'castle':''}" id="carbox">${carSVG(castle?'CASTLE':carId)}${seatEls}</div>
    <div class="mnote" style="text-align:center">${castle?'THE HOUSE':esc(carId)} · ${castle?'the halls are your seats':esc(C.CARS[carId].word.toLowerCase())}${castle?'':' · '+esc(carNote(carId))}</div>
    <div style="text-align:center">${comboHTML}</div>
    ${apprHTML}
    <div class="h2">YOUR OGAS · ${cnt}/${effMax()}${effMin()<effMax()?` (need ${effMin()}+)`:''}</div>
    <div class="tray">${tray}</div>
    <div class="mnote">Tap a seat, then an Oga. Tap a seated Oga to bench them. Tap a gun to swap it${arm.length?'':' (the armory is empty)'}.</div>`;
   const need=[];if(!castle&&!Object.keys(seats).includes('DRIVER'))need.push('SEAT A DRIVER');else if(castle&&!seats.DOOR)need.push('SEAT THE DOOR');if(cnt<effMin())need.push(`NEED ${effMin()}+ OGAS`);
   const last=S.lastCrew[job.id];
   dock.innerHTML=`${last?`<button class="btn ghost sm" id="lastcrew">↺ SAME AS LAST TIME</button>`:''}<button class="btn primary" id="go" ${need.length?'disabled':''}>${need.length?esc(need[0]):(castle?'LOCK THE DOOR':'GO')}<span class="sub">${need.length?'':`${esc(approach)}${castle?'':' · '+carId} · ${cnt} Ogas`}</span></button>`;
   bind();
  }
  function bind(){
   $$('[data-car]',el).forEach(b=>tap(b,()=>{const o=opts.find(x=>x.id===b.dataset.car);if(o.disabled){SFX.play('deny');toast(o.disabled);return;}carId=o.id;seats=Object.fromEntries(Object.entries(seats).filter(([s])=>seatList().includes(s)));armed=null;render();},'select'));
   $$('[data-appr]',el).forEach(b=>tap(b,()=>{approach=b.dataset.appr;render();},'select'));
   $$('[data-seat]',el).forEach(b=>tap(b,()=>{
     const s=b.dataset.seat;
     if(seats[s]&&armed===s){delete seats[s];armed=null;}
     else if(seats[s]){armed=s;}
     else if(placed().length>=effMax()){SFX.play('deny');toast('Crew is full — bench somebody first.');return;}
     else armed=armed===s?null:s;
     render();},'seat'));
   $$('.chip',el).forEach(c=>{const fn=e=>{if(e.target.closest('[data-gun]'))return;SFX.unlock();sit(c.dataset.oga);};c.addEventListener('click',fn);c.addEventListener('keydown',e=>{if(e.key==='Enter'){fn(e);}});});
   $$('[data-gun]',el).forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();SFX.play('tap');gunSheet(avail.find(o=>o.id===b.dataset.gun));}));
   const lc=$('#lastcrew',el);if(lc)tap(lc,()=>{const l=S.lastCrew[job.id];if(!l)return;const okIds=l.crew.filter(id=>avail.some(o=>o.id===id));if(l.car&&opts.find(o=>o.id===l.car&&!o.disabled))carId=l.car;seats={};for(const [s,id] of Object.entries(l.seats))if(okIds.includes(id)&&seatList().includes(s))seats[s]=id;approach=l.approach||approach;armed=null;render();},'select');
   const go=$('#go',el);if(go)tap(go,()=>{
     if(go.disabled)return;
     const crew=placed();S.lastCrew[job.id]={car:carId,crew,seats:{...seats},approach};store.set('lastCrew',S.lastCrew);
     tele.log('CAR_GO',{car:carId,approach,crew,seats:{...seats},guns:{...guns}});
     SFX.play('go');res({car:castle?'CASTLE':carId,crew,seats:{...seats},approach,guns:{...guns}});},'go');
  }
  function sit(id){
   const o=avail.find(x=>x.id===id);const at=Object.keys(seats).find(s=>seats[s]===id);
   if(armed&&seats[armed]&&seats[armed]!==id){ // swap into an occupied armed seat
     const prev=seats[armed];if(at){seats[at]=prev;}seats[armed]=id;armed=null;SFX.play('seat');render();return;}
   if(at){delete seats[at];armed=null;SFX.play('tap');render();return;}
   if(armed){seats[armed]=id;armed=null;SFX.play('seat');render();return;}
   if(placed().length>=effMax()){SFX.play('deny');toast('Crew is full — bench somebody first.');return;}
   // no seat armed: best empty seat = the one a still-unmet tell wants, else the first free seat in car order
   const free=seatList().filter(s=>!seats[s]);
   const want=free.find(s=>tells.some(t=>!tellStatus(t).ok&&t.ok(o,laneOf(s))));
   const pick=want||free.find(s=>s!=='DRIVER'||o.cls==='WHEELS')||free[0];
   if(pick){seats[pick]=id;SFX.play('seat');render();}
  }
  function gunSheet(o){
   const cur=gunOf(o);const options=['pistol',...new Set(arm)].filter((g,i,a)=>a.indexOf(g)===i);
   if(cur&&!options.includes(cur))options.unshift(cur);
   const sh=h(`<div class="sheet"><div class="in"><div class="h2" style="margin-top:0">${esc(o.short)}’S GUN</div>
    ${options.map(g=>{const G=C.GUNS[g]||C.GUNS.pistol;return `<button class="gunopt ${g===cur?'sel':''}" data-g="${g}">${gunIcon(30)}<span><b>${esc(G.name)} · ${esc(G.role)}</b><small>${esc(G.flavor)} ${G.lane!=='ANY'?'Best in the '+G.lane+'.':''}</small></span></button>`;}).join('')}
    <button class="btn ghost sm" data-close>CLOSE</button></div></div>`);
   $('#stage').appendChild(sh);
   tap($('[data-close]',sh),()=>sh.remove());
   $$('[data-g]',sh).forEach(b=>tap(b,()=>{
     const g=b.dataset.g;const old=gunOf(o);
     if(g!==old){ // mirror the engine: the new gun leaves the armory, the old one goes in
       const ix=arm.indexOf(g);if(ix>=0)arm.splice(ix,1);if(old&&old!=='pistol')arm.push(old);guns[o.id]=g;tele.log('GUN_SWAP',{oga:o.id,gun:g});
       // if that gun was on another Oga in this UI session, nothing to do: the armory only hands out unequipped guns
     }
     sh.remove();render();},'select'));
  }
  render();
  if(!counter.tipSeen('car'))tip('car','TIP · THE CAR','Tap a seat, then an Oga. A green-glowing seat means a counter to the enemy’s trick is sitting there. Read WHAT’S WAITING before you go. Cars that can’t seat the crew are greyed out.');
 });
}

// ---------------------------------------------------------------------------------------------------------------- menu / crew book
export function menuPanel({onReset,onHold,onBig}){
 const w=S.w;const p=prefs.get();
 const roster=w.roster.map(o=>{const g=C.GUNS[o.gun]||C.GUNS.pistol;const cd=o.perks.filter(x=>x&&!String(x).startsWith('saved:'));
  return `<div class="ent ${o.status!=='READY'?'away':''}">${plate(o,{state:o.status==='READY'?'UP':'DOWN'},'lg')}<div class="txt"><b>${esc(o.name)}${o.nick?` · “${esc(o.nick)}”`:''}</b>${esc(o.cls)} · ${o.vampire?'VAMPIRE':'HUMAN'} · ${esc(traitLine(o))}<br>${esc(g.name)} [${esc(g.role)}] · ${esc(statusLabel(o,w))}${o.scars.length?'<br>'+esc(o.scars.join(', ')):''}${cd.length?'<br><span class="dim">'+cd.map(x=>esc(String(x).replace(/_/g,' '))).join(' · ')+'</span>':''}<br><span class="dim">${o.plays||0} PLAYs</span></div></div>`;}).join('');
 const combos=E.COMBO_IDS.map(id=>w.known[id]?`<span class="combo">✦ ${esc(E.comboName(id))}</span>`:`<span class="pill dim">???</span>`).join('');
 const bonds=w.bonds.map(([a,b])=>`<span class="pill">${esc((oga(w,a)||{short:a}).short)} ♥ ${esc((oga(w,b)||{short:b}).short)}</span>`).join('')||'<span class="dim small">no day ones yet — run three jobs together</span>';
 const armory=(w.armory||[]).map(g=>`<span class="pill">${gunIcon(14)} ${esc((C.GUNS[g]||{}).name||g)}</span>`).join('')||'<span class="dim small">empty</span>';
 const el=h(`<div class="menu-panel"><div class="scroll crewbook">
  <div class="h1">THE CREW BOOK</div>
  ${roster}
  <div class="h2">COMBOS DISCOVERED</div><div>${combos}</div>
  <div class="h2">DAY ONES</div><div>${bonds}</div>
  <div class="h2">ARMORY</div><div>${armory}</div>
  <div class="h2">SETTINGS</div>
  <button class="switch ${p.sound?'on':''}" data-sw="sound">SOUND (placeholder synth)<i></i></button>
  <button class="switch ${p.calm?'on':''}" data-sw="calm">NIGHT MODE (dim, frozen motion)<i></i></button>
  <button class="switch ${p.dev?'on':''}" data-sw="dev">DEV MODE (seed, log, telemetry)<i></i></button>
  ${p.dev?`<div class="devbox" id="devbox">${esc(JSON.stringify({seed:w.seed,night:w.night,plays:w.plays,counter:counter.get().plays,tele:tele.summary()},null,1))}</div><button class="btn ghost sm" id="copytele">COPY TELEMETRY JSON</button><button class="btn ghost sm" id="forcehold" style="margin-top:8px">DEV · MAKE TONIGHT “HOLD THE HOUSE”</button><button class="btn ghost sm" id="forcebig" style="margin-top:8px">DEV · OFFER THE BIG PLAY TONIGHT</button>`:''}
  <div class="h2">THE UBE GATE</div>
  <div class="mnote" style="color:var(--ink);font-size:14px">Did you immediately want to run another PLAY?</div>
  <div class="row"><button class="btn good sm" data-gate="YES">YES</button><button class="btn ghost sm" data-gate="MAYBE">MAYBE</button><button class="btn danger sm" data-gate="NO">NO</button></div>
  <div class="mnote" id="gateans">${(()=>{const g=tele.events.filter(e=>e.ev==='GATE_Q').pop();return g?'Last answer: '+g.a+' (after '+counter.get().plays+' PLAYs)':'';})()}</div>
  <div class="h2">CAREER</div>
  <button class="btn danger sm" id="reset">NEW CAREER (wipes this save)</button>
  <div class="mnote">PLAY counter (persistent, F01 save): ${counter.get().plays} · Feel-gate sandbox — placeholder art and sound, one district.</div>
  <div style="height:70px"></div></div>
  <div class="dock"><button class="btn primary" id="closemenu">BACK TO THE NIGHT</button></div></div>`);
 $('#stage').appendChild(el);
 tap($('#closemenu',el),()=>{el.remove();S.menuOpen=false;});
 $$('[data-sw]',el).forEach(b=>tap(b,()=>{const k=b.dataset.sw;const v=!prefs.get()[k];prefs.set({[k]:v});b.classList.toggle('on',v);applyPrefs();if(k==='dev'){el.remove();S.menuOpen=false;menuPanel({onReset,onHold,onBig});S.menuOpen=true;}}));
 $$('[data-gate]',el).forEach(b=>tap(b,()=>{tele.log('GATE_Q',{a:b.dataset.gate,plays:counter.get().plays,m2p:tele.summary().medianMorningToPitchTapMs});$('#gateans',el).textContent='Logged: '+b.dataset.gate;},'select'));
 const fbg=$('#forcebig',el);if(fbg)tap(fbg,()=>onBig&&onBig(),'go');
 const fh=$('#forcehold',el);if(fh)tap(fh,()=>onHold&&onHold(),'go');
 const ct=$('#copytele',el);if(ct)tap(ct,()=>{try{navigator.clipboard.writeText(JSON.stringify({summary:tele.summary(),events:tele.events},null,1));toast('Copied.');}catch(e){toast('Copy blocked — use window.__raPlay.tele');}});
 tap($('#reset',el),()=>{if(confirm('Wipe this career and start a new one?')){onReset();}},'deny');
 return el;
}
export function applyPrefs(){
 const p=prefs.get();document.body.classList.toggle('calm',!!p.calm);$('.app').classList.toggle('calm',!!p.calm);SFX.setOn(p.sound);
 const d=$('#devbar');if(d)d.classList.toggle('hidden',!p.dev);
}
