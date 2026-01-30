/**
 * Privacy Policy Page
 * =====================
 */

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-8">
        <p className="text-text-secondary">
          Your privacy is important to us. It is Realms&apos; policy to respect your privacy regarding any 
          information we may collect from you across our website,{' '}
          <a href="https://realmsroleplaygame.com" className="text-primary-600 hover:underline">
            https://realmsroleplaygame.com
          </a>
          , and other sites we own and operate.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">1. Information We Collect</h2>
          <p className="text-text-secondary">
            We only collect information about you if we have a reason to do so—for example, to provide 
            our services, to communicate with you, or to make our services better.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">2. How We Use Information</h2>
          <p className="text-text-secondary mb-3">
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc list-inside text-text-secondary space-y-1">
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Understand and analyze how you use our website</li>
            <li>Develop new products, services, features, and functionality</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
            <li>Process your transactions and manage your orders</li>
            <li>Send you emails</li>
            <li>Find and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">3. Data Retention</h2>
          <p className="text-text-secondary">
            We will retain your personal information only for as long as is necessary for the purposes 
            set out in this Privacy Policy. We will retain and use your information to the extent necessary 
            to comply with our legal obligations, resolve disputes, and enforce our policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">4. Data Security</h2>
          <p className="text-text-secondary">
            We take the security of your personal information seriously and use reasonable electronic, 
            personnel, and physical measures to protect it from loss, theft, alteration, or misuse.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">5. Your Data Protection Rights</h2>
          <p className="text-text-secondary mb-3">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside text-text-secondary space-y-1">
            <li><strong>The right to access</strong> – You have the right to request copies of your personal data.</li>
            <li><strong>The right to rectification</strong> – You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
            <li><strong>The right to erasure</strong> – You have the right to request that we erase your personal data, under certain conditions.</li>
            <li><strong>The right to restrict processing</strong> – You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
            <li><strong>The right to object to processing</strong> – You have the right to object to our processing of your personal data, under certain conditions.</li>
            <li><strong>The right to data portability</strong> – You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">6. Changes to This Policy</h2>
          <p className="text-text-secondary">
            We may update our Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page. You are advised to review this Privacy Policy 
            periodically for any changes. Changes to this Privacy Policy are effective when they are 
            posted on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">7. Contact Us</h2>
          <p className="text-text-secondary">
            If you have any questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:RealmsRoleplayGame@gmail.com" className="text-primary-600 hover:underline">
              RealmsRoleplayGame@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
