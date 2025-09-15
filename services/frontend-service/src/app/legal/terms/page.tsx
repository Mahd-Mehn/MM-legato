import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Legato',
  description: 'Terms of Service for Legato - Where Stories Become IP',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8 font-display">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none font-reading">
            <p className="text-neutral-600 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                1. Acceptance of Terms
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                By accessing and using Legato, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                2. Intellectual Property Rights
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Writers retain ownership of their original content. By publishing on Legato, you grant us a license to:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Display and distribute your content on our platform</li>
                <li>Provide translation and audio services</li>
                <li>Enable IP protection and certification services</li>
                <li>Facilitate licensing opportunities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                3. Revenue Sharing
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Writers earn 60-85% of revenue generated from their content, depending on the revenue stream:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Coin purchases: 85% to writer</li>
                <li>Subscription revenue: 70% to writer</li>
                <li>Licensing deals: 60% to writer</li>
                <li>Advertising revenue: 75% to writer</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                4. Content Guidelines
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                All content must comply with our community guidelines. Prohibited content includes:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Illegal or harmful content</li>
                <li>Plagiarized or copyright-infringing material</li>
                <li>Hate speech or discriminatory content</li>
                <li>Spam or misleading information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                5. Account Termination
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We reserve the right to terminate accounts that violate these terms or engage in harmful behavior.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                6. Limitation of Liability
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Legato shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                7. Contact Information
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                For questions about these Terms of Service, contact us at{' '}
                <a href="mailto:legal@legato.com" className="text-primary-600 hover:text-primary-700">
                  legal@legato.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}