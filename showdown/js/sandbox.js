(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — the non-story SANDBOX for the Ube feel gate. Neutral placeholder Ogas and enemies, procedural art,
 // no story, no sealed material. Loaded by assets/f01/showdown-sandbox.html; in the game it stays inert until
 // RAShowdownSandbox.open() is called (DEV, flag ON).
 const D=root.RAShowdownData,M=root.RAShowdownMaps,S=root.RAShowdownSprites,SD=root.RAShowdown;
 const $=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;};
 const NAMES={MUSCLE:'BRICK',SHOOTER:'HAWK',WHEELS:'CLUTCH',TALKER:'SMOOTH',GHOST:'SHADE',DOC:'PATCH'};
 const GUNS={MUSCLE:'sapporo_shotgun',SHOOTER:'chopstick_sniper',WHEELS:'pistol',TALKER:'pistol',GHOST:'pistol',DOC:'lil_oga'};
 const ORDER=['MUSCLE','SHOOTER','WHEELS','TALKER','GHOST','DOC'];
 const GUN_LABEL=id=>(D.WEAPONS[id]||{label:id}).label;
 function params(){try{return new URLSearchParams(root.location.search);}catch(e){return new URLSearchParams('');}}

 function buildConfig(missionId,squadClasses,seed,opts){
  opts=opts||{};
  const m=M.SANDBOX_MISSIONS.find(x=>x.id===missionId)||M.SANDBOX_MISSIONS[0];
  const chosen=ORDER.filter(c=>squadClasses.includes(c));
  const squad=chosen.map((cls,i)=>({id:cls.toLowerCase(),name:NAMES[cls],cls,weapon:(m.loadout&&m.loadout[cls])||GUNS[cls],race:'VAMPIRE',bonds:i===1?[chosen[0].toLowerCase()]:[]}));
  return {id:'sandbox-'+m.id,jobId:'sandbox-'+m.id,jobType:m.jobType,seed,sandbox:true,map:M.get(m.map),squad,enemies:m.enemies,objective:m.objective,turnLimit:m.turnLimit||null,revealedPods:m.revealedPods,
   modifiers:m.id==='boss'?['RAIN']:[],
   // sandbox-only lever for the feel gate: HARD lets every revealed enemy shoot twice (PROVISIONAL enemyShotsPerTurn 1 -> 2)
   tunables:{...(opts.hard?{enemyShotsPerTurn:2}:{}),...(opts.tunables||{})}};
 }

 function start(container,opts){
  opts=opts||{};const p=params();
  const dev=opts.dev!==undefined?opts.dev:p.get('dev')==='1';
  const host=container||document.body;
  let mission=p.get('mission')||'skirmish';
  let squad=(p.get('squad')||'MUSCLE,SHOOTER,GHOST,DOC').split(',').filter(c=>D.CLASSES[c]);
  let seedText=p.get('seed')||'';
  let hard=p.get('hard')==='1';
  const tunables={};for(const kv of String(p.get('tun')||'').split(',')){const [k,v]=kv.split(':');if(k&&v!==undefined&&!isNaN(+v))tunables[k]=+v;}
  const root_=$('div','sb');host.appendChild(root_);
  const saved=SD.stores.local.load();
  function render(){
   const m=M.SANDBOX_MISSIONS.find(x=>x.id===mission);
   const chosen=ORDER.filter(c=>squad.includes(c));
   root_.innerHTML=`<div class="panel sb-card"><div class="sb-title">SHOWDOWN<small>TACTICAL SANDBOX</small></div>
    <div class="sb-tag">NEUTRAL TEST FIELD · NO STORY · PLACEHOLDER ART</div>
    <div class="sb-list">${M.SANDBOX_MISSIONS.map(x=>`<button class="sb-m ${x.id===mission?'on':''}" data-m="${x.id}"><b>${x.label}</b><span>${x.blurb}</span></button>`).join('')}</div>
    <div class="sb-tag" style="background:#33255b">PICK 3-4 OGAS · FIRST TWO ARE DAY ONES</div>
    <div class="sb-squad">${ORDER.map(c=>{const look=D.CLASSES[c];const dummy={kind:'OGA',cls:c};return `<button class="sb-c ${squad.includes(c)?'on':''}" data-c="${c}"><img alt="" src="${S.unit(dummy)}"><b>${NAMES[c]}</b><span>${look.abilityLabel}</span><span>${GUN_LABEL((m.loadout&&m.loadout[c])||GUNS[c])}</span></button>`;}).join('')}</div>
    <div class="sb-foot">${chosen.map(c=>`${NAMES[c]} (${c}) · ${D.CLASSES[c].text}`).join('<br>')}</div>
    ${dev?`<div class="sb-dev">SEED (DEV)<input data-seed value="${seedText}" placeholder="random"></div>`:''}
    <button class="sd-mb" data-hard style="background:${hard?'#7d194b':'#17142c'};color:#f6efd9;border:2px solid #b7b1df;min-height:44px;font-family:inherit;font-size:8px">ENEMIES: ${hard?'HARD · SHOOT TWICE':'STANDARD'}</button>
    <button class="sb-go" data-go ${chosen.length<3||chosen.length>4?'disabled':''}>${chosen.length<3?'PICK 3 OR 4':'START'}</button>
    ${saved&&saved.status==='ACTIVE'?'<button class="sd-mb" data-resume style="background:#17142c;color:#f6efd9;border:2px solid #b7b1df;min-height:44px;font-family:inherit">CONTINUE LAST FIGHT</button>':''}
    <div class="sb-foot">F01 SHOWDOWN_CORE · v${D.VERSION}${dev?' · DEV':''}</div></div>`;
  }
  render();
  root_.addEventListener('input',e=>{if(e.target.dataset.seed!==undefined)seedText=e.target.value;});
  root_.addEventListener('click',e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.m){mission=b.dataset.m;render();}
   else if(b.dataset.c){const c=b.dataset.c;if(squad.includes(c))squad=squad.filter(x=>x!==c);else if(squad.length<4)squad=[...squad,c];render();}
   else if('hard' in b.dataset){hard=!hard;render();}
   else if('go' in b.dataset)launch(false);
   else if('resume' in b.dataset)launch(true);
  });
  let lastSeed=null;
  async function launch(resume,again){
   let made;
   if(resume){made=SD.createSession(null,{state:saved,store:'local'});}
   else{
    const seed=again&&lastSeed?lastSeed:(seedText||('sbx-'+Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36)));
    lastSeed=dev?seed:null;
    made=SD.createSession(buildConfig(mission,squad,seed,{hard,tunables}),{store:'local'});
   }
   if(!made.ok){alert('Cannot start: '+made.message);return;}
   root_.style.display='none';
   const result=await SD.launch(made.session,{container:host,dev,exitLabel:'MISSIONS',onExit:act=>{}});
   root_.style.display='';
   if(result&&result.uiAction==='again'&&!resume){return launch(false,true);}
   render();
  }
  if(p.get('autostart')==='1')setTimeout(()=>launch(false),0);
  return {el:root_,launch,setMission:m=>{mission=m;render();},setSquad:s=>{squad=s;render();},destroy(){root_.remove();}};
 }
 // In-game DEV entry: a full-screen overlay hosting the sandbox (flag ON only).
 function open(){
  if(root.RAFeatures&&!root.RAFeatures.enabled('F01.showdown_core'))return {ok:false,code:'FLAG_OFF'};
  const layer=$('div');layer.style.cssText='position:fixed;inset:0;z-index:4900;background:#070a16';document.body.appendChild(layer);
  return {ok:true,sandbox:start(layer,{dev:true}),layer,close(){layer.remove();}};
 }
 root.RAShowdownSandbox={start,open,buildConfig,NAMES,GUNS};
})(typeof window!=='undefined'?window:globalThis);
