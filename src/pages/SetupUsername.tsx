import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, query, collection, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { User, CheckCircle2, AlertCircle, ArrowRight, Phone, Globe, Mail } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function SetupUsername() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    whatsappNumber: '',
    country: '',
    gender: 'male' as 'male' | 'female',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        username: profile.username || '',
        whatsappNumber: profile.whatsappNumber || '',
        country: profile.country || '',
        gender: profile.gender || 'male',
        email: profile.email || user?.email || ''
      }));
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = formData.username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (!formData.whatsappNumber || formData.whatsappNumber.length < 10) {
      setError('Please enter a valid WhatsApp number with country code.');
      return;
    }

    if (formData.whatsappNumber.startsWith('0')) {
      setError('WhatsApp number should not start with 0. Please use country code.');
      return;
    }

    if (!formData.country) {
      setError('Country is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if username is taken (only if it changed)
      if (cleanUsername !== profile?.username) {
        const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setError('This username is already taken. Please choose another one.');
          setLoading(false);
          return;
        }
      }

      // Create or Update profile
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        username: cleanUsername,
        whatsappNumber: formData.whatsappNumber,
        country: formData.country,
        gender: formData.gender,
        email: formData.email,
        name: profile?.name || user.displayName || cleanUsername,
        role: profile?.role || 'buyer',
        status: profile?.status || 'active',
        createdAt: profile?.createdAt || serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        rating: profile?.rating || 0,
        totalReviews: profile?.totalReviews || 0,
        ordersCompleted: profile?.ordersCompleted || 0,
        websitesBought: profile?.websitesBought || 0,
        websitesSold: profile?.websitesSold || 0,
        totalSales: profile?.totalSales || 0,
        totalPurchases: profile?.totalPurchases || 0,
        responseTime: profile?.responseTime || 'N/A'
      }, { merge: true });

      navigate('/');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-gray-100"
      >
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8">
          <User className="w-10 h-10" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-500">Please provide a few more details to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Branded Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all font-bold"
                  placeholder="yourname"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">WhatsApp Number</label>
              <div className="relative phone-input-container">
                <PhoneInput
                  country={'pk'}
                  value={formData.whatsappNumber}
                  onChange={(phone, countryData: any) => {
                    setFormData({ 
                      ...formData, 
                      whatsappNumber: phone,
                      country: countryData.name
                    });
                  }}
                  inputClass="!w-full !pl-12 !pr-4 !py-7 !bg-gray-50 !border !border-gray-100 !rounded-2xl focus:!ring-4 focus:!ring-indigo-500/10 focus:!bg-white !transition-all !outline-none !h-auto !font-bold"
                  buttonClass="!bg-transparent !border-none !left-2"
                  containerClass="!w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Country</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  readOnly
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 border border-gray-100 rounded-2xl outline-none cursor-not-allowed font-bold"
                  placeholder="Selected via WhatsApp"
                  value={formData.country}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all font-bold"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Gender</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'male' })}
                className={`py-4 rounded-2xl font-black border-2 transition-all flex items-center justify-center gap-2 ${formData.gender === 'male' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: 'female' })}
                className={`py-4 rounded-2xl font-black border-2 transition-all flex items-center justify-center gap-2 ${formData.gender === 'female' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                Female
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Saving Profile...' : 'Complete Setup'}
            <ArrowRight className="w-6 h-6" />
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-gray-50 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            All fields are required to access the marketplace.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
