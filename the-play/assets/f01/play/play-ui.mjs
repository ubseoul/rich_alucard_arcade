// THE PLAY — browser feel-gate sandbox. One shared engine (js/frag/F01/play/engine.mjs) drives everything; this file is only presentation.
// Loop: PITCH → CAR → SLIDE-IN → BEATS → CALLS → GETAWAY → THE TRUNK → HIT ONE MORE → MORNING AFTER → NEXT PITCH.
import * as E from '../../../js/frag/F01/play/engine.mjs';
import * as W from '../../../js/frag/F01/play/world.mjs';
import * as C from '../../../js/frag/F01/play/content.mjs';
import {$,$$,h,esc,tap,tip,toast,tele,store,prefs,counter,wait,skip,unhurry,pace,clamp,zoneKey,money} from './ui-core.mjs';
import {S,plate,setScreen,hud,saveWorld,statusLabel} from './ui-state.mjs';
import {carSVG,crate,lootIcon,gunIcon} from './faces.mjs';
import {pitchScreen,carScreen,menuPanel,applyPrefs} from './screens-a.mjs';
import * as SFX from './sfx.mjs';

const oga=id=>S.w.roster.find(o=>o.id===id)||S.curRoster&&S.curRoster.find(o=>o.id===id);
const STAGE_PIPS=['ENTRY','CONTACT','TROUBLE','PRIZE','GETAWAY'];
const MOM_IC={CLUTCH:'★',FUNNY:'☺',SCARY:'▲',WARM:'♥',STUPID:'✖',DRAMATIC:'!'};
const KLASS_HEAD={CLEAN:'CLEAN WIN',MESSY:'A WIN WITH A STORY',COSTLY:'A WIN — AND IT COST',FOLDED:'FOLDED — WALKED AWAY WITH SOMETHING',GREED:'GREED — JUGGED',ROBBED:'JUGGED ON THE WAY BACK',BAILED:'BAILED — NOBODY LEFT BEHIND',FELL_BACK:'FELL BACK — THE HOUSE IS HIT, THE CREW ISN\'T',WASH:'WASH'};
const KLASS_TONE={CLEAN:'win',MESSY:'win',COSTLY:'mid',FOLDED:'mid',GREED:'lose',ROBBED:'lose',BAILED:'mid',FELL_BACK:'mid',WASH:'lose'};
const VERB_SUB={TALK:'talk your way through',BUST:'go loud, right through',SNEAK:'slip past, quiet',PAY:'cash out of Rich’s pocket',PUSH:'no slowing down',FOLD:'call it off — walk with something',SAVE:'somebody is down',PULL_UP:'Rich steps out of the car. Once a night.'};
let SC=null,T=null,late={};

// ---------------------------------------------------------------------------------------------------------------- scene
function splitTrait(text){
 const i=text.lastIndexOf(' — ');if(i<0)return [text,null];
 const tail=text.slice(i+3);return /^[A-Z0-9 '&.,\-]{2,26}$/.test(tail)?[text.slice(0,i),tail]:[text,null];
}
function foeImg(type,state){
 const S2=window.RAShowdownSprites;let src='';try{src=S2?S2.unit({kind:'ENEMY',type}):'';}catch(e){}
 return `<img class="foe ${state}" alt="${esc(type)}" src="${src}">`;
}
function buildScene(d){
 const w=S.w;S.curRoster=w.roster;
 const job=d.job;const order=d.seats.map(s=>s.id);
 const crewHTML=order.map(id=>{const o=oga(id);const c=d.snap.crew.find(x=>x.id===id);
  return `<div class="cm ${zoneKey(c.zone)}" data-cm="${id}"><span data-pl>${plate(o,{zone:c.zone,state:c.state})}</span><span class="nm">${esc(o.short)}</span><span class="hp">${Array.from({length:c.maxhp},(_,i)=>`<i class="${i<c.hp?'on':''}"></i>`).join('')}</span><span class="nv"><i style="width:${clamp(c.nerve,0,100)}%"></i></span></div>`;}).join('');
 const el=h(`<div class="screen scene" id="scene"><div class="scenetop"><div class="jobbar"><span class="nm">${esc(job.name)}</span><span class="tag ${d.approach==='LOUD'?'red':d.approach==='QUIET'?'green':'cyan'}">${esc(d.approach==='OCTOPUS'?'OCTOPUS':d.approach)}${d.car&&d.car!=='CASTLE'?' · '+d.car:''}</span></div>
  <div class="pips">${STAGE_PIPS.map(s=>`<span class="pip" data-pip="${s}">${s}</span>`).join('')}</div></div>
  <div class="street ${job.defense?'':'parked'}" id="street"><span class="place">${esc(job.place.toUpperCase())}</span><div class="road"></div>
   ${job.defense?'':`<div class="beam"></div><div class="tcar" style="left:-30%">${carSVG(d.car)}</div>`}<div class="foes" id="foes"></div><div class="flash"></div></div>
  <div class="crewrow" id="crewrow">${crewHTML}</div>
  <div class="pressure"><div class="lbl"><span>PRESSURE</span><b id="pzone">${esc(d.snap.zoneP)}</b></div><div class="pbar"><i id="pneedle" style="left:${d.snap.pressure}%"></i></div></div>
  <div class="feed" id="feed" aria-live="polite"></div><div class="scenetap" id="scenetap"></div><span class="skiphint">TAP TO HURRY</span></div>`);
 setScreen(el);
 SC={el,feed:$('#feed',el),street:$('#street',el),foes:$('#foes',el),hp:{},zone:{},state:{},log:[],pod:[],job,carId:d.car,pipDone:-1};
 for(const c of d.snap.crew){SC.hp[c.id]=c.hp;SC.zone[c.id]=c.zone;SC.state[c.id]=c.state;}
 $('#scenetap',el).addEventListener('click',()=>{SFX.unlock();skip();});
 return el;
}
function setPip(stage){
 const idx=STAGE_PIPS.indexOf(stage);
 $$('.pip',SC.el).forEach((p,i)=>{p.classList.toggle('done',i<idx);p.classList.toggle('now',i===idx);});
}
function setPressure(p,zone){$('#pneedle',SC.el).style.left=clamp(p,0,100)+'%';const z=$('#pzone',SC.el);z.textContent=zone;z.style.color=zone==='ALL HANDS'?'var(--red)':zone==='ALERT'?'var(--amber)':'var(--green)';}
function setFoes(list){SC.foes.innerHTML=list.map(f=>foeImg(f.type,f.state)).join('');}
function updateCrew(snap,{hi}={}){
 for(const c of snap.crew){
  const cm=$(`[data-cm="${c.id}"]`,SC.el);if(!cm)continue;const o=oga(c.id);
  const prev=SC.hp[c.id];
  cm.className=`cm ${zoneKey(c.zone)} ${c.state!=='UP'?'DOWN':''}`;
  $$('.hp i',cm).forEach((i,k)=>i.classList.toggle('on',k<c.hp));
  $('.nv i',cm).style.width=clamp(c.nerve,0,100)+'%';
  if(SC.zone[c.id]!==c.zone||SC.state[c.id]!==c.state||c.hp!==prev){$('[data-pl]',cm).innerHTML=plate(o,{zone:c.zone,state:c.state,hurt:c.hp<c.maxhp*.5});}
  if(c.hp<prev){const dl=h(`<span class="delta">−${prev-c.hp}</span>`);cm.appendChild(dl);setTimeout(()=>dl.remove(),1000);cm.classList.add('hit');setTimeout(()=>cm.classList.remove('hit'),320);SFX.play('hit');SFX.buzz(30);SC.street.classList.add('shake');$('.flash',SC.street).classList.remove('on');void $('.flash',SC.street).offsetWidth;$('.flash',SC.street).classList.add('on');setTimeout(()=>SC.street.classList.remove('shake'),320);}
  else if(c.hp>prev){const dl=h(`<span class="delta up">+${c.hp-prev}</span>`);cm.appendChild(dl);setTimeout(()=>dl.remove(),1000);}
  if(c.state!=='UP'&&SC.state[c.id]==='UP')SFX.play('down');
  SC.hp[c.id]=c.hp;SC.zone[c.id]=c.zone;SC.state[c.id]=c.state;
 }
 setPressure(snap.pressure,snap.zoneP);
}
function flashWho(id){const cm=$(`[data-cm="${id}"]`,SC.el);if(!cm)return;cm.classList.add('hi');setTimeout(()=>cm.classList.remove('hi'),1500);}

async function playSlide(d){
 buildScene(d);SFX.play('slide');
 const car=$('.tcar',SC.el);if(car){requestAnimationFrame(()=>{car.style.left='6%';});}
 SC.feed.innerHTML=`<div class="cardtxt"><small>${esc(SC.job.faction)}</small>${esc(SC.job.tell.replace(/^./,c=>c.toUpperCase()))}.</div>`;
 await wait(800);
 const who=oga(d.barkWho);const bark=d.bark||'';
 SC.feed.insertAdjacentHTML('beforeend',`<div class="bark">${plate(who)}<div class="bubble" style="animation:pop .35s both"><span class="who">${esc(who?who.short:'')}</span>${esc(bark.replace(/^[^:]*: ?/,''))}</div></div>`);
 SFX.play('beat');
 if(d.combos&&d.combos.length){await wait(600);SC.feed.insertAdjacentHTML('beforeend',`<div>${d.combos.map(c=>`<span class="combo">✦ ${esc(c)}</span>`).join('')}</div>`);SFX.play('crate','RARE');}
 await wait(1500);
}
async function playBeat(d){
 unhurry();setPip(d.stage);
 const w=S.w;const opts=d.calls||[];
 SC.feed.innerHTML='';
 if(d.pods0)setFoes(d.pods0.map(t=>({type:t,state:'UP'})));
 const smartHit=d.opt&&d.opt!=='DEFAULT'&&d.opt===d.card.smartVerb;
 const callChip=d.opt&&d.opt!=='DEFAULT'?`<span class="hz" style="color:var(--cyan)">YOUR CALL: ${esc(({TALK:'TALK HIM DOWN',BUST:'BUST THROUGH',SNEAK:'SLIP PAST',PAY:'PAY HIM OFF',PUSH:'PUSH IT',FOLD:'FOLD',SAVE:'GO BACK FOR HIM',PULL_UP:'PULL UP'})[d.opt]||d.opt)}${smartHit?' · <b style="color:var(--gold)">SMART — '+esc(d.card.smart)+'</b>':''}</span>`:'';
 SC.feed.insertAdjacentHTML('beforeend',`<div class="cardtxt"><small>${esc(d.stage)}</small>${esc(d.card.text)}${d.card.hazard?`<span class="hz">⚠ ${esc(d.card.hazard)}</span>`:''}${callChip}</div>`);
 SFX.play('beat');
 SC.log.push({stage:d.stage,text:d.card.text,hazard:d.card.hazard,opt:d.opt,smart:d.card.smart,smartVerb:d.card.smartVerb,tier:d.tier,moments:d.moments.map(m=>m.text)});
 await wait(d.moments.length?900:650);
 const ms=d.moments;
 if(!ms.length){
  SC.feed.insertAdjacentHTML('beforeend',`<div class="caption">${esc(d.caption||'Nothing much happens. That is the point.')}</div>`);
  updateCrew(d.snap);await wait(900);
 }else{
  for(let k=0;k<ms.length;k++){
   const m=ms[k];const [main,tr]=splitTrait(m.text);
   SC.feed.insertAdjacentHTML('beforeend',`<div class="mom ${esc(m.tag)}"><span class="ic">${MOM_IC[m.tag]||'•'}</span><span>${esc(main)}${tr?` <span class="tag ${m.tag==='FUNNY'?'cyan':m.tag==='SCARY'?'red':m.tag==='CLUTCH'?'gold':'pink'}" style="margin-left:4px">${esc(tr)}</span>`:''}</span></div>`);
   SFX.play('moment',m.tag);if(m.who)flashWho(m.who);
   if(k===0)updateCrew(d.snap);
   $('#feed',SC.el).scrollTop=99999;
   await wait(clamp(800+m.text.length*18,950,1800));
  }
 }
 const pods=d.pods1;if(pods)setFoes(pods);
 const tierTag=d.tier>=2?['SMOOTH','green']:d.tier===1?['ROUGH','gold']:['BAD','red'];
 SC.feed.insertAdjacentHTML('beforeend',`<div style="text-align:right"><span class="tag ${tierTag[1]}">${tierTag[0]} BEAT</span></div>`);
 await wait(500);
}
async function playEnd(d){
 const map={FOLD:['FOLD','You called it off. Everybody walks.','cyan'],WASH:['WASH','Nobody is left standing.','red'],FALLBACK:['FELL BACK — THE HOUSE IS HIT, THE CREW ISN\'T','The last one standing gets the crew out of the halls.','gold'],BAIL:['BAILED — NOBODY LEFT BEHIND','The last one standing gets everybody out.','gold']}[d.kind]||['END','','pink'];
 updateCrew(d.snap);
 SC.feed.insertAdjacentHTML('beforeend',`<div class="cardtxt" style="border-left-color:var(--${map[2]==='gold'?'gold':map[2]==='red'?'red':'cyan'})"><small>${map[0]}</small>${esc(d.line||map[1])}</div>`);
 SFX.play(d.kind==='FOLD'?'freeze':'lose');await wait(2200);
}
async function playGetaway(d){
 unhurry();setPip('GETAWAY');setFoes([]);
 const feed=SC.feed;const kind=d.kind;const car=d.car||SC.carId;
 const drv=d.driver?oga(d.driver.id):null;
 const V={CLEAN:'CLEAN GETAWAY',MESSY:'MESSY GETAWAY',CRASH:'CRASH',SPLIT:'SPLIT — THE CREW SCATTERS',ROBBED:'JUGGED ON THE WAY BACK'}[kind]||kind;
 feed.innerHTML=`<div class="cardtxt"><small>GETAWAY</small>${esc(d.card&&d.card.text?d.card.text:'Everybody in. Go.')}${drv?`<span class="hz" style="color:var(--cyan)">${esc(drv.short)} is on the wheel of the ${esc(car)}${d.stall?' — it dies at the light':''}</span>`:''}</div>
  <div class="gastage ${kind==='CRASH'?'crash':kind==='SPLIT'?'split':''}"><div class="lines"></div><div class="car">${carSVG(car)}</div><div class="boom">💥</div></div>`;
 SFX.play('chase');await wait(1700);
 if(d.snap)updateCrew(d.snap);
 feed.insertAdjacentHTML('beforeend',`<div class="verdict ${kind}">${esc(V)}</div>`);
 SFX.play(kind==='CLEAN'?'clean':kind==='CRASH'?'crash':kind==='SPLIT'?'split':kind==='ROBBED'?'lose':'beat');
 if(d.line)feed.insertAdjacentHTML('beforeend',`<div class="caption" style="color:#e4d8ff">${esc(d.line)}</div>`);
 for(const m of (d.moments||[])){feed.insertAdjacentHTML('beforeend',`<div class="mom ${esc(m.tag)}"><span class="ic">${MOM_IC[m.tag]||'•'}</span><span>${esc(splitTrait(m.text)[0])}</span></div>`);SFX.play('moment',m.tag);if(m.who)flashWho(m.who);await wait(1300);}
 if(d.left&&d.left.length)feed.insertAdjacentHTML('beforeend',`<div class="banner red"><span class="px" style="color:var(--red)">LEFT BEHIND</span>${esc(d.left.join(' and '))}</div>`);
 if(d.crashOut)feed.insertAdjacentHTML('beforeend',`<div class="banner amber"><span class="px" style="color:var(--amber)">THE ${esc(car)} IS OUT</span>${d.crashOut} night${d.crashOut>1?'s':''} in the shop.</div>`);
 if(d.share)feed.insertAdjacentHTML('beforeend',`<div class="banner red"><span class="px" style="color:var(--red)">RICH’S POCKET</span>−$${d.share}K.</div>`);
 SC.log.push({stage:'GETAWAY',text:V+(d.line?' — '+d.line:''),tier:kind==='CLEAN'?2:kind==='MESSY'?1:0,moments:(d.moments||[]).map(m=>m.text)});
 feed.scrollTop=99999;await wait(1500);
}
async function playAftermath(d){
 setPip('GETAWAY');
 SC.feed.innerHTML=`<div class="verdict ${d.kind==='HELD'?'CLEAN':'CRASH'}">${d.kind==='HELD'?'THE DOOR HELD':'THE DOOR GIVES'}</div><div class="caption" style="color:#e4d8ff">${esc(d.line)}</div>`;
 updateCrew(d.snap);SFX.play(d.kind==='HELD'?'clean':'crash');SC.log.push({stage:'AFTERMATH',text:d.line,tier:d.kind==='HELD'?2:0,moments:[]});await wait(2200);
}

// ---------------------------------------------------------------------------------------------------------------- CALLS (the world freezes)
async function callFreeze(pr){
 if(!counter.tipSeen('call'))await tip('call','TIP · THE WORLD FREEZES','This is the only time you steer the night. Each button is an Oga doing something about the situation. Read the room, read your crew. “Let them handle it” is always allowed.');
 return new Promise(res=>{
  SFX.play('freeze');
  const P=pr.P;const card=pr.card;
  const btns=pr.buttons.map(b=>{const o=b.face?(b.face==='rich'?{id:'rich',short:'Rich'}:oga(b.face)):null;
   const sub=(o&&o.id!=='rich'?`${esc(o.short)} · ${esc(C.TRAIT_WORD[o.traits[0]]||o.traits[0])}`:o&&o.id==='rich'?'Rich':'')+((VERB_SUB[b.id]||'')?` — ${esc(VERB_SUB[b.id])}`:'');
   const isGA=pr.i===4;
   return `<button class="callbtn" data-c="${b.id}">${o?plate(o):'<span class="plate"></span>'}<span><b>${esc(b.verb)}</b><small>${isGA?({PUSH:'step on it. risk the car.',FOLD:'lose a crate, keep the crew.'})[b.id]||sub:sub}</small></span></button>`;}).join('');
  const el=h(`<div class="freeze"><div class="top"><span class="px">⏸ THE WORLD FREEZES</span><div class="txt">${esc(card.text)}</div>${card.hazard?`<div class="hz">⚠ ${esc(card.hazard.word)}</div>`:''}</div><div class="calls">${btns}<button class="callbtn def" data-c="DEFAULT"><b>LET THEM HANDLE IT</b></button></div></div>`);
  (SC?SC.el:$('#stage')).appendChild(el);
  $$('[data-c]',el).forEach(b=>tap(b,()=>{el.remove();tele.log('CALL',{i:pr.i,pick:b.dataset.c});res(b.dataset.c);},'call'));
 });
}

// ---------------------------------------------------------------------------------------------------------------- THE TRUNK / HIT ONE MORE
function buildTrunk(d){
 const el=h(`<div class="screen" id="trunk"><div class="scroll" id="tscroll">
  <div class="trunkwrap"><div class="lootflash" id="lflash"></div><div class="trunkhead"><span>THE TRUNK${d.noScratch?' · <span style="color:var(--green)">NO SCRATCH</span>':''}</span><span class="cash" id="tcash">$0K</span></div><div class="crates" id="tcrates"></div><div id="tkick"></div></div>
  <div id="tpanel"></div></div><div class="dock" id="tdock"></div></div>`);
 setScreen(el);
 T={el,crates:$('#tcrates',el),panel:$('#tpanel',el),dock:$('#tdock',el),cash:d.cash,count:0,shown:0};
 $('.trunkwrap',el).addEventListener('click',()=>{skip();});
}
function setCash(v){const c=$('#tcash',T.el);c.textContent=`$${Math.round(v)}K`;}
async function countTo(v,ms=700){const from=T.cash0||0;const steps=8;for(let i=1;i<=steps;i++){setCash(from+(v-from)*i/steps);if(i%2===0)SFX.play('cash');await wait(ms/steps);}T.cash0=v;setCash(v);}
function crateEl(c,i){
 const d=h(`<div class="crateslot ${(c.rar||'COMMON').toLowerCase()} ${c.bonus?'bonus':''}" style="animation-delay:0s">${crate(c,64)}<div class="nm">${esc(c.name)}</div><div class="rar">${esc(c.rar||'')}</div></div>`);
 return d;
}
async function playTrunk(d){
 buildTrunk(d);T.cash0=0;T.list=[];
 SFX.play('thump');await wait(450);
 await countTo(d.cash,d.cash>0?800:300);
 const flash=$('#lflash',T.el);
 for(const c of d.crates){
  const e=crateEl(c);T.crates.appendChild(e);T.list.push(c);SFX.play('crate',c.rar);
  if(c.rar==='LEGENDARY'){flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');SFX.buzz(60);}
  T.crates.scrollIntoView&&0;
  await wait(c.rar==='LEGENDARY'?1200:c.bonus?900:520);
 }
 if(d.kicker){
  $('#tkick',T.el).innerHTML=`<div class="kicker"><b>KICKER · ${esc(d.kicker.rar)}</b>${esc(d.kicker.name)}${d.kickLine?`<br><span class="dim">${esc(d.kickLine)}</span>`:''}</div>`;
  SFX.play('crate',d.kicker.rar);await wait(1000);
 }
 if(d.noScratch){SFX.play('win');}
 if(!d.crates.length&&!d.kicker&&!d.cash)T.crates.innerHTML='<div class="caption">Nothing in the trunk but the smell of the night.</div>';
}
async function playStepStart(d){
 const pn=T.panel;pn.innerHTML=`<div class="banner cyan" style="text-align:center"><span class="px" style="color:var(--cyan)">BACK IN…</span>Somebody said one more. Everybody heard it.</div>`;
 T.dock.innerHTML='';SFX.play('tension');await wait(900);SFX.play('tension');await wait(700);
}
async function playStepOk(d){
 const flash=$('#lflash',T.el);
 T.panel.innerHTML='';
 await countTo(d.pot.cash,600);
 for(let i=0;i<d.crates;i++){T.crates.appendChild(crateEl({cat:'CASH',rar:'COMMON',name:'STOCK CRATE'}));SFX.play('crate','COMMON');await wait(380);}
 const kr=d.jackpot?'LEGENDARY':d.kick.rar;
 T.crates.appendChild(crateEl({cat:d.jackpot?'CASH':'KICK',rar:kr,name:d.kick.name}));
 SFX.play(d.jackpot?'jackpot':'crate',kr);
 if(d.jackpot||kr==='LEGENDARY'){flash.classList.remove('on');void flash.offsetWidth;flash.classList.add('on');SFX.buzz(80);}
 await wait(d.jackpot?1700:kr==='LEGENDARY'?1500:900);
}
async function playStepFail(d){
 SFX.play('turned');SFX.buzz(200);
 T.failed=true;T.crates.classList.add('gone');
 const o=h(`<div class="turned"><div class="px">IT TURNED.</div><p style="font-size:16px;line-height:1.4;margin:14px 0 0">${esc(d.line||'The room closed.')}</p>${d.down&&d.down.length?`<p class="dim">${esc(d.down.join(' and '))} went down.</p>`:''}<p class="dim small" style="margin-top:14px">Everything in the trunk goes with it.</p></div>`);
 $('#stage').appendChild(o);
 await wait(3200);o.remove();
 T.crates.innerHTML='';const kk=$('#tkick',T.el);if(kk)kk.innerHTML='';const hd=$('.trunkhead span',T.el);if(hd)hd.textContent='THE TRUNK · EMPTY';setCash(0);
}
function greedPrompt(pr){
 return new Promise(async res=>{
  if(!counter.tipSeen('greed'))await tip('greed','TIP · HIT ONE MORE','The trunk is safe only if you leave. Going back in risks all of it for a bigger kicker. Each step is harder; the last door always has something legendary behind it.');
  const info=pr.info,P=pr.P;const step=info.step;const who=oga(info.who);
  const risk=(()=>{const base=step+(info.read==='RAGGED'?1:info.read==='BANGED UP'?.5:0);return base<1?['LOW','low','LOOKS DECENT']:base<2?['MID','mid','COULD GO EITHER WAY']:['HIGH','high','THIS ONE BITES'];})();
  const lit=P.lastLit||'nothing lit';const gold=/GOLD/.test(lit),teal=/teal/.test(lit);
  const rungs=[0,1,2].map(i=>`<div class="rung ${i<step?'done':i===step?'now':''}">${i===2?'THE LEGENDARY DOOR':'ONE MORE #'+(i+1)}<small>${i<step?'✔ paid':i===step?'now':''}</small></div>`).join('');
  T.panel.innerHTML=`<div class="greed"><div class="h2" style="margin:12px 0 0">${step===2?'THE LEGENDARY DOOR':'HIT ONE MORE?'}</div><div class="ladder">${rungs}</div>
   <div class="stake">${esc(info.stake)}</div>
   <div class="lit ${gold?'gold':teal?'teal':''}">${gold?'✦ ':''}${esc(lit.charAt(0).toUpperCase()+lit.slice(1))}${step===2?'. <b>If it pays, a LEGENDARY crate comes out with it.</b>':''}</div>
   <div class="row" style="align-items:center;flex:none"><span class="pill">CREW: <b>${esc(info.read)}</b></span><span class="pill">RISK: <span class="risk ${risk[1]}">${risk[0]}</span> <span class="dim">${risk[2]}</span></span></div>
   <div class="greedq">${plate(who)}<div class="bubble"><span class="who">${esc(who?who.short:'')}</span>${esc((info.line||'').replace(/^[^:]*: ?/,''))}</div></div></div>`;
  T.dock.innerHTML=`<button class="btn good" id="take">TAKE THE WIN<span class="sub">keep everything in the trunk</span></button><button class="btn primary pulse" id="more">HIT ONE MORE<span class="sub">risk it all for the next door</span></button>`;
  T.panel.scrollIntoView({block:'nearest'});$('#tscroll',T.el).scrollTop=99999;
  tap($('#take',T.el),()=>{tele.log('CLIMB',{step,go:false});T.panel.innerHTML='';T.dock.innerHTML='';res(false);},'win');
  tap($('#more',T.el),()=>{tele.log('CLIMB',{step,go:true});res(true);},'tension');
 });
}
function turnPrompt(pr){
 return new Promise(res=>{
  const t=pr.turner;
  T.panel.innerHTML=`<div class="h2">A WILLING COUSIN</div><div class="banner cyan"><div class="greedq">${plate(t)}<div><b>${esc(t.short)}</b> could turn the willing recruit.<br><span class="dim small">A new vampire Oga — most of the time it takes. Sometimes it takes a little wrong.</span></div></div></div>`;
  T.dock.innerHTML=`<button class="btn primary" id="turn">TURN THEM</button><button class="btn ghost" id="letgo">LET THEM GO</button>`;
  tap($('#turn',T.el),()=>{tele.log('TURN',{go:true});T.panel.innerHTML='';T.dock.innerHTML='';res(true);},'go');
  tap($('#letgo',T.el),()=>{tele.log('TURN',{go:false});T.panel.innerHTML='';T.dock.innerHTML='';res(false);});
 });
}
function gunPrompt(pr){
 return new Promise(res=>{
  const c=pr.crate;const G=C.GUNS[c.gun]||C.GUNS.pistol;const w=S.w;
  const cand=pr.cands.map(id=>oga(id)).filter(Boolean);
  T.panel.innerHTML=`<div class="h2">WHO GETS IT?</div><div class="banner amber"><div class="greedq">${gunIcon(44)}<div><b>${esc(G.name)}</b> · ${esc(G.role)}<br><span class="dim small">${esc(G.flavor)}${G.lane!=='ANY'?' Best in the '+G.lane+'.':''}</span></div></div></div>
   <div class="tray">${cand.map(o=>{const g=C.GUNS[o.gun]||C.GUNS.pistol;return `<div class="chip" data-g="${o.id}" role="button" tabindex="0">${plate(o)}<span class="nm">${esc(o.short)}</span><span class="tr">${esc(C.TRAIT_WORD[o.traits[0]]||o.traits[0])}</span><span class="gunbtn">${gunIcon(11)} ${esc(g.name)}</span></div>`;}).join('')}</div>`;
  T.dock.innerHTML='<div class="mnote" style="text-align:center;margin:0">Their old gun goes to the armory.</div>';
  $('#tscroll',T.el).scrollTop=99999;
  $$('[data-g]',T.panel).forEach(b=>tap(b,()=>{tele.log('GUN',{to:b.dataset.g,gun:c.gun});T.panel.innerHTML='';T.dock.innerHTML='';res(b.dataset.g);},'gun'));
 });
}

// ---------------------------------------------------------------------------------------------------------------- the event pump
async function playEvent(t,d){
 switch(t){
  case 'SLIDE':return playSlide(d);
  case 'BEAT':return playBeat(d);
  case 'END':return playEnd(d);
  case 'GETAWAY':return playGetaway(d);
  case 'AFTERMATH':return playAftermath(d);
  case 'TRUNK':return playTrunk(d);
  case 'STEP_START':return playStepStart(d);
  case 'STEP_OK':return playStepOk(d);
  case 'STEP_FAIL':return playStepFail(d);
  case 'TURN_RESULT':{const m={TAKES:'It takes. A new Oga is in the crew.','TAKES WEIRD':'It takes — and the new Oga is a little wrong, in a funny way.',BAILS:'They bail. No harm done.'}[d.res];toast(m,3200);SFX.play(d.res==='BAILS'?'deny':'jackpot');await wait(900);return;}
  case 'GUN_GIVEN':{toast(`${d.short} gets the ${d.name}.`,2400);SFX.play('gun');await wait(700);return;}
  case 'REPORT':late.report=d;return;
  case 'MORNING':late.morning=d;return;
 }
}
async function flush(){const evs=S.q.splice(0);for(const e of evs)await playEvent(e.t,e.d);}
function handlePrompt(pr){
 switch(pr.type){
  case 'CAR':return carScreen(pr);
  case 'CALL':return callFreeze(pr);
  case 'CLIMB':return greedPrompt(pr);
  case 'TURN':return turnPrompt(pr);
  case 'GUN':return gunPrompt(pr);
 }
 return Promise.resolve(undefined);
}
async function drive(cfg){
 S.q=[];SC=null;T=null;late={};E.setSink((t,d)=>S.q.push({t,d}));
 const g=E.playGen(cfg);let ans,r;
 try{
  for(;;){
   r=g.next(ans);await flush();
   if(r.done)break;
   ans=await handlePrompt(r.value);
  }
 }finally{E.setSink(null);}
 if(T&&T.dock&&!T.done){ // the trunk stays until the player says so
  T.panel.innerHTML='';T.dock.innerHTML=`<button class="btn ${T.failed?'danger':'primary'}" id="count">${T.failed?'SEE WHAT IT COST':'COUNT IT UP'}</button>`;
  await new Promise(rs=>tap($('#count',T.el),rs,'tap'));
 }
 return {rec:r.value,report:late.report,morning:late.morning,log:SC?SC.log:[]};
}

// ---------------------------------------------------------------------------------------------------------------- REPORT
const TRY={SEAT:c=>`Try: ${(c.t.match(/\(([^)]+)\)/)||[])[1]||'seat the counter where the tell hits'}.`,CHOICE:()=>'Try: bring the Oga who counters it.',CAR:()=>'Try: a different car, or somebody else on the wheel.',GREED:()=>'Try: TAKE THE WIN one step earlier.',
 WEAPON:()=>'Try: hand the gun to somebody who can use it (WHO GETS IT?).',TRAIT:()=>'Try: keep that Oga away from what sets them off, or seat them by a friend.',EARLIER:()=>'Try: FOLD sooner, or SAVE the one who is down first.',RELATIONSHIP:()=>'Try: seat friends together.'};
const YOURS=new Set(['SEAT','CHOICE','CAR','GREED','WEAPON','TRAIT','EARLIER','RELATIONSHIP']);
function reportScreen(out,rec,job,sel){
 return new Promise(res=>{
  const rp=out.report;if(!rp){res();return;}
  const w=S.w;const tone=KLASS_TONE[rp.klass]||'mid';
  const crew=rec.crew.map(id=>{const o=oga(id)||S.curRoster.find(x=>x.id===id)||{id,short:id,cls:'MUSCLE',traits:[]};const st=rp.status[id]||'READY';return `<div class="rc ${st}">${plate(o,{state:['DEAD','CAPTURED','GONE','SHOT'].includes(st)?'DOWN':'UP',hurt:st==='WOUNDED'})}<span class="nm">${esc(o.short)}</span><span class="st">${esc(st)}</span></div>`;}).join('');
  const losses=(rp.losses||[]).filter(l=>l.kind!=='WOUNDED'||rp.losses.length<3).map(l=>{const c=l.cause||{};const yours=YOURS.has(c.c);const who=l.who&&oga(l.who)?oga(l.who).short:'';
   return `<div class="loss ${yours?'you':''}"><b>${esc(l.kind)}</b> — ${esc(l.text)}${c.t?`<span class="why"><b>${esc(c.c)}</b>because ${esc(c.t)}</span>`:''}${yours&&TRY[c.c]?`<span class="try">${esc(TRY[c.c](c))}</span>`:!yours&&c.c==='ENEMY'?'<span class="try">Every enemy trick has a counter on the CAR screen.</span>':''}</div>`;}).join('');
  const lines=(rp.lines||[]).filter((l,i)=>i>0&&(/^(MVP|NO SCRATCH|FOLD)/.test(l)||rp.turnMoment&&l===rp.turnMoment)).map(l=>`<div class="line ${/^NO SCRATCH/.test(l)?'green':/^MVP/.test(l)?'gold':''}">${esc(l)}</div>`).join('');
  const banked=rp.klass==='FELL_BACK'?'THE RAID PRODUCT IS GONE · what you already banked is safe':rp.klass==='BAILED'?'THE POT STAYED BEHIND · what you already banked is safe':rp.win?`BANKED $${Math.round(rp.cash)}K + ${rp.crates} crate${rp.crates===1?'':'s'} · street value ~$${rp.final}K`:'NOTHING BANKED'+(rp.pocketLoss?` · −$${rp.pocketLoss}K from Rich’s pocket`:'');
  const replay=out.log.map(l=>`<div class="r"><b>${esc(l.stage)}</b>${esc(l.text)}${l.opt&&l.opt!=='DEFAULT'?` <span class="tag cyan">CALL ${esc(l.opt)}</span>`:''}${l.smartVerb&&l.opt!==l.smartVerb&&l.smart?`<br><span class="dim">the angle was: ${esc(l.smart)}</span>`:''}${l.moments.map(m=>`<br>· ${esc(m)}`).join('')}</div>`).join('');
  const dev=prefs.get().dev&&rec.script?`<details class="replay"><summary>ENGINE LOG (dev)</summary><div class="devbox">${esc(rec.script.map(s=>'['+s.sec+'] '+s.line).join('\n'))}</div></details>`:'';
  const el=h(`<div class="screen" id="report"><div class="scroll">
   <div class="klass ${tone}"><div class="k">${esc(KLASS_HEAD[rp.klass]||rp.klass)}</div><div class="sub">${esc(banked)}</div>${rp.noScratch?'<div class="stamp">NO SCRATCH · BONUS CRATE</div>':''}</div>
   <div class="crewreport">${crew}</div>
   ${lines}${losses?`<div class="h2">WHAT IT COST — AND WHY</div>${losses}`:''}
   ${rec.rescued&&rec.rescued.length?`<div class="line green">RESCUED: ${esc(rec.rescued.map(id=>(oga(id)||{short:id}).short).join(' and '))} — home, and they will not forget it.</div>`:''}
   ${(rp.newCombos||[]).length?`<div class="line gold">NEW IN THE CREW BOOK: ${esc(rp.newCombos.join(' · '))}</div>`:''}
   ${rp.status&&Object.values(rp.status).includes('CAPTURED')?`<div class="banner red"><span class="px" style="color:var(--red)">CAPTURED</span>They are being held. You have ${W.CLOCK_START-1} nights — getting them back is a free EXTRACT job, and the last night you can pay the ransom.</div>`:''}
   <details class="replay"><summary>HOW IT WENT (the whole night)</summary>${replay}</details>${dev}
   <div style="height:70px"></div></div>
   <div class="dock"><button class="btn primary" id="rc">${rp.win?'THE MORNING AFTER':'THE MORNING AFTER'}</button></div></div>`);
  setScreen(el);
  SFX.play(rp.win?'win':'lose');
  tap($('#rc',el),()=>res(),'tap');
 });
}

// ---------------------------------------------------------------------------------------------------------------- MORNING AFTER
const TEMPT_LABEL={RESCUE:'SOMEBODY IS OUT THERE',RETALIATION:'TROUBLE COMING',RECRUIT:'A NEW FACE',RARE_PITCH:'SOMETHING SHINY',DEMAND:'THE BLOCK IS HUNGRY',INTEL:'YOU CLOCKED SOMETHING'};
function morningScreen(out,rec,job,after){
 return new Promise(async res=>{
  const m=out.morning;if(!m){res();return;}
  const w=S.w;const rp=out.report||{};
  const texts=m.texts.map(t=>{const nm=(t.match(/^([^:]+):/)||[])[1];const o=w.roster.find(x=>x.short===nm||x.name===(nm||'').toUpperCase());return `<div class="bub">${o?plate(o,{},'sm'):''}<div class="b"><em>${esc(nm||'CREW CHAT')}</em>${esc(t.replace(/^[^:]*: ?/,''))}</div></div>`;});
  const pills=[];
  for(const n of m.nicks){const o=oga(n.id);pills.push(`<span class="pill">${plate(o,{},'sm')} <span>${esc(o?o.short:'')} earns a nickname: <b style="color:var(--gold)">“${esc(n.nick)}”</b></span></span>`);}
  for(const s of m.seeds){const o=oga(s.who);pills.push(`<span class="pill">${plate(o,{},'sm')} <span>STORY seed: <b>${esc(s.text)}</b></span></span>`);}
  if(rec.newBond)pills.push(`<span class="pill">♥ DAY ONES: ${esc(rec.newBond.map(id=>(oga(id)||{short:id}).short).join(' & '))}</span>`);
  if(rec.turned)pills.push(`<span class="pill">🧛 A NEW OGA JOINED (TURNED)</span>`);
  if(rec.recruited)pills.push(`<span class="pill">➕ A NEW OGA JOINED</span>`);
  if(rp.foldLine)pills.push(`<span class="pill">🔎 ${esc(rp.foldLine)}</span>`);
  const away=w.roster.filter(o=>o.status!=='READY').map(o=>`<span class="pill">${plate(o,{state:'DOWN'},'sm')}<span>${esc(o.short)}<br><span class="dim" style="font-size:10px">${esc(statusLabel(o,w))}</span></span></span>`).join('');
  const t=m.temptation;
  const nextLabel=after==='EXTRACT'?'BACK TO TONIGHT’S BOARD':'NEXT NIGHT →';
  const el=h(`<div class="screen" id="morning"><div class="scroll">
   <div class="h1">THE MORNING AFTER</div><div class="dim small" style="margin:-2px 0 12px">KOREATOWN wakes up.</div>
   <div id="mstack"></div>
   <div style="height:70px"></div></div>
   <div class="dock"><button class="btn primary" id="nextnight">${esc(nextLabel)}<span class="sub">${t?esc(TEMPT_LABEL[t.type]||''):''}</span></button></div></div>`);
  setScreen(el);
  S.morningAt=1;S.morningTapped=false;tele.start('morning');
  const stack=$('#mstack',el);
  const add=async(html,sfx,ms=520)=>{stack.insertAdjacentHTML('beforeend',html);if(sfx)SFX.play(sfx);el.querySelector('.scroll').scrollTop=0;await wait(ms);};
  tap($('#nextnight',el),()=>{tele.log('M2NEXT_NIGHT',{ms:tele.since('morning')});res();},'tap');
  await add(`<div class="gram"><div class="hd">📸 VAMPGRAM<i>@whosrunninLA</i></div><div class="bd">${esc(m.vg.replace(/^@\w+:\s*/,''))}</div><div class="ft">${rp.noScratch?'🏅 NO SCRATCH brag':'♡ ♡ ♡ 2,1'+((rec.seed%9)+1)+'K'}</div></div>`,'gram',700);
  for(const t2 of texts)await add(t2,'text',480);
  if(pills.length)await add(`<div style="margin:6px 0">${pills.join('')}</div>`,'tap',420);
  await add(`<div class="mnote">${esc(m.district)}</div>`,null,250);
  if(away)await add(`<div class="h2">WHILE YOU SLEPT</div><div>${away}</div>`,null,300);
  if(t)await add(`<div class="tempt ${t.type}"><span class="px">${esc(TEMPT_LABEL[t.type]||t.type)}</span><div class="t">${esc(t.text.replace(/^([^:]{2,24}): /,'$1: '))}</div></div>`,'tempt',300);
  if(!counter.tipSeen('morning'))tip('morning','TIP · ONE TAP BACK','Everything you just read shapes tomorrow. Hit the button and the next pitch is waiting.');
 });
}

// ---------------------------------------------------------------------------------------------------------------- flow
function buildBoard(){
 const w=S.w;const gb=W.gateBoard(w);
 const pitches=gb.pitches.map(p=>{const t=W.pitchText(w,p.job,p.pitcher);return {...p,quote:t.text,full:t.full,card:W.pitchCard(p.job,p.nameIdx,p.intel)};});
 const ready=W.readyOnes(w);
 const extracts=(w.captives||[]).map(g=>{const job=W.extractJob(w,g);const pid=['dre','tunde','half_pint','young_mazi'].find(id=>ready.some(o=>o.id===id))||(ready[0]&&ready[0].id)||'dre';
  const names=g.ids.map(id=>(oga(id)||{short:id}).short).join(' and ');
  const quote=`${g.clock===1?'This is the last night.':'The clock is running.'} They’re holding ${names}. We go in quiet, we come out with everybody.`;
  return {job,pitcher:pid,nameIdx:0,quote,full:quote,card:{...W.pitchCard(job,0,false),top:8,floor:4,shown:'STORY'},extract:true,g};});
 return {notice:gb.notice,pitches,extracts};
}
function startNight(){
 const w=S.w;
 if(!(w.ui&&w.ui.open===w.night&&!w.ui.used)){W.advanceNight(w);w.ui={open:w.night,used:false};tele.log('NIGHT',{night:w.night});}
 S.board=buildBoard();saveWorld();hud();
}
async function playOne(pick){
 const w=S.w,job=pick.job,isX=pick.kind==='EXTRACT';
 const cfg={seed:w.seed*1000+w.night*10+(isX?1:2),job,policy:'driver',opts:{},night:w.night,pitcher:pick.pitcher,nameIdx:pick.nameIdx,pitchText:pick.full,state:w,intel:!!pick.intel};
 S.curCfg={...cfg,state:structuredClone(w),nameIdx:pick.nameIdx};
 S.curRoster=structuredClone(w.roster);
 tele.log('PLAY_START',{job:job.id,seed:cfg.seed,night:w.night});tele.start('play');
 const out=await drive(cfg);
 const rec=out.rec;
 S.last={cfg:S.curCfg,rec,out};
 W.applyResult(w,rec,job);
 if(!isX)w.ui.used=true;
 const n=counter.bump();
 tele.log('PLAY_END',{job:job.id,win:rec.win,klass:rec.klass,ms:tele.since('play'),plays:n});
 saveWorld();hud();
 await reportScreen(out,rec,job);
 await morningScreen(out,rec,job,isX?'EXTRACT':'NIGHT');
 return {rec,isX};
}
async function mainLoop(){
 for(;;){
  const w=S.w;
  if(!S.board||(w.ui&&w.ui.used)){startNight();}
  const c=await pitchScreen();
  if(c.kind==='REFRESH'){S.board=buildBoard();continue;}
  if(c.kind==='LAYLOW'){w.recent=[...w.recent.slice(-2),[...(w.boardSeen||[])]];w.boardSeen=[];w.ui.used=true;saveWorld();continue;}
  const {isX}=await playOne(c);
  if(isX){S.board=buildBoard();}
 }
}

// ---------------------------------------------------------------------------------------------------------------- boot
function splash(){
 return new Promise(res=>{
  const el=h(`<div class="screen splash"><div class="logo">THE<br><span>PLAY</span></div><p>Six Ogas, one hooptie, a bad idea, and a whole night in Koreatown. Pitch it. Pick the car. Seat the crew. Make the call. Count the trunk.</p><p class="dim small">Then somebody says <b>“one more.”</b></p><button class="btn primary pulse" id="start">START THE NIGHT</button><div class="dim small">Feel-gate sandbox · placeholder art and sound</div></div>`);
  setScreen(el);tap($('#start',el),()=>{SFX.unlock();res();},'go');
 });
}
function resetCareer(){
 store.del('world');store.del('lastCrew');location.reload();
}
export async function boot(){
 const app=$('.app');
 const q=S.params;
 if(q.get('fresh')==='1'){store.del('world');store.del('tele');store.del('lastCrew');store.del('counter');try{const u=new URL(location.href);u.searchParams.delete('fresh');history.replaceState(null,'',u.toString());}catch(e){}}
 if(q.get('dev')==='1')prefs.set({dev:true});
 if(q.get('calm')==='1')prefs.set({calm:true});
 if(q.get('devbig')==='1'){const w0=store.get('world',null);if(w0){w0.devBig=true;store.set('world',w0);}}
 if(q.get('mute')==='1')prefs.set({sound:false});
 if(q.get('fast')){pace.speed=+q.get('fast')||0.05;}
 const seed=q.get('seed')?+q.get('seed'):(Math.floor(Math.random()*90000)+1000);
 let w=store.get('world',null);if(!w||w.v!==1){w=W.newWorld(seed);w.v=1;}
 S.w=w;applyPrefs();hud();
 $('#hud').addEventListener('click',e=>{if(e.target.closest('#menubtn')){SFX.unlock();SFX.play('tap');if(S.menuOpen)return;S.menuOpen=true;menuPanel({onReset:resetCareer,onHold:forceHold,onBig:forceBig});}});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.menu-panel');if(m){m.remove();S.menuOpen=false;}}});
 // dev bar
 app.insertAdjacentHTML('beforeend',`<div class="devbar ${prefs.get().dev?'':'hidden'}" id="devbar"></div>`);
 setInterval(()=>{const d=$('#devbar');if(d&&!d.classList.contains('hidden'))d.textContent=`seed ${S.w.seed} · night ${S.w.night} · plays ${counter.get().plays} · M2P ${JSON.stringify(tele.summary().morningToPitchTapMs.slice(-3))}`;},500);
 window.__raPlay={S,W,E,C,tele,counter,store,SFX,pace,replayCheck,forceHold,forceBig,boot:null,get scene(){return SC;},get trunk(){return T;}};
 if(!(counter.get().plays>0||w.night>0))await splash();
 try{await mainLoop();}catch(err){
  console.error(err);tele.log('ERROR',{msg:String(err&&err.stack||err)});
  setScreen(h(`<div class="screen"><div class="scroll"><div class="h1">SOMETHING BROKE.</div><p>The night crashed. Your save is safe — reload to resume the pitch.</p><div class="devbox">${esc(String(err&&err.stack||err))}</div></div><div class="dock"><button class="btn primary" onclick="location.reload()">RELOAD</button></div></div>`));
 }
}

// QA helper: make tonight's pitch board the HOLD THE HOUSE raid (also in the menu under DEV MODE)
export function forceHold(){S.w.pending={night:S.w.night,kind:'HOLD'};saveWorld();location.reload();}

// QA helper: offer the BIG PLAY on the board (dev only) so its stakes presentation can be inspected
export function forceBig(){S.w.devBig=true;S.board=null;if(S.w.ui)S.w.ui.used=false;saveWorld();location.reload();}

// deterministic replay: rerun the last PLAY headlessly from its recorded answers and compare the outcome
export function replayCheck(){
 const L=S.last;if(!L)return {ok:false,reason:'no play yet'};
 const ans=[...L.rec.answers];let i=0;
 const cfg={...L.cfg,state:structuredClone(L.cfg.state)};
 E.setSink(null);
 const rec2=E.runPlay(cfg,pr=>{const a=ans[i++];if(!a||a.t!==pr.type)return undefined;return pr.type==='CLIMB'||pr.type==='TURN'?a.a:a.a;});
 const pick=r=>JSON.stringify({win:r.win,final:r.final,klass:r.klass,fs:r.finalStatus,pot:r.pot,steps:r.steps,getaway:r.getaway});
 return {ok:pick(rec2)===pick(L.rec),a:pick(L.rec),b:pick(rec2)};
}
