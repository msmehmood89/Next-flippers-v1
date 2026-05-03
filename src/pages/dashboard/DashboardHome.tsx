import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Listing } from '../../types';
import { motion } from 'motion/react';
import { TrendingUp, Users, Globe, ArrowRight, List, MessageSquare, ShoppingBag, Shield, ChevronRight, Heart, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '../../lib/utils';

export default function DashboardHome() {
  const { profile, user } = useAuth();
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
  }, [user]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {profile?.name}!</h1>
        <p className="text-gray-500">Here's what's happening with your account today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: 'My Listings', value: stats.listings, icon: List, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Active Chats', value: stats.messages, icon: MessageSquare, color: 'bg-blue-50 text-blue-600' },
          { label: 'My Orders', value: stats.purchases, icon: ShoppingBag, color: 'bg-green-50 text-green-600' },
          { label: 'My Sales', value: stats.sales, icon: DollarSign, color: 'bg-amber-50 text-amber-600' },
          { label: 'Favorites', value: stats.favorites, icon: Heart, color: 'bg-rose-50 text-rose-600' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Listings */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">My Recent Listings</h2>
            <Link to="/dashboard/listings" className="text-indigo-600 text-sm font-bold hover:underline">View All</Link>
          </div>

          <div className="space-y-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)
            ) : recentListings.length > 0 ? (
              recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/200/200`}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-grow">
                    <div className="font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{listing.title}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(listing.askingPrice)} • {listing.status}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm mb-6">You haven't listed any websites yet.</p>
                <Link to="/dashboard/listings/new" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm">
                  Create First Listing
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-4">Seller Tip of the Day</h2>
            <p className="text-indigo-100 text-sm leading-relaxed mb-8">
              Listings with detailed descriptions and verified revenue proof sell 3x faster. 
              Make sure to include screenshots of your analytics dashboard!
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Shield className="w-5 h-5 text-indigo-200" />
                <span className="text-xs font-medium">Verified Escrow Protection</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 text-indigo-200" />
                <span className="text-xs font-medium">24/7 Support for Transfers</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
