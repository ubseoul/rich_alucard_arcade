// THE PLAY paper-sim — authored placeholder content (drafts under H1; the Underlord reviews). Nothing here claims canon beyond Vol 7 (OPEN).
// Numbers are structural defaults (PROVISIONAL, owner F13). Vol 7 / F01 / F02 authored values are read from the preserved F01 data.js.
import {D} from './env.mjs';

// ---------------------------------------------------------------------------------------------------------------- roster
export const NAMED=[
 {id:'tunde',name:'TUNDE',short:'Tunde',cls:'MUSCLE',human:true,traits:['CALM','ALWAYS_EATING'],gun:'sapporo_shotgun',voice:'under'},
 {id:'dre',name:'DRE',short:'Dre',cls:'TALKER',human:false,traits:['MOUTHPIECE','PHONE_OUT'],gun:'lil_oga',voice:'over'},
 {id:'half_pint',name:'HALF-PINT',short:'Half-Pint',cls:'GHOST',human:false,traits:['SMALL','IMPATIENT'],gun:'pistol',voice:'quick'},
 {id:'sunday_best',name:'SUNDAY BEST',short:'Sunday Best',cls:'SHOOTER',human:false,traits:['DRESSED_TO_KILL','CHURCH_SHOES'],gun:'chopstick_sniper',voice:'formal'},
 {id:'young_mazi',name:'YOUNG MAZI',short:'Young Mazi',cls:'WHEELS',human:false,traits:['ROOKIE','BIG_POTENTIAL'],gun:'pistol',voice:'lies'},
 {id:'auntie_grit',name:'AUNTIE GRIT',short:'Auntie Grit',cls:'DOC',human:true,traits:['SEEN_IT_ALL','SIT_DOWN'],gun:'auntie_slipper',voice:'stern'}
];
export const GENERIC_NAMES=['Lil Tuesday','Marcus Two-Phones','Cousin Bode','Big Wendell','Pastor Kev','Nephew Chidi','Deshawn From The DMV','Little Rasheed'];
export const CLASS_ORDER=['MUSCLE','SHOOTER','WHEELS','TALKER','GHOST','DOC'];
export const QUIRKS=['SKITTISH','SHOWBOAT','LOYAL','STICKY_FINGERS','HOTHEAD','STEADY'];
export const TRAIT_WORD={CALM:'CALM',ALWAYS_EATING:'ALWAYS EATING',MOUTHPIECE:'MOUTHPIECE',PHONE_OUT:'PHONE OUT',SMALL:'SMALL',IMPATIENT:'IMPATIENT',DRESSED_TO_KILL:'DRESSED TO KILL',
 CHURCH_SHOES:'CHURCH SHOES',ROOKIE:'ROOKIE',BIG_POTENTIAL:'BIG POTENTIAL',SEEN_IT_ALL:'SEEN IT ALL',SIT_DOWN:'SIT DOWN',SKITTISH:'SKITTISH',SHOWBOAT:'SHOWBOAT',LOYAL:'LOYAL',
 STICKY_FINGERS:'STICKY FINGERS',HOTHEAD:'HOTHEAD',STEADY:'STEADY'};
// class -> seat-lane fit (hidden). Lanes: FRONT / MID / BACK / DRIVER
export const FIT={MUSCLE:{FRONT:1,MID:.5,BACK:.25,DRIVER:.3},SHOOTER:{FRONT:.55,MID:.7,BACK:1,DRIVER:.4},WHEELS:{FRONT:.35,MID:.4,BACK:.4,DRIVER:1},
 TALKER:{FRONT:.5,MID:1,BACK:.6,DRIVER:.35},GHOST:{FRONT:.55,MID:.75,BACK:.85,DRIVER:.65},DOC:{FRONT:.2,MID:1,BACK:.7,DRIVER:.3}};

// ---------------------------------------------------------------------------------------------------------------- cars (M2)
export const CARS={
 HOOPTIE:{seats:['DRIVER','SHOTGUN','BACK_L','BACK_R'],word:"SMELLS LIKE SOMEONE'S LUNCH",stall:.14,grip:-6,tough:0,ram:false},
 S2000:{seats:['DRIVER','SHOTGUN'],word:'TWITCHY',stall:.02,grip:+14,tough:-.05,crash:.12,ram:false},
 SUPRA:{seats:['DRIVER','SHOTGUN','BACK_L','BACK_R'],word:'ALL BUSINESS',stall:.02,grip:+8,tough:0,ram:false},
 URUS:{seats:['DRIVER','SHOTGUN','BACK_L','BACK_M','BACK_R'],word:'HEAVY AND PROUD',stall:.02,grip:0,tough:.08,crash:-.06,ram:true},
 CASTLE:{seats:['DOOR','HALL_L','HALL_R','INNER'],word:'YOUR OWN HOUSE',stall:0,grip:0,tough:.04,crash:0,ram:false,castle:true}
};
export const SEAT_LANE={DRIVER:'DRIVER',SHOTGUN:'FRONT',BACK_L:'MID',BACK_M:'MID',BACK_R:'BACK',DOOR:'FRONT',HALL_L:'MID',HALL_R:'MID',INNER:'BACK'};

// ---------------------------------------------------------------------------------------------------------------- guns (F02 numbers via F01 data; role words per OL-015)
export const GUNS={
 pistol:{name:'PISTOL',role:'SIDEARM',dmg:[2,3],lane:'ANY',flavor:'Reliable. Boring. Yours.',eff:null},
 lil_oga:{name:'LIL OGA',role:'QUIET',dmg:[3,3],lane:'ANY',flavor:'Never misses when it counts.',eff:'quiet'},
 sapporo_shotgun:{name:'SAPPORO SHOTGUN',role:'BREACHER',dmg:[4,6],lane:'FRONT',flavor:'Doors are a suggestion.',eff:'breach'},
 chopstick_sniper:{name:'CHOPSTICK SNIPER',role:'SNIPER',dmg:[4,6],lane:'BACK',flavor:'Patience, then a lot of sound.',eff:'pick'},
 mac_and_cheese:{name:'MAC & CHEESE',role:'CHAOS',dmg:[3,6],lane:'ANY',flavor:'Aim is a state of mind.',eff:'spray'},
 auntie_slipper:{name:"AUNTIE'S SLIPPER",role:'CHAOS',dmg:[1,2],lane:'FRONT',flavor:"Every auntie's final answer.",eff:'flinch'}
};
export const GUN_PRICE={pistol:0,lil_oga:25,sapporo_shotgun:60,chopstick_sniper:90,mac_and_cheese:75,auntie_slipper:0.012};

// ---------------------------------------------------------------------------------------------------------------- pitch voices
export const PITCH_LINES={
 dre:["Dre: i know a spot. {spot}. easy money, trust me","Dre: oga. OGA. {spot}. we're gonna eat","Dre: nobody's even guarding it. {spot}. probably"],
 tunde:["Tunde: small one. {spot}.","Tunde: might be nothing. {spot}.","Tunde: {spot}. bring water."],
 young_mazi:["Young Mazi: literally so easy. {spot}. i already drove past it","Young Mazi: {spot}. what could go wrong","Young Mazi: it's nothing. {spot}. i promise"],
 half_pint:["Half-Pint: heard about a thing. {spot}. quiet. i'll be quick","Half-Pint: {spot}. in and out. mostly in","Half-Pint: you'll like this one. {spot}"],
 sunday_best:["Sunday Best: I would not ask if it were not necessary. {spot}.","Sunday Best: {spot}. Please dress accordingly.","Sunday Best: The Lord provides. Also, {spot}."],
 auntie_grit:["Auntie Grit: Sit down. {spot}. I will not ask twice.","Auntie Grit: {spot}. Eat first.","Auntie Grit: {spot}. Don't make me come."]
};
export const SLIDE_BARKS={
 dre:"Dre: we good. we're good. we're so good.",tunde:'Tunde: [chewing]',half_pint:'Half-Pint: can we go now',sunday_best:'Sunday Best: Lord, forgive the next four minutes.',
 young_mazi:"Young Mazi: it's literally fine",auntie_grit:'Auntie Grit: Nobody bleeds on my seats.',
 SKITTISH:'{n}: did you hear that',SHOWBOAT:'{n}: watch this',LOYAL:'{n}: I got you. I got you.',STICKY_FINGERS:'{n}: (already counting)',HOTHEAD:'{n}: let me go first',STEADY:'{n}: mm.'
};
export const GREED_LINES={dre:'Dre: we good… right?',tunde:'Tunde: we can leave.',half_pint:'Half-Pint: my legs hurt',sunday_best:'Sunday Best: Greed is a sin. So is leaving money.',young_mazi:'Young Mazi: one more is nothing',auntie_grit:'Auntie Grit: Get in the car.'};

// ---------------------------------------------------------------------------------------------------------------- jobs
// size = [min,max] crew from the authored squad sizes. pods per stage use the AUTHORED F01 enemy roster. loot tilt weights category picks.
export const JOBS=[
 {id:'boba_backroom',shape:'COLLECT',names:['THE BOBA BACKROOM','PEARLS AND PRINCIPAL','SOMEBODY OWES THE BOBA GUY'],pitchers:['dre','half_pint'],band:[12,30],ugly:'TOUGH',faction:'OPEN MOUTH GANG',tell:'chewing through the whole conversation',
  place:'the boba shop\'s beaded backroom',favors:'ANY',size:[2,3],octopus:'pay a Kevin to be the decoy',pods:{CONTACT:['CHEWER','CHEWER'],TROUBLE:['CHEWER','ENFORCER'],PRIZE:['CHEWER'],REINF:['CHEWER','CHEWER']},
  tilt:{CASH:5,BLOOD_X:1,GUN:1,MOD:1,RECRUIT:1,STORY:1,DISTRICT:1,WEIRD:2},heat:4,silhouettes:['CASH','WEIRD']},
 {id:'tupperware',shape:'DROP',names:["AUNTIE'S TUPPERWARE MONEY",'THE CHURCH BAKE SALE FLOAT','A SMALL ONE'],pitchers:['tunde','auntie_grit'],band:[8,14],ugly:'EASY',faction:'THE COUSINS',tell:'arguing about parking',
  place:'a church parking lot with a cash box that is not locked enough',favors:'QUIET',size:[2,2],octopus:null,pods:{CONTACT:['CHEWER'],TROUBLE:['CHEWER','CHEWER'],PRIZE:[],REINF:['CHEWER']},
  tilt:{CASH:6,BLOOD_X:1,GUN:0,MOD:1,RECRUIT:1,STORY:2,DISTRICT:1,WEIRD:3},heat:2,silhouettes:['CASH','WEIRD']},
 {id:'vampire_dentist',shape:'DROP',names:['THE VAMPIRE DENTIST','OPEN WIDE','GOLD TEETH, COLD HANDS'],pitchers:['dre','sunday_best'],band:[18,25],ugly:'TOUGH',faction:'HUNTERS',tell:'crossbows under the tactical vests',
  place:'a dental office that keeps very strange hours',favors:'QUIET',size:[2,3],octopus:"hide the cases in Slurp Dynasty's broth delivery",pods:{CONTACT:['HUNTER','CHEWER'],TROUBLE:['HUNTER','HUNTER'],PRIZE:['CHEWER'],REINF:['HUNTER']},
  tilt:{CASH:4,BLOOD_X:2,GUN:1,MOD:2,RECRUIT:1,STORY:1,DISTRICT:1,WEIRD:3},heat:3,silhouettes:['BLOOD_X','MOD']},
 {id:'dock_restock',shape:'RE-UP',names:['CASE NUMBERS AT THE DOCKS','THE BIG WEIGHT','FIVE CASES, NO QUESTIONS'],pitchers:['young_mazi','tunde'],band:[10,18],ugly:'TOUGH',faction:'OPEN MOUTH GANG',tell:'a gang van idling with the window down',
  place:'the docks after the ships leave',favors:'ANY',size:[2,3],octopus:null,pods:{CONTACT:['CHEWER','CHEWER'],TROUBLE:['ENFORCER','CHEWER'],PRIZE:['CHEWER'],REINF:['CHEWER']},
  tilt:{CASH:2,BLOOD_X:6,GUN:1,MOD:1,RECRUIT:1,STORY:1,DISTRICT:1,WEIRD:2},heat:3,silhouettes:['BLOOD_X','?']},
 {id:'car_wash_stickup',shape:'TAKE THE BLOCK',names:['THE CAR WASH STICK-UP','SOAP AND SHOTGUNS','SPOT-FREE RINSE'],pitchers:['tunde','dre'],band:[22,40],ugly:'NASTY',faction:'OPEN MOUTH GANG',tell:'enforcers with shotguns, all of them chewing',
  place:'a car wash the Open Mouth Gang treats like a kitchen',favors:'LOUD',size:[3,4],octopus:null,pods:{CONTACT:['CHEWER','CHEWER','ENFORCER'],TROUBLE:['LIEUTENANT','CHEWER'],PRIZE:['CHEWER','CHEWER'],REINF:['ENFORCER','CHEWER']},
  tilt:{CASH:4,BLOOD_X:2,GUN:3,MOD:2,RECRUIT:1,STORY:1,DISTRICT:3,WEIRD:2},heat:6,silhouettes:['GUN','DISTRICT']},
 {id:'quiet_lift',shape:'COLLECT',names:['THE QUIET LIFT','NOBODY WAS HOME','A VERY POLITE SAFE'],pitchers:['half_pint','dre'],band:[12,28],ugly:'TOUGH',faction:'OPEN MOUTH GANG',tell:'one lookout, one dog, zero patience',
  place:'a stash house with a dog who has opinions',favors:'QUIET',size:[2,3],octopus:'ring the doorbell as the wrong pizza',pods:{CONTACT:['CHEWER'],TROUBLE:['CHEWER','CHEWER'],PRIZE:['ENFORCER'],REINF:['CHEWER','ENFORCER']},
  tilt:{CASH:5,BLOOD_X:1,GUN:2,MOD:2,RECRUIT:1,STORY:2,DISTRICT:1,WEIRD:3},heat:2,silhouettes:['CASH','MOD']},
 {id:'vampire_gala',shape:'PROTECT',names:['THE VAMPIRE GALA','BLACK TIE, SILVER BOLTS','HOLD MY COAT'],pitchers:['sunday_best','auntie_grit'],band:[15,24],ugly:'NASTY',faction:'HUNTERS',tell:'streetwear under tactical vests, crossbows in the flower arrangements',
  place:"a client's gala where nobody is who they say",favors:'ANY',size:[3,4],octopus:'seat the bride next to the loudest uncle',pods:{CONTACT:['HUNTER','CHEWER'],TROUBLE:['HUNTER','HUNTER','LIEUTENANT'],PRIZE:['HUNTER'],REINF:['HUNTER','HUNTER']},
  tilt:{CASH:4,BLOOD_X:1,GUN:2,MOD:2,RECRUIT:2,STORY:2,DISTRICT:3,WEIRD:2},heat:3,silhouettes:['DISTRICT','RECRUIT']},
 {id:'smack_crib',shape:'TAKE THE BLOCK',names:["LIL SMACK'S CRIB",'THE CHEWING DOES NOT STOP','FIRST COURSE'],pitchers:['tunde','young_mazi'],band:[30,45],ugly:'NASTY',faction:'OPEN MOUTH GANG',tell:'a boss who chews with his mouth open on purpose',
  place:"Lil Smack's own kitchen, which is somehow also the throne room",favors:'LOUD',size:[3,4],octopus:null,pods:{CONTACT:['CHEWER','CHEWER'],TROUBLE:['LIEUTENANT','LIL_SMACK'],PRIZE:['CHEWER','ENFORCER'],REINF:['ENFORCER','CHEWER']},
  tilt:{CASH:4,BLOOD_X:2,GUN:3,MOD:2,RECRUIT:1,STORY:2,DISTRICT:4,WEIRD:3},heat:7,silhouettes:['GUN','DISTRICT']},
 {id:'counting_house',shape:'TAKE THE BLOCK',bigPlay:true,names:['THE COUNTING HOUSE','EVERYTHING, ALL AT ONCE','DRE SAYS IT IS FINE'],pitchers:['dre','young_mazi'],band:[60,110],ugly:'BIG PLAY',faction:'OPEN MOUTH GANG + HUNTERS',tell:'two crews who hate each other guarding one very good door',
  place:'the counting house, where every crew keeps the good money',favors:'ANY',size:[4,4],octopus:'switch the bags before anybody counts',pods:{CONTACT:['ENFORCER','HUNTER'],TROUBLE:['LIEUTENANT','HUNTER'],PRIZE:['LIL_SMACK'],REINF:['ENFORCER','HUNTER']},
  tilt:{CASH:5,BLOOD_X:3,GUN:4,MOD:3,RECRUIT:2,STORY:2,DISTRICT:3,WEIRD:5},heat:9,silhouettes:['GUN','?']},
 {id:'hold_the_house',shape:'HOLD THE HOUSE',defense:true,names:["THEY'RE COMING TO THE CASTLE",'RETALIATION, NO APPOINTMENT','LOCK THE GOOD DOOR'],pitchers:['auntie_grit','tunde'],band:[8,20],ugly:'NASTY',faction:'HUNTERS + THE GANG',tell:'headlights, lots of them, all pointed at the gate',
  place:'the castle halls',favors:'ANY',size:[4,4],octopus:null,pods:{CONTACT:['CHEWER','CHEWER','HUNTER'],TROUBLE:['ENFORCER','HUNTER','CHEWER'],PRIZE:['LIEUTENANT','HUNTER'],REINF:['HUNTER','CHEWER']},
  tilt:{CASH:3,BLOOD_X:2,GUN:5,MOD:3,RECRUIT:1,STORY:3,DISTRICT:3,WEIRD:2},heat:0,silhouettes:['GUN','STORY']}
];

// ---------------------------------------------------------------------------------------------------------------- beat cards
// stage cards: {id,tags,hazard:{word,mod},calls:[verb...],smart:'authored smart way out',text}
export const CARDS={
 ENTRY:[
  {id:'bouncer',tags:['door','talk'],hazard:null,calls:['TALK','BUST','PAY'],smart:'walk in carrying a tray',text:'A bouncer with a clipboard and no sense of humor guards the door.'},
  {id:'dog',tags:['alley','animal'],hazard:{word:"the dog hasn't eaten",mod:-.07},calls:['SNEAK','BUST','PAY'],smart:'throw the dog a whole rotisserie chicken',text:'A dog in the alley has clocked everyone.'},
  {id:'fire_escape',tags:['stairs','roof'],hazard:{word:'the ladder was rusted',mod:-.05},calls:['SNEAK','BUST','TALK'],smart:'take the fire escape like it owes you',text:'The fire escape is the only way in that nobody is watching.'},
  {id:'dumpsters',tags:['dirty','tight'],hazard:{word:'the alley was a dead end',mod:-.06},calls:['SNEAK','BUST'],smart:'roll the dumpster out and walk in behind it',text:'The way in is behind three dumpsters and a crawlspace.'},
  {id:'crowd',tags:['crowd','dressy'],hazard:null,calls:['TALK','SNEAK','BUST'],smart:'join the line like you were invited',text:'A crowd is spilling out of the front. Everyone is dressed.'},
  {id:'wet_ramp',tags:['wet','stairs'],hazard:{word:'the ramp was slick',mod:-.06},calls:['SNEAK','BUST'],smart:'use the delivery ramp before the rain gets it',text:'A wet delivery ramp runs down into the loading dock.'},
  {id:'shutters',tags:['dock','noise'],hazard:{word:'the shutters screamed',mod:-.05},calls:['BUST','SNEAK','TALK'],smart:'lift the shutter during the bass drop',text:'The loading shutters are louder than any of us.'}
 ],
 CONTACT:[
  {id:'stoop',tags:['ambush'],hazard:{word:'they were already chewing on the stoop',mod:-.04},calls:['BUST','TALK','FOLD'],smart:'let them finish the sandwich, then walk past',text:'Two of them are on the stoop, chewing, looking straight at you.'},
  {id:'lookouts',tags:['lookout'],hazard:null,calls:['SNEAK','BUST','TALK'],smart:'send the dog-walker the wrong way',text:'Lookouts spot you a second too early.'},
  {id:'door_wall',tags:['door','cover'],hazard:{word:'the door opened the wrong way',mod:-.05},calls:['BUST','TALK','FOLD'],smart:'wait for the delivery guy to open it for you',text:'A door opens and the room behind it is full.'},
  {id:'roof_line',tags:['high','cover'],hazard:{word:'they had the high ground',mod:-.06},calls:['BUST','FOLD','SNEAK'],smart:'cut the light, then cut through',text:'Someone above the line has a very good angle.'},
  {id:'crowd_fight',tags:['crowd'],hazard:{word:'nobody could tell who was who',mod:-.04},calls:['TALK','BUST','FOLD'],smart:'shout that the cops are outside',text:'A fight breaks out and drags everyone in.'},
  {id:'camera_room',tags:['tech'],hazard:null,calls:['SNEAK','BUST'],smart:'unplug the one camera that matters',text:'The camera room sees you before you see it.'}
 ],
 TROUBLE:[
  {id:'reinforcements',tags:['reinforce'],hazard:{word:'the second van was early',mod:-.05},calls:['PUSH','FOLD','PULL_UP'],smart:'let the second van find the first van',text:'Headlights. More of them than there should be.'},
  {id:'alarm',tags:['alarm'],hazard:{word:'the alarm was the loud kind',mod:-.05},calls:['PUSH','FOLD','SNEAK'],smart:'pull the alarm yourself and point at somebody else',text:'An alarm starts. Everyone turns toward you.'},
  {id:'power_cut',tags:['dark'],hazard:{word:'nobody could see',mod:-.03},calls:['PUSH','SNEAK','FOLD'],smart:'let them fight in the dark; you brought a flashlight',text:'The lights die. Somebody laughs. It is not one of yours.'},
  {id:'lieutenant_out',tags:['boss'],hazard:{word:'the green fur was already there',mod:-.05},calls:['BUST','TALK','PULL_UP'],smart:'let the chewing distract him',text:'The one in the green fur steps out and everyone stands up straighter.'},
  {id:'nodd',tags:['law'],hazard:{word:'Officer Nodd was on patrol',mod:-.05},calls:['TALK','PAY','FOLD'],smart:'wave; he waves back; nobody moves',text:'Officer Nodd rolls slowly past the lot. He stops nodding. He starts staring.'},
  {id:'third_crew',tags:['third'],hazard:{word:'a third crew wanted it too',mod:-.05},calls:['PUSH','TALK','PULL_UP'],smart:'point them at each other and leave',text:'A third crew pulls up. Nobody planned for a third crew.'},
  {id:'someone_down',tags:['injury'],hazard:{word:'it went wrong fast',mod:-.04},calls:['SAVE','PUSH','FOLD'],smart:'do not stop moving',text:'It goes wrong in one second and stays wrong.'}
 ],
 PRIZE:[
  {id:'safe',tags:['safe'],hazard:null,calls:['BUST','TALK','SNEAK'],smart:'ask nicely; it was never locked',text:'The safe is bigger than the room it is in.'},
  {id:'office_cash',tags:['cash'],hazard:null,calls:['PUSH','FOLD'],smart:'take the ledger, not the cash',text:'A back office with too much cash in it.'},
  {id:'crate_stack',tags:['supply'],hazard:{word:'the crates were heavy',mod:-.03},calls:['PUSH','FOLD'],smart:'carry them like a delivery',text:'Stacks of crates, all stamped.'},
  {id:'client_handover',tags:['talk'],hazard:null,calls:['TALK','PAY'],smart:'let the client tell you the number first',text:'The client wants to negotiate. Now.'},
  {id:'hidden_stash',tags:['hidden'],hazard:null,calls:['SNEAK','BUST'],smart:'follow the smell of fresh paint',text:'Somebody hid something. Somebody always hides something.'},
  {id:'armory_rack',tags:['guns'],hazard:null,calls:['PUSH','FOLD'],smart:'take the one they would miss least',text:'A rack of guns behind a curtain.'},
  {id:'the_real_prize',tags:['weird'],hazard:null,calls:['PUSH','TALK'],smart:'ask why it is so quiet',text:'The room is quiet in a way that means something is in it.'}
 ]
};

// ---------------------------------------------------------------------------------------------------------------- loot
export const WEIRD=[
 ['The Deed to a Laundromat (Disputed)','It has been disputed since before the laundromat.'],['Signed Photo of Officer Nodd, Not Smiling','He signed it while staring.'],
 ['A Lamborghini Key, No Lamborghini','Somebody is very sad in a garage.'],['Taxidermy Raccoon in a Tuxedo','Formal, unblinking, priced accordingly.'],
 ['Ten Pounds of Loose Pearls (Boba)','Do not ask what they were loose from.'],['Church Bake-Sale Float, Sealed','Heavier than any pie.'],['A Very Confident Parrot','Repeats a passcode. Nobody knows whose.'],
 ['Vintage VampGram Verification Badge','From when it meant something.'],['A Pager That Still Works','It buzzed once. Everyone looked away.'],['Karaoke Mic Owned by a Hunter','He was surprisingly good.'],
 ['Bag of Mismatched Diamond Studs','Half a wedding, half a robbery.'],["Auntie's Handwritten Debt Ledger",'Everyone in Inglewood is in it.'],['Ceramic Cat, Full of Cash','Tap the tail.'],
 ['Bulletproof Puffer, One Sleeve','The other sleeve is a mystery.'],['A Slurp Dynasty Broth Ledger','Recipes and receipts.'],['Waterbed With a Safe Inside','It has been sloshing for years.'],
 ['Forty Pairs of Church Shoes','All the same size. All Sunday.'],["Framed 'World's Okayest Vampire' Trophy",'Accurate.'],['Expired Coupons Worth Something Anyway','The math is complicated.'],
 ['A Suitcase of Gold Fronts','Somebody is chewing quietly now.'],['A Seat Cushion From a Very Famous Van','It smells like a plot.'],['Golf Cart, Repossessed Twice','Third time is a charm.'],
 ['Cassette Labeled DO NOT PLAY','Nobody has.'],['Mystery Tupperware (Heavy)','Auntie would know.'],['A Rolex Buried in Rice','The rice was dinner.'],['Sunday Program With Notes in the Margins','The notes are the sermon.'],
 ['Jar of Teeth (Not Human, Probably)','Probably.'],['Tiny Crown, Kid Size','It fits Half-Pint.'],['A Street-Sweeper Schedule for All of Koreatown','Power.'],['Satin Jacket That Says CREW','Somebody will fight for it.'],
 ["Rival's Group Chat, Printed Out",'Forty pages of feelings.'],['The Lucky Wok','It has cooked things that are not food.'],['A Napkin With a Safe Combination, Greasy','Half of it is legible.'],['Disco Ball Rated for Vampires','Reflects nothing. Glows anyway.'],
 ['Bag of Unreleased Sneakers','One left foot each.'],['Alarm Remote for Half of Inglewood','Do not press it.'],['Trophy: Best Chewer 2019','Awarded with dignity.'],['One Very Long Extension Cord','Somebody needed a lot of light.'],
 ['Prayer Candle With a Fuse','Two prayers, one bang.'],['A Fur Collar, Green','Still warm from somebody.'],['A Framed Menu From Somewhere That Burned','The specials are legend.'],['Cooler Full of Business Cards','Every one of them a lie.']
];
export const LEGENDARY=[
 ['The Lucky Wok of a Thousand Nights','Nobody has ever cooked twice the same.'],['A Sealed Bottle of Something Red','Nobody drinks it. Nobody sells it.'],['The Platinum Pager','It has one number in it.'],
 ["The Deed to a Corner",'A whole corner of somewhere.'],['A Ledger Nobody Was Supposed to Have','It changes who owes whom.'],['The Good Radio, Serial Number 001','Plays what you need before you know it.'],
 ['A Key to Every Door on the Block','Not literally. Mostly.'],['The Crew Portrait, Framed in Gold','Everyone is looking at something off-screen.']
];
export const RARE_MODS=[['SILENCER','Quiet is a skill. This is a tool.'],['SCOPE','Long shots feel closer.'],['DRUM MAG','More bang before the click.'],['BLESSED ROUNDS','Someone prayed over each one.']];
export const COMMON_MODS=[['DRUM MAG','More bang before the click.'],['SCOPE','Long shots feel closer.']];
export const GUN_LOOT={COMMON:['lil_oga','sapporo_shotgun','mac_and_cheese','auntie_slipper'],RARE:['chopstick_sniper','sapporo_shotgun','mac_and_cheese'],LEGENDARY:['chopstick_sniper']};
export const LORE_GUN={lil_oga:'Never misses when it counts.',sapporo_shotgun:'Doors are a suggestion.',chopstick_sniper:'Consigned by somebody\'s cousin, no questions.',mac_and_cheese:'Aim is a state of mind.',auntie_slipper:"Every auntie's final answer."};

// ---------------------------------------------------------------------------------------------------------------- morning after
export const VAMPGRAM={
 clean:['@whosrunninLA: somebody made that look easy. respectfully.','@whosrunninLA: the block is talking. quietly. for once.'],
 messy:['@whosrunninLA: that van left in a hurry and a good mood.','@whosrunninLA: somebody is hungover and rich. both.'],
 costly:['@whosrunninLA: crew got out. barely. smiling anyway.','@whosrunninLA: there\'s glass on the street and a story in it.'],
 fail:['@whosrunninLA: damn.','@whosrunninLA: 🖤 (the photo is grainy)'],
 greed:['@whosrunninLA: you can only carry so much. someone learned it tonight.'],
 rich:['@whosrunninLA: YOUNG PLAYMAKER pulled up himself. 🚗']
};
export const TEMPTATIONS=[
 {type:'RESCUE',text:'{n} is still out there. Three nights. Somebody has to go get them.'},
 {type:'RETALIATION',text:'A van has been parked outside the gate since four. Retaliation is coming.'},
 {type:'RECRUIT',text:'{n} keeps texting. They want in. They mean it.'},
 {type:'RARE_PITCH',text:'{p}: heard about something shiny. Very shiny. Very guarded.'},
 {type:'DEMAND',text:'The block is hungry tonight. Every buyer in {d} is asking for you by name.'}
];
export const DISTRICTS=['KOREATOWN','THE ARTS DISTRICT','INGLEWOOD'];
export {D};

// ---------------------------------------------------------------------------------------------------------------- enemy tells and their visible counters (OL-016 T5)
// Every tell printed on the pitch card has at least one counter the player can SEE on the CAR screen: the seat glows when a counter sits in it.
export const TELLS={
 charge:{enemy:'ENFORCER',line:'ENFORCERS charge the front seat',counterLine:'SMALL or a MUSCLE up front',
  ok:(o,lane)=>lane==='FRONT'&&(o.traits.includes('SMALL')||o.cls==='MUSCLE'),any:o=>o.traits.includes('SMALL')||o.cls==='MUSCLE',seatLane:'FRONT'},
 flank:{enemy:'CHEWER',line:'CHEWERS flank the back rows',counterLine:'a MUSCLE, a DOC or Auntie in the back',
  ok:(o,lane)=>(lane==='MID'||lane==='BACK')&&(o.cls==='MUSCLE'||o.cls==='DOC'||o.traits.includes('SIT_DOWN')),any:o=>o.cls==='MUSCLE'||o.cls==='DOC'||o.traits.includes('SIT_DOWN'),seatLane:'BACK'},
 silver:{enemy:'HUNTER',line:'HUNTERS go straight for vampires',counterLine:'a human up front draws them off',
  ok:(o,lane)=>!o.vampire&&(lane==='FRONT'||lane==='DRIVER'),any:o=>!o.vampire,seatLane:'FRONT'},
 aura:{enemy:'LIEUTENANT',line:'the LIEUTENANT lifts his crew',counterLine:'a SHOOTER in the back picks him off',
  ok:(o,lane)=>lane==='BACK'&&(o.cls==='SHOOTER'||o.gun==='chopstick_sniper'),any:o=>o.cls==='SHOOTER'||o.gun==='chopstick_sniper',seatLane:'BACK'}
};
