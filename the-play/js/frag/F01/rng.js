(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — seedable, serialisable RNG (sfc32). ALL tactical randomness goes through this object, which lives
 // inside the tactical state, so  same state + same actions + same seed  =>  the same result, byte for byte.
 // Presentation-only randomness (screen shake, particles) never touches it.
 function hashSeed(seed){ // xmur3
  const s=String(seed);let h=1779033703^s.length;
  for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19);}
  const out=[];
  for(let k=0;k<4;k++){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;out.push(h>>>0);}
  return out;
 }
 // rng object = {seed, s:[a,b,c,d], calls}  (plain JSON, lives in the tactical state)
 function next(r){
  let [a,b,c,d]=r.s;
  let t=(a+b)|0;a=b^(b>>>9);b=(c+(c<<3))|0;c=(c<<21)|(c>>>11);d=(d+1)|0;t=(t+d)|0;c=(c+t)|0;
  r.s=[a>>>0,b>>>0,c>>>0,d>>>0];r.calls++;
  return (t>>>0)/4294967296;
 }
 function create(seed){const r={seed:String(seed),s:hashSeed(seed),calls:0};for(let i=0;i<15;i++)next(r);r.calls=0;return r;}
 const percent=r=>next(r)*100;                         // uniform [0,100)   hit iff percent < chance
 const int=(r,lo,hi)=>lo+Math.floor(next(r)*(hi-lo+1)); // inclusive
 root.RAShowdownRng={create,next,percent,int,hashSeed};
})(typeof window!=='undefined'?window:globalThis);
