// F01 THE PLAY — the small persistent world around the PLAY: nights, the roster's recovery, captives and the EXTRACT clock, RANSOM, cash and HEAT,
// pitch boards, line-repeat memory. Shared by the paper-sim careers and the browser sandbox (one source of truth). JSON-serialisable.
import {stream,D} from './env.mjs';
import * as C from './content.mjs';
import {startRoster} from './engine.mjs';
import {pickLine} from './lines.mjs';

export const CAP=9;                       // J.2: 8 base seats + 1 district (Koreatown) — F13 tunes
export const CLOCK_START=4;                // 3 nights to act (4 → 3 → 2 → 1 = last night, RANSOM) then expiry
const shuffle=(R,a)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=R.int(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};

export function newWorld(seed,{cap=CAP}={}){
 const w=startRoster(seed,{cap});
 Object.assign(w,{seed,night:0,cash:25,heat:0,captives:[],corun:{},gone:[],dead:[],recruited:0,plays:0,recent:[],comboCd:{},turnCd:0,intel:[],pending:null,lastShape:null,lastBoardSpecs:[],armory:[],stats:{extracts:0,extractWins:0,ransomsPaid:0,ransomsMissed:0,jobs:0},telemetry:[]});
 return w;
}

// ---- nights
export function advanceNight(w){
 w.night++;
 for(const o of w.roster){
  if(['WOUNDED','SHOT'].includes(o.status)){o.away--;if(o.away<=0){o.status='READY';o.hp=o.maxhp;}}
 }
 for(const k of Object.keys(w.cars))if(w.cars[k]>0)w.cars[k]--;
 for(const k of Object.keys(w.comboCd))if(w.comboCd[k]>0)w.comboCd[k]--;
 if(w.turnCd>0)w.turnCd--;
 w.heat=Math.max(0,w.heat*.85);
 // captives: the EXTRACT clock. Expired = GONE (Vol 7, authored) unless RANSOM was paid.
 const keep=[];
 for(const g of w.captives){
  g.clock--;
  if(g.clock<=0){
   for(const id of g.ids){const o=w.roster.find(x=>x.id===id);if(o){o.status='GONE';w.gone.push(id);}}
   w.roster=w.roster.filter(o=>o.status!=='GONE');
   w.stats.ransomsMissed+=1;
  }else keep.push(g);
 }
 w.captives=keep;
 w.intel=w.intel.filter(x=>w.night-x.night<=4);
}
export const readyOnes=w=>w.roster.filter(o=>o.status==='READY');
export const ransomCost=(w,g)=>Math.round(25+w.heat*.8+10*g.ids.length);
export function captiveInfo(w){
 return w.captives.map(g=>({gid:g.gid,ids:g.ids,names:g.ids.map(id=>(w.roster.find(o=>o.id===id)||{short:id}).short),clock:g.clock,lastNight:g.clock===1,cost:ransomCost(w,g),affordable:w.cash>=ransomCost(w,g)}));
}
export function payRansom(w,gid){
 const g=w.captives.find(x=>x.gid===gid);if(!g)return false;const cost=ransomCost(w,g);if(w.cash<cost)return false;
 w.cash-=cost;for(const id of g.ids){const o=w.roster.find(x=>x.id===id);if(o){o.status='WOUNDED';o.away=1;o.hp=Math.ceil(o.maxhp/2);}}
 w.captives=w.captives.filter(x=>x!==g);w.stats.ransomsPaid++;return true;
}
export function extractJob(w,g){
 const base=C.JOBS.find(j=>j.id==='quiet_lift');const names=g.ids.map(id=>(w.roster.find(o=>o.id===id)||{short:id}).short);
 const who=names.length>1?names.join(' and '):names[0];
 return {...base,id:'extract',shape:'EXTRACT',names:[`GET ${who.toUpperCase()} BACK`,`NOBODY LEAVES THE ROOM`,`RETURN TO SENDER`],pitchers:['dre','tunde'],band:[4,8],ugly:'TOUGH',
  tell:'a locked room and two very bored guards',place:`the room where they are keeping ${who}`,favors:'ANY',size:[2,3],octopus:null,tilt:{CASH:2,BLOOD_X:0,GUN:1,MOD:1,RECRUIT:0,STORY:4,DISTRICT:0,WEIRD:2},heat:3,silhouettes:['STORY','CASH'],gid:g.gid};
}

// ---- boards
const HOLD=()=>C.JOBS.find(j=>j.defense),BIG=()=>C.JOBS.find(j=>j.bigPlay);
export function makeBoard(w,pool,R,ctx={}){ // paper-sim boards: rules B (distinct shapes, not last night's shape, no spec from last night, unique pitchers)
 const avail=readyOnes(w);const n=R.chance(.45)?3:2;const pitches=[];const shapes=new Set();const pitchers=new Set();
 const okPitcher=(j,strict)=>j.pitchers.find(id=>avail.some(o=>o.id===id)&&(!strict||!pitchers.has(id)))||(strict?avail.find(o=>o.named&&!pitchers.has(o.id)&&C.PITCH_LINES[o.id])?.id:undefined);
 const prev=new Set(w.lastBoardSpecs||[]);
 for(const [avoidPrev,strictP] of [[true,true],[true,false],[false,true],[false,false]]){
  for(const j of shuffle(R,pool)){
   if(pitches.length>=n)break;
   if(j.shape===w.lastShape||shapes.has(j.shape)||pitches.some(p=>p.job.id===j.id))continue;
   if(avoidPrev&&prev.has(j.id))continue;
   const pid=okPitcher(j,strictP);if(!pid)continue;
   pitches.push({job:j,pitcher:pid,nameIdx:R.int(0,j.names.length-1)});shapes.add(j.shape);pitchers.add(pid);
  }
  if(pitches.length>=n)break;
 }
 if(!pitches.length){const j=shuffle(R,pool)[0];const a=avail.find(o=>o.named)||avail[0];if(a)pitches.push({job:j,pitcher:a.id,nameIdx:R.int(0,j.names.length-1)});}
 if(ctx.big&&BIG()&&avail.length>=4&&R.chance(.5)&&BIG().shape!==w.lastShape){
  const j=BIG();const pid=okPitcher(j,false);
  if(pid){const clash=pitches.findIndex(p=>p.job.shape===j.shape);if(clash>=0)pitches.splice(clash,1);pitches.push({job:j,pitcher:pid,nameIdx:R.int(0,j.names.length-1),big:true});}
 }
 return pitches;
}
// ---- the feel-gate board: Koreatown, two hand-authored normal jobs (LOUD stick-up, QUIET lift) + HOLD THE HOUSE as a NOTICE when retaliation lands.
// With only two shapes the "never the same shape twice in a row" rule cannot hold; it is suspended for the gate and logged as a known limit.
export const GATE_JOBS=['car_wash_stickup','quiet_lift','hold_the_house'];
export function gateBoard(w){
 const avail=readyOnes(w);const R=stream(w.seed,'gateboard|'+w.night);
 if(w.pending&&w.pending.night<=w.night&&avail.length>=3){
  const j=HOLD();return {notice:true,pitches:[{job:j,pitcher:'auntie_grit',nameIdx:R.int(0,j.names.length-1),notice:true}]};
 }
 const pitches=[];const used=new Set();
 for(const id of (w.night%2?['car_wash_stickup','quiet_lift']:['quiet_lift','car_wash_stickup'])){
  const j=C.JOBS.find(x=>x.id===id);
  let cand=j.pitchers.filter(p=>avail.some(o=>o.id===p)&&!used.has(p));
  if(!cand.length)cand=avail.filter(o=>o.named&&!used.has(o.id)&&C.PITCH_LINES[o.id]).map(o=>o.id);
  if(!cand.length)cand=avail.filter(o=>o.named&&C.PITCH_LINES[o.id]).map(o=>o.id);
  if(!cand.length)continue;
  const pid=cand[(w.night+id.length)%cand.length];used.add(pid);
  // a returning job from a FOLD comes back as a better pitch
  const intel=w.intel.find(x=>x.job===id);
  pitches.push({job:j,pitcher:pid,nameIdx:(w.night+pitches.length)%j.names.length,intel:!!intel});
 }
 // QA only (?devbig=1 / DEV MODE): the BIG PLAY is offered so the stakes presentation can be inspected. Off by default; the gate board ships 3 jobs.
 if(w.devBig&&avail.length>=4){const bj=BIG();const pid=bj.pitchers.find(p=>avail.some(o=>o.id===p))||avail.find(o=>o.named&&C.PITCH_LINES[o.id]).id;pitches.push({job:bj,pitcher:pid,nameIdx:w.night%bj.names.length,intel:false});}
 return {notice:false,pitches};
}

// ---- applying a finished PLAY to the world
const addGeneric=(w,R,turnedBy)=>{
 const used=new Set(w.roster.map(o=>o.name.toLowerCase()));const nm=C.GENERIC_NAMES.find(n=>!used.has(n.toUpperCase()))||('Cousin '+R.int(10,99));
 const cl=R.pick(['SHOOTER','MUSCLE','TALKER','GHOST','WHEELS','DOC']);const c=D.CLASSES[cl];const q=R.pick(C.QUIRKS);
 w.roster.push({id:'g'+(100+w.recruited++),name:nm.toUpperCase(),short:nm,cls:cl,named:false,human:!turnedBy,vampire:!!turnedBy,traits:[q],quirk:q,gun:'pistol',maxhp:c.hp,hp:c.hp,aim:c.aim,nerve:50,base:50,scars:[],nick:null,perks:[],status:'READY',away:0,mvp:0,saved:[],hist:[],plays:0,turnedBy:turnedBy||null});
};
export function applyResult(w,rec,job){
 const R=stream(w.seed,'apply|'+w.night+'|'+w.plays);
 const so=rec.stateOut;
 let cg=null;
 for(const o of so.roster){
  const st=rec.finalStatus[o.id];
  if(!rec.crew.includes(o.id)){/* stayed home */}
  else if(st==='DEAD')o.status='DEAD';
  else if(st==='GONE'){o.status='GONE';w.gone.push(o.id);}
  else if(st==='CAPTURED'){o.status='CAPTURED';}
  else if(st==='SHOT'){o.status='SHOT';o.away=2;if(!o.scars.length)o.scars.push('a limp');}
  else if(st==='WOUNDED'){o.status='WOUNDED';o.away=1;}
  else{o.status='READY';o.hp=o.maxhp;}
  if(rec.crew.includes(o.id)){
   const nEnd=(rec.nerveEnd.find(([id])=>id===o.id)||[0,o.nerve])[1];
   if(o.status==='SHOT'||nEnd<30)o.base=Math.max(40,o.base-2);
   if(rec.win&&nEnd>=55)o.base=Math.min(85,o.base+(o.named?1:0));
  }
 }
 // captives → ONE group per PLAY (OL-016 R1a): a single EXTRACT rescues everyone taken in that PLAY
 const capIds=so.roster.filter(o=>o.status==='CAPTURED'&&!w.captives.some(g=>g.ids.includes(o.id))).map(o=>o.id);
 if(capIds.length){cg={gid:'c'+w.night+'p'+w.plays,ids:capIds,clock:CLOCK_START,from:rec.jobName};w.captives.push(cg);}
 // morning-after: nickname, story seed (nerve baseline nudge), scars
 if(rec.morning){
  for(const n of rec.morning.nicks){const o=so.roster.find(x=>x.id===n.id);if(o&&!o.nick)o.nick=n.nick;}
  for(const sd of rec.morning.seeds){const o=so.roster.find(x=>x.id===sd.who);if(!o)continue;
   if(sd.perk==='got_everybody_out'){if(!o.perks.includes(sd.perk))o.perks.push(sd.perk);continue;} // OL-020: a CREW BOOK memory only — no stat, no XP, no nerve nudge
   if(o.perks.length<D.STORY_NUMBERS.maxStories){o.perks.push(sd.perk);o.base=Math.min(85,o.base+(o.traits.includes('BIG_POTENTIAL')?4:2));}}
 }
 w.roster=so.roster.filter(o=>o.status!=='DEAD'&&o.status!=='GONE');
 for(const o of w.roster){o.nerve=o.base;o.fled=false;o.out=null;}
 w.bonds=so.bonds;w.known=so.known;w.cars=so.cars;w.weirdSeen=so.weirdSeen;w.armory=so.armory||w.armory;
 // DAY ONES: two Ogas who run 3 jobs together
 for(let i=0;i<rec.crew.length;i++)for(let j=i+1;j<rec.crew.length;j++){const k=[rec.crew[i],rec.crew[j]].sort().join('+');w.corun[k]=(w.corun[k]||0)+1;
  if(w.corun[k]>=3&&!w.bonds.some(b=>b.includes(rec.crew[i])&&b.includes(rec.crew[j]))&&w.roster.some(o=>o.id===rec.crew[i])&&w.roster.some(o=>o.id===rec.crew[j])){w.bonds.push([rec.crew[i],rec.crew[j]]);rec.newBond=[rec.crew[i],rec.crew[j]];}}
 if(rec.crashOut)w.cars[rec.car]=rec.crashOut;
 // economy: banked cash only; jugged/robbed PLAYs bank nothing; Rich's pocket pays call costs and a small ROBBED share
 if(rec.win)w.cash+=rec.pot.cash;
 w.cash=Math.max(0,w.cash-(rec.spent||0)-(rec.pocketLoss||0));
 w.heat+=rec.heatDelta||0;
 // turning v1: only with a free seat, 3-night cooldown; a fresh willing generic joins
 if(rec.turn&&rec.turn.offered&&rec.turn.result&&rec.turn.result.startsWith('TAKES')){addGeneric(w,R,rec.turn.turner);rec.turned=true;w.turnCd=3;}
 else if(rec.pot.crates.some(c=>c.cat==='RECRUIT')&&rec.win&&w.roster.length<w.cap&&R.chance(.6)){addGeneric(w,R,null);rec.recruited=true;}
 // EXTRACT frees the whole group
 if(job.id==='extract'&&rec.win){
  const g=w.captives.find(x=>x.gid===job.gid);
  if(g){for(const id of g.ids){const o=w.roster.find(x=>x.id===id);if(o){o.status='READY';o.hp=o.maxhp;o.away=0;o.perks.push('rescued');}}w.captives=w.captives.filter(x=>x!==g);rec.rescued=g.ids;w.stats.extractWins++;}
 }
 if(job.id==='extract')w.stats.extracts++;else w.stats.jobs++;
 // a FOLD leaves intel: the job returns later as a better pitch
 if(rec.foldIntel)w.intel.push({job:job.id,night:w.night});
 if(job.id!=='extract'&&rec.win&&w.intel.some(x=>x.job===job.id))w.intel=w.intel.filter(x=>x.job!==job.id);
 // retaliation: a RETALIATION temptation may become tomorrow's HOLD THE HOUSE notice
 if(rec.morning?.temptation?.type==='RETALIATION'&&R.chance(.6))w.pending={night:w.night+1,kind:'HOLD'};
 if(job.defense)w.pending=null;
 // combo cooldown: a combo that just revealed itself rests for 10 nights so a signature combo stays a discovery
 for(const c of rec.firedCombos||[])w.comboCd[c]=10;
 // line memory: no line repeats within 3 PLAYs
 w.recent=[...w.recent.slice(-2),[...(rec.lineLog||[]),...(w.boardSeen||[])]];w.boardSeen=[];
 w.plays++;
 w.lastShape=job.shape;
}

// ---- pitch cards (the board shows these before the PLAY exists)
export function pitchText(w,job,pitcherId){
 const P={seed:w.seed*7+w.night*13+pitcherId.length*3+job.id.length,recentSet:new Set([...w.recent.flat(),...(w.boardSeen||[])]),recentAge:{},usedLines:new Set(),lineLog:[],lineN:0,sim:false};
 const t=pickLine(P,'pitch:'+pitcherId,{spot:job.place})||'';
 (w.boardSeen=w.boardSeen||[]).push(...P.lineLog);
 return {text:t.replace(/^[^:]*: /,''),full:t,ids:P.lineLog};
}
export function pitchCard(job,nameIdx,intel){
 return {name:job.names[nameIdx],take:`UP TO $${job.band[1]}K`,floor:job.band[0],top:job.band[1],shown:job.silhouettes[0],ugly:job.ugly,who:job.faction,tell:job.tell,shape:job.shape,defense:!!job.defense,bigPlay:!!job.bigPlay,intel:!!intel};
}
