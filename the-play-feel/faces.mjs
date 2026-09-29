// THE PLAY sandbox — procedural art: Oga portraits (one hand-tuned face per named Oga, seeded faces for generics), top-down cars, the castle plan,
// crates and loot icons. Everything is inline SVG (no bitmaps, no external art). Placeholder-grade by policy, presentation-grade by intent:
// each face reads at 44px, each expression tracks NERVE and HP, each class has a colour.
const CLASS_COL={MUSCLE:'#e0603a',SHOOTER:'#e8c14a',WHEELS:'#3fd0e0',TALKER:'#b07ae8',GHOST:'#7f8cff',DOC:'#5fe08a'};
const CLASS_DARK={MUSCLE:'#7d2d18',SHOOTER:'#6b5a1e',WHEELS:'#175a66',TALKER:'#4b3272',GHOST:'#2c336e',DOC:'#1f6a3a'};
export const classColor=c=>CLASS_COL[c]||'#9aa0b8';
const INK='#120c1c';
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const SKINS=['#8a5a3c','#b9805a','#d2a077','#6b4430','#e0b990'];
const PALE='#d9c9dc';const HAIRS=['#1a1420','#3a2a20','#5a3a2a','#2b2f45','#7a5a3a'];

// each named Oga: skin, and a function that draws hair/hat/accessories on the 64x64 bust. Head box: x 19..45, y 12..40.
const NAMED={
 tunde:{skin:'#8a5a3c',build:1.12,
  hair:`<path d="M19 22 Q19 10 32 10 Q45 10 45 22 L45 19 Q32 14 19 19Z" fill="#15101b"/><rect x="19" y="10" width="26" height="6" rx="3" fill="#15101b"/>`,
  brows:`<rect x="23" y="23" width="7" height="2.4" rx="1" fill="#15101b"/><rect x="34" y="23" width="7" height="2.4" rx="1" fill="#15101b"/>`,
  acc:`<g><ellipse cx="46" cy="52" rx="10" ry="3.6" fill="#e8c14a"/><rect x="37" y="46" width="19" height="4" rx="2" fill="#5bc36a"/><ellipse cx="46.5" cy="44.5" rx="10" ry="3.4" fill="#d9a05a"/><rect x="38" y="49" width="17" height="2.4" fill="#8a3a2a"/></g><ellipse cx="41.5" cy="34" rx="2.6" ry="2" fill="#a06a48" opacity=".8"/>`,
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35" rx="3.4" ry="3" fill="${INK}"/>`:`<path d="M27 34 Q32 ${z==='SHAKY'?'34':'36.5'} 37 34" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`},
 dre:{skin:PALE,build:.95,
  hair:`<path d="M18 24 Q16 8 32 8 Q48 8 46 22 Q40 14 30 16 Q24 17 22 26Z" fill="#241a3a"/><path d="M40 12 Q49 10 49 20 Q46 16 42 17Z" fill="#241a3a"/>`,
  brows:`<rect x="23" y="22.5" width="7" height="2" rx="1" fill="#241a3a"/><rect x="34" y="22.5" width="7" height="2" rx="1" fill="#241a3a"/>`,
  acc:`<g transform="rotate(-14 12 50)"><rect x="6" y="40" width="11" height="18" rx="2.4" fill="#0b0b12" stroke="${INK}"/><rect x="7.6" y="42" width="8" height="12" rx="1" fill="#7ff0ff"/><rect x="9" y="44" width="5" height="1.4" fill="#0b0b12" opacity=".5"/></g><path d="M22 46 Q32 54 42 46" stroke="#e8c14a" stroke-width="1.8" fill="none"/><circle cx="32" cy="52" r="2" fill="#e8c14a"/>`,
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35" rx="3.4" ry="3" fill="${INK}"/><path d="M29.4 33.3 L30.6 36 L31.8 33.3Z M32.2 33.3 L33.4 36 L34.6 33.3Z" fill="#fff"/>`:`<path d="M26 34 Q32 ${z==='SHAKY'?'34':'37.5'} 38 34" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M29 34.4 L30.2 37 L31.4 34.6Z M33 34.6 L34.2 37 L35.4 34.4Z" fill="#fff"/>`},
 half_pint:{skin:'#cfc2dd',build:.82,y:5,
  hair:`<path d="M15 34 Q13 8 32 7 Q51 8 49 34 L45 30 Q45 18 32 17 Q19 18 19 30Z" fill="#2c336e"/><path d="M15 34 L19 30 L19 40 Q15 40 15 34Z M49 34 L45 30 L45 40 Q49 40 49 34Z" fill="#2c336e"/>`,
  brows:`<rect x="24" y="24" width="6" height="1.8" rx=".9" fill="#2c336e"/><rect x="34" y="24" width="6" height="1.8" rx=".9" fill="#2c336e"/>`,
  big:true,acc:``,
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35.5" rx="2.6" ry="2.6" fill="${INK}"/>`:`<path d="M29 35 Q32 ${z==='SHAKY'?'35':'36.6'} 35 35" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M29.6 35.4 L30.4 37 L31.2 35.6Z M32.8 35.6 L33.6 37 L34.4 35.4Z" fill="#fff"/>`},
 sunday_best:{skin:'#d9c9dc',build:1,
  hair:`<ellipse cx="32" cy="17" rx="19" ry="4.4" fill="#211a2e"/><path d="M22 17 Q22 5 32 5 Q42 5 42 17Z" fill="#2d2440"/><rect x="22" y="13" width="20" height="3.4" fill="#e8c14a"/>`,
  brows:``,
  acc:`<rect x="22.4" y="23.5" width="8.4" height="5" rx="2" fill="#0b0b12"/><rect x="33.2" y="23.5" width="8.4" height="5" rx="2" fill="#0b0b12"/><rect x="30.6" y="24.6" width="2.8" height="1.4" fill="#0b0b12"/><path d="M28 43 L32 48 L36 43 L34 60 L30 60Z" fill="#c8102e" stroke="${INK}" stroke-width=".8"/><rect x="41" y="47" width="6" height="3" fill="#fff" transform="rotate(-12 44 48)"/>`,
  noeyes:true,
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35.4" rx="3" ry="2.8" fill="${INK}"/>`:`<path d="M27.5 34.6 Q32 ${z==='SHAKY'?'34.6':'36.2'} 36.5 34.6" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M29.4 34.8 L30.2 36.6 L31 34.8Z M33 34.8 L33.8 36.6 L34.6 34.8Z" fill="#fff"/>`},
 young_mazi:{skin:'#d0c0d8',build:.95,
  hair:`<path d="M19 20 Q19 8 33 8 Q46 8 45 20 L48 22 L44 24 Q32 18 19 24Z" fill="#175a66"/><rect x="28" y="6" width="8" height="3" rx="1.5" fill="#3fd0e0"/><path d="M17 23 L27 21 L27 25 L17 26Z" fill="#175a66"/>`,
  brows:`<rect x="23" y="22.6" width="7" height="2" rx="1" fill="#175a66" transform="rotate(-6 26 23)"/><rect x="34" y="22.6" width="7" height="2" rx="1" fill="#175a66" transform="rotate(6 38 23)"/>`,
  acc:`<rect x="10" y="50" width="9" height="8" rx="3" fill="#0b0b12"/><rect x="45" y="50" width="9" height="8" rx="3" fill="#0b0b12"/><rect x="12" y="52" width="5" height="1.4" fill="#3fd0e0"/><rect x="47" y="52" width="5" height="1.4" fill="#3fd0e0"/>`,
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35" rx="3.4" ry="3" fill="${INK}"/>`:`<path d="M25.6 33.4 Q32 ${z==='SHAKY'?'34':'39'} 38.4 33.4Z" fill="${INK}"/><path d="M28.6 34 L29.6 36.4 L30.6 34.2Z M33.4 34.2 L34.4 36.4 L35.4 34Z" fill="#fff"/>`},
 auntie_grit:{skin:'#b9805a',build:1.05,
  hair:`<path d="M17 26 Q15 6 32 6 Q49 6 47 26 Q46 16 32 15 Q18 16 17 26Z" fill="#f2c94c"/><path d="M17 16 Q32 0 47 16 L47 20 Q32 8 17 20Z" fill="#3f8f5a"/><circle cx="46" cy="18" r="4" fill="#3f8f5a"/><circle cx="46" cy="18" r="2" fill="#f2c94c"/>`,
  brows:`<rect x="23" y="22" width="7" height="2" rx="1" fill="#2a1a12"/><rect x="34" y="22" width="7" height="2" rx="1" fill="#2a1a12"/>`,
  acc:`<circle cx="26.4" cy="26.2" r="5.2" fill="none" stroke="#2a1a12" stroke-width="1.6"/><circle cx="37.6" cy="26.2" r="5.2" fill="none" stroke="#2a1a12" stroke-width="1.6"/><rect x="31" y="25.4" width="2" height="1.4" fill="#2a1a12"/><g transform="rotate(20 52 52)"><ellipse cx="52" cy="52" rx="5" ry="10" fill="#ff8fb5" stroke="${INK}"/><ellipse cx="52" cy="56" rx="3.6" ry="6" fill="#ffd2e2"/></g>`,
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35.4" rx="3" ry="2.8" fill="${INK}"/>`:`<path d="M27.5 35 Q32 ${z==='SHAKY'?'34.6':'33.6'} 36.5 35" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`}
};
const QUIRK_ACC={
 SKITTISH:`<path d="M46 20 q3 5 0 8 q-3 -3 0 -8Z" fill="#7ff0ff"/>`,
 SHOWBOAT:`<rect x="22.4" y="23.6" width="8" height="4.6" rx="2" fill="#0b0b12"/><rect x="33.6" y="23.6" width="8" height="4.6" rx="2" fill="#0b0b12"/><rect x="30" y="24.6" width="4" height="1.4" fill="#0b0b12"/><rect x="22" y="23.8" width="2" height="1" fill="#ff3d8b"/>`,
 LOYAL:`<rect x="18.6" y="17.6" width="26.8" height="4" rx="2" fill="#c8102e"/><rect x="43" y="16" width="6" height="3" rx="1.5" fill="#c8102e"/>`,
 STICKY_FINGERS:`<rect x="46" y="48" width="9" height="7" rx="2" fill="#b07ae8" stroke="${INK}"/><rect x="48" y="45" width="5" height="4" rx="1" fill="#e8c14a"/>`,
 HOTHEAD:`<path d="M20 14 l3 -6 l3 5 l3 -7 l3 7 l3 -6 l3 6" stroke="#ff8a3a" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`,
 STEADY:`<rect x="24" y="19" width="16" height="1.6" fill="#15101b" opacity=".6"/>`
};

function generic(o){
 const h=hash(o.id+o.name);const skin=o.vampire?PALE:SKINS[h%SKINS.length];const hc=HAIRS[(h>>3)%HAIRS.length];const style=(h>>6)%3;
 const hair=style===0?`<path d="M19 24 Q19 9 32 9 Q45 9 45 24 Q40 15 32 15 Q24 15 19 24Z" fill="${hc}"/>`
  :style===1?`<rect x="19" y="9" width="26" height="8" rx="4" fill="${hc}"/><rect x="19" y="14" width="3" height="10" fill="${hc}"/><rect x="42" y="14" width="3" height="10" fill="${hc}"/>`
  :`<circle cx="24" cy="12" r="6" fill="${hc}"/><circle cx="32" cy="9" r="6.5" fill="${hc}"/><circle cx="40" cy="12" r="6" fill="${hc}"/>`;
 return {skin,build:1,hair,brows:`<rect x="23" y="22.6" width="7" height="2" rx="1" fill="${hc}"/><rect x="34" y="22.6" width="7" height="2" rx="1" fill="${hc}"/>`,
  acc:QUIRK_ACC[o.quirk]||'',
  mouth:z=>z==='LOSING IT'?`<ellipse cx="32" cy="35" rx="3.2" ry="3" fill="${INK}"/>`:`<path d="M27 34 Q32 ${z==='SHAKY'?'34':'36.6'} 37 34" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>${o.vampire?'<path d="M29.4 34.2 L30.4 36.4 L31.4 34.4Z M32.6 34.4 L33.6 36.4 L34.6 34.2Z" fill="#fff"/>':''}`};
}

// state: {zone:'STEADY'|'SHAKY'|'LOSING IT', state:'UP'|'DOWN'|'RAN'|'DEAD', hurt:boolean, hurtHp:number}
export function face(o,st={}){
 const d=NAMED[o.id]||generic(o);const zone=st.zone||'STEADY';const down=st.state==='DOWN'||st.state==='DEAD';
 const body=CLASS_COL[o.cls]||'#9aa0b8',bd=CLASS_DARK[o.cls]||'#333';
 const sc=(d.build||1);const dy=d.y||0;
 const eyes=down?`<path d="M23 23 l6 6 m0 -6 l-6 6 M35 23 l6 6 m0 -6 l-6 6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`
  :d.noeyes?'':zone==='LOSING IT'?`<circle cx="26.5" cy="26" r="4.2" fill="#fff" stroke="${INK}"/><circle cx="37.5" cy="26" r="4.2" fill="#fff" stroke="${INK}"/><circle cx="26.5" cy="26.6" r="1.3" fill="${INK}"/><circle cx="37.5" cy="26.6" r="1.3" fill="${INK}"/>`
  :`<ellipse cx="26.5" cy="26.6" rx="${d.big?2.9:2}" ry="${d.big?3.4:2.6}" fill="${INK}"/><ellipse cx="37.5" cy="26.6" rx="${d.big?2.9:2}" ry="${d.big?3.4:2.6}" fill="${INK}"/><circle cx="27.4" cy="25.6" r=".8" fill="#fff"/><circle cx="38.4" cy="25.6" r=".8" fill="#fff"/>`;
 const sweat=zone!=='STEADY'&&!down?`<path d="M45 17 q3.2 5 0 8 q-3.2 -3 0 -8Z" fill="#7ff0ff" stroke="${INK}" stroke-width=".6"/>${zone==='LOSING IT'?'<path d="M18 19 q-3.2 5 0 8 q3.2 -3 0 -8Z" fill="#7ff0ff" stroke="#120c1c" stroke-width=".6"/>':''}`:'';
 const hurt=st.hurt&&!down?`<path d="M38 14 l6 8 m-1 -8 l-6 8" stroke="#fff" stroke-width="1.6" opacity=".0"/><rect x="36" y="31" width="7" height="3.4" rx="1.4" fill="#f4efe0" stroke="${INK}" stroke-width=".7" transform="rotate(-20 39.5 32.7)"/>`:'';
 const pale=o.vampire?'':'';
 const fx=st.state==='RAN'?'opacity=".35"':'';
 const head=`<rect x="19" y="12" width="26" height="28" rx="11" fill="${d.skin}" stroke="${INK}" stroke-width="1.6"/><rect x="29.4" y="38" width="5.2" height="6" fill="${d.skin}"/>`;
 const hairBehind=d.hair;
 const torso=`<path d="M${32-19*sc} 64 Q${32-19*sc} 44 32 42 Q${32+19*sc} 44 ${32+19*sc} 64Z" fill="${body}" stroke="${INK}" stroke-width="1.6"/><path d="M26 42 L32 50 L38 42" fill="${d.skin}" stroke="${INK}" stroke-width="1.2"/><path d="M${32-19*sc} 64 Q${32-19*sc} 50 ${32-13*sc} 47 L${32-9*sc} 64Z" fill="${bd}" opacity=".45"/>`;
 return `<svg class="face" viewBox="0 0 64 64" shape-rendering="geometricPrecision" ${fx} aria-hidden="true"><g transform="translate(0 ${dy})">${torso}${head}${hairBehind}${d.brows||''}${eyes}${d.mouth(down?'STEADY':zone)}${sweat}${hurt}${d.acc||''}</g></svg>`;
}

// ------------------------------------------------------------------------------------------------------------------------- cars (top-down)
const CAR_LOOK={
 HOOPTIE:{body:'#b79a63',roof:'#9a7f4e',trim:'#6b5a33',len:198,note:'a dent in every panel'},
 S2000:{body:'#e0284a',roof:'#b01a38',trim:'#5a0c1c',len:150,note:'two seats, no promises'},
 SUPRA:{body:'#ff8a1c',roof:'#d96f0a',trim:'#7a3a05',len:200,note:'clean lines, loud pipes'},
 URUS:{body:'#1e1a2e',roof:'#0f0c1a',trim:'#6a5acd',len:226,note:'a house on wheels'}
};
export const CAR_SEAT_POS={ // percent of the car box (x,y); front is up
 HOOPTIE:{DRIVER:[30,36],SHOTGUN:[70,36],BACK_L:[30,70],BACK_R:[70,70]},
 SUPRA:{DRIVER:[30,36],SHOTGUN:[70,36],BACK_L:[30,70],BACK_R:[70,70]},
 S2000:{DRIVER:[30,52],SHOTGUN:[70,52]},
 URUS:{DRIVER:[28,34],SHOTGUN:[72,34],BACK_L:[24,71],BACK_M:[50,71],BACK_R:[76,71]},
 CASTLE:{DOOR:[50,15],HALL_L:[21,46],HALL_R:[79,46],INNER:[50,80]}
};
export function carSVG(id){
 if(id==='CASTLE')return `<svg class="carsvg" viewBox="0 0 120 200" preserveAspectRatio="none" aria-hidden="true">
  <rect x="8" y="6" width="104" height="188" rx="6" fill="#241a3a" stroke="#b07ae8" stroke-width="3"/>
  <rect x="44" y="0" width="32" height="12" fill="#e8c14a" stroke="${INK}" stroke-width="2"/>
  <path d="M8 96 H44 M76 96 H112 M60 96 V194" stroke="#3a2a5a" stroke-width="4"/>
  <path d="M8 30 h10 v-8 h10 v8 h10 v-8 h10 v8 M112 30 h-10 v-8 h-10 v8 h-10 v-8 h-10 v8" stroke="#b07ae8" stroke-width="2" fill="none"/>
  <path d="M8 150 H112" stroke="#3a2a5a" stroke-width="2" stroke-dasharray="6 6"/></svg>`;
 const c=CAR_LOOK[id]||CAR_LOOK.HOOPTIE;const L=c.len;const top=(200-L)/2;
 return `<svg class="carsvg" viewBox="0 0 120 200" aria-hidden="true">
  <rect x="6" y="${top+22}" width="12" height="26" rx="4" fill="#0b0b12"/><rect x="102" y="${top+22}" width="12" height="26" rx="4" fill="#0b0b12"/>
  <rect x="6" y="${top+L-56}" width="12" height="26" rx="4" fill="#0b0b12"/><rect x="102" y="${top+L-56}" width="12" height="26" rx="4" fill="#0b0b12"/>
  <rect x="12" y="${top}" width="96" height="${L}" rx="24" fill="${c.body}" stroke="${INK}" stroke-width="3"/>
  <rect x="20" y="${top+10}" width="80" height="${L*0.16}" rx="10" fill="#37d5e8" opacity=".85" stroke="${INK}" stroke-width="2"/>
  <rect x="20" y="${top+L*0.24}" width="80" height="${L*0.5}" rx="10" fill="${c.roof}" stroke="${INK}" stroke-width="2"/>
  <rect x="24" y="${top+L-30}" width="72" height="16" rx="7" fill="#37d5e8" opacity=".55" stroke="${INK}" stroke-width="2"/>
  <rect x="16" y="${top+2}" width="20" height="7" rx="3.5" fill="#fff7c2"/><rect x="84" y="${top+2}" width="20" height="7" rx="3.5" fill="#fff7c2"/>
  <rect x="18" y="${top+L-9}" width="16" height="5" rx="2" fill="#ff3b4d"/><rect x="86" y="${top+L-9}" width="16" height="5" rx="2" fill="#ff3b4d"/>
  ${id==='URUS'?`<rect x="14" y="${top+L*0.24}" width="4" height="${L*0.5}" fill="${c.trim}"/><rect x="102" y="${top+L*0.24}" width="4" height="${L*0.5}" fill="${c.trim}"/>`:''}
  ${id==='HOOPTIE'?`<circle cx="34" cy="${top+L*0.55}" r="5" fill="#8a3a1a" opacity=".7"/><rect x="70" y="${top+L*0.3}" width="14" height="5" fill="#8a3a1a" opacity=".6"/>`:''}
 </svg>`;
}
export const carNote=id=>(CAR_LOOK[id]||{}).note||'';
export const carBodyColor=id=>(CAR_LOOK[id]||{}).body||'#b79a63';

// ------------------------------------------------------------------------------------------------------------------------- loot
const CAT_ICON={
 CASH:`<rect x="8" y="16" width="32" height="18" rx="2.4" fill="#5bc36a" stroke="${INK}" stroke-width="2"/><circle cx="24" cy="25" r="5.4" fill="#c6f0c0" stroke="${INK}" stroke-width="1.6"/><path d="M24 21 v8 M22 23 q2 -1.6 4 0 M22 27 q2 1.6 4 0" stroke="${INK}" stroke-width="1.2" fill="none"/>`,
 GUN:`<path d="M8 20 H34 L38 24 H42 V29 H30 L28 36 H21 L22 29 H8Z" fill="#9aa0b8" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><rect x="12" y="22" width="14" height="2" fill="#cfd3e6"/>`,
 MOD:`<circle cx="24" cy="24" r="10" fill="#c8ccdf" stroke="${INK}" stroke-width="2"/><circle cx="24" cy="24" r="4" fill="#37d5e8" stroke="${INK}" stroke-width="1.6"/><path d="M24 8 v6 M24 34 v6 M8 24 h6 M34 24 h6" stroke="${INK}" stroke-width="3"/>`,
 BLOOD_X:`<path d="M24 8 Q34 22 34 28 A10 10 0 0 1 14 28 Q14 22 24 8Z" fill="#e0284a" stroke="${INK}" stroke-width="2"/><path d="M19 27 q0 4 4 5" stroke="#ffb0bd" stroke-width="2" fill="none" stroke-linecap="round"/>`,
 RECRUIT:`<circle cx="24" cy="18" r="7" fill="#f0c9a0" stroke="${INK}" stroke-width="2"/><path d="M10 40 Q10 28 24 28 Q38 28 38 40Z" fill="#b07ae8" stroke="${INK}" stroke-width="2"/><path d="M36 10 v8 M32 14 h8" stroke="#5bc36a" stroke-width="3" stroke-linecap="round"/>`,
 STORY:`<path d="M24 7 L28.6 18 L40 19 L31.4 26.6 L34 38 L24 32 L14 38 L16.6 26.6 L8 19 L19.4 18Z" fill="#e8c14a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
 DISTRICT:`<path d="M24 8 A11 11 0 0 1 35 19 C35 27 24 40 24 40 C24 40 13 27 13 19 A11 11 0 0 1 24 8Z" fill="#ff3d8b" stroke="${INK}" stroke-width="2"/><circle cx="24" cy="19" r="4" fill="#fff"/>`,
 WEIRD:`<path d="M6 24 Q24 6 42 24 Q24 42 6 24Z" fill="#f3efe0" stroke="${INK}" stroke-width="2"/><circle cx="24" cy="24" r="7" fill="#b07ae8" stroke="${INK}" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="${INK}"/>`,
 KICK:`<path d="M24 6 L27 18 L40 20 L30 28 L33 41 L24 34 L15 41 L18 28 L8 20 L21 18Z" fill="#ffe27a" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
};
const RAR_COL={COMMON:['#cfd3e6','#7a7f94'],RARE:['#37d5e8','#127a88'],LEGENDARY:['#ffd23f','#a86a08']};
export function crate(c,size=64){
 const r=c.rar||'COMMON';const [a,b]=RAR_COL[r];const ic=CAT_ICON[c.cat]||CAT_ICON.WEIRD;
 return `<svg class="crate crate-${r.toLowerCase()}" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><rect x="3" y="9" width="42" height="34" rx="4" fill="${b}" stroke="${INK}" stroke-width="2"/><rect x="3" y="9" width="42" height="10" rx="4" fill="${a}" stroke="${INK}" stroke-width="2"/><g transform="translate(9 14) scale(.62)">${ic}</g></svg>`;
}
export const lootIcon=(cat,size=28)=>`<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">${CAT_ICON[cat]||CAT_ICON.WEIRD}</svg>`;
export const gunIcon=(size=22)=>`<svg width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">${CAT_ICON.GUN}</svg>`;
export const RARITY=RAR_COL;
