(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — enemy AI.  PROVISIONAL (see PROVISIONAL[ENEMY_AI]): the smallest deterministic behaviour that makes the
 // authored enemy notes play. NOT canon. No randomness here (ties break by cost, then y, then x, then id): every random
 // number of a fight is a hit / damage / crit roll inside the engine.
 //   CHEWER      flanks whenever it can
 //   ENFORCER    charges the nearest Oga (shotgun, shrugs off half cover)
 //   HUNTER      likes cover and range; ignores VANISH (engine tag)
 //   LIEUTENANT  stays glued to his crew (the +10 aura is applied by the hit model)
 //   LIL SMACK   fights like a bruiser; CHEW and the flee-at-4 are rules, not AI
 const D=root.RAShowdownData,R=root.RAShowdownRules;
 const ghost=(e,p)=>Object.assign({},e,{x:p.x,y:p.y});
 function foes(s,e){
  return R.units(s).filter(u=>u.side==='PLAYER'&&u.status==='ACTIVE'&&R.onGrid(u)&&u.kind!=='CAPTIVE');
 }
 function coverScore(s,e,pos,threats){
  let c=0;const g=ghost(e,pos);
  for(const t of threats){const cv=R.coverVs(s,g,t);c+=cv.level==='FULL'?2:cv.level==='HALF'?1:0;}
  return threats.length?c/threats.length:0;
 }
 // best shot from a position: {target, pv, score}
 function bestShot(s,e,pos,threats){
  const g=ghost(e,pos);let best=null;
  for(const t of threats){
   const pv=R.preview(s,g,t,{});if(!pv.ok||pv.chance<=0)continue;
   const avg=(pv.dmgMin+pv.dmgMax)/2*pv.hits,p=pv.chance/100;
   let score=p*Math.min(avg,t.hp)+(avg>=t.hp?p*8:0)+(t.kind==='RICH'?.4:0)+(pv.flanked&&e.type==='CHEWER'?2.5:0);
   const key=[-score,t.id];
   if(!best||key[0]<best.key[0]||(key[0]===best.key[0]&&key[1]<best.key[1]))best={target:t,pv,score,key};
  }
  return best;
 }
 function positionBias(s,e,pos,shot,threats){
  let b=0;
  const cover=coverScore(s,e,pos,threats);
  if(e.type==='HUNTER'){b+=cover*1.6;if(shot)b+=Math.min(shot.pv.distance,5)*.15;}
  else if(e.type==='ENFORCER'){b+=(shot?(4-Math.min(shot.pv.distance,4))*.6:0);}  // charges: closer is better
  else b+=cover*.7;
  if(e.type==='LIEUTENANT'){for(const o of R.units(s))if(o.id!==e.id&&o.side==='ENEMY'&&o.status==='ACTIVE'&&R.adjacent(pos,o))b+=.9;}
  return b;
 }
 function act(s,e,ev,api){
  const threats=foes(s,e).filter(t=>!t.conceal||(e.tags||[]).includes('IGNORES_VANISH'));
  if(!threats.length)return;
  let shots=s.tun.enemyShotsPerTurn;
  const here={x:e.x,y:e.y,cost:0};
  const eval1=(list)=>{
   let best=null;
   for(const p of list){
    const shot=bestShot(s,e,p,threats);
    const score=(shot?shot.score*2:0)+positionBias(s,e,p,shot,threats)-p.cost*.05;
    const key=[-score,p.cost,p.y,p.x];
    if(!best||cmp(key,best.key)<0)best={pos:p,shot,score,key};
   }
   return best;
  };
  const cmp=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]<b[i])return -1;if(a[i]>b[i])return 1;}return 0;};
  // single move
  const one=[here,...R.destinations(s,e,e.mobility)];
  let pick=eval1(one);
  if(!pick||!pick.shot){
   // nothing to shoot after one move: dash toward the closest Oga (second MOVE), then look again
   const two=[here,...R.destinations(s,e,e.mobility*2)];
   let best=null;
   for(const p of two){
    const g=ghost(e,p);const dmin=Math.min(...threats.map(t=>R.dist(g,t)));
    const shot=bestShot(s,e,p,threats);
    const score=(shot?100:0)-dmin*1.0+positionBias(s,e,p,shot,threats)-p.cost*.02;
    const key=[-score,p.cost,p.y,p.x];
    if(!best||cmp(key,best.key)<0)best={pos:p,shot,score,key};
   }
   pick=best;
  }
  if(pick.pos.x!==e.x||pick.pos.y!==e.y){
   const budget=Math.max(e.mobility,pick.pos.cost);
   api.moveAlong(s,e,pick.pos,ev,{budget});
   if(e.status!=='ACTIVE'||s.status!=='ACTIVE')return;
  }
  // shoot from where we ended up
  const live=foes(s,e).filter(t=>!t.conceal||(e.tags||[]).includes('IGNORES_VANISH'));
  while(shots>0&&e.status==='ACTIVE'&&s.status==='ACTIVE'){
   const shot=bestShot(s,e,e,live);if(!shot)break;
   api.fire(s,e,shot.target,{},ev);shots--;
   api.checkEnd(s,ev);
  }
 }
 root.RAShowdownAI={act,bestShot};
})(typeof window!=='undefined'?window:globalThis);
