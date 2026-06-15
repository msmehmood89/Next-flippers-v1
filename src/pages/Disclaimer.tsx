import React from 'react';
import { ShieldAlert, Users, Compass, AlertTriangle, Landmark, Globe } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Disclaimer</h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Legal Notice & Marketplace Information • Last updated: June 2026
              </p>
            </div>
          </div>

          {/* Intro Text */}
          <div className="p-6 bg-gradient-to-r from-orange-50/40 to-yellow-50/40 border border-orange-100/60 rounded-3xl text-sm leading-relaxed text-gray-600">
            The information and services provided on <strong className="text-gray-900">NextFlippers</strong> (accessible at <a href="https://nextflippers.com" className="text-indigo-600 underline font-semibold">nextflippers.com</a>) are for general informational and peer-to-peer trading purposes only. By using this website, you acknowledge and agree to the terms of this Disclaimer.
          </div>

          {/* Sections */}
          <div className="space-y-8 text-gray-600 leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                1. No Official Affiliation with Third-Party Brands
              </h2>
              <p className="text-sm">
                NextFlippers is a neutral, independent peer-to-peer (P2P) marketplace. We are <strong>NOT affiliated, associated, authorized, endorsed by, or in any way officially connected</strong> with any third-party companies, brands, or platforms listed on our site, including but not limited to:
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {[
                  'OpenAI (ChatGPT)',
                  'Anthropic (Claude)',
                  'CapCut',
                  'Netflix',
                  'Google / YouTube',
                  'Tencent / Garena (PUBG, Free Fire, etc.)'
                ].map((brand, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-800">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" />
                    {brand}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 italic pt-2">
                All product names, logos, trademarks, and registered trademarks displayed on this website are the property of their respective owners. Their use on NextFlippers does not imply any affiliation, sponsorship, or endorsement.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                2. Assumption of Risk for Digital Assets & Accounts
              </h2>
              <p className="text-sm">
                NextFlippers does not create, host, or stock the premium accounts, gaming IDs, or digital services listed on the platform. All listings are uploaded and delivered directly by independent third-party sellers.
              </p>
              <p className="text-sm">
                Buying shared premium accounts or gaming IDs carries an inherent risk, as third-party companies frequently update their Terms of Service and may restrict, suspend, or ban accounts that are resold or shared.
              </p>
              <p className="text-sm p-4 bg-red-50/50 border border-red-100 rounded-2xl text-red-800 text-xs font-medium">
                Any purchase made on NextFlippers is done strictly at the user's own risk. NextFlippers will not be held liable for any subsequent account terminations, losses, or damages applied by the original service providers after the escrow verification period has concluded.
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                3. "As Is" and "As Available" Services
              </h2>
              <p className="text-sm">
                All digital assets, themes, plugins, and services are provided on an "as is" and "as available" basis by the sellers. NextFlippers makes no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the digital goods listed by users.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 border-t border-gray-100 pt-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                4. Limitation of Liability
              </h2>
              <p className="text-sm">
                In no event shall NextFlippers, its operators, or its administrators be liable for any financial loss, data loss, account bans, or indirect damages arising out of the use, inability to use, or transactions conducted on this platform.
              </p>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
