import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, UserProfile, ChatThread } from '../types';
import { useAuth } from '../App';
import { useCart } from '../contexts/CartContext';
import { 
  Globe, BarChart3, TrendingUp, Clock, 
  Shield, CheckCircle2, DollarSign, MessageSquare,
  ArrowRight, ChevronLeft, ChevronRight, Share2,
  AlertCircle, Info, ExternalLink, Calendar,
  Users, Activity, Award, Sparkles, Phone, Trash2, Star, Briefcase, Gamepad2,
  ShoppingCart, PlusCircle, Heart, Instagram, Facebook, Twitter, AtSign, Package, Smartphone
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProfileAvatar from '../components/ProfileAvatar';
import ReactMarkdown from 'react-markdown';
import LoadingScreen from '../components/LoadingScreen';
import ReviewsModal from '../components/ReviewsModal';

export default function ListingDetails() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdminOrOwner = user && (user.uid === listing?.userId || profile?.role === 'admin');

  const handleDelete = async () => {
    if (!listing || !window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await updateDoc(doc(db, 'listings', listing.id), { status: 'rejected' }); // Soft delete or actual delete
      // await deleteDoc(doc(db, 'listings', listing.id)); 
      alert('Listing removed successfully.');
      navigate('/browse');
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing.');
    } finally {
      setIsDeleting(false);
    }
  };
  const [activeImage, setActiveImage] = useState(0);
  const [isContacting, setIsContacting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isSubmittingFavorite, setIsSubmittingFavorite] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const isFavorite = profile?.favorites?.includes(id || '');

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;

    setIsSubmittingFavorite(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentFavorites = profile?.favorites || [];
      const newFavorites = currentFavorites.includes(id)
        ? currentFavorites.filter(favId => favId !== id)
        : [...currentFavorites, id];

      await updateDoc(userRef, { favorites: newFavorites });
      // Profile will be updated by auth state change or context
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsSubmittingFavorite(false);
    }
  };

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Listing;
          setListing(data);
          
          // Increment views (optional, don't fail if it fails)
          try {
            await updateDoc(docRef, { views: increment(1) });
          } catch (e) {
            console.warn('Failed to increment views:', e);
          }

          // Fetch seller
          const sellerSnap = await getDoc(doc(db, 'users', data.userId));
          if (sellerSnap.exists()) {
            setSeller({ uid: sellerSnap.id, ...sellerSnap.data() } as UserProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!listing || !id) return;

    setIsContacting(true);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('buyerId', '==', user.uid),
        where('listingId', '==', id)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        navigate(`/chat/${snapshot.docs[0].id}`);
      } else {
        // Create new chat
        const newChat = await addDoc(collection(db, 'chats'), {
          buyerId: user.uid,
          sellerId: listing.userId,
          listingId: id,
          lastMessage: 'Interested in this listing',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
    } finally {
      setIsContacting(false);
    }
  };

  const handleUpdateStatus = async (status: Listing['status'], feedbackText?: string) => {
    if (!id) return;
    try {
      const updateData: any = { status };
      if (feedbackText) updateData.adminFeedback = feedbackText;

      await updateDoc(doc(db, 'listings', id), updateData);
      setListing(prev => prev ? { ...prev, ...updateData } : null);
      
      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: listing?.userId,
        title: status === 'approved' ? 'Listing Approved! 🚀' : 
               status === 'changes_required' ? 'Changes Required for Listing' : 'Listing Rejected',
        message: status === 'approved'
          ? `Your listing "${listing?.title}" has been approved.`
          : status === 'changes_required'
          ? `Changes are required for your listing "${listing?.title}": ${feedbackText}`
          : `Your listing "${listing?.title}" has been rejected.`,
        type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
        link: `/listing/${id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      
      alert(`Listing ${status} successfully.`);
      setShowFeedbackModal(false);
      setFeedback('');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status.');
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) return;
    setSubmittingFeedback(true);
    await handleUpdateStatus('changes_required', feedback);
    setSubmittingFeedback(false);
  };

  if (loading) return <LoadingScreen />;
  if (!listing) return <div className="p-20 text-center">Listing not found.</div>;

  const stats = (listing.type === 'website' || !listing.type) ? [
    { label: 'Monthly Revenue', value: formatCurrency(listing.monthlyRevenue || 0), icon: DollarSign },
    { label: 'Monthly Profit', value: formatCurrency(listing.monthlyProfit || 0), icon: TrendingUp },
    { label: 'Monthly Traffic', value: (listing.monthlyTraffic || 0).toLocaleString(), icon: Users },
    { label: 'Site Age', value: `${listing.siteAge || 0} Years`, icon: Calendar },
  ] : listing.type === 'youtube' ? [
    { label: 'Subscribers', value: (listing.subscribers || 0).toLocaleString(), icon: Users },
    { label: 'Watch Time', value: `${(listing.watchTime || 0).toLocaleString()}h`, icon: Clock },
    { label: 'Monetized', value: listing.isMonetized ? 'Yes' : 'No', icon: DollarSign },
    { label: 'Category', value: listing.category, icon: Globe },
  ] : (listing.type === 'tiktok' || listing.type === 'instagram' || listing.type === 'facebook' || listing.type === 'twitter' || listing.type === 'threads') ? [
    { label: listing.type === 'facebook' ? 'Followers/Members' : 'Followers', value: (listing.followers || 0).toLocaleString(), icon: Users },
    { label: 'Total Likes', value: (listing.totalLikes || 0).toLocaleString(), icon: Star },
    { label: 'Platform', value: listing.type.charAt(0).toUpperCase() + listing.type.slice(1), icon: Globe },
    { label: 'Niche', value: listing.category, icon: Sparkles },
  ] : listing.type === 'games' ? [
    { label: 'Account Level', value: (listing as any).gameLevel || 'N/A', icon: Award },
    { label: 'Platform', value: listing.platform || 'N/A', icon: Globe },
    { label: 'Full Access', value: (listing as any).isFullAccess ? 'Yes' : 'No', icon: Shield },
    { label: 'Category', value: listing.category, icon: Gamepad2 },
  ] : listing.type === 'theme_plugin' ? [
    { label: 'Category', value: listing.category, icon: Package },
    { label: 'Platform', value: listing.platform || 'Custom', icon: Globe },
    { label: 'Assets', value: `${listing.includedAssets.length} Items`, icon: CheckCircle2 },
    { label: 'Views', value: listing.views?.toLocaleString() || '0', icon: Activity },
  ] : listing.type === 'mobile_app' ? [
    { label: 'Category', value: listing.category, icon: Smartphone },
    { label: 'Platform', value: listing.platform || 'Mobile', icon: Globe },
    { label: 'Assets', value: `${listing.includedAssets.length} Items`, icon: CheckCircle2 },
    { label: 'Views', value: listing.views?.toLocaleString() || '0', icon: Activity },
  ] : listing.type === 'other_service' ? [
    { label: 'Service Type', value: listing.category, icon: Briefcase },
    { label: 'Platform', value: listing.platform || 'Service', icon: Globe },
    { label: 'Seller Rating', value: seller?.rating?.toFixed(1) || 'N/A', icon: Star },
    { label: 'Views', value: listing.views?.toLocaleString() || '0', icon: Activity },
  ] : [
    { label: 'Tool Type', value: listing.toolType || 'Premium', icon: Sparkles },
    { label: 'Validity', value: listing.validityPeriod || 'Lifetime', icon: Clock },
    { label: 'Account Type', value: listing.accountType || 'Shared', icon: Shield },
    { label: 'Platform', value: listing.platform || 'Web', icon: Globe },
  ];

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Actions */}
        {profile?.role === 'admin' && (
          <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-200 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-black text-amber-900 mb-1">Admin Controls</h3>
              <p className="text-sm text-amber-700">Current Status: <span className="font-bold uppercase">{listing.status}</span></p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(listing.status === 'pending' || listing.status === 'changes_required') && (
                <button
                  onClick={() => handleUpdateStatus('approved')}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              )}
              {listing.status !== 'rejected' && (
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Reject
                </button>
              )}
              {listing.status !== 'changes_required' && (
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </button>
              )}
              <button
                onClick={handleContactSeller}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Seller
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-white text-red-600 border-2 border-red-100 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedbackModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Request Changes</h3>
                <p className="text-gray-500 mb-6">Explain what needs to be changed in this listing.</p>
                <textarea
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl h-40 outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-6"
                  placeholder="Enter your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={submittingFeedback || !feedback.trim()}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    {submittingFeedback ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Feedback Display for Owner */}
        {listing.status === 'changes_required' && listing.userId === user?.uid && (
          <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-200">
            <div className="flex items-center gap-3 text-amber-900 font-black uppercase tracking-widest text-sm mb-2">
              <AlertCircle className="w-5 h-5" />
              Changes Required by Admin
            </div>
            <p className="text-amber-800 font-medium">{listing.adminFeedback}</p>
          </div>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
          <Link to="/browse" className="hover:text-indigo-600">Marketplace</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900">{listing.category}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Header */}
            <header>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                  {(listing.type === 'website' || !listing.type) ? 'Website' : 
                   listing.type === 'youtube' ? 'YouTube' :
                   listing.type === 'tiktok' ? 'TikTok' :
                   listing.type === 'instagram' ? 'Instagram' :
                   listing.type === 'facebook' ? 'Facebook' :
                   listing.type === 'twitter' ? 'Twitter/X' :
                   listing.type === 'threads' ? 'Threads' :
                   listing.type === 'theme_plugin' ? 'Theme/Plugin' :
                   listing.type === 'mobile_app' ? 'Mobile App' :
                   listing.type === 'games' ? 'Game' :
                   listing.type === 'group_buy' ? 'Group Buy' : 
                   listing.type === 'premium_tool' ? 'Premium Tool' : 'Service'}
                </span>
                <span className="px-4 py-1.5 bg-white text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100 shadow-sm">
                  {listing.category}
                </span>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  {listing.views} Views
                </div>
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tight leading-none">{listing.title}</h1>
              {listing.url && (
                <div className="flex items-center gap-2 text-lg text-gray-500 font-medium">
                  {listing.type === 'website' ? <Globe className="w-5 h-5 text-indigo-600" /> : 
                   listing.type === 'youtube' ? <ArrowRight className="w-5 h-5 text-indigo-600" /> : 
                   listing.type === 'instagram' ? <Instagram className="w-5 h-5 text-indigo-600" /> :
                   listing.type === 'facebook' ? <Facebook className="w-5 h-5 text-indigo-600" /> :
                   listing.type === 'twitter' ? <Twitter className="w-5 h-5 text-indigo-600" /> :
                   listing.type === 'threads' ? <AtSign className="w-5 h-5 text-indigo-600" /> :
                   listing.type === 'theme_plugin' ? <Package className="w-5 h-5 text-indigo-600" /> :
                   listing.type === 'mobile_app' ? <Smartphone className="w-5 h-5 text-indigo-600" /> :
                   listing.type === 'other_service' ? <Briefcase className="w-5 h-5 text-indigo-600" /> : <ExternalLink className="w-5 h-5 text-indigo-600" />}
                  {listing.url}
                  <ExternalLink className="w-4 h-4 text-gray-300" />
                </div>
              )}
              {(listing.type === 'group_buy' || listing.type === 'premium_tool') && (
                <div className="flex items-center gap-2 text-lg text-gray-500 font-medium">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  {listing.toolType}
                </div>
              )}

              {isAdminOrOwner && (
                <div className="flex items-center gap-3 mt-8">
                  <Link
                    to={`/dashboard/listings/edit/${listing.id}`}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <PlusCircle className="w-4 h-4 rotate-45" />
                    Edit Listing
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Listing'}
                  </button>
                </div>
              )}
            </header>

            {/* Gallery */}
            <div className="space-y-4">
              <div className="aspect-video bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 relative group">
                <img 
                  src={listing.images[activeImage] || `https://picsum.photos/seed/${listing.id}/1200/800`} 
                  alt={listing.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                
                {listing.images.length > 1 && (
                  <>
                    <button 
                      onClick={() => setActiveImage(prev => (prev === 0 ? listing.images.length - 1 : prev - 1))}
                      className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setActiveImage(prev => (prev === listing.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
              
              {listing.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {listing.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "w-24 aspect-square rounded-2xl overflow-hidden border-4 transition-all flex-shrink-0",
                        activeImage === i ? "border-indigo-600 scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white rounded-[3rem] p-10 lg:p-16 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <Info className="w-8 h-8 text-indigo-600" />
                About This Opportunity
              </h2>
              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed">
                <ReactMarkdown>{listing.description}</ReactMarkdown>
              </div>
            </div>

            {/* Included Assets */}
            <div className="bg-white rounded-[3rem] p-10 lg:p-16 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-4">
                <CheckCircle2 className="w-8 h-8 text-indigo-600" />
                {listing.type === 'group_buy' ? 'Included Tools' : 'Included Assets'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {listing.includedAssets.map((asset, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                      {listing.type === 'group_buy' ? <Sparkles className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{asset}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Pricing Card */}
            <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 sticky top-24">
              <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4" />
                Exclusive Listing
              </div>
              <div className="text-5xl font-black text-gray-900 mb-2">{formatCurrency(listing.askingPrice)}</div>
              <p className="text-sm text-gray-400 mb-10">Manual Escrow Protection Included</p>

              <div className="space-y-4">
                <button
                  onClick={toggleFavorite}
                  disabled={isSubmittingFavorite}
                  className={cn(
                    "w-full py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-lg flex items-center justify-center gap-3",
                    isFavorite 
                      ? "bg-red-50 text-red-600 border-2 border-red-100 shadow-red-50" 
                      : "bg-white text-gray-900 border-2 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
                {listing.status === 'sold' ? (
                  <div className="space-y-2">
                    <div className="w-full bg-rose-100 text-rose-700 py-5 rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 border-2 border-rose-250">
                      <AlertCircle className="w-6 h-6 text-rose-600 animate-pulse" />
                      <span>SOLD & COMMITTED</span>
                    </div>
                    {listing.soldAt && (
                      <p className="text-gray-400 text-xs text-center font-bold uppercase tracking-widest mt-1">
                        Will disappear in {(() => {
                          const sAt = listing.soldAt as any;
                          const soldTime = sAt.toDate ? sAt.toDate().getTime() : new Date(sAt).getTime();
                          const expiryTime = soldTime + 24 * 60 * 60 * 1000;
                          const remainingMs = expiryTime - Date.now();
                          if (remainingMs <= 0) return '0 hrs';
                          const remainingHrs = Math.ceil(remainingMs / (60 * 60 * 1000));
                          return `${remainingHrs} ${remainingHrs === 1 ? 'hour' : 'hours'}`;
                        })()}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (!listing) return;
                        addToCart({
                          id: listing.id,
                          type: 'listing',
                          title: listing.title,
                          price: listing.askingPrice,
                          image: listing.images[0] || `https://picsum.photos/seed/${listing.id}/400/300`,
                          sellerId: listing.userId
                        });
                      }}
                      disabled={isInCart(listing.id)}
                      className={cn(
                        "w-full py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-lg flex items-center justify-center gap-3",
                        isInCart(listing.id)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100"
                      )}
                    >
                      <ShoppingCart className="w-6 h-6" />
                      {isInCart(listing.id) ? 'Added to Cart' : 'Add to Cart'}
                    </button>
                    <Link
                      to={`/payment/${listing.id}`}
                      className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3"
                    >
                      <DollarSign className="w-6 h-6" />
                      {(listing.type === 'website' || !listing.type) ? 'Buy This Website' : 
                       listing.type === 'youtube' ? 'Buy This Channel' : 
                       (listing.type === 'tiktok' || listing.type === 'instagram' || listing.type === 'facebook' || listing.type === 'twitter' || listing.type === 'threads') ? 'Buy This Account' : 
                       listing.type === 'theme_plugin' ? 'Buy This Code' :
                       listing.type === 'mobile_app' ? 'Buy This App' :
                       listing.type === 'games' ? 'Buy This Game' :
                       listing.type === 'other_service' ? 'Buy This Service' : 'Buy This Tool'}
                    </Link>
                  </>
                )}
                <button
                  onClick={handleContactSeller}
                  disabled={isContacting}
                  className="w-full bg-white text-gray-900 border-2 border-gray-100 py-5 rounded-[1.5rem] font-black text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  {isContacting ? 'Connecting...' : 'Contact Seller'}
                </button>
              </div>

              <div className="mt-10 pt-10 border-t border-gray-50 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 mb-1">Escrow Protection</div>
                    <p className="text-xs text-gray-400 leading-relaxed">We hold your funds securely until the website is transferred to you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900 mb-1">Verified Data</div>
                    <p className="text-xs text-gray-400 leading-relaxed">Our team has manually verified the traffic and revenue claims for this listing.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Seller Information</h3>
              <div className="flex items-center gap-4 mb-8">
                <ProfileAvatar 
                  src={seller?.photoURL} 
                  gender={seller?.gender} 
                  size="lg" 
                  username={seller?.username} 
                />
                <div>
                  <div className="text-lg font-black text-gray-900">{seller?.name}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn("w-2 h-2 rounded-full", seller?.lastActiveAt ? "bg-green-500" : "bg-gray-300")} />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getOnlineStatus(seller?.lastActiveAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400">Total Sales</span>
                  <span className="text-sm font-black text-gray-900">{seller?.totalSales || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400">Websites Sold</span>
                  <span className="text-sm font-black text-gray-900">{seller?.websitesSold || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400">Response Time</span>
                  <span className="text-sm font-black text-gray-900">{seller?.responseTime || '< 2 Hours'}</span>
                </div>
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all"
                  onClick={() => seller && setIsReviewsOpen(true)}
                >
                  <span className="text-xs font-bold text-gray-400">Rating (Click to view)</span>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span className="text-sm font-black text-gray-900">
                      {seller?.rating && seller.rating > 0 ? `${seller.rating.toFixed(1)} (${seller.totalReviews || 0})` : 'No ratings'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <a
                  href={`https://wa.me/${seller?.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-4 text-sm font-black text-green-600 bg-green-50 rounded-2xl hover:bg-green-100 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp Seller
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {seller && (
        <ReviewsModal
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
          userId={seller.uid}
        />
      )}
    </div>
  );
}
