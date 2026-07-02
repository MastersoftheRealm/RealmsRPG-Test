/** About page copy — edit text for `/about`. Carousel slide bodies remain in the page until TASK-390. */

import { REALMS_MOTTO } from './shared-copy';

export const ABOUT_COPY = {
  pageTitle: 'About Realms',
  pageDescription: `${REALMS_MOTTO}. The tabletop RPG built for limitless creative freedom prioritizing fun first, flavor second, rules third.`,
  creatorNote: {
    heading: 'A Note from the Creator',
    greeting: 'Dear Realms Player,',
    bodyLead:
      'Thank you for playing my game! I designed it with the hope that others would have as much fun with it as I do, and it means a lot to see people enjoying it. Realms is built to make',
    bodyEmphasis: 'your ideas into reality',
    bodyTail: 'I deeply appreciate your enthusiasm for the game. I hope you have fun!',
    closing: 'Sincerely,',
    authorName: 'Kadin Brooksby',
    authorTitle: 'Creator of Realms',
  },
  ctas: {
    rules: 'Read the Core Rulebook',
    codex: 'Browse Codex',
  },
} as const;
