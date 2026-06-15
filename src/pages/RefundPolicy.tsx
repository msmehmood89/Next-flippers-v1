import React from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  XCircle, 
  Gavel, 
  UserX, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Refund & Escrow Policy</h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Security Guarantees & Transaction Rules • Last updated: June 2026
              </p>
            </div>
          </div>

          {/* Intro Text */}
          <div className="p-6 bg-gradient-to-r from-indigo-50/40 to-blue-50/40 border border-indigo-100/60 rounded-3xl text-sm leading-relaxed text-gray-600">
            At <strong className="text-gray-900">NextFlippers</strong>, we use a secure Escrow system to guarantee that both buyers and sellers are fully protected during digital asset transactions. By initiating a transaction on our platform, you agree to the following terms.
          </div>

          {/* Sections */}
          <div className="space-y-10 text-gray-600 leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                1. How the Escrow System Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">01</div>
                  <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Payment Holding</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    When a buyer purchases an asset, their money is securely held by NextFlippers. The funds are <strong>NOT</strong> immediately transferred to the seller.
                  </p>
                </div>

                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">02</div>
                  <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">Verification Window</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Once the seller delivers the credentials/service, the buyer gets a standard <strong>24-hour verification window</strong> to log in, inspect, and verify the asset.
                  </p>
                </div>

                <div className="p-5 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl space-y-2">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">03</div>
                  <h3 className="font-extrabold text-indigo-900 text-xs uppercase tracking-wider">Payment Release</h3>
                  <p className="text-xs text-indigo-950 leading-relaxed">
                    If correct and working, the buyer confirms acceptance. Funds are permanently released to the seller's wallet, and the deal is closed.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                2. Refund Conditions & Eligibility
              </h2>
              <p className="text-sm">
                A buyer is strictly eligible for a full or partial refund <strong>ONLY</strong> under the following circumstances:
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: 'Non-Delivery',
                    desc: 'The seller fails to deliver the login credentials, files, or complete the service within the agreed-upon timeframe.'
                  },
                  {
                    title: 'Not as Described',
                    desc: 'The digital asset or account delivered does not match the description, features, or specifications listed by the seller.'
                  },
                  {
                    title: 'Invalid Credentials',
                    desc: 'The provided login information (username/password) for premium tools, gaming IDs, or domains is incorrect or revoked upon delivery.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                3. Non-Refundable Scenarios
              </h2>
              <p className="text-sm">
                NextFlippers cannot and will not issue a refund in the following situations:
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: "Buyer's Remorse",
                    desc: "The buyer changes their mind after the seller has successfully delivered the correct and working asset."
                  },
                  {
                    title: "Post-Release Bans",
                    desc: "The buyer accepts the transaction, funds are released to the seller, and the account gets banned days later by the third-party company (e.g., OpenAI, Netflix, Tencent) due to the nature of shared accounts. It is the buyer's responsibility to understand the risk of buying third-party shared premium accounts."
                  },
                  {
                    title: "Expired Verification Window",
                    desc: "The buyer fails to check the asset or open a dispute within the 24-hour verification window, and the system automatically releases the funds to the seller."
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-red-50/30 border border-red-100 rounded-2xl">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-red-950 uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Gavel className="w-5 h-5 text-indigo-600" />
                4. Dispute Resolution Process
              </h2>
              <p className="text-sm">
                If a buyer encounters any problem with the delivered asset, they must click the <strong>"Open Dispute"</strong> button before the escrow time expires.
              </p>
              <p className="text-sm">
                Once a dispute is opened, the escrow funds are locked, and the NextFlippers administration team will step in to review the case.
              </p>
              <p className="text-sm">
                Both parties will be asked to provide screenshots, screen recordings, or access proofs. If the seller is found to be fraudulent or uncooperative, the dispute will be settled in favor of the buyer, and a full refund will be processed back to the buyer's account balance/original payment method.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3 border-t border-gray-100 pt-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-600" />
                5. Unauthorized Chargebacks & Frauds
              </h2>
              <p className="text-sm p-4 bg-red-50 text-red-950 rounded-2xl border border-red-100 text-xs font-medium">
                Buyers who attempt to open unauthorized disputes or file external payment chargebacks (via bank or card) after receiving a fully functional digital asset will have their NextFlippers account permanently banned, and their details blacklisted.
              </p>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
