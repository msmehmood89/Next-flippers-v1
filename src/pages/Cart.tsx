import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { useCart } from '../contexts/CartContext';
import { formatCurrency, cn, createNotification } from '../lib/utils';
import { 
  Trash2, ShoppingBag, ArrowRight, ShieldCheck, 
  CreditCard, Globe, Briefcase, AlertCircle, DollarSign 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function Cart() {
  const { user, profile } = useAuth();
  const { cart, removeFromCart, clearCart, cartCount } = useCart();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'binance' | 'crypto'>('bank');

  const total = cart.reduce((acc, item) => acc + item.price, 0);
  const platformFee = total * 0.05; // 5% total platform fee example
  const finalTotal = total + platformFee;

  const handleCheckout = async () => {
    if (!user || cart.length === 0) return;

    setIsProcessing(true);
    try {
      const transactions = [];

      for (const item of cart) {
        const transData = {
          listingId: item.type === 'listing' ? item.id : null,
          gigId: item.type === 'gig' ? item.id : null,
          buyerId: user.uid,
          sellerId: item.sellerId,
          salePrice: item.price,
          platformFee: item.price * 0.05,
          commissionAmount: item.price * 0.1, // 10% example commission
          totalPaid: item.price * 1.05,
          paymentMethod,
          dealStatus: 'payment_pending',
          status: 'pending',
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'transactions'), transData);
        transactions.push({ id: docRef.id, ...item });

        // Notify Seller
        await createNotification(
          item.sellerId,
          'New Order Received! 📦',
          `You have a new order for "${item.title}". Check your sales dashboard for payment confirmation.`,
          'system',
          '/dashboard/sales'
        );
      }

      // Final notification for user
      await createNotification(
        user.uid,
        'Checkout Successful! 🎉',
        `Your order for ${cart.length} items has been placed. Please follow the individual payment instructions.`,
        'system',
        '/dashboard/purchases'
      );

      clearCart();
      
      // Navigate to payment instructions with all transaction IDs
      const txIds = transactions.map(t => t.id).join(',');
      navigate(`/payment/instructions?txIds=${txIds}`);

    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong during checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-8 max-w-xs leading-relaxed">
          Looks like you haven't added anything to your cart yet. Explore our marketplace for digital assets.
        </p>
        <Link 
          to="/browse" 
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Start Browsing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items List */}
        <div className="flex-grow space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
              <p className="text-gray-500 mt-1 font-medium">{cartCount} items in your basket</p>
            </div>
            <button 
              onClick={() => {
                if(window.confirm('Clear all items from your cart?')) clearCart();
              }}
              className="text-xs font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          </header>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-6 group"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      {item.type === 'listing' ? (
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {item.type === 'listing' ? 'Digital Asset' : 'Freelance Service'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">Order individual protection from our manual escrow</p>
                  </div>

                  <div className="text-right flex flex-col items-end gap-3">
                    <div className="text-xl font-black text-gray-900">{formatCurrency(item.price)}</div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Secure Info */}
          <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 flex items-start gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-black text-indigo-900 tracking-tight">Escrow Protection Active</h4>
              <p className="text-sm text-indigo-700/70 leading-relaxed mt-1">
                Every item you buy is protected by Next Flippers Manual Escrow. Your funds are held securely until you confirm receipt of the digital assets or service completion.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-96">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 sticky top-24 space-y-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium font-medium">Platform Fees (5%)</span>
                <span className="font-bold text-gray-900">{formatCurrency(platformFee)}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-base font-black text-gray-900">Total</span>
                <span className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Choose Multi-Payment Method</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'bank', label: 'Local Bank / JazzCash', icon: CreditCard },
                  { id: 'binance', label: 'Binance Pay', icon: DollarSign },
                  { id: 'crypto', label: 'USDT (TRC-20)', icon: Globe },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-2xl border text-left transition-all",
                      paymentMethod === method.id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                        : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200"
                    )}
                  >
                    <method.icon className={cn("w-5 h-5", paymentMethod === method.id ? "text-white" : "text-gray-400")} />
                    <span className="text-sm font-bold">{method.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 italic mt-2">
                * checkout creates individual transactions. You will pay for each item to our admin account.
              </p>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Secure Checkout
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-6 pt-4">
              <img src="https://img.icons8.com/color/48/visa.png" className="h-6 grayscale opacity-30" alt="Visa" />
              <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6 grayscale opacity-30" alt="Mastercard" />
              <img src="https://img.icons8.com/fluency/48/binance.png" className="h-6 grayscale opacity-30" alt="Binance" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
