/**
 * Terms of Service Page
 * ======================
 */

import type { Metadata } from 'next';
import { PageContainer, PageHeader } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms for using RealmsRPG, the free web app for creating characters, running games, and sharing tabletop RPG content.',
};

export default function TermsPage() {
  return (
    <PageContainer size="prose">
      <PageHeader title="Terms of Service" />
      
      <div className="prose prose-gray max-w-none space-y-8">
        <p className="text-text-secondary">
          Welcome to Realms! These terms and conditions outline the rules and regulations for the use of our website.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">1. Terms</h2>
          <p className="text-text-secondary">
            By accessing this website, you agree to be bound by these terms of service, all applicable 
            laws and regulations, and agree that you are responsible for compliance with any applicable 
            local laws. If you do not agree with any of these terms, you are prohibited from using or 
            accessing this site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">2. Use of the Service</h2>
          <p className="text-text-secondary mb-3">
            RealmsRPG is a free web app for playing and creating content for the Realms tabletop RPG. By using the site, you agree to use it lawfully and respectfully. You may not:
          </p>
          <ul className="list-disc list-inside text-text-secondary space-y-1">
            <li>Attempt to gain unauthorized access to accounts, data, or systems</li>
            <li>Scrape, overload, or interfere with the normal operation of the service</li>
            <li>Upload malicious code or content that violates applicable law</li>
            <li>Harass, impersonate, or abuse other users</li>
            <li>Reverse engineer or misuse the service in ways that harm Realms or other players</li>
          </ul>
          <p className="text-text-secondary mt-3">
            You retain ownership of the characters, powers, techniques, and other content you create. By saving content to RealmsRPG, you grant us the limited rights needed to host, display, back up, and operate the service for you and your invited collaborators (such as campaign members).
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">3. Disclaimer</h2>
          <p className="text-text-secondary">
            The materials on Realms&apos; website are provided on an &apos;as is&apos; basis. Realms makes no warranties, 
            expressed or implied, and hereby disclaims and negates all other warranties including, without 
            limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, 
            or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">4. Limitations</h2>
          <p className="text-text-secondary">
            In no event shall Realms or its suppliers be liable for any damages (including, without limitation, 
            damages for loss of data or profit, or due to business interruption) arising out of the use or 
            inability to use the materials on Realms&apos; website, even if Realms or a Realms authorized representative 
            has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">5. Accuracy of Materials</h2>
          <p className="text-text-secondary">
            The materials appearing on Realms&apos; website could include technical, typographical, or photographic 
            errors. Realms does not warrant that any of the materials on its website are accurate, complete or 
            current. Realms may make changes to the materials contained on its website at any time without notice. 
            However, Realms does not make any commitment to update the materials.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">6. Links</h2>
          <p className="text-text-secondary">
            Realms has not reviewed all of the sites linked to its website and is not responsible for the contents 
            of any such linked site. The inclusion of any link does not imply endorsement by Realms of the site. 
            Use of any such linked website is at the user&apos;s own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">7. Modifications</h2>
          <p className="text-text-secondary">
            Realms may revise these terms of service for its website at any time without notice. By using this 
            website you are agreeing to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">8. Governing Law</h2>
          <p className="text-text-secondary">
            These terms and conditions are governed by and construed in accordance with applicable laws and you 
            irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
