import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, Transaction } from '../types';
import { formatCurrency, calculateCommission, cn, resizeImage, createNotification } from '../lib/utils';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { 
  Shield, DollarSign, ArrowRight, CheckCircle2, 
  Info, AlertCircle, Phone, Globe, Upload, ChevronLeft
} from 'lucide-react';

export default function PaymentInstructions() {
  const { listingId, gigId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [gig, setGig] = useState<any | null>(null);
  const [batchTransactions, setBatchTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentProof, setPaymentProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'binance' | 'crypto'>('bank');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const txIdsParam = searchParams.get('txIds');

        if (txIdsParam) {
          const ids = txIdsParam.split(',');
          const txs = await Promise.all(ids.map(async (id) => {
            const snap = await getDoc(doc(db, 'transactions', id));
            return snap.exists() ? { id: snap.id, ...snap.data() } as Transaction : null;
          }));
          setBatchTransactions(txs.filter(t => t !== null) as Transaction[]);
        } else if (listingId) {
          const docSnap = await getDoc(doc(db, 'listings', listingId));
          if (docSnap.exists()) {
            setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
          }
        } else if (gigId) {
          const docSnap = await getDoc(doc(db, 'gigs', gigId));
          if (docSnap.exists()) {
            setGig({ id: docSnap.id, ...docSnap.data() });
          }
        }
      } catch (error) {
        console.error('Error fetching data for payment:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [listingId, gigId]);

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!listing && !gig && batchTransactions.length === 0) || !paymentProof) {
      alert('Please upload payment proof.');
      return;
    }

    setSubmitting(true);
    try {
      if (batchTransactions.length > 0) {
        // Update all batch transactions with the same proof
        await Promise.all(batchTransactions.map(async (tx) => {
          const txRef = doc(db, 'transactions', tx.id);
          await updateDoc(txRef, {
            paymentProofImage: paymentProof,
            paymentMethod,
            status: 'pending',
            dealStatus: 'payment_pending',
            updatedAt: serverTimestamp(),
          });

          // Notify Admin for each
          await createNotification(
            'admin',
            'New Payment Verification Requested (Batch)',
            `A payment proof has been submitted for batch order involving #${tx.id.slice(-6).toUpperCase()}.`,
            'payment_verification',
            '/admin'
          );
        }));

        alert('Payment proof submitted for all items! Admin will verify soon.');
        navigate('/dashboard/purchases');
      } else {
        const price = listing ? listing.askingPrice : gig.price;
        const { platformFee, transactionFee, total: commissionTotal } = calculateCommission(price);
        const totalAmount = price + commissionTotal;

        const transactionData = {
          listingId: listing?.id || null,
          gigId: gig?.id || null,
          buyerId: user.uid,
          sellerId: listing?.userId || gig?.userId,
          salePrice: price,
          platformFee,
          transactionFee,
          commissionAmount: commissionTotal,
          totalPaid: totalAmount,
          paymentMethod,
          paymentProofImage: paymentProof,
          status: 'pending',
          dealStatus: 'payment_pending',
          type: listing ? 'listing' : 'gig',
          createdAt: serverTimestamp(),
        };

        const txDoc = await addDoc(collection(db, 'transactions'), transactionData);

        // Notify Admin
        await createNotification(
          'admin',
          'New Payment Verification Requested',
          `A new payment proof has been submitted for ${itemTitle} (${formatCurrency(totalAmount)}).`,
          'payment_verification',
          '/admin'
        );

        alert('Payment proof submitted! Admin will verify within 24 hours.');
        navigate(listing ? '/dashboard/purchases' : '/dashboard/purchases');
      }
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      alert('Failed to submit proof.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!listing && !gig && batchTransactions.length === 0) return <div className="p-20 text-center">Item not found.</div>;

  const getPrice = () => {
    if (batchTransactions.length > 0) {
      return batchTransactions.reduce((acc, tx) => acc + tx.salePrice, 0);
    }
    return listing ? listing.askingPrice : gig.price;
  };

  const price = getPrice();
  const { platformFee, transactionFee, total: commissionTotal } = calculateCommission(price);
  const total = price + commissionTotal;

  const itemTitle = batchTransactions.length > 0 
    ? `${batchTransactions.length} Items (Batch Order)` 
    : (listing ? listing.title : gig.title);
  const itemImage = listing ? listing.images[0] : (gig ? gig.images[0] : null);
  const itemSub = batchTransactions.length > 0 
    ? 'Mixed Digital Assets & Services' 
    : (listing ? listing.url : gig.category);
  const backLink = batchTransactions.length > 0
    ? '/cart'
    : (listing ? `/listing/${listing.id}` : `/gig/${gig.id}`);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resized = await resizeImage(file);
        setPaymentProof(resized);
      } catch (error) {
        console.error('Error resizing image:', error);
        alert('Failed to process image.');
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={backLink} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to {listing ? 'Listing' : 'Gig'}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Instructions */}
          <div className="lg:col-span-2 space-y-8">
            <header>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment Instructions</h1>
              <p className="text-gray-500">Follow these steps to complete your {listing ? 'purchase' : 'order'} securely.</p>
            </header>

            {/* Order Summary */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Order Summary
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-4 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden">
                      <img src={itemImage || `https://picsum.photos/seed/${listing?.id || gig?.id}/100/100`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{itemTitle}</div>
                      <div className="text-xs text-gray-400">{itemSub}</div>
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">{formatCurrency(price)}</div>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Platform Fee (5%)</span>
                  <span>{formatCurrency(platformFee)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Transaction Fee</span>
                  <span>{formatCurrency(transactionFee)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-lg font-bold text-gray-900">Total to Pay</span>
                  <span className="text-3xl font-bold text-indigo-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                Choose Payment Method
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { id: 'bank', label: 'Bank Transfer' },
                  { id: 'binance', label: 'Binance ID' },
                  { id: 'crypto', label: 'USDT (TRC20)' },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "py-4 rounded-2xl border-2 font-bold text-sm transition-all",
                      paymentMethod === method.id 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50" 
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    )}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                {paymentMethod === 'bank' && (
                  <>
                    <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">Bank Name</span><div className="font-bold text-gray-900">MCB Bank Limited</div></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">Account Name</span><div className="font-bold text-gray-900">Shahid Mehmood</div></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">Account Number</span><div className="font-bold text-gray-900">1577247951008703</div></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">SWIFT / BIC</span><div className="font-bold text-gray-900">MUCBPKKA</div></div>
                  </>
                )}
                {paymentMethod === 'binance' && (
                  <>
                    <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">Binance Pay ID</span><div className="font-bold text-gray-900">59550427</div></div>
                    <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">Name</span><div className="font-bold text-gray-900">FLIPPERSCLUB</div></div>
                  </>
                )}
                {paymentMethod === 'crypto' && (
                  <div><span className="text-xs font-bold text-gray-400 uppercase block mb-1">USDT (TRC20) Address</span><div className="font-bold text-gray-900 break-all">TTmsy1xKPMVKwXXCUgFJucLBdXA7yVJ4fX</div></div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Proof Upload */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload Proof
              </h2>
              <form onSubmit={handleSubmitProof} className="space-y-6">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Once you've made the transfer, please upload a screenshot of the transaction receipt.
                </p>
                
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Receipt Screenshot</label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(
                      "w-full p-8 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center gap-3",
                      paymentProof 
                        ? "border-green-200 bg-green-50" 
                        : "border-gray-200 bg-gray-50 group-hover:border-indigo-300 group-hover:bg-indigo-50/30"
                    )}>
                      {paymentProof ? (
                        <>
                          <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md">
                            <img src={paymentProof} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-xs font-bold text-green-600">Image selected! Click to change.</span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-gray-400 group-hover:text-indigo-500 transition-colors">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-bold text-gray-900 block">Click to upload screenshot</span>
                            <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !paymentProof}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Proof'}
                  {!submitting && <ArrowRight className="w-5 h-5" />}
                </button>

                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    <span className="font-bold">Important:</span> Do not close this page or refresh until you've submitted the proof. Admin verification takes up to 24 hours.
                  </p>
                </div>
              </form>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
              <div className="text-sm font-bold text-gray-900 mb-2">Need Help?</div>
              <p className="text-xs text-gray-500 mb-4">Chat with our support team on WhatsApp for instant assistance.</p>
              <a
                href="https://wa.me/923057341215"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
              >
                <Phone className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
