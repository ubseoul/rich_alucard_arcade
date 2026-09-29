(function(root){
 'use strict';
 // F01 SHOWDOWN_CORE — authored data. Source: Rich Alucard: Before the Fame, VOL 7 — PLAYMAKERS: BLOOD X OPERATIONS (OPEN)
 // §5 SHOWDOWNS, §6 THE OGAS.  Every AUTHORED number lives in the frozen blocks below (HIT, CLASSES, ENEMIES, WEAPONS, RICH,
 // TRAITS, STORIES, BOND).  Everything the source does not state lives in TUNABLES and is listed in PROVISIONAL so it can
 // never be mistaken for canon.  SOURCE_REQUIRED lists mechanics that are NOT OPEN-authorised and are refused, not invented.
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))freeze(v);}return o;};

 // ---- §5.1 the field ----
 const GRID={cols:6,rows:9};
 // ---- §5.2 turns and actions ----
 const ACTIONS_PER_TURN=2;
 const ACTIONS=['MOVE','DASH','SHOOT','OVERWATCH','HUNKER','ABILITY','CARRY','RELOAD','ITEM'];
 // ---- §5.3 the math (AUTHORED) ----
 const HIT={halfCover:-20,fullCover:-40,flankedCrit:30,height:15,overwatch:-15,closeBonus:15,closeRange:2,
  pistolLongPenaltyPerTile:10,pistolLongFrom:5,hunkered:-20,critBase:10,critMult:1.5};
 // ---- §5.4 units (AUTHORED) ----
 const CLASSES={
  MUSCLE :{hp:9,aim:60,mobility:5,ability:'SHOULDER_CHECK',abilityLabel:'SHOULDER CHECK',color:'#e0603a',glyph:'M',text:'Move into an adjacent enemy: 3 damage, knocks them out of cover.'},
  SHOOTER:{hp:6,aim:78,mobility:5,ability:'DEAD_EYE',abilityLabel:'DEAD EYE',color:'#e8c14a',glyph:'S',text:'One shot at -10 aim, +3 damage.'},
  WHEELS :{hp:6,aim:62,mobility:7,ability:'THE_CAR',abilityLabel:'THE CAR',color:'#3fd0e0',glyph:'W',text:'Once per showdown: pull the car on as FULL cover, or ram for 5 damage.'},
  TALKER :{hp:6,aim:58,mobility:5,ability:'TALK_HIM_DOWN',abilityLabel:'TALK HIM DOWN',color:'#b07ae8',glyph:'T',text:'60% chance an enemy under 50% HP surrenders (counts as removed).'},
  GHOST  :{hp:5,aim:70,mobility:6,ability:'VANISH',abilityLabel:'VANISH',color:'#7f8cff',glyph:'G',text:'Concealed for 1 turn. First shot from concealment +20 aim.'},
  DOC    :{hp:6,aim:60,mobility:5,ability:'PATCH_UP',abilityLabel:'PATCH UP',color:'#5fe08a',glyph:'D',text:'Heal 4, or stabilize a downed Oga (saves them).'}
 };
 const ABILITY_NUMBERS={shoulderCheckDamage:3,deadEyeAim:-10,deadEyeDamage:3,carRamDamage:5,talkChance:60,talkHpFraction:.5,vanishFirstShotAim:20,patchHeal:4};
 const ENEMIES={
  CHEWER    :{hp:5 ,aim:60,label:'CHEWER'    ,faction:'open_mouth_gang',weapon:'pistol'         ,text:'Loud. Always flanks if possible.'},
  ENFORCER  :{hp:9 ,aim:55,label:'ENFORCER'  ,faction:'open_mouth_gang',weapon:'enemy_shotgun'  ,text:'Shotgun; charges; shrugs off half cover.'},
  HUNTER    :{hp:6 ,aim:70,label:'HUNTER'    ,faction:'hunters'        ,weapon:'silver_crossbow',text:'Silver bolts: +2 damage vs vampires; ignores VANISH.',human:true},
  LIEUTENANT:{hp:10,aim:68,label:'LIEUTENANT',faction:'open_mouth_gang',weapon:'pistol'         ,text:'Gives adjacent allies +10 aim; priority target.'},
  LIL_SMACK :{hp:14,aim:65,label:'LIL SMACK' ,faction:'open_mouth_gang',weapon:'enemy_shotgun'  ,text:'CHEW (adjacent allies disgusted: -10 aim); flees at 4 HP instead of dying; he always comes back.',boss:true}
 };
 const ENEMY_NUMBERS={lieutenantAura:10,chewAim:-10,smackFleeHp:4,silverBoltVsVampire:2};
 // ---- §5.5 weapons (AUTHORED: damage / range band / notes.  clip = PROVISIONAL, see TUNABLES) ----
 const WEAPONS={
  pistol          :{id:'pistol'          ,label:'PISTOL'          ,dmg:[2,3],band:'medium',longPenalty:true ,clip:4,src:'vol7',note:'Reliable'},
  lil_oga         :{id:'lil_oga'         ,label:'LIL OGA'         ,dmg:[3,3],band:'medium',longPenalty:true ,clip:4,src:'vol7',owNeverMiss:true,note:'Never misses on overwatch'},
  sapporo_shotgun :{id:'sapporo_shotgun' ,label:'SAPPORO SHOTGUN' ,dmg:[4,6],band:'close' ,closeBonus:true  ,clip:2,src:'vol7',note:'+15 aim adjacent'},
  chopstick_sniper:{id:'chopstick_sniper',label:'CHOPSTICK SNIPER',dmg:[4,6],band:'long'  ,noMoveShoot:true  ,clip:2,src:'vol7',note:"Can't fire after moving"},
  holy_baby_drake :{id:'holy_baby_drake' ,label:'HOLY BABY DRAKE' ,dmg:[4,5],band:'medium',vsUndead:2,healSelf:1,clip:3,src:'vol7',note:"x2 vs hunters' undead allies; heals the user 1"},
  rpg             :{id:'rpg'             ,label:'THE RPG'         ,dmg:[5,5],band:'long'  ,area:'3x3',destroysCover:true,perShowdown:1,clip:1,heat:10,src:'vol7',note:'Area 3x3; destroys cover; 1 per showdown; +10 HEAT'},
  legendary_draco :{id:'legendary_draco' ,label:'LEGENDARY DRACO' ,dmg:[4,6],band:'medium',bursts:2,burstAim:-10,clip:4,src:'vol7',note:'"Two taps": shoots twice as one action at -10 aim each'},
  // enemy weapons the source implies but does not statistic (PROVISIONAL, reuse authored profiles)
  enemy_shotgun   :{id:'enemy_shotgun'   ,label:'SHOTGUN'         ,dmg:[4,6],band:'close' ,closeBonus:true  ,clip:99,src:'provisional',note:'Open Mouth Gang shotguns (F02 ENEMY_GUNS); profile = SAPPORO'},
  silver_crossbow :{id:'silver_crossbow' ,label:'SILVER CROSSBOW' ,dmg:[3,4],band:'medium',silver:2          ,clip:99,src:'provisional',note:'Silver bolts +2 vs vampires; base damage PROVISIONAL'}
 };
 const RANGE_MAX={close:4,medium:7,long:9}; // PROVISIONAL band reach in tiles
 // ---- §5.6 Rich (AUTHORED numbers) ----
 const RICH={id:'rich',name:'RICH',hp:12,pullUpFromTurn:3,heatIfSeen:15,canBeGone:false,
  moves:{BLOOD_BATH:{area:3,damage:4},VAMPIRE_BITE:{damage:4,heal:2},OCTOPUS_BRAIN:{tricksPerShowdown:3},REVENGE:{}}};
 // ---- §5.7 downed ----
 const BLEED_TURNS=3;
 // ---- §6.1 story perks (AUTHORED examples) / §6.2 bond / §6.3 traits (AUTHORED) ----
 const STORIES={
  survived_car_wash :{label:'SURVIVED THE CAR WASH' ,text:'+5 aim when in half cover'},
  carried_tunde     :{label:'CARRIED TUNDE 6 TILES' ,text:'carrying does not slow them'},
  talked_down_hunter:{label:'TALKED DOWN A HUNTER'  ,text:'TALK HIM DOWN works on hunters'},
  saw_95_miss       :{label:'SAW 95% MISS'          ,text:'+5 aim, forever, out of spite'}
 };
 const STORY_ALIASES={survived_the_car_wash:'survived_car_wash',carried_tunde_6_tiles:'carried_tunde',talked_down_a_hunter:'talked_down_hunter',saw_95_percent_miss:'saw_95_miss'};
 const STORY_NUMBERS={carWashAim:5,saw95Aim:5,maxStories:4};
 const BOND={aim:10}; // DAY ONES adjacent: +10 aim each; free move toward a downed partner
 const TRAITS={
  CALM         :{label:'CALM'        ,text:'+10 aim when HUNKERED'},
  ALWAYS_EATING:{label:'ALWAYS EATING',text:'heals 1 per turn if he has not moved'},
  MOUTHPIECE   :{label:'MOUTHPIECE'  ,text:'TALK HIM DOWN +15%'},
  PHONE_OUT    :{label:'PHONE OUT'   ,text:'reveals a hidden enemy once'},
  SMALL        :{label:'SMALL'       ,text:'-10 to be hit'},
  IMPATIENT    :{label:'IMPATIENT'   ,text:"can't use OVERWATCH"},
  DRESSED_TO_KILL:{label:'DRESSED TO KILL',text:'+1 damage while undamaged'},
  CHURCH_SHOES :{label:'CHURCH SHOES',text:'no penalty on stairs/ladders'},
  ROOKIE       :{label:'ROOKIE'      ,text:'-10 aim until his first STORY'},
  BIG_POTENTIAL:{label:'BIG POTENTIAL',text:'STORY perks are doubled'},
  SEEN_IT_ALL  :{label:'SEEN IT ALL' ,text:"can't be panicked (no PANIC mechanic is authored: inert)"},
  SIT_DOWN     :{label:'"SIT DOWN"'  ,text:'a downed ally she reaches is stabilized for free'}
 };
 const TRAIT_NUMBERS={calmAim:10,mouthpieceTalk:15,smallDefense:-10,dressedDamage:1,rookieAim:-10,eatHeal:1};

 // ---- PROVISIONAL (not in the source; smallest deterministic value needed to be playable; owner F13) ----
 const TUNABLES={
  carryMobilityPenalty:2, climbExtraCost:1, sightRange:5, talkRange:5, carRange:5, bloodBathRange:7, revengeRange:9,
  enemyMobility:5, enemyShotsPerTurn:1, richMobility:6, richActions:2, hardTurnCap:40, scopeMinDistance:5,
  chewAffects:'OWN_ALLIES', // 'OWN_ALLIES' = literal reading of "adjacent allies"; 'OGAS' = Ogas next to Smack
  emergencyTurns:4, sniperOverwatchAfterMove:false
 };
 const PROVISIONAL=[
  {id:'RANGE_BANDS'      ,note:'close/medium/long reach 4/7/9 tiles. Source names the bands but gives no distances.'},
  {id:'DISTANCE_METRIC'  ,note:'Chebyshev (8-direction) distance and movement, diagonal cost 1. Source says "tiles".'},
  {id:'WEAPON_CLIPS'     ,note:'Clip sizes / RELOAD refill. Source lists RELOAD but no capacities (RPG "1 per showdown" is authored).'},
  {id:'ENEMY_WEAPONS'    ,note:'Enemy damage: ENFORCER/LIL SMACK use the SAPPORO profile (F02 ENEMY_GUNS says Enforcers carry shotguns); CHEWER/LIEUTENANT use PISTOL; HUNTER crossbow base 3-4 (+2 vs vampires authored).'},
  {id:'ENEMY_MOBILITY'   ,note:'All enemies 5 tiles; enemy activation = up to 2 moves then at most 1 shot.'},
  {id:'ENEMY_AI'         ,note:'AI is the smallest deterministic behaviour (see ai.js). Not canon.'},
  {id:'SIGHT_RANGE'      ,note:'Spotting / POD reveal: LOS within 5 tiles, either side sees first. Revealed pods act on the next enemy phase.'},
  {id:'CLIMB_COST'       ,note:'Changing height costs +1 movement (source: CHURCH SHOES "no penalty on stairs/ladders" implies a penalty exists).'},
  {id:'CARRY_PENALTY'    ,note:'Carrier mobility -2 (min 1). Source: "moving slower"; the CARRIED TUNDE story removes it.'},
  {id:'BLEED_OUT'        ,note:'Bleed counter 3 (authored) ticks at the end of each player phase; at 0 the Oga is TAKEN and resolves CAPTURED (never GONE).'},
  {id:'DEFEAT_RULES'     ,note:'Stabilized/recovered DOWNED Ogas become finalStatus DOWNED. Left behind (enemies still alive at mission end) become CAPTURED.'},
  {id:'HUNKER_SEMANTICS' ,note:'HUNKER = -20 to be hit until the unit next turn; blocks active SHOOT, not OVERWATCH (so CALM +10 has meaning).'},
  {id:'OVERWATCH_RULES'  ,note:'One reaction shot per OVERWATCH, first enemy step seen in LOS+range, ties by unit id. Sniper cannot set OVERWATCH after moving.'},
  {id:'SHOULDER_CHECK'   ,note:'Charge to a tile adjacent to the target (within MOBILITY), 3 auto-hit damage; "out of cover" = target EXPOSED (cover ignored) until the next player phase.'},
  {id:'THE_CAR'          ,note:'Car placed on a free tile within 5 tiles in LOS (FULL cover, destructible) or rams a target within 5 tiles for 5 auto-hit damage.'},
  {id:'TALK_RULES'       ,note:'Range 5 with LOS; works on non-hunters (hunters need the TALKED DOWN A HUNTER story). Bosses are not exempt.'},
  {id:'PATCH_UP_RANGE'   ,note:'Adjacent only.'},
  {id:'CHEW_TARGET'      ,note:'"adjacent allies" read literally: LIL SMACK\'s own adjacent allies get -10 aim. tunables.chewAffects=OGAS flips it.'},
  {id:'ENFORCER_SHRUG'   ,note:'"shrugs off half cover": ENFORCER shots ignore the target\'s HALF cover.'},
  {id:'SMACK_FLEE'       ,note:'Damage that would leave LIL SMACK at <=4 HP makes him flee (removed, HP kept >=1, result flag bossFled) instead of dying.'},
  {id:'AREA_SHAPES'      ,note:'"area 3 tiles" (BLOOD BATH) read as 3x3 like THE RPG; area damage auto-hits, hurts no allies.'},
  {id:'RICH_ON_FIELD'    ,note:'Rich: 2 actions, 6 tiles, each move costs 1 action, moves auto-hit (source gives no aim for them), enters with full actions the turn he arrives.'},
  {id:'REVENGE_RULES'    ,note:'Stores actual damage taken since the last REVENGE and returns exactly that to one visible enemy.'},
  {id:'PULL_UP_ENTRY'    ,note:'Rich enters on a free tile of map.richEntry.'},
  {id:'RICH_DOWN'        ,note:'Rich at 0 HP is knocked down: showdown ends RETREAT (reason RICH_DOWN); he is never GONE.'},
  {id:'TURN_LIMIT'       ,note:'Missions with a turn limit (e.g. emergency 4-turn fights) end RETREAT when it runs out.'},
  {id:'CRIT_ROUNDING'    ,note:'Crit damage = round(damage x 1.5).'},
  {id:'CLOSE_RULE'       ,note:'Shotgun +15 uses the Section 5.3 rule (<=2 tiles); the Section 5.5 note says "adjacent". Section 5.3 wins as the hit model.'},
  {id:'HEAT_SILENCER'    ,note:'SILENCER heatRelief (F02: 2) is reported once per showdown if a silenced Oga fired; the host decides whether to apply it.'},
  {id:'NIGHT_MODIFIERS'  ,note:'Night modifiers are carried through and shown (rain overlay); no tactical numbers are applied to them.'}
 ];
 const SOURCE_REQUIRED=[
  {id:'OCTOPUS_BRAIN_TRICKS',note:'"one of three context tricks per showdown" - the three tricks are not OPEN-authorised. Action returns SOURCE_REQUIRED.'},
  {id:'ITEMS'               ,note:'ITEM is an authorised action but no item is authored. Registry is empty; ITEM returns SOURCE_REQUIRED.'},
  {id:'F02_BURN'            ,note:'JOLLOF BURNER burn {8 x 3 turns} is menu-scale; its Showdown scale is not authored. Burn ignored, cone damage applied.'},
  {id:'F02_CONSECUTIVE'     ,note:'THE TOMMY TONY "+10% per consecutive turn fired" - percent of what is not stated. Ignored.'},
  {id:'BLESSED_ROUNDS'      ,note:'Needs enemy vampire/undead tags that are not authored. Ignored in Showdowns.'},
  {id:'FULL_MOON_WEREWOLVES',note:'"werewolf trouble on Inglewood jobs" - no werewolf unit is authored.'},
  {id:'NIGHT_MODIFIER_MATH' ,note:'RAIN (stealth +10%, WHEELS -10%) and other night modifiers are not defined for the grid.'},
  {id:'SEEN_IT_ALL'         ,note:'PANIC does not exist in the authored model; SEEN IT ALL is displayed but inert.'},
  {id:'GUN_CONFLICTS'       ,note:'Vol 7 and F02 disagree on LIL OGA range (medium vs close) and SAPPORO (+15 adjacent vs hits two). F02 stats win when bound; conflicts are reported. HQ ruling needed.'}
 ];

 // existing accepted audio ids for the guns that have one (RA_SFX_DELIVERY_v1); everything else stays silent-by-design
 const GUN_SFX={lil_oga:'GUN_LILOGA',sapporo_shotgun:'GUN_SHOTGUN',chopstick_sniper:'GUN_SNIPER',holy_baby_drake:'GUN_HOLYDRAKE',rpg:'GUN_RPG',triple_k_kratos:'GUN_KRATOS'};
 root.RAShowdownData=freeze({GUN_SFX,GRID,ACTIONS_PER_TURN,ACTIONS,HIT,CLASSES,ABILITY_NUMBERS,ENEMIES,ENEMY_NUMBERS,WEAPONS,RANGE_MAX,RICH,BLEED_TURNS,STORIES,STORY_ALIASES,STORY_NUMBERS,BOND,TRAITS,TRAIT_NUMBERS,TUNABLES,PROVISIONAL,SOURCE_REQUIRED,
  SOURCE:'Vol 7 - PLAYMAKERS: BLOOD X OPERATIONS (OPEN) sections 5-6',VERSION:'1.0.0'});
})(typeof window!=='undefined'?window:globalThis);
