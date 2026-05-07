import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { emailService } from '../services/emailService';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Lock, Phone, ArrowRight, ShieldCheck, Globe, Users, Briefcase, ShoppingBag, AlertCircle, Chrome } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsappNumber: '',
    country: '',
    gender: 'male' as 'male' | 'female',
    role: 'buyer' as 'buyer' | 'seller' | 'freelancer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const navigate = useNavigate();

  if (loading) return <LoadingScreen />;

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode === generatedOTP) {
      setError('');
      setLoading(true);
      try {
        const cleanUsername = formData.username.trim().toLowerCase();
        
        console.log('OTP Verified. Creating user auth...');
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        console.log('User auth created:', user.uid);

        // Create profile
        console.log('Attempting to create user profile in Firestore...');
        await setDoc(doc(db, 'users', user.uid), {
          name: formData.name,
          username: cleanUsername,
          email: formData.email,
          whatsappNumber: formData.whatsappNumber,
          country: formData.country || 'Unknown',
          gender: formData.gender,
          role: formData.role,
          status: 'active',
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          rating: 0,
          totalReviews: 0,
          ordersCompleted: 0,
          websitesBought: 0,
          websitesSold: 0,
          totalSales: 0,
          totalPurchases: 0,
          responseTime: 'N/A',
          needsProfileSetup: false
        });
        
        await emailService.sendWelcome(formData.email, formData.name);
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Final registration error:', err);
        let msg = err.message || 'Registration failed';
        if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const nameParts = formData.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setError('Please enter your full name (e.g., Muhammad Ali).');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      // Check if username is taken
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setError('This username is already taken. Please choose another one.');
        setLoading(false);
        return;
      }

      // Send OTP for verification
      const otp = generateOTP();
      setGeneratedOTP(otp);
      
      console.log('Sending OTP to:', formData.email);
      const emailResult = await emailService.sendOTP(formData.email, otp, 'verification');
      
      if (emailResult.error) {
        if (emailResult.error.includes('RESEND_API_KEY')) {
          throw new Error('System Error: Email API Key is missing. Please set RESEND_API_KEY in the Secrets menu (Gear Icon -> Secrets).');
        }
        throw new Error(emailResult.error);
      }

      setShowVerification(true);
    } catch (err: any) {
      console.error('Verification initiation error:', err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if profile exists
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Create a default profile for Google users
        await setDoc(docRef, {
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          whatsappNumber: '',
          country: '',
          gender: 'male',
          role: 'buyer',
          status: 'active',
          createdAt: serverTimestamp(),
          lastActiveAt: serverTimestamp(),
          rating: 0,
          totalReviews: 0,
          ordersCompleted: 0,
          websitesBought: 0,
          websitesSold: 0,
          totalSales: 0,
          totalPurchases: 0,
          responseTime: 'N/A',
          needsProfileSetup: true
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please finish the sign-in in the Google popup.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: Firebase could not be reached. Please check your internet connection or disable any VPN/Ad-blockers.');
      } else {
        setError(err.message || 'Google login failed');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 p-4 py-20">
      <AnimatePresence mode="wait">
        {!showVerification ? (
          <motion.div
            key="register-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12"
          >
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-500">Join the Next Flippers community today.</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              {/* Form fields remain the same */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Branded Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number</label>
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
                  inputClass="!w-full !pl-12 !pr-4 !py-6 !bg-gray-50 !border !border-gray-200 !rounded-xl focus:!ring-2 focus:!ring-indigo-500 focus:!bg-white !transition-all !outline-none !h-auto"
                  buttonClass="!bg-transparent !border-none !left-2"
                  containerClass="!w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Country</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  readOnly
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none cursor-not-allowed"
                  placeholder="Selected via WhatsApp"
                  value={formData.country}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${formData.gender === 'male' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${formData.gender === 'female' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-4">I want to...</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'buyer' })}
                className={`py-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'buyer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Websites
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'seller' })}
                className={`py-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'seller' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                <Globe className="w-5 h-5" />
                Sell Websites
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'freelancer' })}
                className={`py-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center gap-2 ${formData.role === 'freelancer' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
              >
                <Briefcase className="w-5 h-5" />
                Freelancer
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              By creating an account, you agree to our <Link to="/terms" className="text-indigo-600 font-bold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-indigo-600 font-bold hover:underline">Privacy Policy</Link>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">Or join with</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="mt-8 w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
        >
          <Chrome className="w-5 h-5 text-indigo-600" />
          Google Account
        </button>

        <p className="mt-10 text-center text-gray-500 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    ) : (
      <motion.div
        key="otp-verification"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-500 text-sm">We've sent a 6-digit code to <span className="font-bold text-gray-700">{formData.email}</span></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div>
            <input
              type="text"
              maxLength={6}
              required
              autoFocus
              className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Verify & Create Account
          </button>

          <p className="text-center text-sm text-gray-400">
            Didn't receive the code?{' '}
            <button 
              type="button"
              onClick={() => {
                const otp = generateOTP();
                setGeneratedOTP(otp);
                emailService.sendOTP(formData.email, otp, 'verification');
              }}
              className="text-indigo-600 font-bold hover:underline"
            >
              Resend
            </button>
          </p>
        </form>
      </motion.div>
    )}
  </AnimatePresence>
</div>
);
}
