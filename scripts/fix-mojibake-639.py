#!/usr/bin/env python3
"""TASK-639: Context-aware mojibake fix for AI_CHANGELOG + TASK_QUEUE_DONE archive.

Replaces corrupted '?' placeholders with the Unicode character best supported by
surrounding phrasing. Does NOT touch legitimate query-string literals in backticks.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "src/docs/ai/AI_CHANGELOG.md",
    ROOT / "src/docs/ai/archive/TASK_QUEUE_DONE.md",
]

EM = "\u2014"  # em dash
EN = "\u2013"  # en dash
ARR = "\u2192"  # right arrow
BARR = "\u2194"  # left-right arrow
SEC = "\u00a7"  # section sign
BULLET = "\u2022"  # bullet
PLUSMINUS = "\u00b1"  # plus-minus


def protect_backtick_segments(text: str) -> tuple[str, list[str]]:
    """Temporarily replace backtick spans so replacements skip URL query params."""
    store: list[str] = []

    def repl(m: re.Match[str]) -> str:
        store.append(m.group(0))
        return f"\x00BT{len(store) - 1}\x00"

    protected = re.sub(r"`[^`]*`", repl, text)
    return protected, store


def restore_backtick_segments(text: str, store: list[str]) -> str:
    for i, seg in enumerate(store):
        text = text.replace(f"\x00BT{i}\x00", seg)
    return text


def apply_replacements(protected: str) -> str:
    s = protected

    # --- Triple-question (most specific first) ---
    triple_rules: list[tuple[str, str]] = [
        (r"uuid\?\?\?text", "uuid→text"),
        (r"`-600`\?\?\?`-700`", "`-600`→`-700`"),
        (r"T(\d{3})\?\?\?T(\d{3})", r"T\1–T\2"),
        (r"TN\?\?\?TN", "TN–TN"),  # normalized leftovers unlikely
        (r"\?\?\?", ARR),  # default: right arrow for relocation/flow
    ]
    for pat, repl in triple_rules:
        s = re.sub(pat, repl, s)

    # --- Double-question ---
    double_rules: list[tuple[str, str]] = [
        (r"campaign_members \?\?3", "campaign_members (×3)"),
        (r"campaign_rolls \?\?3", "campaign_rolls (×3)"),
        (r" \?\? ", f" {EN} "),
    ]
    for pat, repl in double_rules:
        s = re.sub(pat, repl, s)

    # --- Section sign (REALMS / product doc refs) ---
    section_rules: list[tuple[str, str]] = [
        (r"REALMS \?(\d)", rf"REALMS {SEC}\1"),
        (r"in \?(\d)\.", rf"in {SEC}\1."),
        (r"product overview \?(\d)", rf"product overview {SEC}\1"),
        (r"REALMS \?5\.0/\?5", f"REALMS {SEC}5.0/{SEC}5"),
        (r"\?(\d+\.\d+)\?(\d+\.\d+)", rf"{SEC}\1–{SEC}\2"),
        (r"\?(\d+\.\d+)/\?(\d+\.\d+)", rf"{SEC}\1/{SEC}\2"),
        (r"\(\?(\d)", rf"({SEC}\1"),
    ]
    for pat, repl in section_rules:
        s = re.sub(pat, repl, s)

    # --- Task/test ID ranges (en dash) ---
    range_rules: list[tuple[str, str]] = [
        (r"TASK-(\d+)\?(\d+)", r"TASK-\1–\2"),
        (r"TASK-(\d+)/(\d+) done", r"TASK-\1/\2 done"),  # no-op guard
        (r"T(\d{3})\?T(\d{3})", r"T\1–T\2"),
        (r"Epic (\d+)\?(\d+)", r"Epic \1–\2"),
        (r"Phase (\d+)\?(\d+)", r"Phase \1–\2"),
        (r"CC-(\d+) audit items", r"CC-\1 audit items"),  # no-op
        (r"Wave (\d+)\?(\d+)", r"Wave \1–\2"),
    ]
    for pat, repl in range_rules:
        s = re.sub(pat, repl, s)

    # --- Directional arrows (word?word) ---
    arrow_rules: list[tuple[str, str]] = [
        (r"Martial\?techniques", "Martial→techniques"),
        (r"Power\?powers", "Power→powers"),
        (r"innate\?regular", "innate→regular"),
        (r"Energy\?threshold", "Energy→threshold"),
        (r"L1\?L3", "L1↔L3"),
        (r"L1\?L2", "L1→L2"),
        (r"L2\?L1", "L2→L1"),
    ]
    for pat, repl in arrow_rules:
        s = re.sub(pat, repl, s)

    # --- Specific phrase fixes ---
    phrase_rules: list[tuple[str, str]] = [
        (r"unify \? steppers", "unify ± steppers"),
        (r"bold \?", f"bold {PLUSMINUS}"),
        (r"bonus tones \?", "bonus tones →"),
        (r"omit \? disabled", "omit — disabled"),
        (r"keep \?\+italic", "keep — +italic"),
        (r"stack `\? Property`", f"stack `{BULLET} Property`"),
        (r"\? Property`", f"{BULLET} Property`"),
        (r"drop \?TP stays in L2\?", 'drop "TP stays in L2"'),
        (r"/ \?included in your path\? framing", '/ "included in your path" framing'),
        (r"sequenced TASK-(\d+) \? (\d+) and (\d+) \? \? (\d+) \? (\d+)",
         r"sequenced TASK-\1 → \2 and \3 → \4 → \5"),
        (r"Pushed `([a-f0-9]+)` \?\?\? Vercel", r"Pushed `\1` → Vercel"),
        (r"false positives \?\?\? `Test-Path`", "false positives — `Test-Path`"),
        (r"TYPE-01 \?\?\? `getTrainingPointLimit`", "TYPE-01 — `getTrainingPointLimit`"),
        (r"ARCH-01 \?\?\? combatant", "ARCH-01 — combatant"),
        (r"A11Y-01/02 \?\?\? `titleA11y`", "A11Y-01/02 — `titleA11y`"),
        (r"MOBILE-01 \?\?\? onboarding", "MOBILE-01 — onboarding"),
        (r"TOKEN-01 \?\?\? shared", "TOKEN-01 — shared"),
        (r"customization audit \?\?\? workflow", "customization audit — workflow"),
        (r"governance gaps \?\?\? logged", "governance gaps — logged"),
        (r"CC-26 audit items \?\?\? sticky", "CC-26 audit items — sticky"),
        (r"Full queue backup \?\?\? `archive/", "Full queue backup → `archive/"),
        (r"UX docs \?\?\? `src/docs/human/`", "UX docs → `src/docs/human/`"),
        (r"critical flows \?\?\? need QA", "critical flows — need QA"),
        (r"\*\*TASK-(\d+)\*\* \?", r"**TASK-\1** —"),
        (r"\*\*TASK-(\d+)\*\* \? exported", r"**TASK-\1** — exported"),
        (r"unit test\. \*\*TASK-(\d+)\*\* \? replaced", r"unit test. **TASK-\1** — replaced"),
        (r"sum \? progression Innate Energy", "sum ≤ progression Innate Energy"),
        (r"Labels \? See more / More details", "Labels — See more / More details"),
        (r"path deep-dive in \?5\.1", f"path deep-dive in {SEC}5.1"),
        (r"Chore \? no behavior change", "Chore — no behavior change"),
        (r"finale \? clickable", "finale — clickable"),
        (r"gaps \? GLR property", "gaps — GLR property"),
        (r"feedback \? task filing", "feedback — task filing"),
        (r"debt recorded \? mechanical", "debt recorded + mechanical"),
        (r"overhaul audit \? blocked", "overhaul audit — blocked"),
        (r"Remaining: implement TASK-476\?481", "Remaining: implement TASK-476–481"),
        (r"Audit pass vs ACs \? fixed", "Audit pass vs ACs — fixed"),
        (r"post-overhaul audit \? blocked", "post-overhaul audit — blocked"),
        (r"post-done gaps vs PR checklist \? labeled", "post-done gaps vs PR checklist — labeled"),
        (r"post-done audit vs PR checklist \? labeled", "post-done audit vs PR checklist — labeled"),
        (r"audit vs constitution DoD \? covered", "audit vs constitution DoD — covered"),
        (r"Closed constitution gaps \? recommended", "Closed constitution gaps — recommended"),
        (r"Closed post-wave gaps \? GLR", "Closed post-wave gaps — GLR"),
        (r"Closed post-done gaps vs PR checklist \? usage", "Closed post-done gaps vs PR checklist — usage"),
        (r"from post-overhaul audit \? blocked", "from post-overhaul audit — blocked"),
        (r"agent-instance judgment \?\?\? many", "agent-instance judgment — many"),
    ]
    for pat, repl in phrase_rules:
        s = re.sub(pat, repl, s)

    # --- Standard title separators: "verb ? rest" → em dash ---
    title_verbs = (
        "done|audit|follow-up|applied|fixes|cleanup|batch|start|complete|"
        "filing|recorded|compliance|overhaul|pass|closed|audit follow-up|"
        "DoD audit|audit \\+|Session audit fixes|product/rules audit|"
        "Remediation full review|Remediation Wave|Feat/trait customization audit|"
        "Character creator audit|Choice-card hero art|species card art pipeline|"
        "Card disclosure labels|Guided equipment audit|Epic|Audit TASK|"
        "Powers/Techniques guided feedback|Audit follow-up|SQL applied"
    )
    s = re.sub(
        rf"\b({title_verbs}) \? ",
        rf"\1 {EM} ",
        s,
        flags=re.IGNORECASE,
    )

    # Remaining " ? " in summary prose (conservative: em dash)
    # Exclude patterns already fixed; only replace isolated " word ? word "
    def spaced_q_repl(m: re.Match[str]) -> str:
        left, right = m.group(1), m.group(2)
        # Skip if looks like code
        if right.startswith("`") or left.endswith("`"):
            return m.group(0)
        return f"{left}{EM} {right}"

    s = re.sub(r"([\w\)\*\"']) \? ([\w\(`\*\"'])", spaced_q_repl, s)

    # --- Second pass: remaining edge patterns ---
    pass2_rules: list[tuple[str, str]] = [
        # bullet in backticks
        (r"`\? Property`", f"`{BULLET} Property`"),
        # section refs after § already applied
        (r"§(\d+\.\d+)\?(\d+\.\d+)", rf"{SEC}\1–{SEC}\2"),
        (r"/\?(\d+\.\d+)", rf"/{SEC}\1"),
        (r"feedback/\?(\d+\.\d+)", rf"feedback/{SEC}\1"),
        (r"§5\.0/\?5\.7", f"§5.0/§5.7"),
        (r"§3\.1/§5\.0/\?5\.7", f"§3.1/§5.0/§5.7"),
        # task chains
        (r"TASK-463/470\?473", "TASK-463/470→473"),
        (r"TASK-444/454\?457/459", "TASK-444/454–457/459"),
        (r"463\?471", "463→471"),
        (r"TASK-422\?done", "TASK-422→done"),
        # word chains (navigation / flow)
        (r"Foundation\?Path", "Foundation→Path"),
        (r"Ancestry\?overview", "Ancestry→overview"),
        (r"Equipment\?first", "Equipment→first"),
        (r"builders\?namedPropertyDescriptorChips", "builders→namedPropertyDescriptorChips"),
        (r"L2\?card", "L2→card"),
        (r"card\?GridListRow", "card→GridListRow"),
        (r"weapon\?armor\?gear", "weapon→armor→gear"),
        (r"weapon\?armor\?gear", "weapon→armor→gear"),
        (r"thrown\?Strength", "thrown→Strength"),
        (r"lock\?prototype\?behavior", "lock→prototype→behavior"),
        (r"legacy DB key \? `tooltip-text`", "legacy DB key → `tooltip-text`"),
        (r"path_data gap \? `useCreatorPathData`", "path_data gap — `useCreatorPathData`"),
        (r"uniqueness card \? `/power-creator`", "uniqueness card → `/power-creator`"),
        (r"Phase E \? `ChipData", "Phase E — `ChipData"),
        (r"\+ \? Guided creator routes", "+ — Guided creator routes"),
        (r"aria-hidden \?, archive", "aria-hidden *, archive"),
        (r"Phases A\?F", "Phases A–F"),
        # quoted UI copy: ?phrase? → "phrase"
        (r"\?included\?", '"included"'),
        (r"\?Your selection\?", '"Your selection"'),
        (r"\?one decision at a time\?", '"one decision at a time"'),
        (r"\?3 Skill Points\?", '"3 Skill Points"'),
        (r"\?Layer 2 Cards\?", '"Layer 2 Cards"'),
        (r"\?See all\?", '"See all"'),
        (r"path-card \?Includes X feats\?\? preview", 'path-card "Includes X feats?" preview'),
        # numeric transitions (N?M) in parens or after comma
        (r"\(138\?108\)", "(138→108)"),
        (r"\(158\?138\)", "(158→138)"),
        (r"\(168\?158\)", "(168→158)"),
        (r"\(63\?49\)", "(63→49)"),
        (r"360\?171 warnings", "360→171 warnings"),
        (r"4\?0 errors", "4→0 errors"),
        (r"9\.4MB \? ~77KB", "9.4MB → ~77KB"),
        # phase/step ranges
        (r"phases 5\?6", "phases 5–6"),
        (r"Phases 4\?7", "Phases 4–7"),
        (r"Phases 1\?2", "Phases 1–2"),
        (r"batches 1\?2", "batches 1–2"),
        (r"Phases B\?E", "Phases B–E"),
        (r"Phases 0\?5", "Phases 0–5"),
        (r"Phase 4\.7\?4\.9", "Phase 4.7–4.9"),
        # completion markers
        (r"\*\*TASK-385 \?\*\*", "**TASK-385 ✅**"),
        (r"Phase 5 \?\.", "Phase 5 ✅."),
        (r"Phase 4 \?\.", "Phase 4 ✅."),
        (r"\*\*Phase 3 \?\*\*", "**Phase 3 ✅**"),
        (r"Phase 2\.3 \?\;", "Phase 2.3 ✅;"),
        (r"VSEA-002 \?\)", "VSEA-002 ✅)"),
        (r"UI unification Phases 0\?5 \?\*\*", "UI unification Phases 0–5 ✅**"),
        # migration arrows in prose
        (r"inline panels \? `<Card>`", "inline panels → `<Card>`"),
        (r"creature-creator \? `<Card>`", "creature-creator → `<Card>`"),
        (r"Power highlight \? `text-power-fg`", "Power highlight → `text-power-fg`"),
        (r"rarity badge— canonical", "rarity badge — canonical"),
        (r"bonus \?, X remove", "bonus (−/+), X remove"),
        (r"Start Playing\" \? /characters/new", 'Start Playing" → /characters/new'),
    ]
    for pat, repl in pass2_rules:
        s = re.sub(pat, repl, s)

    # Generic quoted phrase: ?words? → "words" (outside backticks — already protected)
    s = re.sub(r"\?([^?\n`]{1,60})\?", r'"\1"', s)

    # Remaining digit?digit in parens → arrow (warning counts etc.)
    s = re.sub(r"\((\d+)\?(\d+)\)", r"(\1→\2)", s)

    # Remaining letter?letter navigation (Foundation→Path style) — conservative
    s = re.sub(
        r"\b([A-Z][a-z]+)\?([a-z][a-z]+)\b",
        r"\1→\2",
        s,
    )

    # phase N?M ranges
    s = re.sub(r"\bphases? (\d+)\?(\d+)\b", r"phases \1–\2", s, flags=re.IGNORECASE)
    s = re.sub(r"\bPhases (\d+)\?(\d+)\b", r"Phases \1–\2", s)

    return s


def read_source_bytes(path: Path) -> bytes:
    return path.read_bytes()


def bytes_to_working_text(data: bytes) -> str:
    # Normalize legacy Windows-1252 dash bytes before UTF-8 decode
    data = data.replace(b"\x97", "\u2014".encode())
    data = data.replace(b"\x96", "\u2013".encode())
    text = data.decode("utf-8", errors="replace")
    return text.replace("\r\n", "\n").replace("\r", "\n")


def has_mojibake_markers(text: str) -> bool:
    """True when file still has patterns this tool is meant to fix."""
    if "???" in text:
        return True
    if re.search(r" (done|audit|follow-up|applied|fixes|cleanup) \? ", text):
        return True
    if re.search(r"REALMS \?\d", text):
        return True
    if re.search(r"TASK-\d+\?\d+", text):
        return True
    if re.search(r"[^?\s]\?[^?\s=]", text) and "`?edit=" not in text:
        # coarse: word?word without query param
        if re.search(r"[a-zA-Z]\?[a-zA-Z]", text):
            return True
    return bool(re.search(r" \? [A-Za-z`\u201c]", text))


def fix_file(path: Path, dry_run: bool = False) -> tuple[int, list[str]]:
    original_size = path.stat().st_size
    raw = bytes_to_working_text(read_source_bytes(path))
    if not has_mojibake_markers(raw):
        return 0, []
    protected, store = protect_backtick_segments(raw)
    fixed_protected = apply_replacements(protected)
    fixed = restore_backtick_segments(fixed_protected, store)

    # Normalize any stray Windows-1252 em dash bytes if present
    fixed = fixed.replace("\x97", EM).replace("\x96", EN)
    # Fix double-encoded dash artifacts from prior bad conversions
    fixed = fixed.replace("\u2014\u2014", EM).replace("\u2013\u2013", EN)
    fixed = fixed.replace("\u2014\u2013", EN)

    remaining = []
    for i, line in enumerate(fixed.splitlines(), 1):
        # flag suspicious ? outside backticks
        stripped = re.sub(r"`[^`]*`", "", line)
        if "?" in stripped and not line.startswith("- 2026-08-01"):
            if "mojibake" in line and "TASK-639" in line:
                continue
            if "Add selected?" in line:
                continue
            if "Includes X feats?" in line:
                continue
            remaining.append(f"{path.name}:{i}: {line[:120]}")

    if fixed == raw:
        return 0, remaining

    if not dry_run:
        if len(fixed) < original_size * 0.5:
            raise RuntimeError(
                f"Refusing to write {path}: output length {len(fixed)} "
                f"is suspiciously smaller than input {original_size}"
            )
        path.write_text(fixed, encoding="utf-8", newline="\n")

    delta = sum(1 for a, b in zip(raw, fixed) if a != b) + abs(len(raw) - len(fixed))
    return delta, remaining


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    total_changes = 0
    all_remaining: list[str] = []

    for path in TARGETS:
        if not path.exists():
            print(f"MISSING: {path}")
            continue
        n, rem = fix_file(path, dry_run=dry_run)
        total_changes += n
        all_remaining.extend(rem)
        mode = "DRY" if dry_run else "WROTE"
        print(f"{mode} {path.name}: ~{n} char deltas, {len(rem)} lines still suspicious")

    if all_remaining:
        print("\n=== Remaining suspicious lines (manual review) ===")
        for line in all_remaining[:40]:
            print(line)
        if len(all_remaining) > 40:
            print(f"... and {len(all_remaining) - 40} more")

    return 0 if not all_remaining else 1


if __name__ == "__main__":
    raise SystemExit(main())
