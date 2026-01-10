# RealmsRPG React Migration Audit Report

**Generated:** January 9, 2026  
**Last Updated:** January 9, 2026 (Implementation Pass 1)  
**Scope:** Comprehensive comparison of vanilla site (`public/`) vs React site (`realms-rpg-next/`)

---

## Executive Summary

The React migration is approximately **75% complete** (up from 65%) with good architectural foundations. Recent fixes have addressed critical styling and functionality gaps.

### Recent Fixes Completed

1. ✅ Character portrait loading (CharacterCard)
2. ✅ Load from Library functionality for all 3 creator tools
3. ✅ Rules page Google Docs iframe
4. ✅ Resources page PDF download
5. ✅ Header/Footer styling (colors, spacing, layout)
6. ✅ Button gradient variant
7. ✅ Chip category color variants
8. ✅ Privacy/Terms full content
9. ✅ Auth layout with brand section + D20s

### Migration Status by Area

| Area | Completion | Priority |
|------|------------|----------|
| Authentication | 85% | Medium |
| Header/Footer | 70% | Medium |
| Home Page | 95% | Low |
| Characters List | 75% | High |
| Character Creator | 70% | High |
| Character Sheet | 80% | High |
| Codex | 90% | Low |
| Library | 75% | Medium |
| Power Creator | 65% | High |
| Technique Creator | 65% | High |
| Item Creator | 65% | High |
| Creature Creator | 25% | Critical |
| Encounter Tracker | 60% | High |
| Rules/Resources | 20% | Medium |
| Legal Pages | 40% | Medium |
| CSS/Design System | 75% | Medium |

---

## Critical Issues (Must Fix)

### 1. Creature Creator - Severely Incomplete (Priority: CRITICAL)

The React Creature Creator is a skeleton compared to the vanilla version:

**Missing Features:**
- [ ] Archetype Proficiency (Power/Martial) allocation
- [ ] Fractional levels (1/4, 1/2, 3/4)
- [ ] Resistances, Weaknesses, Immunities configuration
- [ ] Condition Immunities
- [ ] Senses configuration (15 options)
- [ ] Movement types (14 options)
- [ ] Languages input
- [ ] Powers section with library modal
- [ ] Techniques section with library modal
- [ ] Feats section
- [ ] Armaments section
- [ ] Firebase save/load integration
- [ ] Defenses calculation (Might, Fortitude, Reflex, etc.)
- [ ] Skill points allocation
- [ ] Hit-Energy pool allocation

**Files to Update:** 
- `src/app/(main)/creature-creator/page.tsx`
- Create: `src/components/creature-creator/` folder with modular components

### 2. Creator Tools - Missing Load Functionality (Priority: HIGH) ✅ FIXED

All three creator tools (Power, Technique, Item) now have "Load from Library" functionality:

- [x] Add "Load from Library" button
- [x] Create library selection modal (`LoadFromLibraryModal` component)
- [x] Populate form with loaded item data
- [x] Support loading existing items for editing

**Files Updated:**
- `src/components/creator/LoadFromLibraryModal.tsx` (NEW)
- `src/app/(main)/power-creator/page.tsx`
- `src/app/(main)/technique-creator/page.tsx`
- `src/app/(main)/item-creator/page.tsx`

### 3. Power Creator - Missing Advanced Mechanics (Priority: HIGH)

The React Power Creator is missing the collapsible "Advanced Power Mechanics" section:

- [ ] Action mechanics (chip selection)
- [ ] Activation mechanics
- [ ] Area of Effect mechanics
- [ ] Duration mechanics
- [ ] Target mechanics
- [ ] Special mechanics
- [ ] Restriction mechanics
- [ ] Apply Duration to Damage checkbox
- [ ] Multiple damage rows support

### 4. Character Creator - Missing Firestore Save (Priority: HIGH)

The React character creator stores data in Zustand but doesn't save to Firestore:

- [ ] Implement `saveCharacterToFirestore` in finalize step
- [ ] Port comprehensive validation from vanilla (`validateAndSave`)
- [ ] Add validation modal with friendly messages
- [ ] Implement redirect to characters list after save

### 5. Characters List - Portrait Not Loading (Priority: HIGH) ✅ FIXED

Character portraits now load correctly:

```tsx
// Fixed in character-card.tsx:
src={character.portrait || FALLBACK_AVATAR}
```

**Files Updated:**
- `src/types/character.ts` - Added portrait to CharacterSummary
- `src/services/character-service.ts` - Added portrait mapping
- `src/components/character/character-card.tsx` - Uses character.portrait

---

## High Priority Issues

### 6. Encounter Tracker - Missing Game Features

- [ ] Action Points (AP) tracking with reset on turn end
- [ ] Surprise round handling (Apply Surprise checkbox)
- [ ] Ally/Enemy toggle for initiative alternation
- [ ] Decaying condition levels (Bleeding 3 → 2 → 1)
- [ ] Acuity score for tie-breaking
- [ ] Drag-and-drop reordering
- [ ] Custom condition support

### 7. Library Page - Generic Item Display

The Library page uses a generic `ItemList` component that doesn't show type-specific columns:

**Powers should show:** Energy, Action, Duration, Range, Area, Damage  
**Techniques should show:** Energy, TP, Action, Weapon, Damage  
**Armaments should show:** Type, Rarity, Currency, TP, Range, Damage

- [ ] Create `PowersList`, `TechniquesList`, `ArmamentsList` components
- [ ] Rename "Items" tab to "Armaments" for consistency

### 8. Character Sheet - Missing Features

- [ ] Notification dot on Edit button when points are unapplied
- [ ] XP display with level-up threshold indicator
- [ ] Level-up gating based on XP threshold
- [ ] +/- buttons for Health/Energy outside edit mode
- [ ] Increase max-width from 1280px to 1400px

### 9. Rules Page - Missing Content ✅ FIXED

Now embeds the Google Docs rulebook iframe:

```tsx
<iframe 
  src="https://docs.google.com/document/d/e/2PACX-1vR2In0Fvu9axM9bb85Ne2rSp5SEfBd3kA34a3IHtcR5fIJ4spxCVgWezaNtejtyaGGmLtG-WTTKbgbE/pub?embedded=true" 
  className="w-full border-0"
  style={{ height: '800px' }}
/>
```

### 10. Resources Page - Missing PDF Download ✅ FIXED

- [x] Add actual download link: `/Realms Character Sheet Alpha.pdf`
- [x] Restructured page to match vanilla layout
- [x] Added Coming Soon section with icons

---

## Medium Priority Issues

### 11. Header/Navigation Fixes ✅ FIXED

Updated header styling to match vanilla:
- [x] Background color `bg-[#f6f6f6]`
- [x] Border color `border-[#707070]`
- [x] Max-width `max-w-[1440px]`
- [x] Nav gap `gap-14`
- [x] Text colors `text-[#053357]` / `hover:text-[#0a5a94]`
- [x] Dropdown styling matches vanilla

### 12. Footer Fixes ✅ FIXED

Updated footer styling to match vanilla:
- [x] Background color `bg-gray-400`
- [x] Fixed height `h-10`
- [x] Font size `text-lg` with `font-semibold`
- [x] Layout `justify-between`

### 13. Authentication Pages Styling ✅ FIXED

Updated auth layout with side-by-side brand + form layout:
- [x] Add brand section (logo, tagline + description)
- [x] Add D20 decorative elements (D20_1-4.png)
- [x] Increase background image opacity
- [x] Split-screen responsive layout

### 14. Button Styling - Add Gradient ✅ FIXED

Added `gradient` variant to Button component:

```tsx
gradient: 'bg-gradient-to-r from-[#1a5c94] to-[#0a4a7a] text-white 
           hover:from-[#1a6aa8] hover:to-[#0d5a94] 
           focus-visible:ring-primary shadow-md'
```

### 15. Card Border Radius

```tsx
// Update Card.tsx:
// From: rounded-lg (8px)
// To: rounded-xl (12px)
```

### 16. Chip Variants - Add Category Colors ✅ FIXED

Added category color variants to `Chip.tsx`:
- action, activation, area, duration, target, special, restriction
- weapon, armor, shield
- feat, proficiency, weakness

### 17. Legal Pages - Incomplete Content ✅ FIXED

Both Privacy Policy and Terms of Service pages now have full content matching the vanilla site.

**Files Updated:**
- `src/app/(main)/privacy/page.tsx`
- `src/app/(main)/terms/page.tsx`
- Section 3: Disclaimer (warranties)
- Section 4: Limitations (liability)
- Section 5: Accuracy of materials
- Section 6: Links (third-party)
- Section 7: Modifications
- Section 8: Governing Law

---

## Low Priority Issues

### 18. Character Card Hover Animation

```tsx
// Add to CharacterCard:
className="... hover:-translate-y-1 transition-transform"
```

### 19. Empty State Positioning

Move empty state message inside grid or redesign for better UX.

### 20. Tab Styling Variant

Consider adding traditional underlined tab style as an option to match vanilla.

### 21. Damage Configuration Enhancements

- [ ] Add missing damage types: `light`, `ice`, `spiritual`
- [ ] Technique Creator: Add alt cost toggle

---

## React Improvements to Keep

These features are **better** in React than vanilla:

1. ✅ **TypeScript** - Full type safety
2. ✅ **Zustand + React Query** - Better state management
3. ✅ **Cloud Functions** - More secure save operations
4. ✅ **Loading skeletons** - Better loading UX
5. ✅ **Zod validation** - Better form validation
6. ✅ **Inline error display** - Better than alert() popups
7. ✅ **Reviews carousel** - Actually functional
8. ✅ **Role badges** on abilities - Visual clarity
9. ✅ **Proficiencies tab** in character sheet - New feature
10. ✅ **Attack/damage roll buttons** inline - Better UX
11. ✅ **Previous turn button** in encounter tracker
12. ✅ **ProtectedRoute HOC** - Clean auth guard pattern

---

## Recommended Implementation Order

### Phase 1: Critical Fixes (Week 1-2)
1. Fix character portrait loading
2. Implement character creator Firestore save
3. Add Load from Library to all creators
4. Complete Rules page with iframe

### Phase 2: Creature Creator (Week 2-3)
1. Build out creature creator form sections
2. Add resistances/weaknesses/immunities
3. Add senses/movement configuration
4. Implement powers/techniques attachment
5. Add Firebase save/load

### Phase 3: Tools Enhancement (Week 3-4)
1. Add Advanced Power Mechanics section
2. Add multiple damage row support
3. Enhance Encounter Tracker with AP/surprise
4. Create specialized Library list components

### Phase 4: Styling Alignment (Week 4-5)
1. Update Header/Footer styling
2. Update Button gradients
3. Add Chip category variants
4. Fix Card border radius
5. Update authentication page styling

### Phase 5: Content & Polish (Week 5-6)
1. Complete Privacy Policy content
2. Complete Terms of Service content
3. Add Resources PDF download
4. Add missing navigation links
5. Final QA and testing

---

## Files Modified Summary

### Components to Create:
- `src/components/creature-creator/` (full module)
- `src/components/library/PowersList.tsx`
- `src/components/library/TechniquesList.tsx`
- `src/components/library/ArmamentsList.tsx`

### Components to Update:
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Chip.tsx`
- `src/components/character/CharacterCard.tsx`
- `src/components/character-creator/steps/FinalizeStep.tsx`

### Pages to Update:
- `src/app/(main)/creature-creator/page.tsx` (major rewrite)
- `src/app/(main)/power-creator/page.tsx`
- `src/app/(main)/technique-creator/page.tsx`
- `src/app/(main)/item-creator/page.tsx`
- `src/app/(main)/encounter-tracker/page.tsx`
- `src/app/(main)/library/page.tsx`
- `src/app/(main)/rules/page.tsx`
- `src/app/(main)/resources/page.tsx`
- `src/app/(main)/privacy/page.tsx`
- `src/app/(main)/terms/page.tsx`
- `src/app/(auth)/login/page.tsx`

### Styles to Update:
- `src/app/globals.css` (add missing theme variables)
- `tailwind.config.ts` (if exists, add custom values)

---

## Appendix: Detailed Comparison Tables

### A. Page Route Mapping

| Vanilla Path | React Route | Status |
|--------------|-------------|--------|
| `/index.html` | `/` | ✅ Complete |
| `/pages/login.html` | `/login` | ⚠️ Styling gaps |
| `/pages/register.html` | `/register` | ⚠️ Missing links |
| `/pages/forgot-password.html` | `/forgot-password` | ⚠️ Missing links |
| `/pages/forgot-username.html` | `/forgot-username` | ⚠️ Missing mailto |
| `/pages/characters.html` | `/characters` | ⚠️ Portrait bug |
| `/pages/character-creator.html` | `/characters/new` | ⚠️ No Firestore save |
| `/pages/character-sheet.html` | `/characters/[id]` | ⚠️ Missing features |
| `/pages/codex.html` | `/codex` | ✅ Complete |
| `/pages/library.html` | `/library` | ⚠️ Generic display |
| `/pages/rules.html` | `/rules` | ❌ Placeholder |
| `/pages/resources.html` | `/resources` | ❌ No downloads |
| `/pages/privacy.html` | `/privacy` | ⚠️ Incomplete |
| `/pages/terms.html` | `/terms` | ⚠️ Incomplete |
| `/pages/my-account.html` | `/my-account` | ✅ Complete |
| `/tools/power-creator/` | `/power-creator` | ⚠️ Missing features |
| `/tools/technique-creator/` | `/technique-creator` | ⚠️ Missing features |
| `/tools/item-creator/` | `/item-creator` | ⚠️ Missing features |
| `/tools/creature-creator/` | `/creature-creator` | ❌ Skeleton only |
| `/tools/encounter-tracker/` | `/encounter-tracker` | ⚠️ Missing AP/Surprise |

### B. CSS Variable Alignment

| Variable | Vanilla | React | Aligned? |
|----------|---------|-------|----------|
| Primary colors | ✅ | ✅ | Yes |
| Status colors | ✅ | ✅ | Yes |
| Gray scale | Custom | Tailwind defaults | Partial |
| Button gradients | ✅ | ❌ | No |
| Hover states | ✅ | ❌ | No |
| Font mono | ✅ | ❌ | No |

---

*This audit should be used as a roadmap for completing the React migration. Priority should be given to Critical and High priority items, as these represent missing core functionality that users expect.*
