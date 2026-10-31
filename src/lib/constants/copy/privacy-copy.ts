/** Privacy policy page copy — edit text for `/privacy`. */

import { SITE_CONTACT_EMAIL } from './shared-copy';
import type { LegalPageCopy } from './legal-copy-types';

const email = (): { kind: 'email'; address: string } => ({
  kind: 'email',
  address: SITE_CONTACT_EMAIL,
});

export const PRIVACY_COPY = {
  pageTitle: 'Privacy Policy',
  seoDescription:
    'How RealmsRPG collects, uses, and protects your account and game data on our free tabletop RPG web app.',
  lastUpdated: 'October 29, 2026',
  shortVersion: [
    'We collect what you give us (like your email, username and game content) and some technical data needed to run the site.',
    "We don't sell your personal information, and we don't use advertising trackers.",
    'A few service providers help us run the site, like Supabase, Vercel, Google and Sentry.',
    "You must be at least 13. We don't knowingly collect information from children under 13.",
    "Want your data or account deleted? Email us and we'll handle it.",
  ],
  intro: [
    ['This is a plain-language document. For legal questions, contact us at ', email(), '.'],
    [
      'This Privacy Policy explains how Masters of the Realms LLC, a Georgia limited liability company ("we", "us" or "Realms"), handles information when you use realmsrpg.com and its apps and tools (the "Service"). "Realms RPG™" and "Realms: The Roleplaying Game™" are claimed, unregistered trademarks of ours.',
    ],
  ],
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        { type: 'subheading', text: 'Information you give us' },
        {
          type: 'ul',
          items: [
            [
              'Account details: email address, username, display name, profile photo and account role.',
            ],
            [
              'If you sign in with Google: your name, email address and a link to your Google profile picture. The picture stays hosted by Google, and the link is kept in your sign-in record.',
            ],
            [
              'Game content: characters, campaigns and campaign members, encounters, dice rolls, homebrew (species, powers, techniques, items, creatures), crafting sessions and images you upload.',
            ],
            ['Messages you send us, such as support requests or feedback.'],
          ],
        },
        { type: 'subheading', text: 'Information collected automatically' },
        {
          type: 'ul',
          items: [
            [
              'IP address and device and browser information, used to host the site, keep it working and limit abuse. For sign-in attempts, the limit is tracked using your IP address together with the email address entered.',
            ],
            ['Error reports when something breaks.'],
            ['Site usage analytics, such as which pages are visited.'],
          ],
        },
        { type: 'subheading', text: 'Information that stays on your device' },
        {
          type: 'paragraph',
          segments: [
            "Some things are kept only in your browser's local storage on your own device: guest characters and guest encounters, tutorial progress and preferences, your personal dice roll log, drafts and saved choices from the character and creature creators, and library filters. Clearing your browser data deletes them. Anything you save to your account is stored on our servers, as described above.",
          ],
        },
        { type: 'subheading', text: 'Public content' },
        {
          type: 'paragraph',
          segments: [
            'You can set a character to public, which lets others see it. Character portraits and profile pictures are stored at public web addresses, so anyone with the link may be able to see them.',
          ],
        },
      ],
    },
    {
      heading: '2. How We Use Information',
      blocks: [
        {
          type: 'paragraph',
          segments: ['We use information to:'],
        },
        {
          type: 'ul',
          items: [
            ['Create and run your account.'],
            ['Authenticate you and manage your sign-in session.'],
            [
              "Save, show and share your game content as the Service's features require, including with your campaign members and publicly where you choose.",
            ],
            ['Send account emails, such as sign-up confirmation and password resets.'],
            ['Fix bugs and improve the Service.'],
            ['Help us limit abuse and misuse of the Service.'],
            ['Respond to you and follow the law.'],
          ],
        },
        {
          type: 'paragraph',
          segments: [
            "We don't sell your personal information, and we don't use it for targeted advertising.",
          ],
        },
      ],
    },
    {
      heading: '3. Cookies, Analytics and Service Providers',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "We use cookies and similar browser storage to keep you signed in and remember your settings. Signing in sets session cookies (and short-lived cookies while you sign in with Google). Our website analytics doesn't set a cookie. We don't use advertising trackers.",
          ],
        },
        {
          type: 'paragraph',
          segments: ['These service providers help us run the Service and handle data for us:'],
        },
        {
          type: 'ul',
          items: [
            [
              { kind: 'strong', text: 'Supabase:' },
              ' sign-in, database and file storage, and it also sends account emails. Data is hosted in the United States (AWS US East, Northern Virginia).',
            ],
            [{ kind: 'strong', text: 'Vercel:' }, ' website hosting and Vercel Web Analytics.'],
            [{ kind: 'strong', text: 'Google:' }, ' optional "Sign in with Google".'],
            [
              { kind: 'strong', text: 'Sentry:' },
              ' error monitoring. The site is set up not to send default personal information to Sentry.',
            ],
            [
              { kind: 'strong', text: 'Upstash (via Vercel KV):' },
              " rate limiting, which keeps the site from being overloaded or abused. It stores short-lived counters tied to your IP address (and your email address for sign-in attempts) or, when you're signed in, your account ID.",
            ],
          ],
        },
        {
          type: 'paragraph',
          segments: [
            "We may add bot protection on sign-up and sign-in in the future. If we do, we'll update this policy.",
          ],
        },
        { type: 'subheading', text: 'Other platforms' },
        {
          type: 'paragraph',
          segments: [
            'We link to Discord and Patreon. They are separate services with their own privacy policies. If you support us on Patreon, Patreon handles your payment and card details, not us.',
          ],
        },
        {
          type: 'paragraph',
          segments: [
            "We may also share information if the law requires it, to protect people's safety or our rights, or as part of a sale or transfer of the Service (the new owner would have to follow this policy).",
          ],
        },
      ],
    },
    {
      heading: '4. Data Retention',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'We keep your account and content while your account is active. When you ask us to delete your account, we delete your account and its content from our live systems. We keep periodic backup copies for disaster recovery, and deleted data may remain in those backups until they are replaced. Content you made public may also remain where others have already copied or saved it. We may keep limited records if the law requires it.',
          ],
        },
      ],
    },
    {
      heading: '5. Data Security',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "We take reasonable steps to protect your information, but no website or online service is perfectly secure, and we can't guarantee the security of information you send us. Please use a strong, unique password.",
          ],
        },
        {
          type: 'paragraph',
          segments: [
            "If we learn of a security incident that affects your personal information, we'll notify affected users, and regulators where required, as required by applicable law, and without unreasonable delay.",
          ],
        },
      ],
    },
    {
      heading: '6. Your Choices and Rights',
      blocks: [
        {
          type: 'ul',
          items: [
            [
              { kind: 'strong', text: 'See or update your info:' },
              ' you can edit your profile and content in your account.',
            ],
            [
              { kind: 'strong', text: 'Get a copy or delete your data:' },
              ' email us at ',
              email(),
              " from the address on your account. We'll handle your request by hand and confirm when it's done, within 14 days.",
            ],
            [
              { kind: 'strong', text: 'Make content private:' },
              ' you can change a public character back to private.',
            ],
            [
              { kind: 'strong', text: 'Local data:' },
              " you can clear guest data by clearing your browser's storage.",
            ],
          ],
        },
        {
          type: 'paragraph',
          segments: [
            "People in some places may have additional rights over their personal information, such as asking us to correct, limit or stop using it. Contact us and we'll help.",
          ],
        },
      ],
    },
    {
      heading: "7. Children's Privacy",
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "Realms RPG is not meant for children under 13, and we do not knowingly collect personal information from them. If you're under 18, you need a parent or guardian's permission to use the Service. If we learn that a child under 13 has an account, we will delete the account and its data. Parents or guardians who think their child has given us information can contact us at ",
            email(),
            '.',
          ],
        },
      ],
    },
    {
      heading: '8. Changes to This Policy',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'We may update this policy. We\'ll post the new version with a new "Last updated" date. For material changes, we\'ll also tell you by a notice on the site or by email.',
          ],
        },
      ],
    },
    {
      heading: '9. Contact Us',
      blocks: [
        {
          type: 'paragraph',
          segments: ['Masters of the Realms LLC'],
        },
        {
          type: 'paragraph',
          segments: ['Email: ', email()],
        },
      ],
    },
  ],
} satisfies LegalPageCopy;
