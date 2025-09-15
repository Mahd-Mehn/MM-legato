import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Copyright Policy - Legato',
  description: 'Copyright Policy for Legato - Where Stories Become IP',
};

export default function CopyrightPolicy() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8 font-display">
            Copyright Policy
          </h1>
          
          <div className="prose prose-lg max-w-none font-reading">
            <p className="text-neutral-600 mb-8">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                1. Copyright Protection
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Legato provides automatic copyright protection for all original content published on our platform through:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Blockchain-based timestamping</li>
                <li>Digital fingerprinting technology</li>
                <li>Certificate of Authorship generation</li>
                <li>Legal documentation and proof of creation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                2. DMCA Compliance
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Legato complies with the Digital Millennium Copyright Act (DMCA). If you believe your copyrighted work 
                has been infringed, please provide:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 space-y-2">
                <li>Identification of the copyrighted work</li>
                <li>Location of the infringing material</li>
                <li>Your contact information</li>
                <li>A statement of good faith belief</li>
                <li>A statement of accuracy under penalty of perjury</li>
                <li>Your physical or electronic signature</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                3. Counter-Notification
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                If you believe your content was wrongly removed due to a copyright claim, you may file a counter-notification 
                containing the required elements under DMCA Section 512(g)(3).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                4. Repeat Infringer Policy
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Legato will terminate accounts of users who are repeat copyright infringers in appropriate circumstances.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                5. IP Marketplace
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                Our IP marketplace facilitates legitimate licensing of copyrighted works while ensuring proper attribution 
                and compensation to original creators.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 font-display">
                6. Copyright Agent
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                Send copyright notices to our designated agent at:{' '}
                <a href="mailto:copyright@legato.com" className="text-primary-600 hover:text-primary-700">
                  copyright@legato.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}