(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — NEUTRAL sandbox sprites, generated procedurally (16x16, nearest-neighbour). These are placeholders for
 // judging tactical feel: they are NOT canon character or environment art and are never registered as frozen assets. Real
 // art arrives through the Art Registry; this file is the only thing that paints pixels.
 const cache=new Map();
 const cv=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const url=(key,w,h,fn)=>{
  if(cache.has(key))return cache.get(key);
  let out='';try{const c=cv(w,h),x=c.getContext('2d');x.imageSmoothingEnabled=false;fn(x);out=c.toDataURL('image/png');}catch(e){out='';}
  cache.set(key,out);return out;
 };
 const K='#080a14';
 const rect=(x,c,a,b,w,h,col)=>{x.fillStyle=col;x.fillRect(a,b,w,h);};
 // template rows -> pixels. Palette maps a char to a colour.
 function paint(x,rows,pal,ox,oy){
  rows.forEach((row,y)=>{for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='.')continue;const col=pal[ch];if(!col)continue;x.fillStyle=col;x.fillRect((ox||0)+i,(oy||0)+y,1,1);}});
 }
 const BASE=[
  '................',
  '....kkkkkkkk....',
  '...khhhhhhhhk...',
  '...khhhhhhhhk...',
  '...kssssssssk...',
  '...kseessseek...',
  '...kssssssssk...',
  '....kssssssk....',
  '..kkbbbbbbbbkk..',
  '.ksbbbbbbbbbbsk.',
  '.ksbbbbbbbbbbsk.',
  '..kbbbbddbbbbk..',
  '...kbbbddbbbk...',
  '....kppkkppk....',
  '....kppk..kppk..',
  '....kkkk..kkkk..'
 ];
 // per-role overlays (painted on top of BASE). Each is a row template at (0,0); '.' = keep base pixel.
 const OVER={
  MUSCLE :['................','................','................','.....rrrrrr.....','................','................','................','................','.kkkbbbbbbbbkkk.','kssssbbbbbbbbsssk','kssssbbbbbbbbsssk','.kkkbbbbddbbkkk.','................','................','................','................'],
  SHOOTER:['................','................','....kkkkkkkk....','................','................','................','................','................','................','..........gk....','.........gk.....','........gk......','.......kk.......','................','................','................'],
  WHEELS :['................','................','....cccccccc....','...cccccccccck..','................','................','................','................','................','................','.....kkkkkk.....','....k......k....','.....kkkkkk.....','................','................','................'],
  TALKER :['................','................','.............www','...cc........wkw.','..c..c.......www','...cc...........','.....c..........','................','................','................','................','................','................','................','................','................'],
  GHOST  :['................','....hhhhhhhh....','...hhhhhhhhhh...','...hhhhhhhhhh...','...hkkkkkkkkh...','...hkwkkkkwkh...','...hkkkkkkkkh...','....hkkkkkkh....','................','................','................','................','................','................','................','................'],
  DOC    :['................','................','................','................','................','................','................','................','................','.......ww.......','......wwww......','.......ww....rr.','..............rr','................','................','................']
 };
 const FOE_OVER={
  CHEWER    :['................','................','................','................','................','.....kkkkkk.....','....krgrrgrk....','.....krrrrk.....','................','.....gg..gg.....','................','................','................','................','................','................'],
  ENFORCER  :['................','................','................','................','................','.....kkkkkk.....','....krgrrgrk....','.....krrrrk.....','.kkkbbbbbbbbkkk.','kssssbbbbbbbbssk.','kssssbbbbbbbbsssk','.kkkbbbbddbbkkk.','.....wwwwwwwwww.','................','................','................'],
  HUNTER    :['................','................','................','................','................','................','................','................','................','.k.....kk.....k.','.kkkkkkkkkkkkkk.','.k.....kk.....k.','.......kk.......','................','................','................'],
  LIEUTENANT:['................','................','................','................','................','.....kkkkkk.....','....krgrrgrk....','.....krrrrk.....','..ffffffffffff..','.fffbbbbbbbbfff.','................','................','................','................','................','................'],
  LIL_SMACK :['................','................','...gg......gg...','................','................','....kkkkkkkk....','...krgrrrrgrk...','...krrrrrrrrk...','.gggggggggggggg.','................','................','................','................','................','................','................']
 };
 function pal(o){
  return {k:K,h:o.hair,s:o.skin,e:'#0b0d18',b:o.body,B:o.bodyLite,d:o.bodyDark,p:o.pants,g:'#e8c14a',w:'#f3efe0',r:'#d7193f',c:'#37d5e8',f:'#9ee07a'};
 }
 function unitSprite(o){
  const key=`u:${o.key}`;
  return url(key,16,16,x=>{
   const p=pal(o);paint(x,BASE,p);
   const ov=o.over;if(ov)paint(x,ov,p);
   if(o.boss){x.fillStyle='#e8c14a';x.fillRect(0,0,16,1);x.fillRect(0,15,16,1);}
  });
 }
 const CLASS_LOOK={
  MUSCLE :{body:'#c8502e',bodyLite:'#e0603a',bodyDark:'#7d2d18',hair:'#1a1a22',skin:'#b98863',pants:'#2b2f45'},
  SHOOTER:{body:'#b89a34',bodyLite:'#e8c14a',bodyDark:'#6b5a1e',hair:'#2a2214',skin:'#c6935f',pants:'#2a2a3a'},
  WHEELS :{body:'#2aa3b3',bodyLite:'#3fd0e0',bodyDark:'#175a66',hair:'#1a1a22',skin:'#a97650',pants:'#22304a'},
  TALKER :{body:'#8b5fc4',bodyLite:'#b07ae8',bodyDark:'#4b3272',hair:'#2b1d3a',skin:'#c99a72',pants:'#25243f'},
  GHOST  :{body:'#5b66d0',bodyLite:'#7f8cff',bodyDark:'#2c336e',hair:'#3a3f8a',skin:'#a97650',pants:'#1c2038'},
  DOC    :{body:'#3fb56a',bodyLite:'#5fe08a',bodyDark:'#1f6a3a',hair:'#3a2a20',skin:'#c99a72',pants:'#23364a'}
 };
 const FOE_LOOK={
  CHEWER    :{body:'#2f8a44',bodyLite:'#5bc36a',bodyDark:'#175028',hair:'#2a1c10',skin:'#b98863',pants:'#204a30'},
  ENFORCER  :{body:'#26703a',bodyLite:'#4aa85a',bodyDark:'#124020',hair:'#111',skin:'#a97650',pants:'#183a26'},
  HUNTER    :{body:'#4a4f5c',bodyLite:'#7a8092',bodyDark:'#262932',hair:'#2a2a2a',skin:'#d0a17e',pants:'#20242c'},
  LIEUTENANT:{body:'#2f8a44',bodyLite:'#5bc36a',bodyDark:'#175028',hair:'#222',skin:'#b98863',pants:'#204a30'},
  LIL_SMACK :{body:'#37a04c',bodyLite:'#6fdc7e',bodyDark:'#1a5a2a',hair:'#3a2a0c',skin:'#c6935f',pants:'#204a30'}
 };
 function unit(u){
  if(u.kind==='RICH')return url('u:rich',16,16,x=>{const p=pal({hair:'#0e0e16',skin:'#7a5638',body:'#14141e',bodyLite:'#22222e',bodyDark:'#0a0a12',pants:'#0e0e16'});paint(x,BASE,p);
   paint(x,['................','................','................','................','...kkkkkkkkkk...','...kcckkkkcck...','................','................','................','.....r..........','................','................','................','................','................','................'],p);x.fillStyle='#d7193f';x.fillRect(3,9,1,1);x.fillRect(12,9,1,1);});
  if(u.kind==='CAPTIVE')return url('u:captive',16,16,x=>{const p=pal({hair:'#3a3a44',skin:'#b6a596',body:'#6a6d78',bodyLite:'#8a8d98',bodyDark:'#3a3c46',pants:'#3a3c46'});paint(x,BASE,p);x.fillStyle='#f3efe0';x.fillRect(3,9,10,1);x.fillRect(7,8,2,4);});
  if(u.kind==='ENEMY'){const l=FOE_LOOK[u.type]||FOE_LOOK.CHEWER;return unitSprite({...l,key:'e:'+u.type,over:FOE_OVER[u.type],boss:u.boss});}
  const l=CLASS_LOOK[u.cls]||CLASS_LOOK.MUSCLE;return unitSprite({...l,key:'o:'+u.cls,over:OVER[u.cls]});
 }
 // ---- props (16x16) ----
 function brick(x,a,b,w,h,c1,c2){x.fillStyle=c1;x.fillRect(a,b,w,h);x.fillStyle=c2;for(let y=b;y<b+h;y+=3){x.fillRect(a,y,w,1);const off=((y-b)/3)%2?2:0;for(let i=a+off;i<a+w;i+=5)x.fillRect(i,y,1,3);}}
 const PROPS={
  LOW_WALL   :x=>{brick(x,1,8,14,7,'#7c3f3a','#3d1e1c');x.fillStyle='#a8605a';x.fillRect(1,8,14,1);x.fillStyle=K;x.fillRect(1,15,14,1);},
  CAR_HOOD   :x=>{x.fillStyle=K;x.fillRect(1,7,14,8);x.fillStyle='#2aa3b3';x.fillRect(2,8,12,6);x.fillStyle='#3fd0e0';x.fillRect(2,8,12,1);x.fillStyle='#175a66';x.fillRect(2,12,12,2);x.fillStyle='#f3efe0';x.fillRect(3,10,2,2);x.fillRect(11,10,2,2);x.fillStyle=K;x.fillRect(3,14,3,2);x.fillRect(10,14,3,2);},
  DUMPSTER   :x=>{x.fillStyle=K;x.fillRect(1,6,14,9);x.fillStyle='#2f8a44';x.fillRect(2,7,12,7);x.fillStyle='#5bc36a';x.fillRect(2,7,12,2);x.fillStyle='#175028';x.fillRect(2,12,12,2);x.fillStyle=K;x.fillRect(2,9,12,1);x.fillStyle='#e8c14a';x.fillRect(6,10,4,1);},
  PILLAR     :x=>{x.fillStyle=K;x.fillRect(4,0,8,16);x.fillStyle='#8a8fa6';x.fillRect(5,1,6,14);x.fillStyle='#b9bdd0';x.fillRect(5,1,2,14);x.fillStyle='#5a5f76';x.fillRect(9,1,2,14);x.fillStyle='#d9dcea';x.fillRect(4,0,8,1);x.fillStyle=K;x.fillRect(3,14,10,2);},
  VAN        :x=>{x.fillStyle=K;x.fillRect(1,2,14,13);x.fillStyle='#d9dcea';x.fillRect(2,3,12,11);x.fillStyle='#f3efe0';x.fillRect(2,3,12,2);x.fillStyle='#9aa0b8';x.fillRect(2,11,12,3);x.fillStyle='#37d5e8';x.fillRect(3,6,10,3);x.fillStyle='#1e6a78';x.fillRect(3,8,10,1);x.fillStyle=K;x.fillRect(3,14,3,2);x.fillRect(10,14,3,2);},
  BRICK_CORNER:x=>{x.fillStyle=K;x.fillRect(0,0,16,16);brick(x,1,1,14,14,'#8e4a40','#3d1e1c');x.fillStyle='#b9685c';x.fillRect(1,1,14,1);},
  CAR        :x=>{x.fillStyle=K;x.fillRect(1,3,14,12);x.fillStyle='#15151f';x.fillRect(2,4,12,10);x.fillStyle='#2b2f45';x.fillRect(3,5,10,3);x.fillStyle='#37d5e8';x.fillRect(4,6,8,1);x.fillStyle='#e8f8ff';x.fillRect(3,12,3,2);x.fillRect(10,12,3,2);x.fillStyle='#d7193f';x.fillRect(6,9,4,1);},
  RUBBLE     :x=>{x.fillStyle='#3a3f56';[[3,11,4,3],[8,12,5,2],[6,9,3,3],[10,10,3,2]].forEach(r=>x.fillRect(...r));x.fillStyle='#5a5f76';x.fillRect(4,11,2,1);x.fillRect(9,12,2,1);}
 };
 const prop=kind=>url('p:'+kind,16,16,PROPS[kind]||PROPS.LOW_WALL);
 // ---- ground ----
 const h2=(a,b)=>{let n=(a*374761393+b*668265263)|0;n=(n^(n>>>13))*1274126177|0;return ((n^(n>>>16))>>>0)/4294967296;};
 function ground(kind,seed){
  return url(`g:${kind}:${seed}`,16,16,x=>{
   const base=kind==='ELEV'?'#232a40':kind==='EXIT'?'#16202e':'#121828';
   x.fillStyle=base;x.fillRect(0,0,16,16);
   for(let j=0;j<16;j++)for(let i=0;i<16;i++){const r=h2(i+seed*17,j+seed*31);if(r>.93){x.fillStyle=kind==='ELEV'?'#2e3752':'#1a2236';x.fillRect(i,j,1,1);}else if(r<.03){x.fillStyle='#0b0f1c';x.fillRect(i,j,1,1);}}
   if(kind==='ELEV'){x.fillStyle='#39456a';for(let i=0;i<16;i+=4){x.fillRect(i,0,1,16);x.fillRect(0,i,16,1);}x.fillStyle='#37d5e8';x.fillRect(0,15,16,1);x.fillRect(0,0,16,1);}
   else if(kind==='EXIT'){x.fillStyle='#e8c14a';for(let i=-16;i<16;i+=8)for(let k=0;k<16;k++){const px=i+k;if(px>=0&&px<16){x.fillRect(px,k,2,1);}}x.fillStyle='rgba(22,32,46,.55)';x.fillRect(0,0,16,16);x.fillStyle='#37d5e8';x.fillRect(0,0,16,1);}
   else if(seed%3===0){x.fillStyle='rgba(55,213,232,.16)';x.fillRect(3,9,9,3);x.fillStyle='rgba(120,240,255,.28)';x.fillRect(5,10,4,1);}
   else if(seed%3===1){x.fillStyle='rgba(215,25,63,.10)';x.fillRect(6,3,6,2);}
  });
 }
 // ---- icons (7x7, 1-bit) ----
 const ICONS={
  MOVE     :['..#....','..##...','#####..','.####..','..##...','..#....','.......'],
  SHOOT    :['..###..','.#.#.#.','#..#..#','###.###','#..#..#','.#.#.#.','..###..'],
  OVERWATCH:['.#####.','#..#..#','#.###.#','#..#..#','.#####.','.......','.......'],
  HUNKER   :['#######','#.....#','#.....#','#.....#','.#...#.','..#.#..','...#...'],
  ABILITY  :['...#...','...#...','#######','.#####.','..###..','.##.##.','.#...#.'],
  CARRY    :['.##.##.','.#####.','..###..','#######','#.###.#','#.###.#','..#.#..'],
  RELOAD   :['.####..','#....#.','#...###','#....#.','#......','.####..','.......'],
  ITEM     :['..###..','.#...#.','#######','#.....#','#.###.#','#.....#','#######'],
  HALF     :['#######','#######','#######','#.....#','.#...#.','..#.#..','...#...'],
  FULL     :['#######','#######','#######','#######','.#####.','..###..','...#...'],
  FLANK    :['#.....#','.#...#.','..#.#..','...#...','..#.#..','.#...#.','#.....#'],
  EYE      :['.......','..###..','.#.#.#.','#.###.#','.#.#.#.','..###..','.......']
 };
 function icon(name,color){
  const rows=ICONS[name]||ICONS.ITEM;color=color||'#f6efd9';
  return url(`i:${name}:${color}`,7,7,x=>{x.fillStyle=color;rows.forEach((r,y)=>{for(let i=0;i<7;i++)if(r[i]==='#')x.fillRect(i,y,1,1);});});
 }
 root.RAShowdownSprites={unit,prop,ground,icon,CLASS_LOOK,ICONS,PROPS:Object.keys(PROPS)};
})(typeof window!=='undefined'?window:globalThis);
