import { MessageSquare, Mail, MapPin, Send, MessageCircle } from 'lucide-react';

export default function Contact() {
  const whatsappNumber = "+923330758018";
  const whatsappLink = `https://wa.me/${whatsappNumber.replace('+', '')}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-10">
      
      <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-500">Have questions about a listing or our escrow process? We're here to help.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-green-50 rounded-2xl flex-shrink-0">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">WhatsApp Support</h3>
                  <p className="text-gray-500 mb-4">Fastest response for urgent inquiries.</p>
                  <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 font-bold hover:underline"
                  >
                    Chat on WhatsApp <Send className="w-4 h-4 text-green-600" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-indigo-50 rounded-2xl flex-shrink-0">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Email Us</h3>
                  <p className="text-gray-500 mb-2">support@nextflippers.com</p>
                  <p className="text-sm text-gray-400">Response time: Within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gray-50 rounded-2xl flex-shrink-0">
                  <MapPin className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Headquarters</h3>
                  <p className="text-gray-500">Global Operations Center</p>
                  <p className="text-sm text-gray-400">Digital City, Pakistan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Form (Visual Only for now) */}
          <div className="bg-white rounded-3xl p-10 border border-gray-100 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Send a Message</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="Escrow Inquiry" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
