import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Listing } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { PlusCircle, Edit, Trash2, Eye, ExternalLink, MoreVertical, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../../lib/utils';

export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'sold'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'listings'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        setListings(fetchedListings);
      } catch (error) {
        console.error('Error fetching my listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await deleteDoc(doc(db, 'listings', id));
      setListings(listings.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const filteredListings = listings.filter(l => {
    if (activeTab === 'all') return true;
    return l.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'rejected': return 'bg-red-50 text-red-600';
      case 'sold': return 'bg-indigo-50 text-indigo-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
          <p className="text-gray-500">Manage your websites for sale and track their performance.</p>
        </div>
        <Link
          to="/dashboard/listings/new"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Listing
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {['all', 'approved', 'pending', 'sold'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize",
              activeTab === tab ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Listings Table/Grid */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredListings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Website</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stats</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/200/200`}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 line-clamp-1">{listing.title}</div>
                          <div className="text-xs text-gray-400 font-medium">{listing.url}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900">{formatCurrency(listing.askingPrice)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusColor(listing.status))}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {listing.views}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/listing/${listing.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/dashboard/listings/edit/${listing.id}`}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500 mb-8">You haven't listed any websites in this category yet.</p>
            <Link
              to="/dashboard/listings/new"
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
            >
              Create New Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
