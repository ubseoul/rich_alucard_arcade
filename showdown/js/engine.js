(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — the tactical state machine. apply(state, action) -> {ok, state, events, code}.
 // Immutable at the API (the input state is never mutated), deterministic (RNG lives in the state), JSON-serialisable.
 const D=root.RAShowdownData,Rng=root.RAShowdownRng,R=root.RAShowdownRules;
 const clone=v=>JSON.parse(JSON.stringify(v));
 const fail=(code,message,extra)=>({ok:false,code,message:message||code,...(extra||{})});
 const ok=extra=>({ok:true,...(extra||{})});
 const K=R.K;

 // ============================ creation ============================
 function normalizeMap(m){
  if(!m)throw Object.assign(new Error('map required'),{code:'MAP_REQUIRED'});
  const map={id:m.id||'map',name:m.name||m.id||'MAP',theme:m.theme||'ALLEY',cols:m.cols||D.GRID.cols,rows:m.rows||D.GRID.rows,
   elev:{...(m.elev||{})},extraction:(m.extraction||[]).map(([x,y])=>[x,y]),richEntry:(m.richEntry||[]).map(([x,y])=>[x,y]),
   deploy:(m.deploy||[]).map(([x,y])=>[x,y]),slots:(m.slots||[]).map(o=>({...o})),props:(m.props||[]).map(o=>({...o})),
   captive:m.captive?{...m.captive}:null,env:m.env?{...m.env}:{}};
  if(map.cols!==D.GRID.cols||map.rows!==D.GRID.rows)throw Object.assign(new Error('the Showdown field is 6x9'),{code:'BAD_GRID'});
  return map;
 }
 function weaponInstance(s,spec,mods){
  const id=typeof spec==='string'?spec:spec&&spec.id||'pistol';
  const def=s.weapons[id]||s.weapons.pistol;
  const base=(typeof spec==='object'&&spec.clip)||def.clip;
  const max=base+((mods||[]).includes('drum_mag')?1:0);
  return {id:def.id,clip:max,max,fired:0};
 }
 function mkOga(s,c,i,map){
  const cls=D.CLASSES[c.cls];if(!cls)throw Object.assign(new Error('unknown class '+c.cls),{code:'BAD_CLASS'});
  const pos=c.pos||{x:map.deploy[i]?.[0],y:map.deploy[i]?.[1]};
  const mods=(c.mods||[]).slice(0,2);
  const stories=(c.stories||[]).map(x=>D.STORY_ALIASES[x]||x).filter(x=>D.STORIES[x]).slice(0,D.STORY_NUMBERS.maxStories);
  const u={id:c.id||('oga'+(i+1)),name:c.name||c.id,kind:'OGA',side:'PLAYER',cls:c.cls,type:c.cls,x:pos.x,y:pos.y,
   hp:c.hp||cls.hp,maxHp:c.hp||cls.hp,aim:c.aim||cls.aim,mobility:c.mobility||cls.mobility,ap:D.ACTIONS_PER_TURN,status:'ACTIVE',
   race:c.race||'VAMPIRE',tags:[],traits:(c.traits||[]).filter(t=>D.TRAITS[t]),stories,mods,bonds:(c.bonds||[]).slice(),critBonus:c.critBonus||0,
   weapon:null,ow:false,hunker:false,conceal:false,vanishShot:false,exposed:false,suppress:false,blind:false,fear:false,moved:false,
   carrying:null,carriedBy:null,bleed:0,stabilized:false,carUsed:false,phoneUsed:false,
   facts:{shots:0,hits:0,misses:0,crits:0,kills:0,damageDealt:0,damageTaken:0,carriedTiles:0,talkedDown:[],saw95Miss:false,tookHitInHalfCover:false,stabilizedAllies:0,healed:0,downedAtTurn:null}};
  u.weapon=weaponInstance(s,c.weapon||'pistol',mods);
  if(c.weaponRaw)u.weapon=weaponInstance(s,c.weaponRaw,mods);
  return u;
 }
 function mkEnemy(s,type,id,x,y,pod){
  const e=D.ENEMIES[type];if(!e)throw Object.assign(new Error('unknown enemy '+type),{code:'BAD_ENEMY'});
  const tags=[];if(type==='HUNTER')tags.push('IGNORES_VANISH');if(type==='ENFORCER')tags.push('SHRUGS_HALF_COVER');
  const u={id,name:e.label,kind:'ENEMY',side:'ENEMY',cls:null,type,x,y,hp:e.hp,maxHp:e.hp,aim:e.aim,mobility:s.tun.enemyMobility,ap:2,status:'ACTIVE',
   race:e.human?'HUMAN':'VAMPIRE',tags,traits:[],stories:[],mods:[],bonds:[],critBonus:0,faction:e.faction,pod,boss:!!e.boss,
   weapon:{id:e.weapon,clip:99,max:99,fired:0},ow:false,hunker:false,conceal:false,exposed:false,suppress:false,blind:false,fear:false,moved:false,
   carrying:null,carriedBy:null,bleed:0,stabilized:false,removedReason:null,facts:{}};
  return u;
 }
 function expandRoster(list){
  const out=[];for(const r of list||[]){if(typeof r==='string')out.push(r);else for(let i=0;i<(r.count||1);i++)out.push(r.type);}return out;
 }
 function create(cfg){
  cfg=cfg||{};const map=normalizeMap(cfg.map);
  const tun={...D.TUNABLES,rangeMax:{...D.RANGE_MAX},...(cfg.tunables||{})};
  const weapons={};for(const [id,w] of Object.entries(D.WEAPONS))weapons[id]=clone(w);
  for(const [id,w] of Object.entries(cfg.weapons||{}))weapons[id]=clone(w);
  const seed=cfg.seed===undefined||cfg.seed===null?'showdown':String(cfg.seed);
  const s={v:1,id:cfg.id||'showdown',jobId:cfg.jobId||null,jobType:cfg.jobType||'SANDBOX',district:cfg.district||null,sandbox:!!cfg.sandbox,
   objective:{kind:'ELIMINATE',...(cfg.objective||{})},turnLimit:cfg.turnLimit||null,map:null,props:[],units:{},order:[],pods:[],weapons,tun,
   conditions:clone(cfg.conditions||{}),modifiers:clone(cfg.modifiers||[]),car:cfg.car?clone(cfg.car):null,
   rng:Rng.create(seed),seed,turn:1,phase:'PLAYER',status:'ACTIVE',result:null,
   rich:{enabled:cfg.rich!==false,status:'OFFSTAGE',used:false,pullTurn:null,visible:false,stored:0,damageTaken:0,down:false,octopusTried:0},
   stats:{shots:0,hits:0,misses:0,crits:0,enemyShots:0,enemyHits:0},actions:[],flags:{carRammed:false,carPlaced:false},heat:{rpg:0,silencerFired:false},bossFled:[]};
  s.map={id:map.id,name:map.name,theme:map.theme,cols:map.cols,rows:map.rows,elev:map.elev,extraction:map.extraction,richEntry:map.richEntry,env:map.env};
  map.props.forEach((p,i)=>s.props.push({id:'p'+(i+1),x:p.x,y:p.y,level:p.level,kind:p.kind||(p.level==='FULL'?'PILLAR':'LOW_WALL'),destructible:!!p.destructible,destroyed:false}));
  (cfg.squad||[]).forEach((c,i)=>{const u=mkOga(s,c,i,map);s.units[u.id]=u;s.order.push(u.id);});
  // bond pairs (DAY ONES) must be symmetric
  for(const u of Object.values(s.units))for(const b of u.bonds){const o=s.units[b];if(o&&!o.bonds.includes(u.id))o.bonds.push(u.id);}
  if(s.rich.enabled){
   const hp=D.RICH.hp;
   const r={id:'rich',name:'RICH',kind:'RICH',side:'PLAYER',cls:null,type:'RICH',x:null,y:null,hp,maxHp:hp,aim:0,mobility:tun.richMobility,ap:0,status:'OFFSTAGE',race:'VAMPIRE',tags:[],traits:[],stories:[],mods:[],bonds:[],
    critBonus:0,weapon:null,ow:false,hunker:false,conceal:false,exposed:false,suppress:false,blind:false,fear:false,moved:false,carrying:null,carriedBy:null,bleed:0,stabilized:false,facts:{damageTaken:0,damageDealt:0,kills:0}};
   s.units.rich=r;s.order.push('rich');
  }
  // enemies: explicit map members, or a roster poured into the map's pod slots
  const roster=cfg.enemies?expandRoster(cfg.enemies):null;const slots=map.slots;
  let placed=[];
  if(cfg.enemyUnits){placed=cfg.enemyUnits.map(o=>({type:o.type,x:o.x,y:o.y,pod:o.pod||'p1'}));}
  else if(roster){
   if(roster.length>slots.length)throw Object.assign(new Error(`map has ${slots.length} enemy slots, roster needs ${roster.length}`),{code:'NOT_ENOUGH_SLOTS'});
   placed=roster.map((t,i)=>({type:t,x:slots[i].x,y:slots[i].y,pod:slots[i].pod||'p1'}));
  }else placed=slots.filter(o=>o.type).map(o=>({type:o.type,x:o.x,y:o.y,pod:o.pod||'p1'}));
  placed.forEach((e,i)=>{const u=mkEnemy(s,e.type,'e'+(i+1),e.x,e.y,e.pod);s.units[u.id]=u;s.order.push(u.id);});
  const podIds=[...new Set(placed.map(e=>e.pod))].sort();
  const preRevealed=new Set(cfg.revealedPods||[]);
  s.pods=podIds.map(id=>({id,revealed:cfg.allRevealed?true:preRevealed.has(id)}));
  const capSpec=cfg.captive||map.captive;
  if(capSpec){const c={id:'captive',name:capSpec.name||'CAPTIVE',kind:'CAPTIVE',side:'NEUTRAL',cls:null,type:'CAPTIVE',x:capSpec.x,y:capSpec.y,hp:1,maxHp:1,aim:0,mobility:0,ap:0,status:'DOWNED',race:'VAMPIRE',tags:[],traits:[],stories:[],mods:[],bonds:[],critBonus:0,weapon:null,
    ow:false,hunker:false,conceal:false,exposed:false,suppress:false,blind:false,fear:false,moved:false,carrying:null,carriedBy:null,bleed:0,stabilized:true,facts:{}};
   s.units.captive=c;s.order.push('captive');}
  validateSetup(s);
  const ev=[];revealCheck(s,ev);s.opening=ev;
  return s;
 }
 function validateSetup(s){
  const seen=new Set();
  for(const u of R.units(s)){if(!R.onGrid(u))continue;
   if(!R.inb(s,u.x,u.y))throw Object.assign(new Error(`${u.id} is off the field`),{code:'OFF_FIELD'});
   if(R.propAt(s,u.x,u.y))throw Object.assign(new Error(`${u.id} starts inside cover piece`),{code:'BLOCKED_START'});
   const k=K(u.x,u.y);if(seen.has(k))throw Object.assign(new Error(`two units on ${k}`),{code:'STACKED_START'});seen.add(k);}
 }

 // ============================ queries ============================
 const unit=(s,id)=>s.units[id]||null;
 const players=s=>R.units(s).filter(u=>u.side==='PLAYER'&&u.kind!=='RICH');
 const ogas=s=>R.units(s).filter(u=>u.kind==='OGA');
 const enemies=s=>R.units(s).filter(u=>u.kind==='ENEMY');
 const liveEnemies=s=>enemies(s).filter(u=>u.status==='ACTIVE');
 const richReady=s=>s.rich.enabled&&s.rich.status==='OFFSTAGE'&&!s.rich.used;
 const canPullUp=s=>s.status==='ACTIVE'&&s.phase==='PLAYER'&&richReady(s)&&s.turn>=D.RICH.pullUpFromTurn;
 function abilitiesOf(s,u){
  const out=[];if(!u||u.kind!=='OGA')return out;
  const c=D.CLASSES[u.cls];out.push({id:c.ability,label:c.abilityLabel,text:c.text});
  if(u.traits.includes('PHONE_OUT'))out.push({id:'PHONE_OUT',label:'PHONE OUT',text:D.TRAITS.PHONE_OUT.text});
  return out;
 }
 const dashOK=u=>u.moved;

 // Action availability for a unit: {ACTION:{ok,why,...}} (why = engine code). Used by the UI, the tests and any host.
 function available(s,uid){
  const u=s.units[uid],out={};const ids=['MOVE','SHOOT','OVERWATCH','HUNKER','ABILITY','CARRY','RELOAD','ITEM'];
  const set=(id,okv,why,extra)=>{out[id]={ok:!!okv,why:okv?null:why,...(extra||{})};};
  if(!u||s.status!=='ACTIVE'||s.phase!=='PLAYER'||u.side!=='PLAYER'||u.status!=='ACTIVE'||u.kind==='CAPTIVE'){for(const id of ids)set(id,false,'NOT_ACTIVE');return out;}
  const ap=u.ap>0;const noap='NO_ACTIONS';
  const dests=R.destinations(s,u,R.effectiveMobility(s,u));
  set('MOVE',ap&&dests.length>0,ap?'BOXED_IN':noap,{dash:u.moved,tiles:dests.length});
  if(u.kind==='RICH'){
   for(const id of ['SHOOT','OVERWATCH','HUNKER','CARRY','RELOAD'])set(id,false,'RICH_NO_GUN');
   set('ITEM',false,'SOURCE_REQUIRED');
   const rm={};
   for(const m of ['BLOOD_BATH','VAMPIRE_BITE','OCTOPUS_BRAIN','REVENGE']){
    if(!ap){rm[m]={ok:false,why:noap};continue;}
    if(m==='OCTOPUS_BRAIN'){rm[m]={ok:false,why:'SOURCE_REQUIRED'};continue;}
    if(m==='REVENGE'){rm[m]={ok:s.rich.stored>0,why:s.rich.stored>0?null:'NOTHING_STORED',stored:s.rich.stored};continue;}
    if(m==='VAMPIRE_BITE'){const adj=liveEnemies(s).filter(e=>R.onGrid(e)&&R.spotted(s,e)&&R.adjacent(u,e));rm[m]={ok:adj.length>0,why:adj.length?null:'NOT_ADJACENT'};continue;}
    rm[m]={ok:true,why:null};
   }
   out.RICH_MOVES=rm;set('ABILITY',ap,noap);return out;
  }
  const can=R.canShoot(s,u);const tg=can.ok?R.targets(s,u):[];
  const w=R.weaponOf(s,u);
  if(w&&w.area&&can.ok)set('SHOOT',true,null,{area:true,targets:tg.length});
  else set('SHOOT',can.ok&&tg.length>0,can.ok?'NO_TARGET':can.code,{targets:tg.length});
  const owv=validate(s,{type:'OVERWATCH',unit:uid});set('OVERWATCH',owv.ok,owv.code);
  set('HUNKER',ap&&!u.hunker,u.hunker?'ALREADY':noap);
  const rl=validate(s,{type:'RELOAD',unit:uid});set('RELOAD',rl.ok,rl.code);
  const near=R.units(s).filter(o=>(o.kind==='OGA'||o.kind==='CAPTIVE')&&o.status==='DOWNED'&&!o.carriedBy&&R.adjacent(u,o));
  set('CARRY',ap&&u.kind==='OGA'&&!u.carrying&&near.length>0,u.carrying?'ALREADY_CARRYING':ap?'NOT_ADJACENT':noap,{targets:near.map(o=>o.id)});
  set('ITEM',false,'SOURCE_REQUIRED');
  const abs=abilitiesOf(s,u).map(x=>{
   const base=ap;let okv=base,why=base?null:noap;
   if(base){
    const id=x.id;
    if(id==='SHOULDER_CHECK'){okv=!u.carrying&&liveEnemies(s).some(e=>R.onGrid(e)&&R.spotted(s,e)&&approachTile(s,u,e));why=okv?null:'NO_PATH';}
    else if(id==='DEAD_EYE'){okv=can.ok&&R.targets(s,u,{ability:'DEAD_EYE'}).length>0;why=okv?null:(can.ok?'NO_TARGET':can.code);}
    else if(id==='THE_CAR'){okv=!u.carUsed;why=okv?null:'ONE_PER_SHOWDOWN';}
    else if(id==='TALK_HIM_DOWN'){okv=liveEnemies(s).some(e=>validateAbility(s,u,{ability:id,target:e.id}).ok);why=okv?null:'NO_TARGET';}
    else if(id==='VANISH'){okv=!u.conceal;why=okv?null:'ALREADY';}
    else if(id==='PATCH_UP'){okv=R.units(s).some(o=>(o.kind==='OGA'||o.kind==='RICH')&&validateAbility(s,u,{ability:id,target:o.id}).ok);why=okv?null:'NOTHING_TO_DO';}
    else if(id==='PHONE_OUT'){const v=validateAbility(s,u,{ability:id});okv=v.ok;why=v.ok?null:v.code;}
   }
   return {...x,ok:okv,why};
  });
  out.ABILITIES=abs;set('ABILITY',abs.some(a=>a.ok),abs.length?(abs.find(a=>a.why)||{}).why||noap:'NO_ABILITY');
  return out;
 }

 // ============================ events / helpers ============================
 const emit=(ev,e)=>{ev.push(e);return e;};
 const isFree=(s,x,y)=>R.inb(s,x,y)&&!R.propAt(s,x,y)&&!R.unitAt(s,x,y);
 function nearestFree(s,x,y){
  for(let r=1;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(isFree(s,x+dx,y+dy))return {x:x+dx,y:y+dy};}
  return null;
 }
 function syncCarried(s,carrier){if(carrier.carrying){const c=s.units[carrier.carrying];if(c){c.x=carrier.x;c.y=carrier.y;}}}

 // ---- reveal ----
 function revealCheck(s,ev,by){
  for(const pod of s.pods){
   if(pod.revealed)continue;
   const members=enemies(s).filter(e=>e.pod===pod.id&&e.status==='ACTIVE');if(!members.length)continue;
   let seen=false;
   for(const m of members){
    for(const p of R.units(s)){
     if(p.side!=='PLAYER'||p.status!=='ACTIVE'||!R.onGrid(p))continue;
     if(!R.spots(s,p,m))continue;
     seen=true;break;
    }
    if(seen)break;
   }
   if(seen){pod.revealed=true;emit(ev,{t:'POD_REVEAL',pod:pod.id,members:members.map(m=>({id:m.id,type:m.type,x:m.x,y:m.y})),sfx:'BX_POD_REVEAL'});}
  }
 }

 // ---- damage ----
 function creditKill(s,src,tg){if(src&&s.units[src]&&s.units[src].facts)s.units[src].facts.kills=(s.units[src].facts.kills||0)+1;}
 function dropCarried(s,carrier,ev){
  if(!carrier.carrying)return;const c=s.units[carrier.carrying];carrier.carrying=null;if(!c)return;c.carriedBy=null;
  const spot=isFree(s,carrier.x,carrier.y)?{x:carrier.x,y:carrier.y}:nearestFree(s,carrier.x,carrier.y);
  if(spot){c.x=spot.x;c.y=spot.y;}
  emit(ev,{t:'DROP',carrier:carrier.id,id:c.id,x:c.x,y:c.y});
 }
 function down(s,u,src,ev){
  u.status='DOWNED';u.hp=0;u.ap=0;u.ow=false;u.hunker=false;u.conceal=false;u.bleed=D.BLEED_TURNS;u.stabilized=false;u.facts.downedAtTurn=s.turn;
  if(u.carrying)dropCarried(s,u,ev);
  emit(ev,{t:'DOWNED',id:u.id,x:u.x,y:u.y,bleed:u.bleed,by:src||null,sfx:'BX_DOWNED'});
  // DAY ONES: the partner gets a free move toward the downed Oga
  for(const bid of u.bonds){const p=s.units[bid];if(p&&p.status==='ACTIVE'&&R.onGrid(p)){freeMoveToward(s,p,u,ev);}}
 }
 function freeMoveToward(s,p,target,ev){
  const opts=R.destinations(s,p,R.effectiveMobility(s,p));let best=null;const d0=R.dist(p,target);
  for(const o of opts){const d=R.dist(o,target);if(d>=d0)continue;const key=[d,o.cost,o.y,o.x];if(!best||key<best.key)best={key,o};}
  if(best)moveAlong(s,p,best.o,ev,{free:true,skipOverwatch:true});
 }
 // returns actual hp lost. Emits HP {id,hp,max,lost,x,y} first, then the DOWNED / REMOVED consequence.
 function hurt(s,tg,amount,srcId,ev,info){
  info=info||{};const src=srcId?s.units[srcId]:null;
  if(tg.kind==='CAPTIVE')return 0;
  const before=tg.hp;let after=before,consequence=null;
  if(tg.kind==='ENEMY'){
   if(tg.type==='LIL_SMACK'&&tg.hp-amount<=D.ENEMY_NUMBERS.smackFleeHp){after=Math.max(1,tg.hp-amount);consequence='FLED';}
   else{after=Math.max(0,tg.hp-amount);if(after===0)consequence='ELIMINATED';}
  }else after=Math.max(0,tg.hp-amount);
  const lost=before-after;tg.hp=after;
  emit(ev,{t:'HP',id:tg.id,hp:after,max:tg.maxHp,lost,x:tg.x,y:tg.y,by:srcId||null});
  if(tg.kind==='ENEMY'){
   if(consequence){tg.status='REMOVED';tg.removedReason=consequence;if(consequence==='FLED')s.bossFled.push(tg.id);else creditKill(s,srcId,tg);emit(ev,{t:'REMOVED',id:tg.id,reason:consequence,x:tg.x,y:tg.y});}
  }else if(tg.kind==='RICH'){
   s.rich.stored+=lost;s.rich.damageTaken+=lost;tg.facts.damageTaken+=lost;
   if(after===0){s.rich.down=true;tg.status='DOWNED';emit(ev,{t:'RICH_DOWN',id:'rich',sfx:'BX_DOWNED'});}
  }else{
   tg.facts.damageTaken+=lost;
   if(info.fromHalfCover)tg.facts.tookHitInHalfCover=true;
   if(after===0)down(s,tg,srcId,ev);
  }
  if(src&&src.facts&&src.side==='PLAYER')src.facts.damageDealt=(src.facts.damageDealt||0)+lost;
  return lost;
 }

 // ============================ firing ============================
 function noteShot(s,sh,hit,crit,chance,ev){
  if(sh.side==='PLAYER'){s.stats.shots++;if(hit)s.stats.hits++;else s.stats.misses++;if(crit)s.stats.crits++;}else{s.stats.enemyShots++;if(hit)s.stats.enemyHits++;}
  if(sh.facts&&sh.facts.shots!==undefined){sh.facts.shots++;if(hit)sh.facts.hits++;else sh.facts.misses++;if(crit)sh.facts.crits++;}
 }
 // Fires one SHOOT action (all bursts). o: {reaction, ability}
 function fire(s,sh,tg,o,ev){
  o=o||{};const w=R.weaponOf(s,sh);const pv=R.preview(s,sh,tg,o);if(!pv.ok)return pv;
  const wasConcealed=sh.conceal;
  if(w.area)return fireArea(s,sh,{x:tg.x,y:tg.y},w,o,ev);
  sh.weapon.clip--;sh.weapon.fired++;
  if(R.hasMod(sh,'silencer'))s.heat.silencerFired=true;
  let downedTarget=false;
  const bursts=pv.hits;
  for(let i=0;i<bursts&&tg.status==='ACTIVE';i++){
   const roll=pv.neverMiss?null:Rng.percent(s.rng);
   const hit=pv.neverMiss||roll<pv.chance;
   let dmg=0,crit=false,critRoll=null;
   if(hit){
    dmg=Rng.int(s.rng,pv.dmgMin,pv.dmgMax);
    critRoll=Rng.percent(s.rng);crit=critRoll<pv.crit;
    if(crit)dmg=Math.round(dmg*D.HIT.critMult);
   }
   noteShot(s,sh,hit,crit,pv.chance,ev);
   const joke=!hit&&sh.side==='PLAYER'&&pv.chance>=95;
   if(joke)for(const o2 of ogas(s))if(o2.status==='ACTIVE')o2.facts.saw95Miss=true;
   const shot={t:'SHOT',from:sh.id,to:tg.id,fx:sh.x,fy:sh.y,tx:tg.x,ty:tg.y,chance:pv.chance,roll:roll===null?null:Math.round(roll*100)/100,hit,crit,dmg,cover:pv.cover,flanked:pv.flanked,
    reaction:!!o.reaction,ability:o.ability||null,burst:i+1,bursts,joke,caption:joke?`${Math.round(pv.chance)}%???`:null,weapon:w.id,sfx:o.reaction?'BX_OVERWATCH':(hit&&pv.cover!=='NONE'?'BX_COVER_HIT':(D.GUN_SFX[w.id]||null)),gunSfx:D.GUN_SFX[w.id]||null};
   emit(ev,shot);
   if(hit){
    const lost=hurt(s,tg,dmg,sh.id,ev,{fromHalfCover:pv.cover==='HALF'});
    shot.lost=lost;
    applyOnHit(s,sh,tg,w,ev);
   }
  }
  if(w.healSelf&&sh.hp<sh.maxHp&&sh.status==='ACTIVE'){sh.hp=Math.min(sh.maxHp,sh.hp+w.healSelf);emit(ev,{t:'HEAL',id:sh.id,amount:w.healSelf,hp:sh.hp,src:'weapon'});}
  // concealment: the first shot spends the +20; it breaks concealment unless SILENCED
  if(wasConcealed&&sh.status==='ACTIVE'){sh.vanishShot=true;if(!R.hasMod(sh,'silencer')){sh.conceal=false;emit(ev,{t:'CONCEAL_BROKEN',id:sh.id});}}
  return ok({preview:pv});
 }
 function applyOnHit(s,sh,tg,w,ev){
  if(tg.status!=='ACTIVE')return;
  const oh=w.onHit||{};
  if(oh.suppress)tg.suppress=true;if(oh.blind)tg.blind=true;if(oh.fear)tg.fear=true;
  if(oh.knockback){
   const dx=Math.sign(tg.x-sh.x),dy=Math.sign(tg.y-sh.y);const nx=tg.x+dx,ny=tg.y+dy;
   if((dx||dy)&&isFree(s,nx,ny)){tg.x=nx;tg.y=ny;emit(ev,{t:'KNOCKBACK',id:tg.id,x:nx,y:ny});}
  }
 }
 function areaTiles(w,c,from){
  const out=[];
  if(w.area==='cone3'){ // PROVISIONAL shape: a 3-deep cone from the shooter toward the target
   const dx=Math.sign(c.x-from.x),dy=Math.sign(c.y-from.y);if(!dx&&!dy)return [];
   for(let d=1;d<=3;d++){
    if(dx&&dy){out.push({x:from.x+dx*d,y:from.y+dy*d},{x:from.x+dx*d,y:from.y+dy*(d-1)},{x:from.x+dx*(d-1),y:from.y+dy*d});}
    else for(let l=-(d-1);l<=d-1;l++)out.push(dx?{x:from.x+dx*d,y:from.y+l}:{x:from.x+l,y:from.y+dy*d});
   }
   return out;
  }
  for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++)out.push({x:c.x+x,y:c.y+y});
  return out;
 }
 function fireArea(s,sh,center,w,o,ev){
  if(sh.weapon.clip<1)return fail('NO_AMMO');
  sh.weapon.clip--;sh.weapon.fired++;s.heat.rpg+=w.heat||0;
  const tiles=areaTiles(w,center,sh);const hit=[];
  const dmg=Rng.int(s.rng,w.dmg[0],w.dmg[1]);
  emit(ev,{t:'BLAST',from:sh.id,x:center.x,y:center.y,tiles,weapon:w.id,sfx:D.GUN_SFX[w.id]||null});
  for(const t of tiles){
   if(w.destroysCover){const p=R.propAt(s,t.x,t.y);if(p&&p.destructible){p.destroyed=true;emit(ev,{t:'COVER_DESTROYED',id:p.id,x:p.x,y:p.y,kind:p.kind});}}
  }
  for(const u of R.units(s)){
   if(!R.onGrid(u)||u.status!=='ACTIVE'||!R.hostile(sh,u)||u.kind==='CAPTIVE')continue;
   if(!tiles.some(t=>t.x===u.x&&t.y===u.y))continue;
   const lost=hurt(s,u,dmg,sh.id,ev);hit.push(u.id);emit(ev,{t:'AREA_HIT',from:sh.id,to:u.id,dmg,lost,x:u.x,y:u.y});
  }
  sh.facts.shots=(sh.facts.shots||0)+1;if(hit.length){sh.facts.hits=(sh.facts.hits||0)+1;}
  return ok({hit});
 }

 // ============================ movement ============================
 function overwatchReactions(s,mover,ev){
  for(const w of R.units(s)){
   if(mover.status!=='ACTIVE')return;
   if(w.side===mover.side||!w.ow||w.status!=='ACTIVE'||!R.onGrid(w)||w.kind==='CAPTIVE')continue;
   if(!R.hostile(w,mover))continue;
   const can=R.canShoot(s,w,{reaction:true});if(!can.ok)continue;
   const pv=R.preview(s,w,mover,{reaction:true});if(!pv.ok||pv.chance<=0)continue;
   w.ow=false;emit(ev,{t:'OVERWATCH_TRIGGER',id:w.id,target:mover.id});
   fire(s,w,mover,{reaction:true},ev);
  }
 }
 // Moves along the cheapest path; overwatch and reveals happen step by step. dest must be reachable within budget.
 function moveAlong(s,u,dest,ev,o){
  o=o||{};const budget=o.budget||R.effectiveMobility(s,u);
  const p=R.path(s,u,dest,budget);if(!p||!p.length)return fail('NO_PATH');
  const walked=[{x:u.x,y:u.y}];const from={x:u.x,y:u.y};
  for(const step of p){
   u.x=step.x;u.y=step.y;syncCarried(s,u);walked.push({x:step.x,y:step.y});
   if(u.carrying&&s.units[u.carrying])u.facts.carriedTiles=(u.facts.carriedTiles||0)+1;
   revealCheck(s,ev);
   if(!o.skipOverwatch&&u.side==='ENEMY')overwatchReactions(s,u,ev);
   if(u.status!=='ACTIVE')break;
  }
  emit(ev,{t:'MOVE',id:u.id,path:walked,free:!!o.free,sfx:'BX_STEP'});
  if(u.status==='ACTIVE'){
   u.moved=true;
   if(u.carrying)maybeDeliver(s,u,ev);
   sitDown(s,u,ev);
  }
  return ok({from,to:{x:u.x,y:u.y}});
 }
 function onExtraction(s,u){return s.map.extraction.some(([x,y])=>x===u.x&&y===u.y);}
 function maybeDeliver(s,u,ev){
  if(!u.carrying||!onExtraction(s,u))return;
  const c=s.units[u.carrying];u.carrying=null;if(!c)return;c.carriedBy=null;c.status=c.kind==='CAPTIVE'?'EXTRACTED':'DOWNED';c.extracted=true;c.x=null;c.y=null;
  if(c.kind!=='CAPTIVE')c.status='EXTRACTED';
  emit(ev,{t:'EXTRACTED',id:c.id,by:u.id,sfx:'BX_CRATE'});
 }
 function sitDown(s,u,ev){
  if(!u.traits.includes('SIT_DOWN'))return;
  for(const o of ogas(s))if(o.status==='DOWNED'&&!o.stabilized&&!o.carriedBy&&R.adjacent(u,o)){o.stabilized=true;u.facts.stabilizedAllies++;emit(ev,{t:'STABILIZED',id:o.id,by:u.id,free:true});}
 }

 // ============================ validation ============================
 function actorOf(s,a){const u=s.units[a.unit];return u||null;}
 function validate(s,a){
  if(!a||typeof a.type!=='string')return fail('BAD_ACTION');
  if(s.status!=='ACTIVE')return fail('ENDED','the showdown is over');
  if(s.phase!=='PLAYER')return fail('NOT_YOUR_TURN');
  const t=a.type;
  if(t==='END_TURN'||t==='RETREAT')return ok();
  if(t==='PULL_UP'){
   if(!s.rich.enabled)return fail('NO_RICH');
   if(s.rich.used||s.rich.status!=='OFFSTAGE')return fail('RICH_USED','Rich already pulled up');
   if(s.turn<D.RICH.pullUpFromTurn)return fail('TOO_EARLY',`Rich pulls up from turn ${D.RICH.pullUpFromTurn}`);
   const spot=richEntryTile(s,a.to);if(!spot)return fail('NO_ENTRY','no free entry tile');
   return ok({to:spot});
  }
  const u=actorOf(s,a);if(!u)return fail('NO_UNIT');
  if(u.side!=='PLAYER'||u.kind==='CAPTIVE')return fail('NOT_YOURS');
  if(u.status!=='ACTIVE')return fail('NOT_ACTIVE');
  if(t==='RICH_MOVE'){
   if(u.kind!=='RICH')return fail('NOT_RICH');
   if(u.ap<1)return fail('NO_ACTIONS');
   return validateRichMove(s,u,a);
  }
  if(u.ap<1)return fail('NO_ACTIONS');
  switch(t){
   case 'MOVE':case 'DASH':{
    if(t==='DASH'&&!u.moved)return fail('NO_PRIOR_MOVE','a dash is the second MOVE');
    if(!a.to)return fail('NO_DEST');
    const dests=R.destinations(s,u,R.effectiveMobility(s,u));
    if(!dests.some(d=>d.x===a.to.x&&d.y===a.to.y))return fail('UNREACHABLE');
    return ok();
   }
   case 'SHOOT':{
    if(u.kind==='RICH')return fail('RICH_NO_GUN');
    const can=R.canShoot(s,u);if(!can.ok)return fail(can.code,undefined,can);
    const w=R.weaponOf(s,u);
    if(w.area&&a.at){const d=R.dist(u,a.at);if(d>R.rangeMax(s,w)||!R.los(s,u,a.at))return fail('OUT_OF_RANGE');return ok();}
    const tg=s.units[a.target];if(!tg)return fail('NO_TARGET');
    const pv=R.preview(s,u,tg,{});if(!pv.ok)return fail(pv.code,undefined,pv);
    if(pv.chance<=0)return fail('NO_CHANCE');
    return ok({preview:pv});
   }
   case 'OVERWATCH':{
    if(u.kind==='RICH')return fail('RICH_NO_GUN');
    if(u.traits.includes('IMPATIENT'))return fail('IMPATIENT');
    if(u.ow)return fail('ALREADY');
    const w=R.weaponOf(s,u);if(!w)return fail('NO_WEAPON');if(u.weapon.clip<1)return fail('NO_AMMO');
    if(w.noMoveShoot&&u.moved&&!s.tun.sniperOverwatchAfterMove)return fail('MOVED_THIS_TURN');
    if(w.perShowdown&&u.weapon.fired>=w.perShowdown)return fail('ONE_PER_SHOWDOWN');
    return ok();
   }
   case 'HUNKER':{if(u.kind==='RICH')return fail('NOT_RICH_ACTION');if(u.hunker)return fail('ALREADY');return ok();}
   case 'RELOAD':{
    const w=R.weaponOf(s,u);if(!w)return fail('NO_WEAPON');if(w.perShowdown)return fail('ONE_PER_SHOWDOWN');
    if(u.weapon.clip>=u.weapon.max)return fail('FULL');return ok();
   }
   case 'CARRY':{
    if(u.kind!=='OGA')return fail('NOT_OGA');if(u.carrying)return fail('ALREADY_CARRYING');
    const c=s.units[a.target];if(!c||(c.kind!=='OGA'&&c.kind!=='CAPTIVE'))return fail('NO_TARGET');
    if(c.status!=='DOWNED'||c.carriedBy)return fail('NOT_DOWNED');
    if(!R.adjacent(u,c))return fail('NOT_ADJACENT');
    return ok();
   }
   case 'ITEM':return fail('SOURCE_REQUIRED','ITEM: no item is authored in the OPEN source',{sourceRequired:'ITEMS'});
   case 'ABILITY':return validateAbility(s,u,a);
   default:return fail('BAD_ACTION',t);
  }
 }
 function richEntryTile(s,want){
  const tiles=s.map.richEntry;
  if(want){const m=tiles.find(([x,y])=>x===want.x&&y===want.y);return m&&isFree(s,m[0],m[1])?{x:m[0],y:m[1]}:null;}
  for(const [x,y] of tiles)if(isFree(s,x,y))return {x,y};
  return null;
 }
 function validateAbility(s,u,a){
  const id=a.ability||(D.CLASSES[u.cls]||{}).ability;
  if(!abilitiesOf(s,u).some(x=>x.id===id))return fail('NO_ABILITY');
  switch(id){
   case 'SHOULDER_CHECK':{
    const tg=s.units[a.target];if(!tg||tg.kind!=='ENEMY'||tg.status!=='ACTIVE'||!R.spotted(s,tg))return fail('BAD_TARGET');
    if(u.carrying)return fail('CARRYING');
    if(!approachTile(s,u,tg))return fail('NO_PATH','cannot reach the target');
    return ok();
   }
   case 'DEAD_EYE':{
    const can=R.canShoot(s,u);if(!can.ok)return fail(can.code,undefined,can);
    const tg=s.units[a.target];if(!tg)return fail('NO_TARGET');
    const pv=R.preview(s,u,tg,{ability:'DEAD_EYE'});if(!pv.ok)return fail(pv.code,undefined,pv);
    if(pv.chance<=0)return fail('NO_CHANCE');return ok({preview:pv});
   }
   case 'THE_CAR':{
    if(u.carUsed)return fail('ONE_PER_SHOWDOWN');
    if(a.mode==='RAM'){
     const tg=s.units[a.target];if(!tg||tg.kind!=='ENEMY'||tg.status!=='ACTIVE'||!R.spotted(s,tg))return fail('BAD_TARGET');
     if(R.dist(u,tg)>s.tun.carRange||!R.los(s,u,tg))return fail('OUT_OF_RANGE');return ok();
    }
    if(a.mode==='COVER'){
     const to=a.to;if(!to||!isFree(s,to.x,to.y))return fail('BAD_TILE');
     if(R.dist(u,to)>s.tun.carRange||!R.los(s,u,to))return fail('OUT_OF_RANGE');return ok();
    }
    return fail('BAD_MODE');
   }
   case 'TALK_HIM_DOWN':{
    const tg=s.units[a.target];if(!tg||tg.kind!=='ENEMY'||tg.status!=='ACTIVE'||!R.spotted(s,tg))return fail('BAD_TARGET');
    if(R.dist(u,tg)>s.tun.talkRange||!R.los(s,u,tg))return fail('OUT_OF_RANGE');
    if(!(tg.hp*2<tg.maxHp))return fail('TOO_HEALTHY','only enemies under 50% HP listen');
    if(tg.type==='HUNTER'&&!R.story(u,'talked_down_hunter'))return fail('HUNTERS_DONT_LISTEN');
    return ok({chance:talkChance(u)});
   }
   case 'VANISH':{if(u.conceal)return fail('ALREADY');return ok();}
   case 'PATCH_UP':{
    const tg=s.units[a.target];if(!tg||!(tg.side==='PLAYER'||tg.kind==='OGA'))return fail('BAD_TARGET');
    const near=R.adjacent(u,tg)||(tg.carriedBy&&R.adjacent(u,s.units[tg.carriedBy]));
    if(!near&&tg.id!==u.id)return fail('NOT_ADJACENT');
    if(tg.kind==='RICH'||tg.kind==='OGA'){
     if(tg.status==='DOWNED'){if(tg.stabilized)return fail('ALREADY');return ok({mode:'STABILIZE'});}
     if(tg.status==='ACTIVE'&&tg.hp<tg.maxHp)return ok({mode:'HEAL'});
     return fail('NOTHING_TO_DO');
    }
    return fail('BAD_TARGET');
   }
   case 'PHONE_OUT':{
    if(u.phoneUsed)return fail('ONE_PER_SHOWDOWN');
    if(!s.pods.some(p=>!p.revealed&&enemies(s).some(e=>e.pod===p.id&&e.status==='ACTIVE')))return fail('NOTHING_HIDDEN');
    return ok();
   }
   default:return fail('NO_ABILITY');
  }
 }
 const talkChance=u=>D.ABILITY_NUMBERS.talkChance+(u.traits.includes('MOUTHPIECE')?D.TRAIT_NUMBERS.mouthpieceTalk:0);
 // best tile adjacent to target within reach for SHOULDER CHECK
 function approachTile(s,u,tg){
  if(R.adjacent(u,tg))return {x:u.x,y:u.y,cost:0,stay:true};
  let best=null;
  for(const d of R.destinations(s,u,R.effectiveMobility(s,u))){if(!R.adjacent(d,tg))continue;const key=[d.cost,d.y,d.x];if(!best||key<best.key)best={key,d};}
  return best?best.d:null;
 }
 function validateRichMove(s,u,a){
  const rm=a.move;
  switch(rm){
   case 'BLOOD_BATH':{const at=a.at;if(!at||!R.inb(s,at.x,at.y))return fail('BAD_TILE');if(R.dist(u,at)>s.tun.bloodBathRange||!R.los(s,u,at))return fail('OUT_OF_RANGE');return ok();}
   case 'VAMPIRE_BITE':{const tg=s.units[a.target];if(!tg||tg.kind!=='ENEMY'||tg.status!=='ACTIVE'||!R.spotted(s,tg))return fail('BAD_TARGET');if(!R.adjacent(u,tg))return fail('NOT_ADJACENT');return ok();}
   case 'REVENGE':{
    if(s.rich.stored<=0)return fail('NOTHING_STORED','Rich has taken no damage to return');
    const tg=s.units[a.target];if(!tg||tg.kind!=='ENEMY'||tg.status!=='ACTIVE'||!R.spotted(s,tg))return fail('BAD_TARGET');
    if(R.dist(u,tg)>s.tun.revengeRange||!R.los(s,u,tg))return fail('OUT_OF_RANGE');return ok();
   }
   case 'OCTOPUS_BRAIN':return fail('SOURCE_REQUIRED','OCTOPUS BRAIN: the three context tricks are not OPEN-authorised',{sourceRequired:'OCTOPUS_BRAIN_TRICKS'});
   default:return fail('BAD_MOVE');
  }
 }

 // ============================ execution ============================
 function spend(u,n){u.ap=Math.max(0,u.ap-(n===undefined?1:n));}
 function exec(s,a,ev){
  const t=a.type;
  if(t==='END_TURN'){endPlayerPhase(s,ev);return;}
  if(t==='RETREAT'){finish(s,'RETREAT','PLAYER_CALLED',ev);return;}
  if(t==='PULL_UP'){pullUp(s,a,ev);return;}
  const u=s.units[a.unit];
  switch(t){
   case 'MOVE':case 'DASH':{spend(u);moveAlong(s,u,a.to,ev);break;}
   case 'SHOOT':{
    const w=R.weaponOf(s,u);spend(u);
    if(w.area&&a.at){const c=a.at;const h=fireArea(s,u,c,w,{},ev);break;}
    fire(s,u,s.units[a.target],{},ev);break;
   }
   case 'OVERWATCH':spend(u);u.ow=true;emit(ev,{t:'OVERWATCH_SET',id:u.id,sfx:'BX_OVERWATCH'});break;
   case 'HUNKER':spend(u);u.hunker=true;emit(ev,{t:'HUNKER',id:u.id});break;
   case 'RELOAD':spend(u);u.weapon.clip=u.weapon.max;emit(ev,{t:'RELOAD',id:u.id,clip:u.weapon.clip});break;
   case 'CARRY':{
    spend(u);const c=s.units[a.target];u.carrying=c.id;c.carriedBy=u.id;c.x=u.x;c.y=u.y;emit(ev,{t:'CARRY',id:u.id,target:c.id});break;
   }
   case 'ABILITY':execAbility(s,u,a,ev);break;
   case 'RICH_MOVE':execRichMove(s,u,a,ev);break;
  }
  revealCheck(s,ev);
  checkEnd(s,ev);
 }
 function execAbility(s,u,a,ev){
  const id=a.ability||D.CLASSES[u.cls].ability;const N=D.ABILITY_NUMBERS;spend(u);
  switch(id){
   case 'SHOULDER_CHECK':{
    const tg=s.units[a.target];const spot=approachTile(s,u,tg);
    if(!spot.stay)moveAlong(s,u,spot,ev,{});
    if(u.status==='ACTIVE'&&tg.status==='ACTIVE'){
     tg.exposed=true;emit(ev,{t:'CHECK',from:u.id,to:tg.id,dmg:N.shoulderCheckDamage,x:tg.x,y:tg.y,sfx:'BX_COVER_HIT'});
     const lost=hurt(s,tg,N.shoulderCheckDamage,u.id,ev);emit(ev,{t:'EXPOSED',id:tg.id});
    }
    break;
   }
   case 'DEAD_EYE':fire(s,u,s.units[a.target],{ability:'DEAD_EYE'},ev);break;
   case 'THE_CAR':{
    u.carUsed=true;
    if(a.mode==='RAM'){const tg=s.units[a.target];s.flags.carRammed=true;emit(ev,{t:'CAR_RAM',from:u.id,to:tg.id,dmg:N.carRamDamage,x:tg.x,y:tg.y});hurt(s,tg,N.carRamDamage,u.id,ev);}
    else{s.props.push({id:'p'+(s.props.length+1),x:a.to.x,y:a.to.y,level:'FULL',kind:'CAR',destructible:true,destroyed:false,temp:true});s.flags.carPlaced=true;emit(ev,{t:'CAR_COVER',from:u.id,x:a.to.x,y:a.to.y});}
    break;
   }
   case 'TALK_HIM_DOWN':{
    const tg=s.units[a.target];const chance=talkChance(u);const roll=Rng.percent(s.rng);const won=roll<chance;
    emit(ev,{t:'TALK',from:u.id,to:tg.id,chance,roll:Math.round(roll*100)/100,success:won});
    if(won){tg.status='REMOVED';tg.removedReason='SURRENDERED';u.facts.talkedDown.push(tg.type);emit(ev,{t:'REMOVED',id:tg.id,reason:'SURRENDERED',x:tg.x,y:tg.y});}
    break;
   }
   case 'VANISH':u.conceal=true;u.vanishShot=false;emit(ev,{t:'VANISH',id:u.id});break;
   case 'PATCH_UP':{
    const tg=s.units[a.target];
    if(tg.status==='DOWNED'){tg.stabilized=true;u.facts.stabilizedAllies++;emit(ev,{t:'STABILIZED',id:tg.id,by:u.id});}
    else{const before=tg.hp;tg.hp=Math.min(tg.maxHp,tg.hp+N.patchHeal);u.facts.healed+=tg.hp-before;emit(ev,{t:'HEAL',id:tg.id,amount:tg.hp-before,hp:tg.hp,src:'patch_up',by:u.id});}
    break;
   }
   case 'PHONE_OUT':{
    u.phoneUsed=true;let best=null;
    for(const p of s.pods){if(p.revealed)continue;const ms=enemies(s).filter(e=>e.pod===p.id&&e.status==='ACTIVE');if(!ms.length)continue;
     const d=Math.min(...ms.map(m=>R.dist(u,m)));const key=[d,p.id];if(!best||key<best.key)best={key,p,ms};}
    best.p.revealed=true;emit(ev,{t:'POD_REVEAL',pod:best.p.id,byPhone:true,members:best.ms.map(m=>({id:m.id,type:m.type,x:m.x,y:m.y})),sfx:'BX_POD_REVEAL'});
    break;
   }
  }
 }
 // ---- Rich ----
 function pullUp(s,a,ev){
  const r=s.units.rich,spot=richEntryTile(s,a.to);
  r.status='ACTIVE';r.x=spot.x;r.y=spot.y;r.ap=s.tun.richActions;r.moved=false;
  s.rich.status='ONSTAGE';s.rich.used=true;s.rich.pullTurn=s.turn;s.rich.visible=true;
  emit(ev,{t:'PULL_UP',x:spot.x,y:spot.y,turn:s.turn,sfx:'BX_SLIDEIN_IDLE'});
  emit(ev,{t:'RICH_SEEN',heat:D.RICH.heatIfSeen,vampgramPost:true});
  revealCheck(s,ev);checkEnd(s,ev);
 }
 function execRichMove(s,u,a,ev){
  const M=D.RICH.moves;spend(u);u.moved=true;
  switch(a.move){
   case 'BLOOD_BATH':{
    const tiles=areaTiles({area:'3x3'},a.at,u);emit(ev,{t:'BLOOD_BATH',x:a.at.x,y:a.at.y,tiles,dmg:M.BLOOD_BATH.damage});
    for(const e of enemies(s)){if(e.status!=='ACTIVE'||!R.onGrid(e))continue;if(!tiles.some(t=>t.x===e.x&&t.y===e.y))continue;hurt(s,e,M.BLOOD_BATH.damage,'rich',ev);emit(ev,{t:'AREA_HIT',from:'rich',to:e.id,dmg:M.BLOOD_BATH.damage,x:e.x,y:e.y});}
    break;
   }
   case 'VAMPIRE_BITE':{
    const tg=s.units[a.target];emit(ev,{t:'BITE',from:'rich',to:tg.id,dmg:M.VAMPIRE_BITE.damage,x:tg.x,y:tg.y});
    hurt(s,tg,M.VAMPIRE_BITE.damage,'rich',ev);
    const before=u.hp;u.hp=Math.min(u.maxHp,u.hp+M.VAMPIRE_BITE.heal);emit(ev,{t:'HEAL',id:'rich',amount:u.hp-before,hp:u.hp,src:'bite'});break;
   }
   case 'REVENGE':{
    const tg=s.units[a.target];const dmg=s.rich.stored;s.rich.stored=0;
    emit(ev,{t:'REVENGE',from:'rich',to:tg.id,dmg,x:tg.x,y:tg.y});hurt(s,tg,dmg,'rich',ev);break;
   }
  }
  revealCheck(s,ev);checkEnd(s,ev);
 }

 // ============================ phases ============================
 function endPlayerPhase(s,ev){
  // nobody left standing and Rich did not pull up: the squad is done
  if(!R.units(s).some(u=>u.side==='PLAYER'&&u.status==='ACTIVE')){finish(s,'FAILURE','SQUAD_DOWN',ev);return;}
  // end-of-turn effects for the squad
  for(const u of ogas(s)){
   if(u.status==='ACTIVE'&&u.traits.includes('ALWAYS_EATING')&&!u.moved&&u.hp<u.maxHp){u.hp=Math.min(u.maxHp,u.hp+D.TRAIT_NUMBERS.eatHeal);emit(ev,{t:'HEAL',id:u.id,amount:D.TRAIT_NUMBERS.eatHeal,hp:u.hp,src:'always_eating'});}
  }
  // bleeding (a DOWNED Oga has BLEED_TURNS player phases; carried/stabilised ones do not run out unless still bleeding)
  for(const u of ogas(s)){
   if(u.status!=='DOWNED'||u.stabilized)continue;
   u.bleed--;emit(ev,{t:'BLEED',id:u.id,bleed:u.bleed});
   if(u.bleed<=0){if(u.carriedBy){const c=s.units[u.carriedBy];if(c)c.carrying=null;u.carriedBy=null;}
    u.status='TAKEN';u.x=null;u.y=null;emit(ev,{t:'TAKEN',id:u.id,sfx:'BX_DOWNED'});}
  }
  for(const u of R.units(s))if(u.side==='PLAYER'){u.suppress=false;u.blind=false;u.ap=0;}
  if(checkEnd(s,ev))return;
  s.phase='ENEMY';emit(ev,{t:'PHASE',phase:'ENEMY',turn:s.turn});
  enemyPhase(s,ev);
  if(s.status!=='ACTIVE')return;
  for(const e of enemies(s)){e.suppress=false;e.blind=false;e.fear=false;e.exposed=false;}
  s.turn++;s.phase='PLAYER';startPlayerPhase(s,ev);
 }
 function startPlayerPhase(s,ev){
  for(const u of R.units(s)){
   if(u.side!=='PLAYER')continue;
   u.moved=false;u.ow=false;u.hunker=false;u.conceal=false;u.vanishShot=false;u.exposed=false;
   u.ap=u.status==='ACTIVE'?D.ACTIONS_PER_TURN:0;
   if(u.kind==='RICH'&&u.status==='ACTIVE')u.ap=s.tun.richActions;
  }
  emit(ev,{t:'PHASE',phase:'PLAYER',turn:s.turn});
  revealCheck(s,ev);
  if(s.turnLimit&&s.turn>s.turnLimit){finish(s,'RETREAT','TURN_LIMIT',ev);return;}
  if(s.objective.kind==='SURVIVE'&&s.turn>s.objective.turns){finish(s,'VICTORY','SURVIVED',ev);return;}
  if(s.turn>s.tun.hardTurnCap){finish(s,'FAILURE','STALEMATE',ev);return;}
  checkEnd(s,ev);
 }
 function enemyPhase(s,ev){
  const ai=root.RAShowdownAI;
  for(const e of enemies(s)){
   if(s.status!=='ACTIVE')return;
   if(e.status!=='ACTIVE')continue;
   const pod=s.pods.find(p=>p.id===e.pod);if(!pod||!pod.revealed)continue;
   if(e.fear){e.fear=false;emit(ev,{t:'FEAR_SKIP',id:e.id});continue;}
   e.ap=2;e.moved=false;
   ai.act(s,e,ev,{fire,moveAlong,revealCheck,checkEnd,hurt});
   checkEnd(s,ev);
  }
 }

 // ============================ ending ============================
 function checkEnd(s,ev){
  if(s.status!=='ACTIVE')return true;
  if(s.rich.down){finish(s,'RETREAT','RICH_DOWN',ev);return true;}
  const obj=s.objective.kind;
  if(obj==='ELIMINATE'&&liveEnemies(s).length===0){finish(s,'VICTORY','FIELD_CLEARED',ev);return true;}
  if(obj==='EXTRACT_TARGET'){const c=s.units.captive;if(c&&c.status==='EXTRACTED'){finish(s,'VICTORY','TARGET_EXTRACTED',ev);return true;}}
  const active=R.units(s).filter(u=>u.side==='PLAYER'&&u.status==='ACTIVE');
  if(!active.length){
   const turnAfter=s.phase==='ENEMY'?s.turn+1:s.turn;
   const possible=richReady(s)&&turnAfter>=D.RICH.pullUpFromTurn;
   if(!possible){finish(s,'FAILURE','SQUAD_DOWN',ev);return true;}
  }
  return false;
 }
 function finish(s,outcome,reason,ev){
  if(s.status==='ENDED')return;
  s.status='ENDED';s.phase='ENDED';
  s.result=buildResult(s,outcome,reason);
  emit(ev,{t:'END',outcome,reason,sfx:outcome==='VICTORY'?'BX_NAMECARD_SLAM':outcome==='FAILURE'?'BX_GONE':'BX_SLIDEIN_IDLE'});
 }
 function buildResult(s,outcome,reason){
  const remaining=liveEnemies(s).length;
  const recovered=remaining===0;  // nothing left on the field to take a downed Oga
  const ogaResults=ogas(s).map(u=>{
   let finalStatus='ACTIVE',how='ok';
   if(u.status==='EXTRACTED'){finalStatus='DOWNED';how='carried_out';}
   else if(u.status==='TAKEN'){finalStatus='CAPTURED';how='bled_out';}
   else if(u.status==='DOWNED'){if(recovered){finalStatus='DOWNED';how=u.stabilized?'stabilized_recovered':'recovered';}else{finalStatus='CAPTURED';how='left_behind';}}
   return {id:u.id,name:u.name,cls:u.cls,finalStatus,how,hp:u.hp,maxHp:u.maxHp,stabilized:!!u.stabilized,leftBehind:how==='left_behind'||how==='bled_out',
    facts:{...u.facts,talkedDown:[...(u.facts.talkedDown||[])]}};
  });
  const enemyResults=enemies(s).map(e=>({id:e.id,type:e.type,status:e.status==='ACTIVE'?'REMAINING':e.removedReason,hp:e.hp}));
  const captive=s.units.captive?{id:'captive',name:s.units.captive.name,extracted:s.units.captive.status==='EXTRACTED',status:s.units.captive.status==='EXTRACTED'?'EXTRACTED':'HELD'}:null;
  const silencerRelief=s.heat.silencerFired?-2:0;
  const base=s.heat.rpg+silencerRelief;
  return {schema:'F01.result/1',missionId:s.id,jobId:s.jobId,jobType:s.jobType,district:s.district,outcome,reason,turns:s.turn,seed:s.seed,
   objective:{kind:s.objective.kind,completed:(outcome==='VICTORY')},ogaResults,enemyResults,captive,bossFled:[...s.bossFled],
   rich:{used:s.rich.used,visible:s.rich.visible,pullTurn:s.rich.pullTurn,hp:s.units.rich?s.units.rich.hp:null,knockedDown:s.rich.down,damageTaken:s.rich.damageTaken,gone:false},
   heat:{base,rpg:s.heat.rpg,silencerRelief,richSeen:s.rich.visible?D.RICH.heatIfSeen:0,total:base+(s.rich.visible?D.RICH.heatIfSeen:0)},
   vampgram:{richSeen:s.rich.visible},cash:0,car:{rammed:!!s.flags.carRammed,placed:!!s.flags.carPlaced},
   modifiers:clone(s.modifiers),stats:clone(s.stats),enemiesRemaining:remaining,
   determinism:{seed:s.seed,rngCalls:s.rng.calls,actions:s.actions.length,stateHash:null},
   provisional:D.PROVISIONAL.map(p=>p.id),sourceRequired:D.SOURCE_REQUIRED.map(p=>p.id),gone:[]};
 }

 // ============================ public API ============================
 function fnv(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return ('00000000'+h.toString(16)).slice(-8);}
 const hash=s=>fnv(JSON.stringify(s));
 function apply(state,action){
  const v=validate(state,action);
  if(!v.ok)return {...v,state,events:[]};
  const s=clone(state);const ev=[];
  exec(s,action,ev);
  s.actions.push(clone(action));
  if(s.result)s.result.determinism={seed:s.seed,rngCalls:s.rng.calls,actions:s.actions.length,stateHash:null},s.result.determinism.stateHash=hash({...s,result:null});
  return {ok:true,state:s,events:ev,code:'OK'};
 }
 function replay(cfg,actions){
  let s=create(cfg);const events=[];
  for(const a of actions){const r=apply(s,a);if(!r.ok)return {ok:false,at:a,code:r.code,state:s};s=r.state;events.push(...r.events);}
  return {ok:true,state:s,events};
 }
 const serialize=s=>JSON.stringify(s);
 function deserialize(text){
  const s=typeof text==='string'?JSON.parse(text):clone(text);
  if(!s||s.v!==1||!s.units||!s.rng)throw Object.assign(new Error('not an F01 tactical state'),{code:'BAD_STATE'});
  return s;
 }

 root.RAShowdownEngine={create,apply,validate,validateAbility,available,replay,serialize,deserialize,hash,clone,abilitiesOf,talkChance,canPullUp,richReady,approachTile,players,ogas,enemies,liveEnemies,dashOK,onExtraction,isFree,nearestFree,fire,moveAlong,startPlayerPhase,
  _emit:emit};
})(typeof window!=='undefined'?window:globalThis);
