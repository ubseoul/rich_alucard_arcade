// F01 THE PLAY — line bank (OL-016 T9). Every trigger has >= 4 variants; variants use context tokens ({a} {b} {because} {plan} {car} {word} ...).
// Drafted under H1 for Underlord review; deadpan, in the crew's world. Trait words / combo names are appended by the engine as " — WORD".
// No line repeats within 3 consecutive PLAYs (engine passes the last 3 PLAYs' used ids); a trigger never repeats a variant inside one PLAY while another is free.
import {stream} from './env.mjs';

export const LINES={
 // ---- moments (memId keys)
 'nerve:lost':["{a} lost his nerve","{a}'s hands stopped listening","{a} went quiet in the bad way","{a} looked at the door instead of the job","{a} heard his own heartbeat and nothing else","{a} found out what he was afraid of","{a} stopped being here, mostly","{a}'s knees filed a complaint","{a} lost the thread","{a} decided to be somewhere else in his head","{a} froze halfway through a thought","{a}'s courage took the next bus"],
 'nerve:fumble':["{a} dropped the clip — nerve gone","{a} reloaded a gun that was not empty","{a} forgot which end does what","{a}'s fingers turned to soup","{a} pulled a trigger that was not yet a trigger","{a} shook so hard the shot left the county"],
 'trait:steady:fail':["{a} did not mention the guy on the roof","{a} saw the ambush and filed it under later","{a} noticed everything and said none of it","{a} let the whole stoop walk up on them"],
 'trait:steady:up':["{a}: mm.","{a} took it in stride","{a} nodded like this was a Tuesday","{a} did not flinch and did not comment"],
 'trait:eat:heal':["{a} finished the sandwich and feels better","{a} found a second wind in a wrapper","{a} took a bite and the world got smaller","{a}'s snack, unofficially, was medical"],
 'trait:eat:fail':["{a} finished the sandwich first","{a} was mid-bite and stayed mid-bite","{a} held up one finger: let me finish. He finished","{a} looked at the fight, then the sandwich. The sandwich won"],
 'combo:door':["The door was a suggestion","The door was never asked its opinion","The door left. Nobody saw it go","The shotgun read the door's mind and closed the subject"],
 'octopus:win':["OCTOPUS BRAIN: the crew {plan}","Nobody knows who thought of it: they {plan}","OCTOPUS BRAIN — they {plan}, and it worked","The weirdest plan on the block worked: they {plan}"],
 'octopus:fail':["OCTOPUS BRAIN went sideways: they tried to {plan}","They tried to {plan}. It was a lot","OCTOPUS BRAIN: they tried to {plan}. The block noticed","The plan was to {plan}. The plan met a wall"],
 'combo:leash':["{a} held {b} by the hood","{a} put a hand on {b}'s shoulder. {b} stayed put","{a} said 'wait' like a parent. {b} waited","{a} had {b} on a short leash and it held"],
 'trait:church:up':["{a} climbed it like Sunday","{a} took the stairs like they were a hymn","{a} went up in good shoes and came down in better ones","{a} found the one clean step in the building"],
 'trait:church:fail':["{a} slipped on a wet floor","{a} met a puddle in his good shoes","{a}'s soles had a Sunday, not a Tuesday, grip","{a} went down in a slide he did not choose"],
 'trait:small:up':["{a} vanished into the gap","{a} fit where nobody fits","{a} went under the thing everyone else went around","{a} squeezed through and held the door for the big ones"],
 'trait:skittish:up':["{a}: did you hear that","{a} heard it first and said so","{a} pointed at the ceiling a full second early","{a}'s ears saved everybody a headache"],
 'trait:phone:up':["{a} already had their photos","{a} had the floor plan in a group chat","{a} knew which door before anyone asked","{a} had scouted it on a story from 2019"],
 'trait:phone:fail':["{a}'s phone went off","{a}'s ringtone was the wrong song at the worst time","{a}: 'one sec' — an alarm is not a one sec","{a}'s phone lit up and so did the room"],
 'trait:phone:fail2':["{a}'s phone lit up in the middle of it","{a} took a call. In this","{a}'s notifications had a whole conversation with the enemy","{a} checked a text mid-fight; the text was from his mother"],
 'sure':["SURE THING???","SURE THING??? (it was not)","They said SURE THING. Bold","SURE THING??? The dice read the sign and laughed"],
 'sure:fail':["SURE THING???","SURE THING??? (it was not)","They said SURE THING. Bold","SURE THING??? The dice read the sign and laughed"],
 'entry:hazard':["the alarm went — {because}","{because}. Then the alarm went","Somebody hit the wrong thing: {because}","The way in was quiet until {because}"],
 'entry:luck':["somebody looked up at the wrong time","a window on the third floor had opinions","someone's cousin was smoking by the exit","the lookout picked tonight to be good at his job"],
 'call:nodd:wave':["{a} waved. Nodd waved back. Nobody moved.","Nodd looked. {a} waved. Nodd waved. The cruiser rolled on","{a} smiled at Officer Nodd like they'd met. Nodd nodded, unsure why","Officer Nodd stared for six seconds and remembered he had somewhere to be"],
 'call:nodd:pay':["Rich's pocket pays $3K — Nodd finds a very interesting cloud","$3K changes hands. Officer Nodd becomes fascinated by the sky","Nodd's radio goes to static. Rich's wallet goes lighter","Nodd took the envelope like it was a parking ticket he agreed with"],
 'call:pay':["Rich's pocket pays $3K — the door opens","$3K, no questions. The door doesn't ask any either","A folded bill and the door remembers a family emergency","$3K greases exactly one hinge"],
 'call:talk:win':["{a} talked {n} out of it","{a} said something soft and {n} found a reason to leave","{a} offered {n} a better afternoon","{a} made {n} feel very seen and very unemployed"],
 'call:talk:fail':["{a} tried to talk. It did not land.","{a} opened with a joke. The joke was alone","{a}: 'hear me out' — nobody heard them out","{a} talked for eleven seconds. They had decided"],
 'trait:mouth:up':["{a} haggled the number up","{a} said 'final offer' and it wasn't, and it worked","{a} made the client feel clever for paying more","{a} sold the same crate twice in one sentence"],
 'trait:mouth:fail':["{a} sold the lie twice","{a} oversold it and the client wants a discount","{a} promised the moon; the client asked for receipts","{a} talked right past the close"],
 'call:sneak:win':["{a} slid past them — the smart way","{a} walked through like he was late for something legal","{a} became furniture and then a shortcut","{a} found the gap and the gap found {a}"],
 'call:sneak:fail':["the sneak got a cough at the wrong moment","someone sneezed. It was one of ours","a floorboard told on them","the dog was asleep until it wasn't"],
 'trait:seen:up':["{a} lectured him into leaving","{a} said 'your mother' and he left","{a} spoke for ninety seconds and the room emptied","{a} wagged one finger and a grown man apologized"],
 'trait:seen:fail':["{a} stopped mid-fight to give a lecture","{a} started a sentence that began 'in my day'","{a} paused the shooting to correct someone's posture","{a} said 'sit up straight' to a man with a shotgun"],
 'trait:sitdown:fail':["'SIT DOWN.' {a} sat {b} down mid-fight","{a} said 'sit' and {b} did. In the fight","{a} sat {b} down like a toddler, under fire","'Not now, baby.' {a} put {b} in a chair that was not there"],
 'trait:sitdown:up':["'SIT DOWN.' {a} sat down and stopped bleeding","{a} obeyed the voice and the bleeding obeyed {a}","'Sit.' {a} sat. The wound got smaller","Auntie said 'sit', and {a}'s body took it personally"],
 'trait:calm:fail':["{a} let it land first","{a} waited politely for the first shot to finish","{a} took a breath. It was the breath they were shot in","{a} was so calm the ambush had to knock"],
 'trait:calm:up':["{a} did not blink","{a} watched it all like a weather report","{a} stayed exactly as calm as {a} was","{a}'s shoulders never moved"],
 'trait:calm:slow':["{a} walked. Everyone else was waiting at the car","{a} does not run, on principle","{a} took the exit at a stroll","{a} checked his watch. The car was already moving"],
 'trait:rookie:fail':["{a} froze","{a} forgot how doors work","{a} looked at his gun like a puzzle","{a}: 'is this the part where' — it was"],
 'trait:rookie:up':["{a} got his first real one","{a} hit a man and immediately apologized","{a} stared at his own trigger finger with respect","{a} did it. He will tell this one for years"],
 'trait:skittish:fail':["{a} left. Just left.","{a} remembered a prior engagement","{a} was here, and then {a} was a rumor","{a} said 'brb' and did not"],
 'trait:hothead:fail':["{a} broke formation to go at somebody","{a} took it personally, on behalf of everybody","{a} left the plan in the car","{a} went for a man's neck and left his flank"],
 'trait:hothead:up':["{a} went first and it worked","{a} kicked it open and everyone was standing wrong","{a} ran at the gun and the gun blinked","{a} did the loud thing at the loud time"],
 'weapon:mac:friendly':["{a} sprayed a little too wide and hit {b}","{a}'s aim is a state of mind, and {b} was in it","{a} fired at the room; the room included {b}","{a} did not aim. {b} found that out"],
 'trait:showboat:up':["{a}: watch this — and it worked","{a} said 'watch this'. Everyone did. It was good","{a} spun the gun. It shot the correct man","{a} did the flashy thing and the flashy thing paid"],
 'trait:showboat:fail':["{a}: watch this — and everyone watched it miss","{a} said 'watch this'. They watched it","{a}'s trick shot went to a different zip code","{a} spun the gun and dropped it in style"],
 'combo:coin:up':["{a} in the shotgun seat went for it and it WORKED","{a} flipped the coin and won it out loud","{a} took the front seat's dare and the front seat blinked","{a} charged the door. The door had a family. It didn't matter"],
 'combo:coin:fail':["{a} in the shotgun seat went for it and ate the door","{a} flipped the coin and it landed on his teeth","{a} charged the door; the door was there","{a} took the front seat's dare and lost the argument with a frame"],
 'trait:dressed:up':["{a} dropped him without a crease","{a} fired, straightened his cuff, fired again","{a}'s pocket square stayed perfect through it","{a} killed a man in a clean shirt"],
 'trait:dressed:fail':["{a}'s suit is ruined","{a} looked at the hole in his sleeve. The room felt it","{a}: 'that was a gift' — a sleeve, gone","{a} took a hit to the jacket and a worse one to the mood"],
 'trait:impatient:up':["{a} was through the door first","{a} went before the count and the count agreed","{a} couldn't wait and, for once, didn't have to","{a} was already inside. Everyone else was still arriving"],
 'trait:impatient:fail':["{a} jumped early","{a} couldn't wait and it was the wrong second","{a} went at three. Nobody had said three","{a} kicked the door before the plan finished its sentence"],
 'boss:smack:flee':["LIL SMACK ran. He always comes back.","LIL SMACK left through a wall he did not open. He'll be back","LIL SMACK took his lunch and his dignity and ran","LIL SMACK made a face and a phone call and was gone. He always comes back"],
 'weapon:slipper':["Auntie's Slipper connected. He forgot what he was doing.","The slipper found him. He remembered his mother","A slipper crossed the room; his plan didn't","He got the slipper and was, for a second, eight years old"],
 'trait:small:fail':["{a} could not lift it alone","{a} and the safe agreed to disagree","{a} pulled with everything and the safe pulled back","{a} got underneath it and out from under it, immediately"],
 'class:lt:drop':["{a} dropped the green fur","{a} took the lieutenant's whole afternoon away","{a} put the one in green fur on the floor","{a} found the green fur and ended the speech"],
 'trait:small:dodge':["{a} wasn't there","{a} was somewhere shorter","{a} turned sideways and stopped being a target","the bullet went through where {a} had been thinking of standing"],
 'bond:witness':["{a} saw {b} go down","{a} stopped seeing anything but {b} on the floor","{a} watched {b} fall and the room got very loud","{a} felt {b} go down in his own knees","{a} said {b}'s name once, very quietly","{a} turned toward {b} and the fight turned toward {a}","{a} looked at {b} and stopped being careful","{a} went cold and then went loud","{a} said nothing and did the math on the floor","{a} watched {b} hit the ground and forgot the plan","{a}: \"no\" — that was all, and it was loud","{a} moved toward {b} without moving"],
 'bond:save':["{a} went back for {b} without being asked","{a} didn't wait for the call — he went back for {b}","Nobody said 'go'. {a} went for {b} anyway","{a} came back for {b} the way {b} would have","{a} went to {b} before thinking","{a} was already moving for {b}","{a} came back for {b} because of course","{a} put himself between {b} and everything"],
 'rich:bloodbath':["Rich stepped out of the car. Three of them stopped being a problem.","Rich came out of the car wrong. Three men remembered other plans","Rich opened the door and the hallway got shorter by three","The night went red for a second. Three fewer people wanted anything"],
 'rich:bite':["Rich bit the one in the green fur.","Rich found the green fur and made it quiet","The lieutenant got personal with Rich. Briefly","Rich took a bite out of the leadership"],
 'rich:octopus':["Rich's octopus brain: '{plan}.'","Rich thought sideways: '{plan}.'","Rich's octopus brain had a plan: '{plan}.'","Rich, calmly: '{plan}.'"],
 'rich:revenge':["Rich saw who was down. Nobody asked what happened next.","Rich looked at the floor, then at them. It was fast","Rich counted his own on the floor and did the math the old way","Rich was very polite about it, and it was over"],
 'call:save:win':["{a} went back for {b}","{a} took the long way back for {b}","{a} dragged {b} out by the collar","{a} said 'not tonight' to whatever wanted {b}"],
 'trait:loyal:up':["{a} went back for {b}","{a} was not leaving {b} and that was that","{a} stayed at {b}'s side until it stopped being dangerous","{a} came back for {b} without discussing it"],
 'call:save:fail':["{a} went back for {b}. It cost them both.","{a} reached for {b} and the floor reached back","{a} went back. So did the trouble","{a} tried. Now it was both of them"],
 'class:patch':["{a} patched {b} up on the floor of the van","{a} closed {b} with a belt and an opinion","{a}'s hands knew what to do; {b}'s body agreed","{a} kept {b} on the right side of a very thin line"],
 'death:generic':["{a} caught one. He's gone.","{a} caught one. That was {a}","{a} stopped mid-sentence and didn't restart","{a} was here. Then the noise. Then {a} wasn't"],
 'prize':["the prize slipped — {because}","{because}, and the prize walked","the take got smaller: {because}","nobody hurried, and {because}"],
 'prize:luck':["the prize was not where it was supposed to be","somebody had moved the good stuff","the safe held a very nice note and nothing else","they found the money's room. The money had left"],
 'trait:sticky:up':["{a} found something extra and it went in his pocket","{a}'s hand did a thing on its own","{a} pocketed a small thing that felt larger","{a} counted, then miscounted in his own favor"],
 'trait:sticky:fail':["{a} was seen","{a}'s pocket clinked","{a} pocketed it in front of a mirror","{a} got a hand in the drawer and a face on the camera"],
 'chain':["{n} traits in one beat: {list}","{list}: all at once, all in character","That beat was {list}","{list}. It was a busy second","{list}: it was a lot at once","{list}. Nobody planned any of it","This beat brought to you by {list}","{list} — that's the whole crew in one moment"],
 'trait:mazi:showoff':["{a} decided to show off at the wheel","{a} took the corner to be looked at","{a} checked the mirror for an audience, not traffic","{a} drifted to impress a curb"],
 'class:wheels:corner':["{a} took the corner on two wheels","{a} found a lane the map hadn't","{a} slid the corner like it owed him","{a} made the car do something it was not sold to do"],
 'combo:handsfree':["Dre took a call while driving","Dre answered at sixty. 'It's my mom'","Dre steered with an elbow and a phone","Dre did the whole getaway on speaker"],
 'car:stall':["the {car} died at the light — {word}","the {car} coughed at the worst red light in town — {word}","the {car} thought about it — {word}","the {car} chose now to have feelings — {word}"],
 'nodd:chase':["Officer Nodd chased them for eleven blocks, then got hungry","Nodd's siren followed them six blocks and gave up at a taco truck","Officer Nodd stayed on their bumper until he saw a pastry","Nodd got the plate, lost the plate, got a snack"],
 'car:crash':["the {car} hit something in the dark — {word}","the {car} met a pole it had never been introduced to — {word}","the {car} left the road for a moment of its own — {word}","the {car} found a curb the hard way — {word}"],
 'split:bus':["{a} took the bus","{a} is on the 720 to Wilshire","{a} walked to a bus stop and looked at it lovingly","{a} took the bus. It was on time. That was the worst part"],
 'split:panic':["{a} panicked and drove off with half the crew","{a} floored it and left half the friendship on the curb","{a} heard a noise and became a getaway driver in the worst sense","{a}'s foot made a decision the crew did not vote on"],
 'robbed':["they were jugged on the way back — everything they were holding is gone","somebody was waiting on the route back: jugged","two cars boxed them in and took the whole load","the way back was watched and the bags were light by the time it wasn't"],
 'trait:loyal:fail':["{a} would not leave anybody behind and jumped out to go back","{a} said 'I'm not leaving him' and left the car moving","{a} opened the door at forty to go get somebody","{a} loved the crew a little too literally"],
 'combo:crewbook':["NEW IN THE CREW BOOK: {combo}","CREW BOOK — they just found {combo}","{combo}. Somebody write that down","Nobody planned it, but that was {combo}"],
 'intel:door':["{a} remembered the second door — it was unlocked","{a} knew which door the last visit had left open","The second door, exactly where {a} had marked it","{a}: 'this way.' It was. The intel paid"],
 'trait:church:route':["{a} took the fire escape like it owed him money","{a} found the roof and the roof found {a}","{a} went up a wall in shoes made for a pew","{a} climbed something and did not mention it"],
 'trait:loyal:stay':["{a} did not leave {b}'s side","{a} stayed at {b}'s shoulder","{a} would not be moved from {b}","{a} planted himself over {b}"],

 // ---- captions for beats where nothing else is staged (deadpan)
 'cap:ENTRY:2':["In. Nobody looked up.","The door was never a problem.","Someone holds it open without knowing why.","Through the dark like it was furniture.","Nobody checked the back. Nobody ever does.","The lock had already given up.","They didn't even slow down.","Quiet as a rumor."],
 'cap:ENTRY:1':["Through the door, a little louder than planned.","Not pretty. Inside.","Inside, and somebody is sweating.","They're in. The building knows it.","A hinge complains. They keep moving.","Louder than planned; still in.","Inside, with a small story already.","Not elegant. Inside."],
 'cap:ENTRY:0':["That was not the plan.","The plan looked at the door and quit.","Everyone remembers the plan differently now.","Well.","The door had a plan of its own.","Somebody has opinions about that entrance.","That went sideways in one syllable.","So that's how it's going to be."],
 'cap:CONTACT:2':["Over before anyone finishes chewing.","Two seconds. Nobody had a story.","They never got a shot off.","It was a short conversation.","A very short misunderstanding.","Nobody had time to be brave.","The room decided quickly.","It was over before the second sentence."],
 'cap:CONTACT:1':["Messy, and over.","Everyone is breathing hard.","It cost a sleeve and a little dignity.","They have it. Barely.","They win it, a little worse for wear.","It costs them a shirt and a temper.","Ugly. Finished.","A draw with a winner."],
 'cap:CONTACT:0':["They are still standing. That is not good.","Nobody won that. They're all still here.","The room is still full.","It's not over. It's louder.","The room does not feel finished.","There are still people in this room.","It got louder instead of better.","They are not winning this one yet."],
 'cap:TROUBLE:2':["Whatever that was, it stops.","The block blinks first.","Short, loud, done.","Trouble arrived, looked around, and left.","The block folds like a card table.","Trouble looks at the crew and reconsiders.","That's the peak, and they're over it.","Somewhere a siren decides to be elsewhere."],
 'cap:TROUBLE:1':["They hold the line. Barely.","It costs something.","Nobody's proud of it.","They make it through and don't ask how.","They make it through. The floor helps.","Not their best. Enough.","Everybody says a different word and means one thing.","They bend and, somehow, don't break."],
 'cap:TROUBLE:0':["It keeps getting worse.","The floor is louder than the plan.","Somebody says a word Auntie wouldn't allow.","There's more of them than the pitch said.","It's getting worse in a very organized way.","The crew looks at the exits, individually.","Nobody has a plan for this one.","Trouble has brought friends."],
 'cap:PRIZE:2':["The take is real.","It was exactly where the pitch said.","Nobody says anything. That is how they know.","The good stuff was right there. Suspicious. Good.","It's all there. It's actually all there.","The good stuff was on the first shelf.","It's heavier than the pitch and lighter than the fear.","Exactly what the pitch promised. Weird."],
 'cap:PRIZE:1':["Less than promised. Still something.","They take what they can carry.","The room was lighter than the rumor.","Not the whole thing. A lot of the thing.","The good stuff is half the good stuff.","They grab what fits in the car.","There was more in the rumor.","A decent haul in a not-decent room."],
 'cap:PRIZE:0':["Not what anybody came for.","The room was a rumor.","They dig. There's less.","Somebody got here first.","This isn't what they came for.","The room is mostly a lesson.","They dig, mostly dust.","Whoever was here first had a plan."],

 // ---- getaway / report / stops
 'getaway:clean':["Clean. Nobody breathes until the freeway.","Clean. The car does its one job.","Clean. Someone laughs and it sounds like relief.","Clean. The city forgets them at the next light."],
 'getaway:messy':["It gets messy — but they make it.","Messy. They make it. Barely a story, actually a story.","They take the long way, with feeling. They make it.","It's a mess and it's theirs. They make it."],
 'getaway:crash':["CRASH. The trunk stays shut and the car does not.","CRASH. It was a good car for eleven more feet.","CRASH. Everyone checks everyone. Everyone's mostly there.","CRASH. The pole is fine."],
 'getaway:split':["{a} panics and floors it. {left} {isare} still on the curb.","{a} floors it. In the mirror, {left} get smaller.","{a} is gone. {left} {isare} not.","The car leaves. {left} watch it leave."],
 'getaway:robbed':["JUGGED. They got hit on the way back — the unbanked pot is gone, plus a little of Rich's pocket.","JUGGED. Somebody was waiting. The bags were somebody else's now.","JUGGED. The route back was a trap and they drove into it politely.","JUGGED. The haul changed hands. Banked money is fine."],
 'greed:stop':["TOO HOT — GET OUT.","TOO HOT. Nobody argues.","TOO HOT — the block is awake. Go.","TOO HOT — the room's turned. Leave."],
 'greed:fail':["It goes wrong. Jugged on the way back — the whole pot is gone. [GREED]","It goes wrong. The room closes, the road's watched, the pot's gone. [GREED]","One room too many. They're jugged and the pot with them. [GREED]","It turns. They're jugged. Everything they were holding is gone. [GREED]"],
 'fold:line':["→ FOLD. They take what they can carry and go.","→ FOLD. Nobody argues with the smart kind of fear.","→ FOLD. The crew gets out with something.","→ FOLD. The plan lives to argue tomorrow."],
 'wash:line':["Everyone is down. The block wins tonight.","Nobody is standing. The block breathes out.","The last one goes down. It gets very quiet.","That's everybody. The block keeps the night."],
 'fallback:line':["{a} slams the inner door and hauls the rest down the back stairs. The house can burn; the crew can't.","{a} does the math on the hallway, finds it short, and calls everybody out through the kitchen","{a} says 'let them have the rooms' and means it — everybody goes over the back wall","{a} counts heads instead of doors, and then the doors don't matter","The front gives. {a} is already at the cellar hatch with a hand on every collar","{a} decides the stash is only stuff. The crew leaves through the laundry","'Not the walls,' {a} says. 'The people.' The people go first","{a} kicks out the back gate and holds it open until the last of them is through"],
 'bail:line':["{a} drags the rest to the car. Nobody goes anywhere, but they leave.","{a} has one working leg and everybody's collar. They leave.","{a} pulls the others out by whatever's holding on. They're gone.","{a} makes the call nobody wanted: out. All of them."],
 'flex:clean':["{a}: 'not a scratch. write that down.'","{a}: 'we should be illegal'","{a}: 'that was a clinic and we were the teachers'","{a}: 'again? we could do it in our sleep'"],
 'fold:intel':["{a} saw the second door was unlocked. It'll come back as a better pitch.","{a} clocked the guard's schedule. The job will return, easier.","{a} left a marker in the room. Next time, they know the way.","{a} counted the exits. That's tomorrow's advantage."],

 // ---- kicker reactions (per Oga x rarity)
 'kick:dre:LEGENDARY':["no. NO. say it again","dre stares at it and says nothing, which is new","oh. oh, we're rich in a bad way","that is not a thing that exists"],
 'kick:dre:RARE':["ok ok ok. that is real","that's a nice one, that's a nice one","hold on, lemme look at it","who do we owe for this"],
 'kick:dre:COMMON':["we good. we good.","fine. fine. it's fine.","ok but who is buying","ehhh — decent"],
 'kick:tunde:LEGENDARY':["[stops chewing]","[puts the sandwich down]","[takes a long time to say anything]","[chewing stops. all of it]"],
 'kick:tunde:RARE':["[chewing, slower]","[nods, mid-bite]","[looks at it, looks at the sandwich, respects both]","[chewing with new respect]"],
 'kick:tunde:COMMON':["[chewing]","[chewing, unbothered]","[shrugs, chews]","[a very small nod]"],
 'kick:half_pint:LEGENDARY':["that is mine, right? that is mine","can I hold it. just to hold it","I could carry that. I will carry that","that's the biggest thing I've seen"],
 'kick:half_pint:RARE':["...that looks heavy. i can carry it","oh that's good. that's good","can we keep it in the front","that goes in the front seat"],
 'kick:half_pint:COMMON':["can we go now","that's fine. that's small. good","can we go now, seriously","my feet hurt"],
 'kick:sunday_best:LEGENDARY':["The Lord provides. Openly.","I would like to be alone with this for a moment.","Forgive me. I did not pray for this. I am very grateful.","I will not be able to sit down for this."],
 'kick:sunday_best:RARE':["Thank you. Sincerely.","That is most acceptable.","A blessing, and well-made.","This is above my expectations, which were formal."],
 'kick:sunday_best:COMMON':["Adequate.","It will do. It will absolutely do.","Modest. Appropriate.","A small grace."],
 'kick:young_mazi:LEGENDARY':["told you. TOLD you.","I said it'd be easy. IT WAS EASY.","who's the reason. me. it's me","I'm going to say 'I called it' for a year"],
 'kick:young_mazi:RARE':["see? it was easy","not even hard","literally nothing to it, look at that","told you it would be nice"],
 'kick:young_mazi:COMMON':["literally nothing to it","it's whatever, honestly","we barely worked","easy. so easy."],
 'kick:auntie_grit:LEGENDARY':["Sit down. Everybody sit down.","Lord. Put it down slowly.","I need a chair and a moment.","Nobody touch it until I've eaten."],
 'kick:auntie_grit:RARE':["Hm.","That's better than I expected of you.","Put it somewhere safe. Not the floor.","Eat something first. Then admire it."],
 'kick:auntie_grit:COMMON':["Put it in the car.","Fine. It is fine.","Take your hands off it. It's fine.","It's food money. Good."],
 'kick:generic:LEGENDARY':["...is that real","hold on. hold ON","okay so that's the whole night","I'm not touching it, you touch it"],
 'kick:generic:RARE':["that looks expensive","oh that's a good one","huh. nice.","that's above my pay grade"],
 'kick:generic:COMMON':["okay. okay.","fine","alright","we take those"],

 // ---- crew barks at the slide-in (per Oga, then per quirk)
 'bark:dre':["we good. we're good. we're so good.","we're gonna eat. tell me we're gonna eat","if this goes wrong it was Mazi's idea","i want it noted that I said it would be fine"],
 'bark:tunde':["[chewing]","[chewing, looking at the building]","[unwraps another sandwich]","[swallows. that is the whole speech]"],
 'bark:half_pint':["can we go now","this is my first time (it's not)","I'll be quick. I'm always quick","my legs are ready. the rest of me is thinking"],
 'bark:sunday_best':["Lord, forgive the next four minutes.","I would like to be home for supper.","I will be dressed for whatever this is.","Please do not step on my shoes."],
 'bark:young_mazi':["it's literally fine","it's like nothing. I already drove past it","what's the worst that could happen","I've done this before. In a dream. It went well"],
 'bark:auntie_grit':["Nobody bleeds on my seats.","I brought food. Nobody touches it until after.","If anyone says 'watch this' I'm getting out.","I'm too old for this and I'm doing it anyway."],
 'bark:SKITTISH':["{a}: did you hear that","{a}: that was a noise, right","{a}: I hate parking lots","{a}: was that a door"],
 'bark:SHOWBOAT':["{a}: watch this","{a}: somebody get my good side","{a}: I'm doing the thing","{a}: this is going in the story"],
 'bark:LOYAL':["{a}: I got you. I got you.","{a}: nobody left. we said nobody left","{a}: I'm right behind you","{a}: I've got your back, promise"],
 'bark:STICKY_FINGERS':["{a}: (already counting)","{a}: nice place. very nice place","{a}: I'm just gonna look at things","{a}: don't worry about my pockets"],
 'bark:HOTHEAD':["{a}: let me go first","{a}: I'm not waiting","{a}: just say when. say it now","{a}: I'm ready. I was ready an hour ago"],
 'bark:STEADY':["{a}: mm.","{a}: fine.","{a}: alright.","{a}: yep."],

 // ---- pitch voices per Oga. {spot} = the place
 'pitch:dre':["Dre: i know a spot. {spot}. easy money, trust me","Dre: oga. OGA. {spot}. we're gonna eat","Dre: nobody's even guarding it. {spot}. probably","Dre: ok so hear me out. {spot}. it's basically free"],
 'pitch:tunde':["Tunde: small one. {spot}.","Tunde: might be nothing. {spot}.","Tunde: {spot}. bring water.","Tunde: {spot}. eat first."],
 'pitch:young_mazi':["Young Mazi: literally so easy. {spot}. i already drove past it","Young Mazi: {spot}. what could go wrong","Young Mazi: it's nothing. {spot}. i promise","Young Mazi: {spot}. it's easy. i did the research (i looked at it)"],
 'pitch:half_pint':["Half-Pint: heard about a thing. {spot}. quiet. i'll be quick","Half-Pint: {spot}. in and out. mostly in","Half-Pint: you'll like this one. {spot}","Half-Pint: {spot}. I can fit. I'm saying I can fit"],
 'pitch:sunday_best':["Sunday Best: I would not ask if it were not necessary. {spot}.","Sunday Best: {spot}. Please dress accordingly.","Sunday Best: The Lord provides. Also, {spot}.","Sunday Best: {spot}. It is above board in the way that matters."],
 'pitch:auntie_grit':["Auntie Grit: Sit down. {spot}. I will not ask twice.","Auntie Grit: {spot}. Eat first.","Auntie Grit: {spot}. Don't make me come.","Auntie Grit: {spot}. I've already told you. Twice."],

 // ---- HIT ONE MORE crew lines (per Oga)
 'greed:dre':["we good… right?","one more is nothing, right? right","I said we were good. I'm reversing","he looked at the pot. I looked at him. we're going, aren't we","we're up. we're up. I'd like to remain up","the room's right there. the room. right there","dre says nothing, which means he wants to go","ok what if it's fine, and then it's fine"],
 'greed:tunde':["we can leave.","[chewing] we can leave.","[looks at the door] [looks at you] [chews]","there's more in there. there's also a car out here.","[chewing, staring at the back room]","[a long swallow] we can leave.","[points at the door, then at the car, then at you]","there's more. there's dinner. pick one."],
 'greed:half_pint':["my legs hurt","I'll be quick. I promise. quick","I'm fine. I think I'm fine","if we go, I'm going first — that's my one rule","I can go first. I go first. it's my thing","my legs hurt but the rest of me is fine","one more room. one small room","I'm the smallest, I'll be quick, I'll be brave"],
 'greed:sunday_best':["Greed is a sin. So is leaving money.","It is unseemly to want more. I want more.","I will follow the decision and forgive it later.","The Lord provides. He does not promise the second room.","The Lord provides. The Lord also has a schedule.","A gentleman knows when to leave. I am considering it.","There is dignity in stopping. I cannot find it just now.","Forgive me: I would like to see the next room."],
 'greed:young_mazi':["one more is nothing","it's fine, it's basically the same room","you already did the hard part","let's go. let's go before I think","it's fine it's fine it's fine","we're so warm. we're so warm right now","you know what, why not","I already know the layout (I don't)"],
 'greed:auntie_grit':["Get in the car.","Get in the car. I mean it.","That's enough. That's the bag. That's enough.","I did not raise a greedy person. Well. Not on purpose.","Enough.","I said get in the car and I'll say it twice","The bag is heavy enough. Isn't it heavy enough.","Look at me. Get in the car."],
 'greed:generic':["…one more?","we're so close to the good room","I don't like it, but I'll go if you go","I'll do what you decide","it's right there…","whatever you decide, boss","I've got a feeling about the next room. Good or bad","one more and then we eat"],

 // ---- morning after: VampGram
 'vg:clean':["@whosrunninLA: somebody made that look easy. respectfully.","@whosrunninLA: the block is talking. quietly. for once.","@whosrunninLA: not a scratch. i checked twice.","@whosrunninLA: whoever that was, please teach a class"],
 'vg:brag':["@whosrunninLA: NOT A SCRATCH. the crew is insufferable. 🚗","@whosrunninLA: clean in, clean out. hold my drink. 🖤","@whosrunninLA: they walked out like it was a mall","@whosrunninLA: 0 scratches. 4 stories. all of them flexing"],
 'vg:messy':["@whosrunninLA: that van left in a hurry and a good mood.","@whosrunninLA: somebody is hungover and rich. both.","@whosrunninLA: messy. but they took it.","@whosrunninLA: the crew looks tired and richer"],
 'vg:costly':["@whosrunninLA: crew got out. barely. smiling anyway.","@whosrunninLA: there's glass on the street and a story in it.","@whosrunninLA: they made it. some of them are limping. all of them are laughing","@whosrunninLA: paid for it. in full. and they'd do it again"],
 'vg:fail':["@whosrunninLA: damn.","@whosrunninLA: 🖤 (the photo is grainy)","@whosrunninLA: tough night. hydrate.","@whosrunninLA: nobody's talking. that's the whole story"],
 'vg:greed':["@whosrunninLA: you can only carry so much. someone learned it tonight.","@whosrunninLA: one more is a hell of a drug","@whosrunninLA: the bag was full and they went back for more. anyway","@whosrunninLA: greed is a sport. tonight it won"],
 'vg:rich':["@whosrunninLA: YOUNG PLAYMAKER pulled up himself. 🚗","@whosrunninLA: somebody saw a very tall, very calm man get out of a car","@whosrunninLA: YP was there. i can't say more. i also can't stop","@whosrunninLA: the block has a new word for 'no'. it's a name"],

 // ---- morning after: Oga texts keyed by the night's biggest event
 'text:trait:phone:fail':["Dre: my phone is on silent now. permanently.","Dre: i'm blocking the alarm. it started it","Dre: it was a group chat. it was important. it was a meme","Dre: never again. (again)"],
 'text:trait:eat:fail':["Tunde: [photo of half a sandwich]","Tunde: [photo of a whole sandwich, unbitten, sad]","Tunde: I finished it. before. it counted","Tunde: [photo of a napkin]"],
 'text:split:bus':["Half-Pint: is there a bus stop near the castle","Half-Pint: the 720 is actually pretty nice","Half-Pint: I like the bus. don't tell Mazi I said that","Half-Pint: I'm home. the bus knew the way"],
 'text:split:panic':["Young Mazi: the car is fine. the car is fine.","Young Mazi: I'm fine. the car is fine. don't ask about the curb","Young Mazi: no one talk about it","Young Mazi: I panicked. it happens. to me. today"],
 'text:car:stall':["Young Mazi: the hooptie says sorry","Young Mazi: I named it. it's 'Lunch'. it died","Young Mazi: it smells like a lunch and it acts like one","Young Mazi: (car noise)"],
 'text:weapon:mac:friendly':["Young Mazi: it barely grazed me. barely.","Half-Pint: someone owes me a shirt","Dre: I'm fine. it's fine. it's only a little friendly fire","Auntie Grit: I'm going to need someone to explain the spray"],
 'text:trait:dressed:fail':["Sunday Best: The suit was a gift.","Sunday Best: I will be sending a bill, in spirit.","Sunday Best: We do not speak of the sleeve.","Sunday Best: Forgive the cuff. I cannot yet."],
 'text:greed':["Dre: i said we were good. i was wrong.","Tunde: [photo of an empty plate]","Half-Pint: ok. that's on us. that's on us","Auntie Grit: One more. Always one more. Eat."],
 'text:death:generic':["Auntie Grit: somebody call his mother. I'll do it.","Dre: his phone keeps ringing. nobody answers it","Tunde: [photo of an empty seat]","Half-Pint: I don't know what to say so I'm bringing food"],
 'text:loot:legendary':["Half-Pint: are we rich or are we in a movie","Dre: ok so I checked. we're not dreaming","Tunde: [photo of the thing, blurry, lovingly]","Sunday Best: We should not tell anyone. We will tell everyone."],
 'text:trait:seen:fail':["Auntie Grit: I stand by the lecture.","Auntie Grit: A lecture is a gift. He'll see","Auntie Grit: some people need to be told twice","Auntie Grit: I'd do it again, louder."],
 'text:call:talk:win':["Dre: i talked to a man for eleven minutes and he gave me his lunch","Dre: he cried. i think he cried","Dre: i should be a lawyer","Dre: I have his number. he wants coffee"],
 'text:boss:smack:flee':["Tunde: he'll be back. he always comes back.","Tunde: [photo of a wall with a hole in it]","Dre: don't say it. he heard","Auntie Grit: that boy runs like a cheque"],
 'text:trait:small:fail':["Half-Pint: it was NOT that heavy","Half-Pint: I could've lifted it. eventually","Half-Pint: I'd like it noted I tried","Half-Pint: the safe won. this time"],
 'text:default':["Tunde: [photo of a sandwich]","Half-Pint: can we do that again","Young Mazi: told you it was easy","Sunday Best: Please let the record show I dressed appropriately.","Dre: ok but who is buying","Auntie Grit: Eat. Then talk."],
 'text:down':["Auntie Grit: {a}, sit down. I'm coming with soup.","Dre: {a} still isn't picking up.","Tunde: I'm at {a}'s. I brought food.","Half-Pint: {a} says he's fine. {a} is lying."],
 'text:captured':["Dre: {a} is not picking up.","Dre: nobody's seen {a} since the curb.","Auntie Grit: We get {a} back. We eat first, then we get {a} back.","Tunde: [photo of {a}'s empty seat]"],
 'text:thanks':["{a}: thank you. i mean it.","{a}: you didn't have to go back. thank you.","{a}: I owe you a very large sandwich.","{a}: I'm not saying it twice. Thank you."],

 // ---- next temptation (per type)
 'tempt:RESCUE':["{a} is still out there. Three nights. Somebody has to go get them.","They still have {a}. The clock is running. Go get them.","{a} texted from a number that isn't theirs: 'come get me'.","{a} is in a room somewhere. The clock says three nights."],
 'tempt:RETALIATION':["A van has been parked outside the gate since four. Retaliation is coming.","Headlights on the hill, and they didn't leave. Retaliation is coming.","Someone left a crossbow bolt in the door. That's a knock.","The block went quiet at dusk. That's not peace. Retaliation is coming."],
 'tempt:RECRUIT':["{a} keeps texting. They want in. They mean it.","{a} is outside the gate. They brought a resume and an uncle.","{a} wants a seat. They've been practicing a speech.","{a} has been asking around. Everyone says the same thing: they're good."],
 'tempt:RARE_PITCH':["{a}: heard about something shiny. Very shiny. Very guarded.","{a}: don't tell anyone but there's a thing. It glows.","{a}: I know a guy who knows a guy. There's something in a safe in Inglewood.","{a}: pitch incoming. It's a good one. It's dangerous too."],
 'tempt:DEMAND':["The block is hungry tonight. Every buyer in {d} is asking for you by name.","Blood X is moving in {d}. Everybody wants a case.","{d} is loud tonight. The word is: you.","Every phone in {d} rang at once. Every one of them said your name."],
 'tempt:INTEL':["{a} remembers the second door. The job is back, easier.","The job you folded from is back on the board. It's cheaper now.","{a} marked the map. The old job has a new, better pitch.","The place you left has been sitting on your mind. It's still there. It's easier."],
 'tempt:RANSOM':["A text: '{a} comes home for ${cost}K. Tonight only.'","'You want {a} back? ${cost}K. Don't be clever.'","A voice memo, {a} in the background: '${cost}K, or the clock runs out'.","'${cost}K.' That's the whole message. {a} is the reason."]
};


// ---- OL-020 / T9: pool resizing. Rule: every trigger's pool must exceed 3 x (the most times that trigger fires in one PLAY) so no line can repeat inside
// the 3-PLAY memory. Appended (never inserted) so existing variant ids stay stable. Each addition is a new beat of meaning, not a word-order shuffle.
// No Rich lines are added here (H1 stays sealed; none of the resized triggers is a Rich voice).
const MORE={
 'combo:crewbook':["{combo} — the crew book has a new page and it's smudged","Somebody's going to tell this story wrong: {combo}","That's on the record now: {combo}","{combo}. Nobody has to pretend they meant it","The book gets heavier: {combo}","{combo} — the kind of thing you find out about yourself in a van"],
 'bond:witness':["{a} saw {b} go down and stopped hearing the room"],
 'nerve:lost':["{a} discovered a whole new kind of quiet"],
 'bond:save':["{a} was three steps into the wrong direction and turned around for {b}","{a} left cover the way you leave a burning house — for {b}","{a} answered {b}'s silence with his whole body","{a} owed {b} nothing and paid it anyway","{a} came for {b} and brought the noise with him"],
 'chain':["{list}: one beat, no one was the boring one","Count them: {list}","{list}. Four hands, one plan, none of it working together","The whole team showed up at once: {list}","{list} — and nobody took a breath in between"],
 'call:save:win':["{a} got under {b}'s arm and simply did not leave","{a} argued with the floor until it gave {b} back","{a} read {b}'s name off the ground and lifted"],
 'prize':["the prize was there and then it was a story: {because}","they got to the good part late, and {because}","less than promised, and the reason was: {because}"],
 'greed:half_pint':["there's a window in there. I fit in windows","I already have a spot picked. it's small","I counted the steps. it's not many steps"],
 'greed:generic':["…I mean, we're already here","the next room can't be worse than this one. can it","I keep looking at the door and then at the pot"],
 'greed:tunde':["[swallows] there is a shelf in there that wants me","[sets the food down] okay. one more.","[chewing stops] [chewing resumes] we can leave. we can not leave."],
 'greed:dre':["what's the worst that happens. don't answer that","I put us at seventy percent fine. maybe eighty","I'm not saying go. I'm saying my feet are already inside"],
 'greed:young_mazi':["I have literally never lost a second room","the second room is basically a hallway","trust me, I'm the one with the car"],
 'greed:sunday_best':["I have prayed on it, briefly, in the doorway.","A man may be tempted and remain well dressed.","I shall pretend this was a reluctant decision."],
 'greed:auntie_grit':["The car is warm. The room is not. Choose warm.","I've buried better plans than this one. Get in.","One more room, one more funeral. Get in the car."],
 'cap:PRIZE:2':["The last room paid the way rooms used to.","Nobody argues with what is sitting on the table.","The pitch was honest. That happens once a year.","It is not a great take. It is an honest one.","Everything on the list is in the bag. Amazing."],
 'cap:TROUBLE:2':["The trouble leans in, hears the fight, and leans back out.","One good minute and the whole block was over it.","The lights come back on and nobody wants to be the first to speak.","The worst of it walks itself out the back.","Whatever was coming decides tomorrow works too."],
 'call:talk:win':["{a} said the number and {n} did the math the wrong way","{a} sounded so reasonable that {n} thanked him","{a} gave {n} the speech he'd wanted all night"],
 'nerve:fumble':["{a} tried to holster a gun that was in his hand","{a} counted the rounds out loud, wrongly","{a} remembered the safety a second after the safety remembered him","{a} loaded the last clip backwards, with confidence"],
 'prize:luck':["the vault door was open and the vault had been generous to somebody else","they found the envelope; the envelope had found a cheaper owner","the crate was stamped, sealed, and full of ceramic frogs"],
 'death:generic':["{a} got up too quickly and the night took the rest","{a} made it to the doorway. That was his whole distance","{a} was on the plan. Then he wasn't. Nobody had time to say why"],
 'sure:fail':["They called it a lock. Somebody hadn't checked the lock","SURE THING??? (a very confident silence followed)","The surest thing in the building turned out to be the floor","It was a sure thing until it met a person","SURE THING??? The sure thing left through the back","Nobody has ever been so certain and so wrong in one sentence","It was a sure thing the way a coin is a sure thing","The plan said sure. The room said watch this","SURE THING??? Somebody make that a T-shirt"],
 'trait:mouth:up':["{a} added a zero to the number and a smile to the zero","{a} promised a discount, then a discount on the discount, then a bigger number","{a} put the word 'exclusive' on a cardboard box"],
 'combo:handsfree':["Dre put the whole chase on hold to leave a voicemail","Dre said 'one sec' to a stunt driver","Dre took the turn with his ear and the mirror with his prayers","Dre gave directions to a stranger while being chased","Dre did the corner one-handed and the second hand was texting","Dre asked the passenger seat to hold the wheel — there was no passenger seat"],
 'combo:coin:up':["{a} called heads at the door and the door said heads","{a} bet the whole front seat on a hinge and won","{a} threw the shoulder and the lock threw up its hands","{a} gambled on the frame and the frame folded first","{a} trusted a spinning coin and a rotting hinge, in that order","{a} hit the door at the exact wrong angle for the door","{a} did the reckless thing loudly enough that it counted as a plan","{a} took the coin's side against the building and the coin won","{a} kicked once and the whole room agreed"],
 'combo:coin:fail':["{a} called tails and the door said nobody","{a} bet the whole front seat on a hinge and the hinge did not care","{a} threw the shoulder at a wall that looked like a door","{a} gambled on a rotten frame; the frame was fine","{a} trusted a spinning coin and got a spinning room","{a} went in like a decision and came out like a lesson","{a} got lucky twice earlier and the universe wanted it back","{a} took the coin's side against the building and the building had a lawyer","{a} kicked once and the whole crew learned about doorframes"],
 'split:bus':["{a} is on the Metro, looking at the map like it owes him rent","{a} found a bench and a very long lunch","{a} put a hood up and a transfer card out"],
 'boss:smack:flee':["LIL SMACK sent a text that said 'brb' and did not brb","LIL SMACK went out the window with his napkin still tucked in","LIL SMACK ran so fast his echo had to catch a cab","LIL SMACK dropped a chicken wing and a threat and took neither back","LIL SMACK retreated with his mouth still full — forgivable","LIL SMACK left a note that just said 'later, chewing'","LIL SMACK went out the kitchen door and into a rumor","LIL SMACK ran; the lieutenants applauded, sarcastically","LIL SMACK vanished like the last fry"]
};
for(const [k,v] of Object.entries(MORE)){if(!LINES[k])throw new Error('T9 extension for unknown key '+k);LINES[k].push(...v);}
const POOL_KEYS=Object.keys(LINES);
export const lineCoverage=()=>POOL_KEYS.filter(k=>LINES[k].length<4);

export function lineKey(memId){
 if(!memId)return null;
 if(LINES[memId])return memId;
 if(/^nerve:[a-z_0-9]+:lost$/.test(memId))return 'nerve:lost';
 if(memId.startsWith('chain:'))return 'chain';
 if(memId.startsWith('car:crash:'))return 'car:crash';
 if(memId.startsWith('combo:')&&!LINES[memId])return 'combo:crewbook';
 if(memId.startsWith('prize:')&&memId!=='prize:luck')return 'prize';
 return null;
}
// pick a variant deterministically from the PLAY seed; avoid variants used in the last 3 PLAYs (P.recentSet) and this PLAY (P.usedLines)
export function pickLine(P,key,tok={}){
 const arr=LINES[key];if(!arr)return null;
 const ban=P.recentSet||new Set(),now=P.usedLines,ages=P.recentAge||{};
 let c=arr.map((_,i)=>i).filter(i=>!ban.has(key+'#'+i)&&!now.has(key+'#'+i));
 if(!c.length){ // every variant is recent: take the least-recently used one that is not already on screen this PLAY
  const free=arr.map((_,i)=>i).filter(i=>!now.has(key+'#'+i));
  const pool=free.length?free:arr.map((_,i)=>i);
  const worst=Math.max(...pool.map(i=>ages[key+'#'+i]??9));c=pool.filter(i=>(ages[key+'#'+i]??9)===worst);}
 const R=stream(P.seed,'line|'+key+'|'+(P.lineN=(P.lineN||0)+1));
 const i=R.pick(c);now.add(key+'#'+i);
 if(!P.sim){P.lineLog.push(key+'#'+i);}
 return fill(arr[i],tok);
}
const TOK_DEFAULT={a:'Somebody',b:'somebody',n:'a few',list:'a few traits',because:'a reason',car:'the car',word:'the car',plan:'a plan',spot:'the spot',left:'the rest',isare:'is',combo:'a combo',d:'the district',cost:'a lot'};
export const fill=(t,tok)=>t.replace(/\{(\w+)\}/g,(m,k)=>tok[k]!==undefined?tok[k]:(TOK_DEFAULT[k]!==undefined?TOK_DEFAULT[k]:''));
