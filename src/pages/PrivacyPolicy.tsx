import { Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Privacy Policy</h1>
              <p className="text-gray-500">Last updated: May 2026</p>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-indigo-600" />
                Information We Collect
              </h2>
              <p>
                At NextFlippers, we collect information to provide a better experience for all our users. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal identification information (Name, email address, phone number, etc.)</li>
                <li>Profile data (Username, bio, social media links)</li>
                <li>Transaction data (Listing details, offer history, purchase records)</li>
                <li>Technical data (IP address, browser type, device information)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-indigo-600" />
                How We Use Your Information
              </h2>
              <p>
                We use the information we collect in various ways, including to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain our marketplace</li>
                <li>Improve, personalize, and expand our services</li>
                <li>Understand and analyze how you use our platform</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Communicate with you, either directly or through one of our partners</li>
                <li>Process your transactions and facilitate manual escrow</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-600" />
                Manual Escrow & Data Security
              </h2>
              <p>
                Since we operate a manual escrow system, we take data security extremely seriously. All transaction communications are logged to prevent fraud and ensure a safe transfer of digital assets. We do not sell your personal data to third parties.
              </p>
              <p>
                We use industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Our Privacy Team</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us via WhatsApp at +92 333 0758018 or email us at support@nextflippers.com.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
