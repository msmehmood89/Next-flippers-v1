import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../App';
import { Listing, Gig } from '../../types';
import { Heart, Globe, Briefcase, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Favorites() {
  const { profile } = useAuth();
  const [items, setItems] = useState<(Listing | Gig)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!profile?.favorites || profile.favorites.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const uniqueFavorites = Array.from(new Set(profile.favorites));
        const fetchedItems: (Listing | Gig)[] = [];
        
        // We need to fetch each item individually or in chunks because they could be in different collections
        // For simplicity and because favorites are usually few, we'll fetch them individually
        const promises = uniqueFavorites.map(async (id) => {
          // Try listings first
          const listingDoc = await getDoc(doc(db, 'listings', id));
          if (listingDoc.exists()) {
            return { id: listingDoc.id, ...listingDoc.data(), _type: 'listing' } as Listing & { _type: string };
          }
          // Then try gigs
          const gigDoc = await getDoc(doc(db, 'gigs', id));
          if (gigDoc.exists()) {
            return { id: gigDoc.id, ...gigDoc.data(), _type: 'gig' } as Gig & { _type: string };
          }
          return null;
        });

        const results = await Promise.all(promises);
        setItems(results.filter(Boolean) as (Listing | Gig)[]);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [profile?.favorites]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-500">Your saved listings and gigs for quick access.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const isListing = 'askingPrice' in item;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                >
                  <Link to={isListing ? `/listing/${item.id}` : `/gig/${item.id}`}>
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={item.images[0] || `https://picsum.photos/seed/${item.id}/400/300`} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">
                          {isListing ? 'Listing' : 'Gig'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-black text-indigo-600">
                          {formatCurrency(isListing ? (item as Listing).askingPrice : (item as Gig).price)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {isListing ? <Globe className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          {item.category}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
          <Heart className="w-16 h-16 text-gray-100 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h2>
          <p className="text-gray-500 mb-8">Start exploring the marketplace and save items you like!</p>
          <Link to="/browse" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Browse Marketplace
          </Link>
        </div>
      )}
    </div>
  );
}
