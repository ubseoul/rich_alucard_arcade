// THE PLAY sandbox — shared UI state, HUD and the screen slot.
import * as W from '../../../js/frag/F01/play/world.mjs';
import {$,h,esc,store,prefs,tele} from './ui-core.mjs';
import {face,classColor} from './faces.mjs';
import * as SFX from './sfx.mjs';

export const S={w:null,board:null,q:[],last:null,curCfg:null,menuOpen:false,lastCrew:store.get('lastCrew',{}),params:new URLSearchParams(location.search)};

export function plate(o,st={},cls=''){
 if(!o)return `<span class="plate ${cls}"></span>`;
 if(o.id==='rich')return `<span class="plate RICH ${cls}">${richFace()}</span>`;
 return `<span class="plate ${o.cls||''} ${cls}">${face(o,st)}</span>`;
}
export function richFace(){
 return `<svg class="face" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 64 Q8 44 32 42 Q56 44 56 64Z" fill="#14141e" stroke="#000" stroke-width="1.6"/><path d="M26 42 L32 52 L38 42Z" fill="#f6efd9"/><path d="M30 44 L32 60 L34 44Z" fill="#c8102e"/><rect x="19" y="12" width="26" height="28" rx="11" fill="#7a5638" stroke="#000" stroke-width="1.6"/><path d="M18 22 Q19 8 32 8 Q45 8 46 22 Q40 14 32 14 Q24 14 18 22Z" fill="#0e0e16"/><rect x="21" y="23" width="9.6" height="6" rx="2.4" fill="#0b0b12"/><rect x="33.4" y="23" width="9.6" height="6" rx="2.4" fill="#0b0b12"/><rect x="30.4" y="24.6" width="3.2" height="1.6" fill="#0b0b12"/><rect x="22" y="24" width="3" height="1.2" fill="#37d5e8"/><path d="M28 34.4 Q32 36 36 34.4" stroke="#0b0b12" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;
}

export function setScreen(el){
 const st=$('#stage');[...st.children].forEach(c=>{if(!c.classList.contains('keep'))c.remove();});st.appendChild(el);return el;
}

export function hud(){
 const w=S.w;const el=$('#hud');if(!el||!w)return;
 const ready=W.readyOnes(w).length;
 el.innerHTML=`<span class="night">NIGHT ${Math.max(1,w.night)}</span><span class="cash">$${Math.round(w.cash)}K</span>
  <span class="heat">HEAT<span class="heatbar"><i style="width:${Math.min(100,Math.round(w.heat*4))}%"></i></span></span>
  <span class="sp"></span><span class="roster" title="ready / crew">${ready}/${w.roster.length} READY</span>
  <button class="menu" id="menubtn" aria-label="menu">☰</button>`;
}

export function saveWorld(){store.set('world',S.w);}
export function statusLabel(o,w){
 if(o.status==='READY')return 'READY';
 if(o.status==='WOUNDED'||o.status==='SHOT')return `${o.status} · ${Math.max(1,o.away)} NIGHT${o.away>1?'S':''}`;
 if(o.status==='CAPTURED'){const g=(w.captives||[]).find(g=>g.ids.includes(o.id));return `CAPTURED · ${g?g.clock:'?'} LEFT`;}
 return o.status;
}
