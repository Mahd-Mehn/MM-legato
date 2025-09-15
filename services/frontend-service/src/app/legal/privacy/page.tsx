import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Legato',
  description: 'Privacy Policy for Legato - Where Stories Become IP',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-dark-50 mb-8 font-display">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none font-reading">
            <p className="text-neutral-600 dark:text-dark-400 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-dark-100 mb-4 font-display">
                1. Information We Collect
              </h2>
              <p className="text-neutral-700 dark:text-dark-300 leading-relaxed mb-4">
                At Legato, we collect information you provide directly to us, such as when you create an account, 
                publish stories, make purchases, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-neutral-700 dark:text-dark-300 space-y-2">
                <li>Account information (name, email, username)</li>
                <li>Profile information and preferences</li>
                <li>Content you create (stories, comments, reviews)</li>
                <li>Payment and billing information</li>
                <li>Communication records</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                2. How We Use Your Information
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Protect intellectual property rights</li>
                <li>Personalize your experience and content recommendations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                3. Information Sharing
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                except as described in this policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                4. Data Security
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We implement appropriate security measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                5. Your Rights
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                You have the right to access, update, or delete your personal information. You may also opt out of 
                certain communications from us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                6. Contact Us
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@legato.com" className="text-primary-600 hover:text-primary-700">
                  privacy@legato.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}