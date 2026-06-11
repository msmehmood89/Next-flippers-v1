import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Listing } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, DollarSign, TrendingUp, Users, Calendar, 
  Layout, FileText, CheckCircle2, ArrowRight, Save, Image as ImageIcon, X, PlusCircle, AlertCircle, Briefcase, Gamepad2, MessageSquare,
  Instagram, Facebook, Twitter, AtSign, Package, Smartphone, Code
} from 'lucide-react';
import { cn, handleFirestoreError, OperationType, resizeImage } from '../../lib/utils';

const LISTING_TYPES = [
  { id: 'website', name: 'Website', icon: Globe, description: 'Sell your SaaS, E-commerce, or Content site' },
  { id: 'youtube', name: 'YouTube Channel', icon: ArrowRight, description: 'Sell channels, watch time, or subscribers' },
  { id: 'tiktok', name: 'TikTok Account', icon: MessageSquare, description: 'Sell TikTok profiles, likes, or growth' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, description: 'Instagram accounts, pages, or theme pages' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, description: 'Facebook pages, groups, or accounts' },
  { id: 'twitter', name: 'Twitter (X)', icon: Twitter, description: 'Twitter/X handles and aged accounts' },
  { id: 'threads', name: 'Threads', icon: AtSign, description: 'Meta Threads profiles and growth' },
  { id: 'theme_plugin', name: 'Themes/Plugins', icon: Package, description: 'WordPress, Shopify themes or custom plugins' },
  { id: 'mobile_app', name: 'Mobile Apps', icon: Smartphone, description: 'Android/iOS apps, source code or accounts' },
  { id: 'games', name: 'Games & Assets', icon: Gamepad2, description: 'Game IDs, skins, items, or currency' },
  { id: 'group_buy', name: 'Group Buy Tools', icon: Layout, description: 'Multiple tools package (e.g. SEO Bundle)' },
  { id: 'premium_tool', name: 'Premium Tools', icon: Save, description: 'Single pro account (e.g. ChatGPT Plus)' },
  { id: 'other_service', name: 'Other Services', icon: Briefcase, description: 'Social media, backlinks, content, etc.' },
];

const WEBSITE_CATEGORIES = ['AdSense Approved', 'E-commerce', 'SaaS', 'Content/Blog', 'Marketplace', 'Service', 'Other'];
const YOUTUBE_CATEGORIES = ['Monetized', 'Gaming', 'Tech', 'Vlogs', 'Education', 'Entertainment', 'Finance', 'Shorts', 'Other'];
const TIKTOK_CATEGORIES = ['Entertainment', 'Lifestyle', 'Gaming', 'Educational', 'Business', 'Fashion', 'Comedy', 'Other'];
const INSTAGRAM_CATEGORIES = ['Fitness', 'Fashion', 'Travel', 'Motivation', 'Business', 'Pet/Animals', 'Gaming', 'Other'];
const FACEBOOK_CATEGORIES = ['Fan Page', 'Business Page', 'Private Group', 'Public Group', 'Advertising Account', 'Other'];
const TWITTER_CATEGORIES = ['Tech/Crypto', 'News/Politics', 'Comedy', 'Motivation', 'Aged Profile', 'Other'];
const THREADS_CATEGORIES = ['Business', 'Personal Brand', 'Entertainment', 'Community', 'Other'];
const THEME_CATEGORIES = ['WordPress Theme', 'WordPress Plugin', 'Shopify App', 'Shopify Theme', 'HTML/Template', 'SaaS Code', 'Other'];
const APP_CATEGORIES = ['Utility App', 'Mobile Game', 'Social/Chat', 'E-commerce App', 'Education App', 'Source Code Only', 'Other'];
const GAME_CATEGORIES = ['FPS Games', 'RPG/MMORPG', 'Sports Games', 'Mobile Games', 'Strategy', 'In-Game Items', 'Other'];
const TOOL_CATEGORIES = ['SEO Tools', 'AI/Writing', 'Design/Video', 'Marketing', 'Development', 'Streaming', 'Other'];
const OTHER_CATEGORIES = ['Social Media Services', 'Watch Time/Views', 'Subscribers', 'Backlinks', 'Content Writing', 'Other'];

const PLATFORMS = {
  website: ['WordPress', 'Shopify', 'Custom', 'React', 'Next.js', 'PHP', 'Other'],
  youtube: ['YouTube'],
  tiktok: ['TikTok'],
  instagram: ['Instagram'],
  facebook: ['Facebook'],
  twitter: ['Twitter/X'],
  threads: ['Threads'],
  theme_plugin: ['WordPress', 'Shopify', 'Codecanyon', 'Custom', 'Other'],
  mobile_app: ['Android (Play Store)', 'iOS (App Store)', 'Huawei AppGallery', 'Cross-platform', 'Other'],
  games: ['Steam', 'PlayStation', 'Xbox', 'Mobile', 'Epic Games', 'Riot Games', 'Battle.net', 'Other'],
  tools: ['Web-based', 'Desktop', 'Mobile', 'Other'],
  other: ['Service-based', 'Other']
};

export default function CreateListing() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    type: 'website' as 'website' | 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'threads' | 'theme_plugin' | 'mobile_app' | 'games' | 'group_buy' | 'premium_tool' | 'other_service',
    url: '',
    description: '',
    category: 'E-commerce',
    platform: 'WordPress',
    
    // Website specific
    monthlyRevenue: 0,
    monthlyProfit: 0,
    monthlyTraffic: 0,
    siteAge: 0,
    
    // YouTube specific
    subscribers: 0,
    watchTime: 0,
    isMonetized: false,

    // TikTok specific
    followers: 0,
    totalLikes: 0,
    
    // Games specific
    gameLevel: '',
    inGameCurrency: '',
    isFullAccess: true,

    // Tools specific
    toolType: '',
    validityPeriod: '1 Month',
    accountType: 'Shared',
    
    askingPrice: 0,
    includedAssets: [] as string[],
    images: [] as string[],
    salesType: 'single' as 'single' | 'limited' | 'unlimited',
    quantity: 1,
  });

  useEffect(() => {
    if (id) {
      const fetchListing = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'listings', id));
          if (docSnap.exists()) {
            const data = docSnap.data() as Listing;
            if (data.userId !== user?.uid) {
              navigate('/dashboard/listings');
              return;
            }
              setFormData({
                title: data.title,
                type: data.type || 'website',
                url: data.url || '',
                description: data.description,
                category: data.category,
                platform: data.platform || '',
                monthlyRevenue: data.monthlyRevenue || 0,
                monthlyProfit: data.monthlyProfit || 0,
                monthlyTraffic: data.monthlyTraffic || 0,
                siteAge: data.siteAge || 0,
                subscribers: data.subscribers || 0,
                followers: data.followers || 0,
                totalLikes: data.totalLikes || 0,
                watchTime: data.watchTime || 0,
                isMonetized: data.isMonetized || false,
                gameLevel: (data as any).gameLevel || '',
                inGameCurrency: (data as any).inGameCurrency || '',
                isFullAccess: (data as any).isFullAccess ?? true,
                toolType: data.toolType || '',
                validityPeriod: data.validityPeriod || '1 Month',
                accountType: data.accountType || 'Shared',
                askingPrice: data.askingPrice,
                includedAssets: data.includedAssets,
                images: data.images,
                salesType: data.salesType || 'single',
                quantity: data.quantity || 1,
              });
          }
        } catch (error) {
          console.error('Error fetching listing for edit:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchListing();
    }
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.images.length === 0) {
      alert('Please add at least one screenshot of your website.');
      return;
    }

    setLoading(true);

    try {
      const listingData = {
        ...formData,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (id) {
        try {
          await updateDoc(doc(db, 'listings', id), listingData);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `listings/${id}`);
        }
      } else {
        try {
          await addDoc(collection(db, 'listings'), {
            ...listingData,
            views: 0,
            createdAt: serverTimestamp(),
            status: 'pending',
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'listings');
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/listings');
      }, 3000);
    } catch (error) {
      console.error('Error saving listing:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && formData.images.length < 5) {
      try {
        const resizedBase64 = await resizeImage(file);
        setFormData(prev => ({ ...prev, images: [...prev.images, resizedBase64] }));
      } catch (error) {
        console.error('Error resizing image:', error);
        alert('Failed to process image. Please try another one.');
      }
    }
  };

  if (fetching) return <div className="p-20 text-center">Loading listing data...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{id ? 'Edit Listing' : 'Create New Listing'}</h1>
        <p className="text-gray-500">Provide accurate details to attract serious buyers.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Type Selection */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            Listing Type
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LISTING_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  const newCategory = t.id === 'website' ? WEBSITE_CATEGORIES[0] : 
                                     t.id === 'youtube' ? YOUTUBE_CATEGORIES[0] : 
                                     t.id === 'tiktok' ? TIKTOK_CATEGORIES[0] : 
                                     t.id === 'instagram' ? INSTAGRAM_CATEGORIES[0] :
                                     t.id === 'facebook' ? FACEBOOK_CATEGORIES[0] :
                                     t.id === 'twitter' ? TWITTER_CATEGORIES[0] :
                                     t.id === 'threads' ? THREADS_CATEGORIES[0] :
                                     t.id === 'theme_plugin' ? THEME_CATEGORIES[0] :
                                     t.id === 'mobile_app' ? APP_CATEGORIES[0] :
                                     t.id === 'games' ? GAME_CATEGORIES[0] :
                                     t.id === 'other_service' ? OTHER_CATEGORIES[0] : TOOL_CATEGORIES[0];
                  const newPlatform = t.id === 'website' ? PLATFORMS.website[0] : 
                                     t.id === 'youtube' ? PLATFORMS.youtube[0] : 
                                     t.id === 'tiktok' ? PLATFORMS.tiktok[0] : 
                                     t.id === 'instagram' ? PLATFORMS.instagram[0] :
                                     t.id === 'facebook' ? PLATFORMS.facebook[0] :
                                     t.id === 'twitter' ? PLATFORMS.twitter[0] :
                                     t.id === 'threads' ? PLATFORMS.threads[0] :
                                     t.id === 'theme_plugin' ? PLATFORMS.theme_plugin[0] :
                                     t.id === 'mobile_app' ? PLATFORMS.mobile_app[0] :
                                     t.id === 'games' ? PLATFORMS.games[0] :
                                     t.id === 'other_service' ? PLATFORMS.other[0] : PLATFORMS.tools[0];
                  
                  setFormData({ 
                    ...formData, 
                    type: t.id as any,
                    category: newCategory,
                    platform: newPlatform
                  });
                }}
                className={cn(
                  "flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all",
                  formData.type === t.id 
                    ? "border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100" 
                    : "border-gray-100 hover:border-indigo-200"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  formData.type === t.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400"
                )}>
                  <t.icon className="w-6 h-6" />
                </div>
                <div className="font-black text-sm text-gray-900 mb-1">{t.name}</div>
                <div className="text-[10px] text-gray-400 font-bold leading-tight">{t.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            {formData.type === 'website' ? 'Website Details' : 
             formData.type === 'youtube' ? 'YouTube Details' : 
             formData.type === 'tiktok' ? 'TikTok Details' : 
             formData.type === 'instagram' ? 'Instagram Details' :
             formData.type === 'facebook' ? 'Facebook Details' :
             formData.type === 'twitter' ? 'Twitter Details' :
             formData.type === 'threads' ? 'Threads Details' :
             formData.type === 'theme_plugin' ? 'Theme/Plugin Details' :
             formData.type === 'mobile_app' ? 'Mobile App Details' :
             formData.type === 'games' ? 'Game/Asset Details' : 'Listing Details'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Listing Title</label>
              <input
                type="text"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder={
                  formData.type === 'website' ? "e.g. High Traffic Tech News Blog with AdSense" : 
                  formData.type === 'youtube' ? "e.g. Monetized Gaming Channel - 50k Subs" : 
                  formData.type === 'tiktok' ? 'TikTok Account - 100k Followers' : 
                  formData.type === 'instagram' ? 'Instagram Fashion Page - 250k Active Followers' :
                  formData.type === 'facebook' ? 'Facebook Monetized Group - 1M Members' :
                  formData.type === 'twitter' ? 'Aged Twitter Account (2014) - Rare Username' :
                  formData.type === 'theme_plugin' ? 'Premium Multi-Vendor WordPress Plugin' :
                  formData.type === 'mobile_app' ? 'Fitness Tracker App (Source Code + Store Presence)' :
                  formData.type === 'games' ? 'Master Rank Valorant Account with Rare Skins' : 
                  formData.type === 'premium_tool' ? "e.g. Ahrefs Standard Account - 6 Months" : "e.g. Professional Premium Services"
                }
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {formData.type === 'website' ? 'Website URL' : 
                 formData.type === 'youtube' ? 'Channel URL' : 
                 formData.type === 'tiktok' ? 'TikTok Profile URL' : 
                 formData.type === 'instagram' ? 'Instagram Profile URL' :
                 formData.type === 'facebook' ? 'FB Page/Profile URL' :
                 formData.type === 'twitter' ? 'Twitter/X Profile URL' :
                 formData.type === 'threads' ? 'Threads Profile URL' :
                 formData.type === 'theme_plugin' ? 'Live Demo / Product URL' :
                 formData.type === 'mobile_app' ? 'App Store URL (if any)' :
                 formData.type === 'other_service' ? 'Service URL / Portfolio' : 'Product/Tool URL'}
              </label>
              <input
                type="url"
                required={formData.type === 'website' || formData.type === 'youtube' || formData.type === 'tiktok'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder={
                  formData.type === 'website' ? "https://example.com" : 
                  formData.type === 'youtube' ? "https://youtube.com/@channelname" : 
                  formData.type === 'tiktok' ? "https://tiktok.com/@username" : 
                  formData.type === 'instagram' ? "https://instagram.com/username" :
                  formData.type === 'facebook' ? "https://facebook.com/pagename" :
                  formData.type === 'twitter' ? "https://twitter.com/username" :
                  formData.type === 'threads' ? "https://threads.net/@username" :
                  "https://example.com/product"
                }
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            {(formData.type === 'group_buy' || formData.type === 'premium_tool') && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tool Name / Type</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="e.g. Ahrefs, ChatGPT Plus"
                  value={formData.toolType}
                  onChange={(e) => setFormData({ ...formData, toolType: e.target.value })}
                />
              </div>
            )}

            {formData.type === 'games' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Game Name / Asset</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. Fortnite Account, PUBG Mobile UC"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Account Level (if applicable)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. 75 or Diamond II"
                    value={formData.gameLevel}
                    onChange={(e) => setFormData({ ...formData, gameLevel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">In-Game Currency / Items Included</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. 5000 V-Bucks, Rare Skins"
                    value={formData.inGameCurrency}
                    onChange={(e) => setFormData({ ...formData, inGameCurrency: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="fullAccess"
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    checked={formData.isFullAccess}
                    onChange={(e) => setFormData({ ...formData, isFullAccess: e.target.checked })}
                  />
                  <label htmlFor="fullAccess" className="text-sm font-bold text-gray-700">Full Email Access Included</label>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category / Niche</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {(formData.type === 'website' ? WEBSITE_CATEGORIES : 
                  formData.type === 'youtube' ? YOUTUBE_CATEGORIES : 
                  formData.type === 'tiktok' ? TIKTOK_CATEGORIES : 
                  formData.type === 'instagram' ? INSTAGRAM_CATEGORIES :
                  formData.type === 'facebook' ? FACEBOOK_CATEGORIES :
                  formData.type === 'twitter' ? TWITTER_CATEGORIES :
                  formData.type === 'threads' ? THREADS_CATEGORIES :
                  formData.type === 'theme_plugin' ? THEME_CATEGORIES :
                  formData.type === 'mobile_app' ? APP_CATEGORIES :
                  formData.type === 'games' ? GAME_CATEGORIES :
                  formData.type === 'other_service' ? OTHER_CATEGORIES : TOOL_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Platform</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                {(formData.type === 'website' ? PLATFORMS.website : 
                  formData.type === 'youtube' ? PLATFORMS.youtube : 
                  formData.type === 'tiktok' ? PLATFORMS.tiktok : 
                  formData.type === 'instagram' ? PLATFORMS.instagram :
                  formData.type === 'facebook' ? PLATFORMS.facebook :
                  formData.type === 'twitter' ? PLATFORMS.twitter :
                  formData.type === 'threads' ? PLATFORMS.threads :
                  formData.type === 'theme_plugin' ? PLATFORMS.theme_plugin :
                  formData.type === 'mobile_app' ? PLATFORMS.mobile_app :
                  formData.type === 'games' ? PLATFORMS.games :
                  formData.type === 'other_service' ? PLATFORMS.other : PLATFORMS.tools).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {formData.type === 'website' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Age (Years)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={formData.siteAge}
                  onChange={(e) => setFormData({ ...formData, siteAge: Number(e.target.value) })}
                />
              </div>
            )}

            {formData.type === 'youtube' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subscribers</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. 50000"
                    value={formData.subscribers}
                    onChange={(e) => setFormData({ ...formData, subscribers: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Watch Time (Hours)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. 4000"
                    value={formData.watchTime}
                    onChange={(e) => setFormData({ ...formData, watchTime: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <input
                    type="checkbox"
                    id="monetized"
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    checked={formData.isMonetized}
                    onChange={(e) => setFormData({ ...formData, isMonetized: e.target.checked })}
                  />
                  <label htmlFor="monetized" className="text-sm font-bold text-gray-700">Channel is Monetized</label>
                </div>
              </>
            )}

            {(formData.type === 'tiktok' || formData.type === 'instagram' || formData.type === 'facebook' || formData.type === 'twitter' || formData.type === 'threads') && (
               <>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">
                     {formData.type === 'facebook' ? 'Followers/Members' : 'Followers'}
                   </label>
                   <input
                     type="number"
                     min="0"
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                     placeholder="e.g. 100000"
                     value={formData.followers}
                     onChange={(e) => setFormData({ ...formData, followers: Number(e.target.value) })}
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Total Likes / Reach</label>
                   <input
                     type="number"
                     min="0"
                     className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                     placeholder="e.g. 1500000"
                     value={formData.totalLikes}
                     onChange={(e) => setFormData({ ...formData, totalLikes: Number(e.target.value) })}
                   />
                 </div>
               </>
             )}

            {(formData.type === 'group_buy' || formData.type === 'premium_tool') && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Validity Period</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.validityPeriod}
                    onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
                  >
                    <option value="1 Month">1 Month</option>
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Account Type</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  >
                    <option value="Shared">Shared Account</option>
                    <option value="Private">Private Account</option>
                    <option value="Admin Panel">Admin Panel</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            {formData.type === 'website' ? 'Financials & Traffic' : 'Pricing & Value'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.type === 'website' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Revenue (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="0"
                      value={formData.monthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, monthlyRevenue: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Profit (USD)</label>
                  <div className="relative">
                    <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="0"
                      value={formData.monthlyProfit}
                      onChange={(e) => setFormData({ ...formData, monthlyProfit: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Traffic (Visitors)</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="0"
                      value={formData.monthlyTraffic}
                      onChange={(e) => setFormData({ ...formData, monthlyTraffic: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Asking Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-600" />
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-2xl font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="0"
                  value={formData.askingPrice}
                  onChange={(e) => setFormData({ ...formData, askingPrice: Number(e.target.value) })}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">Set a realistic price based on your revenue and assets.</p>
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Sales Type (Flipping / Stock Mode)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, salesType: 'single', quantity: 1 })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1",
                    formData.salesType === 'single'
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950"
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  )}
                >
                  <span className="text-sm font-bold block">Sell Once (Unique asset)</span>
                  <span className="text-xs text-gray-400">Perfect for unique websites / channels. Shows "SOLD" after purchase.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, salesType: 'limited' })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1",
                    formData.salesType === 'limited'
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950"
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  )}
                >
                  <span className="text-sm font-bold block">Limited Stock</span>
                  <span className="text-xs text-gray-400">Can be sold a specific number of times. Decreases on purchases.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, salesType: 'unlimited', quantity: 999999 })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1",
                    formData.salesType === 'unlimited'
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950"
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  )}
                >
                  <span className="text-sm font-bold block">Unlimited Sales</span>
                  <span className="text-xs text-gray-400">Can be sold unlimited times (such as reusable licenses or software).</span>
                </button>
              </div>

              {formData.salesType === 'limited' && (
                <div className="mt-4 animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Available Quantity (Stock)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Enter available quantity (e.g. 5)"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Description
          </h2>
          <textarea
            required
            rows={8}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
            placeholder={
              formData.type === 'website' ? "Describe your website, how it makes money, daily traffic sources, and why you are selling it..." : 
              formData.type === 'youtube' ? "Describe channel history, audience niche, monthly revenue (if any), and copyright status..." : 
              formData.type === 'tiktok' ? "Describe account engagement, main content niche, follower demographics, and reason for selling..." : 
              formData.type === 'instagram' ? "Describe activity levels, followers growth history, niche, and if it has any strikes..." :
              formData.type === 'facebook' ? "Describe page/group reach, engagement rate, demographics, and monetization status..." :
              formData.type === 'twitter' ? "Describe account age, niche, follower quality, and any specific assets included..." :
              formData.type === 'theme_plugin' ? "Describe features, tech stack, installation process, license type, and support options..." :
              formData.type === 'mobile_app' ? "Describe app functionality, store presence, revenue model, and source code details..." :
              formData.type === 'games' ? "List all rare skins, account level, rank, in-game currency, and if full email access is provided..." : 
              "Provide a detailed description of what you are selling..."
            }
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <p className="mt-2 text-xs text-gray-400">Supports Markdown for styling.</p>
        </div>

        {/* Included Assets */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            What's Included
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(formData.type === 'website' ? [
              'Domain', 'Hosting', 'Content', 'Social Media', 'Email List', 'Inventory', 'Support'
            ] : (formData.type === 'youtube' || formData.type === 'tiktok' || formData.type === 'instagram' || formData.type === 'facebook' || formData.type === 'twitter' || formData.type === 'threads') ? [
              'Channel Access', 'Gmail Account', 'AdSense/Monetization', 'Community Access', 'Branding Assets', 'Original Email', 'OEV'
            ] : formData.type === 'theme_plugin' ? [
              'Source Code', 'License Key', 'Documentation', 'Graphics/UI', 'Support Period', 'Update Rights'
            ] : formData.type === 'mobile_app' ? [
              'Source Code', 'Play/App Store Account', 'Domain', 'Backend/Server', 'Documentation', 'Design Assets'
            ] : formData.type === 'group_buy' ? [
              'Ahrefs', 'Semrush', 'Canva Pro', 'ChatGPT Plus', 'Grammarly', 'Envato Elements', 'Other Tools'
            ] : [
              'Account Access', 'Login Credentials', 'Usage Guide', 'Support', 'Updates'
            ]).map(asset => (
              <button
                key={asset}
                type="button"
                onClick={() => {
                  const current = formData.includedAssets;
                  if (current.includes(asset)) {
                    setFormData({ ...formData, includedAssets: current.filter(a => a !== asset) });
                  } else {
                    setFormData({ ...formData, includedAssets: [...current, asset] });
                  }
                }}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-sm transition-all",
                  formData.includedAssets.includes(asset) 
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                )}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            Screenshots (Max 5)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {formData.images.map((img, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden group border border-gray-100">
                <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                    className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {formData.images.length < 5 && (
              <label className="aspect-square bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-2xl flex flex-col items-center justify-center text-indigo-400 hover:border-indigo-400 hover:bg-indigo-50 transition-all group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAddImage}
                  className="hidden"
                />
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
              </label>
            )}
          </div>
          {formData.images.length === 0 && (
            <p className="mt-4 text-sm text-red-500 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              At least one screenshot is required.
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-grow bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Listing' : 'Submit for Approval'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard/listings')}
            className="px-8 bg-white text-gray-500 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">Congratulations! 🎉</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your website listing has been submitted successfully. Our team will review it shortly.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/dashboard/listings')}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Go to My Listings
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
