(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — map format + NEUTRAL sandbox maps. No story content, no frozen art: the sandbox draws a procedural
 // placeholder backdrop. A real location supplies  env:{art:'<RAArtRegistry key>'}  and keeps its art frozen underneath the overlay.
 //
 // ASCII rows (9 rows of 6 chars, y=0 is the far end):
 //   .  floor        h  elevated floor (fire escape / roof: +15 aim, ignores HALF cover)      x  extraction zone floor
 //   L  low wall      HALF        C  car hood   HALF destructible       D  dumpster   HALF destructible
 //   P  pillar        FULL        V  van        FULL                    B  brick corner FULL
 const LEGEND={L:{level:'HALF',kind:'LOW_WALL'},C:{level:'HALF',kind:'CAR_HOOD',destructible:true},D:{level:'HALF',kind:'DUMPSTER',destructible:true},
  P:{level:'FULL',kind:'PILLAR'},V:{level:'FULL',kind:'VAN'},B:{level:'FULL',kind:'BRICK_CORNER'}};
 function parse(spec){
  const rows=spec.rows;if(rows.length!==9||rows.some(r=>r.length!==6))throw new Error(`map ${spec.id}: needs 9 rows of 6`);
  const elev={},props=[],extraction=[];
  rows.forEach((row,y)=>[...row].forEach((ch,x)=>{
   if(ch==='h')elev[x+','+y]=1;
   else if(ch==='x')extraction.push([x,y]);
   else if(LEGEND[ch])props.push({x,y,...LEGEND[ch]});
   else if(ch!=='.')throw new Error(`map ${spec.id}: unknown tile '${ch}'`);
  }));
  return {id:spec.id,name:spec.name,theme:spec.theme,cols:6,rows:9,elev,props,extraction,deploy:spec.deploy,richEntry:spec.richEntry,slots:spec.slots||[],captive:spec.captive||null,env:spec.env||{}};
 }
 const SPECS={
  alley:{id:'alley',name:'SANDBOX ALLEY',theme:'ALLEY',
   rows:['hh....',
         'h..B..',
         '..C..L',
         '.L....',
         '...V..',
         '.D..C.',
         '......',
         '..L..P',
         'xxxxxx'],
   deploy:[[1,7],[3,7],[4,7],[0,7],[2,8],[4,8]],richEntry:[[5,8],[0,8],[3,8]],
   slots:[{x:2,y:1,pod:'p1'},{x:4,y:1,pod:'p1'},{x:0,y:1,pod:'p2'},{x:1,y:0,pod:'p2'},{x:3,y:0,pod:'p1'},{x:5,y:1,pod:'p2'}]},
  dock:{id:'dock',name:'SANDBOX DOCK',theme:'DOCK',
   rows:['..P...',
         '.D..D.',
         '..C...',
         'hh..L.',
         'h.V...',
         '..D.C.',
         '.L....',
         '....B.',
         'xxxxxx'],
   deploy:[[0,7],[2,7],[3,7],[1,7],[5,7],[5,8]],richEntry:[[5,8],[0,8],[3,8]],
   slots:[{x:3,y:1,pod:'p1'},{x:5,y:1,pod:'p1'},{x:4,y:0,pod:'p1'},{x:1,y:0,pod:'p2'},{x:2,y:1,pod:'p2'},{x:0,y:1,pod:'p2'}],
   captive:{x:0,y:0,name:'CAPTIVE'}},
  yard:{id:'yard',name:'SANDBOX YARD',theme:'YARD',
   rows:['......',
         '.P..P.',
         '......',
         '..C...',
         '.L..L.',
         '......',
         '.D..V.',
         '......',
         'xxxxxx'],
   deploy:[[1,7],[3,7],[4,7],[2,7],[0,7],[5,7]],richEntry:[[5,8],[0,8],[3,8]],
   slots:[{x:2,y:0,pod:'p1'},{x:3,y:0,pod:'p1'},{x:0,y:1,pod:'p2'},{x:5,y:1,pod:'p2'},{x:1,y:0,pod:'p2'},{x:4,y:0,pod:'p1'}]}
 };
 const cache={};
 function get(id){if(!SPECS[id])return null;return cache[id]||(cache[id]=parse(SPECS[id]));}
 const list=()=>Object.keys(SPECS).map(get);
 // NEUTRAL sandbox missions (placeholder identities only)
 const SANDBOX_MISSIONS=[
  {id:'skirmish',label:'ALLEY SKIRMISH',blurb:'Learn the field. Clear the alley.',map:'alley',jobType:'TAKE_THE_BLOCK',objective:{kind:'ELIMINATE'},enemies:['CHEWER','CHEWER','ENFORCER','CHEWER']},
  {id:'extract',label:'DOCK EXTRACT',blurb:'Reach the captive, carry them to the zone.',map:'dock',jobType:'EXTRACT',objective:{kind:'EXTRACT_TARGET'},enemies:['CHEWER','CHEWER','LIEUTENANT','CHEWER'],loadout:{WHEELS:'rpg'}},
  {id:'boss',label:'BOSS TEST',blurb:'LIL SMACK holds the yard. He flees at 4 HP.',map:'yard',jobType:'TAKE_THE_BLOCK',objective:{kind:'ELIMINATE'},enemies:['LIL_SMACK','LIEUTENANT','CHEWER','CHEWER','HUNTER'],loadout:{}},
  {id:'emergency',label:'EMERGENCY (4 TURNS)',blurb:'A run went bad. Survive four turns.',map:'alley',jobType:'EMERGENCY',objective:{kind:'ELIMINATE'},turnLimit:4,revealedPods:['p1','p2'],enemies:['CHEWER','CHEWER','ENFORCER']}
 ];
 root.RAShowdownMaps={parse,get,list,SPECS,LEGEND,SANDBOX_MISSIONS};
})(typeof window!=='undefined'?window:globalThis);
