import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp, updateDoc, increment, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, Transaction, UserProfile } from '../types';
import { formatCurrency, calculateCommission, cn, resizeImage, createNotification } from '../lib/utils';
import { useAuth } from '../App';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import LoadingScreen from '../components/LoadingScreen';
import { 
  Shield, DollarSign, ArrowRight, CheckCircle2, 
  Info, AlertCircle, Phone, Globe, Upload, ChevronLeft,
  MessageSquare
} from 'lucide-react';

export default function PaymentInstructions() {
  const { listingId, gigId } = useParams();
  const { user, profile } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [gig, setGig] = useState<any | null>(null);
  const [batchTransactions, setBatchTransactions] = useState<Transaction[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentProof, setPaymentProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'binance' | 'crypto'>('bank');
  
  // New State variables for Buyer-Seller contact & Price Negotiation
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [isBargained, setIsBargained] = useState(false);
  const [bargainedInput, setBargainedInput] = useState('');
  const [isContacting, setIsContacting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const txIdsParam = searchParams.get('txIds');
        const listingIdsParam = searchParams.get('listingIds');
        const gigIdsParam = searchParams.get('gigIds');
        let sId = '';

        if (txIdsParam) {
          const ids = txIdsParam.split(',');
          const txs = await Promise.all(ids.map(async (id) => {
            const snap = await getDoc(doc(db, 'transactions', id));
            return snap.exists() ? { id: snap.id, ...snap.data() } as Transaction : null;
          }));
          const filteredTxs = txs.filter(t => t !== null) as Transaction[];
          setBatchTransactions(filteredTxs);
          if (filteredTxs.length > 0) {
            sId = filteredTxs[0].sellerId;
          }
        } else if (listingIdsParam || gigIdsParam) {
          const lIds = listingIdsParam ? listingIdsParam.split(',') : [];
          const gIds = gigIdsParam ? gigIdsParam.split(',') : [];
          
          const items: any[] = [];
          
          if (lIds.length > 0) {
            const fetchedListings = await Promise.all(lIds.map(async (id) => {
              const snap = await getDoc(doc(db, 'listings', id));
              return snap.exists() ? { id: snap.id, type: 'listing', ...snap.data() } : null;
            }));
            items.push(...fetchedListings.filter(i => i !== null));
          }
          
          if (gIds.length > 0) {
            const fetchedGigs = await Promise.all(gIds.map(async (id) => {
              const snap = await getDoc(doc(db, 'gigs', id));
              return snap.exists() ? { id: snap.id, type: 'gig', ...snap.data() } : null;
            }));
            items.push(...fetchedGigs.filter(i => i !== null));
          }
          
          setCartItems(items);
          if (items.length > 0) {
            sId = items[0].userId || items[0].sellerId;
          }
        } else if (listingId) {
          const docSnap = await getDoc(doc(db, 'listings', listingId));
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as Listing;
            setListing(data);
            sId = data.userId;
          }
        } else if (gigId) {
          const docSnap = await getDoc(doc(db, 'gigs', gigId));
          if (docSnap.exists()) {
            const data = { id: docSnap.id, ...docSnap.data() } as any;
            setGig(data);
            sId = data.userId;
          }
        }

        if (sId) {
          const sSnap = await getDoc(doc(db, 'users', sId));
          if (sSnap.exists()) {
            setSellerProfile({ uid: sSnap.id, ...sSnap.data() } as UserProfile);
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

  const handleDirectChat = async () => {
    if (!user) {
      alert('Please login first.');
      return;
    }
    
    let sellerId = '';
    let targetListingId = '';
    let targetListingTitle = '';
    
    if (listing) {
      sellerId = listing.userId;
      targetListingId = listing.id;
      targetListingTitle = listing.title;
    } else if (gig) {
      sellerId = gig.userId;
      targetListingId = gig.id;
      targetListingTitle = gig.title;
    } else if (cartItems.length > 0) {
      sellerId = cartItems[0].userId || cartItems[0].sellerId;
      targetListingId = cartItems[0].id;
      targetListingTitle = cartItems[0].title;
    } else if (batchTransactions.length > 0) {
      sellerId = batchTransactions[0].sellerId;
      targetListingId = batchTransactions[0].listingId || '';
    }

    if (!sellerId) {
      alert('Seller details not found.');
      return;
    }

    if (sellerId === user.uid) {
      alert('You cannot start a chat with yourself.');
      return;
    }

    setIsContacting(true);
    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('buyerId', '==', user.uid),
        where('sellerId', '==', sellerId),
        where('listingId', '==', targetListingId)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        navigate(`/chat/${snapshot.docs[0].id}`);
      } else {
        // Create new chat
        const newChat = await addDoc(collection(db, 'chats'), {
          buyerId: user.uid,
          sellerId: sellerId,
          listingId: targetListingId,
          listingTitle: targetListingTitle || null,
          lastMessage: `Hi, I am ready to order "${targetListingTitle || 'your asset'}". Is it currently active and available?`,
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Could not start direct chat.');
    } finally {
      setIsContacting(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || (!listing && !gig && batchTransactions.length === 0 && cartItems.length === 0) || !paymentProof) {
      alert('Please upload payment proof.');
      return;
    }

    setSubmitting(true);
    try {
      if (batchTransactions.length > 0) {
        const batch = writeBatch(db);
        
        batchTransactions.forEach((tx) => {
          const txRef = doc(db, 'transactions', tx.id);
          batch.update(txRef, {
            paymentProofImage: paymentProof,
            paymentMethod,
            status: 'pending',
            dealStatus: 'payment_pending',
            updatedAt: serverTimestamp(),
          });
        });

        await batch.commit();
        clearCart();

        // Notify Admin for the batch
        await createNotification(
          'admin',
          'New Payment Verification Requested (Batch)',
          `A payment proof has been submitted for a batch order.`,
          'payment_verification',
          '/admin'
        );

        alert('Payment proof submitted for all items! Admin will verify soon.');
        navigate('/dashboard/purchases');
      } else if (cartItems.length > 0) {
        // Create transactions for cart items
        const newTxIds: string[] = [];
        for (const item of cartItems) {
          const priceVal = item.type === 'listing' ? item.askingPrice : item.price;
          const { platformFee: pf, transactionFee: tf, total: commissionTotal } = calculateCommission(priceVal);
          const totalAmount = priceVal + commissionTotal;

          const transactionData = {
            listingId: item.type === 'listing' ? item.id : null,
            gigId: item.type === 'gig' ? item.id : null,
            buyerId: user.uid,
            sellerId: item.userId || item.sellerId,
            salePrice: priceVal,
            platformFee: pf,
            transactionFee: tf,
            commissionAmount: commissionTotal,
            totalPaid: totalAmount,
            paymentMethod,
            paymentProofImage: paymentProof,
            status: 'pending',
            dealStatus: 'payment_pending',
            type: item.type,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          const txDoc = await addDoc(collection(db, 'transactions'), transactionData);
          newTxIds.push(txDoc.id);

          // Notify Seller
          createNotification(
            item.userId || item.sellerId,
            'New Order Received! 📦',
            `You have a new order for "${item.title}". Check your sales dashboard for payment confirmation.`,
            'system',
            '/dashboard/sales'
          ).catch(console.error);
        }

        clearCart();

        // Notify Admin
        await createNotification(
          'admin',
          'New Payment Verification Requested (Cart)',
          `A payment proof has been submitted for ${cartItems.length} items from cart.`,
          'payment_verification',
          '/admin'
        );

        alert('Payment proof submitted for all selected items! Admin will verify soon.');
        navigate('/dashboard/purchases');
      } else {
        // Single item transaction with bargaining support
        const finalPrice = price; // Lexically resolve from render calculation
        const finalPlatformFee = platformFee;
        const finalTransactionFee = transactionFee;
        const finalCommissionAmount = commissionTotal;
        const finalTotalPaid = total;

        const transactionData = {
          listingId: listing?.id || null,
          gigId: gig?.id || null,
          buyerId: user.uid,
          sellerId: listing?.userId || gig?.userId,
          salePrice: finalPrice,
          platformFee: finalPlatformFee,
          transactionFee: finalTransactionFee,
          commissionAmount: finalCommissionAmount,
          totalPaid: finalTotalPaid,
          paymentMethod,
          paymentProofImage: paymentProof,
          status: 'pending',
          dealStatus: 'payment_pending',
          type: listing ? 'listing' : 'gig',
          createdAt: serverTimestamp(),
          isNegotiated: negotiatedValue !== null,
          originalPrice: originalPrice,
        };

        const txDoc = await addDoc(collection(db, 'transactions'), transactionData);
        clearCart();

        // Notify Admin
        await createNotification(
          'admin',
          'New Payment Verification Requested',
          `A new payment proof has been submitted for ${itemTitle} (${formatCurrency(finalTotalPaid)}).`,
          'payment_verification',
          '/admin'
        );

        alert('Payment proof submitted! Admin will verify within 24 hours.');
        navigate('/dashboard/purchases');
      }
    } catch (error) {
      console.error('Error submitting payment proof:', error);
      alert('Failed to submit proof.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!listing && !gig && batchTransactions.length === 0 && cartItems.length === 0) return <div className="p-20 text-center">Item not found.</div>;

  const getOriginalPrice = () => {
    if (batchTransactions.length > 0) {
      return batchTransactions.reduce((acc, tx) => acc + tx.salePrice, 0);
    }
    if (cartItems.length > 0) {
      return cartItems.reduce((acc, item) => acc + (item.askingPrice || item.price), 0);
    }
    return listing ? listing.askingPrice : (gig ? gig.price : 0);
  };

  const originalPrice = getOriginalPrice();
  
  // Verify bargained price input
  const negotiatedValue = isBargained && bargainedInput && Number(bargainedInput) > 0 && Number(bargainedInput) < originalPrice
    ? Number(bargainedInput) 
    : null;

  const price = negotiatedValue !== null ? negotiatedValue : originalPrice;
  const { platformFee, transactionFee, total: commissionTotal } = calculateCommission(price);
  const total = price + commissionTotal;

  const itemTitle = (batchTransactions.length > 0 || cartItems.length > 0)
    ? `${(batchTransactions.length || cartItems.length)} Items (Batch Order)` 
    : (listing ? listing.title : gig.title);
  const itemImage = listing ? listing.images[0] : (gig ? gig.images[0] : (cartItems.length > 0 ? (cartItems[0].images?.[0] || cartItems[0].image) : null));
  const itemSub = (batchTransactions.length > 0 || cartItems.length > 0)
    ? 'Mixed Digital Assets & Services' 
    : (listing ? listing.url : gig.category);
  const backLink = (batchTransactions.length > 0 || cartItems.length > 0)
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

  const getWhatsAppUrl = () => {
    if (!sellerProfile?.whatsappNumber) {
      return 'https://wa.me/923057341215'; // Support fallback
    }
    let num = sellerProfile.whatsappNumber.replace(/[^0-9]/g, '');
    if (num.startsWith('0')) {
      num = '92' + num.substring(1);
    }
    const textMsg = `Assalamu Alaikum / Hello, I am ready to purchase your asset "${itemTitle}". Is it still available?`;
    return `https://wa.me/${num}?text=${encodeURIComponent(textMsg)}`;
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

            {/* Seller Contact & Verification Alert Block */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-6 shadow-sm">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-3 flex-1 text-left">
                  <h3 className="font-extrabold text-amber-950 text-base leading-tight">Verify Asset Availability!</h3>
                  <p className="text-amber-900 text-sm leading-relaxed">
                    Please contact the seller before making the payment to verify that this service/asset (<strong>{itemTitle}</strong>) is active and currently available.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 pt-1">
                    {/* Direct Live Chat Button */}
                    <button
                      type="button"
                      onClick={handleDirectChat}
                      disabled={isContacting}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {isContacting ? 'Opening on-site chat...' : 'Chat on Site'}
                    </button>
                    
                    {/* WhatsApp Chat Button */}
                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      {sellerProfile?.whatsappNumber ? 'Chat on WhatsApp' : 'Contact Support WhatsApp'}
                    </a>
                  </div>
                  
                  {sellerProfile && (
                    <div className="mt-2 text-xs text-amber-900">
                      <strong>Seller Name:</strong> {sellerProfile.name} 
                      {sellerProfile.whatsappNumber && (
                        <span> | <strong>WhatsApp:</strong> {sellerProfile.whatsappNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                  <div className="font-bold text-gray-900">
                    {negotiatedValue !== null ? (
                      <div className="text-right">
                        <span className="text-sm line-through text-gray-400 mr-2">{formatCurrency(originalPrice)}</span>
                        <span className="text-indigo-600">{formatCurrency(price)}</span>
                      </div>
                    ) : (
                      formatCurrency(price)
                    )}
                  </div>
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
                  <span className="text-3xl font-bold text-indigo-600">
                    {formatCurrency(total)}
                  </span>
                </div>

                {/* Bargaining / Discount System integration */}
                {(!batchTransactions.length && !cartItems.length) && (
                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 text-left">
                        <label className="text-sm font-extrabold text-gray-900 block">Apply Negotiated / Bargained Price?</label>
                        <span className="text-xs text-gray-400 block">If you have negotiated a discount with the seller, you can apply and enter the agreed price here.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBargained(!isBargained);
                          if (isBargained) setBargainedInput('');
                        }}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2",
                          isBargained ? 'bg-indigo-600' : 'bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isBargained ? 'translate-x-5' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>

                    <AnimatePresence>
                      {isBargained && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-3"
                        >
                          <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                              </div>
                              <input
                                type="number"
                                value={bargainedInput}
                                onChange={(e) => setBargainedInput(e.target.value)}
                                placeholder={`Enter discounted price (original: ${originalPrice})`}
                                className="block w-full pl-8 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm font-bold text-left"
                                min="1"
                                max={originalPrice - 1}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-400 sm:text-sm">USD</span>
                              </div>
                            </div>
                            {negotiatedValue && negotiatedValue > 0 && negotiatedValue < originalPrice && (
                              <div className="text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded-xl shrink-0">
                                Discount: {((1 - negotiatedValue / originalPrice) * 100).toFixed(0)}% Off!
                              </div>
                            )}
                          </div>
                          {Number(bargainedInput) >= originalPrice && (
                            <p className="text-xs text-amber-600 font-bold text-left">
                              The bargained price must be less than the original price.
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 text-left">
                            * Note: The administrator will review your chat history and messages with the seller to verify the discounted/negotiated price upon verifying your payment proof.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
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
                  { id: 'bank', label: 'Bank Transfer', icon: DollarSign },
                  { id: 'binance', label: 'Binance ID', icon: DollarSign },
                  { id: 'crypto', label: 'USDT (TRC20)', icon: Globe },
                ].map(method => (
                  <button
                    type="button"
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 font-bold text-sm transition-all",
                      paymentMethod === method.id 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-lg shadow-indigo-50" 
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    )}
                  >
                    <method.icon className="w-6 h-6" />
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

          {/* Right Column: Proof Upload or Stripe Button */}
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
                  {submitting ? 'Processing...' : 'Submit Proof'}
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
