(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — sandbox feedback sounds, synthesised with WebAudio (no files, no canon audio). The real BX_* codes from
 // Vol 7 section 11 are registered as inert drop-in hooks in js/data/audio/parts/F01_showdown.js; until Audio supplies files the
 // sandbox maps each event's sfx tag to one of these placeholders. Muted by default until the first tap (autoplay policy).
 let ctx=null,master=null,muted=false;
 const KEY='rich_alucard_f01_ui_v1';
 try{const v=JSON.parse(root.localStorage&&root.localStorage.getItem(KEY)||'{}');muted=!!v.muted;}catch(e){}
 function ensure(){
  if(muted)return null;
  if(!ctx){const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return null;try{ctx=new AC();master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination);}catch(e){return null;}}
  if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  return ctx;
 }
 function tone(f,dur,{type='square',gain=.18,slide=0,delay=0}={}){
  const c=ensure();if(!c)return;const t=c.currentTime+delay;const o=c.createOscillator(),g=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+dur);
  g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(master);o.start(t);o.stop(t+dur+.02);
 }
 function noise(dur,{gain=.25,lp=3000,hp=0,delay=0}={}){
  const c=ensure();if(!c)return;const t=c.currentTime+delay;const n=Math.floor(c.sampleRate*dur);const b=c.createBuffer(1,n,c.sampleRate);const d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;const g=c.createGain();g.gain.value=gain;
  s.connect(f);let last=f;if(hp){const h=c.createBiquadFilter();h.type='highpass';h.frequency.value=hp;f.connect(h);last=h;}
  last.connect(g).connect(master);s.start(t);
 }
 const S={
  tick:()=>tone(880,.04,{gain:.08}),
  select:()=>{tone(660,.05,{gain:.1});tone(990,.05,{gain:.08,delay:.04});},
  deny:()=>{tone(180,.12,{type:'sawtooth',gain:.12});},
  step:()=>noise(.04,{gain:.06,lp:900}),
  shot:()=>{noise(.16,{gain:.32,lp:5200,hp:300});tone(150,.12,{type:'sawtooth',gain:.14,slide:-90});},
  shotgun:()=>{noise(.3,{gain:.42,lp:3600});tone(90,.22,{type:'sawtooth',gain:.2,slide:-50});},
  sniper:()=>{noise(.22,{gain:.3,lp:7000,hp:800});tone(120,.35,{type:'sawtooth',gain:.14,slide:-80});},
  blast:()=>{noise(.6,{gain:.5,lp:1800});tone(70,.5,{type:'sawtooth',gain:.25,slide:-40});},
  hit:()=>{tone(220,.09,{type:'square',gain:.2,slide:-120});noise(.06,{gain:.2,lp:2200});},
  cover:()=>{tone(1400,.06,{type:'triangle',gain:.18,slide:-500});noise(.05,{gain:.18,lp:6000,hp:1500});},
  crit:()=>{tone(220,.1,{gain:.22,slide:-100});tone(880,.14,{type:'triangle',gain:.2,delay:.05});tone(1320,.16,{type:'triangle',gain:.16,delay:.1});},
  miss:()=>{noise(.12,{gain:.12,lp:1400,hp:500});},
  joke:()=>{tone(392,.1,{gain:.14});tone(330,.1,{gain:.14,delay:.1});tone(262,.22,{type:'triangle',gain:.16,delay:.2});},
  overwatch:()=>{tone(1800,.03,{gain:.12});tone(1200,.03,{gain:.12,delay:.08});tone(300,.35,{type:'sine',gain:.1});},
  pod:()=>{tone(240,.22,{type:'sawtooth',gain:.2,slide:120});tone(180,.4,{type:'sawtooth',gain:.22,delay:.18,slide:-60});noise(.3,{gain:.12,lp:800,delay:.05});},
  downed:()=>{tone(110,.3,{type:'sine',gain:.3,slide:-50});tone(70,.12,{type:'sine',gain:.3,delay:.5});tone(70,.12,{type:'sine',gain:.3,delay:.8});},
  heal:()=>{tone(520,.08,{type:'triangle',gain:.12});tone(780,.12,{type:'triangle',gain:.12,delay:.07});},
  slam:()=>{tone(60,.4,{type:'sawtooth',gain:.38,slide:-25});noise(.2,{gain:.3,lp:1200});},
  engine:()=>{tone(55,1.2,{type:'sawtooth',gain:.14,slide:30});noise(1.0,{gain:.05,lp:400});},
  win:()=>{[392,494,587,784].forEach((f,i)=>tone(f,.18,{type:'square',gain:.14,delay:i*.11}));},
  lose:()=>{[330,262,196,131].forEach((f,i)=>tone(f,.28,{type:'sawtooth',gain:.14,delay:i*.18}));},
  retreat:()=>{[440,330,247].forEach((f,i)=>tone(f,.2,{type:'triangle',gain:.14,delay:i*.14}));},
  crate:()=>{tone(140,.16,{type:'square',gain:.2,slide:-60});tone(2200,.05,{type:'triangle',gain:.1,delay:.12});},
  vanish:()=>{tone(900,.3,{type:'sine',gain:.1,slide:-700});},
  talk:()=>{tone(330,.06,{gain:.1});tone(370,.06,{gain:.1,delay:.08});tone(300,.08,{gain:.1,delay:.16});}
 };
 // map engine sfx tags and event kinds to sounds
 function forEvent(e){
  switch(e.t){
   case 'SHOT':
    if(e.sfx==='BX_OVERWATCH')return e.hit?['overwatch','hit']:['overwatch','miss'];
    return [e.gunSfx==='GUN_SHOTGUN'?'shotgun':e.gunSfx==='GUN_SNIPER'?'sniper':'shot',e.hit?(e.cover&&e.cover!=='NONE'&&!e.crit?'cover':(e.crit?'crit':'hit')):'miss'];
   case 'BLAST':case 'BLOOD_BATH':return ['blast'];
   case 'POD_REVEAL':return ['pod'];
   case 'DOWNED':case 'RICH_DOWN':return ['downed'];
   case 'HEAL':case 'STABILIZED':return ['heal'];
   case 'OVERWATCH_SET':return ['overwatch'];
   case 'PULL_UP':return ['engine'];
   case 'EXTRACTED':return ['crate'];
   case 'VANISH':return ['vanish'];
   case 'TALK':return ['talk'];
   case 'CHECK':case 'CAR_RAM':case 'BITE':case 'REVENGE':return ['hit'];
   case 'MOVE':return ['step'];
   case 'END':return [e.outcome==='VICTORY'?'win':e.outcome==='FAILURE'?'lose':'retreat'];
  }
  return [];
 }
 root.RAShowdownSfx={play:name=>{try{(S[name]||S.tick)();}catch(e){}},forEvent,
  setMuted(v){muted=!!v;try{root.localStorage.setItem(KEY,JSON.stringify({muted}));}catch(e){}},isMuted:()=>muted,unlock:ensure,names:Object.keys(S)};
})(typeof window!=='undefined'?window:globalThis);
