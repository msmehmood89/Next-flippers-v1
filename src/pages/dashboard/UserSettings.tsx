import React, { useState, useRef } from 'react';
import { useAuth } from '../../App';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { deleteUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Shield, Save, AlertCircle, Globe, 
  ShoppingBag, Trash2, X, Camera, Upload, 
  CheckCircle2, Briefcase, Info
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import ProfileAvatar from '../../components/ProfileAvatar';
import { cn, resizeImage } from '../../lib/utils';
import ImageEditorModal from '../../components/ImageEditorModal';

export default function UserSettings() {
  const { profile, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorImageSrc, setEditorImageSrc] = useState('');
  const [editorTarget, setEditorTarget] = useState<'profile' | 'banner'>('profile');
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
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [requiresRecentLogin, setRequiresRecentLogin] = useState(false);
  const navigate = useNavigate();

  const timeoutPromise = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(errorMsg));
      }, ms);
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  const compressAndGetBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 160; // 160x160 is ample for a profile avatar
          let width = image.width;
          let height = image.height;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height);
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% JPEG compression
              resolve(dataUrl);
            } catch (canvasErr) {
              // Browser security constraint error or similar
              reject(canvasErr);
            }
          } else {
            reject(new Error('Canvas context not available'));
          }
        };
        image.onerror = (err) => reject(new Error('Failed to load image element'));
        if (e.target?.result && typeof e.target.result === 'string') {
          image.src = e.target.result;
        } else {
          reject(new Error('Failed to parse file source'));
        }
      };
      reader.onerror = (err) => reject(new Error('Failed to read file reader stream'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditorImageSrc(reader.result as string);
      setEditorTarget('profile');
      setEditorOpen(true);
    };
    reader.onerror = () => {
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditorImageSrc(reader.result as string);
      setEditorTarget('banner');
      setEditorOpen(true);
    };
    reader.onerror = () => {
      alert('Failed to read banner file.');
    };
    reader.readAsDataURL(file);
  };

  const handleEditorSave = async (editedBase64: string) => {
    if (!user) return;
    setSuccess(false);

    if (editorTarget === 'profile') {
      setUploading(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: editedBase64
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Failed to save profile picture.');
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      setUploadingBanner(true);
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          bannerURL: editedBase64
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error('Error uploading banner:', error);
        alert('Failed to save banner.');
      } finally {
        setUploadingBanner(false);
        if (bannerInputRef.current) bannerInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteUser(user);
      await deleteDoc(doc(db, 'users', user.uid));
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
      const { GoogleAuthProvider, reauthenticateWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
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
        updatedAt: new Date()
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
    <div className="max-w-4xl pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 font-medium">Personalize your identity and manage how others see you on the marketplace.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* Photo Management Card */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 text-center">
            <div className="relative inline-block group">
               <div className={cn(
                 "w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-gray-50 shadow-inner bg-gray-50 transition-all",
                 uploading && "opacity-50 blur-[2px]"
               )}>
                 <ProfileAvatar src={profile?.photoURL} gender={profile?.gender} size="full" />
               </div>
               
               {uploading && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                 </div>
               )}

               <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={uploading}
                 className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-indigo-700 transition-all group-hover:scale-110 active:scale-95"
               >
                 <Camera className="w-5 h-5" />
               </button>
            </div>
            
            <div className="mt-6">
              <h2 className="text-xl font-black text-gray-900 line-clamp-1">{profile?.name}</h2>
              <p className="text-sm text-gray-400 font-bold tracking-tight">@{profile?.username}</p>
            </div>

            <div className="mt-6 space-y-3">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Change Photo
              </button>
              <p className="text-[10px] text-gray-400 font-medium">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          {/* Banner Management Card */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 text-center">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Profile Cover Banner</h3>
            <div className="relative rounded-2xl overflow-hidden shadow-inner bg-gray-100 h-24 mb-4 flex items-center justify-center group">
              {profile?.bannerURL ? (
                <img src={profile.bannerURL} className="w-full h-full object-cover" alt="Profile Banner" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              )}
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={bannerInputRef}
              onChange={handleBannerUpload}
              accept="image/*"
              className="hidden"
            />
            <button 
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Change Banner
            </button>
            <p className="text-[10px] text-gray-400 font-medium mt-2">Recommended: 1200x400. Max ratio limits apply.</p>
          </div>

          {/* Account Info Card */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Security Info</h3>
            <div className="space-y-4">
               <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Email</span>
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                   <Mail className="w-4 h-4 text-indigo-600" />
                   {profile?.email}
                 </div>
               </div>
               <div>
                 <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Role Type</span>
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                   <User className="w-4 h-4 text-indigo-600" />
                   {profile?.role?.toUpperCase()}
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10">
            <form onSubmit={handleUpdate} className="space-y-10">
              {/* Identity Section */}
              <section>
                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                     <User className="w-4 h-4" />
                   </div>
                   Identity & Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp / Contact</label>
                    <div className="phone-input-container">
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
                        inputClass="!w-full !pl-14 !pr-5 !py-4 !bg-gray-50 !border-gray-100 !rounded-2xl focus:!ring-2 focus:!ring-indigo-500 focus:!bg-white !transition-all !outline-none !h-auto !font-bold"
                        inputStyle={{ paddingLeft: '56px' }}
                        buttonClass="!bg-transparent !border-none !left-2"
                        containerClass="!w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                    <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                      {(['male', 'female'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: g })}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            formData.gender === g ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="text"
                        readOnly
                        className="w-full pl-11 pr-5 py-4 bg-gray-100 text-gray-400 border border-gray-100 rounded-2xl outline-none cursor-not-allowed font-bold"
                        value={formData.country}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Bio Section */}
              <section>
                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                   <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                     <Globe className="w-4 h-4" />
                   </div>
                   Professional Bio
                </h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Bio</label>
                     <textarea
                       rows={4}
                       className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-sm leading-relaxed"
                       placeholder="Describe your background and expertise..."
                       value={formData.bio}
                       onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                     />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Core Experience</label>
                       <input
                         type="text"
                         className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                         placeholder="e.g. 5 Years in SaaS"
                         value={formData.experience}
                         onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Main Focus</label>
                       <input
                         type="text"
                         className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold"
                         placeholder="e.g. Scaling Assets"
                         value={formData.mainBusiness}
                         onChange={(e) => setFormData({ ...formData, mainBusiness: e.target.value })}
                       />
                     </div>
                   </div>
                </div>
              </section>

              {/* Skills Section */}
              <section>
                 <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                         <Info className="w-5 h-5 text-indigo-600" />
                       </div>
                       <div>
                         <h4 className="text-sm font-black text-gray-900 uppercase mb-1">Keywords & Skills</h4>
                         <p className="text-xs text-gray-500 font-medium">Add skills separated by commas to help people find you through search.</p>
                       </div>
                    </div>
                    <div className="mt-5">
                      <input
                        type="text"
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                        placeholder="React, SEO, Marketing, Python"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      />
                    </div>
                 </div>
              </section>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-black/5 disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : success ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  )}
                  {loading ? 'Saving Identity...' : success ? 'Successfully Saved' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-red-50 rounded-[2.5rem] p-10 border border-red-100 overflow-hidden relative">
            <Trash2 className="absolute -bottom-4 -right-4 w-32 h-32 text-red-500/5 rotate-12" />
            <div className="relative z-10">
              <h2 className="text-xl font-black text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Sensitive Actions
              </h2>
              <p className="text-sm text-red-800/70 mb-8 max-w-lg font-medium leading-relaxed">
                Closing your account is permanent. This will erase all your history, including active listings, messages, and saved data.
              </p>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-10 py-4 bg-white text-red-600 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2 border border-red-100"
              >
                Close Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
                  {requiresRecentLogin ? 'Verify Identity' : 'Are you sure?'}
                </h3>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">
                  {requiresRecentLogin 
                    ? 'Account deletion requires a fresh login for your security. Please re-authenticate with Google.'
                    : 'This action is immediate and cannot be undone. All your marketplace data will be permanently purged.'}
                </p>

                {deleteError && (
                  <div className="mb-8 p-5 bg-red-50 text-red-600 text-xs rounded-2xl border border-red-100 font-black">
                    {deleteError}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {requiresRecentLogin ? (
                    <button
                      onClick={handleReauthenticate}
                      disabled={isDeleting}
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Shield className="w-6 h-6" />
                      )}
                      {isDeleting ? 'Verifying...' : 'Authenticate & Delete'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                       <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="w-full py-5 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDeleting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                        {isDeleting ? 'Erasing...' : 'Confirm Permanent Deletion'}
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteError('');
                          setRequiresRecentLogin(false);
                        }}
                        disabled={isDeleting}
                        className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-black hover:bg-gray-100 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        imageUrl={editorImageSrc}
        title={editorTarget === 'profile' ? "Crop Profile Picture" : "Crop Profile Banner"}
        aspectRatio={editorTarget === 'profile' ? '1:1' : '16:9'}
        onSave={handleEditorSave}
      />
    </div>
  );
}
