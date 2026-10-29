/** Shared structured copy for `/terms` and `/privacy` (no markdown renderer). */

export type LegalSegment =
  | string
  | { kind: 'strong'; text: string }
  | { kind: 'link'; href: string; label: string }
  | { kind: 'email'; address: string };

export type LegalListItem = readonly LegalSegment[];

export type LegalBlock =
  | { type: 'paragraph'; segments: readonly LegalSegment[] }
  | { type: 'subheading'; text: string }
  | { type: 'ul'; items: readonly LegalListItem[] }
  | { type: 'ol'; items: readonly (readonly LegalSegment[])[] };

export type LegalSection = {
  heading: string;
  blocks: readonly LegalBlock[];
};

export type LegalPageCopy = {
  pageTitle: string;
  seoDescription: string;
  lastUpdated: string;
  shortVersion: readonly string[];
  intro: readonly (readonly LegalSegment[])[];
  sections: readonly LegalSection[];
};
