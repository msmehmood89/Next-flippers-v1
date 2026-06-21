import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Loader2, ClipboardCheck, ArrowRightCircle, Check, 
  HelpCircle, AlertCircle, FileText, TrendingUp, DollarSign, Award, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  formData: {
    title: string;
    type: string;
    category?: string;
    platform?: string;
    askingPrice?: number;
    monthlyRevenue?: number;
    monthlyProfit?: number;
    monthlyTraffic?: number;
    siteAge?: number;
    subscribers?: number;
    watchTime?: number;
    isMonetized?: boolean;
    followers?: number;
    totalLikes?: number;
    validityPeriod?: string;
    accountType?: string;
    includedAssets?: string[];
  };
}

interface GenerationStyles {
  style1_professional: string;
  style2_investor: string;
  style3_premium: string;
  style4_modern: string;
  style5_html: string;
}

const STEPS = [
  { message: "Analyzing listing metrics & category rules...", duration: 1500 },
  { message: "Drafting premium marketing angles...", duration: 2000 },
  { message: "Formatting HTML templates and metric tables...", duration: 1500 },
  { message: "Perfecting sales copy styles & proofreading...", duration: 1500 }
];

export default function AIDescriptionModal({ isOpen, onClose, onApply, formData }: AIDescriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [generatedStyles, setGeneratedStyles] = useState<GenerationStyles | null>(null);
  const [activeTab, setActiveTab] = useState<keyof GenerationStyles>('style1_professional');
  const [copied, setCopied] = useState(false);

  // Custom user context fields
  const [extraContext, setExtraContext] = useState({
    businessOverview: '',
    strengths: '',
    opportunities: '',
    reasonForSelling: '',
    idealBuyer: ''
  });

  const handleGenerate = async () => {
    setLoading(true);
    setErrorString(null);
    setLoadingMessageIndex(0);

    // Message cycler
    const timer = setInterval(() => {
      setLoadingMessageIndex(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      const response = await fetch('/api/gemini/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          extraContext
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate description");
      }

      setGeneratedStyles(data.descriptionStyles);
      setActiveTab('style1_professional');
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || 'Verification failure or service overload. Please try again.');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedStyles) return;
    onApply(generatedStyles[activeTab]);
    onClose();
  };

  const handleCopy = () => {
    if (!generatedStyles) return;
    navigator.clipboard.writeText(generatedStyles[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabLabel = (key: keyof GenerationStyles) => {
    switch(key) {
      case 'style1_professional': return '💼 Professional';
      case 'style2_investor': return '📈 Investor-Focused';
      case 'style3_premium': return '🔥 Premium Copy';
      case 'style4_modern': return '🚀 Start-up';
      case 'style5_html': return '💻 HTML Outline';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] border border-slate-100"
          id="ai-copwriter-modal-container"
        >
          {/* Left panel: Info & Context Fields */}
          <div className="w-full md:w-2/5 bg-slate-50 p-6 overflow-y-auto border-r border-slate-100 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 leading-none">AI Copywriter</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Listing Enhancer Engine</p>
                </div>
              </div>

              {/* Data pills to show what AI has automatically grabbed */}
              <div className="bg-slate-100 p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Autodetected Metrics:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-slate-600 truncate">
                    <span className="text-slate-400 text-[10px] block">Asset Title</span>
                    <strong className="text-slate-700">{formData.title || 'Untitled Asset'}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-slate-600">
                    <span className="text-slate-400 text-[10px] block">Asking Price</span>
                    <strong className="text-slate-700">{formData.askingPrice ? `$${formData.askingPrice}` : 'Open Offer'}</strong>
                  </div>
                  {formData.monthlyRevenue ? (
                    <div className="bg-white p-2 rounded-xl border border-slate-200/60 text-slate-600 col-span-2 flex justify-between items-center">
                      <div>
                        <span className="text-slate-400 text-[10px]">Monthly Revenue</span>
                        <strong className="text-slate-700 block">${formData.monthlyRevenue}</strong>
                      </div>
                      {formData.monthlyProfit ? (
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px]">Net Profit</span>
                          <strong className="text-green-600 block">${formData.monthlyProfit}</strong>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Form Input Context fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Provide Optional Context (Enhancers)</h4>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex justify-between">
                    <span>What does the business do?</span>
                    <span className="text-slate-300 font-normal">Optional</span>
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none h-16"
                    placeholder="e.g., A SaaS company helping marketers automate content scheduled on Reddit."
                    value={extraContext.businessOverview}
                    onChange={(e) => setExtraContext({...extraContext, businessOverview: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex justify-between">
                    <span>Key Strengths & Assets Included</span>
                    <span className="text-slate-300 font-normal">Optional</span>
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none h-16"
                    placeholder="e.g., 50% profit margin, codebase is fully decoupled, domain value is strong."
                    value={extraContext.strengths}
                    onChange={(e) => setExtraContext({...extraContext, strengths: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex justify-between">
                    <span>Reason for Selling</span>
                    <span className="text-slate-300 font-normal">Optional</span>
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none h-12"
                    placeholder="e.g., Lack of time to commit to daily marketing."
                    value={extraContext.reasonForSelling}
                    onChange={(e) => setExtraContext({...extraContext, reasonForSelling: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex justify-between">
                    <span>Growth Opportunities</span>
                    <span className="text-slate-300 font-normal">Optional</span>
                  </label>
                  <textarea 
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all resize-none h-12"
                    placeholder="e.g., Launching paid SEO strategy, setting up affiliate networks."
                    value={extraContext.opportunities}
                    onChange={(e) => setExtraContext({...extraContext, opportunities: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200/60 mt-6">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-extrabold text-sm py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-indigo-900 focus:ring-4 focus:ring-indigo-100 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deep Thinking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Generate Premium Listings</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right panel: Output Results/Previews */}
          <div className="w-full md:w-3/5 p-6 flex flex-col justify-between h-full bg-white relative">
            <button 
              type="button" 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5 flex items-center justify-center" />
            </button>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                  <Sparkles className="w-5 h-5 text-indigo-400 absolute top-3.5 left-3.5 animate-pulse" />
                </div>
                <div className="text-center max-w-sm">
                  <h4 className="font-bold text-slate-800 text-sm">Drafting Five Unique Styles</h4>
                  <p className="text-xs text-slate-400 italic mt-1 min-h-[20px] transition-all duration-300">
                    {STEPS[loadingMessageIndex].message}
                  </p>
                </div>
              </div>
            ) : errorString ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center px-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-full">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="max-w-md">
                  <h4 className="font-black text-slate-800">Generation Interrupted</h4>
                  <p className="text-xs text-slate-500 mt-1">{errorString}</p>
                  <button 
                    type="button"
                    onClick={handleGenerate}
                    className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Try Request Again
                  </button>
                </div>
              </div>
            ) : generatedStyles ? (
              <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                <div className="mb-4">
                  <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                    <span>Generated Copy variants</span>
                    <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-lg border border-green-200 uppercase font-black tracking-widest leading-none">Drafts Ready</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Select whichever best matches your strategic layout and buyer persona.</p>
                </div>

                {/* Tab layout */}
                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl mb-4 overflow-x-auto">
                  {(Object.keys(generatedStyles) as Array<keyof GenerationStyles>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      type="button"
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                        activeTab === key
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tabLabel(key)}
                    </button>
                  ))}
                </div>

                {/* Main scrollable body area */}
                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50 font-medium text-slate-700 text-sm leading-relaxed mb-4 relative">
                  {activeTab === 'style5_html' ? (
                    <div 
                      className="bg-white rounded-xl shadow-inner min-h-full overflow-x-auto p-4 border border-slate-200/60"
                      dangerouslySetInnerHTML={{ __html: generatedStyles[activeTab] }}
                    />
                  ) : (
                    <div className="markdown-body prose max-w-none text-slate-800">
                      <ReactMarkdown>{generatedStyles[activeTab]}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Footer action buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors border border-slate-200/40"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied text!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Copy Version</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-white text-slate-400 text-xs font-black hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApply}
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/10"
                    >
                      <span>Apply to Listing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4 min-h-[300px]">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl">
                  <Sparkles className="w-8 h-8 animate-pulse text-indigo-500" />
                </div>
                <div className="max-w-xs">
                  <h4 className="font-extrabold text-slate-800 text-base">Write Perfect Copy with AI</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Build instant buyer trust. Leverage deep industry prompts to highlight metrics and design details professionally.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg shadow-indigo-600/15"
                  >
                    <span>Click to Kickstart Generation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
