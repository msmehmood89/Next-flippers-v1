import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  LifeBuoy, Send, MessageSquare, 
  Clock, ShieldCheck, AlertCircle,
  ChevronRight, Mail, Phone, HelpCircle,
  History, X, CheckCircle2, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

export default function Support() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [userReply, setUserReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message || !formData.subject) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        ...formData,
        userId: user?.uid || 'anonymous',
        userName: profile?.name || 'Anonymous',
        status: 'open',
        priority: 'medium',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
      setFormData({ ...formData, subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserReply = async () => {
    if (!selectedTicket || !userReply.trim()) return;

    setIsReplying(true);
    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      const newReply = {
        message: userReply,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };

      const updatedReplies = [...(selectedTicket.replies || []), newReply];
      
      await updateDoc(ticketRef, { 
        replies: updatedReplies,
        status: 'open', // Reopen or keep open if user replies
        updatedAt: serverTimestamp()
      });

      setSelectedTicket(prev => ({ ...prev, replies: updatedReplies, status: 'open' }));
      setUserReply('');
    } catch (error) {
      console.error('Error replying to ticket:', error);
    } finally {
      setIsReplying(false);
    }
  };

  const faqs = [
    { q: "How do I buy a website?", a: "Browse the marketplace, find a site you like, and click 'Buy Now'. Follow the payment instructions to start the secure escrow process." },
    { q: "Is my payment secure?", a: "Yes, we use a secure escrow system. Funds are only released to the seller once you have successfully received the website assets." },
    { q: "How long does transfer take?", a: "Most transfers are completed within 24-48 hours, depending on the domain registrar and hosting provider." },
    { q: "Can I sell my own gig?", a: "Absolutely! Switch to a 'Seller' profile in your settings and click 'Post Gig' to start offering your services." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <LifeBuoy className="w-4 h-4" />
            Help Center
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight mb-6"
          >
            How can we <span className="text-indigo-600">help?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto font-medium"
          >
            Our support team is available 24/7 to help you with any issues or questions you might have.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Form & Tickets */}
          <div className="lg:col-span-2 space-y-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-indigo-100/50 border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Open a Ticket</h2>
                  <p className="text-sm text-gray-500 font-bold">We'll get back to you within 2 hours.</p>
                </div>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-100 rounded-3xl p-10 text-center"
                >
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-green-200">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Ticket Submitted!</h3>
                  <p className="text-gray-600 font-medium mb-8">Your support ticket has been created successfully. Check your dashboard for updates.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-gray-800 transition-all"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Email</label>
                      <input
                        type="email"
                        required
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                      <select
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="general">General Inquiry</option>
                        <option value="billing">Billing & Payments</option>
                        <option value="technical">Technical Issue</option>
                        <option value="report">Report a User</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Subject</label>
                    <input
                      type="text"
                      required
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                      placeholder="What can we help you with?"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Message</label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none"
                      placeholder="Describe your issue in detail..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Ticket
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* My Tickets Section */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-indigo-100/50 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">My Tickets</h2>
                    <p className="text-sm text-gray-500 font-bold">Track your support history.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {tickets.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold">You haven't submitted any tickets yet.</p>
                    </div>
                  ) : (
                    tickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all group text-left"
                      >
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            ticket.status === 'open' ? "bg-amber-500" : 
                            ticket.status === 'in-progress' ? "bg-blue-500" :
                            "bg-green-500"
                          )} />
                          <div>
                            <div className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{ticket.subject}</div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{ticket.category}</span>
                              <span className="text-[10px] font-black text-gray-300">•</span>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : new Date(ticket.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {ticket.replies?.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full">
                              <MessageCircle className="w-3 h-3" />
                              <span className="text-[10px] font-black">{ticket.replies.length}</span>
                            </div>
                          )}
                          <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            ticket.status === 'open' ? "bg-amber-100 text-amber-600" : 
                            ticket.status === 'in-progress' ? "bg-blue-100 text-blue-600" :
                            "bg-green-100 text-green-600"
                          )}>
                            {ticket.status}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-all" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200"
            >
              <h3 className="text-xl font-black mb-6">Quick Contact</h3>
              <div className="space-y-6">
                <a 
                  href="https://wa.me/923330758018" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <MessageCircle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">WhatsApp Support</div>
                    <div className="text-sm font-bold">Open Chat</div>
                  </div>
                </a>
                <a 
                  href="mailto:support@nextflippers.com"
                  className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all group"
                >
                  <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Us</div>
                    <div className="text-sm font-bold">Compose Email</div>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Response Time</div>
                    <div className="text-sm font-bold">Under 2 Hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      All Systems Operational
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-100"
            >
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                Common FAQs
              </h3>
              <div className="space-y-4">
                {faqs.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div 
                      key={i} 
                      className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50 hover:bg-white hover:border-indigo-100 transition-all shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left transition-colors font-bold text-gray-800 hover:text-indigo-600 focus:outline-none"
                      >
                        <span className="text-xs">{faq.q}</span>
                        <ChevronRight className={cn(
                          "w-4 h-4 text-gray-400 transition-transform duration-300",
                          isOpen && "rotate-90 text-indigo-600"
                        )} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-1 bg-white border-t border-gray-50 text-xs font-medium text-gray-500 leading-relaxed">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100"
            >
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-black uppercase tracking-widest">Safety Tip</span>
              </div>
              <p className="text-xs text-amber-700 font-bold leading-relaxed">
                Never share your password or payment details outside of our secure platform. NextFlippers staff will never ask for your login credentials.
              </p>
            </motion.div>
          </div>
        </div>
      </div>      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full ring-4",
                    selectedTicket.status === 'open' ? "bg-amber-500 ring-amber-100 animate-pulse" : 
                    selectedTicket.status === 'in-progress' ? "bg-blue-500 ring-blue-100 animate-pulse" :
                    selectedTicket.status === 'closed' ? "bg-gray-400 ring-gray-100" :
                    "bg-green-500 ring-green-100"
                  )} />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Ticket Details</span>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">ID: #{selectedTicket.id.slice(0, 8).toUpperCase()}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {/* Structured Ticket details card */}
                <div className="bg-gradient-to-br from-indigo-50/50 via-white to-gray-50/50 rounded-3xl p-6 border border-indigo-100/50 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Support Request Card</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
                      selectedTicket.status === 'open' ? "bg-amber-500" : 
                      selectedTicket.status === 'in-progress' ? "bg-blue-500" :
                      selectedTicket.status === 'closed' ? "bg-gray-500" :
                      "bg-green-600"
                    )}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-gray-500">
                    <div className="p-3 bg-white/80 rounded-xl border border-gray-100">
                      <span className="block text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Category</span>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest mt-0.5",
                        selectedTicket.category === 'billing' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        selectedTicket.category === 'technical' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        selectedTicket.category === 'report' ? "bg-orange-50 text-orange-700 border border-orange-100" :
                        selectedTicket.category === 'general' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        "bg-gray-50 text-gray-700 border border-gray-100"
                      )}>
                        {selectedTicket.category === 'billing' ? "💼 Billing & Payments" :
                         selectedTicket.category === 'technical' ? "⚙️ Technical Issue" :
                         selectedTicket.category === 'report' ? "⚠️ Report User" :
                         selectedTicket.category === 'general' ? "ℹ️ General Inquiry" :
                         `📁 ${selectedTicket.category || 'Other'}`}
                      </span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-gray-100">
                      <span className="block text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Submitted On</span>
                      <span className="text-gray-900">
                        {selectedTicket.createdAt?.toDate 
                          ? selectedTicket.createdAt.toDate().toLocaleString() 
                          : (selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'Syncing...')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="block text-[9px] uppercase font-black text-indigo-600 tracking-widest">Subject Of Discussion</span>
                    <h4 className="text-base font-extrabold text-gray-900 leading-snug">{selectedTicket.subject}</h4>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[9px] uppercase font-black text-gray-400 tracking-widest ml-1">Original Issue Details</span>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap relative italic">
                      <span className="absolute -top-3 left-4 text-4xl text-indigo-200/50 font-serif translate-y-1">“</span>
                      <p className="relative z-10 pl-2">{selectedTicket.message}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Conversation Thread</h4>
                  </div>
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    <div className="space-y-6">
                      {selectedTicket.replies.map((reply: any, i: number) => (
                        <div 
                          key={i} 
                          className={cn(
                            "rounded-3xl p-5 border shadow-sm transition-all relative",
                            reply.isAdmin 
                              ? "bg-indigo-50/60 border-indigo-100 ml-8" 
                              : "bg-gray-50 border-gray-100 mr-8"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                              reply.isAdmin ? "text-indigo-600" : "text-gray-500"
                            )}>
                              {reply.isAdmin ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  🛡️ NextFlippers Support Agent
                                </>
                              ) : "You"}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : new Date(reply.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-[11px] text-gray-400 font-bold">Waiting for support team response...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <div className="space-y-4">
                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' ? (
                    <>
                      <textarea
                        rows={3}
                        placeholder="Type your reply to support message..."
                        className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none shadow-inner"
                        value={userReply}
                        onChange={(e) => setUserReply(e.target.value)}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            disabled={isUpdatingStatus !== null}
                            onClick={async () => {
                              setIsUpdatingStatus('resolved');
                              try {
                                const newStatus = 'resolved';
                                await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: newStatus });
                                setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                              } catch (error) {
                                console.error('Error updating status:', error);
                                alert('Failed to mark support ticket as resolved.');
                              } finally {
                                setIsUpdatingStatus(null);
                              }
                            }}
                            className="px-4 py-2.5 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all inline-flex items-center gap-1.5"
                          >
                            {isUpdatingStatus === 'resolved' ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : null}
                            Mark as Resolved
                          </button>
                          
                          <button
                            type="button"
                            disabled={isUpdatingStatus !== null}
                            onClick={async () => {
                              setIsUpdatingStatus('closed');
                              try {
                                const newStatus = 'closed';
                                await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: newStatus });
                                setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                              } catch (error) {
                                console.error('Error updating status:', error);
                                alert('Failed to close support ticket.');
                              } finally {
                                setIsUpdatingStatus(null);
                              }
                            }}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all inline-flex items-center gap-1.5"
                          >
                            {isUpdatingStatus === 'closed' ? (
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : null}
                            Close Ticket
                          </button>
                        </div>

                        <button
                          onClick={handleUserReply}
                          disabled={isReplying || !userReply.trim()}
                          className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-150 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isReplying ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Reply
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/50 border border-gray-100 rounded-2xl">
                      <div className="text-left">
                        <p className="text-xs font-black text-gray-800 uppercase tracking-widest">Ticket is {selectedTicket.status}</p>
                        <p className="text-[11px] text-gray-400 mt-1">If your issue is not fully addressed, you may re-open it to continue.</p>
                      </div>
                      <button
                        type="button"
                        disabled={isUpdatingStatus !== null}
                        onClick={async () => {
                          setIsUpdatingStatus('open');
                          try {
                            const newStatus = 'open';
                            await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: newStatus });
                            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                          } catch (error) {
                            console.error('Error re-opening ticket:', error);
                            alert('Failed to re-open support ticket.');
                          } finally {
                            setIsUpdatingStatus(null);
                          }
                        }}
                        className="px-5 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all inline-flex items-center gap-2"
                      >
                        {isUpdatingStatus === 'open' ? (
                          <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        Re-open Ticket
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
