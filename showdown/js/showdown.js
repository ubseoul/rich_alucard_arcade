(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — RAShowdown: the public facade. Sessions, hooks, persistence, and the entry points other fragments call.
 //   RAShowdown.createSession(config)          headless tactical session (engine + listeners + optional persistence)
 //   RAShowdown.f04.enter(packet,{container})  TAKE THE BLOCK / EXTRACT / RETALIATION / HAND BACK / emergency RUN escalation
 //   RAShowdown.enter(kind,params)             any other consumer (F05 Trap raid/defense, F07 finale hooks)
 // Gate: in the game (RAFeatures present) everything refuses unless flag F01.showdown_core is ON. The standalone sandbox page has
 // no RAFeatures, so it is always allowed. With the flag OFF this file only defines functions: zero behaviour change.
 const FLAG='F01.showdown_core';
 const D=root.RAShowdownData,E=root.RAShowdownEngine,P=root.RAShowdownPackets;
 const enabled=()=>root.RAFeatures?!!root.RAFeatures.enabled(FLAG):true;
 const hookFns={richSeen:new Set(),end:new Set(),event:new Set()};
 const hooks={
  on(name,fn){if(!hookFns[name])throw new Error(`RAShowdown.hooks: unknown hook ${name}`);hookFns[name].add(fn);return ()=>hookFns[name].delete(fn);},
  fire(name,payload){for(const fn of [...hookFns[name]||[]]){try{fn(payload);}catch(e){console.error('showdown hook',name,e);}}},
  names:()=>Object.keys(hookFns)
 };

 // ---- persistence: tactical state is plain JSON, so a fight survives a reload ----
 const SANDBOX_KEY='rich_alucard_f01_sandbox_v1';
 const safeStorage=()=>{try{return root.localStorage||null;}catch(e){return null;}};
 const stores={
  local:{save(state){try{safeStorage()?.setItem(SANDBOX_KEY,E.serialize({state,config:null}));return true;}catch(e){return false;}},
   load(){try{const raw=safeStorage()?.getItem(SANDBOX_KEY);return raw?JSON.parse(raw).state:null;}catch(e){return null;}},
   clear(){try{safeStorage()?.removeItem(SANDBOX_KEY);}catch(e){}}},
  frag:{save(state){if(!root.RAFrag)return false;root.RAFrag.patch('F01','active',{state:JSON.stringify(state),turn:state.turn});return true;},
   load(){if(!root.RAFrag||!root.RAFrag.has('F01'))return null;const a=root.RAFrag.read('F01','active',null);return a&&a.state?JSON.parse(a.state):null;},
   clear(){if(root.RAFrag&&root.RAFrag.has('F01'))root.RAFrag.patch('F01','active',null);}}
 };

 function createSession(config,opts){
  opts=opts||{};
  if(!opts.force&&!enabled())return {ok:false,code:'FLAG_OFF',message:`${FLAG} is OFF`};
  let state;
  try{state=opts.state?E.deserialize(opts.state):E.create(config);}catch(e){return {ok:false,code:e.code||'BAD_CONFIG',message:e.message};}
  const store=opts.store?stores[opts.store]:null;const listeners=new Set();const history=[];
  const session={
   config:config||null,
   get state(){return state;},
   get result(){return state.result;},
   on(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
   dispatch(action){
    const r=E.apply(state,action);if(!r.ok)return r;
    history.push(state.actions.length);state=r.state;
    for(const e of r.events){
     if(e.t==='RICH_SEEN')hooks.fire('richSeen',{...e,state:{turn:state.turn}});
     hooks.fire('event',e);
     for(const fn of [...listeners]){try{fn(e,state);}catch(err){console.error('showdown listener',err);}}
    }
    if(store&&!state.result)store.save(state);
    if(store&&state.result)store.clear();
    if(state.result)hooks.fire('end',state.result);
    return r;
   },
   save(){return store?store.save(state):false;},
   serialize(){return E.serialize(state);}
  };
  // opening events (a pod already in sight of the deployment) are delivered to the first listener via replayOpening()
  session.opening=()=>state.opening||[];
  return {ok:true,session};
 }

 // ---- consumers ----
 // launch(session,opts) is provided by the UI module when it is loaded; headless callers use session.dispatch directly.
 function launch(session,opts){
  if(!root.RAShowdownUI)return Promise.reject(new Error('RAShowdownUI not loaded'));
  return root.RAShowdownUI.mount(session,opts||{});
 }
 async function enterF04(packet,opts){
  opts=opts||{};
  if(!enabled())return {ok:false,code:'FLAG_OFF'};
  const built=P.fromWarRoomPacket(packet,opts);if(!built.ok)return {ok:false,code:'BAD_PACKET',errors:built.errors};
  const made=createSession(built.config,{store:opts.persist?'frag':null});if(!made.ok)return made;
  if(opts.headless)return {ok:true,session:made.session,notes:built.notes};
  const result=await launch(made.session,opts);
  const resolution=P.toF04Resolution(result);
  let delivered=false;
  if(opts.deliver!==false&&root.RAWarRoomShowdown&&typeof root.RAWarRoomShowdown.receiveResolution==='function'){root.RAWarRoomShowdown.receiveResolution(resolution);delivered=true;}
  return {ok:true,result,resolution,strategic:P.toStrategic(result),delivered,notes:built.notes};
 }
 async function enter(kind,params){
  if(!enabled())return {ok:false,code:'FLAG_OFF'};
  const built=P.entry(kind,params);if(!built.ok)return {ok:false,code:'BAD_PACKET',errors:built.errors};
  const made=createSession(built.config,{});if(!made.ok)return made;
  if(params&&params.headless)return {ok:true,session:made.session,notes:built.notes};
  const result=await launch(made.session,params||{});
  return {ok:true,result,strategic:P.toStrategic(result),notes:built.notes};
 }
 function describe(){
  return {version:D.VERSION,flag:FLAG,enabled:enabled(),source:D.SOURCE,provisional:D.PROVISIONAL.map(p=>({...p})),sourceRequired:D.SOURCE_REQUIRED.map(p=>({...p})),
   f02:P.f02Report(),profiles:Object.keys(P.profiles),hooks:hooks.names(),maps:root.RAShowdownMaps?root.RAShowdownMaps.list().map(m=>m.id):[]};
 }

 root.RAShowdown={FLAG,enabled,hooks,stores,createSession,launch,describe,enter,f04:{enter:enterF04,toResolution:P.toF04Resolution},f02:{bind:P.bindF02,report:P.f02Report},
  profiles:P.profiles,registerProfile:P.registerProfile,engine:E,data:D,packets:P,
  replay:E.replay,hash:E.hash};
})(typeof window!=='undefined'?window:globalThis);
