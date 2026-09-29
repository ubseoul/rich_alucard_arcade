(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — geometry + hit math. PURE functions over the tactical state (no RNG, no mutation).
 // Field: 6x9 portrait grid, HALF/FULL directional cover, height, LOS. Hit model = Vol 7 section 5.3, exactly.
 const D=root.RAShowdownData;
 const K=(x,y)=>x+','+y;
 const dist=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)); // Chebyshev (PROVISIONAL metric)
 const inb=(s,x,y)=>x>=0&&y>=0&&x<s.map.cols&&y<s.map.rows;
 const onGrid=u=>!!u&&(u.status==='ACTIVE'||u.status==='DOWNED')&&!u.carriedBy&&u.x!=null;
 const units=s=>s.order.map(id=>s.units[id]);
 const propAt=(s,x,y)=>s.props.find(p=>p.x===x&&p.y===y&&!p.destroyed)||null;
 const unitAt=(s,x,y)=>units(s).find(u=>onGrid(u)&&u.x===x&&u.y===y)||null;
 const elev=(s,x,y)=>s.map.elev[K(x,y)]||0;
 const isPlayerSide=u=>u.side==='PLAYER';
 const hostile=(a,b)=>(a.side==='PLAYER'&&b.side==='ENEMY')||(a.side==='ENEMY'&&b.side==='PLAYER');
 const alive=u=>u.status==='ACTIVE';
 const has=(u,trait)=>(u.traits||[]).includes(trait);
 const story=(u,id)=>(u.stories||[]).includes(id);

 // an enemy is targetable only once its POD has been revealed (spotted)
 const spotted=(s,e)=>{if(!e||e.kind!=='ENEMY')return true;const p=s.pods.find(x=>x.id===e.pod);return !p||p.revealed;};

 // ---- movement ----
 const CARD=[[0,-1],[1,0],[0,1],[-1,0]];
 const DIRS=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
 function effectiveMobility(s,u){
  let m=u.mobility;
  if(u.carrying&&!story(u,'carried_tunde'))m-=s.tun.carryMobilityPenalty;
  return Math.max(1,m);
 }
 // Dijkstra over the 8-neighbour grid. Returns Map key -> {x,y,cost,prev}
 function reach(s,u,budget){
  const out=new Map();const start={x:u.x,y:u.y,cost:0,prev:null};out.set(K(u.x,u.y),start);
  const open=[start];
  const step=(a,b)=>1+((elev(s,a.x,a.y)!==elev(s,b.x,b.y)&&!has(u,'CHURCH_SHOES'))?s.tun.climbExtraCost:0);
  while(open.length){
   open.sort((p,q)=>p.cost-q.cost||p.y-q.y||p.x-q.x);const cur=open.shift();
   for(const [dx,dy] of DIRS){
    const nx=cur.x+dx,ny=cur.y+dy;if(!inb(s,nx,ny)||propAt(s,nx,ny))continue;
    if(dx&&dy&&propAt(s,cur.x+dx,cur.y)&&propAt(s,cur.x,cur.y+dy))continue; // no squeezing between two props
    const occ=unitAt(s,nx,ny);
    if(occ&&occ.id!==u.id&&(hostile(u,occ)&&occ.status==='ACTIVE'))continue;     // enemies block
    const cost=cur.cost+step(cur,{x:nx,y:ny});if(cost>budget)continue;
    const k=K(nx,ny),prior=out.get(k);
    if(!prior||cost<prior.cost){const node={x:nx,y:ny,cost,prev:cur};out.set(k,node);open.push(node);}
   }
  }
  return out;
 }
 // Tiles the unit can END on within budget (not occupied, not its own tile)
 function destinations(s,u,budget){
  const r=reach(s,u,budget),out=[];
  for(const n of r.values()){if(n.cost===0)continue;const occ=unitAt(s,n.x,n.y);if(occ&&occ.id!==u.id)continue;out.push({x:n.x,y:n.y,cost:n.cost});}
  return out.sort((a,b)=>a.y-b.y||a.x-b.x);
 }
 function path(s,u,dest,budget){
  const r=reach(s,u,budget);let n=r.get(K(dest.x,dest.y));if(!n)return null;
  const p=[];while(n&&n.prev){p.push({x:n.x,y:n.y});n=n.prev;}return p.reverse();
 }

 // ---- line of sight ----
 function line(a,b){
  const pts=[];let x=a.x,y=a.y;const dx=Math.abs(b.x-a.x),dy=Math.abs(b.y-a.y),sx=a.x<b.x?1:-1,sy=a.y<b.y?1:-1;let err=dx-dy;
  for(;;){pts.push({x,y});if(x===b.x&&y===b.y)break;const e2=2*err;if(e2>-dy){err-=dy;x+=sx;}if(e2<dx){err+=dx;y+=sy;}}
  return pts;
 }
 // FULL cover is tall: it blocks a ray passing through its tile - except a piece touching either end (that is the cover case).
 function clear(s,a,b){
  const pts=line(a,b);
  for(let i=1;i<pts.length-1;i++){const p=propAt(s,pts[i].x,pts[i].y);if(p&&p.level==='FULL'&&dist(pts[i],a)>1&&dist(pts[i],b)>1)return false;}
  return true;
 }
 const los=(s,a,b)=>clear(s,a,b)||clear(s,b,a);

 // ---- cover (directional) ----
 // A cardinal neighbour prop protects the target from shooters within 45 degrees of that side (inclusive).
 function coverVs(s,t,from){
  let best=null,any=false;
  for(const [dx,dy] of CARD){
   const p=propAt(s,t.x+dx,t.y+dy);if(!p)continue;any=true;
   const vx=from.x-t.x,vy=from.y-t.y,along=vx*dx+vy*dy,perp=Math.abs(vx*dy-vy*dx);
   if(along>0&&along>=perp&&(!best||(p.level==='FULL'&&best.level!=='FULL')))best=p;
  }
  return {level:best?best.level:'NONE',piece:best,flanked:any&&!best,any};
 }

 // ---- weapons ----
 const weaponOf=(s,u)=>u&&u.weapon?s.weapons[u.weapon.id]||null:null;
 const rangeMax=(s,w)=>w.area?s.tun.rangeMax.long:s.tun.rangeMax[w.band]||s.tun.rangeMax.medium;
 const hasMod=(u,m)=>(u.mods||[]).includes(m);

 // ---- shooting legality ----
 function canShoot(s,u,{reaction=false}={}){
  if(!u||u.status!=='ACTIVE')return {ok:false,code:'NOT_ACTIVE'};
  const w=weaponOf(s,u);if(!w)return {ok:false,code:'NO_WEAPON'};
  if(!reaction&&u.hunker)return {ok:false,code:'HUNKERED'};
  if(!reaction&&u.ap<1)return {ok:false,code:'NO_ACTIONS'};
  if(w.noMoveShoot&&u.moved&&!reaction)return {ok:false,code:'MOVED_THIS_TURN'};
  if(w.perShowdown&&(u.weapon.fired||0)>=w.perShowdown)return {ok:false,code:'ONE_PER_SHOWDOWN'};
  if(w.condition&&!(s.conditions||{})[w.condition])return {ok:false,code:'CONDITION',detail:w.condition};
  if(u.weapon.clip<1)return {ok:false,code:'NO_AMMO'};
  return {ok:true};
 }

 // ---- adjacency-driven auras (recomputed on demand: no stale state) ----
 const adjacent=(a,b)=>dist(a,b)<=1&&!(a.x===b.x&&a.y===b.y);
 const bondNear=(s,u)=>(u.bonds||[]).some(id=>{const p=s.units[id];return p&&p.status==='ACTIVE'&&onGrid(p)&&adjacent(u,p);});
 const auraFor=(s,u)=>u.side==='ENEMY'&&units(s).some(o=>o.id!==u.id&&o.side==='ENEMY'&&o.status==='ACTIVE'&&o.type==='LIEUTENANT'&&adjacent(u,o));
 const disgusted=(s,u)=>units(s).some(o=>o.id!==u.id&&o.type==='LIL_SMACK'&&o.status==='ACTIVE'&&adjacent(u,o)&&(s.tun.chewAffects==='OGAS'?u.side==='PLAYER':u.side==='ENEMY'));

 // ---- THE HIT MODEL (Vol 7 section 5.3) ----
 // preview(state, shooter, target, {reaction, ability:'DEAD_EYE'|null}) -> honest chance + full breakdown
 function preview(s,sh,tg,o={}){
  const w=weaponOf(s,sh);const lines=[];const add=(id,label,value,force)=>{if(value||force)lines.push({id,label,value});};
  if(!w)return {ok:false,code:'NO_WEAPON'};
  if(!hostile(sh,tg)||tg.status!=='ACTIVE')return {ok:false,code:'BAD_TARGET'};
  if(sh.side==='PLAYER'&&!spotted(s,tg))return {ok:false,code:'NOT_SPOTTED'};
  const d=dist(sh,tg);
  if(d>rangeMax(s,w))return {ok:false,code:'OUT_OF_RANGE',distance:d};
  if(!los(s,sh,tg))return {ok:false,code:'NO_LOS',distance:d};
  if(tg.conceal&&!(sh.tags||[]).includes('IGNORES_VANISH'))return {ok:false,code:'CONCEALED'};
  const N=D.ABILITY_NUMBERS,H=D.HIT,T=D.TRAIT_NUMBERS,S=D.STORY_NUMBERS;
  let aim=sh.aim;add('aim','AIM',aim);
  const cv=coverVs(s,tg,sh);const higher=elev(s,sh.x,sh.y)>elev(s,tg.x,tg.y);
  // cover
  let coverLevel=cv.level;
  const flanked=cv.flanked&&!tg.exposed?true:false;
  if(tg.exposed&&cv.any){coverLevel='NONE';add('exposed','EXPOSED (cover ignored)',0,true);}
  else if(flanked){coverLevel='NONE';}
  let coverMod=0;
  if(coverLevel==='FULL')coverMod=H.fullCover;
  else if(coverLevel==='HALF'){
   if(higher)add('height_ignores','HIGH GROUND ignores half cover',0,true);
   else if((sh.tags||[]).includes('SHRUGS_HALF_COVER'))add('shrug','SHRUGS OFF HALF COVER',0,true);
   else coverMod=H.halfCover;
  }
  if(coverMod)add('cover',coverLevel==='FULL'?'FULL COVER':'HALF COVER',coverMod);
  if(flanked)add('flanked','FLANKED (cover ignored)',0,true);
  if(higher)add('height','HEIGHT',H.height);
  if(o.reaction)add('overwatch','OVERWATCH',H.overwatch);
  if(w.closeBonus&&d<=H.closeRange)add('close','CLOSE RANGE',H.closeBonus);
  if(w.longPenalty&&d>H.pistolLongFrom)add('long','LONG RANGE',-H.pistolLongPenaltyPerTile*(d-H.pistolLongFrom));
  if(hasMod(sh,'scope')&&d>=s.tun.scopeMinDistance)add('scope','SCOPE',10);
  if(tg.hunker)add('hunker','HUNKERED',H.hunkered);
  if(has(tg,'SMALL'))add('small','SMALL',T.smallDefense);
  // shooter-side modifiers
  if(o.ability==='DEAD_EYE')add('dead_eye','DEAD EYE',N.deadEyeAim);
  if(w.bursts&&w.burstAim)add('burst','TWO TAPS',w.burstAim);
  if(sh.conceal&&!sh.vanishShot)add('vanish','FROM CONCEALMENT',N.vanishFirstShotAim);
  if(has(sh,'CALM')&&sh.hunker)add('calm','CALM',T.calmAim);
  if(has(sh,'ROOKIE')&&!(sh.stories||[]).length)add('rookie','ROOKIE',T.rookieAim);
  const big=has(sh,'BIG_POTENTIAL')?2:1;
  if(story(sh,'saw_95_miss'))add('story_95','SAW 95% MISS',S.saw95Aim*big);
  if(story(sh,'survived_car_wash')&&coverOfShooter(s,sh)!=='NONE')add('story_wash','SURVIVED THE CAR WASH',S.carWashAim*big);
  if(bondNear(s,sh))add('bond','DAY ONES',D.BOND.aim);
  if(auraFor(s,sh))add('lieutenant','LIEUTENANT',D.ENEMY_NUMBERS.lieutenantAura);
  if(disgusted(s,sh))add('chew','DISGUSTED',D.ENEMY_NUMBERS.chewAim);
  if(sh.suppress)add('suppress','SUPPRESSED',-20);
  if(sh.blind)add('blind','BLINDED',-15);
  const sum=lines.reduce((a,l)=>a+l.value,0);
  const chance=Math.max(0,Math.min(100,sum));
  const neverMiss=!!(o.reaction&&w.owNeverMiss);
  // crit: base 10, FLANKED +30
  const crit=Math.max(0,Math.min(100,H.critBase+(flanked?H.flankedCrit:0)+(sh.critBonus||0)));
  // damage
  let lo=w.dmg[0],hi=w.dmg[1];
  const plus=[];
  if(has(sh,'DRESSED_TO_KILL')&&sh.hp===sh.maxHp){lo+=T.dressedDamage;hi+=T.dressedDamage;plus.push('DRESSED TO KILL +1');}
  if(o.ability==='DEAD_EYE'){lo+=N.deadEyeDamage;hi+=N.deadEyeDamage;plus.push('DEAD EYE +3');}
  if(w.silver&&tg.race==='VAMPIRE'){lo+=w.silver;hi+=w.silver;plus.push('SILVER +2');}
  let mult=1;if(w.vsUndead&&(tg.tags||[]).includes('undead')){mult=w.vsUndead;plus.push('UNDEAD x2');}
  return {ok:true,chance:neverMiss?100:chance,rawSum:sum,neverMiss,crit,dmgMin:lo*mult,dmgMax:hi*mult,mult,plus,
   breakdown:lines,cover:coverLevel,coverPiece:cv.piece?cv.piece.id:null,flanked,heightAdvantage:higher,distance:d,
   hits:(w.bursts||w.hits||1),burstAim:w.burstAim||0,weapon:w.id};
 }
 // cover level the given unit itself currently enjoys against the nearest hostile it can see (used by the car-wash story)
 function coverOfShooter(s,u){
  let best='NONE';
  for(const o of units(s)){if(!hostile(u,o)||o.status!=='ACTIVE'||!onGrid(o))continue;
   const c=coverVs(s,u,o);if(c.level==='FULL')return 'FULL';if(c.level==='HALF')best='HALF';}
  return best;
 }
 // Cover glyph a unit shows against a given looker (UI helper): {level, flanked}
 const coverGlyph=(s,t,looker)=>{const c=coverVs(s,t,looker);return {level:c.level,flanked:c.flanked};};

 // All valid targets for a shooter (used by UI / AI)
 function targets(s,sh,o={}){
  const out=[];
  for(const t of units(s)){if(!onGrid(t)||!hostile(sh,t)||t.status!=='ACTIVE'||t.kind==='CAPTIVE')continue;
   const p=preview(s,sh,t,o);if(p.ok)out.push({id:t.id,preview:p});}
  return out;
 }
 // SIGHT for POD reveal / spotting
 function spots(s,a,b){return onGrid(a)&&onGrid(b)&&dist(a,b)<=s.tun.sightRange&&los(s,a,b);}

 root.RAShowdownRules={K,dist,inb,onGrid,units,propAt,unitAt,elev,isPlayerSide,hostile,alive,has,story,DIRS,CARD,effectiveMobility,reach,destinations,path,line,clear,los,coverVs,coverGlyph,weaponOf,rangeMax,hasMod,canShoot,preview,targets,spots,spotted,coverOfShooter,adjacent,bondNear,auraFor,disgusted};
})(typeof window!=='undefined'?window:globalThis);
