/** Privacy policy page copy — edit text for `/privacy`. */

import { SITE_CONTACT_EMAIL, SITE_URL } from './shared-copy';

export type LegalListItem = string | { label: string; text: string };

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  list?: LegalListItem[] | undefined;
  contactEmail?: boolean | undefined;
};

export const PRIVACY_COPY = {
  pageTitle: 'Privacy Policy',
  seoDescription:
    'How RealmsRPG collects, uses, and protects your account and game data on our free tabletop RPG web app.',
  siteUrl: SITE_URL,
  contactEmail: SITE_CONTACT_EMAIL,
  intro: {
    beforeLink:
      "Your privacy is important to us. It is Realms' policy to respect your privacy regarding any information we may collect from you across our website,",
    afterLink: ', and other sites we own and operate.',
  },
  sections: [
    {
      heading: '1. Information We Collect',
      paragraphs: [
        'We only collect information about you if we have a reason to do so (for example, to provide our services, to communicate with you, or to make our services better).',
      ],
    },
    {
      heading: '2. How We Use Information',
      paragraphs: [
        'We use the information we collect to operate RealmsRPG as a free tabletop RPG web app, including to:',
      ],
      list: [
        'Provide, operate, and maintain your account, characters, library content, campaigns, and encounters',
        'Authenticate you and keep your session secure',
        'Improve site performance, usability, and accessibility',
        'Understand how features are used so we can fix bugs and improve tools (including anonymous page-view analytics from our hosting provider)',
        'Communicate with you about your account, support requests, or important service updates',
        'Send optional emails such as account confirmation or password reset messages',
        'Detect, prevent, and address abuse, fraud, or security issues',
      ],
    },
    {
      heading: '3. Cookies and Analytics',
      paragraphs: [
        'RealmsRPG uses essential cookies or similar storage needed to keep you signed in and apply preferences (for example theme). We do not use advertising cookies.',
        'We use Vercel Web Analytics to collect anonymous, aggregate page-view and navigation data so we can understand site traffic and improve the product. This analytics product is designed to avoid collecting personal identifiers and does not rely on advertising cookies. Analytics is provided by our host (Vercel) as part of operating the app.',
      ],
    },
    {
      heading: '4. Data Retention',
      paragraphs: [
        'We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.',
      ],
    },
    {
      heading: '5. Data Security',
      paragraphs: [
        'We take the security of your personal information seriously and use reasonable electronic, personnel, and physical measures to protect it from loss, theft, alteration, or misuse.',
      ],
    },
    {
      heading: '6. Your Data Protection Rights',
      paragraphs: [
        'Depending on your location, you may have the following rights regarding your personal information:',
      ],
      list: [
        {
          label: 'The right to access',
          text: 'You have the right to request copies of your personal data.',
        },
        {
          label: 'The right to rectification',
          text: 'You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.',
        },
        {
          label: 'The right to erasure',
          text: 'You have the right to request that we erase your personal data, under certain conditions.',
        },
        {
          label: 'The right to restrict processing',
          text: 'You have the right to request that we restrict the processing of your personal data, under certain conditions.',
        },
        {
          label: 'The right to object to processing',
          text: 'You have the right to object to our processing of your personal data, under certain conditions.',
        },
        {
          label: 'The right to data portability',
          text: 'You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.',
        },
      ],
    },
    {
      heading: '7. Changes to This Policy',
      paragraphs: [
        'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.',
      ],
    },
    {
      heading: '8. Contact Us',
      paragraphs: ['If you have any questions about this Privacy Policy, please contact us at'],
      contactEmail: true,
    },
  ] satisfies LegalSection[],
} as const;
