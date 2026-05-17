import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc, query, collection, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, CheckCircle2, AlertCircle, ArrowRight, Phone, Globe, Mail, X, PartyPopper } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import confetti from 'canvas-confetti';
import Logo from '../components/Logo';

export default function SetupUsername() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    whatsappNumber: '',
    country: '',
    gender: 'male' as 'male' | 'female',
    role: 'buyer' as UserProfile['role'],
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#3b82f6', '#10b981']
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        username: profile.username || '',
        whatsappNumber: profile.whatsappNumber || '',
        country: profile.country || '',
        gender: profile.gender || 'male',
        role: profile.role || 'buyer',
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
        role: formData.role,
        email: formData.email,
        name: profile?.name || user.displayName || cleanUsername,
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
        responseTime: profile?.responseTime || 'N/A',
        needsProfileSetup: false
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
      {/* Welcome Modal for Social Logins */}
      <AnimatePresence>
        {showWelcome && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden relative"
            >
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 md:p-12 text-center">
                <div className="flex justify-center mb-8">
                  <Logo size="md" />
                </div>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <PartyPopper className="w-10 h-10" />
                </div>
                
                <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                  Welcome to <br />
                  <span className="text-indigo-600">Next Flippers!</span>
                </h2>
                
                <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                  We're absolutely thrilled to have you here! Your Google account is connected. Now, let's complete your professional profile so you can start trading.
                </p>

                <div className="grid grid-cols-1 gap-4 mb-10 text-left">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-green-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-gray-900">Google Verified</div>
                      <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Secure Authentication</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    Setup My Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-gray-100"
      >
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto mb-8">
          <User className="w-10 h-10" />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Complete Your Account</h1>
          <p className="text-gray-500 font-medium tracking-tight">We need a few professional details to provide you the best experience in our marketplace.</p>
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
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Account Role</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'buyer' })}
                className={`py-4 rounded-2xl font-black border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'buyer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                Buy Websites
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'seller' })}
                className={`py-4 rounded-2xl font-black border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'seller' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                Sell Websites
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                className={`py-4 rounded-2xl font-black border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'freelancer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                Freelancer
              </button>
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
