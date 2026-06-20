import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Bug, Send, Upload, X, CheckCircle2, 
  AlertCircle, ArrowLeft, Camera, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { cn, resizeImage } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';

export default function ReportBug() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: profile?.name || user?.displayName || '',
    email: user?.email || '',
    title: '',
    steps: '',
    expected: '',
    actual: '',
    description: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    // Limit to 4MB before resizing
    if (file.size > 4 * 1024 * 1024) {
      setError('File size is too large. Standard screenshot images are resized automatically, but please upload an image under 4MB.');
      return;
    }

    try {
      setError(null);
      // Resize to moderate dimensions for optimal Firestore storage & Resend email transmission
      const resizedBase64 = await resizeImage(file, 1024, 768, 0.82);
      setScreenshot(resizedBase64);
    } catch (err) {
      console.error('Error resizing screenshot:', err);
      setError('Failed to process image. Please try another screenshot file.');
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

  // Support pasting screenshot from clipboard
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
[REPRODUCTION STEPS]
${formData.steps || 'Not specified'}

[EXPECTED BEHAVIOR]
${formData.expected || 'Not specified'}

[ACTUAL BEHAVIOR]
${formData.actual || 'Not specified'}

[ADDITIONAL DETAILS]
${formData.description}
      `.trim();

      const feedbackData = {
        userId: user?.uid || 'anonymous',
        userName: formData.name,
        userEmail: formData.email,
        type: 'bug',
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
          type: 'bug',
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
        steps: '',
        expected: '',
        actual: '',
        description: ''
      });
      setScreenshot(null);
    } catch (err: any) {
      console.error('Error submitting bug report:', err);
      setError(err.message || 'Something went wrong while submitting your bug report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans" id="report-bug-page">
      <div className="max-w-3xl mx-auto">
        {/* Back navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-8"
          id="back-home-link"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden" id="bug-report-form-card">
          <div className="p-6 sm:p-10 border-b border-slate-100 bg-slate-900 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-400">
                <Bug className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Report a Bug</h1>
                <p className="text-slate-400 text-sm mt-1">Help us make NextFlippers flawless. Let us know what isn't working.</p>
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
                  id="bug-success-container"
                >
                  <div className="inline-flex p-4 bg-emerald-50 text-emerald-600 rounded-full mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Report Submitted successfully!</h3>
                  <p className="text-slate-600 mt-2 max-w-md mx-auto">
                    Thank you for your report. Our engineering team has been notified automatically via email and your submission has been logged securely.
                  </p>
                  <div className="mt-8 flex justify-center gap-4">
                    <button 
                      onClick={() => setSuccess(false)}
                      className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all"
                      id="report-another-btn"
                    >
                      Report Another Bug
                    </button>
                    <Link 
                      to="/"
                      className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                      id="go-home-success-btn"
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
                  id="bug-report-form"
                >
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-800 text-sm" id="bug-error-banner">
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
                        id="bug-reporter-name"
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
                        id="bug-reporter-email"
                      />
                    </div>
                  </div>

                  {/* Bug Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bug Summary <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
                      placeholder="e.g. Can't update profile photo in settings"
                      id="bug-title-input"
                    />
                  </div>

                  {/* Steps to Reproduce */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      Steps to Reproduce
                    </label>
                    <textarea 
                      name="steps"
                      rows={3}
                      value={formData.steps}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 resize-none font-mono text-xs"
                      placeholder="1. Go to settings&#10;2. Click upload profile picture&#10;3. Standard image crops fine but fails to save..."
                      id="bug-steps-textarea"
                    />
                  </div>

                  {/* Expected / Actual Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Expected Behavior
                      </label>
                      <textarea 
                        name="expected"
                        rows={2}
                        value={formData.expected}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 resize-none"
                        placeholder="What should have happened..."
                        id="bug-expected-textarea"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Actual Behavior
                      </label>
                      <textarea 
                        name="actual"
                        rows={2}
                        value={formData.actual}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 resize-none"
                        placeholder="What actually happened..."
                        id="bug-actual-textarea"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Full Description & Context <span className="text-rose-500">*</span>
                    </label>
                    <textarea 
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-slate-900 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400 resize-none"
                      placeholder="Provide any other helpful environment information, specific page routes, or contextual parameters here..."
                      id="bug-description-textarea"
                    />
                  </div>

                  {/* Screenshot Upload Drag-and-drop zone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Upload Screenshot <span className="text-slate-400 font-normal">(Optional, under 4MB. You can also paste directly from clipboard)</span>
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
                      id="screenshot-dropzone"
                    >
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                        id="bug-screenshot-upload-input"
                      />

                      {screenshot ? (
                        <div className="relative group w-full max-w-sm mt-1" onClick={(e) => e.stopPropagation()} id="uploaded-preview-container">
                          <img 
                            src={screenshot} 
                            alt="Screenshot Preview" 
                            className="rounded-xl border border-slate-200 shadow-sm max-h-60 w-full object-contain mx-auto"
                            id="uploaded-screenshot-img"
                          />
                          <button 
                            type="button"
                            onClick={() => setScreenshot(null)}
                            className="absolute -top-3 -right-3 p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-md hover:scale-105 transition-all"
                            title="Remove Screenshot"
                            id="remove-screenshot-btn"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-2" id="empty-dropzone-prompt">
                          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-3">
                            <Camera className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">Drag your screenshot here, paste, or select</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP formats supported</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100" id="form-actions">
                    <Link 
                      to="/"
                      className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-sm transition-all"
                      id="cancel-bug-btn"
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
                      id="submit-bug-btn"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Submitting Report...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Bug Report
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
