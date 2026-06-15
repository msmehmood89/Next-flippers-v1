import React from 'react';
import { Scale, ShieldAlert, Key, Globe, Layers, AlertOctagon, Info } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Terms and Conditions</h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                NextFlippers Policy Agreement • Last updated: June 2026
              </p>
            </div>
          </div>

          {/* Intro Text */}
          <div className="p-6 bg-gradient-to-r from-indigo-50/40 to-blue-50/40 border border-indigo-100/60 rounded-3xl text-sm leading-relaxed text-gray-600">
            Welcome to <strong className="text-gray-900">NextFlippers</strong>. By accessing or using our marketplace website, you agree to comply with and be bound by the following terms and conditions. Please read them carefully.
          </div>

          {/* Sections */}
          <div className="space-y-8 text-gray-600 leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                1. Introduction & Role of the Platform
              </h2>
              <p className="text-sm">
                NextFlippers is an online peer-to-peer (P2P) escrow marketplace that allows users to buy and sell digital assets, including websites, gaming accounts, premium tool subscriptions, and digital services.
              </p>
              <p className="text-sm">
                NextFlippers acts strictly as a neutral mediator/venue. We do not own, create, or sell the assets listed by users, and we are not responsible for the quality, legality, or safety of the listings.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                2. User Accounts & Security
              </h2>
              <p className="text-sm">
                You must provide accurate and complete information when creating an account.
              </p>
              <p className="text-sm">
                Users are solely responsible for maintaining the confidentiality of their account credentials (passwords, emails). NextFlippers will not be liable for any loss resulting from unauthorized access to your account.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                3. Third-Party Services & Reselling Disclaimer
              </h2>
              <p className="text-sm">
                NextFlippers is <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with any third-party companies, including but not limited to OpenAI (ChatGPT), Anthropic (Claude), CapCut, Netflix, Google, Tencent, or Garena.
              </p>
              <p className="text-sm">
                All product names, logos, and brands are the property of their respective owners.
              </p>
              <p className="text-sm bg-yellow-50/50 border border-yellow-100 rounded-2xl p-4 text-xs font-medium text-yellow-850">
                Any trade or sale of premium accounts or gaming IDs is done at the user's own risk. NextFlippers does not guarantee that shared accounts or premium subscriptions will remain active permanently if they violate the original provider's standard terms of service.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                4. Escrow & Transaction Rules
              </h2>
              <p className="text-sm">
                To protect buyers and sellers, NextFlippers uses an internal escrow system.
              </p>
              <p className="text-sm">
                When a buyer purchases an item, the funds are held securely by the platform. The funds will only be released to the seller once the buyer confirms receipt and successful verification of the digital asset.
              </p>
              <p className="text-sm text-indigo-600 font-semibold">
                If a seller delivers an invalid account or fails to provide the service, the buyer must open a dispute immediately before the escrow time expires.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-500" />
                5. Prohibited Activities
              </h2>
              <p className="text-sm">
                Users are strictly prohibited from listing cracked software, stolen accounts, or engaging in fraudulent behavior.
              </p>
              <p className="text-sm p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-800 text-xs font-semibold">
                Any user found bypassing the platform's escrow system to deal directly with other users outside NextFlippers will be permanently banned and NextFlippers will not be responsible.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3 border-t border-gray-100 pt-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                6. Limitation of Liability
              </h2>
              <p className="text-sm">
                NextFlippers, its operators, and administrators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from account bans by third-party companies, data loss, or financial scams conducted by fraudulent users.
              </p>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
