import React from 'react';
import { Shield, Lock, Eye, FileText, Database, Cookie, Megaphone, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm space-y-10">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                Data Protection & User Privacy • Last updated: June 2026
              </p>
            </div>
          </div>

          {/* Intro Text */}
          <div className="p-6 bg-gradient-to-r from-indigo-50/40 to-blue-50/40 border border-indigo-100/60 rounded-3xl text-sm leading-relaxed text-gray-600">
            At <strong className="text-gray-900">NextFlippers</strong>, accessible from <a href="https://nextflippers.com" className="text-indigo-600 underline font-semibold">nextflippers.com</a>, one of our main priorities is the privacy of our visitors and users. This Privacy Policy document contains types of information that is collected and recorded by NextFlippers and how we use it.
          </div>

          {/* Sections */}
          <div className="space-y-10 text-gray-600 leading-relaxed">
            
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                1. Information We Collect
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                  <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    Personal Data
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    When you register an account, buy or sell assets, or contact us, we may ask for personal information, including your name, email address, and payment details.
                  </p>
                </div>

                <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                  <h3 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Log Files
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    NextFlippers follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, and referring/exit pages.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                2. How We Use Your Information
              </h2>
              <p className="text-sm">
                We use your information to operate and protect our platform. Specifically, this metadata and data is utilized:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                {[
                  'To provide, operate, and maintain our escrow marketplace platform.',
                  'To process transaction details, securely manage payouts, and prevent fraudulent activities.',
                  'To communicate with you regarding your dispute tickets, account updates, or support requests.',
                  'To improve, personalize, and expand our website features based on user behavior.'
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-indigo-50/20 border border-indigo-100/40 rounded-2xl">
                    <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i+1}</div>
                    <p className="text-xs text-gray-600 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                3. Data Security & Communication Privacy
              </h2>
              <p className="text-sm">
                We implement robust security measures to protect your personal data from unauthorized access, alteration, or leak.
              </p>
              <p className="text-sm p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-xs text-gray-700 leading-relaxed">
                Any account credentials, credentials shared inside the delivery system, or chat messages between buyers and sellers are securely stored and are only accessible by administrators during a dispute investigation.
              </p>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Cookie className="w-5 h-5 text-indigo-600" />
                4. Cookies and Web Beacons
              </h2>
              <p className="text-sm">
                Like any other website, NextFlippers uses "cookies". These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                5. Third-Party Privacy Policies & AdSense
              </h2>
              <p className="text-sm">
                NextFlippers's Privacy Policy does not apply to other advertisers or websites. We may use third-party advertising companies (like Google AdSense) to serve ads when you visit our website. These companies may use cookies to serve ads based on your prior visits to our website or other websites.
              </p>
              <p className="text-sm font-semibold text-gray-800">
                You can choose to disable cookies through your individual browser options.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3 border-t border-gray-100 pt-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                6. Children's Information
              </h2>
              <p className="text-sm">
                Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. NextFlippers does not knowingly collect any Personal Identifiable Information from children under the age of 13.
              </p>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
