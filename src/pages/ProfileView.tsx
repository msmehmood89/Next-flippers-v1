import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Listing, Gig } from '../types';
import { 
  Shield, Globe, Briefcase, ShoppingBag, 
  MapPin, Calendar, Star, MessageSquare, 
  ArrowUpRight, ExternalLink, Award, Zap,
  Cpu, Terminal, Activity, Lock, Unlock,
  BarChart3, FileText, User, Mail, CheckCircle2, ArrowRight
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus, createNotification } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProfileAvatar from '../components/ProfileAvatar';
import ReviewsModal from '../components/ReviewsModal';
import { useAuth } from '../App';

export default function ProfileView() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'buyer' | 'seller' | 'freelancer' | 'reviews'>('profile');
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  // Reviews list and aggregation states
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [distribution, setDistribution] = useState<{ [key: number]: number }>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [fetchingReviews, setFetchingReviews] = useState(false);

  // Buyer transactions for submission of review
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');
  const [completedDealsCount, setCompletedDealsCount] = useState(0);

  useEffect(() => {
    if (!username) return;
    setLoading(true);

    const q = query(collection(db, 'users'), where('username', '==', username));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const userData = { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
      setProfile(userData);
      
      setActiveTab(prev => prev || (userData.role === 'admin' ? 'profile' : userData.role));

      try {
        // Fetch user's listings
        const listingsQ = query(
          collection(db, 'listings'), 
          where('userId', '==', userData.uid),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        const listingsSnap = await getDocs(listingsQ);
        setListings(listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));

        // Fetch user's gigs
        const gigsQ = query(
          collection(db, 'gigs'), 
          where('userId', '==', userData.uid),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        const gigsSnap = await getDocs(gigsQ);
        setGigs(gigsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig)));
      } catch (err) {
        console.error('Error fetching dependency documents inside profile snapshots:', err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in profile snapshot:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [username]);

  const fetchReviewsAndDetails = useCallback(async () => {
    if (!profile?.uid) return;
    setFetchingReviews(true);
    try {
      const txsRef = collection(db, 'transactions');
      let sellerDocs: any[] = [];
      let buyerDocs: any[] = [];

      try {
        const sellerQuery = query(txsRef, where('sellerId', '==', profile.uid));
        const buyerQuery = query(txsRef, where('buyerId', '==', profile.uid));
        const [sellerSnap, buyerSnap] = await Promise.all([
          getDocs(sellerQuery),
          getDocs(buyerQuery)
        ]);
        sellerDocs = sellerSnap.docs;
        buyerDocs = buyerSnap.docs;
      } catch (err) {
        console.warn('Full seller transactions read restricted, attempting public completed/rated queries...', err);
        try {
          const [compSel, confSel, compBuy, confBuy] = await Promise.all([
            getDocs(query(txsRef, where('sellerId', '==', profile.uid), where('dealStatus', '==', 'completed'))),
            getDocs(query(txsRef, where('sellerId', '==', profile.uid), where('dealStatus', '==', 'buyer_confirmed'))),
            getDocs(query(txsRef, where('buyerId', '==', profile.uid), where('dealStatus', '==', 'completed'))),
            getDocs(query(txsRef, where('buyerId', '==', profile.uid), where('dealStatus', '==', 'buyer_confirmed')))
          ]);
          sellerDocs = [...compSel.docs, ...confSel.docs];
          buyerDocs = [...compBuy.docs, ...confBuy.docs];
        } catch (err2) {
          console.error('Error fetching fallback completed transactions:', err2);
        }
      }

      const completedStatuses = ['buyer_confirmed', 'payment_released', 'seller_received', 'completed'];
      
      const sellerCompleted = sellerDocs.filter(d => completedStatuses.includes(d.data().dealStatus));
      const buyerCompleted = buyerDocs.filter(d => completedStatuses.includes(d.data().dealStatus));
      const totalCompleted = sellerCompleted.length + buyerCompleted.length;
      setCompletedDealsCount(totalCompleted);

      const ratedTransactions = sellerDocs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(tx => tx.rating && tx.rating > 0);

      const populated = await Promise.all(
        ratedTransactions.map(async (tx) => {
          let buyerName = 'Anonymous Buyer';
          let buyerUsername = 'buyer';
          let buyerPhotoURL = '';
          let buyerGender = 'male';
          let itemTitle = `Order #${tx.id.slice(-6).toUpperCase()}`;

          try {
            if (tx.buyerId) {
              const buyerSnapShot = await getDoc(doc(db, 'users', tx.buyerId));
              if (buyerSnapShot.exists()) {
                const bData = buyerSnapShot.data();
                buyerName = bData.name || buyerName;
                buyerUsername = bData.username || buyerUsername;
                buyerPhotoURL = bData.photoURL || '';
                buyerGender = bData.gender || 'male';
              }
            }
          } catch (err) {
            console.error('Error fetching buyer info:', err);
          }

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
            console.error('Error fetching item info:', err);
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

      // Compute aggregate statistics
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
      setFetchingReviews(false);
    }
  }, [profile?.uid]);

  const fetchBuyerTransactions = useCallback(async () => {
    if (!profile?.uid) return;
    if (!currentUser || currentUser.uid === profile.uid) {
      setUserTxs([]);
      return;
    }
    try {
      const txsRef = collection(db, 'transactions');
      const q = query(
        txsRef,
        where('buyerId', '==', currentUser.uid),
        where('sellerId', '==', profile.uid)
      );
      const snap = await getDocs(q);
      
      const completedStatuses = ['buyer_confirmed', 'payment_released', 'seller_received', 'completed'];
      const completedTxs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(tx => completedStatuses.includes(tx.dealStatus));

      const enrichedTxs = await Promise.all(completedTxs.map(async (tx) => {
        let itemTitle = `Order #${tx.id.slice(-6).toUpperCase()}`;
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
        } catch (e) {
          console.error(e);
        }
        return { ...tx, itemTitle };
      }));

      setUserTxs(enrichedTxs);
      if (enrichedTxs.length > 0) {
        const firstUnrated = enrichedTxs.find(tx => !tx.rating);
        setSelectedTxId(firstUnrated ? firstUnrated.id : enrichedTxs[0].id);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [profile?.uid, currentUser?.uid]);

  useEffect(() => {
    fetchReviewsAndDetails();
    fetchBuyerTransactions();
  }, [fetchReviewsAndDetails, fetchBuyerTransactions]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId) {
      setReviewErrorMsg('Please select a transaction to review.');
      return;
    }
    setSubmittingReview(true);
    setReviewSuccessMsg('');
    setReviewErrorMsg('');

    try {
      const txRef = doc(db, 'transactions', selectedTxId);
      await updateDoc(txRef, {
        rating: reviewRating,
        ratingComment: reviewComment,
        updatedAt: serverTimestamp()
      });

      // Recalculate seller statistics based on all transactions
      const txsQueryObj = query(
        collection(db, 'transactions'),
        where('sellerId', '==', profile!.uid)
      );
      const allTxsSnap = await getDocs(txsQueryObj);
      const allTxs = allTxsSnap.docs.map(doc => doc.data());
      const ratedTxs = allTxs.filter(tx => tx.rating && tx.rating > 0);
      
      const gigRated = ratedTxs.filter(tx => tx.gigId);
      const listingRated = ratedTxs.filter(tx => !tx.gigId);

      const sellerReviewsCount = listingRated.length;
      const sellerRatingVal = sellerReviewsCount > 0 ? listingRated.reduce((sum, tx) => sum + tx.rating, 0) / sellerReviewsCount : 0;

      const freelancerReviewsCount = gigRated.length;
      const freelancerRatingVal = freelancerReviewsCount > 0 ? gigRated.reduce((sum, tx) => sum + tx.rating, 0) / freelancerReviewsCount : 0;

      const aggregateReviewsCount = ratedTxs.length;
      const aggregateRatingVal = aggregateReviewsCount > 0 ? ratedTxs.reduce((sum, tx) => sum + tx.rating, 0) / aggregateReviewsCount : 0;

      const userUpdateData: any = {
        sellerRating: sellerRatingVal,
        sellerReviews: sellerReviewsCount,
        freelancerRating: freelancerRatingVal,
        freelancerReviews: freelancerReviewsCount,
        rating: aggregateRatingVal,
        totalReviews: aggregateReviewsCount
      };

      await updateDoc(doc(db, 'users', profile!.uid), userUpdateData);

      await createNotification(
        profile!.uid,
        'New Review Received! ⭐️',
        `${currentUser?.displayName || 'A buyer'} left you a ${reviewRating}-star review.`,
        'deal_update',
        `/profile/${profile!.username}`
      );

      setReviewSuccessMsg('Your feedback has been successfully posted! Thank you.');
      setReviewComment('');
      
      // Update local transaction state with the new rating
      setUserTxs(prev => prev.map(tx => tx.id === selectedTxId ? { ...tx, rating: reviewRating, ratingComment: reviewComment } : tx));

      // Re-fetch profile and reviews
      const profileSnapshot = await getDoc(doc(db, 'users', profile!.uid));
      if (profileSnapshot.exists()) {
        const uData = { uid: profileSnapshot.id, ...profileSnapshot.data() } as UserProfile;
        setProfile(uData);
      }
      fetchReviewsAndDetails();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setReviewErrorMsg('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <div className="font-bold text-gray-400 text-sm animate-pulse">Loading Profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profile Not Found</h1>
          <p className="text-gray-500 text-sm leading-relaxed">The user profile you are looking for does not exist or has been removed from our marketplace.</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Derived / aggregated fallbacks to bypass Firestore replication and delay issues
  const displayRating = averageRating > 0 ? averageRating : (profile.rating && profile.rating > 0 ? profile.rating : 0);
  const displayTotalReviews = reviews.length > 0 ? reviews.length : (profile.totalReviews || 0);
  const displayCompletedDeals = completedDealsCount > 0 ? completedDealsCount : (profile.ordersCompleted || 0);

  const onlineStatusStr = getOnlineStatus(profile.lastActiveAt);
  const isOnlineNow = onlineStatusStr === 'Active now';

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'buyer', label: 'Buyer Profile', icon: ShoppingBag },
    { id: 'seller', label: 'Storefront', icon: Globe },
    { id: 'freelancer', label: 'Services', icon: Briefcase },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Professional Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 mb-8"
        >
          {/* Cover Background Area */}
          <div className="h-48 relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            {profile.bannerURL && (
              <img src={profile.bannerURL} className="absolute inset-0 w-full h-full object-cover" alt="" />
            )}
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute top-6 right-8 flex gap-3">
              <button className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all">
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-8 md:px-12 pb-10 -mt-12 relative">
            <div className="flex flex-col md:flex-row gap-8 items-end">
              {/* Profile Image Section */}
              <div className="relative">
                <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-xl bg-gray-50 bg-white">
                  <ProfileAvatar src={profile.photoURL} gender={profile.gender} size="full" />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-grow pb-2">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black tracking-tight text-gray-900">
                    {profile.name}
                  </h1>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {profile.role}
                  </span>
                </div>
                <p className="text-gray-500 font-bold flex items-center gap-2">
                  <span className="text-indigo-600">@{profile.username}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.country || 'International'}
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-2 w-full md:w-auto">
                <button 
                  onClick={() => navigate(`/chat?userId=${profile.uid}`)}
                  className="flex-1 md:flex-none px-8 py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <div className="flex gap-2">
                   <button className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100">
                     <BarChart3 className="w-5 h-5" />
                   </button>
                   <button className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all border border-gray-100">
                     <ExternalLink className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-10 pt-8 border-t border-gray-50">
              <div 
                className="space-y-1 cursor-pointer group hover:opacity-80 transition-all"
                onClick={() => setActiveTab('reviews')}
              >
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Trust Rating (Click to view)</div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-black">
                    {displayRating > 0 ? displayRating.toFixed(1) : 'No ratings'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({displayTotalReviews})
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed Deals</div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <span className="text-lg font-black">{displayCompletedDeals}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Member Since</div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-lg font-black">{profile.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Online</div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", isOnlineNow ? "bg-emerald-500 animate-pulse shadow-emerald-100" : "bg-amber-500")} />
                  <span className="text-lg font-black">{onlineStatusStr}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
 
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar / Left Column */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Performance
              </h3>
              <div className="space-y-5">
                {[
                  { label: 'Response Rate', value: '100%', color: 'from-emerald-500 to-teal-500' },
                  { label: 'Orders Completed', value: `${displayCompletedDeals}`, color: 'from-indigo-500 to-blue-500', isCount: true },
                  { 
                    label: 'Satisfaction', 
                    value: displayRating > 0 ? `${displayRating.toFixed(1)}/5 (${displayTotalReviews} reviews)` : 'No ratings', 
                    color: 'from-amber-500 to-orange-500',
                    isClickable: true
                  }
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className={cn(stat.isClickable ? "cursor-pointer group hover:opacity-80 transition-all" : "")}
                    onClick={() => stat.isClickable && setActiveTab('reviews')}
                  >
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className={cn("text-gray-400 uppercase tracking-wide", stat.isClickable ? "group-hover:text-indigo-600 transition-colors" : "")}>{stat.label}</span>
                      <span className="text-gray-900">{stat.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r", stat.color)} style={{ width: (stat as any).isCount ? '100%' : (stat.value.includes('%') ? stat.value : (displayRating > 0 ? `${(displayRating / 5) * 100}%` : '0%')) }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? profile.skills.map((skill, i) => (
                  <span key={i} className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-white hover:shadow-sm transition-all">
                    {skill}
                  </span>
                )) : (
                  <p className="text-gray-400 text-xs italic">No skills listed yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-full overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex-1 justify-center",
                    activeTab === tab.id 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <section className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                         <FileText className="w-32 h-32" />
                       </div>
                       <h3 className="text-xl font-black text-gray-900 mb-6 font-display">About Me</h3>
                       <div className="prose prose-indigo max-w-none text-gray-500 leading-relaxed text-sm">
                         {profile.bio || `Hi, I'm ${profile.name}! I'm active on Next Flippers as a ${profile.role}. Let's work together.`}
                       </div>
                       
                       {profile.experience && (
                         <>
                           <div className="h-px bg-gray-50 my-8" />
                           <h3 className="text-xl font-black text-gray-900 mb-6 font-display">Experience</h3>
                           <p className="text-gray-500 leading-relaxed text-sm">
                             {profile.experience}
                           </p>
                         </>
                       )}
                    </section>
                  </div>
                )}

                {activeTab === 'buyer' && (
                  <section className="bg-white rounded-[2rem] p-10 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-black text-gray-900 mb-8 font-display">Buying Interests</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-[#f8fafc] rounded-3xl border border-gray-100 group hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Primary Interest</span>
                        <div className="text-xl font-black text-gray-900">{profile.mainBusiness || 'Digital Assets'}</div>
                      </div>
                      <div className="p-8 bg-[#f8fafc] rounded-3xl border border-gray-100 group hover:border-indigo-200 transition-all">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Looking to Acquire</span>
                        <div className="text-xl font-black text-gray-900">{profile.lookingFor || 'Profitable Ventures'}</div>
                      </div>
                    </div>
                  </section>
                )}

                {activeTab === 'seller' && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-gray-900 font-display">Storefront Listings</h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">{listings.length} Active</span>
                    </div>
                    {listings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {listings.map(listing => (
                          <Link 
                            key={listing.id} 
                            to={`/listing/${listing.id}`}
                            className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                          >
                            <div className="aspect-[16/10] relative overflow-hidden">
                              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              <div className="absolute top-4 right-4 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg">
                                {formatCurrency(listing.askingPrice)}
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">{listing.category}</div>
                              <h4 className="font-bold text-gray-900 line-clamp-1 mb-4 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{listing.title}</h4>
                              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-[10px] font-black text-gray-400 uppercase">View asset</span>
                                <ArrowRight className="w-4 h-4 text-indigo-600" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-[2rem] p-12">
                        <ShoppingBag className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                        <p className="text-gray-400 font-bold">No active listings from this seller.</p>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'freelancer' && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-gray-900 font-display">Service Offerings</h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase">{gigs.length} Active</span>
                    </div>
                    {gigs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {gigs.map(gig => (
                          <Link 
                            key={gig.id} 
                            to={`/gig/${gig.id}`}
                            className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all"
                          >
                            <div className="aspect-[16/10] relative overflow-hidden">
                              <img src={gig.images[0]} alt={gig.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              <div className="absolute bottom-4 right-4 px-4 py-2 bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg">
                                FROM {formatCurrency(gig.price)}
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">{gig.category}</div>
                              <h4 className="font-bold text-gray-900 line-clamp-1 mb-4 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{gig.title}</h4>
                              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-[10px] font-black text-gray-400 uppercase">View gig</span>
                                <ArrowRight className="w-4 h-4 text-emerald-600" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-[2rem] p-12">
                        <Briefcase className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                        <p className="text-gray-400 font-bold">No active service gigs available.</p>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-8">
                    {/* Review Form - only for logged-in users with a completed transaction */}
                    {currentUser && currentUser.uid !== profile.uid && userTxs.length > 0 && (
                      <section className="bg-white rounded-[2rem] p-8 md:p-10 border border-indigo-100 shadow-sm bg-gradient-to-br from-white to-indigo-50/25">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-indigo-500 text-white rounded-2xl">
                            <Star className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight font-display">Write a Review</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Leave feedback for your success deals</p>
                          </div>
                        </div>

                        {reviewSuccessMsg && (
                          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-100 mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            {reviewSuccessMsg}
                          </div>
                        )}

                        {reviewErrorMsg && (
                          <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl text-xs font-bold border border-rose-100 mb-6 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-rose-600" />
                            {reviewErrorMsg}
                          </div>
                        )}

                        <form onSubmit={handleSubmitReview} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Select Transaction</label>
                              <select
                                value={selectedTxId}
                                onChange={(e) => {
                                  setSelectedTxId(e.target.value);
                                  const tx = userTxs.find(t => t.id === e.target.value);
                                  if (tx && tx.rating) {
                                    setReviewRating(tx.rating);
                                    setReviewComment(tx.ratingComment || '');
                                  } else {
                                    setReviewRating(5);
                                    setReviewComment('');
                                  }
                                }}
                                className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-gray-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm focus:border-indigo-500"
                              >
                                {userTxs.map((tx) => (
                                  <option key={tx.id} value={tx.id}>
                                    {tx.itemTitle} ({tx.rating ? `Rated: ${tx.rating} ⭐` : 'Unrated'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Your Rating Score</label>
                              <div className="flex gap-1.5 py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    type="button"
                                    key={star}
                                    onClick={() => setReviewRating(star)}
                                    className="p-1 transition-transform active:scale-95 duration-100 hover:scale-110"
                                  >
                                    <Star 
                                      className={cn(
                                        "w-8 h-8 transition-colors", 
                                        reviewRating >= star ? "text-amber-400 fill-amber-400" : "text-gray-200"
                                      )} 
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Review Comment / Experience</label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Describe your collaboration, professionalism, communication, and work quality..."
                              rows={3}
                              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-xs font-bold text-gray-700 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm resize-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              disabled={submittingReview}
                              className="px-8 py-3.5 bg-indigo-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                            >
                              {submittingReview ? 'Posting Review...' : 'Submit Feedback'}
                            </button>
                          </div>
                        </form>
                      </section>
                    )}

                    {/* Aggregate Summary Section */}
                    {reviews.length > 0 ? (
                      <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-sm space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
                          <div className="col-span-1 md:col-span-4 text-center space-y-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Average Trust Rating</span>
                            <div className="text-5xl font-black text-gray-900 tracking-tight">
                              {averageRating.toFixed(1)}
                            </div>
                            <div className="flex justify-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    Math.round(averageRating) >= star
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="text-[11px] font-black text-indigo-600 uppercase tracking-wide">
                              {reviews.length} {reviews.length === 1 ? 'Rating' : 'Ratings'}
                            </div>
                          </div>

                          {/* Distribution breakdown */}
                          <div className="col-span-1 md:col-span-8 space-y-2.5">
                            {[5, 4, 3, 2, 1].map((stars) => {
                              const count = distribution[stars] || 0;
                              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                              return (
                                <div key={stars} className="flex items-center gap-3">
                                  <span className="w-3 text-xs font-black text-gray-600">{stars}</span>
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
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

                        {/* Individual list of reviews */}
                        <div className="space-y-6">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-3">
                            All Reviews & Feedback ({reviews.length})
                          </h4>
                          <div className="space-y-8 divide-y divide-gray-100">
                            {reviews.map((rev, index) => {
                              const dateObj = rev.createdAt?.toDate ? rev.createdAt.toDate() : new Date(rev.createdAt);
                              return (
                                <div key={rev.id} className={`pt-6 ${index === 0 ? 'pt-0' : ''}`}>
                                  <div className="flex gap-4 items-start">
                                    <div className="shrink-0">
                                      <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100">
                                        <ProfileAvatar
                                          src={rev.buyerPhotoURL}
                                          gender={rev.buyerGender as any}
                                          size="full"
                                        />
                                      </div>
                                    </div>

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

                                      <div className="flex items-center gap-1.5">
                                        <div className="flex gap-0.5">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                              key={star}
                                              className={`w-3 h-3 ${
                                                rev.rating >= star
                                                  ? 'text-amber-400 fill-amber-400'
                                                  : 'text-gray-200'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                          {rev.rating}/5
                                        </span>
                                      </div>

                                      <p className="text-gray-600 text-xs leading-relaxed font-normal bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/50 max-w-full italic">
                                        "{rev.ratingComment || 'Completed this transaction successfully. Buyer didn’t leave any comments.'}"
                                      </p>

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
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-200 border-dashed max-w-lg mx-auto space-y-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-dashed border-gray-200">
                          <Star className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-base font-black text-gray-900 uppercase tracking-tight">No Reviews Yet</h4>
                          <p className="text-sm text-gray-400 leading-relaxed">
                            This user has not received any feedback or ratings yet.
                          </p>
                        </div>
                        {(!currentUser || currentUser.uid === profile.uid || userTxs.length === 0) && (
                          <div className="text-[11px] font-black text-indigo-500 uppercase tracking-wider bg-indigo-50/50 px-4 py-2.5 rounded-xl inline-block">
                            🛡️ Verified reviews can only be left by buyers who complete matches with this user.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ReviewsModal
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
          userId={profile.uid}
        />
      </div>
    </div>
  );
}
