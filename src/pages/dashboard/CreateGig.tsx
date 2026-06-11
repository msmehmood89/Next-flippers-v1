import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Gig } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, DollarSign, Clock, Layout, 
  FileText, CheckCircle2, ArrowRight, Image as ImageIcon, 
  X, PlusCircle, AlertCircle, Info
} from 'lucide-react';
import { cn, handleFirestoreError, OperationType, resizeImage } from '../../lib/utils';

const GIG_CATEGORIES = [
  'Web Development',
  'Graphic Design',
  'Digital Marketing',
  'Content Writing',
  'Video Editing',
  'SEO',
  'App Development',
  'Other'
];

const DELIVERY_TIMES = [
  '1 Day', '2 Days', '3 Days', '5 Days', '7 Days', '14 Days', '30 Days'
];

export default function CreateGig() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    price: 0,
    deliveryTime: '3 Days',
    images: [] as string[],
    salesType: 'unlimited' as 'single' | 'limited' | 'unlimited',
    quantity: 1,
  });

  useEffect(() => {
    if (id) {
      const fetchGig = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'gigs', id));
          if (docSnap.exists()) {
            const data = docSnap.data() as Gig;
            if (data.userId !== user?.uid) {
              navigate('/dashboard/gigs');
              return;
            }
            setFormData({
              title: data.title,
              description: data.description,
              category: data.category,
              price: data.price,
              deliveryTime: data.deliveryTime,
              images: data.images,
              salesType: data.salesType || 'unlimited',
              quantity: data.quantity || 1,
            });
          }
        } catch (error) {
          console.error('Error fetching gig for edit:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchGig();
    }
  }, [id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (formData.images.length === 0) {
      alert('Please upload at least one image representing your service.');
      return;
    }

    setLoading(true);

    try {
      const gigData = {
        ...formData,
        userId: user.uid,
        userName: profile?.name || user.email || 'Freelancer',
        updatedAt: serverTimestamp(),
      };

      if (id) {
        try {
          await updateDoc(doc(db, 'gigs', id), gigData);
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, `gigs/${id}`);
        }
      } else {
        try {
          await addDoc(collection(db, 'gigs'), {
            ...gigData,
            createdAt: serverTimestamp(),
            status: 'pending', // Requires admin review
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'gigs');
        }
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/freelancers');
      }, 3000);
    } catch (error) {
      console.error('Error saving gig:', error);
      alert('Failed to save gig. Please try again.');
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

  if (fetching) return <div className="p-20 text-center">Loading gig data...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{id ? 'Edit Gig' : 'Create New Gig'}</h1>
        <p className="text-gray-500">Showcase your skills and start earning by offering your services.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            Service Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Gig Title</label>
              <input
                type="text"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="e.g. I will design a professional logo for your business"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {GIG_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Delivery Time</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              >
                {DELIVERY_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Starting Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="5"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="50"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Sales / Order Capacity Mode</label>
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
                  <span className="text-sm font-bold block">One-time Gig (Sell Once)</span>
                  <span className="text-xs text-gray-400">Exclusive delivery. This service closes and shows "SOLD" after purchase.</span>
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
                  <span className="text-sm font-bold block">Limited Orders</span>
                  <span className="text-xs text-gray-400">Can only accept a specific number of orders before closing.</span>
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
                  <span className="text-sm font-bold block">Unlimited Orders</span>
                  <span className="text-xs text-gray-400">Accept unlimited concurrent orders/sales over time.</span>
                </button>
              </div>

              {formData.salesType === 'limited' && (
                <div className="mt-4 animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Available Quantity / Cap</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Enter order capacity (e.g. 5)"
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
            Service Description
          </h2>
          <textarea
            required
            rows={8}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none"
            placeholder="Explain exactly what you offer, your process, and what the buyer will receive..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="mt-4 p-4 bg-indigo-50 rounded-2xl flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Be as detailed as possible. Mention your experience, tools you use, and any specific requirements you have for the buyer.
            </p>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            Portfolio Images (Max 5)
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
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2">Upload Sample</span>
              </label>
            )}
          </div>
          {formData.images.length === 0 && (
            <p className="mt-4 text-sm text-red-500 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              At least one portfolio image is required.
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-grow bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Gig' : 'Publish Gig'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => navigate('/freelancers')}
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
              <h2 className="text-3xl font-black text-gray-900 mb-4">Gig Published! 🚀</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your service is now live on the Freelance Marketplace. Start receiving orders today!
              </p>
              <button
                onClick={() => navigate('/freelancers')}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all"
              >
                Back to Marketplace
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
