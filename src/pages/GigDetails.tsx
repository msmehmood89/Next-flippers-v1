import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Gig, UserProfile } from '../types';
import { useAuth } from '../App';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Clock, MessageSquare, Shield, 
  CheckCircle2, ArrowRight, ChevronLeft, 
  DollarSign, Zap, Award, Globe, AlertCircle, Trash2,
  ShoppingCart, PlusCircle, Heart
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus } from '../lib/utils';
import ProfileAvatar from '../components/ProfileAvatar';
import LoadingScreen from '../components/LoadingScreen';

export default function GigDetails() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();
  const [gig, setGig] = useState<Gig | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [isSubmittingFavorite, setIsSubmittingFavorite] = useState(false);

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
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsSubmittingFavorite(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchGigData = async () => {
      try {
        const gigSnap = await getDoc(doc(db, 'gigs', id));
        if (gigSnap.exists()) {
          const gigData = { id: gigSnap.id, ...gigSnap.data() } as Gig;
          setGig(gigData);

          // Fetch seller profile
          const sellerSnap = await getDoc(doc(db, 'users', gigData.userId));
          if (sellerSnap.exists()) {
            setSeller({ uid: sellerSnap.id, ...sellerSnap.data() } as UserProfile);
          }
        } else {
          navigate('/freelancers');
        }
      } catch (error) {
        console.error('Error fetching gig details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGigData();
  }, [id, navigate]);

  const isAdminOrOwner = user && (user.uid === gig?.userId || profile?.role === 'admin');

  const handleUpdateStatus = async (status: Gig['status'], feedbackText?: string) => {
    if (!id) return;
    try {
      const updateData: any = { status };
      if (feedbackText) updateData.adminFeedback = feedbackText;
      
      await updateDoc(doc(db, 'gigs', id), updateData);
      setGig(prev => prev ? { ...prev, ...updateData } : null);
      
      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: gig?.userId,
        title: status === 'approved' || status === 'active' ? 'Gig Approved! 🚀' : 
               status === 'changes_required' ? 'Changes Required for Gig' : 'Gig Rejected',
        message: status === 'approved' || status === 'active'
          ? `Your gig "${gig?.title}" has been approved.`
          : status === 'changes_required'
          ? `Changes are required for your gig "${gig?.title}": ${feedbackText}`
          : `Your gig "${gig?.title}" has been rejected.`,
        type: status === 'approved' || status === 'active' ? 'listing_approved' : 'listing_rejected',
        link: `/gig/${id}`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
      
      alert(`Gig ${status} successfully.`);
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

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this gig?')) return;
    try {
      await deleteDoc(doc(db, 'gigs', id));
      navigate('/freelancers');
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!gig || !id) return;

    try {
      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('buyerId', '==', user.uid),
        where('sellerId', '==', gig.userId),
        where('listingId', '==', id) // Using gig ID as listingId for simplicity
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        navigate(`/chat/${querySnapshot.docs[0].id}`);
      } else {
        // Create new chat
        const newChat = {
          buyerId: user.uid,
          sellerId: gig.userId,
          listingId: id,
          listingTitle: gig.title,
          createdAt: serverTimestamp(),
          lastMessage: 'Interested in your service',
          lastMessageAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'chats'), newChat);
        navigate(`/chat/${docRef.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!gig) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin/Owner Actions */}
        {isAdminOrOwner && (
          <div className="mb-8 p-6 bg-white rounded-[2rem] border-2 border-indigo-100 flex flex-wrap items-center justify-between gap-6 shadow-sm">
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-1">
                {profile?.role === 'admin' ? 'Admin / Owner Controls' : 'My Gig Controls'}
              </h3>
              <p className="text-sm text-gray-500 font-medium">Status: <span className="font-bold uppercase text-indigo-600">{gig.status}</span></p>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile?.role === 'admin' && (
                <>
                  {(gig.status === 'pending' || gig.status === 'changes_required') && (
                    <button
                      onClick={() => handleUpdateStatus('active')}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                  )}
                  {gig.status !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                  {gig.status !== 'changes_required' && (
                    <button
                      onClick={() => setShowFeedbackModal(true)}
                      className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Request Changes
                    </button>
                  )}
                </>
              )}
              
              <Link
                to={`/dashboard/gigs/edit/${id}`}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 rotate-45" />
                Edit Gig
              </Link>

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
                <p className="text-gray-500 mb-6">Explain what needs to be changed in this gig.</p>
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

        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-sm font-bold">
          <Link to="/freelancers" className="text-gray-400 hover:text-indigo-600 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-gray-900">{gig.category}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            <header>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                {gig.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <ProfileAvatar 
                    src={seller?.photoURL} 
                    gender={seller?.gender} 
                    size="md" 
                    username={seller?.username} 
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-900">{seller?.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black">{seller?.rating ? seller.rating.toFixed(1) : 'No ratings'}</span>
                      </div>
                      <div className="h-3 w-px bg-gray-200" />
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", seller?.lastActiveAt ? "bg-green-500" : "bg-gray-300")} />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getOnlineStatus(seller?.lastActiveAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-200 hidden md:block" />
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">{gig.deliveryTime} Delivery</span>
                </div>
              </div>
            </header>

            {/* Image Gallery */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-indigo-100/20 border border-gray-100">
              <div className="aspect-video relative">
                <img
                  src={gig.images[0] || `https://picsum.photos/seed/${gig.id}/1200/800`}
                  alt={gig.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {gig.images.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-4 bg-gray-50/50">
                  {gig.images.slice(1).map((img, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden border border-gray-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-indigo-100/20 border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">About This Gig</h2>
              <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed font-medium">
                {gig.description.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pricing Card */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100/40 border border-indigo-100 sticky top-24">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Starting Price</span>
                <div className="text-4xl font-black text-indigo-600">{formatCurrency(gig.price)}</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Commercial Use Included
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Unlimited Revisions
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  {gig.deliveryTime} Delivery
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button
                  onClick={toggleFavorite}
                  disabled={isSubmittingFavorite}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3",
                    isFavorite 
                      ? "bg-red-50 text-red-600 border-2 border-red-100 shadow-red-50" 
                      : "bg-white text-gray-900 border-2 border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <Heart className={cn("w-6 h-6", isFavorite && "fill-current")} />
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </button>
                <button
                  onClick={() => {
                    if (!gig) return;
                    addToCart({
                      id: gig.id,
                      type: 'gig',
                      title: gig.title,
                      price: gig.price,
                      image: gig.images[0] || `https://picsum.photos/seed/${gig.id}/400/300`,
                      sellerId: gig.userId
                    });
                  }}
                  disabled={isInCart(gig.id)}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3",
                    isInCart(gig.id)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100"
                  )}
                >
                  <ShoppingCart className="w-6 h-6" />
                  {isInCart(gig.id) ? 'Added to Cart' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => navigate(`/payment/gig/${id}`)}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                >
                  <Zap className="w-6 h-6" />
                  Order Now
                </button>
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-lg border-2 border-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3"
                >
                  <MessageSquare className="w-6 h-6" />
                  Contact Freelancer
                </button>
              </div>
              
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                Secure Escrow Protection Active
              </p>
            </div>

            {/* Freelancer Stats */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Freelancer Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400">Orders Completed</span>
                  <span className="text-sm font-black text-gray-900">{seller?.ordersCompleted || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400">Total Sales</span>
                  <span className="text-sm font-black text-gray-900">{seller?.totalSales || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <span className="text-xs font-bold text-gray-400">Response Time</span>
                  <span className="text-sm font-black text-gray-900">{seller?.responseTime || '< 2 Hours'}</span>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Why Hire Here?
              </h3>
              <div className="space-y-6">
                {[
                  { icon: Zap, title: 'Fast Results', desc: 'Get your project delivered on time.' },
                  { icon: Award, title: 'Expert Talent', desc: 'Vetted professionals only.' },
                  { icon: Globe, title: 'Global Support', desc: '24/7 assistance available.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1">{item.title}</div>
                      <div className="text-xs text-indigo-100 opacity-80">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
