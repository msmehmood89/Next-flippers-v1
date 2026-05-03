import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, UserProfile } from '../types';
import { 
  Search, Filter, LayoutGrid, List, 
  ChevronDown, ArrowUpRight, Globe, 
  BarChart3, Clock, DollarSign, X,
  AlertCircle, SlidersHorizontal, Star, Briefcase, Gamepad2, Video, Music2,
  Instagram, Facebook, Twitter, AtSign, Package, Smartphone
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import FavoriteButton from '../components/FavoriteButton';

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellers, setSellers] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [platform, setPlatform] = useState(searchParams.get('platform') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'listings'),
          where('status', '==', 'approved')
        );

        if (sortBy === 'newest') q = query(q, orderBy('createdAt', 'desc'));
        if (sortBy === 'price_asc') q = query(q, orderBy('askingPrice', 'asc'));
        if (sortBy === 'price_desc') q = query(q, orderBy('askingPrice', 'desc'));

        const snapshot = await getDocs(q);
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));

        // Client-side filtering for complex queries
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(l => 
            l.title.toLowerCase().includes(s) || 
            l.description.toLowerCase().includes(s) ||
            l.url.toLowerCase().includes(s)
          );
        }

        if (type !== 'all') {
          results = results.filter(l => l.type === type);
        }

        if (category !== 'all') {
          results = results.filter(l => l.category === category);
        }

        if (platform !== 'all') {
          results = results.filter(l => l.platform === platform);
        }

        if (minPrice) {
          results = results.filter(l => l.askingPrice >= parseInt(minPrice));
        }

        if (maxPrice) {
          results = results.filter(l => l.askingPrice <= parseInt(maxPrice));
        }

        setListings(results);

        // Fetch seller data for online status
        const sellerIds = [...new Set(results.map(l => l.userId))];
        if (sellerIds.length > 0) {
          const sellersData: Record<string, UserProfile> = {};
          // Firestore 'in' query limit is 10, so we might need to chunk if there are many sellers
          // For now, let's just fetch them
          const usersRef = collection(db, 'users');
          const sellersSnap = await getDocs(query(usersRef, where('__name__', 'in', sellerIds.slice(0, 10))));
          sellersSnap.docs.forEach(doc => {
            sellersData[doc.id] = { uid: doc.id, ...doc.data() } as UserProfile;
          });
          setSellers(sellersData);
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [search, type, category, minPrice, maxPrice, platform, sortBy]);

  const types = [
    { id: 'all', label: 'All Listings', icon: LayoutGrid },
    { id: 'website', label: 'Websites', icon: Globe },
    { id: 'youtube', label: 'YouTube Channels', icon: ArrowUpRight },
    { id: 'tiktok', label: 'TikTok Accounts', icon: Video },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
    { id: 'facebook', label: 'Facebook', icon: Facebook },
    { id: 'twitter', label: 'Twitter (X)', icon: Twitter },
    { id: 'threads', label: 'Threads', icon: AtSign },
    { id: 'theme_plugin', label: 'Themes & Plugins', icon: Package },
    { id: 'mobile_app', label: 'Mobile Apps', icon: Smartphone },
    { id: 'games', label: 'Games & Assets', icon: Gamepad2 },
    { id: 'group_buy', icon: SlidersHorizontal, label: 'Group Buy Tools' },
    { id: 'premium_tool', icon: Star, label: 'Premium Tools' },
    { id: 'other_service', icon: Briefcase, label: 'Other Services' },
  ];

  const websiteCategories = ['AdSense Approved', 'E-commerce', 'SaaS', 'Content/Blog', 'Marketplace', 'Service', 'Other'];
  const youtubeCategories = ['Monetized', 'Gaming', 'Tech', 'Vlogs', 'Education', 'Entertainment', 'Finance', 'Shorts', 'Other'];
  const tiktokCategories = ['Entertainment', 'Lifestyle', 'Gaming', 'Educational', 'Business', 'Fashion', 'Comedy', 'Other'];
  const instagramCategories = ['Fitness', 'Fashion', 'Travel', 'Motivation', 'Business', 'Pet/Animals', 'Gaming', 'Other'];
  const facebookCategories = ['Fan Page', 'Business Page', 'Private Group', 'Public Group', 'Advertising Account', 'Other'];
  const twitterCategories = ['Tech/Crypto', 'News/Politics', 'Comedy', 'Motivation', 'Aged Profile', 'Other'];
  const themeCategories = ['WordPress Theme', 'WordPress Plugin', 'Shopify App', 'Shopify Theme', 'HTML/Template', 'SaaS Code', 'Other'];
  const appCategories = ['Utility App', 'Mobile Game', 'Social/Chat', 'E-commerce App', 'Education App', 'Source Code Only', 'Other'];
  const gameCategories = ['FPS Games', 'RPG/MMORPG', 'Sports Games', 'Mobile Games', 'Strategy', 'In-Game Items', 'Other'];
  const toolCategories = ['SEO Tools', 'AI/Writing', 'Design/Video', 'Marketing', 'Development', 'Streaming', 'Other'];
  const otherCategories = ['Social Media Services', 'Watch Time/Views', 'Subscribers', 'Backlinks', 'Content Writing', 'Other'];
  
  const categories = type === 'website' ? websiteCategories : 
                   type === 'youtube' ? youtubeCategories :
                   type === 'tiktok' ? tiktokCategories :
                   type === 'instagram' ? instagramCategories :
                   type === 'facebook' ? facebookCategories :
                   type === 'twitter' ? twitterCategories :
                   type === 'theme_plugin' ? themeCategories :
                   type === 'mobile_app' ? appCategories :
                   type === 'games' ? gameCategories :
                   (type === 'group_buy' || type === 'premium_tool') ? toolCategories :
                   type === 'other_service' ? otherCategories :
                   [...new Set([...websiteCategories, ...youtubeCategories, ...tiktokCategories, ...instagramCategories, ...facebookCategories, ...twitterCategories, ...themeCategories, ...appCategories, ...gameCategories, ...toolCategories, ...otherCategories])];

  const platforms = type === 'website' ? ['Shopify', 'WordPress', 'Amazon FBA', 'Custom', 'Other'] :
                   type === 'youtube' ? ['YouTube'] :
                   type === 'tiktok' ? ['TikTok'] :
                   type === 'instagram' ? ['Instagram'] :
                   type === 'facebook' ? ['Facebook'] :
                   type === 'twitter' ? ['Twitter/X'] :
                   type === 'threads' ? ['Threads'] :
                   type === 'theme_plugin' ? ['WordPress', 'Shopify', 'Codecanyon', 'Custom', 'Other'] :
                   type === 'mobile_app' ? ['Android', 'iOS', 'Cross-platform', 'Other'] :
                   type === 'games' ? ['Steam', 'PlayStation', 'Xbox', 'Mobile', 'Epic Games', 'Riot Games', 'Battle.net', 'Other'] :
                   ['Web-based', 'Desktop', 'Mobile', 'Other'];

  const clearFilters = () => {
    setSearch('');
    setType('all');
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setPlatform('all');
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Marketplace</h1>
              <p className="text-gray-500">Discover profitable digital assets verified by our team.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:text-indigo-600")}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-gray-400 hover:text-indigo-600")}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm font-bold text-sm text-gray-600"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* New Prominent Search Bar */}
          <div className="bg-white p-4 rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-grow relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for websites, accounts, tools or assets..."
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <select
                  className="px-6 py-4 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-gray-700 cursor-pointer"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <Link
                  to="/dashboard/listings/new"
                  className="hidden sm:flex bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 items-center gap-2 whitespace-nowrap"
                >
                  <Package className="w-5 h-5" />
                  Sell Asset
                </Link>
              </div>
            </div>
          </div>

          {/* Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {types.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setType(t.id);
                  setCategory('all');
                  setPlatform('all');
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black whitespace-nowrap transition-all border",
                  type === t.id 
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105" 
                    : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600"
                )}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar Filters */}
          <aside className={cn(
            "lg:block space-y-8",
            isFilterOpen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : "hidden"
          )}>
            <div className="flex items-center justify-between lg:hidden mb-8">
              <h2 className="text-xl font-black text-gray-900">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price Range</label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Platform */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Platform</label>
              <div className="space-y-2">
                {['all', ...platforms].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-lg text-sm transition-all",
                      platform === p ? "bg-indigo-50 text-indigo-600 font-bold" : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {p === 'all' ? 'All Platforms' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sort By</label>
              <select 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <button 
              onClick={clearFilters}
              className="w-full py-4 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              Clear All Filters
            </button>
          </aside>

          {/* Listings Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white rounded-[3rem] p-20 text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-gray-200" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">No listings found</h2>
                <p className="text-gray-500 mb-8">Try adjusting your filters or search query.</p>
                <button onClick={clearFilters} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={cn(
                "grid gap-8",
                viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              )}>
                {listings.map(listing => (
                  <motion.div
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    className={cn(
                      "group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 cursor-pointer",
                      viewMode === 'list' && "flex flex-col md:flex-row"
                    )}
                    onClick={() => navigate(`/listing/${listing.id}`)}
                  >
                    <div className={cn(
                      "relative overflow-hidden bg-gray-100 block",
                      viewMode === 'grid' ? "aspect-[4/3]" : "w-full md:w-80 aspect-[4/3] md:aspect-square"
                    )}>
                      <img
                        src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/800/600`}
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                        <span className={cn(
                          "px-4 py-1.5 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2",
                          listing.type === 'website' ? "bg-indigo-600 text-white" :
                          listing.type === 'youtube' ? "bg-red-600 text-white" :
                          listing.type === 'tiktok' ? "bg-pink-600 text-white" :
                          listing.type === 'instagram' ? "bg-purple-600 text-white" :
                          listing.type === 'facebook' ? "bg-blue-600 text-white" :
                          listing.type === 'twitter' ? "bg-sky-600 text-white" :
                          listing.type === 'theme_plugin' ? "bg-emerald-600 text-white" :
                          listing.type === 'mobile_app' ? "bg-violet-600 text-white" :
                          listing.type === 'games' ? "bg-rose-600 text-white" :
                          listing.type === 'group_buy' ? "bg-amber-600 text-white" :
                          listing.type === 'premium_tool' ? "bg-purple-600 text-white" : "bg-teal-600 text-white"
                        )}>
                          {listing.type === 'website' ? <Globe className="w-3 h-3" /> :
                           listing.type === 'youtube' ? <Video className="w-3 h-3" /> :
                           listing.type === 'tiktok' ? <Music2 className="w-3 h-3" /> :
                           listing.type === 'instagram' ? <Instagram className="w-3 h-3" /> :
                           listing.type === 'facebook' ? <Facebook className="w-3 h-3" /> :
                           listing.type === 'twitter' ? <Twitter className="w-3 h-3" /> :
                           listing.type === 'theme_plugin' ? <Package className="w-3 h-3" /> :
                           listing.type === 'mobile_app' ? <Smartphone className="w-3 h-3" /> :
                           listing.type === 'games' ? <Gamepad2 className="w-3 h-3" /> :
                           listing.type === 'group_buy' ? <SlidersHorizontal className="w-3 h-3" /> :
                           listing.type === 'premium_tool' ? <Star className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                          {listing.type?.replace('_', ' ').toUpperCase() || 'WEBSITE'}
                        </span>
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm">
                          {listing.category}
                        </span>
                      </div>
                      <div className="absolute top-6 right-6">
                        <FavoriteButton itemId={listing.id} />
                      </div>
                    </div>

                    <div className="p-8 flex-grow flex flex-col">
                      <div className="flex-grow">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                            {listing.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">
                          {listing.type === 'website' ? <Globe className="w-3 h-3" /> : 
                           listing.type === 'youtube' ? <ArrowUpRight className="w-3 h-3" /> : 
                           listing.type === 'instagram' ? <Instagram className="w-3 h-3" /> :
                           listing.type === 'facebook' ? <Facebook className="w-3 h-3" /> :
                           listing.type === 'twitter' ? <Twitter className="w-3 h-3" /> :
                           listing.type === 'theme_plugin' ? <Package className="w-3 h-3" /> :
                           listing.type === 'mobile_app' ? <Smartphone className="w-3 h-3" /> :
                           listing.type === 'tiktok' ? <Video className="w-3 h-3" /> : 
                           listing.type === 'games' ? <Gamepad2 className="w-3 h-3" /> :
                           listing.type === 'other_service' ? <Briefcase className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                          {listing.url ? listing.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : (listing.platform || 'General')}
                          <div className="h-3 w-px bg-gray-200 mx-1" />
                          <div className={cn("w-1.5 h-1.5 rounded-full", sellers[listing.userId]?.lastActiveAt ? "bg-green-500" : "bg-gray-300")} />
                          <span className="text-[10px] text-gray-400">{getOnlineStatus(sellers[listing.userId]?.lastActiveAt)}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="p-5 bg-gray-50 rounded-3xl group-hover:bg-indigo-50/50 transition-colors">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                              {listing.type === 'youtube' ? 'Subscribers' : 
                               (listing.type === 'tiktok' || listing.type === 'instagram' || listing.type === 'facebook' || listing.type === 'twitter' || listing.type === 'threads') ? 'Followers' : 
                               listing.type === 'games' ? 'Account Level' :
                               (listing.type === 'group_buy' || listing.type === 'premium_tool') ? 'Account Type' : 'Monthly Profit'}
                            </div>
                            <div className="text-xl font-black text-gray-900">
                              {listing.type === 'youtube' ? (listing.subscribers?.toLocaleString() || '0') : 
                               (listing.type === 'tiktok' || listing.type === 'instagram' || listing.type === 'facebook' || listing.type === 'twitter' || listing.type === 'threads') ? (listing.followers?.toLocaleString() || '0') : 
                               listing.type === 'games' ? (listing.gameLevel || 'N/A') :
                               (listing.type === 'group_buy' || listing.type === 'premium_tool') ? (listing.accountType || 'Premium') :
                               listing.type === 'other_service' ? 'Service' : formatCurrency(listing.monthlyProfit || 0)}
                            </div>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-3xl group-hover:bg-indigo-50/50 transition-colors">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Asking Price</div>
                            <div className="text-xl font-black text-indigo-600">{formatCurrency(listing.askingPrice)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {listing.type === 'youtube' ? 'Watch Time' : 
                               (listing.type === 'tiktok' || listing.type === 'instagram' || listing.type === 'facebook' || listing.type === 'twitter' || listing.type === 'threads') ? 'Likes/Reach' : 
                               listing.type === 'games' ? 'Platform' :
                               (listing.type === 'group_buy' || listing.type === 'premium_tool') ? 'Validity' : 
                               listing.type === 'other_service' ? 'Category' : 'Traffic'}
                            </span>
                            <div className="flex items-center gap-1.5 text-sm font-black text-gray-900">
                              {listing.type === 'youtube' ? (
                                <>
                                  <Clock className="w-4 h-4 text-indigo-600" />
                                  {listing.watchTime && listing.watchTime >= 1000 ? `${(listing.watchTime / 1000).toFixed(1)}k` : listing.watchTime || 0}h
                                </>
                              ) : (listing.type === 'tiktok' || listing.type === 'instagram' || listing.type === 'facebook' || listing.type === 'twitter' || listing.type === 'threads') ? (
                                <>
                                  <Star className="w-4 h-4 text-indigo-600" />
                                  {listing.totalLikes && listing.totalLikes >= 1000000 ? `${(listing.totalLikes / 1000000).toFixed(1)}M` : listing.totalLikes && listing.totalLikes >= 1000 ? `${(listing.totalLikes / 1000).toFixed(1)}k` : listing.totalLikes || 0}
                                </>
                              ) : listing.type === 'games' ? (
                                <>
                                  <Gamepad2 className="w-4 h-4 text-indigo-600" />
                                  {listing.platform}
                                </>
                              ) : (listing.type === 'group_buy' || listing.type === 'premium_tool') ? (
                                <>
                                  <Star className="w-4 h-4 text-indigo-600" />
                                  {listing.validityPeriod || 'Lifetime'}
                                </>
                              ) : listing.type === 'other_service' ? (
                                <>
                                  <Briefcase className="w-4 h-4 text-indigo-600" />
                                  {listing.category}
                                </>
                              ) : (
                                <>
                                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                                  {listing.monthlyTraffic && listing.monthlyTraffic >= 1000 ? `${(listing.monthlyTraffic / 1000).toFixed(1)}k` : listing.monthlyTraffic || 0}
                                </>
                              )}
                            </div>
                          </div>
                          {(listing.type === 'website' || !listing.type) && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Age</span>
                              <div className="flex items-center gap-1.5 text-sm font-black text-gray-900">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                {listing.siteAge}y
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:scale-110 transition-all shadow-xl shadow-gray-200 group-hover:shadow-indigo-200">
                          <ArrowUpRight className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
