import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Gig } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, PlusCircle, Edit2, Trash2, 
  ExternalLink, Star, Clock, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../../lib/utils';

export default function MyGigs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'gigs'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gigsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig));
      setGigs(gigsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gig?')) return;
    try {
      await deleteDoc(doc(db, 'gigs', id));
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Gigs</h1>
          <p className="text-sm text-gray-500">Manage your freelance services and portfolio.</p>
        </div>
        <Link
          to="/dashboard/gigs/new"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Gig
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : gigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={gig.images[0] || `https://picsum.photos/seed/${gig.id}/800/600`}
                  alt={gig.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4">
                  <span className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                    gig.status === 'active' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {gig.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{gig.title}</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 text-indigo-600 font-black">
                    <span className="text-sm">{formatCurrency(gig.price)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                    <Clock className="w-3 h-3" />
                    {gig.deliveryTime}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/dashboard/gigs/edit/${gig.id}`}
                    className="flex-grow flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(gig.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/gig/${gig.id}`}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-2">No gigs yet</h2>
          <p className="text-gray-500 mb-8">Start offering your services to the community.</p>
          <Link
            to="/dashboard/gigs/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <PlusCircle className="w-5 h-5" />
            Create Your First Gig
          </Link>
        </div>
      )}
    </div>
  );
}
