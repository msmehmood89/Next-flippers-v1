import { FileCheck, AlertCircle, Info, Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <Scale className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Terms of Service</h1>
              <p className="text-gray-500">Last updated: May 2026</p>
            </div>
          </div>

          <div className="prose prose-indigo max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-indigo-600" />
                Agreement to Terms
              </h2>
              <p>
                By accessing or using NextFlippers, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Marketplace & Manual Escrow
              </h2>
              <p>
                NextFlippers provides a platform for buying and selling digital assets (websites, domains, tools). We utilize a <strong>manual escrow process</strong> where:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Buyers deposit funds into our secure holding account.</li>
                <li>The asset transfer is verified by our team.</li>
                <li>Funds are released to the seller only after successful asset transfer confirmation.</li>
              </ul>
              <p>
                All users agree to comply with our moderation process and provide accurate information about their listings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
                User Conduct & Prohibited Activities
              </h2>
              <p>
                Users are strictly prohibited from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Providing false or misleading information about assets.</li>
                <li>Attempting to bypass our escrow system to conduct transactions off-platform.</li>
                <li>Harassing other users or platform moderators.</li>
                <li>Engaging in any fraudulent or illegal activity.</li>
              </ul>
              <p>
                Violation of these rules will result in immediate permanent account suspension.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Fees & Commissions</h2>
              <p>
                NextFlippers charges a service fee for successful transactions. Fees are clearly stated during the listing and offer process. These fees support our manual verification and escrow infrastructure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact</h2>
              <p>
                For legal inquiries or dispute resolution, contact us via WhatsApp at +92 333 0758018.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
