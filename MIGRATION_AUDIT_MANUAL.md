There are many inconsistencies between the current react site and the vanilla site in functionality. I have outlined in detail a few. I love the improvements the react site has made on ui and flow, but it has a lot of areas it can be improved or where it missed the mark entirely in migration. As you systematically review each and every one of these pages, issues outlined, and so on, ensure you thoroughly look through the vanilla site for how the functionality worked for each of the issues described.

General: Many creators and save functions aren't working properly and what's being saved isn't super consistent I think, just ensure best practice for properly saving and loading is being utilized.

Characters page: add character button gives no feedback when you hover it 

Character Creation page: the button to move on in character creation is gone (not visible)
No traits in the species (ids not being looked up?)
the + button doesn't show up until you have +3 in the stat (the increase button isn't visible)
only one feat total, should let you add one archetype feat and one character feat, plus one additional archetype feat for powered-martial characters, and two instead for martial characters.
many buttons / fonts are the same color as the background and aren't aesthetically pleasing or visible.
Current step highlight makes the text white and almost invisible, all the next steps are almost too greyed out to even see. continue button is invisible and can't be seen. clicking on a species on the species step should pull up a popup modal that shows all the species summary (the same as our cute sleek design for them in the codex, reference the vanilla site for this styles/layout of the species summary). species also don't have speed and usually have two sizes in an array from rtdb. once the popup modal for the species shows you can read through it, and hit "Pick Me!" to choose it and move onto ancestry, or pick "Nah..." to close the modal and look at others. or you could click outside the modal to look at the others as well. Next button on all steps is invisible. Ancestry tab has no species traits pulled (should use the species traits id's array, point to the traits collection in the rtdatabase, and display each of the species tratis, flaws, etc. based on if they are a flaw true, characterstic true, etc. it should let you select one to two ancestry traits (one extra for two if you chose the flaw, optional) and one characteristic.

Encounter Tracker: selected creature's initiative values are invisible when it's its turn. green bar on all added combatants has no purpose/ function. Adding a decaying condition (we need to rename these leveled conditions as they no longer decay) needs to allow you to right click it to reduce it's value. Need ability to add custom conditions (leveled by default) hitting x on decaying (now leveled) condition should remove it instead of decreasing a level. next turn button invisible. Each combatant should be able to be clicked and dragged to different order in the initiative. If it's that combatants turn when dragged, it remains their turn and continues in the order from the turn after theirs (in the new dragged position). Missing sort initiative button. When you start initiative it should sort according to how the vanilla site does it, with alternative initiative order for allies and enemies, in order of highest roll for initiative. ie if ally a has 2, b has 3, c has 4, and enemy a has 20, b has 19, c has 18, the order is enemy a, ally c, enemy b, ally b, enemy c, ally a, and so on. Ties are decided by who has the higher acuity, and if this is still a tie, alphabetical order can sort it, with allies going first if it's the first or top of initiative (since it's auto sorting.)

Creature Creator: (uses many of the same logic for character creator, and character sheet editing/leveling etc.) All of the increase buttons are invisible (likely too white on a white background) seems to be a common issue across the site with invisible white on white buttons and such. Across the entire site, gp is not a thing, we don't have gold, only currency, or "c" for abbreviation. ie 200 c not 200 gp. when taking a negative to an ability it should increase the available ability points to use, like the character creator or character sheet editing, etc. Proficiency isn't a main creature summary thing, rather it's points you have to allocate similarly to training points, ability points, etc. so allocating proficeicny points between power and martial proficeicny should take this into account, going into the negative if you overspend and so on. minimum energy should be equal to the highest ability other than vitality * level, similarly to how health minimum is vitality * level (unless negative, in which case vitality makes your base health negative but only applies at first level not each level after.) for fraction levels, energy and health have the same minimums as level one determined by vitality and highest ability other than vitality. I prefer how the vanilla site has health and energy increases, showing the minimum value as the base and allowing you to increase/decrease it down to the minimum, but not below, indiated by a color change of the decrease button. I also don't see where, if anywhere, feat points are tracked at. Feat points are essential to the creature creator. It also seems to be retriving feats for the creature from the feat list, but it's supposed to be using specifically the realtime database's creature feats, not normal feats as you'd expect. it's good the creature summary scrolls with you, but it's almost more important that the spendable values scroll with you (true about all creators) so you can see what your current spent values are at, how much more you can spend, etc. Finally, it's likely that you're not using the id's tied to certain creature feats to determine how many feat points addig things like weaknesses, resistances, immunities, senses, etc. Each of these is tied to a specific creature feat id with feat point value, or at least should be. no need to specify the ability has a cost of 1 in the assign ability scores section (this is assumed.) the expand collapse features of the skills page is odd, and I want you to purpose a new ui design for this page that is more intuitive and reflective of the edit mode for skills in the character sheet itself. Weapons equipment and armor don't seem to be loading in the character creator equipment page. Nither do powers or techniques.

Creators note: All creators use a similar system of saving loading, displaying spent resources/values/summaries, etc. (this is for the power, techniques, armaments, and creator creators specifically). We should seek for these all to be intuitively similar to eachother in layout and functionalty, not different from eachother. Find ways to do this. For instance the save and load buttons are in different locations with creature creator compared to other creators like power, technique, and etc. They don't need to be. This and many other differences make it unneccissarily unfamiliar. We want it to be for a user "you've learned one ui, you've learned them all!" essentially.

Codex/Library notes: The layout/format for codex and library should be almost identical, even if one has more details, more expanded information (chips and things) or filtering logic/ filters. They use similar systems of displayed lists of expandable and collapsible data (which is used all over the site!) so we really want to get these uniform with eachother and other pages, we don't want each page to be unique and different from the others, yes they each have their own function, but styles and flow shouldn't be. If we can unify much of the styles and how we approach these types of pages, collapsible features, etc. it will greatly improve the scalability and user experience for the website.

Library: the library creatures tab seems not to even be displaying creatures actual details at all, lacks structure like a creature stat-block design, etc. Reference vanilla site and improve upon the design that gives a clear idea of the creature, it's abilits, resistances, etc etc. we're emulating similar ttrpg stat-blocks on this tab. Ensure other library tabs also load things properly and displays them properly.

Codex: The armament properties and equipment tabs have no functionality like the others do for list items, expanding and collapsing, etc. This should be an easily copied module that can be used across the site for lists/list items like these. error for skills tab:" dc577b4d35bb12aa.js:1 Uncaught TypeError: e.charAt is not a function
    at dc577b4d35bb12aa.js:1:18062
    at Array.map (<anonymous>)
    at v (dc577b4d35bb12aa.js:1:18037)
    at av (fed4668fa8a3b3e5.js:1:63275)
    at oY (fed4668fa8a3b3e5.js:1:83548)
    at io (fed4668fa8a3b3e5.js:1:94980)
    at sc (fed4668fa8a3b3e5.js:1:138001)
    at fed4668fa8a3b3e5.js:1:137846
    at ss (fed4668fa8a3b3e5.js:1:137854)
    at u9 (fed4668fa8a3b3e5.js:1:133779)" error for database (no feats loading) "installHook.js:1 [rtdb-hooks] RTDB not initialized" equipment not loading either "[rtdb-hooks] No data found at path: equipment"
Species tab: the traits, flaws, etc are ids; not names. The id's are tied to the rt database traits lists. I want the species to have more unique display to show each of the traits, ancestry traits, flaws, characterists (currently not loading in) and so on, similar to how the vanilla site displayed them in their own categories and boxes within the expanded species list item. make it look cute with sleek clean ui. note, species don't have a related speed value, so don't add/show this at all. I also liked the 0-10 10-0 displays or ascending and decending for the headers, to the right of related headers. or in some cases it'd be "small-large large-small" such as with species sizes in the codex, or "partial-full, full-partial" for recovery periods for feats, etc. if we can add these and make them look sleek, clean, etc. that'd be great.

Power Creator: The basic power mechaics reflect a pattern in some creators, where some features will always be a consideration. Power creator is also essentially a more advanced technique creator, so what we do to it can likely be applied to technique creator if it relates. We are missing almost all of the basic mechanic options, such as duration, range, and area of effect with their related options. Additonally I see no advanced power mechanic options / the option to add them. You'll notice the duration logic for calculation is highly nuanced and it's important that power creator is done right so it's calculations are all robust and correct. again issues with invisible buttons for increase.Added damage doesn't seem to be tied to the proper part for base_en, tp, and other costs that relate to adding it. same is true for all the action mechaics, which need to be tied to the id's of parts in the rt database. I can provide a list of the parts you need and their id's, but the vanilla site was supposed to be using this method already. Added parts seem to be lacking the ability for their options to be displayed with their en, tp costs, as well as the ability to increase said options on the part. 
error when saving "power-creator:1 Access to fetch at 'https://us-central1-realmsrpg-test.cloudfunctions.net/savePowerToLibrary' from origin 'https://realmsrpg-test.web.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
2e369236c8c657e0.js:22  POST https://us-central1-realmsrpg-test.cloudfunctions.net/savePowerToLibrary net::ERR_FAILED
s @ 2e369236c8c657e0.js:22
N @ 2e369236c8c657e0.js:22
P @ 2e369236c8c657e0.js:22
await in P
i @ 2e369236c8c657e0.js:22
ei @ a9f0b36f81eacc77.js:1
sY @ fed4668fa8a3b3e5.js:1
(anonymous) @ fed4668fa8a3b3e5.js:1
tD @ fed4668fa8a3b3e5.js:1
s3 @ fed4668fa8a3b3e5.js:1
fC @ fed4668fa8a3b3e5.js:1
fP @ fed4668fa8a3b3e5.js:1Understand this error
installHook.js:1 Error saving power: FirebaseError: internal"

Technique Creator: Weapon type is not the correct name, it should simply be "Weapon" and it should allow you to select a weapon from your saved weapons (dropdown list only, no need for a modal). This is to use the TP cost of the add weapon part from the rt database, which id needs to be tied to this feature to discover the cost per TP based on that parts base_en essentially. It is not called stamina, it's called energy, exactly like the power creator, and it's parts.Added damage doesn't seem to be tied to the proper part for base_en, tp, and other costs that relate to adding it. same is true for all the action mechaics, which need to be tied to the id's of parts in the rt database. I can provide a list of the parts you need and their id's, but the vanilla site was supposed to be using this method already. nothing anywhere on the site is called stamina. Added parts seem to be lacking the ability for their options to be displayed with their en, tp costs, as well as the ability to increase said options on the part. 

Error when saving "Access to fetch at 'https://us-central1-realmsrpg-test.cloudfunctions.net/saveTechniqueToLibrary' from origin 'https://realmsrpg-test.web.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
2e369236c8c657e0.js:22  POST https://us-central1-realmsrpg-test.cloudfunctions.net/saveTechniqueToLibrary net::ERR_FAILED
s @ 2e369236c8c657e0.js:22
N @ 2e369236c8c657e0.js:22
P @ 2e369236c8c657e0.js:22
await in P
i @ 2e369236c8c657e0.js:22
ea @ 46a003cc957b6eb4.js:1
sY @ fed4668fa8a3b3e5.js:1
(anonymous) @ fed4668fa8a3b3e5.js:1
tD @ fed4668fa8a3b3e5.js:1
s3 @ fed4668fa8a3b3e5.js:1
fC @ fed4668fa8a3b3e5.js:1
fP @ fed4668fa8a3b3e5.js:1Understand this error
installHook.js:1 Error saving technique: FirebaseError: internal
overrideMethod @ installHook.js:1
ea @ 46a003cc957b6eb4.js:1
await in ea
sY @ fed4668fa8a3b3e5.js:1
(anonymous) @ fed4668fa8a3b3e5.js:1
tD @ fed4668fa8a3b3e5.js:1
s3 @ fed4668fa8a3b3e5.js:1
fC @ fed4668fa8a3b3e5.js:1
fP @ fed4668fa8a3b3e5.js:1Understand this error
5technique-creator:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received"

Item Creator (Should be renamed Armament Creator): Acessories aren't valid armaments to be added. remove that option. Depending on the armament selected (shield, armor, weapon) it needs to filter the available properties to be only those with the type selected (Weapon, Armor, or Shield), removing properties already added that don't fit that criteria. Again, issues with the hardcoded options not pointing to actual properties in the database based on id's such as for handedness, range, damage, etc. Rarity doesn't seem to be displaying or calculating, neither does it seem to be adding any item points nomatter the properties I add. Again missing the ability to see options for added properties, increase and decrease them see their descriptions etc. Summary doesn't seem to be showing the TP cost of proficiencies needed for properties that have TP costs either.
Errors saving items "Access to fetch at 'https://us-central1-realmsrpg-test.cloudfunctions.net/saveItemToLibrary' from origin 'https://realmsrpg-test.web.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
us-central1-realmsrpg-test.cloudfunctions.net/saveItemToLibrary:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
installHook.js:1 Error saving item: FirebaseError: internal
overrideMethod @ installHook.js:1Understand this error
item-creator:1 Access to fetch at 'https://us-central1-realmsrpg-test.cloudfunctions.net/saveItemToLibrary' from origin 'https://realmsrpg-test.web.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
us-central1-realmsrpg-test.cloudfunctions.net/saveItemToLibrary:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
installHook.js:1 Error saving item: FirebaseError: internal
overrideMethod @ installHook.js:1Understand this error
item-creator:1 Access to fetch at 'https://us-central1-realmsrpg-test.cloudfunctions.net/saveItemToLibrary' from origin 'https://realmsrpg-test.web.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
us-central1-realmsrpg-test.cloudfunctions.net/saveItemToLibrary:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
installHook.js:1 Error saving item: FirebaseError: internal"

Save Structure Reference: The save structure for the following things, along with one or two example values, are shown below.

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