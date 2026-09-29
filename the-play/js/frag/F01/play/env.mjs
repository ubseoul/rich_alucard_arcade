// F01 THE PLAY — environment shim. The preserved F01 seeded RNG and authored data are classic scripts (rng.js, data.js) that publish
// globals; in the browser they are loaded with <script>, in node the test harness publishes the same globals before importing the engine.
export const Rng=globalThis.RAShowdownRng, D=globalThis.RAShowdownData;
if(!Rng||!D)throw new Error('F01 play: load js/frag/F01/rng.js and data.js (RAShowdownRng / RAShowdownData) before the play modules');
export const stream=(seed,key)=>{const r=Rng.create(`${seed}|${key}`);return {r,next:()=>Rng.next(r),int:(a,b)=>Rng.int(r,a,b),pick:arr=>arr[Rng.int(r,0,arr.length-1)],chance:p=>Rng.next(r)<p};};
