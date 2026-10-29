/** Terms of service page copy — edit text for `/terms`. */

import { SITE_CONTACT_EMAIL } from './shared-copy';
import type { LegalPageCopy } from './legal-copy-types';

const email = (): { kind: 'email'; address: string } => ({
  kind: 'email',
  address: SITE_CONTACT_EMAIL,
});

export const TERMS_COPY = {
  pageTitle: 'Terms of Service',
  seoDescription:
    'Terms for using Realms RPG, the free web app for creating characters, running games, and sharing tabletop RPG content.',
  lastUpdated: 'October 29, 2026',
  shortVersion: [
    "You must be at least 13 to use Realms RPG™. If you're under 18, you need a parent or guardian's OK.",
    'You own the characters, homebrew and images you make. You let us host and show them so the site works.',
    "Be kind, don't break the site, and only upload things you have the right to share.",
    'The site is in testing. Things may change, break or be reset.',
    'The Realms rules, art, text and code belong to us. You can use them for your own games.',
  ],
  intro: [['This is a plain-language document. For legal questions, contact us at ', email(), '.']],
  sections: [
    {
      heading: '1. Terms',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'These Terms of Service ("Terms") are an agreement between you and Kadin Brooksby, who runs Realms RPG on behalf of Masters of the Realms LLC, a Georgia limited liability company whose formation is pending with the Georgia Secretary of State ("we", "us" or "Realms"). They cover your use of realmsrpg.com and its apps and tools (the "Service"). By creating an account or using the Service, you agree to these Terms and to our ',
            { kind: 'link', href: '/privacy', label: 'Privacy Policy' },
            ". If you don't agree, please don't use the Service.",
          ],
        },
        {
          type: 'paragraph',
          segments: [
            '"Realms RPG™" and "Realms: The Roleplaying Game™" are claimed, unregistered trademarks of ours.',
          ],
        },
      ],
    },
    {
      heading: '2. Who Can Use the Service',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'You must be at least 13 years old to use Realms RPG. If you are under 18, you may use it only with permission from a parent or guardian, who should read these Terms with you. By using the Service, you confirm that you meet these requirements.',
          ],
        },
      ],
    },
    {
      heading: '3. Your Account',
      blocks: [
        {
          type: 'ul',
          items: [
            ['Give accurate information when you sign up, and keep it up to date.'],
            [
              "Keep your password and sign-in details private. You're responsible for what happens under your account.",
            ],
            [
              'Tell us right away at ',
              email(),
              ' if you think someone else is using your account.',
            ],
            [
              "You can sign up with an email and password or with Google. If you use Google, Google's terms also apply to that sign-in.",
            ],
          ],
        },
      ],
    },
    {
      heading: '4. Use of the Service',
      blocks: [
        {
          type: 'paragraph',
          segments: ["Please don't:"],
        },
        {
          type: 'ul',
          items: [
            ['Harass, threaten, bully or impersonate anyone.'],
            [
              "Post content that is illegal, hateful, sexually explicit, or that shares someone else's private information.",
            ],
            ["Upload content you don't own or don't have permission to share."],
            [
              "Try to break, overload, scrape or get around the Service's limits or security, or access accounts or data that aren't yours.",
            ],
            ['Use bots or automated tools to create accounts or flood the Service.'],
            ['Use the Service to spam, sell things, or spread malware.'],
          ],
        },
        {
          type: 'paragraph',
          segments: [
            'Realm Masters (RMs) and players are responsible for what they post in their campaigns. We may remove content or limit accounts that break these rules.',
          ],
        },
      ],
    },
    {
      heading: '5. Your Content',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            '"Your content" means the characters, campaigns, encounters, homebrew (species, powers, techniques, items, creatures), crafting sessions, images and other material you create or upload.',
          ],
        },
        {
          type: 'ul',
          items: [
            [{ kind: 'strong', text: 'You keep ownership' }, ' of your content.'],
            [
              { kind: 'strong', text: 'You give us a license' },
              " to store, copy, display and share your content as needed to run the Service's features. That includes showing it to members of your campaigns, and showing it publicly when you choose to make it public (for example, a public character). This license is worldwide and free of charge. It ends when your content is deleted, except for copies others have already saved, copies kept in backups, and content you shared publicly.",
            ],
            [
              { kind: 'strong', text: 'Public things are public.' },
              ' Character portraits and profile pictures are stored at public web addresses. Anyone with the link may be able to see them.',
            ],
            [
              { kind: 'strong', text: "Only upload what's yours." },
              ' If you upload third-party content, you must own it or have permission (a license) to share it.',
            ],
          ],
        },
      ],
    },
    {
      heading: '6. Feedback and Playtesting',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "If you send us ideas, suggestions, bug reports or playtest feedback, we may use them, including in the Realms rules, books and site, without paying you or owing you anything. Please don't send us ideas you want to keep to yourself.",
          ],
        },
      ],
    },
    {
      heading: '7. Realms Materials',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'The Realms game rules, text, art, logos, site design and code ("Realms Materials") belong to us or our licensors. We give you a personal, non-commercial, non-transferable license to use the Realms Materials on the Service to play and run your own games.',
          ],
        },
        {
          type: 'paragraph',
          segments: [
            'You may make homebrew for your own table. Please ask us at ',
            email(),
            ' before sharing or selling anything that uses Realms Materials.',
          ],
        },
        {
          type: 'paragraph',
          segments: [
            'Realms is not affiliated with or endorsed by Wizards of the Coast or any other publisher. Other names and trademarks belong to their owners.',
          ],
        },
      ],
    },
    {
      heading: '8. Copyright Complaints and Takedowns',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'If you believe content on the Service infringes your copyright, send a notice to us at ',
            email(),
            ' with:',
          ],
        },
        {
          type: 'ol',
          items: [
            ['Your name and contact information.'],
            ['A description of the work you believe is infringed.'],
            ['The link or location of the content on the Service.'],
            ["A statement that you believe in good faith the use isn't authorized."],
            [
              'A statement, under penalty of perjury, that your notice is accurate and that you are the owner or authorized to act for the owner.',
            ],
            ['Your physical or electronic signature.'],
          ],
        },
        {
          type: 'paragraph',
          segments: [
            'If your content was removed and you think it was a mistake, you can send us a counter-notice. We may close the accounts of repeat infringers.',
          ],
        },
      ],
    },
    {
      heading: '9. Beta and Playtest Status',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "The Service is in testing. Features, rules and stored data may change, break or be reset, and we don't promise the Service will always be available. Please keep your own copies of anything important.",
          ],
        },
      ],
    },
    {
      heading: '10. Paid Content and Patreon',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "There is no paid content on the site today. If you support us on Patreon, Patreon's terms apply to that relationship, and Patreon handles payments, card details and refunds. For refunds, see Patreon's refund policy. If we add paid features to the site later, extra terms will apply and we'll tell you before you pay.",
          ],
        },
      ],
    },
    {
      heading: '11. Links to Other Sites',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "The Service links to other sites, such as Discord and Patreon. We don't control those sites and aren't responsible for them. Their own terms and privacy policies apply.",
          ],
        },
      ],
    },
    {
      heading: '12. Suspension and Termination',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'You can stop using the Service at any time. To delete your account, see "Your Choices and Rights" in our Privacy Policy. We may suspend or close your account, or remove content, if you break these Terms, if needed to protect others or the Service, or if required by law. Sections 5 through 8 and 13 through 17 continue after your account ends.',
          ],
        },
      ],
    },
    {
      heading: '13. Disclaimer',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'The Service and Realms Materials are provided "as is" and "as available". To the fullest extent the law allows, we make no warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement. We don\'t promise the Service will be error-free, secure or uninterrupted, or that content will never be lost.',
          ],
        },
      ],
    },
    {
      heading: '14. Limitation of Liability',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "To the fullest extent the law allows, we aren't liable for any indirect, incidental, special, consequential or punitive damages, or for lost data, profits or goodwill. Our total liability for any claim about the Service is limited to the greater of the amount you paid us in the 12 months before the claim, or $50. Some places don't allow these limits, so they may not all apply to you.",
          ],
        },
      ],
    },
    {
      heading: '15. Indemnity',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "If you break these Terms or the law, or your content violates someone's rights, and that leads to a claim against us, you agree to cover our reasonable costs from that claim, to the extent the law allows.",
          ],
        },
      ],
    },
    {
      heading: '16. Governing Law',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'These Terms are governed by the laws of the State of Georgia, USA, without regard to its conflict-of-laws rules. Any dispute will be handled in the state or federal courts located in Richmond County, Georgia, unless the law where you live says otherwise.',
          ],
        },
      ],
    },
    {
      heading: '17. Changes to These Terms',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            'We may update these Terms. We\'ll post the new version with a new "Last updated" date. For material changes, we\'ll also tell you by a notice on the site or by email before they take effect. If you keep using the Service after changes take effect, you accept the new Terms.',
          ],
        },
      ],
    },
    {
      heading: '18. Other Legal Terms',
      blocks: [
        {
          type: 'paragraph',
          segments: [
            "If any part of these Terms can't be enforced, the rest still applies. These Terms and the Privacy Policy are the whole agreement between you and us about the Service. If we don't enforce a part of these Terms right away, we can still enforce it later. You can't transfer these Terms to anyone else; we may transfer them as part of a change in ownership of the Service.",
          ],
        },
      ],
    },
    {
      heading: '19. Contact Us',
      blocks: [
        {
          type: 'paragraph',
          segments: ['Realms RPG (Kadin Brooksby, for Masters of the Realms LLC)'],
        },
        {
          type: 'paragraph',
          segments: ['Email: ', email()],
        },
      ],
    },
  ],
} satisfies LegalPageCopy;
