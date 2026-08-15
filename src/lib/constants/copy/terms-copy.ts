/** Terms of service page copy — edit text for `/terms`. */

export type LegalListItem = string | { label: string; text: string };

export type LegalSection = {
  heading: string;
  /** Opening paragraph(s) before any list. */
  paragraphs: string[];
  list?: LegalListItem[];
  /** Paragraph(s) after the list (when list sits mid-section). */
  afterList?: string[];
};

export const TERMS_COPY = {
  pageTitle: 'Terms of Service',
  seoDescription:
    'Terms for using RealmsRPG, the free web app for creating characters, running games, and sharing tabletop RPG content.',
  intro:
    'Welcome to Realms! These terms and conditions outline the rules and regulations for the use of our website.',
  sections: [
    {
      heading: '1. Terms',
      paragraphs: [
        'By accessing this website, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.',
      ],
    },
    {
      heading: '2. Use of the Service',
      paragraphs: [
        'RealmsRPG is a free web app for playing and creating content for the Realms tabletop RPG. By using the site, you agree to use it lawfully and respectfully. You may not:',
      ],
      list: [
        'Attempt to gain unauthorized access to accounts, data, or systems',
        'Scrape, overload, or interfere with the normal operation of the service',
        'Upload malicious code or content that violates applicable law',
        'Harass, impersonate, or abuse other users',
        'Reverse engineer or misuse the service in ways that harm Realms or other players',
      ],
      afterList: [
        'You retain ownership of the characters, powers, techniques, and other content you create. By saving content to RealmsRPG, you grant us the limited rights needed to host, display, back up, and operate the service for you and your invited collaborators (such as campaign members).',
      ],
    },
    {
      heading: '3. Disclaimer',
      paragraphs: [
        "The materials on Realms' website are provided on an 'as is' basis. Realms makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
      ],
    },
    {
      heading: '4. Limitations',
      paragraphs: [
        "In no event shall Realms or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Realms' website, even if Realms or a Realms authorized representative has been notified orally or in writing of the possibility of such damage.",
      ],
    },
    {
      heading: '5. Accuracy of Materials',
      paragraphs: [
        "The materials appearing on Realms' website could include technical, typographical, or photographic errors. Realms does not warrant that any of the materials on its website are accurate, complete or current. Realms may make changes to the materials contained on its website at any time without notice. However, Realms does not make any commitment to update the materials.",
      ],
    },
    {
      heading: '6. Links',
      paragraphs: [
        "Realms has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Realms of the site. Use of any such linked website is at the user's own risk.",
      ],
    },
    {
      heading: '7. Modifications',
      paragraphs: [
        'Realms may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.',
      ],
    },
    {
      heading: '8. Governing Law',
      paragraphs: [
        'These terms and conditions are governed by and construed in accordance with applicable laws and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
      ],
    },
  ] satisfies LegalSection[],
} as const;
