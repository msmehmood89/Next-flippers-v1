import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Transaction, Listing, Gig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, TrendingUp, TrendingDown, 
  ShoppingBag, Globe, Briefcase, 
  CheckCircle2, XCircle, AlertCircle,
  ChevronRight, ArrowLeft, Star,
  Clock, DollarSign, PieChart, Activity, FileText
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import ProfileAvatar from '../components/ProfileAvatar';

export default function Statistics() {
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<(Transaction & { assetTitle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sale' | 'purchase' | 'gig'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          setProfile({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
        }

        // Fetch ALL transactions involving this user
        const txsRef = collection(db, 'transactions');
        
        // As buyer
        const qBuyer = query(txsRef, where('buyerId', '==', userId), orderBy('createdAt', 'desc'));
        const buyerSnap = await getDocs(qBuyer);
        const buyerTxs = buyerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

        // As seller
        const qSeller = query(txsRef, where('sellerId', '==', userId), orderBy('createdAt', 'desc'));
        const sellerSnap = await getDocs(qSeller);
        const sellerTxs = sellerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

        // Combine and deduplicate if user is both buyer and seller in same tx
        const txMap = new Map<string, Transaction>();
        buyerTxs.forEach(tx => txMap.set(tx.id, tx));
        sellerTxs.forEach(tx => txMap.set(tx.id, tx));

        const allTxs = Array.from(txMap.values()).sort((a, b) => 
          b.createdAt.toMillis() - a.createdAt.toMillis()
        );

        // Enrich with titles
        const enrichedTxs = await Promise.all(allTxs.map(async (tx) => {
          let title = 'Unknown Asset';
          if (tx.listingId) {
            const snap = await getDoc(doc(db, 'listings', tx.listingId));
            if (snap.exists()) title = snap.data().title;
          } else if (tx.gigId) {
            const snap = await getDoc(doc(db, 'gigs', tx.gigId));
            if (snap.exists()) title = snap.data().title;
          }
          return { ...tx, assetTitle: title };
        }));

        setTransactions(enrichedTxs);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">User not found.</div>;

  const stats = [
    { label: 'Total Earnings', value: formatCurrency(profile.totalSales || 0), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Spending', value: formatCurrency(profile.totalPurchases || 0), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Gigs Value', value: formatCurrency(profile.freelanceValue || 0), icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed Orders', value: profile.ordersCompleted || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Failed Orders', value: profile.failedOrders || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Response Time', value: profile.responseTime || '< 1h', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const filteredTxs = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'sale') return tx.sellerId === userId && tx.listingId;
    if (activeFilter === 'purchase') return tx.buyerId === userId;
    if (activeFilter === 'gig') return tx.gigId;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link 
          to={`/profile/${profile.username}`}
          className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-all mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        {/* User Header */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ProfileAvatar src={profile.photoURL} gender={profile.gender} size="xl" />
            <div className="text-center md:text-left flex-grow">
              <h1 className="text-4xl font-black text-gray-900 mb-2">{profile.name}'s Statistics</h1>
              <p className="text-gray-500 font-medium">Detailed performance overview and transaction records.</p>
            </div>
            <div className="flex gap-4">
               <div className="text-center px-6 py-4 bg-gray-50 rounded-3xl border border-gray-100">
                 <div className="text-2xl font-black text-gray-900">{profile.rating ? profile.rating.toFixed(1) : '5.0'}</div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Rating</div>
               </div>
               <div className="text-center px-6 py-4 bg-gray-50 rounded-3xl border border-gray-100">
                 <div className="text-2xl font-black text-gray-900">{profile.totalReviews || 0}</div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Reviews</div>
               </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all group"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-lg md:text-xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Transaction Records */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">Transaction History</h2>
              <p className="text-sm text-gray-500 font-medium">Click on an order to view full details.</p>
            </div>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
              {['all', 'sale', 'purchase', 'gig'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order / Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-bold text-sm">
                {filteredTxs.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <td className="px-8 py-6">
                      <div className="text-gray-900 line-clamp-1">{tx.assetTitle}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-mono">
                        {tx.id.slice(-8).toUpperCase()} // {new Date(tx.createdAt.toDate()).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        tx.gigId ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {tx.gigId ? 'Gig' : 'Listing'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        tx.buyerId === userId ? "text-blue-500" : "text-green-500"
                      )}>
                        {tx.buyerId === userId ? 'Buyer' : 'Seller'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-gray-900">
                      {formatCurrency(tx.buyerId === userId ? tx.totalPaid : tx.salePrice)}
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        tx.status === 'completed' ? "bg-green-50 text-green-600" : 
                        tx.status === 'disputed' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                      )}>
                         {tx.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                         {tx.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
                {filteredTxs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest italic">
                      No records found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-10 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Transaction Details</div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Order #{selectedTransaction.id.slice(-8).toUpperCase()}</h3>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform Status</div>
                    <div className="flex items-center gap-2">
                       <Activity className="w-5 h-5 text-indigo-600" />
                       <span className="font-black text-gray-900 uppercase">{selectedTransaction.status}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Escrow State</div>
                    <div className="flex items-center gap-2">
                       <Clock className="w-5 h-5 text-amber-500" />
                       <span className="font-black text-gray-900 uppercase">{selectedTransaction.dealStatus || 'Pending'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 italic font-medium text-gray-600">
                   "{selectedTransaction.workProofNotes || 'Process verification pending by system.'}"
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Financial Summary</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Asset Value</span>
                          <span className="text-gray-900">{formatCurrency(selectedTransaction.salePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Platform Fee</span>
                          <span className="text-gray-900">{formatCurrency(selectedTransaction.totalPaid - selectedTransaction.salePrice)}</span>
                        </div>
                        <div className="h-px bg-gray-200" />
                        <div className="flex justify-between text-lg font-black pt-2">
                          <span className="text-gray-900">Total</span>
                          <span className="text-indigo-600">{formatCurrency(selectedTransaction.totalPaid)}</span>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Parties Involved</div>
                      <div className="space-y-3">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="text-xs font-black text-gray-900">Buyer Entity</div>
                              <div className="text-[10px] text-gray-400 font-mono italic">UID: {selectedTransaction.buyerId.slice(0, 12)}...</div>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                              <Globe className="w-4 h-4" />
                           </div>
                           <div>
                              <div className="text-xs font-black text-gray-900">Seller Entity</div>
                              <div className="text-[10px] text-gray-400 font-mono italic">UID: {selectedTransaction.sellerId.slice(0, 12)}...</div>
                           </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
              <div className="p-10 bg-gray-50 flex gap-4">
                 <Link 
                   to={`/receipt/${selectedTransaction.id}`}
                   className="flex-grow flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest"
                 >
                   <FileText className="w-4 h-4" />
                   Generate Digital Receipt
                 </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
