import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction, Listing, UserProfile } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion } from 'motion/react';
import LoadingScreen from '../components/LoadingScreen';
import { 
  ShieldCheck, Download, Printer, ChevronLeft, 
  CheckCircle2, Clock, Globe, Mail, Phone, ExternalLink
} from 'lucide-react';

export default function Receipt() {
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!transactionId) return;
      try {
        const txSnap = await getDoc(doc(db, 'transactions', transactionId));
        if (txSnap.exists()) {
          const txData = { id: txSnap.id, ...txSnap.data() } as Transaction;
          setTransaction(txData);

          // Fetch asset
          if (txData.listingId) {
            const listingSnap = await getDoc(doc(db, 'listings', txData.listingId));
            if (listingSnap.exists()) {
              setListing({ id: listingSnap.id, ...listingSnap.data() } as Listing);
            }
          } else if (txData.gigId) {
            const gigSnap = await getDoc(doc(db, 'gigs', txData.gigId));
            if (gigSnap.exists()) {
              setListing({ id: gigSnap.id, ...gigSnap.data() } as any);
            }
          }

          // Fetch seller
          const sellerSnap = await getDoc(doc(db, 'users', txData.sellerId));
          if (sellerSnap.exists()) {
            setSeller({ uid: sellerSnap.id, ...sellerSnap.data() } as UserProfile);
          }
        }
      } catch (error) {
        console.error('Error fetching receipt data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transactionId]);

  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      alert("Printing is blocked in this view. Please open the app in a new tab to print.");
    }
  };

  const handleDownload = () => {
    const content = `
      Next Flippers Receipt
      Transaction ID: ${transaction.id}
      Date: ${new Date(transaction.createdAt?.toDate()).toLocaleString()}
      Item: ${listing?.title || 'Digital Asset'}
      Total Paid: ${formatCurrency(transaction.totalPaid)}
      Status: ${transaction.status}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${transaction.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingScreen />;
  if (!transaction) return <div className="p-20 text-center">Transaction not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-20 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/dashboard/purchases" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors mb-8 print:hidden">
          <ChevronLeft className="w-4 h-4" />
          Back to Purchases
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none"
        >
          {/* Receipt Header */}
          <div className="bg-indigo-600 p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tight">Next Flippers</span>
              </div>
              <h1 className="text-3xl font-black">Official Receipt</h1>
              <p className="text-indigo-100 mt-1 font-medium">Transaction ID: {transaction.id.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md text-xs font-black uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" />
                Payment Verified
              </div>
              <div className="mt-4 text-indigo-100 text-sm font-medium">
                Issued on {new Date(transaction.createdAt?.toDate()).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-10 space-y-10">
            {/* Item Details */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-gray-100">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <img src={listing?.images[0] || `https://picsum.photos/seed/${listing?.id}/200/200`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 mb-1">{listing?.title || 'Digital Asset'}</h2>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <Globe className="w-4 h-4" />
                    {listing?.url || 'Service Order'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
                <div className="text-lg font-black text-green-600 uppercase tracking-widest">{transaction.status}</div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Payment Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Sale Price</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(transaction.salePrice)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Platform Fee (5%)</span>
                    <span className="text-gray-900 font-bold">{formatCurrency(transaction.platformFee || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-lg font-black text-gray-900">Total Paid</span>
                    <span className="text-2xl font-black text-indigo-600">{formatCurrency(transaction.totalPaid)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Payment Destination</h3>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    {transaction.paymentMethod === 'bank' ? 'Bank Transfer' : 
                     transaction.paymentMethod === 'binance' ? 'Binance Pay' : 'USDT (TRC20)'}
                  </div>
                  {transaction.paymentMethod === 'bank' && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MCB Bank Limited</div>
                      <div className="text-sm font-bold text-gray-900">1577247951008703</div>
                      <div className="text-[10px] font-bold text-gray-500">Shahid Mehmood</div>
                    </div>
                  )}
                  {transaction.paymentMethod === 'binance' && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Binance Pay ID</div>
                      <div className="text-sm font-bold text-gray-900">59550427</div>
                      <div className="text-[10px] font-bold text-gray-500">NEXT FLIPPERS</div>
                    </div>
                  )}
                  {transaction.paymentMethod === 'crypto' && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">USDT (TRC20) Address</div>
                      <div className="text-[11px] font-bold text-gray-900 break-all">TTmsy1xKPMVKwXXCUgFJucLBdXA7yVJ4fX</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Seller Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-sm border border-gray-100">
                    {seller?.name?.[0] || 'S'}
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900">{seller?.name}</div>
                    <div className="text-xs text-gray-400 font-bold">@{seller?.username}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {seller?.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {seller?.whatsappNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center space-y-4">
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                This is a computer-generated receipt and does not require a physical signature. 
                Next Flippers Escrow ensures that your funds are safe until the asset transfer is complete.
              </p>
              <div className="flex items-center justify-center gap-6 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 text-sm font-black text-indigo-600 hover:underline"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 text-sm font-black text-indigo-600 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt (.txt)
                </button>
              </div>
              <p className="text-[10px] text-amber-600 font-bold mt-4 print:hidden">
                Note: If buttons don't work, please open the application in a new tab or take a screenshot of this receipt.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Support Link */}
        <div className="mt-10 text-center print:hidden">
          <p className="text-sm text-gray-500 font-medium">
            Having trouble with this order? <Link to="/support" className="text-indigo-600 font-black hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
