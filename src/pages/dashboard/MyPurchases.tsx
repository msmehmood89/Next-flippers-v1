import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, serverTimestamp, addDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Transaction, Listing, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, ChevronRight, Clock, CheckCircle2, AlertCircle, FileText, ChevronDown, MessageSquare, ImageIcon, ExternalLink, Star, X, Shield } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { formatCurrency, cn, createNotification } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import DealStatusBar from '../../components/DealStatusBar';
import ProfessionalReceiptCard from '../../components/ProfessionalReceiptCard';

export default function MyPurchases() {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('status') === 'success';

  const [transactions, setTransactions] = useState<(Transaction & { listing?: Listing })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [showRatingId, setShowRatingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchPurchases = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('buyerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const txs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      // Fetch asset details for each transaction
      const fullTxs = await Promise.all(txs.map(async (tx) => {
        try {
          if (tx.listingId) {
            const listingSnap = await getDoc(doc(db, 'listings', tx.listingId));
            return { 
              ...tx, 
              listing: listingSnap.exists() ? { id: listingSnap.id, ...listingSnap.data() } as Listing : undefined 
            };
          } else if (tx.gigId) {
            const gigSnap = await getDoc(doc(db, 'gigs', tx.gigId));
            return { 
              ...tx, 
              listing: gigSnap.exists() ? { id: gigSnap.id, ...gigSnap.data() } as any : undefined // Using 'listing' key for simplicity in UI
            };
          }
          return tx;
        } catch (err) {
          console.error('Error enriching transaction:', err);
          return tx;
        }
      }));

      setTransactions(fullTxs);
    } catch (error) {
      console.error('Error fetching my purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [user]);

  const [isContacting, setIsContacting] = useState(false);

  const handleContactSellerLink = async (sellerId: string, listingId: string | null, gigId: string | null) => {
    if (!user) return;
    const itemId = listingId || gigId;
    if (!itemId) return;

    setIsContacting(true);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('buyerId', '==', user.uid),
        where('sellerId', '==', sellerId),
        where('listingId', '==', itemId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        navigate(`/chat/${snapshot.docs[0].id}`);
      } else {
        // Create new chat
        const newChat = await addDoc(collection(db, 'chats'), {
          buyerId: user.uid,
          sellerId: sellerId,
          listingId: itemId,
          lastMessage: 'Contacting about my purchase...',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
      alert('Failed to start chat.');
    } finally {
      setIsContacting(false);
    }
  };

  const handleMarkAsCompleted = async (transId: string) => {
    try {
      const transRef = doc(db, 'transactions', transId);
      const transSnap = await getDoc(transRef);
      const transData = transSnap.data() as Transaction;

      await updateDoc(transRef, {
        dealStatus: 'buyer_confirmed',
        rating,
        ratingComment
      });

      // Update Seller/Freelancer Stats
      const sellerRef = doc(db, 'users', transData.sellerId);
      const sellerSnap = await getDoc(sellerRef);
      const sellerData = sellerSnap.data() as UserProfile;

      // Determine which rating to update
      const ratingField = transData.gigId ? 'freelancerRating' : 'sellerRating';
      const reviewsField = transData.gigId ? 'freelancerReviews' : 'sellerReviews';

      const currentRating = (sellerData as any)[ratingField] || 0;
      const totalReviews = (sellerData as any)[reviewsField] || 0;
      const newTotalReviews = totalReviews + 1;
      const newRating = ((currentRating * totalReviews) + rating) / newTotalReviews;

      const updateData: any = {
        [ratingField]: newRating,
        [reviewsField]: newTotalReviews,
        ordersCompleted: (sellerData.ordersCompleted || 0) + 1
      };

      // Also update overall rating for legacy/general view
      const allRatings = [
        { r: newRating, count: newTotalReviews },
        { r: sellerData.buyerRating || 0, count: sellerData.buyerReviews || 0 },
        { r: transData.gigId ? (sellerData.sellerRating || 0) : (sellerData.freelancerRating || 0), 
          count: transData.gigId ? (sellerData.sellerReviews || 0) : (sellerData.freelancerReviews || 0) }
      ];
      
      const totalWeightedRating = allRatings.reduce((acc, curr) => acc + (curr.r * curr.count), 0);
      const totalReviewCount = allRatings.reduce((acc, curr) => acc + curr.count, 0);
      
      if (totalReviewCount > 0) {
        updateData.rating = totalWeightedRating / totalReviewCount;
        updateData.totalReviews = totalReviewCount;
      }

      await updateDoc(sellerRef, updateData);

      // Notify seller
      await createNotification(
        transData.sellerId,
        'Buyer Confirmed Delivery! ⭐',
        `The buyer has confirmed receipt of assets for order #${transId.slice(-6).toUpperCase()}. Admin will release payment shortly.`,
        'order_confirmed',
        '/dashboard/sales'
      );

      // Notify Admin
      await createNotification(
        'admin',
        'Buyer Confirmed Delivery (Released Needed)',
        `Buyer ${user?.email} has confirmed order #${transId.slice(-6).toUpperCase()}. Please release payment to the seller.`,
        'admin_task',
        '/admin'
      );

      alert('Confirmation sent to Admin. Payment will be released once verified.');
      setShowRatingId(null);
      fetchPurchases();
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order.');
    }
  };

  const handleCancelOrder = async (transId: string) => {
    try {
      const transRef = doc(db, 'transactions', transId);
      const transSnap = await getDoc(transRef);
      const transData = transSnap.data() as Transaction;

      // Check if admin has confirmed the payment
      // Status 'pending' means admin hasn't checked it yet
      if (transData.status === 'pending') {
        alert('Payment not confirmed by Admin yet. You cannot cancel until Admin verifies your payment details.');
        setCancellingId(null);
        setCancelReason('');
        return;
      }

      if (!cancelReason.trim()) {
        alert('Please provide a reason for cancellation.');
        return;
      }

      await updateDoc(transRef, {
        dealStatus: 'refunded',
        status: 'disputed',
        cancelReason,
        cancelledBy: user?.uid,
        cancelledAt: serverTimestamp()
      });

      // Update failed orders count for buyer
      await updateDoc(doc(db, 'users', user!.uid), {
        failedOrders: increment(1)
      });

      // Notify Seller
      await createNotification(
        transData.sellerId,
        'Order Cancelled by Buyer ❌',
        `Order #${transId.slice(-6).toUpperCase()} was cancelled. Reason: ${cancelReason}`,
        'order_cancelled',
        '/dashboard/sales'
      );

      // Notify Admin
      await createNotification(
        'admin',
        'Order Cancellation Request (Refund Required)',
        `Buyer ${user?.email} cancelled order #${transId.slice(-6).toUpperCase()}. Reason: ${cancelReason}. Please process refund.`,
        'admin_task',
        '/admin'
      );

      alert('Order cancelled successfully. Admin has been notified for refund processing.');
      setCancellingId(null);
      setCancelReason('');
      fetchPurchases();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-600';
      case 'processing': return 'bg-blue-50 text-blue-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'verified': return 'bg-blue-50 text-blue-600';
      case 'in_progress': return 'bg-indigo-50 text-indigo-600';
      case 'refunded': return 'bg-gray-50 text-gray-600';
      case 'disputed': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Admin has not checked payment';
      case 'completed': return 'Admin has received payment';
      case 'processing': return 'Order is being processed';
      default: return status?.replace('_', ' ') || 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'disputed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-500">Track your active escrow deals and purchase history.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <div key={tx.id} className="divide-y divide-gray-50 bg-white group border-b border-gray-50 last:border-0">
                <div 
                  className="p-4 sm:p-8 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 min-w-0">
                    <div className="flex items-start gap-4 md:gap-6 min-w-0 flex-grow">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                        <ShoppingBag className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <div className="text-base md:text-lg font-bold text-gray-900 mb-1 truncate">
                          {tx.listing?.title || `Order #${tx.id.slice(-6).toUpperCase()}`}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500 mb-2">Order ID: {tx.id.slice(-6).toUpperCase()}</div>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className={cn("px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5", getStatusColor(tx.status))}>
                            {getStatusIcon(tx.status)}
                            {getStatusLabel(tx.status)}
                          </span>
                          <span className="text-[10px] md:text-xs text-gray-400 font-medium">
                            {new Date(tx.createdAt?.toDate()).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-10 w-full md:w-auto shrink-0">
                      <div className="flex flex-col items-start md:items-end gap-1">
                        <div className="text-left md:text-right">
                          <div className="text-lg md:text-xl font-bold text-gray-900">{formatCurrency(tx.totalPaid)}</div>
                          <div className="text-[10px] md:text-xs text-gray-400 font-medium">Total Paid (incl. fee)</div>
                        </div>
                      </div>
                      <div className={cn(
                        "p-2.5 md:p-3 rounded-xl transition-all shrink-0",
                        expandedId === tx.id ? "bg-indigo-600 text-white shadow-lg" : "bg-gray-50 text-gray-400 group-hover:text-indigo-600"
                      )}>
                        <ChevronDown className={cn("w-5 h-5 md:w-6 md:h-6 transition-transform duration-300", expandedId === tx.id && "rotate-180")} />
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === tx.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/50"
                    >
                      <div className="p-8 space-y-8 border-t border-gray-100">
                        <div>
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Deal Progress</h4>
                          <DealStatusBar status={tx.dealStatus || 'payment_pending'} role="buyer" />
                        </div>

                        {tx.payoutDetails && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Disbursement Receipt</h4>
                            <ProfessionalReceiptCard transaction={tx} role="buyer" />
                          </div>
                        )}

                        {/* Work Proof Display */}
                        {(tx.workProofImage || tx.workProofNotes || tx.dealStatus === 'asset_transferred' || tx.rating) && (
                          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Seller's Fulfillment Proof</h4>
                              </div>
                              {tx.dealStatus === 'asset_transferred' && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRatingId(tx.id);
                                  }}
                                  className="px-6 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                                >
                                  Satisfied? Mark Completed
                                </button>
                              )}
                              
                              {tx.rating && (
                                <div className="flex items-center gap-3">
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <Star key={star} className={cn("w-3 h-3", tx.rating! >= star ? "text-amber-400 fill-current" : "text-gray-200")} />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Your Rating: {tx.rating}/5</span>
                                </div>
                              )}
                            </div>

                            {showRatingId === tx.id && (
                              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Rate the Seller</h5>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button 
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={cn(
                                          "p-1 transition-all",
                                          rating >= star ? "text-amber-400" : "text-gray-300"
                                        )}
                                      >
                                        <Star className={cn("w-5 h-5", rating >= star ? "fill-current" : "")} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <textarea 
                                  value={ratingComment}
                                  onChange={(e) => setRatingComment(e.target.value)}
                                  placeholder="Share your experience (optional)..."
                                  className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                  rows={2}
                                />
                                <div className="flex gap-3">
                                  <button 
                                    onClick={() => handleMarkAsCompleted(tx.id)}
                                    className="flex-grow bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Confirm Delivery & Rate
                                  </button>
                                  <button 
                                    onClick={() => setShowRatingId(null)}
                                    className="px-6 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-col md:flex-row gap-6">
                              {tx.workProofImage && (
                                <div 
                                  onClick={() => setLightboxImage(tx.workProofImage!)}
                                  className="w-full md:w-1/3 aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-100 relative group cursor-pointer"
                                >
                                  <img src={tx.workProofImage} alt="Work Proof" className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white p-2 rounded-full text-indigo-600">
                                      <ImageIcon className="w-5 h-5" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex-grow">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Notes</div>
                                <div className="text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed italic">
                                  "{tx.workProofNotes || 'The seller has completed the work as requested.'}"
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {cancellingId === tx.id && (
                          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <h5 className="text-[10px] font-black text-red-900 uppercase tracking-widest">Cancel Order & Request Refund</h5>
                            <textarea 
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              placeholder="Why do you want to cancel this order?"
                              className="w-full bg-white border border-red-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500"
                              rows={2}
                            />
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleCancelOrder(tx.id)}
                                disabled={!cancelReason.trim()}
                                className="flex-grow bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                              >
                                Confirm Cancellation
                              </button>
                              <button 
                                onClick={() => {
                                  setCancellingId(null);
                                  setCancelReason('');
                                }}
                                className="px-6 py-3 bg-white border border-red-100 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
                              >
                                Back
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                          {(tx.status === 'completed' || tx.status === 'processing') && (
                            <div className="flex flex-wrap gap-3 w-full">
                              <button 
                                onClick={() => handleContactSellerLink(tx.sellerId, tx.listingId, tx.gigId)}
                                disabled={isContacting}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
                              >
                                <MessageSquare className="w-4 h-4" />
                                {isContacting ? 'Opening Chat...' : 'Contact Seller'}
                              </button>
                              <Link 
                                to="/support"
                                className="flex items-center gap-2 px-6 py-2 bg-white text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all border border-gray-200"
                              >
                                <Shield className="w-4 h-4" />
                                Contact Support
                              </Link>
                            </div>
                          )}
                          {tx.dealStatus !== 'completed' && tx.dealStatus !== 'refunded' && !cancellingId && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCancellingId(tx.id);
                              }}
                              className="flex items-center gap-2 px-6 py-2 bg-white text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all border border-red-100"
                            >
                              Cancel Order
                            </button>
                          )}
                          <Link
                            to={`/listing/${tx.listingId}`}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                          >
                            View Listing details
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Lightbox */}
            <AnimatePresence>
              {lightboxImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setLightboxImage(null)}
                  className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center"
                  >
                    <img src={lightboxImage} alt="Fullscreen Proof" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                    <button 
                      onClick={() => setLightboxImage(null)}
                      className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 backdrop-blur-md transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No purchases yet</h3>
            <p className="text-gray-500 mb-8">Ready to buy your first website? Browse the marketplace.</p>
            <Link
              to="/listings"
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm"
            >
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
