// THE PLAY sandbox — placeholder sound. Synth blips only (WebAudio); no BX stingers, no samples. Every cue is logged to window.__raPlaySfx so the
// bot gate and the QA pass can confirm which cue fired where. Muted and silent-safe when AudioContext is unavailable (headless, autoplay-blocked).
let ctx=null,master=null,on=true,unlocked=false;
export const log=[];
if(typeof window!=='undefined')window.__raPlaySfx=log;
export function setOn(v){on=!!v;if(master)master.gain.value=on?0.5:0;}
export const isOn=()=>on;
export function unlock(){
 if(unlocked)return;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=on?0.5:0;master.connect(ctx.destination);if(ctx.state==='suspended')ctx.resume();unlocked=true;}catch(e){}
}
function tone(f,t0,d,type='square',g=0.18,slide=0){
 if(!ctx||!on)return;
 try{const o=ctx.createOscillator(),v=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,ctx.currentTime+t0);if(slide)o.frequency.linearRampToValueAtTime(f+slide,ctx.currentTime+t0+d);
  v.gain.setValueAtTime(0.0001,ctx.currentTime+t0);v.gain.exponentialRampToValueAtTime(g,ctx.currentTime+t0+0.01);v.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+t0+d);
  o.connect(v);v.connect(master);o.start(ctx.currentTime+t0);o.stop(ctx.currentTime+t0+d+0.02);}catch(e){}
}
function noise(t0,d,g=0.2,hp=800){
 if(!ctx||!on)return;
 try{const n=Math.floor(ctx.sampleRate*d),b=ctx.createBuffer(1,n,ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);
  const s=ctx.createBufferSource();s.buffer=b;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=hp;const v=ctx.createGain();v.gain.value=g;s.connect(f);f.connect(v);v.connect(master);s.start(ctx.currentTime+t0);}catch(e){}
}
const CUES={
 tap:()=>tone(520,0,.05,'square',.1),
 select:()=>{tone(440,0,.06,'square',.12);tone(660,.06,.08,'square',.12);},
 seat:()=>{tone(300,0,.05,'triangle',.2);tone(420,.05,.07,'triangle',.18);},
 deny:()=>{tone(180,0,.12,'sawtooth',.14);},
 go:()=>{tone(200,0,.5,'sawtooth',.14,300);noise(0,.4,.08,1500);},
 engine:()=>{tone(80,0,.7,'sawtooth',.12,90);},
 slide:()=>{noise(0,.5,.12,2500);tone(140,0,.5,'sawtooth',.1,-60);},
 beat:()=>tone(330,0,.06,'square',.1),
 moment:tag=>({CLUTCH:()=>{tone(523,0,.08,'square',.14);tone(784,.08,.14,'square',.14);},FUNNY:()=>{tone(392,0,.06,'triangle',.16);tone(494,.07,.06,'triangle',.16);tone(392,.14,.08,'triangle',.16);},SCARY:()=>{tone(150,0,.2,'sawtooth',.16,-60);},WARM:()=>{tone(523,0,.1,'triangle',.14);tone(659,.1,.14,'triangle',.14);}}[tag]||(()=>tone(300,0,.06,'square',.1)))(),
 hit:()=>{noise(0,.12,.22,300);tone(120,0,.12,'square',.16,-50);},
 down:()=>{tone(220,0,.3,'sawtooth',.16,-140);noise(0,.2,.12,200);},
 freeze:()=>{tone(880,0,.1,'sine',.14);tone(660,.1,.16,'sine',.12);},
 call:()=>{tone(600,0,.07,'square',.14);tone(900,.07,.09,'square',.14);},
 chase:()=>{noise(0,.8,.1,1800);tone(160,0,.8,'sawtooth',.1,120);},
 clean:()=>{tone(523,0,.09,'square',.14);tone(659,.09,.09,'square',.14);tone(784,.18,.09,'square',.14);tone(1047,.27,.2,'square',.16);},
 crash:()=>{noise(0,.5,.3,150);tone(90,0,.4,'sawtooth',.2,-40);},
 split:()=>{tone(400,0,.1,'square',.14);tone(300,.12,.1,'square',.14);tone(200,.24,.2,'square',.14);},
 thump:()=>{tone(70,0,.15,'sine',.3);noise(0,.08,.1,200);},
 crate:r=>{const b={COMMON:520,RARE:680,LEGENDARY:880}[r]||520;tone(b,0,.08,'square',.16);tone(b*1.5,.07,.1,'square',.16);if(r==='LEGENDARY'){tone(b*2,.16,.3,'triangle',.18);tone(b*3,.2,.3,'triangle',.1);}},
 cash:()=>{tone(1200,0,.04,'square',.1);tone(1600,.04,.06,'square',.1);},
 jackpot:()=>{[523,659,784,1047,1319,1568].forEach((f,i)=>tone(f,i*.07,.14,'square',.16));},
 tension:()=>{tone(110,0,.2,'sine',.25);tone(110,.35,.2,'sine',.25);},
 turned:()=>{tone(300,0,.5,'sawtooth',.2,-240);noise(0,.5,.16,300);},
 win:()=>{[392,523,659,784].forEach((f,i)=>tone(f,i*.09,.16,'square',.14));},
 lose:()=>{[330,262,196].forEach((f,i)=>tone(f,i*.14,.24,'sawtooth',.14));},
 text:()=>{tone(1000,0,.04,'square',.08);tone(1300,.05,.05,'square',.08);},
 gram:()=>{tone(700,0,.06,'triangle',.12);tone(1050,.06,.1,'triangle',.12);},
 tempt:()=>{tone(300,0,.1,'triangle',.14);tone(360,.12,.12,'triangle',.14);},
 gun:()=>{noise(0,.05,.2,1000);tone(600,.05,.08,'square',.14);},
 siren:()=>{tone(700,0,.3,'triangle',.12,300);tone(1000,.3,.3,'triangle',.12,-300);}
};
export function play(name,arg){
 log.push(name+(arg?':'+arg:''));if(log.length>400)log.shift();
 if(!ctx||!on)return;
 try{const f=CUES[name];if(f)f(arg);}catch(e){}
}
export function buzz(ms){try{if(!(prefersReduced()))navigator.vibrate&&navigator.vibrate(ms);}catch(e){}}
export const prefersReduced=()=>{try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}};
