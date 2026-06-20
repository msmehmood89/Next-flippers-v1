import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Lightbulb, Send, Upload, X, CheckCircle2, 
  AlertCircle, ArrowLeft, Image, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { cn, resizeImage } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function RequestImprovement() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    email: user?.email || '',
    title: '',
    category: 'user_experience',
    description: '',
    impact: 'medium'
  });

  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync user info if auth state loads later
  useEffect(() => {
    if (user || profile) {
      setFormData(prev => ({
        ...prev,
        name: profile?.name || user?.displayName || prev.name,
        email: user?.email || prev.email
      }));
    }
  }, [user, profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('File size is too large. Base screenshot images are auto-sized, but please upload under 4MB.');
      return;
    }

    try {
      setError(null);
      const resizedBase64 = await resizeImage(file, 1024, 768, 0.82);
      setScreenshot(resizedBase64);
    } catch (err) {
      console.error('Error resizing view image:', err);
      setError('Failed to process image. Please try another media file.');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleScreenshotChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleScreenshotChange(e.target.files[0]);
    }
  };

  // Support pasting image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files[0]) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          handleScreenshotChange(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.name || !formData.email) {
      setError('Please fill out all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const compiledDescription = `
[IMPROVEMENT AREA]
${formData.category.toUpperCase().replace('_', ' ')}

[PROPOSED SOLUTION]
${formData.description}

[EXPECTED TARGET IMPACT]
${formData.impact.toUpperCase()}
      `.trim();

      const feedbackData = {
        userId: user?.uid || 'anonymous',
        userName: formData.name,
        userEmail: formData.email,
        type: 'improvement',
        title: formData.title,
        description: compiledDescription,
        screenshot: screenshot || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // 1. Store in Firestore
      await addDoc(collection(db, 'feedback'), feedbackData);

      // 2. Trigger Email Notification via Backend
      const response = await fetch('/api/email/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'improvement',
          title: formData.title,
          description: compiledDescription,
          userName: formData.name,
          userEmail: formData.email,
          screenshot: screenshot
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        console.warn('Backend email notification warning:', resData.error);
      }

      setSuccess(true);
      setFormData({
        name: profile?.name || user?.displayName || '',
        email: user?.email || '',
        title: '',
        category: 'user_experience',
        description: '',
        impact: 'medium'
      });
      setScreenshot(null);
    } catch (err: any) {
      console.error('Error submitting suggestion:', err);
      setError(err.message || 'Something went wrong while submitting your suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" id="request-improvement-page">
      <div className="max-w-3xl mx-auto">
        {/* Back navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-8"
          id="back-home-link-suggestion"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="suggestion-form-card">
          <div className="p-6 sm:p-10 border-b border-slate-100 bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                <Lightbulb className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Suggest an Improvement</h1>
                <p className="text-slate-400 text-sm mt-1">Have ideas for features or improvements? Help us shape NextFlippers!</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-12 text-center"
                  key="success-message"
                  id="suggestion-success-container"
                >
                  <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Thank you for your feedback!</h3>
                  <p className="text-slate-600 mt-2 max-w-md mx-auto">
                    Your idea has been shared with the NextFlippers administration. We love community suggestions and review every single one of them.
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    <button 
                      onClick={() => setSuccess(false)}
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all"
                      id="suggest-another-btn"
                    >
                      Suggest Another Enhancement
                    </button>
                    <Link 
                      to="/"
                      className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                      id="go-home-suggestion-btn"
                    >
                      Return to Home
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  key="form-fields"
                  id="suggestion-form"
                >
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-800 text-sm" id="suggestion-error-banner">
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold">Oops!</span> {error}
                      </div>
                    </div>
                  )}

                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                        placeholder="John Doe"
                        id="suggestion-reporter-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                        placeholder="john@example.com"
                        id="suggestion-reporter-email"
                      />
                    </div>
                  </div>

                  {/* Area Category and Importance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Area of Improvement
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                        id="suggestion-category-select"
                      >
                        <option value="user_experience">User Experience (UX/UI)</option>
                        <option value="escrow_security">Escrow & Payment Security</option>
                        <option value="chat_messaging">Chat & Communication</option>
                        <option value="listing_management">Listing Management</option>
                        <option value="mobile_compatibility">Mobile Compatibility</option>
                        <option value="new_features">Request New Feature</option>
                        <option value="other">Other Suggestions</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Impact on Platform
                      </label>
                      <select
                        name="impact"
                        value={formData.impact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all bg-white"
                        id="suggestion-impact-select"
                      >
                        <option value="critical">Critical (Must have feature / blocker)</option>
                        <option value="high">High (Substantial boost to trading)</option>
                        <option value="medium">Medium (Good overall enhancement)</option>
                        <option value="low">Low (Nice-to-have cosmetic adjustment)</option>
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Idea/Feature Title <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                      placeholder="e.g. Implement real-time notifications for chat"
                      id="suggestion-title-input"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Describe your Idea & Proposed Solution <span className="text-rose-500">*</span>
                    </label>
                    <textarea 
                      name="description"
                      rows={6}
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 resize-none"
                      placeholder="Please explain clearly what you want added/changed, why it helps the NextFlippers platform, and how you imagine it working..."
                      id="suggestion-description-textarea"
                    />
                  </div>

                  {/* Reference Image Dropzone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Reference Layout or Diagram <span className="text-slate-400 font-normal">(Optional, under 4MB)</span>
                    </label>
                    
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center",
                        isDragging ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400 bg-white"
                      )}
                      id="suggestion-screenshot-dropzone"
                    >
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                        id="suggestion-screenshot-upload-input"
                      />

                      {screenshot ? (
                        <div className="relative group w-full max-w-sm mt-1" onClick={(e) => e.stopPropagation()} id="uploaded-preview-container-suggestion">
                          <img 
                            src={screenshot} 
                            alt="Reference Preview" 
                            className="rounded-xl border border-slate-200 shadow-sm max-h-60 w-full object-contain mx-auto"
                            id="uploaded-screenshot-img-suggestion"
                          />
                          <button 
                            type="button"
                            onClick={() => setScreenshot(null)}
                            className="absolute -top-3 -right-3 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md hover:scale-105 transition-all"
                            title="Remove Screenshot"
                            id="remove-screenshot-btn-suggestion"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-2" id="empty-dropzone-prompt-suggestion">
                          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3">
                            <Image className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Drag or select a layout file</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP formats supported</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100" id="form-actions-suggestion">
                    <Link 
                      to="/"
                      className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition-all"
                      id="cancel-suggestion-btn"
                    >
                      Cancel
                    </Link>
                    <button 
                      type="submit"
                      disabled={loading}
                      className={cn(
                        "px-6 py-3 font-semibold rounded-xl text-sm text-white shadow-sm transition-all flex items-center gap-2",
                        loading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
                      )}
                      id="submit-suggestion-btn"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Submitting Suggestion...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Suggestion
                        </>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
