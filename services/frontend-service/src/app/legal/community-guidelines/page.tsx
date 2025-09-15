import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines - Legato',
  description: 'Community Guidelines for Legato - Where Stories Become IP',
};

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8 font-display">
            Community Guidelines
          </h1>
          
          <div className="prose prose-lg max-w-none font-reading">
            <p className="text-neutral-600 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                1. Our Community Values
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Legato is built on the foundation of creativity, respect, and fair compensation for storytellers worldwide. 
                We believe in fostering an inclusive environment where all voices can be heard.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                2. Content Standards
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                We encourage creative expression while maintaining community safety:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li><strong>Original Content:</strong> Only publish content you own or have permission to use</li>
                <li><strong>Respectful Language:</strong> Avoid hate speech, harassment, or discriminatory content</li>
                <li><strong>Age-Appropriate:</strong> Clearly label mature content and follow platform guidelines</li>
                <li><strong>Cultural Sensitivity:</strong> Respect diverse cultures and perspectives</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                3. Prohibited Content
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                The following content is not allowed on Legato:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Plagiarized or copyright-infringing material</li>
                <li>Content promoting violence, terrorism, or illegal activities</li>
                <li>Spam, misleading information, or scams</li>
                <li>Personal information or doxxing</li>
                <li>Content that violates local laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                4. Community Interaction
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Foster positive interactions through:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Constructive feedback and reviews</li>
                <li>Respectful discussions and debates</li>
                <li>Supporting fellow creators</li>
                <li>Reporting inappropriate behavior</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                5. Enforcement
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Violations may result in:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Content removal or editing requirements</li>
                <li>Temporary account restrictions</li>
                <li>Permanent account suspension</li>
                <li>Loss of monetization privileges</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                6. Reporting Issues
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                Report violations or concerns to our community team at{' '}
                <a href="mailto:community@legato.com" className="text-primary-600 hover:text-primary-700">
                  community@legato.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}