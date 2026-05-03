import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, getDoc, serverTimestamp, addDoc, increment } from 'firebase/firestore';
import { db } from '../../firebase';
import { Transaction, Listing, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Search, ChevronRight, Clock, CheckCircle2, AlertCircle, MessageSquare, Upload, Image as ImageIcon, Send, Star, X, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, cn, resizeImage, createNotification } from '../../lib/utils';
import DealStatusBar from '../../components/DealStatusBar';

export default function MySales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<(Transaction & { title?: string, image?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState('');
  const [proofNotes, setProofNotes] = useState('');
  const navigate = useNavigate();

  const [sellerRating, setSellerRating] = useState(5);
  const [sellerRatingComment, setSellerRatingComment] = useState('');
  const [showBuyerRatingId, setShowBuyerRatingId] = useState<string | null>(null);

  const handleUpdateBuyerRating = async (transId: string) => {
    try {
      const transRef = doc(db, 'transactions', transId);
      const transSnap = await getDoc(transRef);
      const transData = transSnap.data() as Transaction;

      await updateDoc(transRef, {
        buyerRating: sellerRating,
        buyerRatingComment: sellerRatingComment
      });

      // Update Buyer Stats in user profile
      const buyerRef = doc(db, 'users', transData.buyerId);
      const buyerSnap = await getDoc(buyerRef);
      if (buyerSnap.exists()) {
        const buyerData = buyerSnap.data() as UserProfile;
        const currentBuyerRating = buyerData.buyerRating || 0;
        const totalBuyerReviews = buyerData.buyerReviews || 0;
        const newTotalBuyerReviews = totalBuyerReviews + 1;
        const newBuyerRating = ((currentBuyerRating * totalBuyerReviews) + sellerRating) / newTotalBuyerReviews;

        const updateData: any = {
          buyerRating: newBuyerRating,
          buyerReviews: newTotalBuyerReviews
        };

        // Update overall rating
        const allRatings = [
          { r: newBuyerRating, count: newTotalBuyerReviews },
          { r: buyerData.sellerRating || 0, count: buyerData.sellerReviews || 0 },
          { r: buyerData.freelancerRating || 0, count: buyerData.freelancerReviews || 0 }
        ];

        const totalWeightedRating = allRatings.reduce((acc, curr) => acc + (curr.r * curr.count), 0);
        const totalReviewCount = allRatings.reduce((acc, curr) => acc + curr.count, 0);

        if (totalReviewCount > 0) {
          updateData.rating = totalWeightedRating / totalReviewCount;
          updateData.totalReviews = totalReviewCount;
        }

        await updateDoc(buyerRef, updateData);
      }

      alert('Buyer rated successfully!');
      setShowBuyerRatingId(null);
      fetchSales();
    } catch (error) {
      console.error('Error rating buyer:', error);
      alert('Failed to rate buyer.');
    }
  };

  const [isContacting, setIsContacting] = useState(false);

  const handleContactBuyerLink = async (buyerId: string, listingId: string | null, gigId: string | null) => {
    if (!user) return;
    const itemId = listingId || gigId;
    if (!itemId) return;

    setIsContacting(true);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('buyerId', '==', buyerId),
        where('sellerId', '==', user.uid),
        where('listingId', '==', itemId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        navigate(`/chat/${snapshot.docs[0].id}`);
      } else {
        // Create new chat
        const newChat = await addDoc(collection(db, 'chats'), {
          buyerId: buyerId,
          sellerId: user.uid,
          listingId: itemId,
          lastMessage: 'Contacting about the sale...',
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

  const fetchSales = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'transactions'),
        where('sellerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      
      // Fetch listing details for each transaction
      const salesWithDetails = await Promise.all(transactions.map(async (trans) => {
        let title = 'Deleted Asset';
        let image = '';
        
        try {
          if (trans.listingId) {
            const listingSnap = await getDoc(doc(db, 'listings', trans.listingId));
            if (listingSnap.exists()) {
              const data = listingSnap.data();
              title = data.title;
              image = data.images?.[0] || '';
            }
          } else if (trans.gigId) {
            const gigSnap = await getDoc(doc(db, 'gigs', trans.gigId));
            if (gigSnap.exists()) {
              const data = gigSnap.data();
              title = data.title;
              image = data.images?.[0] || '';
            }
          }
        } catch (e) {
          console.error('Error fetching asset details:', e);
        }
        
        return { ...trans, title, image };
      }));

      setSales(salesWithDetails);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const handleUploadProof = async (transId: string) => {
    if (!proofImage && !proofNotes) {
      alert('Please upload a screenshot or provide notes.');
      return;
    }

    try {
      const transRef = doc(db, 'transactions', transId);
      const transSnap = await getDoc(transRef);
      const transData = transSnap.data() as Transaction;

      await updateDoc(transRef, {
        workProofImage: proofImage,
        workProofNotes: proofNotes,
        dealStatus: 'asset_transferred'
      });
      
      // Notify buyer
      await createNotification(
        transData.buyerId,
        'Asset Delivered! 📦',
        `The seller has delivered the assets for your order #${transId.slice(-6).toUpperCase()}. Please review and confirm.`,
        'order_delivered',
        '/dashboard/purchases'
      );

      // Notify Admin
      await createNotification(
        'admin', // Logic in Navbar/App handles admin visibility usually, but here we can just target common admin IDs or meta-notifications
        'Order Delivered (Review Required)',
        `Seller ${user?.email} has delivered order #${transId.slice(-6).toUpperCase()}.`,
        'admin_task',
        '/admin'
      );

      alert('Proof of work submitted successfully!');
      setUploadingId(null);
      setProofImage('');
      setProofNotes('');
      fetchSales();
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Failed to submit proof.');
    }
  };

  const handleCancelOrder = async (transId: string, reason: string) => {
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }

    try {
      const transRef = doc(db, 'transactions', transId);
      const transSnap = await getDoc(transRef);
      const transData = transSnap.data() as Transaction;

      await updateDoc(transRef, {
        dealStatus: 'refunded',
        status: 'disputed',
        cancelReason: reason,
        cancelledBy: user?.uid,
        cancelledAt: serverTimestamp()
      });

      // Update failed orders count for seller
      await updateDoc(doc(db, 'users', user!.uid), {
        failedOrders: increment(1)
      });

      // Notify Buyer
      await createNotification(
        transData.buyerId,
        'Order Cancelled by Seller ❌',
        `The seller has cancelled your order #${transId.slice(-6).toUpperCase()}. Your refund is being processed. Reason: ${reason}`,
        'order_cancelled',
        '/dashboard/purchases'
      );

      // Notify Admin
      await createNotification(
        'admin',
        'Order Cancellation Request by Seller (Refund Required)',
        `Seller ${user?.email} cancelled order #${transId.slice(-6).toUpperCase()}. Reason: ${reason}. Please process refund for buyer.`,
        'admin_task',
        '/admin'
      );

      alert('Order cancelled successfully. Admin has been notified for refund processing.');
      fetchSales();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file);
        setProofImage(resized);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image.');
      }
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sales</h1>
        <p className="text-gray-500">Track your sales, escrow status, and payouts.</p>
      </header>

      {loading ? (
        <div className="bg-white rounded-3xl p-20 flex justify-center border border-gray-100 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sales.length > 0 ? (
        <div className="space-y-6">
          {sales.map((sale) => (
            <div 
              key={sale.id}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 hover:border-indigo-100 transition-all group"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Asset Info */}
                <div className="flex gap-6 flex-grow min-w-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                    {sale.image ? (
                      <img src={sale.image} alt={sale.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <DollarSign className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">{sale.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                      <span>Order #{sale.id.slice(-6).toUpperCase()}</span>
                      <span>•</span>
                      <span className="text-indigo-600">Earnings: {formatCurrency(sale.salePrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Column */}
                <div className="flex flex-col sm:flex-row lg:flex-col justify-between lg:justify-center items-start sm:items-center lg:items-end gap-4 min-w-[200px]">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Escrow Status</div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest inline-flex",
                      sale.dealStatus === 'completed' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {sale.dealStatus?.replace('_', ' ') || 'Processing'}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payout Status</div>
                    {sale.sellerPaid || sale.dealStatus === 'completed' ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        Payout Complete
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                        <Clock className="w-4 h-4" />
                        {sale.dealStatus === 'buyer_confirmed' ? 'Processing Payout' : 'Awaiting Release'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Deal Progress Bar */}
              <div className="mt-8 pt-8 border-t border-gray-50">
                <DealStatusBar status={sale.dealStatus} role="seller" />
                
                {/* Work Proof Section */}
                {(sale.dealStatus === 'payment_secured' || sale.dealStatus === 'in_escrow') && (
                  <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-900">Submit Work Proof</h4>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">Buyer has paid admin</span>
                    </div>
                    
                    {uploadingId === sale.id ? (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Upload Completion Screenshot</label>
                          <div className="relative group">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={cn(
                              "w-full p-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-3",
                              proofImage 
                                ? "border-green-200 bg-green-50" 
                                : "border-gray-200 bg-white group-hover:border-indigo-300 group-hover:bg-indigo-50/30"
                            )}>
                              {proofImage ? (
                                <div className="relative group/img">
                                  <div className="w-32 aspect-video rounded-xl overflow-hidden shadow-md">
                                    <img src={proofImage} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setProofImage(''); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover:text-indigo-500 transition-colors">
                                    <Upload className="w-6 h-6" />
                                  </div>
                                  <div className="text-center">
                                    <span className="text-sm font-bold text-gray-900 block">Click to upload proof</span>
                                    <span className="text-[10px] text-gray-400">Add screenshot of delivery</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Completion Notes</label>
                          <textarea 
                            value={proofNotes}
                            onChange={(e) => setProofNotes(e.target.value)}
                            placeholder="Add any instructions or links for the buyer..."
                            rows={3}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleUploadProof(sale.id)}
                            className="flex-grow bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                          >
                            <Send className="w-3 h-3" />
                            Submit to Buyer
                          </button>
                          <button 
                            onClick={() => {
                              setUploadingId(null);
                              setProofImage('');
                              setProofNotes('');
                            }}
                            className="px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setUploadingId(sale.id)}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Click to start proof submission
                      </button>
                    )}
                  </div>
                )}

                {sale.workProofImage && (
                  <div className="mt-8 bg-green-50/50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-green-900">Proof Submitted</h4>
                    </div>
                    {sale.workProofImage && (
                      <a href={sale.workProofImage} target="_blank" rel="noreferrer" className="block w-full max-w-xs mb-4 rounded-xl overflow-hidden border border-green-200">
                        <img src={sale.workProofImage} alt="Work Proof" className="w-full h-auto" />
                      </a>
                    )}
                    {sale.workProofNotes && <p className="text-xs text-green-800 bg-white p-4 rounded-xl border border-green-100">{sale.workProofNotes}</p>}
                  </div>
                )}

                {sale.rating && (
                  <div className="mt-8 bg-amber-50/50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-900">Buyer Rating</h4>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("w-3 h-3", sale.rating! >= star ? "text-amber-400 fill-current" : "text-gray-300")} />
                        ))}
                      </div>
                    </div>
                    {sale.ratingComment && (
                      <p className="text-xs text-amber-900 italic bg-white p-4 rounded-xl border border-amber-100">
                        "{sale.ratingComment}"
                      </p>
                    )}
                  </div>
                )}

                {/* Seller Rating of Buyer */}
                {sale.dealStatus === 'completed' && !sale.buyerRating && !showBuyerRatingId && (
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowBuyerRatingId(sale.id)}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                      + Rate the Buyer
                    </button>
                  </div>
                )}

                {showBuyerRatingId === sale.id && (
                  <div className="mt-6 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Rate the Buyer</h5>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            onClick={() => setSellerRating(star)}
                            className={cn(
                              "p-1 transition-all",
                              sellerRating >= star ? "text-amber-400" : "text-gray-300"
                            )}
                          >
                            <Star className={cn("w-5 h-5", sellerRating >= star ? "fill-current" : "")} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea 
                      value={sellerRatingComment}
                      onChange={(e) => setSellerRatingComment(e.target.value)}
                      placeholder="How was the experience with this buyer?"
                      className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleUpdateBuyerRating(sale.id)}
                        className="flex-grow bg-indigo-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      >
                        Submit Feedback
                      </button>
                      <button 
                        onClick={() => setShowBuyerRatingId(null)}
                        className="px-6 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {sale.buyerRating && (
                  <div className="mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-blue-500 fill-blue-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-900">Your Rating of Buyer</h4>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("w-3 h-3", sale.buyerRating! >= star ? "text-blue-400 fill-current" : "text-gray-300")} />
                        ))}
                      </div>
                    </div>
                    {sale.buyerRatingComment && (
                      <p className="text-xs text-blue-900 italic bg-white p-4 rounded-xl border border-blue-100">
                        "{sale.buyerRatingComment}"
                      </p>
                    )}
                  </div>
                )}
                
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-4 h-4" />
                    Sale Date: {new Date(sale.createdAt.toDate()).toLocaleDateString()}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    {sale.dealStatus !== 'completed' && sale.dealStatus !== 'refunded' && (
                      <button 
                        onClick={() => {
                          const reason = window.prompt('Please provide a reason for cancellation:');
                          if (reason) handleCancelOrder(sale.id, reason);
                        }}
                        className="px-6 py-2 bg-white text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all border border-red-100"
                      >
                        Cancel Order
                      </button>
                    )}
                    <button 
                      onClick={() => handleContactBuyerLink(sale.buyerId, sale.listingId, sale.gigId)}
                      disabled={isContacting}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {isContacting ? 'Opening Chat...' : 'Contact Buyer'}
                    </button>
                    <Link 
                      to="/support"
                      className="flex items-center gap-2 px-6 py-2 bg-white text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all border border-gray-200"
                    >
                      <Shield className="w-4 h-4" />
                      Contact Support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-gray-200 shadow-sm">
          <DollarSign className="w-16 h-16 text-gray-100 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-widest">No Sales Yet</h3>
          <p className="text-gray-400 max-w-sm mx-auto mb-8 font-bold">
            When you sell a website or a gig, the transaction details will appear here.
          </p>
          <Link
            to="/dashboard/listings/new"
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:-translate-y-0.5 transition-all inline-block"
          >
            Create Your First Listing
          </Link>
        </div>
      )}
    </div>
  );
}
