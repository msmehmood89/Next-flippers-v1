import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Star, X, Calendar, ShoppingBag, User, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProfileAvatar from './ProfileAvatar';

// Define the shape of populated review data
interface PopulateReview {
  id: string;
  rating: number;
  ratingComment?: string;
  createdAt: any;
  buyerName?: string;
  buyerUsername?: string;
  buyerPhotoURL?: string;
  buyerGender?: string;
  itemTitle?: string;
  type?: 'listing' | 'gig';
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType?: 'seller' | 'freelancer' | 'all';
}

export default function ReviewsModal({ isOpen, onClose, userId, userType = 'all' }: ReviewsModalProps) {
  const [reviews, setReviews] = useState<PopulateReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<{ [key: number]: number }>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchReviewsAndDetails = async () => {
      setLoading(true);
      try {
        // Query transactions where this user is the seller/freelancer and has a rating
        const txsRef = collection(db, 'transactions');
        const q = query(
          txsRef,
          where('sellerId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        const snap = await getDocs(q);
        const ratedTransactions = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter(tx => tx.rating && tx.rating > 0);

        // Fetch parallel buyer profiles and item titles
        const populated: PopulateReview[] = await Promise.all(
          ratedTransactions.map(async (tx) => {
            let buyerName = 'Anonymous Buyer';
            let buyerUsername = 'buyer';
            let buyerPhotoURL = '';
            let buyerGender = 'male';
            let itemTitle = `Order #${tx.id.slice(-6).toUpperCase()}`;

            // Fetch buyer details
            try {
              if (tx.buyerId) {
                const buyerSnap = await getDoc(doc(db, 'users', tx.buyerId));
                if (buyerSnap.exists()) {
                  const bData = buyerSnap.data();
                  buyerName = bData.name || buyerName;
                  buyerUsername = bData.username || buyerUsername;
                  buyerPhotoURL = bData.photoURL || '';
                  buyerGender = bData.gender || 'male';
                }
              }
            } catch (err) {
              console.error('Error fetching buyer info for review:', err);
            }

            // Fetch listing or gig details
            try {
              if (tx.listingId) {
                const itemSnap = await getDoc(doc(db, 'listings', tx.listingId));
                if (itemSnap.exists()) {
                  itemTitle = itemSnap.data().title || itemTitle;
                }
              } else if (tx.gigId) {
                const itemSnap = await getDoc(doc(db, 'gigs', tx.gigId));
                if (itemSnap.exists()) {
                  itemTitle = itemSnap.data().title || itemTitle;
                }
              }
            } catch (err) {
              console.error('Error fetching item info for review:', err);
            }

            return {
              id: tx.id,
              rating: tx.rating,
              ratingComment: tx.ratingComment,
              createdAt: tx.createdAt,
              buyerName,
              buyerUsername,
              buyerPhotoURL,
              buyerGender,
              itemTitle,
              type: tx.type || (tx.listingId ? 'listing' : 'gig')
            };
          })
        );

        // Compute rating statistics and distribution
        const counts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let total = 0;
        populated.forEach(rev => {
          const r = Math.round(rev.rating);
          if (r >= 1 && r <= 5) {
            counts[r] += 1;
          }
          total += rev.rating;
        });

        const avg = populated.length > 0 ? total / populated.length : 0;
        setAverageRating(avg);
        setDistribution(counts);
        setReviews(populated);
      } catch (error) {
        console.error('Error loading reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewsAndDetails();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const totalReviewsCount = reviews.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative border border-gray-100"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-[#fafafa]">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Ratings & Reviews
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Verified Customer Feedback ({totalReviewsCount})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
              id="close-reviews-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="p-8 overflow-y-auto flex-1 space-y-8 no-scrollbar">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Compiling Analytics...</p>
              </div>
            ) : totalReviewsCount === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto border border-dashed border-gray-200">
                  <Star className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">No Reviews Found</h4>
                <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                  This user has completed transactions but has not received any ratings or feedback yet.
                </p>
              </div>
            ) : (
              <>
                {/* Aggregate Summary Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <div className="col-span-1 md:col-span-4 text-center space-y-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Score</span>
                    <div className="text-5xl font-black text-gray-900 tracking-tight">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            Math.round(averageRating) >= star
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[11px] font-black text-indigo-600 uppercase tracking-wide">
                      {totalReviewsCount} {totalReviewsCount === 1 ? 'Rating' : 'Ratings'}
                    </div>
                  </div>

                  {/* Distribution breakdown */}
                  <div className="col-span-1 md:col-span-8 space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = distribution[stars] || 0;
                      const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3">
                          <span className="w-3 text-xs font-black text-gray-600">{stars}</span>
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[11px] font-black text-gray-400">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Reviews List */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">
                    Recent Reviews
                  </h4>
                  <div className="space-y-6 divide-y divide-gray-100">
                    {reviews.map((rev, index) => {
                      const dateObj = rev.createdAt?.toDate ? rev.createdAt.toDate() : new Date(rev.createdAt);
                      return (
                        <div key={rev.id} className={`pt-6 ${index === 0 ? 'pt-0' : ''}`}>
                          <div className="flex gap-4 items-start">
                            {/* Reviewer avatar */}
                            <div className="shrink-0">
                              <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100">
                                <ProfileAvatar
                                  src={rev.buyerPhotoURL}
                                  gender={rev.buyerGender as any}
                                  size="full"
                                />
                              </div>
                            </div>

                            {/* Review Details */}
                            <div className="flex-grow min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-bold text-gray-900 text-sm">{rev.buyerName}</span>
                                  <span className="text-xs text-indigo-500 font-bold ml-1.5">@{rev.buyerUsername}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  {dateObj.toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>
                              </div>

                              {/* Star block */}
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3.5 h-3.5 ${
                                        rev.rating >= star
                                          ? 'text-amber-500 fill-amber-500'
                                          : 'text-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  {rev.rating}/5
                                </span>
                              </div>

                              {/* Comment text */}
                              <p className="text-gray-600 text-sm leading-relaxed font-normal bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                                {rev.ratingComment || 'Completed this transaction successfully. Buyer didn’t leave any comments.'}
                              </p>

                              {/* Transaction category / details */}
                              <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>{rev.type === 'listing' ? 'Listing Purchase' : 'Freelance Service'}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-indigo-600 truncate max-w-[250px]">{rev.itemTitle}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-[#fafafa] flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Close Reviews
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
