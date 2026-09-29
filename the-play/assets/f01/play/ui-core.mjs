// THE PLAY sandbox — UI core: DOM helpers, persistence (F01's own save namespace), telemetry, pacing, tips, toasts.
import * as SFX from './sfx.mjs';

export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function h(html){const t=document.createElement('template');t.innerHTML=html.trim();return t.content.firstElementChild;}

// ---------------------------------------------------------------------------------------------------------------- save namespace (R3)
// The persistent PLAY counter lives in F01's own namespace ("ra.f01.*"), never in the F13 / war-room save.
const NS='ra.f01.play.v1.';
const mem={};
export const store={
 get(k,d){try{const v=localStorage.getItem(NS+k);return v==null?(k in mem?mem[k]:d):JSON.parse(v);}catch(e){return k in mem?mem[k]:d;}},
 set(k,v){mem[k]=v;try{localStorage.setItem(NS+k,JSON.stringify(v));}catch(e){}},
 del(k){delete mem[k];try{localStorage.removeItem(NS+k);}catch(e){}}
};
export const counter={
 get(){return store.get('counter',{plays:0,tips:{},firstAt:Date.now()});},
 bump(){const c=counter.get();c.plays=(c.plays||0)+1;c.lastAt=Date.now();store.set('counter',c);return c.plays;},
 tipSeen(k){return !!counter.get().tips[k];},
 markTip(k){const c=counter.get();c.tips[k]=1;store.set('counter',c);}
};
export const prefs={
 get(){return {sound:true,calm:false,dev:false,...store.get('prefs',{})};},
 set(p){store.set('prefs',{...prefs.get(),...p});}
};

// ---------------------------------------------------------------------------------------------------------------- telemetry
// Every gate-relevant timing is logged. The headline number: ms from THE MORNING AFTER appearing to the first PITCH tap.
export const tele={
 events:store.get('tele',[]),
 mark:{},
 log(ev,data){const e={t:Date.now(),ev,...(data||{})};tele.events.push(e);if(tele.events.length>400)tele.events.shift();store.set('tele',tele.events);return e;},
 start(k){tele.mark[k]=performance.now();},
 since(k){return tele.mark[k]==null?null:Math.round(performance.now()-tele.mark[k]);},
 summary(){
  const m2p=tele.events.filter(e=>e.ev==='M2P_TAP').map(e=>e.ms),m2n=tele.events.filter(e=>e.ev==='M2NEXT_NIGHT').map(e=>e.ms);
  const med=a=>a.length?[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)]:null;
  return {plays:tele.events.filter(e=>e.ev==='PLAY_END').length,morningToNextNightMs:m2n,morningToPitchTapMs:m2p,medianMorningToPitchTapMs:med(m2p),medianMorningToNextNightMs:med(m2n)};
 }
};

// ---------------------------------------------------------------------------------------------------------------- pacing
export const pace={speed:1,hurry:false,skipResolvers:new Set()};
export function wait(ms){
 return new Promise(res=>{
  if(pace.hurry)ms=Math.min(ms,180);
  const t=setTimeout(done,Math.max(0,ms*pace.speed));
  function done(){clearTimeout(t);pace.skipResolvers.delete(done);res();}
  pace.skipResolvers.add(done);
 });
}
export function skip(){pace.hurry=true;for(const f of [...pace.skipResolvers])f();}
export const unhurry=()=>{pace.hurry=false;};

// ---------------------------------------------------------------------------------------------------------------- toast / tip
export function toast(msg,ms=2200){
 const app=$('.app');if(!app)return;const t=h(`<div class="toast">${esc(msg)}</div>`);app.appendChild(t);setTimeout(()=>t.remove(),ms*pace.speed+50);
}
export function tip(key,title,text){
 if(counter.tipSeen(key))return Promise.resolve();
 counter.markTip(key);
 return new Promise(res=>{
  const app=$('.app');const t=h(`<div class="tip" role="dialog"><span class="px">${esc(title)}</span>${esc(text)}<br><button data-ok>GOT IT</button></div>`);
  app.appendChild(t);t.querySelector('[data-ok]').addEventListener('click',()=>{SFX.play('tap');t.remove();res();});
  tele.log('TIP',{key});
 });
}
export const tap=(el,fn,sfx='tap')=>{el.addEventListener('click',e=>{SFX.unlock();if(sfx)SFX.play(sfx);fn(e);});};
export const once=(el,sel)=>new Promise(res=>{const n=typeof el==='string'?$(el):el;n.addEventListener('click',()=>res(),{once:true});});

// ---------------------------------------------------------------------------------------------------------------- misc
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const money=n=>'$'+Math.round(n*10)/10+'K';
export const zoneKey=z=>String(z||'').replace(/\s/g,'');
