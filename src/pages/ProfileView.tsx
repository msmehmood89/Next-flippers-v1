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
  BarChart3, FileText
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProfileAvatar from '../components/ProfileAvatar';

export default function ProfileView() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'buyer' | 'seller' | 'freelancer'>('profile');

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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <div className="font-mono text-indigo-500 text-sm animate-pulse">INITIALIZING SECURE CONNECTION...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Access Denied</h1>
          <p className="text-gray-400 font-mono text-sm">Target user profile not found in the database. The user may have been deleted or the link is incorrect.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'IDENTITY', icon: Cpu },
    { id: 'buyer', label: 'BUYER INTEL', icon: ShoppingBag },
    { id: 'seller', label: 'SELLER ASSETS', icon: Globe },
    { id: 'freelancer', label: 'OPERATIVE GIGS', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white pt-24 pb-20 selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Cinematic Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-[#121216] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 mb-12"
        >
          {/* Top Bar */}
          <div className="h-12 bg-white/5 border-b border-white/5 flex items-center justify-between px-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
              <span className="ml-4 font-mono text-[10px] text-white/30 tracking-widest uppercase">Secure Profile Access // UID: {profile.uid.slice(0, 8)}</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] text-indigo-400">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>STATUS: {profile.status.toUpperCase()}</span>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              {/* Profile Image Section */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-48 h-48 rounded-[2rem] overflow-hidden border-2 border-white/10 p-2 bg-white/5">
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                    <ProfileAvatar src={profile.photoURL} gender={profile.gender} size="full" />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center border-4 border-[#121216] shadow-xl">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Identity Info */}
              <div className="flex-grow space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                      {profile.role}
                    </span>
                    <span className="font-mono text-[10px] text-white/20">ESTABLISHED: {profile.createdAt.toDate().toLocaleDateString()}</span>
                  </div>
                  <h1 className="text-5xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
                    {profile.name}
                  </h1>
                  <p className="text-indigo-400 font-mono text-lg">@{profile.username}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Location</span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      {profile.country || 'Unknown'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Rating</span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {profile.rating || '5.0'} ({profile.totalReviews || 0})
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Activity</span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <div className={cn("w-2 h-2 rounded-full", profile.lastActiveAt ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-gray-500")} />
                      {getOnlineStatus(profile.lastActiveAt)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Completed</span>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      {profile.ordersCompleted || 0} Orders
                    </div>
                  </div>
                </div>

                {/* Categorized Ratings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/5">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group/stat hover:bg-white/10 transition-all cursor-default">
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1 group-hover/stat:text-white/40 font-black">Seller Rating</div>
                    <div className="flex items-center gap-2">
                       <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                       <span className="text-sm font-black">{profile.sellerRating ? profile.sellerRating.toFixed(1) : '—'}</span>
                       <span className="text-[10px] text-white/30 truncate ml-auto">{profile.sellerReviews || 0} reviews</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group/stat hover:bg-white/10 transition-all cursor-default">
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1 group-hover/stat:text-white/40 font-black">Buyer Rating</div>
                    <div className="flex items-center gap-2">
                       <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                       <span className="text-sm font-black">{profile.buyerRating ? profile.buyerRating.toFixed(1) : '—'}</span>
                       <span className="text-[10px] text-white/30 truncate ml-auto">{profile.buyerReviews || 0} reviews</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group/stat hover:bg-white/10 transition-all cursor-default">
                    <div className="text-[8px] font-mono text-white/20 uppercase tracking-widest mb-1 group-hover/stat:text-white/40 font-black">Freelancer Rating</div>
                    <div className="flex items-center gap-2">
                       <Star className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                       <span className="text-sm font-black">{profile.freelancerRating ? profile.freelancerRating.toFixed(1) : '—'}</span>
                       <span className="text-[10px] text-white/30 truncate ml-auto">{profile.freelancerReviews || 0} reviews</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => navigate(`/chat?userId=${profile.uid}`)}
                    className="px-8 py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    INITIATE CONTACT
                  </button>
                  <button 
                    onClick={() => navigate(`/statistics/${profile.uid}`)}
                    className="px-8 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    VIEW STATISTICS
                  </button>
                  <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-sm hover:bg-white/10 transition-all flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    SHARE
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="bg-white/[0.02] border-t border-white/5 px-12 py-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Total Sales</div>
              <div className="text-xl font-black text-white">{formatCurrency(profile.totalSales || 0)}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Purchases</div>
              <div className="text-xl font-black text-white">{formatCurrency(profile.totalPurchases || 0)}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Response Time</div>
              <div className="text-xl font-black text-indigo-400">{profile.responseTime || 'Under 1h'}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Member Level</div>
              <div className="text-xl font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Elite
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-indigo-500" />
                      BIOGRAPHY & INTEL
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-mono text-sm">
                      {profile.bio || 'No biography data available for this operative.'}
                    </p>
                  </section>

                  <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Award className="w-4 h-4 text-indigo-500" />
                      EXPERIENCE & BACKGROUND
                    </h3>
                    <p className="text-gray-400 leading-relaxed font-mono text-sm">
                      {profile.experience || 'No experience data recorded.'}
                    </p>
                  </section>
                </div>

                <div className="space-y-8">
                  <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      SKILL SET
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills && profile.skills.length > 0 ? profile.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-indigo-400">
                          {skill}
                        </span>
                      )) : (
                        <span className="text-gray-500 font-mono text-xs italic">No skills listed.</span>
                      )}
                    </div>
                  </section>

                  <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      LOCATION DATA
                    </h3>
                    <div className="space-y-4 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-white/30">COUNTRY:</span>
                        <span className="text-white">{profile.country || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/30">ADDRESS:</span>
                        <span className="text-white text-right max-w-[150px] truncate">
                          {profile.privacySettings?.showAddress ? profile.address : 'ENCRYPTED'}
                        </span>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}

            {activeTab === 'buyer' && (
              <div className="space-y-8">
                <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-indigo-500" />
                    BUYING INTERESTS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Primary Interest</span>
                      <div className="text-lg font-black text-white">{profile.mainBusiness || 'Not specified'}</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Looking to Acquire</span>
                      <div className="text-lg font-black text-white">{profile.lookingFor || 'Not specified'}</div>
                    </div>
                  </div>
                </section>

                <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    BUYING HISTORY
                  </h3>
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                    <Lock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-white/30 font-mono text-xs">TRANSACTION HISTORY IS PRIVATE AND ENCRYPTED</p>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'seller' && (
              <div className="space-y-8">
                <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    ACTIVE LISTINGS
                  </h3>
                  {listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map(listing => (
                        <Link 
                          key={listing.id} 
                          to={`/listing/${listing.id}`}
                          className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all"
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white">
                              {formatCurrency(listing.askingPrice)}
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-sm text-white line-clamp-1 mb-2">{listing.title}</h4>
                            <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
                              <span>{listing.category}</span>
                              <span className="text-indigo-400">VIEW ASSET</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-white/30 font-mono text-xs">NO ACTIVE ASSETS FOUND FOR THIS OPERATIVE</p>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'freelancer' && (
              <div className="space-y-8">
                <section className="bg-[#121216] border border-white/5 rounded-[2rem] p-8">
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                    SERVICE GIGS
                  </h3>
                  {gigs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs.map(gig => (
                        <Link 
                          key={gig.id} 
                          to={`/gig/${gig.id}`}
                          className="group bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all"
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img src={gig.images[0]} alt={gig.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white">
                              FROM {formatCurrency(gig.price)}
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-bold text-sm text-white line-clamp-1 mb-2">{gig.title}</h4>
                            <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
                              <span>{gig.category}</span>
                              <span className="text-indigo-400">VIEW GIG</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-white/30 font-mono text-xs">NO ACTIVE GIGS FOUND FOR THIS OPERATIVE</p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
