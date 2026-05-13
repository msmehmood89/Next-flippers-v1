import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Listing } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, TrendingUp, Users, Globe, ArrowRight, List, MessageSquare, ShoppingBag, Shield, ChevronRight, Heart, DollarSign, X, CheckCircle2, PartyPopper } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency, cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

export default function DashboardHome() {
  const { profile, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [regMethod, setRegMethod] = useState<string | null>(null);
  const [stats, setStats] = useState({
    listings: 0,
    messages: 0,
    purchases: 0,
    sales: 0,
    favorites: 0,
  });
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const welcome = searchParams.get('welcome');
    const method = searchParams.get('method');
    if (welcome === 'true') {
      setShowWelcome(true);
      if (method) setRegMethod(method);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#4f46e5']
      });
      // Clear the param
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('welcome');
      newParams.delete('method');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const listingsQ = query(collection(db, 'listings'), where('userId', '==', user.uid));
        const listingsSnap = await getDocs(listingsQ);
        
        const purchasesQ = query(collection(db, 'transactions'), where('buyerId', '==', user.uid));
        const purchasesSnap = await getDocs(purchasesQ);

        const salesQ = query(collection(db, 'transactions'), where('sellerId', '==', user.uid));
        const salesSnap = await getDocs(salesQ);

        const messagesQ = query(collection(db, 'chats'), where('buyerId', '==', user.uid));
        const messagesSnap = await getDocs(messagesQ);

        setStats({
          listings: listingsSnap.size,
          purchases: purchasesSnap.size,
          sales: salesSnap.size,
          messages: messagesSnap.size,
          favorites: profile?.favorites?.length || 0,
        });

        const recentQ = query(
          collection(db, 'listings'), 
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const recentSnap = await getDocs(recentQ);
        setRecentListings(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, profile]);

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden relative"
            >
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
                id="close-welcome-modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-12 text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <PartyPopper className="w-10 h-10" />
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                  Welcome to <br />
                  <span className="text-emerald-500">Next Flippers!</span>
                </h2>
                
                <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                  We're absolutely thrilled to have you here, {profile?.name}! Your account is now active and you're ready to start your journey in the world of premium digital assets.
                </p>

                <div className="grid grid-cols-1 gap-4 mb-10">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50 text-left">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-emerald-500">
                      {regMethod === 'email' ? <Shield className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900">
                        {regMethod === 'email' 
                          ? 'Please make sure to safe your email and password' 
                          : 'Email Verified'}
                      </div>
                      <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {regMethod === 'email' ? 'Security Notice' : 'Account Secure'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-[0.98]"
                    id="welcome-get-started"
                  >
                    Get Started Now
                  </button>
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    The premium destination for digital assets
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back, {profile?.name}!</h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Here's what's happening with your digital assets today</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/dashboard/listings/new" 
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Create Listing
          </Link>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
            <TrendingUp className="w-4 h-4" />
            Write Blog
          </button>
        </div>
      </div>

      {/* Primary Stats Grid - Deelzo Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Listings', value: stats.listings, sub: '0 active', icon: List, color: 'text-blue-500' },
          { label: 'Total Views', value: '0', sub: 'All time', icon: Globe, color: 'text-emerald-500' },
          { label: 'Total Bids', value: '0', sub: 'Received', icon: MessageSquare, color: 'text-purple-500' },
          { label: 'Portfolio Value', value: '$0', sub: 'Total listings value', icon: DollarSign, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] flex flex-col relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest leading-tight">{stat.label}</div>
                <div className="text-3xl font-black text-gray-900 mt-1.5">{stat.value}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-1 italic opacity-80">{stat.sub}</div>
              </div>
              <div className={cn("p-2.5 rounded-xl bg-gray-50 transition-colors group-hover:bg-gray-100", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className={cn("absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:w-full", i === 0 ? "bg-blue-500 w-8" : i === 1 ? "bg-emerald-500 w-8" : i === 2 ? "bg-purple-500 w-8" : "bg-amber-500 w-8")} />
          </div>
        ))}
      </div>

      {/* Colored Status Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active', value: stats.listings, icon: Globe, bg: 'bg-emerald-500' },
          { label: 'Pending', value: '0', icon: TrendingUp, bg: 'bg-amber-500' },
          { label: 'Sold', value: stats.sales, icon: ShoppingBag, bg: 'bg-blue-500' },
          { label: 'Blogs', value: '0', icon: List, bg: 'bg-purple-500' },
          { label: 'Rating', value: '0.0', icon: Heart, bg: 'bg-rose-500' },
        ].map((item, i) => (
          <div key={i} className={cn("p-4 rounded-2xl text-white flex flex-col items-center justify-center text-center shadow-sm", item.bg)}>
            <item.icon className="w-6 h-6 mb-2 opacity-80" />
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-90">{item.label}</div>
            <div className="text-2xl font-black mt-1">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Recent Listings Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Recent Listings</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Your latest digital assets</p>
            </div>
            <Link to="/dashboard/listings" className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:gap-2 transition-all uppercase tracking-widest">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Crunching data...</p>
              </div>
            ) : recentListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentListings.map(listing => (
                  <Link key={listing.id} to={`/listing/${listing.id}`} className="block group">
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-gray-100 shadow-sm">
                      <img 
                        src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/400/225`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt=""
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-black text-gray-900 uppercase">
                        {listing.status}
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">{listing.title}</h3>
                    <p className="text-xs font-bold text-emerald-500 mt-1">{formatCurrency(listing.askingPrice)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                  <List className="w-8 h-8" />
                </div>
                <h3 className="text-gray-900 font-black tracking-tight">No listings yet</h3>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1 mb-6">Create your first listing to get started</p>
                <Link to="/dashboard/listings/new" className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition-all flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Create Listing
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Blogs Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Recent Blogs</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Your latest articles</p>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:gap-2 transition-all uppercase tracking-widest">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4 border border-gray-100">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 font-black tracking-tight">No blogs yet</h3>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-1 mb-6">Share your knowledge with the community</p>
              <button className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 transition-all flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                Write Blog
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Footer Card - Deelzo Style */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="px-8 pb-8 -mt-12 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-white rounded-full p-2 shadow-xl mx-auto">
              <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl font-black border-2 border-white overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                ) : (
                  profile?.name?.[0] || 'U'
                )}
              </div>
            </div>
            <div className="absolute bottom-1 right-2 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white">
              <Shield className="w-3 h-3" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mt-4 tracking-tight">{profile?.name}</h2>
          <div className="text-emerald-600 font-bold text-sm">{profile?.email}</div>
          <div className="mt-8">
            <Link to={`/profile/${profile?.username}`} className="text-emerald-600 text-[11px] font-bold uppercase tracking-widest border-b-2 border-emerald-100 pb-1 hover:border-emerald-500 transition-all">
              View Public Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
