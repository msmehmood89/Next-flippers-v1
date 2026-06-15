import React from 'react';
import { 
  ArrowRight, 
  Search, 
  ShoppingBag, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Send, 
  Wallet, 
  ShieldCheck, 
  DollarSign, 
  ArrowUpRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <main className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Security Guaranteed
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
            How NextFlippers Works
          </h1>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            Welcome to the ultimate peer-to-peer (P2P) digital asset marketplace. We make buying and selling websites, gaming IDs, and premium accounts 100% safe through our secure escrow system.
          </p>
        </div>

        {/* The Escrow System Concept Card (Featured) */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Lock className="w-64 h-64" />
          </div>
          
          <div className="max-w-xl space-y-6 relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-800/40 px-3 py-1 rounded-full">
              Core Protection Mechanism
            </span>
            <h2 className="text-2.5xl md:text-3xl font-extrabold tracking-tight">
              What is Escrow Protection?
            </h2>
            <p className="text-indigo-200 text-sm md:text-base leading-relaxed font-medium">
              We never transfer money directly to the seller upon purchase. Instead, we act as a trusted third-party holder. The buyer's money is safely secured by NextFlippers until the buyer logs in, verifies the asset, and clicks "Confirm Receipt". 
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                to="/refund-policy" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-5050 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-indigo-500"
              >
                Read Refund & Escrow Policy
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Escrow Process step visual flow */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">The 4-Step Escrow Timeline</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Automatic & Secure Framework</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Buyer Makes Payment',
                desc: 'Buyer purchases the asset (using standard crypto, bank draft, wallet/easy-paisa). The money enters our secure locked escrow holding.',
                icon: DollarSign,
                badgeColor: 'bg-indigo-50 text-indigo-600',
              },
              {
                step: '02',
                title: 'Seller Delivers Asset',
                desc: 'The seller gets notified and shares credentials/handover details securely via our messaging or automated digital delivery system.',
                icon: Send,
                badgeColor: 'bg-amber-50 text-amber-600',
              },
              {
                step: '03',
                title: '24H Inspection Window',
                desc: 'Buyer inspects, logs in, checks details and ensures the premium account, subscription, or game ID works exactly "as described".',
                icon: Search,
                badgeColor: 'bg-emerald-50 text-emerald-600',
              },
              {
                step: '04',
                title: 'Funds Released / Closed',
                desc: 'Once the buyer approves, funds are instantly added to the seller\'s withdrawable balance. In case of issues, a manual dispute takes place.',
                icon: CheckCircle2,
                badgeColor: 'bg-blue-50 text-blue-600',
              }
            ].map((stepItem, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full">Step {stepItem.step}</span>
                    <div className={`p-2.5 rounded-xl ${stepItem.badgeColor}`}>
                      <stepItem.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 tracking-tight">{stepItem.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-normal">{stepItem.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Roles Tabs / Buyers vs Sellers Instructions Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          
          {/* BUYER SIDE CARDS */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">For Buyers</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Purchasing premium assets</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { number: 1, text: 'Search the marketplace for premium accounts, digital websites, or freelancer gigs.' },
                { number: 2, text: 'Choose your desired asset, read reviews, and click "Buy Now" to proceed.' },
                { number: 3, text: 'Upload your proof of payment on the instructions page. Our staff will confirm the funding.' },
                { number: 4, text: 'Receive credentials in chat from the seller. Verify details (passwords, emails, rules).' },
                { number: 5, text: 'Approve the order under "My Purchases" to release funds. If something goes wrong, click "Open Dispute" to stop escrow release.' }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {step.number}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link 
                to="/browse" 
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
              >
                Browse Marketplace
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* SELLER SIDE CARDS */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight">For Sellers</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Selling your digital work & accounts</p>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { number: 1, text: 'Register an account and tap "List Website/Account" or "Offer a Service" on your dashboard.' },
                { number: 2, text: 'Provide accurate descriptions, specifications, screenshots, and set a fair price.' },
                { number: 3, text: 'Wait for buyers to purchase. You will receive an email or chat notification when a buyer deposits money.' },
                { number: 4, text: 'Share logins or files with the buyer in chat. Never share credentials before funding is confirmed!' },
                { number: 5, text: 'Once the buyer inspects and marks completed, your funds are added immediately to your wallet balance.' }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {step.number}
                  </span>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link 
                to="/dashboard" 
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
              >
                Go to Seller Dashboard
                <PlusCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>

        {/* Security / Safety Reminders section */}
        <div className="p-8 md:p-10 bg-yellow-50/50 border border-yellow-100 rounded-[2rem] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="col-span-1 md:col-span-2 flex justify-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-yellow-250">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
          <div className="col-span-1 md:col-span-10 space-y-2">
            <h4 className="text-base font-extrabold text-yellow-950 uppercase tracking-tight">Crucial Security Rules:</h4>
            <div className="space-y-1.5 text-xs text-yellow-900 leading-relaxed font-medium">
              <p>• <strong>Never Deal Outside NextFlippers:</strong> Direct deals bypass escrow protection. If you send payment directly or hand over accounts without platform verification, you lose 100% of your security coverage.</p>
              <p>• <strong>Submit Payment Proof:</strong> Do not forget to attach clear screenshots or PDFs of your transaction details after dispatching funds so our admins can lock the escrow quickly.</p>
              <p>• <strong>Check the 24H clock:</strong> Make sure to inspect accounts before the escrow confirmation timer runs out. Once the payment releases, the transaction is marked final and irrevocable.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
