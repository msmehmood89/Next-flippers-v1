import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Listing, Gig } from '../types';
import { 
  Shield, Globe, Briefcase, ShoppingBag, 
  MapPin, Calendar, Star, MessageSquare, 
  ArrowUpRight, ExternalLink, Award, Zap,
  Cpu, Terminal, Activity, Lock, Unlock,
  BarChart3, FileText, User, Mail, CheckCircle2, ArrowRight
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProfileAvatar from '../components/ProfileAvatar';
import ReviewsModal from '../components/ReviewsModal';

export default function ProfileView() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'buyer' | 'seller' | 'freelancer'>('profile');
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setProfile(null);
          return;
        }

        const userData = { uid: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserProfile;
        setProfile(userData);
        setActiveTab(userData.role === 'admin' ? 'profile' : userData.role);

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

      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

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

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'buyer', label: 'Buyer Profile', icon: ShoppingBag },
    { id: 'seller', label: 'Storefront', icon: Globe },
    { id: 'freelancer', label: 'Services', icon: Briefcase },
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
          <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
            <div className="absolute inset-0 bg-black/10" />
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
                onClick={() => setIsReviewsOpen(true)}
              >
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Trust Rating (Click to view)</div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-lg font-black">
                    {profile.rating && profile.rating > 0 ? profile.rating.toFixed(1) : 'No ratings'}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({profile.totalReviews || 0})
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed Deals</div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <span className="text-lg font-black">{profile.ordersCompleted || 0}</span>
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
                  <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", profile.lastActiveAt ? "bg-emerald-500" : "bg-gray-300")} />
                  <span className="text-lg font-black">{getOnlineStatus(profile.lastActiveAt)}</span>
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
                  { label: 'Orders Completed', value: `${profile.ordersCompleted || 0}`, color: 'from-indigo-500 to-blue-500', isCount: true },
                  { 
                    label: 'Satisfaction', 
                    value: profile.rating && profile.rating > 0 ? `${profile.rating.toFixed(1)}/5 (${profile.totalReviews || 0} reviews)` : 'No ratings', 
                    color: 'from-amber-500 to-orange-500',
                    isClickable: true
                  }
                ].map((stat, i) => (
                  <div 
                    key={i}
                    className={cn(stat.isClickable ? "cursor-pointer group hover:opacity-80 transition-all" : "")}
                    onClick={() => stat.isClickable && setIsReviewsOpen(true)}
                  >
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className={cn("text-gray-400 uppercase tracking-wide", stat.isClickable ? "group-hover:text-indigo-600 transition-colors" : "")}>{stat.label}</span>
                      <span className="text-gray-900">{stat.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r", stat.color)} style={{ width: (stat as any).isCount ? '100%' : (stat.value.includes('%') ? stat.value : (profile.rating && profile.rating > 0 ? `${(profile.rating / 5) * 100}%` : '0%')) }} />
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
