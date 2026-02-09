This document contains all feedback with oldest first, newest last, that the owner of the website has given to AI agents to impliment, it may or may not have all already been implimented, but it has all be at one point sent to the AI agent to impliment and follow.

Newer/more updated feedback may build upon alraedy implimented changes, and overrides previous sugguestions if there's any conflict.

Refined react prompt

Role & Primary Goal

Role:
You are acting as a senior front-end architect working on an existing React / Next.js / Tailwind codebase.

Primary Goal:

Secondary Goal to consider while achieving primary goal:
Unify components, styles, and logic across the entire site while preserving existing functionality and behavior. The objective is to establish shared components and a single source of truth wherever possible, with only context-driven layout and scale adjustments as needed.

Core Philosophy of secondary goal

The biggest goal for the site is to create the best possible components and then unify them across the entire site for every possible use and utility. This should be done with only minor changes where necessary—specifically limited to layout positioning and scaling of component pieces so they better fit the available space on different pages or in different contexts. Color, typography, behavior, and interaction patterns should remain consistent across all uses of the same component.

Styling & Visual Consistency of secondary goal

Styles across the site should follow the same philosophy as components. Common fonts, capitalization rules, visual hierarchy, and color usage should be shared for titles, headers, paragraphs, and other text elements.

Interactive elements—such as arrow buttons, selection buttons, increase/decrease buttons, roll buttons, and similar UI controls—should each have a consistent visual identity within their category. The goal is for users to immediately recognize functionality based on appearance alone (for example, identifying a roll button because it always uses a specific color, font, and centered “+/–#” format).

Not all styles must be identical across the entire site, but elements that serve similar purposes should maintain strong consistency. For instance, all creator pages include a summary for the item being created; these summaries should share similar styles, formatting, placement, and color schemes.

All styles should adhere to a unified theme: primarily light and dark blues and grays, with occasional golden accents, and additional colors used purposefully (such as green for health and blue for energy).

Vanilla Site as Reference Authority: the vanilla site has a mostly functional version of the site we can reference for ideas of what we want our site to be capable of, but not necessarily how (since we are using different code and framework and components etc)

Feature completeness

When decisions are unclear, reference the vanilla site to understand how things should work. However, you are expected to make best-practice decisions when implementing these systems in React, including visual and structural improvements where appropriate. Improvements should enhance clarity, consistency, and usability without changing how the system fundamentally behaves. Do not stray from what the vanilla site does functionally.

Unification & Source of Truth

Across the React site, many pages share modules, code, and components that are so similar they could and should be replaced by shared components, shared logic, and shared styling systems.

If multiple implementations of the same concept exist in the codebase, you should:

Make an executive decision to select or create a single best implementation

Improve visuals and structure where reasonable

Treat that implementation as the singular source of truth

Replace other duplicates with that unified version

The original React site was created as a migration from the vanilla site, and much of the current code reflects fragmented, AI-generated implementations rather than intentional architecture. The goal now is to correct this and bring cohesion to the system.

Unused & Redundant Code

Many components and modules exist that were created but never properly implemented or reused. The codebase should be reorganized to:

Identify unused or redundant code

Determine what can be reused, fixed, or consolidated

Remove true dead code

Ensure all remaining code is clearly named, well-organized, and intentionally structured

Refactor Priorities

Identify and consolidate duplicate components and logic

Establish shared, reusable components as the source of truth

Enforce visual and behavioral consistency for functionally similar elements

Remove unused or redundant code

Apply layout and scale differences only when context requires it

the weapons section: the attack bonus and damage bonus should be calculated on the weapons poperties, ie without finesse or range a weapon uses the strength attack bonus, with finess it uses agility, with range it uses acuity, finess overrides, etc, all can be referenced to the vanilla site since it works.

there's also errors with with displayed ciritical range, ability requirements, and damge reduction for armor.

Even a fully power character should still show the attack bonuses for acuity, agility, strength, etc.

The two proficiencies added by species count against your skill points, not independent of them. When I allocated skills in the character creator, it doesn't save them when I switch tabs unless I specifically hit continue, it should save them automatically.

I still can't see armor or weapons from my library in the character creator to add them to my character. hide all unarmed prowess options in the character creator that are above level one since you can only make only level one characters.

Character Sheet: Can't equip items, can't select the equip dot. Also it should still be visible (the equip dot) outside of edit mode, allow equipping anything even without restriction. 

Some of the sections of the character sheet are too cramped horizontally, let's increase the entire working width of the character sheet by a bit to uncramp them (like the weapons section for instance is cramped.

The character library should only show currency on the equipment tab. The tab order should put feats first, not in the middle, and be default open to feats. order: Feats, powers, techniques, inventory, proficiencies, notes.

The height of the user library can match the height of the adjacent archetype section, same with the skills, so they all are the same height, even if they're empty. They can all match the height of the archetype section. 

The character library should have headers, and list items, same style as all others across the site (like codex/library, reusing their components and styles and so on for clarity) with adjustments to match the character sheet needs specifically. For instance:

Feats tab: Traits can have the header Traits (in place of the normal header name) then description, and finally uses and recovery, those are the only headers traits need. Same for archetype and character feat headers, truncated 

in the archetype section remove the subtext "power" or "martial" from below the title archetype proficiency. rename the archetype proficiency section to "Archetype & Attacks" Refined react prompt

All of the purple color we associated with powers should be a lighter color, the purple is too striking. we can unify the colors used for representing powers across the site, same with color representing armaments/martial/techniques, etc.

Role & Primary Goal

Role:
You are acting as a senior front-end architect working on an existing React / Next.js / Tailwind codebase.

Primary Goal:

Secondary Goal to consider while achieving primary goal:
Unify components, styles, and logic across the entire site while preserving existing functionality and behavior. The objective is to establish shared components and a single source of truth wherever possible, with only context-driven layout and scale adjustments as needed.

Core Philosophy of secondary goal

The biggest goal for the site is to create the best possible components and then unify them across the entire site for every possible use and utility. This should be done with only minor changes where necessary—specifically limited to layout positioning and scaling of component pieces so they better fit the available space on different pages or in different contexts. Color, typography, behavior, and interaction patterns should remain consistent across all uses of the same component.

Styling & Visual Consistency of secondary goal

Styles across the site should follow the same philosophy as components. Common fonts, capitalization rules, visual hierarchy, and color usage should be shared for titles, headers, paragraphs, and other text elements.

Interactive elements—such as arrow buttons, selection buttons, increase/decrease buttons, roll buttons, and similar UI controls—should each have a consistent visual identity within their category. The goal is for users to immediately recognize functionality based on appearance alone (for example, identifying a roll button because it always uses a specific color, font, and centered “+/–#” format).

Not all styles must be identical across the entire site, but elements that serve similar purposes should maintain strong consistency. For instance, all creator pages include a summary for the item being created; these summaries should share similar styles, formatting, placement, and color schemes.

All styles should adhere to a unified theme: primarily light and dark blues and grays, with occasional golden accents, and additional colors used purposefully (such as green for health and blue for energy).

Vanilla Site as Reference Authority: the vanilla site has a mostly functional version of the site we can reference for ideas of what we want our site to be capable of, but not necessarily how (since we are using different code and framework and components etc)

Feature completeness

When decisions are unclear, reference the vanilla site to understand how things should work. However, you are expected to make best-practice decisions when implementing these systems in React, including visual and structural improvements where appropriate. Improvements should enhance clarity, consistency, and usability without changing how the system fundamentally behaves. Do not stray from what the vanilla site does functionally.

Unification & Source of Truth

Across the React site, many pages share modules, code, and components that are so similar they could and should be replaced by shared components, shared logic, and shared styling systems.

If multiple implementations of the same concept exist in the codebase, you should:

Make an executive decision to select or create a single best implementation

Improve visuals and structure where reasonable

Treat that implementation as the singular source of truth

Replace other duplicates with that unified version

The original React site was created as a migration from the vanilla site, and much of the current code reflects fragmented, AI-generated implementations rather than intentional architecture. The goal now is to correct this and bring cohesion to the system.

Unused & Redundant Code

Many components and modules exist that were created but never properly implemented or reused. The codebase should be reorganized to:

Identify unused or redundant code

Determine what can be reused, fixed, or consolidated

Remove true dead code

Ensure all remaining code is clearly named, well-organized, and intentionally structured

Refactor Priorities

Identify and consolidate duplicate components and logic

Establish shared, reusable components as the source of truth

Enforce visual and behavioral consistency for functionally similar elements

Remove unused or redundant code

Apply layout and scale differences only when context requires it

Website Fixes:

Login: After logging in, we're redirected to the character page, how about instead it redirects us to the last page we were on when we first clicked whatever directed us to the login page (home page, character page, creator page when trying to save a power unlogged in etc etc.)

Ability allocation component (component shared): It should say "Next: 2 Points" instead of 3, since it's only 2 extra for 4+ ability increases.

Health/Energy Allocation: Rename it Health/Energy Allocation instead at the top.

Page Content Width Layout: The size of the margins on the borders of a pages content are larger/smaller than that of other pages, what if we made the page content of all pages (other than unique ones like home, login etc) to be the same width for consistency? Such as the width of the codex/library? what is best practice width for page content?

Creature Creator Basic Information: The Level dropdown width is too wide, and it seems the dropdown boxes aren't aligned with the name input box horizontally, the level/type/size dropdown selection boxes are lower set slightly.

Creature Summary: In the other creators this creature summary scrolls down with the user as the page scrolls, but it doesn't in the creature creator, also it seems too tall, it should fit the height of the content within it.

Character Creator Ancestry Tab: the + selection buttons should be centered vertically with each trait, and larger as well so it's easier to click, I personally wouldn't mind updating this selection button to not have a border around it circularly, instead just a + or check icon with hover effects and animation to change to green check. This might look more sleek. The same icon can be used to add and select items, the select version obviously becoming the check, the add version (like to open a modal) obviously having hover and click animations but no change to a check since it's a button rather than a selection circle. Thooughts? it'd match the style of the "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-4 h-4" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>" or something like it in the equipment tab of the character sheet.

Character Sheet Equipment Tab (and other tabs): It looks like when I previously had an AI agent implement the + symbol it d

Website Fixes:

Selection button & Add new Button styles: Currently we have a selection button (+ to check when selected) and multiple "add X" buttons (ie add power, add skill, add equipment, etc). I think I want both of these buttons to have a style of "+" that looks like the current equipment tab header buttons used to add new weapons armor or equipment, simple background less larger"+" icons that are modern, sleek, and clean. (html reference element "<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-4 h-4" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>"). Then, the select button would have this same style, but obviously when you hit it, instead of opening a modal to add weapons or feats or whatever, it'd turn into a backgroundless green check instead (preferably with animation) matching the sleek design. All of these two different things wouldn't need borders on click or even titles in most cases since in most cases it'll be self explainitory what they're for (reference equipment tab, where they're on the far right of the header for equipment, armor, and weapons, clearly each add with add one of those corresponding).

Character Creator Ancestry Tab: the + selection buttons should be centered vertically with each trait, and larger as well so it's easier to click. These are another example of the updated selection button above.

Character Sheet Equipment Tab (and other tabs): It looks like when I previously had an AI agent implement the selection buttons for armor, it added the component to weapons and armor? unsure the function though. The character sheet equipment tab also lacks the same style/design as the codex/library has with headers/list items, etc.

Entire Website: the down/up arrow for expanded list items is often at the far right of the list item, but sometimes due to spacing or some other issues it wraps around to below/above the rest of the list items information causing the item to expand it's vertical width to accomidate, it looks clunky, isn't graceful, etc. let's remove the open close arrow that points up and down upon item opening, it's not technically needed and adds a column that we don't need to spend space on.

Lists: There are margins between each list item in lists like codex, library, and many other areas. While most of them should be using the same styles and design (to match the styles and design of a codex/library list, with headers, filters, search etc), many still lack this fully and we need to audit and implement it. Note: many of these such lists will not have the full array of filters/details as the library and codex, for instance some may only have 1 or 2 of the headers the codexes version would've had, may only have 1 or 2 filters instead of many, may omit the filters entirely, or the search bar, etc. The goal is that our shared components can handle these differences while still maintaining quality shared components, styles, etc, and consistency in the stylization of each list instance within core components and modules that can be gracefull edited and adapted in only a minimal number of locations to update an entire sitewide of fixes and updates. this is why unification and simplicity of the site design are so paramount.

List Style Notes: Between the header row and the list items themselves, make a margen (the same vertical height as the margin between each of the list items). Also, shrink the margin between list items slightly (and make that list-header margin the same height). Remove all "counts" from all lists across the site, we don't need to have the whole site reporting how much of xy or z in a list was found, it just adds to the vertical space, serves to only confuse users, etc. No lists anywhere need to list how many items are in that particular list. also, all list headers in modals, tabs, libraries, codex, etc etc, should be able to sort ascending/decending by header as we do in library and codex, this should be part of or its own shared component/functionality/code.

2/3/26 8:27 pm EST

Website fixes: 

Library Page: The armaments (weapons/shields with damage) don't display their weapon damage in the library page, this may be an issue elsewhere as well.

"Edit" Button for user library things (powers, tech, armaments) should redirect the user to a new tab with the relevant creator open and whatever they hit edit on already loaded in that creator (or loading at least).

"Duplicate" button should simply make a duplicate of the item (power, tech, armament) with an (x) after it's name ie Sword (1) or Sword (2) if it's a second copy and a sword (1) already exists and so on, it should not redirect the user to the creator, and add that duplicate to the users library.

Power Loading: The power's seem to properly save with all relevant parts, mechanics, and option level increases, but when they're displayed in a list such as library, character library, add power modal, etc, their energy, TP, and other details are entirely missing from them as if they're not fully saved, loaded, calculated, etc. Remember, powers have the saved id's of parts and mechanics, but not the actual energy/tp data of those parts, that data is within the rtdatabase itself and needs to be retrieved and calculated upon loading a power. Similarly for techniques. Also armaments have some of the same issues sometimes, but with properties instead of powers.

RTDATABASE DATA REVIEW: feats data fields: id	name	description	req_desc	ability_req	abil_req_val	skill_req	skill_req_val	feat_cat_req	pow_abil_req	mart_abil_req	pow_prof_req	mart_prof_req	speed_req	feat_lvl	lvl_req	uses_per_rec	rec_period	category	ability	tags	char_feat	state_feat			, skills data fields: id	name	description	ability	base_skill	success_desc	failure_desc	ds_calc	craft_failure_desc	craft_success_desc																traits data fields: id	name	description	uses_per_rec	rec_period	flaw	characteristic                 species data fields: id	name	description	type	sizes	skills	species_traits	ancestry_traits	flaws	characteristics	ave_hgt_cm	ave_wgt_kg	adulthood_lifespan	languages	part_cont								skills: id	name	description	ability	base_skill	success_desc	failure_desc	ds_calc	craft_failure_desc	craft_success_desc																feats: id	name	description	req_desc	ability_req	abil_req_val	skill_req	skill_req_val	feat_cat_req	pow_abil_req	mart_abil_req	pow_prof_req	mart_prof_req	speed_req	feat_lvl	lvl_req	uses_per_rec	rec_period	category	ability	tags	char_feat	state_feat											parts: id	name	description	category	base_en	base_tp	op_1_desc	op_1_en	op_1_tp	op_2_desc	op_2_en	op_2_tp	op_3_desc	op_3_en	op_3_tp	type	mechanic	percentage	duration	defense						properties: id	name	description	base_ip	base_tp	base_c	op_1_desc	op_1_ip	op_1_tp	op_1_c	type																			creature feats: id	name	description	feat_points	feat_lvl	lvl_req	mechanic																				
    'Feats':     { arrayFields: ['ability_req', 'abil_req_val', 'skill_req', 'skill_req_val', 'feat_cat_req', 'tags'], boolFields: ['char_feat','state_feat'], numFields: ['pow_abil_req', 'mart_abil_req', 'pow_prof_req', 'mart_prof_req', 'speed_req', 'feat_lvl', 'lvl_req', 'uses_per_rec'] },
    'Skills':    { arrayFields: ['ability'], boolFields: [], numFields: ['base_skill', 'ds_calc'] },
    'Traits':    { arrayFields: [], boolFields: ['flaw', 'characteristic'], numFields: ['uses_per_rec'] },
    'Species':   { arrayFields: ['sizes', 'skills', 'species_traits', 'ancestry_traits', 'flaws', 'characteristics', 'adulthood_lifespan', 'languages'], boolFields: [], numFields: ['ave_hgt_cm', 'ave_wgt_kg'] },
    'Parts':     { arrayFields: [], boolFields: ['mechanic', 'percentage','duration'], numFields: ['base_en', 'base_tp', 'op_1_en', 'op_1_tp', 'op_2_en', 'op_2_tp', 'op_3_en', 'op_3_tp'] },
    'Properties':{ arrayFields: [], boolFields: [], numFields: ['base_ip', 'base_tp', 'base_c', 'op_1_ip', 'op_1_tp', 'op_1_c'] },
    'Creature_Feats':{ arrayFields: [], boolFields: ['mechanic'], numFields: ['feat_lvl', 'lvl_req', 'feat_points'] },
    'Items':     { arrayFields: [], boolFields: [], numFields: [] }

Which of these fields do you not understand the purpose of within the dtdatabase data for all these subrules (feats, parts, properties, species, etc etc)? I can help clarify what each field would have within it, which are boolean, etc if that would help, unless you can see the rtdatabase somehow.																	

9:00pm 2/3/2026

Ability Component/Module: Vitality in the character creator for some reason has a taller box than the rest, can we make sure they all have the same height instead? might be true everywhere with the ability component. Also, note: Abilities have VALUES also called BONUSES but not SCORES, in realms the roleplaying game, scores are equal to bonuses + 10, for instance, defenses are all scores, using ability bonuses. Bonuses in an of themselves are values you simply add to rolls, such as d20 rolls, ie a Strength roll is simply Strength + d20 (Strength is simply a value that is a bonus, not a score). so we need to rename this component, we usually just call Abilities, Abilities. So for this component/title in all locations it'd just be Assign Abilities, or whatever. Nitpicky note.

Scroll bars styles: across the site are many lists, modals with lists, sections that are too long, etc and many need to utilize scroll bars. We don't want to use the scroll bar that blocks out the right side of the list/section and looks clunky, what's better is a thin scroll bar that is invasive, grows when you hover near it so you can grab it if needed, and has a size inversely relative to the size of the list, it also should be above of the content with enough space in the margin to not need a long white strip behind it like the classic scroll bar. If we could implement and create this and implement it site wide, that'd be incredible. Use best practice for a simplistic, minimal code design. 

Add x Modals: These notes apply to all issues outlined in each modal they may appear in across the site. Modals are meant to be reusable across the site with centralized logic, and which pull styles/functionality/etc from other shared functions such as list view, filter, and header logic, etc.

Modals edges should be rounded not squared.

Some modals which utilize list items with headers don't allow sorting those header ascending/descending. 

Select/add buttons location: across the site, all "+" or add buttons in lists and in modals, as well as delete/remove buttons where relevant, should be located at the far right of the list item as opposed to the far left, since it's more intuitive for users to see a name at the far left, and click the add on the far right.

Some headers are spaced strangely in modals with list items

the far right header can be blank or "add" if it's a column with the "+" buttons. Also, when list items are expanded you can see the horizontal division line that shows the expanded area in a lightly grey color, which is good, however, there is a white column (the column with the + button) that remains in the expanded view and makes it look less sleek and clean, it should devide like the reast of the collapsed section does. 

Some list items still have arrows depicting if the modals list items are expanded or collapsed, this shouldn't be the case, we don't use expand/collapse arrows as the add to the space and can make lists less clean.

Some list items aren't utilizing headers for additional information, ie name, base skill, etc, instead they use different methods like (Base: Skill) which is actually more confusing for a user used to referencing headers, sorting by ascending/decending, etc.

Some modal lists show "# items available" at the top of a list or above the header, or below, etc, this is unneeded, we don't need a count of items in any lists or modals.

Headers in modals and elsewhere: a header doesn't need to be squared off/butt-joint the edges of a modal, tab/section etc. it can also have clean rounded edges that leave a margin, since this gives the impression of professionalism, sleek design, etc.

Skill Display/edit/allocation/adding: There are three distinct locations where users select skills, gain proficiency, lose proficiency, increase the skill value, see skill bonus, etc. This occurs 1. in the character sheet 2. the character creator 3. the creature creator. Each uses differen't code, different styles, and different functionality. We want to entirely rewirte all three to utilize the same exact styles/systems/components/modules so that we have a consistent visual and user experience with skills across the system. this means removing inline styles/code etc, and creating a robust component with variance and props that fit what each specific area needs.

The skill functionality that is the most robust currently is our character sheet skills, which has skill list display with skills/sub skills, skill points spent/available, prof, ability selection, bonus calc/display, bonus roll buttons (only needed in the character sheet, the roll buttons), and an add skill/add sub skill feature set with modals for adding skills and sub skills. Not all locations need the modal functions or the smaller design of the skill list in the character sheet, but what type of design, stylistic, and other choices could we make to best implement a unified skill component across all three locations? the character sheet needs modals for the adding functions since it's such a small area to have to fit adding skills in without a larger popout modal, but we can utilize the space we have in the other two areas (character creator/creature creator) again, we want this to be as clean, unified, and similar as possible.

9:47pm 2/3/2026

Website Fixes

Character Library - total refactor, unification, utilization of created components/modules/styles, etc.

All tabs sub section logic: We need to review the entire character library and it's many different styles, inline designs, sections, sub sections, line items, headers, etc. and fine unifying styles and principles to essentially re-write and unify between all tabs, ideally with many shared components/modules/styles etc.

summary/main top section: Some tabs have a main summary/top/information section. This should be the entire top of the tab (with rounded edges of course), things like innate energy, currency, armament proficiency, etc. They should all be in one neat section encompassed in a way that helps show they are a separate section form the rest of the tab, that is as compact/clean/sleek as possible and doesn't distract a user too much. This is for things such as innate energy/pool/power, armament proficiencies/currency in inventory (and later we may add carrying capacity here), proficiencies TP summary, and physical attributes and movement in the notes tab. We want to make a unified style for each, with clean organized and readable use that's intitive and doesn't take up too much vertical tab space with unneeded headers/titles.

tab sections: Almost all tabs are divided into sections, such as innate vs normal powers, traits, archetype, character, and state feats, weapons, armor, and equipment, proficiencies, notes, etc.

The ideal: 

The current best implementation of sleek clean looking sections titles/section separation in a tab is equipment, which uses a simple section header/title (we can remove the count of items to the right of them, we don't need a count of how many of the things there are) with the name of the section on the left, minimal ui, no background, and un-invasive. This is the type of standardized section title/header we should use for all tabs, and can be part of our unified component(s)/styles/modules.

to the far right of almost all section headers should be our helpful "add" button ("+") that is sleek, simple, and lets you open the relevant modal for adding whatever it is that section header would have you add, such as archetype feats, character feats, weapons, armor, etc etc.

list items/header: All tabs, below their section header/title as outlined above, should then have their list headers (like power/technique tabs have currently) which outline the name and other details of the list items below. The headers should be directly above the list items themselves and utilize the same styles, headers, ascending descending sort functions, etc as we have in the codex/library. Each will likely only have a few headers, and may have header columns for pure functionality such as a column for uses and recovery for traits and feats, quantity for equipment, equipped for armaments, etc. Buttons to remove. Single use functionality buttons (innate/equipped) can be at the lefthand of the collapsed list item, while quantity and uses can be at the right, with the far right reserved for x buttons for removable items in edit mode (or by default for equipment/armaments, these can be removed in any mode). Selection for equip/select innate should be the same relative size, centered vertically/left of the item, and large enough to easily select.

For interactive buttons such as the energy buttons for Powers/Techniuqes, damage roll buttons for Powers/Techniques/Weapons, etc, they can have their own columns and should be in a similar location as far as to the almost most right of an item card / as a header.

Specific Section titles/Headers (below any summary at the top of the tab): the following tabs have the following section headers/titles, followed by a "+" if there's a + at the far right of the section header/title row to add an item/note/open a modal, etc for whatever that row is as context dictates:

Feats Tab: Traits, Archetype Feats +, Character Feats +, State Feats +.

Powers Tab: Innate Powers + (when you hit this plus, it puts you in a psudo edit mode that lets you select powers in your list or deselect powers in your innate list and hit the plus again to finish/confirm what innate powers you selected, this is the only time other than edit mode the innate star at the far right of power list items will be visible indicating the abilit to make innate/uninnate), Powers +

Techniques: Techniques +

Inventory: Weapons +, Armor +, Equipment +

Proficiencies: Unarmed Prowess, Power, Technique, Weapon, Armor.

Notes: Appearance, Archetype Description, Other Notes + (to far right of section title/header to add custom notes with custom titles, in any mode not just edit)

Specific Section Item List Headers: Not all tabs need every single header the codex provides (ie feats/traits don't need all their headers they'd have normally in the codex for sorting). Instead, there's specific simplified headers/sections each tab/section/list of items needs as follows and in order from left to right:

Traits & feats: Name, Description (truncated in the collapsed traits), uses (on the list items, if they don't have uses, omit this section and it can be used for more description space before it's truncated, if they do have uses, than but the current/max number of uses in the uses column, within steppers, to the right of that put Partial or Full depending on if it's uses per partial or full recovery.

Traits can have a subtext for trait type (characteristic, Flaw, or Ancestry) that doesn't need a header to show.

State Feats can have subtext for if they're archetype or character in the state feat section. 

Powers: Name, Action, Range, Energy (clickable button with just the energy value with power archetype coloring, stlye of roll button but will spend the energy instead if used, unless innate, in which case it just says Innate (#) with the energy value and doesn't spend energy when selected), Damage (rollable, if any, otherwise omitted). All other details for the powers are visible in an expanded view, detailing the area of effect, duration, etc that were not included due to a limited space in the header row.

Techniques: Name, Action, Weapon, Energy (same energy format as powers button but with martial coloring instead and no innate options)

Weapons: Name, Range, TP, Currency, Rarity, Attack (roll button with proper attack bonus), Damage (rollable). Other details in expanded view that aren't includeded due to header space constraints but would be included normally.

Armor: Name, Damage Reduction (DMG RED if needs to be shortened), Critical range (CRIT RNG), TP, currency, Rarirty.  Other details in expanded view that aren't includeded due to header space constraints but would be included normally, such as agility requirement if any, and ability requirement if any, if we have space for these in the header we can abbrivate them and put them in before currency/rarirty.

For this character library refactoring use common sense, best practice, unification principles, context from the codebase, etc for best result implementation. Don't avoid implementing changes/removing inline designs because of what's been done before, use this as the guide.

10:00pm 2/3/2026

Website fixes review.

Modal fix notes: still can't utilize list header ascending/descending sorting, remove the "add" text from the column, it looked better w/o it. 

Many modal still don't have proper list views such as weapons, armors, equipments, powers, techniques. we need headers in the modals (to match the character library/library page headers) as well as list view mechanics like other modals such as feats and skills, these should already be shared components/styles that are utilized by all modals that add these things.

All header row/list header style update: a light blue for all list header works best and cleanest, header with headers for rows should be rounded at the edges and not go to the borders of the modal/tab/screen across the website, rounded edges brought in to match the list items would look sleeker and cleaner.

random: make the health below half color a yellower orange, it's too red right now and makes the health seem red before terminal, but it needs to be distinguishable enough from terminal red. we can also deepen the red of terminal red. 

allow editing character name with a pencil icon at the characters name, as well as editing character XP (not in edit mode, at any time you can adjust the XP value.) Auto-capitalize the characters power ability, not lower case. (charisma --> Charisma).

2/4/2026 4:00pm

Wesbite review: 

Character sheet: Capitalize all section list item headers, (name, uses, rec). Alter our shared components so that if there's no value for uses/recovery, we don't have "-" in it's place, instead it's empty space where the truncated description can spill over. Also, remove the "rec." row for recovery, we can simply but "PR" or "FR" representing full or partial after the uses without needing a second column (it will be part of the uses column)
'
Doesn't allow me to hit the innate stars to make powers innate, and also the stars need to be more vertically centered, larger to hit, etc.

Power loading errors: powers/techniques/armaments don't load/calculation their costs properly in list views, the energy and sometimes TP values are entirely wrong. 

Audit the previous owner feedback documents from today and yesterday and look for areas we missed, didn't fully implement, overlooked, etc. (use more recent notes over older ones, older notes are at top, newer is lower in the list).

Techniques aren't loading with energy or TP values.

inventory tab list items seem to still be different styles and stuff than the other tabs, do we hae inline styles? also the equip buttons don't work/equip the items, (assuming the "+" on the left are equip buttons) they also need to be more centered vertically and match sizing with the item list card thingy. Also inconsistencies with previous notes here as well.

Notes tab: no + to the right of custom notes. Again this was asked for in previous dialog, so there's likely many things overlooked.

Other: Character Creator Fixes: Automatically apply the species skills as being proficient, count it against the 5 skill points you have at level one. Reference vanilla site for how this works. You cannot remove these skills either. Also in the skill selection section you need to be able to choose the abilities each skill uses from a dropdown of abilities that skill has (reference vanilla site)

Character Sheet Fixes: when you hold down - or + for health, have it continuously increase/decrease at exponentially faster rate as you hold it.

Don't say which ability is the power/martial in  the abilities section, ie don't add the tab to an ability "Power" if it's your power ability like we have currently. Grow the width of the character sheet library to be 1/2 of the character sheet width instead of 1/3rd, make the archetype/skills sections 1/4 each. In the skills section, the ability for each skill was selected during character creation (defaulting to the highest ability among the abilities tied to that skill.) In the character sheet edit mode, you need to be able to change and select which ability each skill uses with a dropdown (like character creator) reference vanilla site for this functionality, skill calculations, etc. While not in edit mode, don't display spent/total skill points in the skills section. 

Skill edit mode: if you click the prof circle to become unprof in a skill you're prof in, unless it's a species skill, it needs to remove all skill points allocated to its skill value as well. When you increase the skill value of a skill that's unprof, spend that point instead on making it prof first, not increasing the value. see vanilla site for these functionalities.

rolling log: When you roll, the roll log should open to show the roll. Also, the styles and dice images used in the vanilla site roll log need to be used in the react site roll log. Reference vanilla site for the formatting of the roll log, reference of values rolled/hover/etc. try to model ours as much as possible after the vanilla site.

skill points spent on increasing a defense by one is costing 4 skill points instead of 2 for each defense increase. Also, there's discrepancy between the skill points tracked for defenses and skills. The defenses skill points count account for the spent skill points, but the skill skill points don't account for spent skill points for defenses. Getting the 4th point in an ability is only 1 ability point, it's each point after 4 (5, 6, etc) that costs 2 ability points each.

Edit mode: In the vanilla site edit mode, when you hit edit, the entire sheet remains mostly the same, except all the pencil icons that appear, once you hit one then it shows what that individual section of the character sheet can be edited, we also use green pencil, red, and blue to indicate if you've overspent, underspent, or fully spent points in that section, ie if you have 8 ability points and have spend 2, you have a green pencil showing to spend more, if 8 it's blue, if 9 it's red.

Character Creator refinment: The dark purple color we use to represent power is still too saturated of a purple. reduce saturation. have the martial a similar saturation as the purple for familiarity. (this applies to these colors across the site, since these theming colors are used often.

in the ancestry overview modal view on the species tab, flaws are a purple color, which is confusing since that's the same as powers, leave them uncolored.

In this same modal, allow the species skills chips to be clickable to show the skills description (using our chip logic component)

Traits in the ancestry tab could have more separation clarity, it's hard to tell once fromanother currently. Also we should utilize our "add" button "+" like we have in the character sheet, for selecting or adding ancestry traits, just like we use to add things in modals in the character sheet and across the site, a light blue + that becomes a light green check when selected (maybe with a swift animation from + to check) this is what this component or whatever should be (this add button)

for assigning ability scores, the descriptions of each ability shouldn't be in the ability "cards" themselves in the abilities tab, they should be in a sleek looking 3x2 section below the abilities with each of their names and descriptions, to make the abilities themselves look cleaner and less cluttered. Also remove the word "archetype" from selected abilities, since it clutters the ability card. Instead, make the current orange color, match the archetype color that they are using, for instance for a powered-martial character if they selected strength as their martial ability, and intelligence as their power ability, the power ability would be highlighted by the light purple, and strength that light red representing martial. This will be intuitive, this is how the character sheet should work as well.

"next: 3pt" is unneeded to display in the character creator since you can't allocate more than 3 at level 1 (new character) to begin with.

Skills tab: you start with prof in two skills (species) but you still have 5 points to spend since it doesn't consider your species skills to have one point in them to gain that proficiency. The whole allocate skills tab isn't super intuitive, it should be reflective of the character sheet skills section with more clarity/options. Skills should also expand to show descriptions/details like codex.

Feats Tab: Hide feats the character doesn't qualify for instead of simply greying them out, utilize the codex's components on this tab to load the entire list of feats as you would in the codex with all the filters, searching, etc. with the difference that all filters based on level, abilities, defenses, skill requiments, and so on, automatically apply those filters without needing to add those filters, based on the character itself. ( for instance any feats with feat level >1 would be filtered out, so would feats with level req > 1, all feats would also filter based on speed, skill, martial ability, martial prof, power prof, power ability, etc etc filters as well based on those values for the character. We don't want the two feat lists side by side, instead users can choose archetype/character feats filters from the codex identical layout. Also, stylize the color the archetype feats section to be the color of their chosen archetype (red, purple, or a gradient of the two from left to right if you chose both, red on the right, purple the left.)

Don't have two separate side by side lists for archetype and character feats, it only one sheet with all feat types. Also allow feats to expand and collapse without being selected unless you hit the + to select them specifically. 

Choose equipment: In an attempt to unify the react website's styles, variance, components, format, etc. The equipment tab lists could/should utilize the same style and format of tabs, lists, list items, etc as we utilize in codex (for equipment) and library (for weapons and armor) obviously with search and filters like we have, same styles, removed inline styles when possible, etc. we'd still need the -/+ buttons and values to add items in quantities, which don't appear on the original codex/library styles, but we have styles for these use cases as such  that we use in character sheet for instance.

the lists are missing the styling that the codex/library have for list items, and also missing headers like library/codex have! this issue is consistent across multiple areas in the site.

Powers & Techniques Tab: WE can use the "+" button we use for adding powers and techniques as we do elsewhere in the site, to unify the adding stuff button. The modals for adding techniques and powers should be made to be essentially exactly the same as the modals for adding techniques and powers as we have in the character sheet character library, we don't need two different styles of add techniques and powers modals. This same logic can be applied to the load modals in the power/technique/armament creators, and the add modals in the creature creator, etc.

The finalize tab doesn't have all the notes the character sheet does, also the character summary is ugly and doesn't summarize the character well, we don't really need it either, let's remove it or make it look better, make it more relevant for what a new player would want to see about their character, etc.

Health/Energy allocation/increase component, styles, props, variance: this comp is used across the character creator, creature creator, and when editing a character and altering HP/EN. I want to fix it to look better across all three. First, Health is green, make it green colors instead of red. Second the idea of "bonus" for health is misleading. Swap the place of the "Bonus" and the actual health/energy value itself. and rename the "bonus" to "points". For instance, when  I hit + on health in the component, I'll see my base health (8) with the "Points" representing additional allocated points in the less visible off to the right side location the other one was at before. This should be common sense, think about what a TTRPG player would fine the most intuitive and clear. (seeing their total health, or thinking in terms of a bonus and having to manually consider how much that bonus effects the total). ( don't want bars! I want numbers, bars don't make sense since there's no "current/max" when allocating!

All items select items issue: the expand collapse functions fail because slecting anywhere on a list item


2/9/26

Admin Codex Editor: If feat level requirement is 0 display - instead of "0" in the list.
When I delete a list item, the list still shows the item until I refresh the page. Can use the same ui, filter, styles, etc as the codex here to consistency with the exception of the pencil/trash icons for edit and delete. True for all codex tabs. don't need different/repeated styles/ui as they're the same essentially.

Feat Editing: Should be able to choose ability from a dropdown of the six ability and six defense options, you can pick one or more.

missing feat editing options: the following are the different values a feat has that should be editable in some way/shape/or form in edit mode - name	description	req_desc (requirement description)	ability_req (ability requirement, the name(s) array of ability or defense, (out of the twelve abilities/defenses there are) to gain the feat.	abil_req_val (ability requirement value, the minimum number said ability or defense must be, (out of the twelve abilities/defenses there are) to gain the feat. if ability req was Agility, Fortitude and ability req val was 3, 4 it'd mean you need a 3 agility, and a 4 fortitude bonus to fain the feat. (ability requirement value, the minimum number said ability or defense must be, (out of the twelve abilities/defenses there are) to gain the feat.	skill_req (names of skill(s) required to gain feat	skill_req_val (in order array of values each said skills BONUS must be to gain the feat)	feat_cat_req (a category of feat you must have one of in order to gain this feat, ie if the category was "Defense" you'd need another feat that had the category "Defense" in order to gain the feat.	pow_abil_req (the required value for your Power Ability ot be to gain the feat)	mart_abil_req (the minimum required value your martial ability needs to be to gain the feat)	pow_prof_req (the minimum value your Power Proficiency needs to be to gain the feat)	mart_prof_req (same for martial proficiency, needed to giaan the feat)	speed_req (character/creature speed requirement to gain the feat)	feat_lvl (the level of the feat itself, if it has lesser feat levels such as Bloodlust II vs Bloodlust III or Bloodlust, are levels 2, 3, 1, respectively. no level implies no higher level of feat)	lvl_req	character level required to gain the eat, uses_per_rec number of uses (max) you have of the feat before you regain them on said recovery	rec_period the recovery period (Full or Partial) you need to regain uses of your feat	category	ability (another sorting criteria, of the six abilities and 6 defenses, whatever ties best to this feat can classify as an ability, can be an array with more than one)	tags (array of sorting criteria, tags)	char_feat (Boolean true or false if this is a character feat, if not, it's an archetype feat by default.)	state_feat (Boolean true or false, if this is true, this is a state feat in addition to it's other feat time ie character or archetype).

I'd love if we had a centralized location for all our arrays of data/tables with descriptiosn of each values that ai can reference to clarify it's utility. For all codex items this is essential as well. Do our best in this area.											

lag: when inputting data in edit mode, it seems to have some lag while typing/deleting.

All editing modals: When it comes to arrays, you should be able to select and add from a dropdown for some arrays, or separate by commas if that's the only option when editing. For instance, skills for species should be a dropdown of skills you can add, not a "ids separated by commas" since admins don't have ids memorized of skills

Roll logs/Campaigns/Encounters: Allow attaching a campaign to an encounter upon creation or within the encounter, this allows you to click a button "Add all Characters" or something that lets you add all the characters from the campaign into the encounter automatically. I also see that encounter combatants are not fully loading with their accurate current/max energy and health (when the combatant is tied to a users character). add a roll log (same ui/functionalty/styles as the character sheet) to encounters for RM to use to make rolls (privately, not to the campaign) but which also has the tabs so they can see the rolls in their campaigns)

in the encounter tab (roll log campaign mode), character sheet (campaign mode), and campaign page, make the roll log styles consistent, ensure it shows the roll date, most say "unavailable" for the date. also rolls should be REAL TIME synced between characters and campaigns and other characters/users, so we may need to update the database, supabase settings, and so on to make it real time. The other realtime data would be current health and energy synced between encounters and the characters themselves.

Character visibilty: When a user sets a character to public, anyone else should be able to copy the link to that character and use it in their browser to see the character, with the exception that they wouldn't be allowed to edit ANYTHING. is it's set to campaign only, the RM and other users in the campaign should be able to see (not edit) it. If it's set to private and they join a campaign, it should automatically set the character privacy to campaign only (make a notifcation when they join a campaign with a private character that it will set the characters visibility to campaign only. Note: Since characters use powers, techniques, armametns, items, etc which are also from users private library, these also would need to be visible to others, again, without editing privilages.