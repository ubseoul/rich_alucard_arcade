(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — entry / result packets and the seams to the other fragments.
 //   F01 owns TACTICAL EXECUTION.  F04 owns strategic setup and result consumption; F02 owns guns; F05/F07 own Trap / finale
 //   content. This file only translates: it invents no War Room state, no Trap logic, no finale story.
 const D=root.RAShowdownData,E=root.RAShowdownEngine,M=root.RAShowdownMaps;
 const clone=v=>JSON.parse(JSON.stringify(v));

 // ---- the six named Ogas (Vol 7 6.3): ids match F04's RACrew definitions ----
 const NAMED={
  tunde      :{name:'TUNDE'      ,cls:'MUSCLE' ,race:'HUMAN'  ,traits:['CALM','ALWAYS_EATING']},
  dre        :{name:'DRE'        ,cls:'TALKER' ,race:'VAMPIRE',traits:['MOUTHPIECE','PHONE_OUT']},
  half_pint  :{name:'HALF-PINT'  ,cls:'GHOST'  ,race:'VAMPIRE',traits:['SMALL','IMPATIENT']},
  sunday_best:{name:'SUNDAY BEST',cls:'SHOOTER',race:'VAMPIRE',traits:['DRESSED_TO_KILL','CHURCH_SHOES']},
  young_mazi :{name:'YOUNG MAZI' ,cls:'WHEELS' ,race:'VAMPIRE',traits:['ROOKIE','BIG_POTENTIAL']},
  auntie_grit:{name:'AUNTIE GRIT',cls:'DOC'    ,race:'HUMAN'  ,traits:['SEEN_IT_ALL','SIT_DOWN']}
 };

 // ---- mission profiles: the reusable entry contract. Consumers add their own with registerProfile (F05 / F07 hooks). ----
 const profiles={
  TAKE_THE_BLOCK:{objective:{kind:'ELIMINATE'},source:'F04'},
  EXTRACT       :{objective:{kind:'EXTRACT_TARGET'},needsCaptive:true,source:'F04'},
  RETALIATION   :{objective:{kind:'ELIMINATE'},source:'F04'},
  HAND_BACK     :{objective:{kind:'ELIMINATE'},source:'F04'},
  EMERGENCY     :{objective:{kind:'ELIMINATE'},turnLimit:D.TUNABLES.emergencyTurns,source:'F04'},
  TRAP_RAID     :{objective:{kind:'ELIMINATE'},source:'F05'},
  TRAP_DEFENSE  :{objective:{kind:'SURVIVE',turns:4},source:'F05'},
  FINALE        :{objective:{kind:'ELIMINATE'},source:'F07'},
  SANDBOX       :{objective:{kind:'ELIMINATE'},source:'F01'}
 };
 function registerProfile(id,spec){
  if(!/^[A-Z][A-Z0-9_]*$/.test(id||''))throw new Error('profile ids are UPPER_SNAKE');
  if(profiles[id])throw new Error(`profile ${id} already registered by ${profiles[id].source}`);
  if(!spec||!spec.objective||!['ELIMINATE','EXTRACT_TARGET','SURVIVE'].includes(spec.objective.kind))throw new Error('profile needs objective.kind ELIMINATE|EXTRACT_TARGET|SURVIVE');
  profiles[id]={...clone(spec),source:spec.source||'external'};return id;
 }

 // ---- F02 seam: per-gun Showdown stats -> F01 weapon definitions ----
 let f02=null;
 const F02_EFFECTS={
  lil_oga:{owNeverMiss:true,longPenalty:true},
  sapporo_shotgun:{closeBonus:true},
  mac_and_cheese:{onHit:{suppress:true}},
  chopstick_sniper:{noMoveShoot:true},
  tommy_tony:{},
  holy_baby_drake:{vsUndead:2,healSelf:1},
  jollof_burner:{destroysCover:true},
  blueberry_blaster:{condition:'mazdaMajestic'},
  legendary_draco:{bursts:2,burstAim:-10},
  golden_draco:{bursts:2,onHit:{blind:true}},
  rpg:{destroysCover:true,perShowdown:1,heat:10},
  auntie_slipper:{onHit:{knockback:true}},
  triple_k_kratos:{}
 };
 const BAND={close:'close',mid:'medium',medium:'medium',long:'long',area:'long'};
 function parseDamage(v){
  if(typeof v==='number')return {dmg:[v,v],hits:1};
  const s=String(v);let m=/^(\d+)\s*[x×]\s*(\d+)$/i.exec(s);if(m)return {dmg:[+m[1],+m[1]],hits:+m[2]};
  m=/^(\d+)\s*[-–]\s*(\d+)$/.exec(s);if(m)return {dmg:[+m[1],+m[2]],hits:1};
  m=/^(\d+)$/.exec(s);if(m)return {dmg:[+m[1],+m[1]],hits:1};
  return null;
 }
 function convertF02(id,st,base){
  const p=parseDamage(st.damage);if(!p)return null;
  const eff=F02_EFFECTS[id]||{};
  const def={id,label:(base&&base.label)||id.toUpperCase().replace(/_/g,' '),dmg:p.dmg,band:BAND[st.range]||'medium',clip:(base&&base.clip)||3,src:'f02',note:st.note||'',...eff};
  if(p.hits>1&&!def.bursts)def.hits=p.hits;
  if(st.range==='area'){def.area=st.area==='cone3'?'cone3':'3x3';}
  if(base&&base.clip)def.clip=base.clip;
  return def;
 }
 // bindF02(iron): iron = RAIronShowdown-like {stats(id), roster()}. Returns the report; stores it for entry building.
 function bindF02(iron){
  iron=iron||root.RAIronShowdown||(root.RAIronAndGrace&&root.RAIronAndGrace.showdownSeam)||null;
  if(!iron||typeof iron.stats!=='function'){f02=null;return {bound:false,reason:'F02 not present'};}
  const weapons={},conflicts=[],unsupported=[];
  const ids=(typeof iron.roster==='function'?iron.roster().map(r=>r.id):Object.keys(D.WEAPONS));
  for(const id of ids){
   let st=null;try{st=iron.stats(id);}catch(e){}
   if(!st)continue;
   const base=D.WEAPONS[id]||null;const def=convertF02(id,st,base);
   if(!def){unsupported.push({id,why:'damage not parseable',damage:st.damage});continue;}
   if(id==='jollof_burner')unsupported.push({id,why:'SOURCE_REQUIRED F02_BURN'});
   if(id==='tommy_tony')unsupported.push({id,why:'SOURCE_REQUIRED F02_CONSECUTIVE'});
   if(id==='auntie_slipper')unsupported.push({id,why:'fear needs an unauthored "grew up with it" tag; knockback only'});
   if(id==='sapporo_shotgun')unsupported.push({id,why:'"hits two enemies" has no authored shape; Vol 7 +15 close profile kept'});
   if(base){
    if(base.band!==def.band)conflicts.push({id,field:'range',vol7:base.band,f02:def.band});
    if(base.dmg[0]!==def.dmg[0]||base.dmg[1]!==def.dmg[1])conflicts.push({id,field:'damage',vol7:base.dmg.join('-'),f02:def.dmg.join('-')});
   }
   if(id==='sapporo_shotgun'){def.dmg=base.dmg.slice();}
   weapons[id]=def;
  }
  f02={iron,weapons,conflicts,unsupported};
  return {bound:true,weapons:Object.keys(weapons),conflicts,unsupported};
 }
 const f02Report=()=>f02?{bound:true,weapons:Object.keys(f02.weapons),conflicts:clone(f02.conflicts),unsupported:clone(f02.unsupported)}:{bound:false};
 function carriedGun(ogaId){
  if(!f02||typeof f02.iron.carried!=='function')return null;
  let v=null;try{v=f02.iron.carried(ogaId);}catch(e){}
  if(!v)return null;if(typeof v==='string')return v;return v.gunId||v.gun||v.id||null;
 }
 function modsFor(ogaId,gunId){
  if(!f02)return [];let st=null;try{st=f02.iron.stats(gunId);}catch(e){}
  const mods=(st&&st.mods)||[];
  return mods.map(m=>typeof m==='string'?m:m&&m.id).filter(m=>['silencer','scope','drum_mag'].includes(m)).slice(0,2);
 }

 // ---- entry: F04 War Room packet (or any F01-native config) -> engine config ----
 function normalizeStories(v){
  if(Array.isArray(v))return v;
  if(v&&typeof v==='object')return Object.keys(v).filter(k=>v[k]);
  return [];
 }
 function dayOnes(units,threshold){
  const pairs=[];
  for(const a of units)for(const b of units){
   if(a.id>=b.id)continue;
   const ab=(a.bonds&&a.bonds[b.id])||0,ba=(b.bonds&&b.bonds[a.id])||0;
   if(ab>=threshold&&ba>=threshold)pairs.push([a.id,b.id]);
  }
  return pairs;
 }
 function fromWarRoomPacket(packet,opts){
  opts=opts||{};const notes=[],errors=[];
  if(!packet||typeof packet!=='object')return {ok:false,errors:['packet required']};
  const jobType=packet.isHandBack?'HAND_BACK':(opts.emergency||packet.emergency)?'EMERGENCY':packet.jobType||'TAKE_THE_BLOCK';
  const profile=profiles[jobType];
  if(!profile)return {ok:false,errors:[`unknown showdown profile ${jobType}`]};
  if(!packet.squad||!packet.squad.length)return {ok:false,errors:['squad required']};
  const threshold=packet.dayOneThreshold||3;
  const pairs=packet.dayOnes||dayOnes(packet.squad,threshold);
  const squad=packet.squad.map((u,i)=>{
   const named=NAMED[u.id]||{};
   const cls=String(u.class||u.cls||named.cls||'').toUpperCase();
   if(!D.CLASSES[cls])errors.push(`unit ${u.id}: unknown class ${u.class}`);
   const gun=(opts.loadouts&&opts.loadouts[u.id])||u.weapon||carriedGun(u.id)||'pistol';
   const traits=(u.traits||named.traits||[]);
   if(u.stats)notes.push(`STATS_IGNORED:${u.id} (authored Vol 7 class stats are used, not the packet's provisional block)`);
   return {id:u.id,name:u.name||named.name||u.id,cls,traits,stories:normalizeStories(u.stories),race:u.race||named.race||'VAMPIRE',
    weapon:gun,mods:u.mods||modsFor(u.id,gun),bonds:pairs.filter(p=>p.includes(u.id)).map(p=>p[0]===u.id?p[1]:p[0]),critBonus:u.critBonus||0};
  });
  if(errors.length)return {ok:false,errors};
  const enemies=(packet.enemies||[]).map(e=>({type:String(e.type||e).toUpperCase().replace(/\s+/g,'_'),count:e.count||1}));
  for(const e of enemies)if(!D.ENEMIES[e.type])errors.push(`unknown enemy ${e.type}`);
  if(errors.length)return {ok:false,errors};
  let map=opts.map||null;
  if(!map&&packet.grid&&packet.grid.mapId)map=M.get(packet.grid.mapId);
  let usedFallbackMap=false;
  if(!map){map=M.get(jobType==='EXTRACT'?'dock':'alley');usedFallbackMap=true;notes.push('FALLBACK_MAP: no authored location map supplied; neutral sandbox map used');}
  if(!f02)bindF02();
  const weapons=f02?clone(f02.weapons):{};
  const cfg={id:packet.jobId||'showdown',jobId:packet.jobId||null,jobType,district:packet.district||null,seed:packet.seed!==undefined?packet.seed:(packet.jobId||'showdown'),
   map,squad,enemies:enemies.length?enemies:undefined,rich:opts.richEnabled===false?false:(packet.rich?true:undefined),objective:clone(profile.objective),
   turnLimit:profile.turnLimit||null,modifiers:packet.modifiers||[],car:packet.car||null,conditions:opts.conditions||packet.conditions||{},weapons,sandbox:false};
  if(profile.needsCaptive&&!map.captive&&!packet.captive)notes.push('EXTRACT needs map.captive; none on this map');
  if(packet.captive)cfg.captive=packet.captive;
  if(cfg.rich===undefined)delete cfg.rich;
  if(!cfg.enemies)delete cfg.enemies;
  return {ok:true,config:cfg,notes,usedFallbackMap,profile:jobType};
 }
 // any consumer (F05 / F07 / sandbox): profile id + params
 function entry(kind,params){
  params=params||{};const profile=profiles[kind];if(!profile)return {ok:false,errors:[`unknown showdown profile ${kind}`]};
  const packet={...params,jobType:kind};
  if(!packet.squad)return {ok:false,errors:['squad required']};
  return fromWarRoomPacket(packet,params.opts||{});
 }

 // ---- result: F01 result -> what each consumer expects ----
 // F04's showdown_stub.receiveResolution() adds +15 HEAT and the VampGram post itself when richVisible, so heatDelta here
 // must EXCLUDE the Rich-seen 15 (else it is counted twice).
 function toF04Resolution(result){
  const outcome=result.outcome==='VICTORY'?'victory':result.outcome==='RETREAT'?'retreat':'defeat';
  return {outcome,ogaResults:result.ogaResults.map(o=>({id:o.id,finalStatus:o.finalStatus})),heatDelta:result.heat.base,cashDelta:0,
   richUsedPullUp:!!result.rich.used,richVisible:!!result.rich.visible,
   extra:{reason:result.reason,turns:result.turns,captive:result.captive,bossFled:result.bossFled,car:result.car,seed:result.seed,stateHash:result.determinism.stateHash,provisional:result.provisional,sourceRequired:result.sourceRequired}};
 }
 // The strategic layer decides GONE. F01 hands over the raw facts: who was left behind / bled out, and whether an EXTRACT target made it.
 function toStrategic(result){
  return {schema:'F01.strategic/1',outcome:result.outcome,reason:result.reason,
   captured:result.ogaResults.filter(o=>o.finalStatus==='CAPTURED').map(o=>({id:o.id,how:o.how})),
   downedRecovered:result.ogaResults.filter(o=>o.finalStatus==='DOWNED').map(o=>o.id),
   active:result.ogaResults.filter(o=>o.finalStatus==='ACTIVE').map(o=>o.id),
   extractTarget:result.captive,richKnockedDown:result.rich.knockedDown,heat:result.heat,gone:[],
   note:'F01 never finalizes GONE: a CAPTURED Oga creates an EXTRACT job; a failed or expired EXTRACT is resolved by the strategic layer (Vol 7 5.7/6.4).'};
 }

 root.RAShowdownPackets={NAMED,profiles,registerProfile,bindF02,f02Report,fromWarRoomPacket,entry,toF04Resolution,toStrategic,parseDamage,convertF02,dayOnes};
})(typeof window!=='undefined'?window:globalThis);
