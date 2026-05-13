import React, { useState } from 'react';
import { useAuth } from '../../App';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, Shield, Save, AlertCircle, Globe, Users, Briefcase, ShoppingBag, Trash2, X } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function UserSettings() {
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    whatsappNumber: profile?.whatsappNumber || '',
    country: profile?.country || '',
    gender: profile?.gender || 'male',
    role: profile?.role || 'buyer',
    address: profile?.address || '',
    mainBusiness: profile?.mainBusiness || '',
    monthlyRevenue: profile?.monthlyRevenue || '',
    bio: profile?.bio || '',
    experience: profile?.experience || '',
    lookingFor: profile?.lookingFor || '',
    fullTimeJob: profile?.fullTimeJob || '',
    partTimeJob: profile?.partTimeJob || '',
    skills: profile?.skills?.join(', ') || '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [requiresRecentLogin, setRequiresRecentLogin] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      // 1. Attempt to delete Auth user first (this is the most likely to fail if not recently logged in)
      // If this succeeds, we then delete the Firestore doc. 
      // Note: Firebase deleteUser works best if doc is already gone in some cases, but here 
      // we need the token.
      
      await deleteUser(user);
      
      // 2. Delete from Firestore (if auth delete somehow doesn't revoke token immediately, or we do it quickly)
      // Actually, standard practice is delete data first.
      // But if we delete data and then deleteUser fails with re-auth, data is lost.
      // So we'll try data first, but if auth fails, we show re-auth.
      
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 3. Navigate home
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/requires-recent-login') {
        setRequiresRecentLogin(true);
        setDeleteError('For security, please re-verify your identity to complete deletion.');
      } else {
        setDeleteError(error.message || 'Failed to delete account. Please try again later.');
      }
    } finally {
      setIsDeleting(false);
      if (!requiresRecentLogin && !deleteError) {
        setShowDeleteConfirm(false);
      }
    }
  };

  const handleReauthenticate = async () => {
    if (!user || isDeleting) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      // Force a re-login via popup
      const { GoogleAuthProvider, reauthenticateWithPopup, signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      
      console.log('Attempting re-authentication...');
      await reauthenticateWithPopup(user, provider);
      
      // If success, try deleting again automatically
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(user);
      
      navigate('/');
    } catch (error: any) {
      console.error('Re-auth error:', error);
      setDeleteError('Re-verification failed. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccess(false);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        whatsappNumber: formData.whatsappNumber,
        country: formData.country,
        gender: formData.gender,
        role: formData.role,
        address: formData.address,
        mainBusiness: formData.mainBusiness,
        monthlyRevenue: formData.monthlyRevenue,
        bio: formData.bio,
        experience: formData.experience,
        lookingFor: formData.lookingFor,
        fullTimeJob: formData.fullTimeJob,
        partTimeJob: formData.partTimeJob,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-500">Manage your personal information and contact details.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-50">
            <ProfileAvatar src={profile?.photoURL} gender={profile?.gender} size="xl" />
            <div>
              <div className="text-xl font-bold text-gray-900">{profile?.name}</div>
              <div className="text-sm text-gray-500">{profile?.email}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                <Shield className="w-3 h-3" />
                {profile?.role} Account
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              <p className="text-xs text-indigo-900 leading-relaxed">
                <span className="font-bold">Role Information:</span> Choosing a role helps us customize your experience, but all platform features (buying, selling, and freelancer services) are available to all account types.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

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
              <p className="mt-2 text-xs text-gray-400">Used for manual escrow coordination.</p>
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

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">Account Purpose</label>
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

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 cursor-not-allowed"
                  value={profile?.email}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">Email cannot be changed for security reasons.</p>
            </div>

            <div className="border-t border-gray-50 pt-8 mt-8">
              <h2 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-widest">Professional Profile</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bio</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Main Business</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g. E-commerce, SaaS"
                      value={formData.mainBusiness}
                      onChange={(e) => setFormData({ ...formData, mainBusiness: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Revenue</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      placeholder="e.g. $5,000 - $10,000"
                      value={formData.monthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, monthlyRevenue: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Skills (comma separated)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="e.g. React, SEO, Marketing"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Experience</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="Describe your professional background..."
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Looking For</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    placeholder="What are you searching for on Next Flippers?"
                    value={formData.lookingFor}
                    onChange={(e) => setFormData({ ...formData, lookingFor: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Full-time Job</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      value={formData.fullTimeJob}
                      onChange={(e) => setFormData({ ...formData, fullTimeJob: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Part-time Job</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                      value={formData.partTimeJob}
                      onChange={(e) => setFormData({ ...formData, partTimeJob: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : success ? 'Changes Saved!' : 'Save Changes'}
              {!loading && !success && <Save className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
        <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-red-700 mb-6 leading-relaxed">
          Deleting your account is permanent and will remove all your listings, 
          chats, and transaction history. This action cannot be undone.
        </p>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="px-6 py-3 bg-white text-red-600 border border-red-200 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white transition-all transition-all flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                  {requiresRecentLogin ? 'Security Verification' : 'Are you absolutely sure?'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {requiresRecentLogin 
                    ? 'To delete your account, we need you to sign in one more time to verify your identity. Click the button below to re-authenticate with Google.'
                    : 'This will permanently delete your account and all associated data. This action cannot be reversed.'}
                </p>

                {deleteError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 font-bold">
                    {deleteError}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {requiresRecentLogin ? (
                    <button
                      onClick={handleReauthenticate}
                      disabled={isDeleting}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Shield className="w-5 h-5" />
                      )}
                      {isDeleting ? 'Verifying...' : 'Verify with Google & Delete'}
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteError('');
                          setRequiresRecentLogin(false);
                        }}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                    </div>
                  )}

                  {requiresRecentLogin && (
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setRequiresRecentLogin(false);
                        setDeleteError('');
                      }}
                      className="text-gray-400 text-sm font-bold hover:text-gray-600"
                    >
                      Cancel Deletion
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
