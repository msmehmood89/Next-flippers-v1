import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroBanner from '../assets/images/regenerated_image_1778586133552.png';
import trustImage from '../assets/images/regenerated_image_1778824281911.jpg';
import { 
  Search, Shield, 
  ArrowRight, Users, 
  CheckCircle2, DollarSign, Clock, MessageSquare,
  Sparkles, Briefcase, FileText, Globe, Zap, Award, TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { label: 'Total Volume', value: '$2.4M+', icon: TrendingUp },
    { label: 'Active Buyers', value: '12,000+', icon: Users },
    { label: 'Avg. Sale Time', value: '14 Days', icon: Clock },
    { label: 'Success Rate', value: '98%', icon: Award },
  ];

  const steps = [
    {
      title: 'List Your Website',
      desc: 'Create a free listing in minutes. No upfront fees, no hidden costs.',
      icon: Briefcase,
      color: 'indigo'
    },
    {
      title: 'Get Verified Offers',
      desc: 'Connect with serious buyers through our secure messaging system.',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'Secure Escrow',
      desc: 'We hold funds securely until the website transfer is complete.',
      icon: Shield,
      color: 'green'
    },
    {
      title: 'Get Paid Fast',
      desc: 'Funds are released to your account instantly after verification.',
      icon: DollarSign,
      color: 'amber'
    }
  ];

  return (
    <div className="bg-white overflow-hidden">
      {/* Featured Hero Banner - Directly below header */}
      <section className="w-full bg-white border-b border-gray-100 overflow-hidden">
        <div className="w-full max-w-[1920px] mx-auto bg-gray-50 flex items-center justify-center">
          <img 
            src={heroBanner} 
            alt="Next Flippers - Payments Simplified! Deal Secured." 
            className="w-full h-auto block min-h-[100px]"
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-40 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] bg-[#dcfadf] rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-3xl opacity-50" />
          
          {/* Floating Icons/Bubbles */}
          {[
            { icon: Zap, color: 'from-blue-100 to-indigo-100', top: '15%', left: '10%', size: 'w-16 h-16', delay: 0 },
            { icon: Globe, color: 'from-indigo-100 to-blue-100', top: '45%', left: '5%', size: 'w-24 h-24', delay: 1 },
            { icon: Shield, color: 'from-blue-200 to-indigo-100', top: '75%', left: '15%', size: 'w-16 h-16', delay: 2 },
            { icon: DollarSign, color: 'from-indigo-100 to-blue-200', top: '20%', right: '10%', size: 'w-20 h-20', delay: 0.5 },
            { icon: MessageSquare, color: 'from-blue-100 to-indigo-200', top: '55%', right: '5%', size: 'w-20 h-20', delay: 1.5 },
            { icon: Clock, color: 'from-indigo-200 to-blue-100', top: '80%', right: '12%', size: 'w-14 h-14', delay: 2.5 },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ y: 0, opacity: 0 }}
              animate={{ 
                y: [-30, 30, -30],
                x: [-15, 15, -15],
                rotate: [0, 5, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 8 + Math.random() * 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: item.delay
              }}
              style={{
                top: item.top,
                left: item.left,
                right: item.right,
              }}
              className={cn(
                "absolute rounded-full flex items-center justify-center text-indigo-500 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-[2px] border border-white hover:opacity-80 transition-opacity bg-gradient-to-br",
                item.color,
                item.size
              )}
            >
              <item.icon className="w-1/2 h-1/2 opacity-70" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-[4px] opacity-30" />
            </motion.div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#fea925] text-black rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100/50 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            The #1 Manual Escrow Marketplace
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-6xl lg:text-[7rem] font-black text-gray-900 mb-8 tracking-tighter leading-[0.85] uppercase"
          >
            Liquidate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">Digital Assets</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg lg:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Join the elite club of digital entrepreneurs. List for free, trade with confidence, and grow your portfolio with our secure manual escrow service.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-all duration-700" />
            <div className="relative flex items-center p-2 bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100">
              <div className="flex-grow flex items-center px-10">
                <Search className="w-6 h-6 text-gray-300 mr-4" />
                <input
                  type="text"
                  placeholder="Search by category, platform, or keyword..."
                  className="w-full py-6 text-xl outline-none text-gray-900 placeholder:text-gray-400 font-medium bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-12 py-5 rounded-[2.5rem] font-black text-xl hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.4)] transition-all flex items-center gap-3 group/btn active:scale-95"
              >
                Search
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-6 text-gray-400 font-black uppercase tracking-[0.25em] text-[10px]"
          >
            {['Profitable Websites', 'Social Media accounts', 'Premium Themes', 'Mobile Apps', 'Aged accounts', 'Source Code'].map(tag => (
              <span key={tag} className="hover:text-indigo-600 transition-colors cursor-pointer">{tag}</span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works - Enhanced Trust Content */}
      <section id="how-it-works" className="py-32 bg-[#354d1a] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-black/10 -skew-x-12 translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-7xl font-black mb-8 tracking-tighter text-white"
            >
              The Most Trusted Way <br />
              <span className="text-[#Ffb703] not-italic" style={{ fontFamily: 'Verdana' }}>To Trade Online</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-indigo-200 max-w-3xl mx-auto text-xl leading-relaxed font-medium"
            >
              Direct & instant fully trusted payment solutions without extra fee's. 
              Secure handle through Admin Escrow ensures happy buyers and successful sellers.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              {
                title: 'Instant Direct Chat',
                desc: 'Negotiate instantly. Both buyer and seller can chat 24/7 to finalize deal terms and share details securely.',
                icon: MessageSquare
              },
              {
                title: 'Secure Admin Escrow',
                desc: 'Send payment directly to Admin. We hold the funds safely while you verify the assets/accounts.',
                icon: Shield
              },
              {
                title: '24/7 Live Support',
                desc: 'Our team monitors every transaction round the clock. We are always here to facilitate your deals.',
                icon: Clock
              },
              {
                title: 'Successful Payout',
                desc: 'Once you are 100% satisfied, payment is sent to the seller. Fast, transparent, and trusted.',
                icon: CheckCircle2
              }
            ].map((step, i) => {
              const stepStyles = [
                { 
                  bg: 'bg-gradient-to-br from-[#A8bd22] to-[#8FA211]', 
                  text: 'text-black', 
                  icon: 'bg-black/10 text-black', 
                  subText: 'text-black/80',
                  shadow: 'shadow-[0_20px_50px_rgba(168,189,34,0.3)]'
                },
                { 
                  bg: 'bg-gradient-to-br from-[#0d8c35] to-[#0a6d29]', 
                  text: 'text-white', 
                  icon: 'bg-white/20 text-white', 
                  subText: 'text-white/80',
                  shadow: 'shadow-[0_20px_50px_rgba(13,140,53,0.3)]'
                },
                { 
                  bg: 'bg-gradient-to-br from-[#d7b00e] to-[#c29f0d]', 
                  text: 'text-black', 
                  icon: 'bg-black/10 text-black', 
                  subText: 'text-black/80',
                  shadow: 'shadow-[0_20px_50px_rgba(215,176,14,0.3)]'
                },
                { 
                  bg: 'bg-gradient-to-br from-[#F85700] to-[#D64B00]', 
                  text: 'text-white', 
                  icon: 'bg-white/20 text-white', 
                  subText: 'text-white/80',
                  shadow: 'shadow-[0_20px_50px_rgba(248,87,0,0.3)]'
                },
              ];
              const style = stepStyles[i];

              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-white/10 -translate-x-6 z-0" />
                  )}
                  <div className={cn(
                    "relative z-10 p-8 rounded-[2.5rem] border border-white/20 transition-all duration-500",
                    style.bg,
                    style.shadow,
                    "hover:-translate-y-2 hover:brightness-105"
                  )}>
                    <div className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500",
                      style.icon
                    )}>
                      <step.icon className="w-10 h-10" />
                    </div>
                    <h3 className={cn("text-xl font-black mb-4 uppercase tracking-tight leading-none", style.text)}>
                      {step.title}
                    </h3>
                    <p className={cn("text-sm font-medium leading-relaxed", style.subText)}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-24 p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-black mb-1">Ready to start your journey?</h4>
                <p className="text-indigo-200">Join 12,000+ entrepreneurs today.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Link to="/register" className="bg-white text-indigo-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all">
                Get Started
              </Link>
              <Link to="/browse" className="bg-indigo-800 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all border border-indigo-700">
                Browse Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Freelance Marketplace Section */}
      <section className="py-24 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#c824ab]">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#38969e] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#c45e2a] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ffb703] backdrop-blur-md text-black text-[10px] font-black rounded-full border border-white/20 mb-6 uppercase tracking-widest">
                <Briefcase className="w-3.5 h-3.5" />
                New: Freelance Marketplace
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
                Hire Expert Talent for Your <span className="text-indigo-200">Digital Growth</span>
              </h2>
              <p className="text-lg text-indigo-100 mb-10 leading-relaxed opacity-90">
                Beyond buying and selling websites, you can now hire top-rated freelancers for SEO, Web Development, Content Writing, and more.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                {[
                  { title: 'Vetted Experts', desc: 'Only the best professionals.' },
                  { title: 'Secure Escrow', desc: 'Your money is safe with us.' },
                  { title: 'Fast Delivery', desc: 'Get results in record time.' },
                  { title: '24/7 Support', desc: 'We are here to help you.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{item.title}</div>
                      <div className="text-xs text-indigo-100 opacity-70">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/freelancers"
                className="inline-flex items-center gap-3 bg-[#ffb703] text-black px-10 py-5 rounded-2xl font-black text-lg hover:brightness-110 transition-all shadow-2xl shadow-black/20"
              >
                Explore Services
                <ArrowRight className="w-6 h-6" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-md rounded-[3rem] p-8 border border-white/20 shadow-2xl">
                <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Web Dev', icon: Globe, color: 'bg-[#34d08e]' },
                      { label: 'Design', icon: Award, color: 'bg-[#8ecae6]' },
                      { label: 'SEO', icon: Zap, color: 'bg-[#A8bd22]' },
                      { label: 'Content', icon: FileText, color: 'bg-[#F85700]' }
                    ].map((cat, i) => (
                      <div key={i} className="bg-[#c8f1d6] rounded-3xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto mb-4", cat.color)}>
                        <cat.icon className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-black text-gray-900">{cat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Floating Element */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Earned</div>
                    <div className="text-xl font-black text-gray-900">$12,450.00</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 bg-[#d1ffed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50" />
              <img 
                src={trustImage} 
                alt="Trust" 
                className="rounded-[3rem] shadow-2xl relative z-10"
              />
              <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl z-20 border border-gray-100 max-w-xs">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="font-black text-gray-900">Verified Escrow</div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">We manually verify every transaction to ensure your funds and assets are safe.</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-none">Why Choose Next Flippers?</h2>
              <p className="text-lg text-gray-500 leading-relaxed">We've built a platform that prioritizes security and simplicity over everything else. No automated bots, just real people facilitating real deals.</p>
              
              <div className="space-y-6">
                  {[
                    { title: 'Manual Verification', desc: 'Every listing is reviewed by our team before going live.' },
                    { title: 'Escrow Protection', desc: 'Funds are only released when both parties are 100% satisfied.' },
                    { title: 'Zero Hidden Fees', desc: 'Transparent commission structure with no surprises.' },
                    { title: 'Direct Communication', desc: 'Chat directly with sellers and negotiate the best price.' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-6 bg-[#ffb703] rounded-3xl border border-black/5 hover:brightness-105 hover:shadow-xl transition-all">
                      <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-black mb-1">{item.title}</h4>
                      <p className="text-sm text-black font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
