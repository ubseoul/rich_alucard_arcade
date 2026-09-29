(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — the player-facing tactical UI (sole UX/UI owner: F01). mount(session,opts) -> Promise<result>.
 // Portrait-first (360 / 390 / 430), touch-first, mouse and keyboard supported. Two-tap confirm for every consequential action:
 // first tap PREVIEWS (path, hit chance, breakdown), second tap COMMITS. The UI never rolls dice and never decides rules:
 // it reads E.available()/R.preview() and sends actions to the session.
 const D=root.RAShowdownData,E=root.RAShowdownEngine,R=root.RAShowdownRules,S=root.RAShowdownSprites,X=root.RAShowdownSfx;
 const $=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;};
 const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 const WHY={NO_ACTIONS:'NO ACTIONS LEFT',BOXED_IN:'NOWHERE TO GO',NO_TARGET:'NO TARGET IN SIGHT',NO_AMMO:'OUT OF AMMO - RELOAD',HUNKERED:'HUNKERED: NO SHOT',MOVED_THIS_TURN:"CAN'T FIRE AFTER MOVING",ONE_PER_SHOWDOWN:'ONCE PER SHOWDOWN',
  SOURCE_REQUIRED:'SOURCE REQUIRED',IMPATIENT:"IMPATIENT: NO OVERWATCH",ALREADY:'ALREADY DONE',FULL:'ALREADY LOADED',NOT_ADJACENT:'NOT NEXT TO ANYONE DOWN',NO_PATH:'CAN\'T REACH',NOTHING_TO_DO:'NOTHING TO FIX',
  NOTHING_HIDDEN:'NOTHING HIDDEN',NOTHING_STORED:'NO DAMAGE STORED',ALREADY_CARRYING:'ALREADY CARRYING',NOT_SPOTTED:'NOT SPOTTED',NO_LOS:'NO LINE OF SIGHT',OUT_OF_RANGE:'OUT OF RANGE',CONCEALED:'CAN\'T SEE THEM',NOT_ACTIVE:'NOT AVAILABLE',TOO_EARLY:'RICH PULLS UP FROM TURN 3',RICH_NO_GUN:'RICH USES HIS MOVES',NO_CHANCE:'NO CHANCE TO HIT'};
 const ICON={MOVE:'MOVE',SHOOT:'SHOOT',OVERWATCH:'OVERWATCH',HUNKER:'HUNKER',ABILITY:'ABILITY',CARRY:'CARRY',RELOAD:'RELOAD',ITEM:'ITEM'};
 const LABEL={MOVE:'MOVE',SHOOT:'SHOOT',OVERWATCH:'OVERWATCH',HUNKER:'HUNKER',ABILITY:'ABILITY',CARRY:'CARRY',RELOAD:'RELOAD',ITEM:'ITEM'};

 function mount(session,opts){
  opts=opts||{};
  return new Promise(resolve=>{const ui=create(session,opts,resolve);ui.start();});
 }

 function create(session,opts,done){
  const host=opts.container||document.body;
  let pulled=false,speed=1,busy=false,sel=null,mode='idle',plan=null,menuOpen=false,endArm=0,destroyed=false,skip=false,abilityMenu=null,pendingCrit={};
  const els=new Map();               // unit id -> element
  let tile=56;
  const st=()=>session.state;
  const wait=ms=>new Promise(r=>setTimeout(r,skip?Math.min(ms,30):ms/speed));

  // ---------- skeleton ----------
  const rootEl=$('div','sd');rootEl.setAttribute('role','application');rootEl.setAttribute('aria-label','Showdown tactical field');
  rootEl.innerHTML=`<div class="sd-haze"></div><div class="sd-rain"></div>
  <header class="sd-top"><button class="sd-btn" data-a="menu" aria-label="Menu">MENU</button>
   <div class="sd-turn"><span>TURN</span><b data-r="turn">1</b></div>
   <div class="sd-obj"><div class="k" data-r="objk">OBJECTIVE</div><div class="v" data-r="obj"></div><div class="sd-phase" data-r="phase">YOUR TURN</div></div>
   <button class="sd-btn sd-rich" data-a="pullup" hidden>PULL UP</button></header>
  <div class="sd-side"><div class="sd-chips" data-r="chips"></div>
  <section class="sd-cmd" data-r="cmd"></section></div>
  <div class="sd-stage"><div class="sd-frame"><div class="sd-board" data-r="board">
    <div class="sd-ground" data-r="ground"></div><div class="sd-props" data-r="props"></div><div class="sd-hl" data-r="hl"></div>
    <div class="sd-units" data-r="units"></div><div class="sd-fog" data-r="fog"></div><div class="sd-fxl" data-r="fx"></div>
    <div class="sd-grade"></div><div class="sd-vig"></div><div class="sd-flash" data-r="flash"></div></div></div>
   <div class="sd-banner" data-r="banner"></div>
   <div class="sd-caption" data-r="caption"><div class="p"><span class="av"></span><div><span class="h">@whosrunninLA</span><b data-r="captext">95%???</b></div></div></div></div>
  <div class="sd-ov" data-r="ov" hidden></div><div class="sd-cut" data-r="cut" hidden></div>`;
  host.appendChild(rootEl);
  const q=n=>rootEl.querySelector(`[data-r=${n}]`);
  const R_={turn:q('turn'),obj:q('obj'),objk:q('objk'),phase:q('phase'),chips:q('chips'),cmd:q('cmd'),board:q('board'),ground:q('ground'),props:q('props'),hl:q('hl'),units:q('units'),fog:q('fog'),fx:q('fx'),
   flash:q('flash'),banner:q('banner'),caption:q('caption'),captext:q('captext'),ov:q('ov'),cut:q('cut')};
  const pullBtn=rootEl.querySelector('[data-a=pullup]');

  // ---------- sizing ----------
  function fit(){
   const W=rootEl.clientWidth||window.innerWidth,H=rootEl.clientHeight||window.innerHeight;
   const landscape=W/H>=1&&W>=820;
   const top=rootEl.querySelector('.sd-top').offsetHeight;
   let availW,availH;
   if(landscape){availW=W-400-24;availH=H-top-20;}
   else{
    const chips=R_.chips.offsetHeight,cmd=R_.cmd.offsetHeight;availW=W-14;availH=H-top-chips-cmd-14;
   }
   const t=Math.floor(Math.max(28,Math.min(availW/6,availH/9)));
   tile=t;rootEl.style.setProperty('--tile',t+'px');
  }
  function lockCmd(){ // pin the command panel to the height of its DEFAULT layout so the board never jumps between card and sheet
   const c=R_.cmd;if(rootEl.clientWidth/rootEl.clientHeight>=1&&rootEl.clientWidth>=820){c.style.height='';return;}
   const keep={plan,abilityMenu};plan=null;abilityMenu=null;c.style.height='';renderCmd();const h=c.offsetHeight;if(h)c.style.height=h+'px';
   plan=keep.plan;abilityMenu=keep.abilityMenu;renderCmd();
  }
  const onResize=()=>{lockCmd();fit();syncAll();};
  window.addEventListener('resize',onResize);window.addEventListener('orientationchange',onResize);

  // ---------- board ----------
  const cx=x=>(x+.5)*tile,cy=y=>(y+.5)*tile;
  function drawBoard(){
   const s=st();R_.ground.innerHTML='';
   for(let y=0;y<s.map.rows;y++)for(let x=0;x<s.map.cols;x++){
    const elev=s.map.elev[x+','+y];const ext=s.map.extraction.some(([a,b])=>a===x&&b===y);
    const i=$('i','tap');i.dataset.x=x;i.dataset.y=y;i.style.backgroundImage=`url(${S.ground(elev?'ELEV':ext?'EXIT':'FLOOR',(x*7+y*13)%6)})`;R_.ground.appendChild(i);
   }
   drawProps();
  }
  function drawProps(){
   const s=st();const have=new Map([...R_.props.children].map(e=>[e.dataset.id,e]));
   for(const p of s.props){
    let e=have.get(p.id);
    if(!e){e=$('div','sd-prop '+(p.level==='FULL'?'full':'half'));e.dataset.id=p.id;e.style.setProperty('--x',p.x);e.style.setProperty('--y',p.y);e.style.backgroundImage=`url(${S.prop(p.kind)})`;if(p.temp)e.classList.add('new');R_.props.appendChild(e);}
    if(p.destroyed&&!e.dataset.dead){e.dataset.dead='1';e.style.backgroundImage=`url(${S.prop('RUBBLE')})`;}
    have.delete(p.id);
   }
  }
  // ---------- units ----------
  function unitVisible(u){
   if(u.kind==='ENEMY')return u.status==='ACTIVE'&&R.spotted(st(),u);
   if(u.kind==='RICH')return u.status==='ACTIVE'||u.status==='DOWNED';
   return R.onGrid(u);
  }
  const hpClass=(hp,max)=>hp/max<=.3?'low':hp/max<=.6?'mid':'';
  function makeUnitEl(u){
   const e=$('div','u'+(u.side==='ENEMY'?' foe':'')+(u.boss?' boss':''));e.dataset.id=u.id;
   e.innerHTML=`<div class="spr" style="background-image:url(${S.unit(u)})"></div><div class="hp" style="--max:${u.maxHp}"><i style="width:100%"></i></div><div class="sel"></div><div class="cv" hidden></div><div class="bd"></div><span class="tg" hidden></span>`;
   R_.units.appendChild(e);els.set(u.id,e);return e;
  }
  function coverBadge(u){
   const s=st();
   // an enemy shows its cover against the selected Oga; an Oga shows its cover against the nearest spotted enemy
   let looker=null;
   if(u.side==='ENEMY'){const me=sel&&s.units[sel];if(me&&me.status==='ACTIVE'&&R.onGrid(me))looker=me;else return null;}
   else{let best=null;for(const e of R.units(s)){if(e.kind!=='ENEMY'||e.status!=='ACTIVE'||!R.spotted(s,e))continue;const d=R.dist(u,e);if(!best||d<best.d)best={e,d};}looker=best&&best.e;if(!looker||best.d>7)return null;}
   const c=R.coverVs(s,u,looker);
   if(c.flanked)return {kind:'FLANK',title:'FLANKED'};
   if(c.level==='HALF'||c.level==='FULL')return {kind:c.level,title:c.level+' COVER'};
   return null;
  }
  function syncUnit(u,{instant}={}){
   let e=els.get(u.id);
   if(!unitVisible(u)&&!(u.status==='DOWNED'&&R.onGrid(u))){if(e&&!e.classList.contains('gone'))e.classList.add('gone');if(e&&(u.status==='REMOVED'||u.status==='TAKEN'||u.status==='EXTRACTED')){/* keep for fade */}return;}
   if(!e)e=makeUnitEl(u);
   e.classList.remove('gone');
   if(u.x!=null){e.style.setProperty('--x',u.x);e.style.setProperty('--y',u.y);}
   const hp=e.querySelector('.hp i');hp.style.width=Math.max(0,u.hp/u.maxHp*100)+'%';hp.className=hpClass(u.hp,u.maxHp);
   e.querySelector('.hp').hidden=u.kind==='CAPTIVE';
   e.classList.toggle('downed',u.status==='DOWNED');
   e.classList.toggle('carried',!!u.carriedBy);
   e.classList.toggle('sel',sel===u.id);
   e.classList.toggle('done',u.side==='PLAYER'&&u.status==='ACTIVE'&&u.ap===0&&st().phase==='PLAYER');
   e.classList.toggle('vanish',!!u.conceal);
   const bd=e.querySelector('.bd');let html='';
   if(u.ow)html+=`<img alt="overwatch" src="${S.icon('OVERWATCH','#37d5e8')}">`;
   if(u.hunker)html+=`<img alt="hunkered" src="${S.icon('HUNKER','#e8c14a')}">`;
   if(u.carrying)html+=`<img alt="carrying" src="${S.icon('CARRY','#5fe08a')}">`;
   if(u.suppress||u.blind)html+=`<img alt="debuffed" src="${S.icon('FLANK','#d7193f')}">`;
   bd.innerHTML=html;
   const tg=e.querySelector('.tg');
   if(u.status==='DOWNED'&&u.kind==='OGA'){tg.hidden=false;tg.textContent=u.stabilized?'SAFE':'BLEED '+u.bleed;tg.className='tg '+(u.stabilized?'r':'x');}
   else if(u.kind==='CAPTIVE'){tg.hidden=false;tg.textContent='CAPTIVE';tg.className='tg';}
   else tg.hidden=true;
   const cv=e.querySelector('.cv');const b=u.status==='ACTIVE'?coverBadge(u):null;
   if(b){cv.hidden=false;cv.className='cv'+(b.kind==='FLANK'?' flank':'');cv.title=b.title;cv.innerHTML=`<img alt="${b.title}" src="${S.icon(b.kind==='FLANK'?'FLANK':b.kind,b.kind==='FLANK'?'#fff':b.kind==='FULL'?'#37d5e8':'#e8c14a')}" width="12" height="12" style="width:12px;height:12px">`;}else cv.hidden=true;
   e.setAttribute('aria-label',`${u.name} ${u.hp}/${u.maxHp}`);
  }
  function syncUnits(){for(const u of R.units(st()))syncUnit(u);}
  // fog: tiles no Oga can see
  function syncFog(){
   const s=st();const seers=R.units(s).filter(u=>u.side==='PLAYER'&&u.status==='ACTIVE'&&R.onGrid(u));
   R_.fog.innerHTML='';
   for(let y=0;y<s.map.rows;y++)for(let x=0;x<s.map.cols;x++){
    const t={x,y};const seen=seers.some(u=>R.dist(u,t)<=s.tun.sightRange&&R.los(s,u,t));
    if(!seen){const i=document.createElement('i');i.style.setProperty('--x',x);i.style.setProperty('--y',y);R_.fog.appendChild(i);}
   }
  }

  // ---------- highlights ----------
  function hl(x,y,cls){const d=$('div','sd-tile '+cls);d.style.setProperty('--x',x);d.style.setProperty('--y',y);R_.hl.appendChild(d);return d;}
  function syncHl(){
   const s=st();R_.hl.innerHTML='';
   for(const [x,y] of s.map.extraction)hl(x,y,'hl-exit');
   if(s.status!=='ACTIVE'||s.phase!=='PLAYER'||busy)return;
   const u=sel&&s.units[sel];
   if(u&&u.status==='ACTIVE'&&R.onGrid(u)){
    hl(u.x,u.y,'hl-sel');
    if((mode==='idle'||mode==='move')&&u.ap>0){
     const m=R.effectiveMobility(s,u);const one=R.destinations(s,u,m);const set=new Set(one.map(d=>d.x+','+d.y));
     one.forEach(d=>hl(d.x,d.y,'hl-move'));
     if(u.ap>=2)R.destinations(s,u,m*2).forEach(d=>{if(!set.has(d.x+','+d.y))hl(d.x,d.y,'hl-dash');});
    }
    if(plan&&plan.kind==='move'){plan.path.forEach(p=>hl(p.x,p.y,'hl-path'));hl(plan.to.x,plan.to.y,'hl-dest');}
    if(plan&&plan.area)plan.area.forEach(t=>{if(R.inb(s,t.x,t.y))hl(t.x,t.y,'hl-area');});
    if(mode.startsWith('t:')){
     for(const t of targetList())hl(t.x,t.y,t.friend?'hl-friend':'hl-target');
    }
   }
  }

  // ---------- targeting ----------
  // returns [{id,x,y,friend}] for the current targeting mode
  function targetList(){
   const s=st(),u=sel&&s.units[sel];if(!u)return [];
   const out=[];const m=mode;
   const enemiesV=E.enemies(s).filter(e=>e.status==='ACTIVE'&&R.onGrid(e)&&R.spotted(s,e));
   const push=(t,friend)=>out.push({id:t.id,x:t.x,y:t.y,friend:!!friend});
   if(m==='t:shoot')for(const t of R.targets(s,u,{}))push(s.units[t.id]);
   else if(m==='t:DEAD_EYE')for(const t of R.targets(s,u,{ability:'DEAD_EYE'}))push(s.units[t.id]);
   else if(m==='t:SHOULDER_CHECK')enemiesV.forEach(e=>{if(E.validate(s,{type:'ABILITY',unit:u.id,ability:'SHOULDER_CHECK',target:e.id}).ok)push(e);});
   else if(m==='t:RAM')enemiesV.forEach(e=>{if(E.validate(s,{type:'ABILITY',unit:u.id,ability:'THE_CAR',mode:'RAM',target:e.id}).ok)push(e);});
   else if(m==='t:TALK_HIM_DOWN')enemiesV.forEach(e=>{if(E.validate(s,{type:'ABILITY',unit:u.id,ability:'TALK_HIM_DOWN',target:e.id}).ok)push(e);});
   else if(m==='t:PATCH_UP')R.units(s).forEach(o=>{if((o.kind==='OGA'||o.kind==='RICH')&&E.validate(s,{type:'ABILITY',unit:u.id,ability:'PATCH_UP',target:o.id}).ok)push(o,true);});
   else if(m==='t:carry')R.units(s).forEach(o=>{if((o.kind==='OGA'||o.kind==='CAPTIVE')&&o.status==='DOWNED'&&!o.carriedBy&&R.adjacent(u,o))push(o,true);});
   else if(m==='t:bite')enemiesV.forEach(e=>{if(R.adjacent(u,e))push(e);});
   else if(m==='t:revenge')enemiesV.forEach(e=>{if(E.validate(s,{type:'RICH_MOVE',unit:'rich',move:'REVENGE',target:e.id}).ok)push(e);});
   return out;
  }
  // free-tile targeting (car cover, blood bath, RPG)
  function tileOK(x,y){
   const s=st(),u=sel&&s.units[sel];if(!u)return false;
   if(mode==='t:carcover')return E.validate(s,{type:'ABILITY',unit:u.id,ability:'THE_CAR',mode:'COVER',to:{x,y}}).ok;
   if(mode==='t:bloodbath')return E.validate(s,{type:'RICH_MOVE',unit:'rich',move:'BLOOD_BATH',at:{x,y}}).ok;
   if(mode==='t:area')return E.validate(s,{type:'SHOOT',unit:u.id,at:{x,y}}).ok;
   return false;
  }
  function freeTiles(){
   const s=st(),out=[];for(let y=0;y<s.map.rows;y++)for(let x=0;x<s.map.cols;x++)if(tileOK(x,y))out.push({x,y});return out;
  }

  // ---------- plans (preview before commit) ----------
  function makePlan(kind,data){plan={kind,...data};renderCmd();syncHl();}
  function planShot(tid,ability){
   const s=st(),u=s.units[sel],t=s.units[tid];const pv=R.preview(s,u,t,ability?{ability}:{});
   if(!pv.ok){toast(WHY[pv.code]||pv.code);X.play('deny');return;}
   makePlan('shot',{target:tid,pv,ability:ability||null,action:ability?{type:'ABILITY',unit:u.id,ability,target:tid}:{type:'SHOOT',unit:u.id,target:tid}});
   X.play('tick');
  }
  function planAbility(kind,tid,extra){
   const s=st(),u=s.units[sel],t=s.units[tid];
   const base={kind,target:tid,action:null,info:[],big:'',bigLabel:'',title:t?t.name:''};
   if(kind==='SHOULDER_CHECK'){const spot=E.approachTile(s,u,t);base.action={type:'ABILITY',unit:u.id,ability:kind,target:tid};base.big='3';base.bigLabel='DMG';
    base.info=[['AUTO-HIT',''],['3 DAMAGE','+'],['KNOCKS OUT OF COVER','+'],[spot&&spot.stay?'ALREADY ADJACENT':'CHARGES TO A TILE NEXT TO THEM','']];base.path=spot&&!spot.stay?R.path(s,u,spot,R.effectiveMobility(s,u)):[];base.to=spot;}
   else if(kind==='RAM'){base.action={type:'ABILITY',unit:u.id,ability:'THE_CAR',mode:'RAM',target:tid};base.big='5';base.bigLabel='DMG';base.info=[['AUTO-HIT',''],['5 DAMAGE','+'],['ONCE PER SHOWDOWN','-']];}
   else if(kind==='TALK_HIM_DOWN'){const c=E.talkChance(u);base.action={type:'ABILITY',unit:u.id,ability:kind,target:tid};base.big=c+'%';base.bigLabel='SURRENDER';base.info=[['UNDER 50% HP','+'],['SURRENDER = REMOVED','+'],[t.hp+'/'+t.maxHp+' HP','']];}
   else if(kind==='PATCH_UP'){const down=t.status==='DOWNED';base.action={type:'ABILITY',unit:u.id,ability:kind,target:tid};base.big=down?'SAVE':'+4';base.bigLabel=down?'STABILIZE':'HEAL';base.info=[[down?'STOPS THE BLEEDING':'HEAL 4 (MAX HP)','+']];}
   else if(kind==='CARRY'){base.action={type:'CARRY',unit:u.id,target:tid};base.big='LIFT';base.bigLabel='CARRY';base.info=[['CARRIER MOVES SLOWER','-'],['TAKE THEM TO THE EXIT ZONE','+']];}
   else if(kind==='BITE'){base.action={type:'RICH_MOVE',unit:'rich',move:'VAMPIRE_BITE',target:tid};base.big='4';base.bigLabel='DMG +2 HEAL';base.info=[['ADJACENT','' ],['HEALS RICH 2','+']];}
   else if(kind==='REVENGE'){base.action={type:'RICH_MOVE',unit:'rich',move:'REVENGE',target:tid};base.big=String(st().rich.stored);base.bigLabel='RETURNED';base.info=[['ALL DAMAGE RICH TOOK','+']];}
   plan=base;renderCmd();syncHl();X.play('tick');
  }
  function planTile(kind,x,y){
   const s=st(),u=s.units[sel];
   if(kind==='carcover'){plan={kind:'tile',tile:{x,y},title:'PULL THE CAR ON',big:'FULL',bigLabel:'COVER',info:[['ONE TILE OF FULL COVER','+'],['ONCE PER SHOWDOWN','-']],action:{type:'ABILITY',unit:u.id,ability:'THE_CAR',mode:'COVER',to:{x,y}}};}
   else if(kind==='bloodbath'){const area=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)area.push({x:x+i,y:y+j});const hit=E.enemies(s).filter(e=>e.status==='ACTIVE'&&R.onGrid(e)&&area.some(a=>a.x===e.x&&a.y===e.y));
    plan={kind:'tile',tile:{x,y},area,title:'BLOOD BATH',big:'4',bigLabel:'DMG AREA',info:[['3x3 AREA · AUTO-HIT','+'],[hit.length+' ENEMIES IN THE BLAST',hit.length?'+':'-']],action:{type:'RICH_MOVE',unit:'rich',move:'BLOOD_BATH',at:{x,y}}};}
   else if(kind==='area'){const w=R.weaponOf(s,u);const area=[];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)area.push({x:x+i,y:y+j});const hit=E.enemies(s).filter(e=>e.status==='ACTIVE'&&R.onGrid(e)&&area.some(a=>a.x===e.x&&a.y===e.y));
    const ally=R.units(s).filter(a=>a.side==='PLAYER'&&a.status==='ACTIVE'&&R.onGrid(a)&&area.some(t=>t.x===a.x&&t.y===a.y));
    plan={kind:'tile',tile:{x,y},area,title:w.label,big:String(w.dmg[0]),bigLabel:'DMG AREA',info:[['AUTO-HIT · DESTROYS COVER','+'],[hit.length+' ENEMIES IN THE BLAST',hit.length?'+':'-'],['+'+(w.heat||0)+' HEAT','-']].concat(ally.length?[['ALLIES IN AREA ARE SAFE','']]:[]),action:{type:'SHOOT',unit:u.id,at:{x,y}}};}
   renderCmd();syncHl();X.play('tick');
  }
  function planMove(x,y){
   const s=st(),u=s.units[sel];const m=R.effectiveMobility(s,u);
   const p1=R.path(s,u,{x,y},m);
   if(p1){makePlan('move',{to:{x,y},path:p1,cost:1,action:{type:'MOVE',unit:u.id,to:{x,y}}});X.play('tick');return;}
   if(u.ap>=2){
    const p2=R.path(s,u,{x,y},m*2);
    if(p2){ // split into MOVE + DASH at the last free tile within the first leg
     let mid=null,acc=0;const g={...u};
     for(const step of p2){const cost=R.path(s,u,step,m);if(!cost)break;if(!R.unitAt(s,step.x,step.y))mid=step;}
     if(mid){const second=R.path(s,{...u,x:mid.x,y:mid.y},{x,y},m);if(second){makePlan('move',{to:{x,y},path:p2,cost:2,mid,action:{type:'MOVE',unit:u.id,to:{x,y}}});X.play('tick');return;}}
    }
   }
   toast('CAN\'T REACH');X.play('deny');
  }
  function cancelPlan(){plan=null;mode='idle';abilityMenu=null;renderCmd();syncHl();syncUnits();}

  // ---------- commands ----------
  async function commit(action){
   if(busy)return;
   if(action.type==='PULL_UP')pulled=true;
   const s0=st();
   // a 2-action dash is two engine MOVEs
   if(action.type==='MOVE'&&plan&&plan.cost===2&&plan.mid){
    busy=true;const a1={type:'MOVE',unit:action.unit,to:plan.mid};plan=null;
    const r1=session.dispatch(a1);if(!r1.ok){busy=false;toast(WHY[r1.code]||r1.code);return;}
    await play(r1.events);
    const r2=session.dispatch({type:'DASH',unit:action.unit,to:action.to});
    if(r2.ok)await play(r2.events);
    busy=false;afterAction();return;
   }
   busy=true;plan=null;mode='idle';abilityMenu=null;
   const r=session.dispatch(action);
   if(!r.ok){busy=false;toast(WHY[r.code]||r.message||r.code);X.play('deny');renderCmd();syncHl();return;}
   await play(r.events);
   busy=false;afterAction();
  }
  function afterAction(){
   if(destroyed)return;
   const s=st();plan=null;mode='idle';abilityMenu=null;endArm=0;
   if(s.result){finishScreen();return;}
   if(pulled&&s.units.rich&&s.units.rich.status==='ACTIVE'){sel='rich';pulled=false;}
   if(s.phase==='PLAYER'){
    const u=sel&&s.units[sel];
    if(!(u&&u.status==='ACTIVE'&&u.ap>0)){const next=nextReady();sel=next?next.id:null;}
   }
   syncAll();
  }
  const nextReady=(from)=>{const s=st();const list=s.order.map(id=>s.units[id]).filter(u=>u.side==='PLAYER'&&u.kind!=='CAPTIVE'&&u.status==='ACTIVE'&&u.ap>0);if(!list.length)return null;
   if(from){const i=list.findIndex(u=>u.id===from);return list[(i+1)%list.length];}return list[0];};
  function select(id,quiet){
   const s=st(),u=s.units[id];if(!u||u.side!=='PLAYER'||u.status!=='ACTIVE'||u.kind==='CAPTIVE'){return;}
   sel=id;mode='idle';plan=null;abilityMenu=null;if(!quiet)X.play('select');syncAll();
  }
  async function endTurn(){
   if(busy)return;const s=st();if(s.phase!=='PLAYER')return;
   const left=R.units(s).filter(u=>u.side==='PLAYER'&&u.status==='ACTIVE'&&u.ap>0&&u.kind!=='CAPTIVE').length;
   if(left&&endArm<Date.now()){endArm=Date.now()+2200;renderCmd();setTimeout(()=>{if(endArm&&endArm<Date.now()+10){endArm=0;if(!destroyed)renderCmd();}},2300);toast(left+' OGA'+(left>1?'S':'')+' STILL HAVE ACTIONS. TAP AGAIN TO END.');return;}
   endArm=0;sel=null;await commit({type:'END_TURN'});
  }

  function onAction(a){
   if(busy)return;const s=st();if(s.phase!=='PLAYER'||s.status!=='ACTIVE')return;
   const u=sel&&s.units[sel];if(!u){toast('TAP AN OGA FIRST');return;}
   const av=E.available(s,u.id);
   const need=id=>{const x=av[id];if(x&&x.ok)return true;toast(WHY[x&&x.why]||(x&&x.why)||'NOT AVAILABLE');X.play('deny');return false;};
   plan=null;abilityMenu=null;
   switch(a){
    case 'MOVE':mode='idle';syncAll();X.play('tick');break;
    case 'SHOOT':{
     if(!need('SHOOT'))return;
     const w=R.weaponOf(s,u);
     if(w.area){mode='t:area';syncAll();return;}
     mode='t:shoot';const t=targetList();
     if(t.length===1)planShot(t[0].id);else syncAll();
     break;}
    case 'OVERWATCH':if(need('OVERWATCH'))commit({type:'OVERWATCH',unit:u.id});break;
    case 'HUNKER':if(need('HUNKER'))commit({type:'HUNKER',unit:u.id});break;
    case 'RELOAD':if(need('RELOAD'))commit({type:'RELOAD',unit:u.id});break;
    case 'ITEM':toast('NO ITEMS AUTHORED · SOURCE REQUIRED');X.play('deny');break;
    case 'CARRY':{
     if(!need('CARRY'))return;mode='t:carry';const t=targetList();if(t.length===1)planAbility('CARRY',t[0].id);else syncAll();break;}
    case 'ABILITY':{
     if(!need('ABILITY'))return;
     const list=av.ABILITIES||[];
     if(list.length>1){abilityMenu=list;renderCmd();return;}
     runAbility(list[0].id);break;}
   }
  }
  function runAbility(id){
   const s=st(),u=s.units[sel];abilityMenu=null;const av=E.available(s,u.id);const meta=(av.ABILITIES||[]).find(a=>a.id===id);
   if(meta&&!meta.ok){toast(WHY[meta.why]||meta.why);X.play('deny');renderCmd();return;}
   switch(id){
    case 'DEAD_EYE':mode='t:DEAD_EYE';{const t=targetList();if(t.length===1)planShot(t[0].id,'DEAD_EYE');else syncAll();}break;
    case 'SHOULDER_CHECK':mode='t:SHOULDER_CHECK';{const t=targetList();if(t.length===1)planAbility(id,t[0].id);else syncAll();}break;
    case 'TALK_HIM_DOWN':mode='t:TALK_HIM_DOWN';{const t=targetList();if(t.length===1)planAbility(id,t[0].id);else syncAll();}break;
    case 'PATCH_UP':mode='t:PATCH_UP';{const t=targetList();if(t.length===1)planAbility(id,t[0].id);else syncAll();}break;
    case 'THE_CAR':abilityMenu=[{id:'CAR_COVER',label:'FULL COVER',ok:true},{id:'CAR_RAM',label:'RAM · 5 DMG',ok:true}];renderCmd();break;
    case 'CAR_COVER':mode='t:carcover';syncAll();break;
    case 'CAR_RAM':mode='t:RAM';syncAll();break;
    case 'VANISH':commit({type:'ABILITY',unit:u.id,ability:'VANISH'});break;
    case 'PHONE_OUT':commit({type:'ABILITY',unit:u.id,ability:'PHONE_OUT'});break;
   }
  }
  function onRich(move){
   if(busy)return;const s=st();const u=s.units.rich;if(!u||u.status!=='ACTIVE')return;sel='rich';plan=null;abilityMenu=null;
   const av=E.available(s,'rich');const m=av.RICH_MOVES&&av.RICH_MOVES[move];
   if(!m||!m.ok){toast(WHY[m&&m.why]||'NOT AVAILABLE');X.play('deny');return;}
   if(move==='BLOOD_BATH'){mode='t:bloodbath';syncAll();}
   else if(move==='VAMPIRE_BITE'){mode='t:bite';const t=targetList();if(t.length===1)planAbility('BITE',t[0].id);else syncAll();}
   else if(move==='REVENGE'){mode='t:revenge';const t=targetList();if(t.length===1)planAbility('REVENGE',t[0].id);else syncAll();}
  }

  // ---------- tap on the board ----------
  function unitAtTile(x,y){const s=st();return R.units(s).find(u=>unitVisible(u)&&u.x===x&&u.y===y&&!u.carriedBy)||null;}
  function onTap(x,y){
   if(destroyed||menuOpen)return;
   if(busy){skip=true;return;}
   const s=st();if(s.status!=='ACTIVE'||s.phase!=='PLAYER')return;
   X.unlock();
   const u=sel&&s.units[sel];const at=unitAtTile(x,y);
   // targeting modes
   if(mode.startsWith('t:')){
    if(['t:carcover','t:bloodbath','t:area'].includes(mode)){
     if(tileOK(x,y)){if(plan&&plan.tile&&plan.tile.x===x&&plan.tile.y===y){commit(plan.action);return;}planTile(mode.slice(2),x,y);return;}
     if(at&&at.side==='PLAYER'&&at.id!==sel&&at.kind!=='CAPTIVE'){select(at.id);return;}
     cancelPlan();return;
    }
    const hit=targetList().find(t=>t.x===x&&t.y===y);
    if(hit){
     if(plan&&plan.target===hit.id){commit(plan.action);return;}
     if(mode==='t:shoot')planShot(hit.id);else if(mode==='t:DEAD_EYE')planShot(hit.id,'DEAD_EYE');
     else planAbility({'t:SHOULDER_CHECK':'SHOULDER_CHECK','t:RAM':'RAM','t:TALK_HIM_DOWN':'TALK_HIM_DOWN','t:PATCH_UP':'PATCH_UP','t:carry':'CARRY','t:bite':'BITE','t:revenge':'REVENGE'}[mode],hit.id);
     return;
    }
    if(at&&at.side==='PLAYER'&&at.status==='ACTIVE'&&at.id!==sel&&at.kind!=='CAPTIVE'){select(at.id);return;}
    cancelPlan();return;
   }
   // idle
   if(at&&at.side==='PLAYER'&&at.status==='ACTIVE'&&at.kind!=='CAPTIVE'){
    if(at.id===sel){plan=null;syncAll();return;}
    select(at.id);return;
   }
   if(u&&at&&at.side==='ENEMY'){ // tap an enemy = shoot it
    const av=E.available(s,u.id);
    if(av.SHOOT&&av.SHOOT.ok&&!av.SHOOT.area){mode='t:shoot';const ok=targetList().some(t=>t.id===at.id);if(ok){planShot(at.id);return;}mode='idle';}
    const pv=R.preview(s,u,at,{});
    toast(pv.ok?WHY[R.canShoot(s,u).code]||'CAN\'T SHOOT NOW':WHY[pv.code]||pv.code);X.play('deny');return;
   }
   if(u&&u.status==='ACTIVE'&&u.ap>0){
    if(plan&&plan.kind==='move'&&plan.to.x===x&&plan.to.y===y){commit(plan.action);return;}
    if(R.inb(s,x,y)){planMove(x,y);return;}
   }
   if(!u)toast('TAP AN OGA');
  }
  // one handler for the whole board: the tile comes from the pointer position, so overlays can never swallow a tap
  R_.board.addEventListener('click',e=>{
   const r=R_.board.getBoundingClientRect();const w=r.width/6,h=r.height/9;
   const x=Math.floor((e.clientX-r.left)/w),y=Math.floor((e.clientY-r.top)/h);
   if(x>=0&&x<6&&y>=0&&y<9)onTap(x,y);
  });

  // ---------- HUD ----------
  const pips=(n,max)=>Array.from({length:max},(_,i)=>`<b class="${i<n?'':'off'}"></b>`).join('');
  function syncTop(){
   const s=st();R_.turn.textContent=s.turn;rootEl.dataset.phase=s.phase;
   const o=s.objective;const left=E.liveEnemies(s).length;
   let text='';
   if(o.kind==='ELIMINATE')text='CLEAR THE FIELD';else if(o.kind==='EXTRACT_TARGET'){const c=s.units.captive;text=c&&c.status==='EXTRACTED'?'TARGET SAFE':(c&&c.carriedBy?'GET THEM TO THE EXIT':'REACH & CARRY THE CAPTIVE OUT');}else text=`SURVIVE · TURN ${Math.min(s.turn,o.turns)}/${o.turns}`;
   if(s.turnLimit)text+=` · ${Math.max(0,s.turnLimit-s.turn+1)} TURNS LEFT`;
   R_.obj.textContent=text;{const seen=E.liveEnemies(s).filter(e=>R.spotted(s,e)).length;R_.objk.textContent=(s.jobType||'SANDBOX').replace(/_/g,' ')+(seen?` · ${seen} SEEN`:'');}
   R_.phase.textContent=s.status==='ENDED'?'OVER':s.phase==='PLAYER'?'YOUR TURN':'ENEMY TURN';
   pullBtn.hidden=!(s.rich.enabled&&s.rich.status==='OFFSTAGE'&&!s.rich.used);
   const can=E.canPullUp(s);pullBtn.classList.toggle('off',!can);pullBtn.textContent=can?'PULL UP':'RICH T3+';
  }
  function chipFor(u,foe){
   const c=$('button','sd-chip'+(foe?' foe':'')+(sel===u.id?' sel':'')+(u.status==='DOWNED'?' down':'')+((!foe&&u.ap===0&&u.status==='ACTIVE')?' done':''));
   c.dataset.id=u.id;c.setAttribute('aria-label',u.name);
   c.innerHTML=`<img alt="" src="${S.unit(u)}"><div class="cb"><i style="width:${Math.max(0,u.hp/u.maxHp*100)}%;${foe?'background:#e0603a':''}"></i></div>${foe?'':`<div class="ap">${pips(u.status==='ACTIVE'?u.ap:0,2)}</div>`}${u.status==='DOWNED'?`<span class="tag">${u.stabilized?'OK':u.bleed}</span>`:''}`;
   return c;
  }
  function syncChips(){
   const s=st();R_.chips.innerHTML='';
   if(s.phase==='ENEMY'){
    for(const e of E.enemies(s)){if(e.status!=='ACTIVE'||!R.spotted(s,e))continue;const c=chipFor(e,true);if(actingEnemy===e.id)c.classList.add('act');c.disabled=true;R_.chips.appendChild(c);}
    if(!R_.chips.children.length)R_.chips.appendChild($('div','sd-hint','ENEMY TURN'));
    return;
   }
   for(const u of R.units(s)){
    if(u.side!=='PLAYER'||u.kind==='CAPTIVE')continue;
    if(u.kind==='RICH'&&u.status==='OFFSTAGE')continue;
    if(u.status==='EXTRACTED'||u.status==='TAKEN')continue;
    R_.chips.appendChild(chipFor(u,false));
   }
  }
  R_.chips.addEventListener('click',e=>{const c=e.target.closest('.sd-chip');if(!c||c.disabled||busy)return;const u=st().units[c.dataset.id];if(u&&u.status==='ACTIVE')select(u.id);else toast(u.status==='DOWNED'?(u.stabilized?'STABILIZED · CARRY THEM OUT':'BLEEDING · '+u.bleed+' TURNS'):'');});

  let toastEl=null,toastT=0;
  function toast(msg){
   if(!msg)return;let t=rootEl.querySelector('.sd-hint.tst');
   if(!t){t=$('div','sd-hint tst');t.style.cssText='position:absolute;left:8px;right:8px;top:calc(100% - 0px);';}
   R_.banner.parentNode.appendChild(t);t.style.cssText='position:absolute;left:10px;right:10px;bottom:8px;z-index:14;pointer-events:none;background:rgba(8,10,20,.92);border:2px solid var(--gold);color:var(--gold);padding:8px';
   t.textContent=msg;clearTimeout(toastT);toastT=setTimeout(()=>{if(t.parentNode)t.parentNode.removeChild(t);},1800);
  }
  const barCls=(hp,max)=>hpClass(hp,max);
  function cardHtml(u){
   const s=st(),w=R.weaponOf(s,u);const cl=u.kind==='RICH'?'RICH · PLACEHOLDER':u.kind==='ENEMY'?(D.ENEMIES[u.type].text):(u.cls||u.type);
   const stat=[];if(u.ow)stat.push('OVERWATCH');if(u.hunker)stat.push('HUNKERED');if(u.conceal)stat.push('CONCEALED');if(u.carrying)stat.push('CARRYING');if(u.moved)stat.push('MOVED');
   for(const t of u.traits||[])stat.push(D.TRAITS[t].label);for(const g of u.stories||[])stat.push(D.STORIES[g].label);
   const wp=w?`${esc(w.label)} ${u.weapon.clip}/${u.weapon.max}${w.perShowdown?' · 1 PER SHOWDOWN':''}`:'BARE HANDS · MOVES';
   const aim=u.kind==='OGA'?` · AIM ${u.aim}`:'';
   return `<div class="pic"><img alt="" src="${S.unit(u)}"></div><div><div class="nm">${esc(u.name)}</div><div class="cl">${esc(cl)}${aim}<span class="wpi"> · ${wp}</span></div>
    <div class="bar"><div class="hpb"><i class="${barCls(u.hp,u.maxHp)}" style="width:${u.hp/u.maxHp*100}%"></i></div><span>${u.hp}/${u.maxHp}</span></div><div class="wp">${wp}</div>
    ${stat.length?`<div class="st">${stat.map(x=>`<em>${esc(x)}</em>`).join('')}</div>`:''}</div>
    <div class="ap" style="display:flex;gap:3px;flex-direction:column">${u.kind==='ENEMY'?'':Array.from({length:2},(_,i)=>`<b style="width:10px;height:10px;background:${i<u.ap?'#e8c14a':'#3a3560'};border:2px solid #080a14"></b>`).join('')}</div>`;
  }
  function sheetHtml(){
   const s=st(),u=s.units[sel];const p=plan;
   if(p.kind==='move'){
    return `<div class="sd-hint"><b>${p.cost===2?'DASH · 2 ACTIONS':'MOVE · 1 ACTION'}</b> · ${p.path.length} TILES<br>TAP AGAIN OR GO TO CONFIRM</div>
     <div class="sd-sheet-t panel"><div class="go"><button class="sd-back" data-a="cancel">BACK</button><button class="sd-fire go2" data-a="confirm">GO</button></div></div>`;
   }
   let big,bigLabel,title,lines=[],row='';
   if(p.kind==='shot'){
    const pv=p.pv;title=s.units[p.target].name;big=Math.round(pv.chance)+'%';bigLabel=pv.neverMiss?'NEVER MISSES':'TO HIT';
    lines=pv.breakdown.map(l=>[l.label,l.value]);
    row=`<span>CRIT ${Math.round(pv.crit)}%</span><span>DMG ${pv.dmgMin===pv.dmgMax?pv.dmgMin:pv.dmgMin+'-'+pv.dmgMax}${pv.hits>1?' x'+pv.hits:''}</span>${pv.cover!=='NONE'?`<span>${pv.cover} COVER</span>`:''}${pv.flanked?'<span class="flank">FLANKED</span>':''}${pv.heightAdvantage?'<span>HIGH GROUND</span>':''}<span>${pv.distance} TILES</span>`;
    if(p.ability)title+=' · '+p.ability.replace('_',' ');
   }else{title=p.title;big=p.big;bigLabel=p.bigLabel;lines=p.info;}
   const body=(p.kind==='shot')?lines.map(([l,v])=>`<li class="${v<0?'neg':v>0?'pos':''}"><span>${esc(l)}</span><b>${v===0?'':(v>0?'+':'')+v}</b></li>`).join(''):
    lines.map(([l,v])=>`<li class="${v==='-'?'neg':v==='+'?'pos':''}"><span>${esc(l)}</span><b>${v==='+'?'▲':v==='-'?'▼':''}</b></li>`).join('');
   const verb=p.kind==='shot'?'FIRE':p.kind==='tile'?'GO':p.kind==='SHOULDER_CHECK'?'CHARGE':p.kind==='CARRY'?'LIFT':'DO IT';
   return `<div class="sd-sheet-t panel"><div class="hd"><div class="big">${esc(big)}<small> ${esc(bigLabel||'')}</small></div><div class="who">${esc(title||'')}<div>${u?esc(u.name):''}</div></div></div>
    ${row?`<div class="row">${row}</div>`:''}<ul>${body}</ul><div class="go"><button class="sd-back" data-a="cancel">BACK</button><button class="sd-fire" data-a="confirm">${verb}</button></div></div>`;
  }
  function hintText(){
   const s=st();if(s.phase==='ENEMY')return 'ENEMY TURN · TAP TO SPEED UP';
   const u=sel&&s.units[sel];if(!u)return 'TAP AN <b>OGA</b> TO GIVE ORDERS';
   if(mode.startsWith('t:')){
    if(['t:carcover'].includes(mode))return 'TAP A <b>FREE TILE</b> IN SIGHT FOR THE CAR';
    if(mode==='t:bloodbath'||mode==='t:area')return 'TAP <b>ANY TILE</b> IN SIGHT FOR THE BLAST';
    if(mode==='t:carry'||mode==='t:PATCH_UP')return 'TAP <b>THE ALLY</b>';
    return targetList().length?'TAP A <b>RED</b> TARGET TO SEE THE ODDS':'NOTHING IN REACH';
   }
   if(u.ap<=0)return 'NO ACTIONS LEFT · PICK ANOTHER OGA OR <b>END TURN</b>';
   return '<b>TEAL</b> = 1 ACTION · <b>GOLD</b> = DASH · TAP AN ENEMY TO SHOOT';
  }
  function renderCmd(){
   const s=st(),c=R_.cmd;const ended=s.status==='ENDED';
   if(ended){c.innerHTML='';return;}
   const u=sel&&s.units[sel];
   if(plan&&u&&s.phase==='PLAYER'){c.innerHTML=sheetHtml();return;}
   let html='';
   const foeCard=s.phase==='ENEMY'&&actingEnemy&&s.units[actingEnemy]?s.units[actingEnemy]:null;
   const unitForCard=foeCard||(u&&u.status==='ACTIVE'?u:null);
   const left=R.units(s).filter(o=>o.side==='PLAYER'&&o.status==='ACTIVE'&&o.ap>0&&o.kind!=='CAPTIVE').length;
   const armed=endArm>Date.now();
   html+=`<div class="sd-hint">${hintText()}</div>`;
   html+=`<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:stretch"><div class="panel sd-card">${unitForCard?cardHtml(unitForCard):`<div></div><div class="nm" style="font-size:9px">${s.phase==='ENEMY'?'ENEMY TURN':'SELECT AN OGA'}</div><div></div>`}</div>
    <button class="sd-end ${armed?'warn':''} ${left===0&&s.phase==='PLAYER'?'pulse':''}" data-a="end" ${s.phase!=='PLAYER'?'disabled':''}>${armed?'TAP<br>AGAIN':'END<br>TURN'}</button></div>`;
   if(abilityMenu){
    html+=`<div class="sd-acts">${abilityMenu.map(a=>`<button class="sd-act ${a.ok?'':'off'}" data-ab="${a.id}"><img alt="" src="${S.icon('ABILITY','#f6efd9')}">${esc(a.label)}</button>`).join('')}<button class="sd-act" data-a="cancel">BACK</button></div>`;
    c.innerHTML=html;return;
   }
   html+=`<div class="sd-acts">${actionButtons(u)}</div>`;
   c.innerHTML=html;
  }
  function actionButtons(u){
   const s=st();const dis=s.phase!=='PLAYER'||!u||u.status!=='ACTIVE';
   const av=dis?{}:E.available(s,u.id);
   if(u&&u.kind==='RICH'&&!dis){
    const rm=av.RICH_MOVES||{};
    const b=(id,label,icon,m,extra)=>`<button class="sd-act ${m&&m.ok?'':'off'} ${mode.includes(extra||'~')?'on':''}" data-rm="${id}"><img alt="" src="${S.icon(icon,'#f6efd9')}">${label}${m&&m.stored?`<span class="n">${m.stored}</span>`:''}</button>`;
    return `<button class="sd-act ${mode==='idle'?'on':''} ${av.MOVE&&av.MOVE.ok?'':'off'}" data-act="MOVE"><img alt="" src="${S.icon('MOVE','#f6efd9')}">MOVE</button>`+
     b('BLOOD_BATH','BLOOD BATH','SHOOT',rm.BLOOD_BATH,'bloodbath')+b('VAMPIRE_BITE','VAMP BITE','CARRY',rm.VAMPIRE_BITE,'bite')+b('REVENGE','REVENGE','FLANK',rm.REVENGE,'revenge')+
     `<button class="sd-act off" data-rm="OCTOPUS_BRAIN"><img alt="" src="${S.icon('ITEM','#f6efd9')}">OCTOPUS<span class="n">SRC</span></button>`;
   }
   const ab=(av.ABILITIES&&av.ABILITIES.length===1)?av.ABILITIES[0].label:'ABILITY';
   const list=[['MOVE',LABEL.MOVE],['SHOOT',LABEL.SHOOT],['OVERWATCH',LABEL.OVERWATCH],['HUNKER',LABEL.HUNKER],['ABILITY',ab],['CARRY',LABEL.CARRY],['RELOAD',LABEL.RELOAD],['ITEM',LABEL.ITEM]];
   return list.map(([id,label],i)=>{
    const a=av[id];const ok=!dis&&a&&a.ok;const on=(id==='MOVE'&&mode==='idle'&&!plan)||(id==='SHOOT'&&(mode==='t:shoot'||mode==='t:area'))||(id==='ABILITY'&&/^t:(SHOULDER|DEAD|TALK|PATCH|RAM|carcover)/.test(mode))||(id==='CARRY'&&mode==='t:carry');
    const badge=id==='RELOAD'&&u&&u.weapon?`<span class="n">${u.weapon.clip}</span>`:(id==='SHOOT'&&a&&a.targets?`<span class="n">${a.targets}</span>`:'');
    return `<button class="sd-act ${ok?'':'off'} ${on?'on':''}" data-act="${id}" ${dis?'disabled':''}><span class="kb">${i+1}</span><img alt="" src="${S.icon(ICON[id],'#f6efd9')}">${esc(label)}${badge}</button>`;
   }).join('');
  }
  R_.cmd.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b||busy)return;X.unlock();
   if(b.dataset.a==='end')return endTurn();
   if(b.dataset.a==='cancel'){X.play('tick');return cancelPlan();}
   if(b.dataset.a==='confirm'){if(plan)commit(plan.action);return;}
   if(b.dataset.act)return onAction(b.dataset.act);
   if(b.dataset.ab)return runAbility(b.dataset.ab);
   if(b.dataset.rm)return onRich(b.dataset.rm);
  });
  pullBtn.addEventListener('click',()=>{
   if(busy)return;X.unlock();const s=st();
   if(!E.canPullUp(s)){toast(WHY.TOO_EARLY);X.play('deny');return;}
   commit({type:'PULL_UP'});
  });
  function syncAll(){
   if(destroyed)return;
   syncTop();syncChips();syncUnits();syncFog();syncHl();renderCmd();drawProps();
   // the cmd panel height changes with content: keep the board fitted
   const before=tile;fit();if(tile!==before){/* tile size feeds CSS vars only */}
  }

  // ---------- playback ----------
  let actingEnemy=null;
  function fxAt(cls,x,y,w,h){const d=$('div',cls);d.style.left=(x-(w||tile)/2)+'px';d.style.top=(y-(h||tile)/2)+'px';d.style.width=(w||tile)+'px';d.style.height=(h||tile)+'px';R_.fx.appendChild(d);setTimeout(()=>d.remove(),900);return d;}
  function num(text,x,y,cls){const d=$('div','fx-num '+(cls||''),esc(text));d.style.left=cx(x)+'px';d.style.top=(y*tile-2)+'px';R_.fx.appendChild(d);setTimeout(()=>d.remove(),1000);}
  function banner(text,cls,sub){R_.banner.innerHTML=`<b>${esc(text)}${sub?`<small>${esc(sub)}</small>`:''}</b>`;R_.banner.className='sd-banner '+(cls||'');const b=R_.banner.firstChild;b.style.animation='none';void b.offsetWidth;b.style.animation='';}
  function flash(cls){R_.flash.className='sd-flash '+cls;void R_.flash.offsetWidth;R_.flash.classList.add('on');}
  function shake(){R_.board.classList.remove('shake');void R_.board.offsetWidth;R_.board.classList.add('shake');setTimeout(()=>R_.board.classList.remove('shake'),260);}
  function tracer(from,to,foe,miss){
   const x1=cx(from.x),y1=cy(from.y),x2=cx(to.x),y2=cy(to.y);const len=Math.hypot(x2-x1,y2-y1),ang=Math.atan2(y2-y1,x2-x1);
   const d=$('div','fx-trace'+(foe?' foe':'')+(miss?' miss':''));d.style.left=x1+'px';d.style.top=(y1-1)+'px';d.style.width=len+'px';d.style.transform=`rotate(${ang}rad)`;R_.fx.appendChild(d);setTimeout(()=>d.remove(),400);
  }
  function lunge(id,from,to){
   const e=els.get(id);if(!e)return;const dx=to.x-from.x,dy=to.y-from.y;const c=Math.abs(dx)>=Math.abs(dy)?(dx>=0?'lunge-r':'lunge-l'):(dy>=0?'lunge-d':'lunge-u');
   e.classList.add(c);setTimeout(()=>e.classList.remove(c),140/speed);
  }
  function unitInfo(id){return st().units[id];}
  async function play(events){
   skip=false;
   for(const e of events){
    if(destroyed)return;
    for(const snd of X.forEvent(e))X.play(snd);
    switch(e.t){
     case 'PHASE':{
      const s=st();
      if(e.phase==='ENEMY'){rootEl.dataset.phase='ENEMY';R_.phase.textContent='ENEMY TURN';banner('ENEMY TURN','red');actingEnemy=null;syncChips();syncHl();renderCmd();await wait(650);}
      else{rootEl.dataset.phase='PLAYER';banner('YOUR TURN '+e.turn,'');actingEnemy=null;await wait(400);}
      break;}
     case 'POD_REVEAL':{
      flash('red');shake();banner('ENEMIES SPOTTED','red',e.byPhone?'PHONE OUT':'');
      const c=e.members[0];R_.board.style.transformOrigin=`${cx(c.x)}px ${cy(c.y)}px`;R_.board.classList.add('zoom');
      for(const m of e.members){const u=unitInfo(m.id);syncUnit(u);const el=els.get(m.id);if(el){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),400);}}
      syncFog();await wait(800);R_.board.classList.remove('zoom');await wait(200);break;}
     case 'MOVE':{
      const el=els.get(e.id);const u=unitInfo(e.id);
      if(e.id&&u&&u.side==='ENEMY'){if(actingEnemy!==e.id){actingEnemy=e.id;syncChips();renderCmd();}}
      if(el){for(let i=1;i<e.path.length;i++){const p=e.path[i];el.style.setProperty('--x',p.x);el.style.setProperty('--y',p.y);await wait(70);}}
      syncFog();break;}
     case 'SHOT':{
      const a=unitInfo(e.from),t=unitInfo(e.to);const foe=a.side==='ENEMY';if(foe&&actingEnemy!==a.id){actingEnemy=a.id;syncChips();renderCmd();}
      if(e.burst===1&&e.reaction){banner('OVERWATCH!','',''+a.name);await wait(250);}
      lunge(a.id,{x:e.fx,y:e.fy},{x:e.tx,y:e.ty});tracer({x:e.fx,y:e.fy},{x:e.tx,y:e.ty},foe,!e.hit);await wait(120);
      const te=els.get(t.id);
      if(e.hit){if(te){te.classList.add('hit');setTimeout(()=>te.classList.remove('hit'),110/speed);}
       if(e.cover&&e.cover!=='NONE')fxAt('fx-spark',cx(e.tx),cy(e.ty),10,10);
       pendingCrit[t.id]=e.crit;if(e.crit){flash('white');}
       shake();await wait(90);}
      else{num('MISS',e.tx,e.ty,'miss');await wait(160);}
      if(e.joke){R_.captext.textContent=e.caption;R_.caption.classList.remove('show');void R_.caption.offsetWidth;R_.caption.classList.add('show');X.play('joke');await wait(300);}
      break;}
     case 'HP':{
      const u=unitInfo(e.id);const el=els.get(e.id);
      if(el){const i=el.querySelector('.hp i');i.style.width=Math.max(0,e.hp/e.max*100)+'%';i.className=hpClass(e.hp,e.max);}
      if(e.lost>0){num((pendingCrit[e.id]?'CRIT ':'')+'-'+e.lost,e.x,e.y,pendingCrit[e.id]?'crit':'');delete pendingCrit[e.id];}
      await wait(140);break;}
     case 'DOWNED':{const el=els.get(e.id);if(el)el.classList.add('downed');banner(unitInfo(e.id).name+' DOWN','red','BLEEDING · '+e.bleed+' TURNS');flash('red');await wait(650);syncUnit(unitInfo(e.id));break;}
     case 'REMOVED':{
      const el=els.get(e.id);const u=unitInfo(e.id);
      if(e.reason==='SURRENDERED')num('SURRENDERS',e.x,e.y,'lbl');else if(e.reason==='FLED')banner(u.name+' FLEES','gold','HE ALWAYS COMES BACK');
      if(el){el.classList.add('gone');}
      await wait(e.reason==='FLED'?700:260);break;}
     case 'HEAL':{const el=els.get(e.id);if(el){const u=unitInfo(e.id);const i=el.querySelector('.hp i');i.style.width=(e.hp/u.maxHp*100)+'%';i.className=hpClass(e.hp,u.maxHp);}const u=unitInfo(e.id);if(u&&u.x!=null)num('+'+e.amount,u.x,u.y,'heal');await wait(220);break;}
     case 'STABILIZED':{const u=unitInfo(e.id);if(u&&u.x!=null)num('STABLE',u.x,u.y,'heal');syncUnit(u);await wait(260);break;}
     case 'OVERWATCH_SET':case 'HUNKER':case 'RELOAD':case 'VANISH':case 'CONCEAL_BROKEN':{const u=unitInfo(e.id);if(u){syncUnit(u);if(u.x!=null)num({OVERWATCH_SET:'WATCHING',HUNKER:'HUNKERED',RELOAD:'RELOADED',VANISH:'VANISHED',CONCEAL_BROKEN:'SEEN'}[e.t],u.x,u.y,'lbl');}await wait(200);break;}
     case 'OVERWATCH_TRIGGER':{await wait(60);break;}
     case 'CARRY':{const a=unitInfo(e.id),c=unitInfo(e.target);syncUnit(c);syncUnit(a);num('LIFTED',a.x,a.y,'lbl');await wait(240);break;}
     case 'DROP':{syncUnit(unitInfo(e.id));await wait(120);break;}
     case 'EXTRACTED':{const el=els.get(e.id);const u=unitInfo(e.id);const by=unitInfo(e.by);if(by)num('SAFE!',by.x,by.y,'heal');if(el)el.classList.add('gone');banner(u.name+' EXTRACTED','gold');await wait(700);break;}
     case 'TAKEN':{const el=els.get(e.id);if(el)el.classList.add('gone');banner(unitInfo(e.id).name+' TAKEN','red','LEFT TO BLEED');await wait(700);break;}
     case 'BLAST':{for(const t of e.tiles){if(t.x<0||t.y<0||t.x>5||t.y>8)continue;fxAt('fx-boom',cx(t.x),cy(t.y),tile,tile);}shake();flash('white');await wait(420);break;}
     case 'BLOOD_BATH':{for(const t of e.tiles){if(t.x<0||t.y<0||t.x>5||t.y>8)continue;fxAt('fx-blood',cx(t.x),cy(t.y),tile,tile);}shake();flash('red');await wait(480);break;}
     case 'COVER_DESTROYED':{drawProps();await wait(120);break;}
     case 'CHECK':{lunge(e.from,unitInfo(e.from),{x:e.x,y:e.y});fxAt('fx-spark',cx(e.x),cy(e.y),tile*.6,tile*.6);shake();num('EXPOSED',e.x,e.y-.4,'lbl');await wait(280);break;}
     case 'CAR_RAM':{const d=fxAt('fx-car',cx(e.x),cy(e.y),tile*1.4,tile);d.style.backgroundImage=`url(${S.prop('CAR')})`;shake();await wait(520);break;}
     case 'CAR_COVER':{drawProps();await wait(320);break;}
     case 'BITE':{fxAt('fx-blood',cx(e.x),cy(e.y),tile*.8,tile*.8);shake();await wait(300);break;}
     case 'REVENGE':{fxAt('fx-blood',cx(e.x),cy(e.y),tile*1.4,tile*1.4);flash('red');shake();banner('REVENGE','red',e.dmg+' RETURNED');await wait(700);break;}
     case 'TALK':{const u=unitInfo(e.to);num(e.success?'...OKAY':'NAH',u.x,u.y,'lbl');await wait(400);break;}
     case 'FEAR_SKIP':await wait(200);break;
     case 'PULL_UP':{await cutscene(e);syncUnit(unitInfo('rich'));const el=els.get('rich');if(el){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),400);}break;}
     case 'RICH_SEEN':{banner('RICH SEEN','red','+'+e.heat+' HEAT · VAMPGRAM POST');await wait(900);break;}
     case 'RICH_DOWN':{banner('RICH IS DOWN','red','SQUAD FALLS BACK');await wait(900);break;}
     case 'END':{await wait(200);break;}
    }
    syncFogSoon();
   }
   actingEnemy=null;
  }
  let fogT=0;function syncFogSoon(){}
  async function cutscene(e){
   R_.cut.hidden=false;R_.cut.innerHTML=`<div class="cone"></div><div class="car" style="background-image:url(${S.prop('CAR')})"></div><div class="txt">PULL UP<small>RICH · PLACEHOLDER SLIDE-IN</small></div>`;
   await wait(1350);R_.cut.hidden=true;R_.cut.innerHTML='';
  }

  // ---------- result / menu ----------
  function finishScreen(){
   const s=st(),r=s.result;syncTop();renderCmd();syncUnits();syncHl();
   setTimeout(()=>{if(destroyed)return;showResult(r);},700/speed);
  }
  function showResult(r){
   const label={VICTORY:'VICTORY',RETREAT:'RETREAT',FAILURE:'FAILURE'}[r.outcome];
   const why={FIELD_CLEARED:'THE FIELD IS CLEAR',TARGET_EXTRACTED:'THE TARGET IS OUT',PLAYER_CALLED:'YOU CALLED THE RETREAT',RICH_DOWN:'RICH WENT DOWN · EVERYONE FALLS BACK',TURN_LIMIT:'THE CLOCK RAN OUT',SQUAD_DOWN:'NOBODY LEFT STANDING',SURVIVED:'YOU HELD THE LINE',STALEMATE:'STALEMATE'}[r.reason]||r.reason;
   const crew=r.ogaResults.map(o=>{const u=st().units[o.id];return `<li><img alt="" src="${S.unit(u)}"><div>${esc(o.name)}<span class="h">${{carried_out:'CARRIED OUT',bled_out:'LEFT TO BLEED',left_behind:'LEFT BEHIND',stabilized_recovered:'STABILIZED · BROUGHT HOME',recovered:'BROUGHT HOME',ok:o.hp<o.maxHp?'HURT · STILL STANDING':'UNTOUCHED'}[o.how]||''}</span></div><span class="s ${o.finalStatus}">${o.finalStatus}</span></li>`;}).join('');
   const dead=r.enemyResults.filter(e=>e.status==='ELIMINATED').length,sur=r.enemyResults.filter(e=>e.status==='SURRENDERED').length,fled=r.enemyResults.filter(e=>e.status==='FLED').length;
   const pct=r.stats.shots?Math.round(r.stats.hits/r.stats.shots*100):0;
   R_.ov.hidden=false;R_.ov.innerHTML=`<div class="panel sd-result"><h2 class="${r.outcome}">${label}</h2><div class="why">${esc(why)} · ${r.turns} TURN${r.turns>1?'S':''}</div>
    <ul class="sd-crew">${crew}</ul>${r.captive?`<ul class="sd-crew"><li><div>${esc(r.captive.name)}<span class="h">${r.captive.extracted?'BROUGHT OUT':'STILL HELD'}</span></div><span class="s ${r.captive.extracted?'':'CAPTURED'}">${r.captive.extracted?'SAFE':'HELD'}</span></li></ul>`:''}
    <div class="sd-tally"><div>DOWN<b>${dead}</b></div><div>SURRENDERED<b>${sur}</b></div><div>SHOTS<b>${r.stats.hits}/${r.stats.shots} · ${pct}%</b></div><div>${fled?'FLED':'HEAT'}<b>${fled?fled:'+'+r.heat.total}</b></div></div>
    ${r.rich.visible?'<div class="sd-hint">RICH WAS SEEN · +'+D.RICH.heatIfSeen+' HEAT · VAMPGRAM POST</div>':''}
    <div class="sd-btns"><button class="sd-mb" data-x="again">TRY AGAIN</button><button class="sd-mb red" data-x="missions">${opts.exitLabel||'MISSIONS'}</button></div></div>`;
   R_.ov.onclick=e=>{const b=e.target.closest('button');if(!b)return;const act=b.dataset.x;R_.ov.hidden=true;destroy();done({...r,uiAction:act});if(opts.onExit)opts.onExit(act,r);};
  }
  function menuHtml(){
   const s=st();
   const dev=opts.dev?`<div class="row"><div class="kv"><span>SEED</span><span>${esc(s.seed)}</span></div><div class="kv"><span>RNG CALLS</span><span>${s.rng.calls}</span></div><div class="kv"><span>ACTIONS</span><span>${s.actions.length}</span></div><div class="kv"><span>STATE HASH</span><span>${E.hash(s)}</span></div><button class="sd-mb" data-m="copy">COPY ACTION LOG</button></div>`:'';
   return `<div class="panel sd-menu"><h3>PAUSED</h3><div class="row"><button class="sd-mb" data-m="resume">RESUME</button>
    <button class="sd-mb" data-m="sound">SOUND: ${X.isMuted()?'OFF':'ON'}</button><button class="sd-mb" data-m="speed">SPEED: ${speed===1?'NORMAL':'FAST'}</button>
    <button class="sd-mb" data-m="help">HOW IT WORKS</button><button class="sd-mb red" data-m="retreat">CALL THE RETREAT</button></div>${dev}</div>`;
  }
  function helpHtml(){
   return `<div class="panel sd-menu"><h3>HOW IT WORKS</h3><div class="row" style="font-size:7px;line-height:1.7;text-align:left">
    <div>2 ACTIONS PER OGA. TAP AN OGA, TAP A TEAL TILE (PREVIEW), TAP AGAIN (GO). GOLD TILES = DASH (BOTH ACTIONS).</div>
    <div>TAP AN ENEMY FOR THE ODDS. THE % IS HONEST: 95% REALLY MISSES 1 IN 20.</div>
    <div>HALF SHIELD -20 · FULL SHIELD -40 · FLANKED = COVER IGNORED, +30 CRIT · HIGH GROUND +15 · OVERWATCH -15 · HUNKERED -20.</div>
    <div>OVERWATCH SHOOTS THE FIRST ENEMY THAT MOVES INTO SIGHT. RED BLEED TAG = DOWNED: PATCH UP WITH THE DOC OR CARRY TO THE EXIT ZONE (YELLOW EDGE).</div>
    <div>EVERYTHING LEFT DOWNED WHEN YOU LEAVE IS TAKEN.</div></div><button class="sd-mb" data-m="menu">BACK</button></div>`;
  }
  function openMenu(){menuOpen=true;R_.ov.hidden=false;R_.ov.innerHTML=menuHtml();}
  function closeMenu(){menuOpen=false;R_.ov.hidden=true;R_.ov.innerHTML='';}
  rootEl.querySelector('[data-a=menu]').addEventListener('click',()=>{X.unlock();X.play('tick');if(menuOpen)closeMenu();else openMenu();});
  R_.ov.addEventListener('click',e=>{
   if(!menuOpen)return;const b=e.target.closest('button');if(!b)return;const m=b.dataset.m;
   if(m==='resume')closeMenu();
   else if(m==='menu'){R_.ov.innerHTML=menuHtml();}
   else if(m==='help'){R_.ov.innerHTML=helpHtml();}
   else if(m==='sound'){X.setMuted(!X.isMuted());R_.ov.innerHTML=menuHtml();X.play('tick');}
   else if(m==='speed'){speed=speed===1?2:1;R_.ov.innerHTML=menuHtml();}
   else if(m==='copy'){try{navigator.clipboard.writeText(JSON.stringify({seed:st().seed,actions:st().actions}));}catch(err){}}
   else if(m==='retreat'){closeMenu();if(st().phase==='PLAYER')commit({type:'RETREAT'});}
  });

  // ---------- keyboard ----------
  function onKey(e){
   if(destroyed)return;if(e.target&&/input|textarea/i.test(e.target.tagName))return;
   const k=e.key;
   if(menuOpen){if(k==='Escape')closeMenu();return;}
   if(k==='Escape'){cancelPlan();return;}
   if(k==='Enter'||k===' '){if(plan){e.preventDefault();commit(plan.action);}return;}
   if(k==='e'||k==='E'){endTurn();return;}
   if(k==='Tab'){e.preventDefault();const n=nextReady(sel);if(n)select(n.id);return;}
   if(/^[1-8]$/.test(k)){const u=sel&&st().units[sel];if(!u)return;if(u.kind==='RICH')return;onAction(['MOVE','SHOOT','OVERWATCH','HUNKER','ABILITY','CARRY','RELOAD','ITEM'][+k-1]);}
  }
  window.addEventListener('keydown',onKey);

  // ---------- lifecycle ----------
  async function start(){
   busy=true; // input is closed until the intro has played (a tap during the banner used to race the intro's own busy reset)
   fit();drawBoard();
   // fit again once the panel has its real height
   requestAnimationFrame(()=>{lockCmd();fit();syncAll();});
   const s=st();sel=nextReady()?nextReady().id:null;syncAll();
   banner('SHOWDOWN','', (s.map.name||'').toUpperCase());await wait(800);
   if(session.opening&&session.opening().length&&!s.actions.length)await play(session.opening());
   else if(s.actions.length){/* resumed fight */}
   busy=false;
   if(s.phase==='PLAYER'&&!s.result)banner('YOUR TURN '+s.turn,'');
   if(s.result)finishScreen();
   syncAll();
   if(opts.onReady)opts.onReady(api);
  }
  function destroy(){
   destroyed=true;window.removeEventListener('resize',onResize);window.removeEventListener('orientationchange',onResize);window.removeEventListener('keydown',onKey);
   if(rootEl.parentNode)rootEl.parentNode.removeChild(rootEl);
  }
  const api={start,destroy,el:rootEl,session,tap:onTap,select,commit,get selected(){return sel;},get mode(){return mode;},get plan(){return plan;},get busy(){return busy;},get tile(){return tile;},get speed(){return speed;},refresh:syncAll,openMenu,closeMenu,
   setSpeed(v){speed=v;},idle:()=>new Promise(r=>{const t=setInterval(()=>{if(!busy){clearInterval(t);r();}},20);}),action:onAction,rich:onRich,end:endTurn,runAbility,cancel:cancelPlan};
  root.RAShowdownUI.current=api;
  return api;
 }
 root.RAShowdownUI={mount,current:null};
})(typeof window!=='undefined'?window:globalThis);
