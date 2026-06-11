import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Gig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Star, Clock, DollarSign, 
  PlusCircle, MessageSquare, ArrowRight, Shield,
  Zap, Award, Briefcase
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../App';
import FavoriteButton from '../components/FavoriteButton';

const GIG_CATEGORIES = [
  'All Services',
  'Web Development',
  'Graphic Design',
  'Digital Marketing',
  'Content Writing',
  'Video Editing',
  'SEO',
  'App Development',
  'Other'
];

export default function FreelanceMarketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  useEffect(() => {
    let q = query(
      collection(db, 'gigs'),
      where('status', 'in', ['active', 'sold']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (selectedCategory !== 'All Services') {
      q = query(
        collection(db, 'gigs'),
        where('status', 'in', ['active', 'sold']),
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let gigsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig));
      
      // Client-side filtration for 24-hour sold gigs
      gigsData = gigsData.filter(g => {
        if (g.status === 'sold') {
          const sAt = g.soldAt as any;
          if (!sAt) return true;
          const soldTime = sAt.toDate ? sAt.toDate().getTime() : new Date(sAt).getTime();
          const ageMs = Date.now() - soldTime;
          return ageMs <= 24 * 60 * 60 * 1000;
        }
        return true;
      });

      setGigs(gigsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching gigs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  const filteredGigs = gigs
    .filter(gig => 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      return 0; // newest is default by firestore query
    });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-black rounded-full border border-indigo-100 mb-6 uppercase tracking-widest"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Freelance Marketplace
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight"
          >
            Hire Expert <span className="text-indigo-600">Freelancers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            Find the perfect talent for your next project. From web development to creative design, our freelancers deliver quality.
          </motion.p>
        </header>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100 mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for any service (e.g. logo design, web dev)..."
                className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <select
                className="px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-gray-700"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
              <Link
                to="/dashboard/gigs/new"
                className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 whitespace-nowrap"
              >
                <PlusCircle className="w-5 h-5" />
                Post a Gig
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
            {GIG_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                  selectedCategory === cat
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gigs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-white rounded-[2rem] h-96 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredGigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredGigs.map((gig, index) => (
                <motion.div
                  key={gig.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100/40 transition-all duration-500 flex flex-col cursor-pointer"
                  onClick={() => navigate(`/gig/${gig.id}`)}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {gig.status === 'sold' && (
                      <div className="absolute inset-0 bg-rose-600/90 backdrop-blur-sm z-[20] flex flex-col items-center justify-center text-white p-4">
                        <span className="text-3xl font-extrabold uppercase tracking-wider border-2 border-white px-4 py-1.5 rotate-[-5deg] shadow-lg animate-pulse">SOLD</span>
                        {gig.soldAt && (
                          <span className="text-white/90 text-[10px] uppercase font-bold tracking-widest mt-2">
                            Hides in {(() => {
                              const sAt = gig.soldAt as any;
                              const soldTime = sAt.toDate ? sAt.toDate().getTime() : new Date(sAt).getTime();
                              const expiryTime = soldTime + 24 * 60 * 60 * 1000;
                              const remainingMs = expiryTime - Date.now();
                              if (remainingMs <= 0) return '0 hrs';
                              const remainingHrs = Math.ceil(remainingMs / (60 * 60 * 1000));
                              return `${remainingHrs} ${remainingHrs === 1 ? 'hour' : 'hours'}`;
                            })()}
                          </span>
                        )}
                      </div>
                    )}
                    <img
                      src={gig.images[0] || `https://picsum.photos/seed/${gig.id}/800/600`}
                      alt={gig.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">
                        {gig.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <FavoriteButton itemId={gig.id} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600">
                        {gig.userName?.[0] || 'U'}
                      </div>
                      <span className="text-xs font-bold text-gray-500">{gig.userName}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {gig.title}
                    </h3>

                    <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-bold">5.0</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{gig.deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Starting at</span>
                      <span className="text-xl font-black text-indigo-600">{formatCurrency(gig.price)}</span>
                    </div>
                    <div className="p-3 bg-white text-indigo-600 rounded-xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Search className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">No gigs found</h2>
            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}

        {/* Trust Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Secure Payments', desc: 'Your funds are held in escrow until you approve the work.' },
            { icon: Zap, title: 'Fast Delivery', desc: 'Get your projects completed quickly by top-rated professionals.' },
            { icon: Award, title: 'Quality Guaranteed', desc: 'Only pay for work that meets your standards and requirements.' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
