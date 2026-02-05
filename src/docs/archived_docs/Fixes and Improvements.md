React Site Improvement and Feedback Document:

Overview: Throughout this document is a review of each of the errors, issues, ui quirks, missing functionality, etc small to large across the entire react site. The goal of all implemented improvements will be to: Improve user experience by creative an intuitive, consistent, easy to understand webapp environment that reuses styles, formats, views, cards, etc as much as possible to keep it consistent and reliable for users to understand.
We use the vanilla website as an example for the previous websites framework, functionalities, save states, and general purpose of the website, but it is no longer the preferred website as it lacks security, functionality, framework, etc. Use it for reference to understand how something should work.

Encounter Tracker: When I hover a creature card in the initiative it shows a cross arrow signifying I can move it, but there is a 6 dot grab bar in the top left that on hover shows a different mouse cursor (hand) and also indicates it can be used to change the cards position. We only want one of these not both, users prefer the 6 dot method with only that area usable to click and drag changing the cards position. After being clicked to drag the cards colors fade/becomes transparent to signify it's being dragged, but after it's dropped to it's new location, it remains transparent instead of returning to color.

Make the chips look better in general. Make the initative value editable for added cards, not permanent once card is added. Add Energy to the tracked values so for added creatures you can set max en, and you can adjust en and hp in the encounter tracker itself. The buttons for start encounter, sort, etc should be accessable while you could scroll up and down the tracker. maybe put tracked cards into a scrollable box without having to scroll down the page? maybe that can scroll to show the turn whenever next turn is selected? use best practice and what context would suggest would work best.

I feel like the dmg and heal boxes (and the ones we'll make for energy) aren't intuitive, find ways to make them more intuitive, asthetically pleasing, etc. use other websites like dnd beyond for refernce for how encounter trackers or vtt maps track health with ease allowing adding or subtracting. Keep track of current turn number, and round number, in the summary box with the next turn, previous turn, end combat, etc buttons.

Remove the apply surprise button, and simply always apply surprised if a creature that was added had surprised checked on them, also allow unchecking this after the creature is already added. and a option instead of ally or enemy called "Companion" which always go at the end of the round in initiative order of companions (after all allies and enemies have gone). the sort button should only sort alternative initiative, not any other form of initiative, so we don't need it separated into two buttons.

Cards are too tall, too much information is stacked rather than in a row, do what we can to reduce the height slightly to make it easier to see more cards on a list, without removing any information from the chips, just arranging it so it can all fit nicely. perhaps shrink the width of the red bar. Allow editing card names as well if you click on them, since creature names can change too.

On added creature cards, allow copying them, duplicating their health, name (plus a letter A-Z after, in ascending order, ie if you copy "Bill" it'd make the copy have the same HP and EN, same Acuity, and named "Bill B". When creating a card/adding a card, allow for increasing the quantity of that card you make using this same logic, except if the name was "Goblin" with 10 ho, 10 en, 4 acuity, and you selected 5 quantity, it'd make 5 copies of that card in the initiative each with A, B , C , D etc. after it's name to distinguish it.

Creators: The save/load buttons are in different places between the power, technique, and armament creators, and the creature creator. Ideally the creature creator would match as much as possible the layout and format of the other creators and vice versa. This is important as it keeps a consistent ui for users. We need to find the best way to format these UI for users. Across all creators we always have values calculated based on decisions, and then the summary of the thing. The values should always be scrolling with the user, whereas the summary could be fixed to the top of the creator where you can name the thing, add description, and so on. other ideas like this for best user experience and that simply just make the most sense given the context of the site and it's goal for users. think/consider the user experience in these formatting decisions. keep it consistent across creators. We don't always need a summary & an input in a creator, since they often hold the same information, ie we don't need the summary to show a creature or item name, since that's already inputted in a basic information area. calculated values are different, since these are based on input, but aren't 1:1 in relation.

Creature Creator: The creature's ability points, HP/EN points (needs to be renamed from H/E points), Skill points, Feat Points, Training Points, and Loot Value (needs to be renamed Currency) are all values that should scroll the with the user, as opposed to the creature summary that would better fit in the top position where these other values are. Try swapping their positions (see "creators" notes.). reference vanilla site for this: Proficiency is not a static "+2" value based on level alone, instead "Proficiency Points" are a value based on level that can be spent on increasing power prof or martial prof or both. Fix this misunderstanding in the creature creator and use the vanilla site for how this functionality is to work. Health and Energy could be decided and displayed in general/basic information instead of having their own box in the creature creator list. You should simply be able to increase/decrease health and energy on the same area it is displayed  (don't need it displayed twice) vanilla site handles the health/energy part of the creature creator well, look into it. Creature creator skills should show a displayed "Bonus" value based on the highest ability tied to that skill plus the skill value added to that skill when proficient, etc. This works EXACTLY like the character sheet, so look into vanilla site character sheet to understand how to add skills, count spend skill points, etc. Find ways to unify the logic since it's used across both character sheet editing and creature creation editing and so on, and if we edit one we want the other to reflect the change.

When adding resistances, immunities, weaknesses, condition immunities, etc there are specific id's tied to these to tie to creature feats specifically in the rt database. these feats have feat points values that should be accounted for in the feat points calculation/total. I see no ui update of the feat points display. For instance, similar to how basic mechanics work in techniques/powers etc, feat options shouldn't include the creature feats that are used similarly "mechanically" ie immunity, condition immunity, senses, etc. They should still be added in the background and feat points increased based on how many times they're added (for instance if you have 3 resistances, the resistance creature feat feat points are added 3 times), senses added should be added once, but not shown in the added feats either, theri feat points still counting, etc. Use common sense, logic, and context to make this work well. Ensure added feats track feat points properly either added manually or through the basic ifnromation/wired/mechanical route.

Since skills adding is utilized in the character sheet editing/character creation/creature creation, it should be possible to unify the processes and use many central modules, styles, calculations, logic, etc. Use common sense to interpret and consolidate and improve these features accordingly.

After adding a creature feat with the select a feat modal, it says no feats found for adding other feats/more feats after the first, unless I delete the first and add it again.

Errors: "creature-creator:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was receivedUnderstand this error
a6a726c52154109d.js:21 WebSocket connection to 'wss://s-usc1a-nss-2010.firebaseio.com/.ws?v=5&ls=joGcQVIRD18n7pNpx3Xuo3SJcdnoxXGW&ac=eyJraWQiOiJ2ckU4dWciLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxOjgyOTU1NTczNDQ4ODp3ZWI6YWNlNmY4NzEzZDNhNTZlNjEwNjRhZCIsImF1ZCI6WyJwcm9qZWN0cy84Mjk1NTU3MzQ0ODgiLCJwcm9qZWN0cy9yZWFsbXNycGctdGVzdCJdLCJwcm92aWRlciI6InJlY2FwdGNoYV92MyIsImlzcyI6Imh0dHBzOi8vZmlyZWJhc2VhcHBjaGVjay5nb29nbGVhcGlzLmNvbS84Mjk1NTU3MzQ0ODgiLCJleHAiOjE3Njg0MDcyNDMsImlhdCI6MTc2ODMyMDg0MywianRpIjoiaTJuWllwU1lOaTloemxCMjIzRDdIdGIyekVKVHhIdnFfbjhSa0pHZ...iwVvM-6L4gCJvFQ-1b6Ar5B7wKeejmtUNxCyIPsXquiGpJ8yfsYGeOsq0WhZLXJR99q9k56hB9Y95LfA3EQTBEk6ji0-bbitIYDx6kYa2hvHdL-NP3_3kuLTOw0Ch0Y6G2XlL8ccfbvKWqrqw7jYtFRhS2GweiPN1sZcB0Yd5-eNGnI50oub3A6ZAUA1Oi2qG6XC1V2Uog899qreEAwjy2bojGLEMqNZCClnQhlFO3CVuY8dKLYKqZfg9GTSugTOV4Hw_wPJJkGUVnYJv0nwJ9ktSOWNAZGNVtLz9xhfSiPKDr3MlcPkXeOosPpEoUkPGpsIpWi7eCt2V2X4b-ss2k0kT2A7aVaFJ0VQVuBgh_74Z3Yn4wSdAZPN46w98t8sOrBbFP2F9z7GYMVdYlBT1ygrdRabulb1Z6Sj0N41THWIZiwxPGU&p=1:829555734488:web:ace6f8713d3a56e61064ad&ns=realmsrpg-test-default-rtdb' failed: 
open @ a6a726c52154109d.js:21Understand this error"

Power Creator: The basic mechanics are added but do not contribute to calculations at all, for instance increasing the range doesn't add any energy or tp, same with area of effects, action types, reactions, so on and so forth. Essentially, adding range should, in the background, "add" the range part to the part payload, and so on. Duration is also flawed, there is no instant duration, the default is 1 round. when selecting minutes, days, hours, etc there are specific intervals that are counted as one level of increase (ie 1 minute, then 10 minutes, then 30 minutes, is the 3 levels of increase for the duration mitues) all of this is reflected in the vanilla site, so use it for refrence for how to make this work. Sustain goes to 4 AP not only 2 AP. Focus, no harm or adaptation, ends of activation, etc, are all tied to duration mechanic parts, and should affect the duration calculation accordingly, thoroughly scan vanilla site for how these work and interact. The added power parts are still displaying the mechanic type power parts despite these supposed to be be filtered out of added parts. Mechanic parts are utilized either in advanced mechanics or are wired to the basic mechanics such as duration, action, etc.
I still so no advanced power mechanics ui whatsoever, its an empty/blank dropdown. Damage should also be "adding" part(s) to the power wired in, but also does not function when I add dice, damage type, etc.

Technique Creator: The options for any melee or any range weapon are unneeded and unused. Adding a weapon should be tied to adding the add weapon to technique part, as in the vanilla site, to contribute to the energy cost based on the added weapons TP cost. All of the parts added to the technique creator don't seem to be adding the energy costs they come with to the energy total, or even loading/displaying their energy costs at all. Since the technique and power creators are so analogous, as well as the armament creator, they should all have their options and increase buttons working like the power creator, ideally this wouldn't even be 3 separate sets of code to utilize this function since adding properties and parts works so much the same across all of these creators, find ways to fix the issues, unify logic and code, etc. Additional damage is also not wired to a part and adding extra TP and energy cost when dice and type are selected. this is a similar problem to power creator, and likely with armament creator

Armament Creator: IP stands for Item Points, not Item Power. The similar issue across almost all creators persists here, with wired ranged property not adding it's IP, C, and TP to calculations same with two handed, base damage, and properties. Properties, as said before, need their options shown with increase options, in line with other creators. They also should display their item point, C, and TP values. The c can be called the Currency Multiplier. (base_c) or (op_1_c) or whatever it's called, reference vanilla site where needed. Armor needs some basic mechanics properties that the vanilla site has, such as armor base automatically being accounted for, and having the options for critical range, vulnerabilities, resistances, and damage resistance as basic mechanic instead of added properties. (ui wired to properties in the rtdatabse, just like other creator pages basic mechanics, I hope you see the patterns and see possibility to improve the system and unify logic and fix errors). Shield base should be added when selecting a shield, wired to an id in rt database. The shield amount and shield damage should both be basic mechancis rather than added properties as well. reference and improve upon vanilla site functionalty.

Codex: Many of the tabs are different looking than others, such as through lacking headers, filters, ascending/descending mentality. Ideally we're reusing the same tab layout/functional designs and methods for each tab so we aren't dealing with duplicate code, and inconsistent formatting and feature implementation. Fix this! Look for other areas this may come up and fix those too.
Feats tab: call it ability/defense requirement, change required level filter to be an input, that the value you input it filters out all feats that require levels higher, that way you it's more intuitive for users. remove the dropdown. The option to show state feats is in the state feats dropdown twice.
Skills tab: The abilites in the skills collapsed format need to be separated by a comma and space, if the array is "Acuity, Intelligence" than it should say "Acuity, Intelligence" instead of AcuityIntelligence as it does now. Sub skill logic in the codex is entirely missing or flawed, none of the base skills are rendering from the skills data, you cant sort by base skills, and can filter in/out sub skills as you should. All this functionality exsists in the vanilla site, figure out how to implement it here and utilize it in a way that's usesful across the entire codebase if needed. Ability filter should also show each of the 6 abilities as options to filter by in the list, but there are none in the dropdown right now, fix it, reference vanilla site for functionality.
Power & Technique Parts Tab: missing the cute filter border and the hide filters options.
Armament Properties tab: Armament properties are loaded here without displayed TP, IP or Currency Multiplier from the database. fix it. look into how to use the same methods for loading and retrieving rtdatabase information across the entire codebase for simplifying errors like this to one failpoint, improve consistency, etc etc. For instance, we use armament properties in the armament creator, the technique creator (for determining the added weapons tp costs) the character creator, creature creator, character sheet, etc. This and many other rtdatabase features are utilized all over, we should have unified and best practices to handle this so we can monopolize on the reusability nature of realms rpg ttrpg website. this tab is missing headers as well, and filters, and hider filter functionality.
Equipment: the equipment should be loading with it's name, description, currency, rarity, and category! The category is a helpful filter/sort criteria and should be included. This tab is lacking headers as well, and filters, and hider filter functionality.

Library: Each tab should have each part/property shown in the items dropdown able to see more details on that part in the expanded view, by expanding that part/properties chip itself.

Creatures tab: Figure out how to implement sleek, detailed, very organized and auto-generated creature stat-blocks, refernce the vanilla site and improve upon the design, for simple sleek clean stat-blocks.

Errors: Minified React error #31; visit https://react.dev/errors/31?args[]=object%20with%20keys%20%7Bsize%2C%20amount%2C%20type%7D for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at lD (fed4668fa8a3b3e5.js:1:53328)
    at d (fed4668fa8a3b3e5.js:1:55149)
    at fed4668fa8a3b3e5.js:1:57496
    at i (fed4668fa8a3b3e5.js:1:57789)
    at fed4668fa8a3b3e5.js:1:58875
    at oB (fed4668fa8a3b3e5.js:1:81131)
    at io (fed4668fa8a3b3e5.js:1:97738)
    at sc (fed4668fa8a3b3e5.js:1:138001)
    at fed4668fa8a3b3e5.js:1:137846
    at ss (fed4668fa8a3b3e5.js:1:137854)" "fed4668fa8a3b3e5.js:1 Uncaught Error: Minified React error #31; visit https://react.dev/errors/31?args[]=object%20with%20keys%20%7Btype%2C%20amount%2C%20size%7D for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
    at lD (fed4668fa8a3b3e5.js:1:53328)
    at d (fed4668fa8a3b3e5.js:1:55149)
    at fed4668fa8a3b3e5.js:1:57496
    at i (fed4668fa8a3b3e5.js:1:57789)
    at fed4668fa8a3b3e5.js:1:58875
    at oB (fed4668fa8a3b3e5.js:1:81131)
    at io (fed4668fa8a3b3e5.js:1:97738)
    at sc (fed4668fa8a3b3e5.js:1:138001)
    at fed4668fa8a3b3e5.js:1:137846
    at ss (fed4668fa8a3b3e5.js:1:137854)"

Save Structure Reference: The rt database structure for the following things, along with one or two example values, are shown below.

Items:
id	name	description	category	currency	rarity
1	Rations	1 day of rations.	Consumable	3	Common
2	Bag	A regular carrying bag, can hold 30kgs.	Container	6	Common
Species Data:
id	name	description	type	sizes	skills	species_traits	species_traits_name	ancestry_traits	ancestry_traits_name	flaws	flaws_names	characteristics	characteristics_names	ave_hgt_cm	ave_wgt_kg	adulthood_lifespan	languages	part_cont								
1	Erethi	The Erethi are a mysterious and enigmatic species, distinguished by their pale grey skin and lightish grey hair, often cascading in untamed waves or braids. Their most striking feature, however, lies in their eyes, which commonly come in two distinct hues: a fiery orange that seems to flicker with inner intensity, or a deep, abyssal black that appears to absorb all light around them. With an aura of ancient wisdom and a demeanor veiled in secrecy, the Darkin possess an innate connection to the arcane forces of the world. Their culture is steeped in mysticism and esoteric knowledge, often shrouded in rituals and rites that date back eons. The Darkin are divided into two primary clans, each based on the color of their eyes. The Clan of Oblivion, distinguished by their profound obsidian gaze, and are renowned for their relentless pursuit of esoteric wisdom and mastery over the destructive echelons of arcane arts or combat styles. While some perceive members of the Clan of Oblivion as savages or renegades, such categorization remains subjective. Conversely, the Clan of Eclipse, bedecked with fiery amber eyes, stands as paragons of refinement and societal cohesion, driven by an unyielding quest to attain esteemed status among the diverse species of the realm.	Humanoid	Small, Medium	Arcana, Stealth	43, 189	Darkvision, Umbral Sight	57, 81, 19, 40, 199, 158	Eclipsing, Frightening, Born for Oblivion, Cursed Knowledge, Within Shadow, Shadow Stride	106, 36, 45	Light Adversity, Corruptible Nature, Destructive Impulses	53, 88, 56, 190, 116, 42	Duality, Grim Gaze, Echoes of Whispers, Umbral Tracker, Melodic Speech, Dark Presence	180	65	25, 350	Universal, Darkened Tongue	false								
2	Fungari	"""In the heart of the dense, ancient forests of our fantasy world lies the vibrant and enigmatic society of the Fungari. These unique beings, known as the Fungari, are a species of sentient mushroom people whose civilization thrives amidst the towering canopies and lush undergrowth of their woodland home.
Physically, the Fungari are a Humanoid species that vary in appearance greatly, but some consistencies in the Fungari are their mushroom tops and the strangely spongy substance they're made of.                                                Some features that Vary the most are; The height of your character, it will vary much but your height will stay within medium.
The Fungari live in close harmony with the natural world around them, their society organized into small tribal communities scattered throughout the forest. Within these tribes, roles are fluid, with individuals contributing their skills and talents to the collective well-being of the group. Fungari communities are governed by wise elders, who pass down the ancient traditions and lore of their people through oral storytelling and communal rituals.
Fungari culture revolves around their deep reverence for fungi and the interconnectedness of all living things. They believe in the sanctity of the mycelial network, a vast web of fungal threads that connects all life in the forest, from the towering trees to the tiniest insects. The Fungari view themselves as stewards of this network, responsible for maintaining balance and harmony within their ecosystem.
Despite their peaceful nature, the Fungari are not without their challenges. They must contend with threats from neighboring civilizations, as well as the ever-present dangers of the forest itself, from predatory creatures to natural disasters. However, through their resilience, ingenuity, and unwavering connection to the natural world, the Fungari endure, their society standing as a testament to the enduring power of life and growth in even the most challenging of environments."""	Plant	Small, Medium	Nature, Stealth	92, 125	Heterotrophic, Mycorrhizal Connection	86, 65, 126, 25, 124, 43	Stunning Attack, Euphoric Spores, Mycotic Fortitude, Camouflage, Mycelial Control, Darkvision	96, 195, 39	Hydration Dependence, Vulnerability to Fire, Cross Contamination	82, 123, 177, 84, 127	Fungal Affinity, Mycelial Architecture, Symbiotic Companions, Fungal Kinesthesia, Spore-Infused Ink, Mycotic Mark	170	65	12, 80	Universal, Any	false								

Traits:
id	name	description	uses_per_rec	rec_period	flaw	characteristic								
1	Absorbent	You can drastically change your weight by ingesting fluids.			FALSE	TRUE								
2	Acoustic Architecture	Settlements made by your species are specially designed to enhance your natural abilities. When in one such settlement, the range at which you can hear, be heard, and echolocate is enhanced.			FALSE	TRUE								

Skills:
id	name	description	ability	base_skill	success_desc	failure_desc	ds_calc	craft_failure_desc	craft_success_desc																
1	Acrobatics	Twisting, diving, cartwheels, balancing, back-handsprings, parkour, and so on.	Agility		PS: Barely succeed without calamity. S: Aptly perform. 1: Impressively perform. 2: Outstandingly perform. 3: Impossibly perform.	PF: Barely fail without calamity (if possible) or minor calamity. F: Unsuccessful. 1: Potentially minorly hurt yourselves or others. 2: Hurt yourself or others trying to perform. 3: Hurt yourself and likely allies.																			
2	Beastcraft	Using an understanding of an animal's emotions, intentions, and fears to calmly interact with, persuade, guide, or soothe them.	Charisma		PS: Barely succeed, but without understanding emotions/intentions. S: Understand surface emotion and intention, and interact successfully. 1: Interact with deeper understanding and control. 2: Build strong rapport and influence animal behavior. 3: Achieve near-perfect control and empathy with the animal.	PF: Misinterpret animal cues, minor setback. F: Fail to connect, animal agitated. 1: Animal becomes hostile, potential danger. 2: Animal attacks or fleas, significant risk. 3: Animal uncontrollable, severe threat to self and others.																			

Feats:
id	name	description	req_desc	ability_req	abil_req_val	skill_req	skill_req_val	feat_cat_req	pow_abil_req	mart_abil_req	pow_prof_req	mart_prof_req	speed_req	feat_lvl	lvl_req	uses_per_rec	rec_period	category	ability	tags	char_feat	state_feat											
1	'Skilled' Actor	When acting in a way that would require you to use a non-Charisma skill as part of the act you can roll that skill as part of the act, using your Act Skill bonus. Any outcomes of that Skill roll cannot have lasting effects after the act is over, unless those effects are negative.												1							true	false											
2	A Martial's Power	Choose one Power that only contains Power parts. You may add your Martial Proficiency to its relevant d20 rolls and potencies, treating it as a Power Proficiency for that Power. You may choose which Power this is after each Partial Recovery.												1				Utility		Power,Martial Bonus,	false	false											

Parts:
id	name	description	category	base_en	base_tp	op_1_desc	op_1_en	op_1_tp	op_2_desc	op_2_en	op_2_tp	op_3_desc	op_3_en	op_3_tp	type	mechanic	percentage	duration	defense						
1	True Damage	Add 1 damage to any Technique.	General	1.5	2	1.5 EN for each additional damage.	1.5	1							Technique	false	false	false							
2	Reaction	25% EN: This technique uses a Basic (or other) reaction instead of action.	General	1.25	0										Technique	true	true	false							

Properties:
id	name	description	base_ip	base_tp	base_c	op_1_desc	op_1_ip	op_1_tp	op_1_c	type																			
1	Damage Reduction	All Physical Damage (Damage that either targets your Evasion, Reflexes, or Might to hit, or is physical in nature) is reduced by this much.	1.5	2	3.5	Increase damage reduction by 1.	1.5	2	3.5	Armor																			
2	Armor Strength Requirement	You require at least 1 Strength to wear this Armor effectively.	-1.5	1	2.5	1 to Strength Requirement	-1	1	2.5	Armor																			

Creature Feats:
id	name	description	feat_points	feat_lvl	lvl_req	mechanic																			
1	Uncanny Dodge	When you are hit by an attack you can use a quick reaction to reduce the attack's damage by half.	3	1		FALSE																			
2	Resistance	Resistance to a damage type. 1 type per level of this feat	1	1		TRUE																			

ID's Reference: Important Id's and their names used for hardcoding ids' of parts, properties, etc that are used for mechanic energy costs, tp costs, etc hardcoded in creators or other uses. Use vanilla site to reference the utility and use of the following ids (many id's are included that aren't currently in use or needed, and can be ignored.)

Properties: 
id	name
1	Damage Reduction
2	Armor Strength Requirement
3	Armor Agility Requirement
4	Armor Vitality Requirement
5	Agility Reduction
6	Weapon Strength Requirement
7	Weapon Agility Requirement
8	Weapon Vitality Requirement
9	Weapon Acuity Requirement
10	Weapon Intelligence Requirement
11	Weapon Charisma Requirement
12	Split Damage Dice
13	Range
14	Two-Handed
15	Shield Base
16	Armor Base
17	Weapon Damage

Parts:
id	name
1	True Damage
2	Reaction
3	Long Action
4	Quick or Free Action
5	Split Damage Dice
6	Additional Damage
7	Add Weapon Attack
8	Reckless
9	Pass Through
10	Spin
11	Stun
12	Wind Up
13	Knockback
14	Slow
15	Daze
16	Wide Swing
17	Enemy Strength Reduction
18	Reach
19	Expose
20	Enemy Attack Reduction
21	Bleed
22	Situational Exploit
23	Upward Thrust
24	Strength Knock Prone
25	Pin
26	Grapple (Technique)
27	Crush
28	Body Block
29	Restrain
30	Takedown
31	Throw Creature
32	Throw Weapon
33	Leap
34	Reduce Multiple Action Penalty
35	Demolition
36	Slam
37	Head Butt
38	Weaken (Technique)
39	Make Vulnerable
40	Brace
41	Parry
42	Unarmed Hit(s)
43	Agile Knock Prone
44	Charge
45	Quick Strike/Shot
46	Disarm
47	Break Sight
48	Disengage
49	Catch Ranged Attack
50	Catch Melee Attack
51	Hide
52	Evade
53	Maneuver
54	Side-Step
55	Switch
56	Focus Hit
57	Rush
58	Vital Point
59	Feint
60	Goad
61	Menace
62	Rally
63	Defend
64	Resilience
65	Clash
66	Infiltrate
67	Hidden Attack
68	Penetration
69	Pinning Weapon
70	Command
71	Buck Shot
72	Spread Shot
73	Long Shot
74	Volley
75	Piercing
76	Curved Shot
77	First Blood
78	Splitting Shot
79	Attack / Potency Increase
80	Personal Power Linger
81	Power Long Action
82	Power Reaction
83	Power Quick or Free Action
84	Rite
85	Long Rite
86	Trigger on Condition
87	Delayed Effect
88	Line of Effect
89	Cone of Effect
90	Detect Creature Type
91	Detect Power
92	Detect Damage
93	Identify
94	Omen
95	Detect Traps
96	Locate Animals
97	Locate Plants
98	Locate Object
99	Locate Creature
100	Locate Creature on Overcome
101	Detect Invisibility
102	See Through Illusion
103	Sensor
104	Scry
105	Find Path
106	Enrich Plantlife
107	Liquid Walk
108	Create
109	Speak with the Dead
110	Health Summon
111	Power Summon
112	Neutral Summon
113	Raise Undead
114	Weapon Summon
115	Summon or Beast Senses
116	Resurrection
117	True Resurrection
118	Ward from Death
119	Irreducible Max Health
120	Stasis
121	Feign Death
122	Suppress Healing
123	Permanent Damage
124	Speed Increase
125	Adapting
126	Ability Increase
127	Jump
128	Skill Sharpen
129	Debuffing
130	Leave No Tracks
131	Restore
132	Greater Restore
133	Ability Restore
134	Enhancement
135	Deafen
136	Bane
137	Weakened Strikes
138	Battle Disable
139	Shield
140	Weaken
141	Expose Vitals
142	Weapon Damage Boost
143	Purify
144	Darkvision
145	Enlarge
146	Shrink
147	Gas Form
148	Guided
149	Invisible Power
150	Subtle Power Use
151	Cause to Lose Focus
152	Dousing
153	Flammable
154	Relocate Power
155	Interaction
156	Ability Roll
157	Evade
158	Brace
159	Focus (Action)
160	Search/Detect (Action)
161	Stealth/Hide (Action)
162	Combination Attack
163	Help (Reaction)
164	Defend
165	Outer Illusion
166	Massive Outer Illusion
167	Inner Illusion
168	Invisibility
169	Combat Invisibility
170	Disguise
171	Blind
172	Silence
173	Scry Time
174	Read Mind
175	Darkness
176	Fog
177	Modify Memories
178	Illusioned Power
179	Programmed Illusion
180	Dream
181	Enthrall
182	Compelled Duel
183	Disagreeable
184	Disorient
185	Nondetection
186	Body Swap
187	Take-Over
188	Compelling Sight
189	Suggest
190	Compelled Movement
191	Mind Break
192	Shift Focus
193	Curse
194	Communicate
195	De-motivate
196	Escalate
197	Vertigo
198	Aggravate
199	Friends
200	Indifference
201	Charm
202	Immune to Take-Over
203	Immune to Frightened
204	Immune to Charmed
205	Frighten
206	Mark Creature
207	Command Movement
208	Wall
209	Block
210	Power Armor
211	Reflect
212	Deflect
213	Counter
214	Absorb
215	Negate
216	Dispel
217	Permanent Dispel
218	Blessed
219	Resistance
220	Minor Resistance
221	Evasion Buff
222	Ward
223	Sanctuary
224	Condition Resistance
225	Condition Immunity
226	Connected Creatures
227	Impassible Aura
228	Power Resistance
229	Power Damage Resistance
230	Fall Resistance
231	Cylinder of Effect
232	Sphere of Effect
233	Trail of Effect
234	Pierce Targets on Path
235	Add Multiple Targets
236	Expanding Area of Effect
237	Target One in an Area of Effect
238	Exclude Area
239	True Magic Damage
240	True Light Damage
241	True Physical Damage
242	True Elemental Damage
243	True Poison or Necrotic Damage
244	True Sonic Damage
245	True Spiritual Damage
246	True Psychic Damage
247	Controlled Damage
248	Long-Linger Damage
249	Siphon
250	Damage Siphon
251	Power Infused Strike
252	Mend
253	Minorly Manipulate Air
254	Minorly Manipulate Earth
255	Minorly Manipulate Water
256	Minorly Manipulate Fire
257	Minorly Manipulate Elements
258	Tremors
259	Invisible Force
260	Detached Sound
261	Booming Voice
262	Altered Eyes
263	Flavor
264	Fire Manipulation
265	Plant Manipulation
266	Chill or Warm
267	Mark
268	Clean or Soil
269	Sensory Effect
270	Tiny Creation
271	Weather Sense
272	Understand Language
273	Tongues
274	Light
275	Thought
276	Distant Message
277	Breathe
278	Ping
279	Audio
280	Create Food
281	Create Water
282	Destroy Water
283	Create Object
284	Contact Divine
285	Commune with Divine
286	Commune with Nature
287	Contact Other Realm
288	Legend Knowledge
289	True Telepathy
290	Foresight
291	Noisy
292	Disintegrate
293	Passage
294	Magic Damage
295	Light Damage
296	Physical Damage
297	Elemental Damage
298	Poison or Necrotic Damage
299	Sonic Damage
300	Spiritual Damage
301	Psychic Damage
302	Duration Ends On Activation
303	No Harm or Adaptation for Duration
304	Focus for Duration
305	Sustain for Duration
306	Duration (Permanent)
307	Heal
308	True Heal
309	Overheal
310	True Overheal
311	Major Heal
312	Massive Heal
313	Healing Boost
314	Death Defying
315	Terminal Recovery
316	Stabilize
317	Regenerate
318	Revive
319	Restore to Life
320	Form Life
321	Become Wind
322	Manipulate Earth
323	Knock Prone
324	Controlling Summon
325	Escape
326	Create Difficult Terrain
327	Immune to Difficult Terrain
328	Scaled Slowing
329	Slow
330	Unlock
331	Lock
332	Teleport
333	Multi-Teleport
334	Advanced Teleport
335	Long Distance Teleport
336	Swap
337	Knockback
338	Propel
339	Daze
340	Restrained
341	Stun
342	Grapple
343	Control
344	Suspend
345	Circle
346	Forbiddance
347	Fly
348	Climbing
349	Vanish from Realm
350	Merge with Material
351	Remove Action Points
352	Flood
353	Part Liquid
354	Redirect Liquid
355	Control Weather
356	Mini-Demirealm
357	Demi Realm
358	Realmshift
359	Negate Gravity
360	Invert or Redirect Gravity
361	Increase Gravity
362	Gravity Center
363	Freeze Time
364	Rewind Time
365	Terraform
366	Growth
367	EmPowered Plant
368	Long-Linger On Surface
369	Add Weapon to Power
370	Destruction
371	Randomize
372	Half-Damage on Fail
373	Choose Affected Targets
374	Activate on Weapon Hit
375	Duration (Days)
376	Duration (Hour)
377	Duration (Minute)
378	Duration (Round)
379	Use Power Again on Overcome
380	Still Affects on Overcome
381	Different Effects Each Round
382	Decrease Multiple Action Penalty
383	Power Range
384	Requires Materials
385	Ends on Effect/Damage Threshold
386	Deadly Contingency
387	Immune to Effect on Overcome
388	Reverse Effects
389	Stipulation
390	Not Activated until Target Moves
391	One Round Adaptation
392	Targets Additional Defense
393	Proximity Requirement
394	Merged Potency
395	Transferred Effect
396	Target's Possession
397	Requires Skill Roll
398	Wish
399	Dispel Immune
400	Password
401	Choice
402	Split Power Parts into Groups
403	No Sightline Required
404	Multiple Overcome(s) Required
405	Swim
406	Polymorph
407	Shape-shift
408	Material Shape
409	Timeless
410	Sustain Body
411	Specified Exceptions
412	Specialized
413	Alternate Targeted Defense

Creature Feats:

id	name
1	Uncanny Dodge
2	Resistance
3	Immunity
4	Weakness
5	Pack Tactics
6	Flying
7	Flying II
8	Burrow
9	Burrow II
10	Darkvision
11	Darkvision II
12	Darkvision III
13	Blindsense
14	Blindsense II
15	Blindsense III
16	Blindsense IV
17	Amphibious
18	Bounding
19	Jump
20	Jump II
21	Jump III
22	Slow Walker
23	Regional Revival
24	All-Surface Climber
25	Sun Sickness
26	Sun Sickness II
27	Telepathy
28	Telepathy II
29	Compression
30	Waterbreathing
31	Unflankable
32	Mimic
33	Water Movement
34	Condition Immunity
35	Unrestrained Movement
36	Speedy
37	Speedy II
38	Speedy III
39	Slow
40	Slow II
41	Slow III
42	Resources
43	Resources II
44	Hover
45	Telepathically Intune
46	Hard to Stand Up
47	Undetectable
48	Mute
49	First Strike
50	Quick Hide
51	Turns to Dust
52	Beast of Burden
53	Claws and Fangs
54	Regenerative
55	Regenerative II
56	Regenerative III
57	Regenerative IV
58	Elemental Affinity
59	Elemental Affinity II
60	Elemental Affinity III
61	Instinct
62	Instinct II
63	Jaws
64	Lycanthrope
65	Lycanthrope II
66	Lycanthrope III
67	Fear Response
68	Mindless Rage
69	Champion
70	Champion II
71	Champion III
72	Champion IV
73	Champion V
74	Champion VI
75	This creature can't Speak
76	Returning Weapons
77	Power Resistant
78	Power Resistant II
79	Power Resistant III
80	Grapple Attacks
81	No Vision
82	Teleport
83	Teleport II
84	Teleport III
85	Large Attacker
86	Charger
87	Blood Rage
88	Blood Rage II
89	Blood Rage III
90	Blood Rage IV
91	Leaper
92	Constrictor
93	Constrictor II
94	Constrictor III
95	Constrictor IV
96	Tight Grapple
97	Tight Grapple II