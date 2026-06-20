import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, query, getDocs, doc, updateDoc, 
  deleteDoc, orderBy, limit, where, getDoc, addDoc, serverTimestamp, Timestamp, increment 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, UserProfile, Transaction, Gig } from '../types';
import { useAuth } from '../App';
import { 
  Users, LayoutGrid, DollarSign, Settings, 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  Search, Filter, ExternalLink, Trash2, Shield,
  TrendingUp, TrendingDown, Activity, MoreVertical,
  Briefcase, MessageSquare, Globe, Phone, Mail, X, User as UserIcon,
  Send, Download, Image as ImageIcon, Star, Bell, Bug, Lightbulb
} from 'lucide-react';
import { formatCurrency, cn, createNotification } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ProfileAvatar from '../components/ProfileAvatar';
import ProfessionalReceiptCard from '../components/ProfessionalReceiptCard';
import { emailService } from '../services/emailService';

export default function AdminDashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'gigs' | 'users' | 'payments' | 'deals' | 'tickets' | 'feedback'>('overview');
  const [listings, setListings] = useState<Listing[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [selectedPaymentImage, setSelectedPaymentImage] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  
  // Custom states for Admin Funds Release Modal
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [releasingTransId, setReleasingTransId] = useState<string | null>(null);
  const [recipientAccount, setRecipientAccount] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [payoutTrxId, setPayoutTrxId] = useState('');
  const [payoutScreenshot, setPayoutScreenshot] = useState('');
  const [memoNotes, setMemoNotes] = useState('');
  const [isSubmittingRelease, setIsSubmittingRelease] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountTitle, setAccountTitle] = useState('EasyPaisa');
  const [payoutPlatformFee, setPayoutPlatformFee] = useState('');
  const [payoutTransactionFee, setPayoutTransactionFee] = useState('0');

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalGigs: 0,
    pendingListings: 0,
    totalVolume: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsSnap, gigsSnap, usersSnap, transSnap, ticketsSnap, feedbackSnap] = await Promise.all([
          getDocs(query(collection(db, 'listings'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'gigs'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')))
        ]);

        const listingsData = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
        const gigsData = gigsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gig));
        const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        const transData = transSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        const ticketsData = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const feedbackData = feedbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setListings(listingsData);
        setGigs(gigsData);
        setUsers(usersData);
        setTransactions(transData);
        setTickets(ticketsData);
        setFeedback(feedbackData);

        setStats({
          totalUsers: usersData.length,
          totalListings: listingsData.length,
          totalGigs: gigsData.length,
          pendingListings: listingsData.filter(l => l.status === 'pending').length,
          totalVolume: transData.filter(t => t.status === 'completed').reduce((acc, t) => acc + t.totalPaid, 0),
          pendingPayments: transData.filter(t => t.status === 'pending').length
        });

      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleUpdateListingStatus = async (id: string, status: Listing['status'], feedback?: string) => {
    try {
      const listingRef = doc(db, 'listings', id);
      const listingSnap = await getDoc(listingRef);
      const listingData = listingSnap.data() as Listing;

      const updates: any = { status };
      if (feedback !== undefined) {
        updates.adminFeedback = feedback;
      }

      await updateDoc(listingRef, updates);
      setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

      // Get user email for email notification
      const userProfile = users.find(u => u.uid === listingData.userId);
      if (userProfile?.email && status === 'approved') {
        await emailService.sendApproval(userProfile.email, listingData.title, 'listing');
      }

      let subTitle = 'Listing Approved! 🎉';
      if (status === 'rejected') subTitle = 'Listing Rejected ❌';
      if (status === 'changes_required') subTitle = 'Listing Changes Required ⚠️';

      let msg = `Your listing "${listingData.title}" has been approved and is now live.`;
      if (status === 'rejected') {
        msg = `Your listing "${listingData.title}" has been rejected. ${feedback ? `Feedback: ${feedback}` : 'Please check the guidelines.'}`;
      } else if (status === 'changes_required') {
        msg = `Your listing "${listingData.title}" requires changes before being approved. ${feedback ? `Details: ${feedback}` : ''}`;
      }

      // Send notification to user
      await addDoc(collection(db, 'notifications'), {
        userId: listingData.userId,
        title: subTitle,
        message: msg,
        type: status === 'approved' ? 'listing_approved' : 'listing_rejected',
        link: '/dashboard/listings',
        isRead: false,
        createdAt: serverTimestamp(),
      });
      alert(`Listing marked as ${status} successfully.`);
    } catch (error) {
      console.error('Error updating listing status:', error);
      alert('Failed to update listing status.');
    }
  };

  const handleUpdateGigStatus = async (id: string, status: Gig['status'], feedback?: string) => {
    try {
      const gigRef = doc(db, 'gigs', id);
      const gigSnap = await getDoc(gigRef);
      const gigData = gigSnap.data() as Gig;

      const updates: any = { status };
      if (feedback !== undefined) {
        updates.adminFeedback = feedback;
      }

      await updateDoc(gigRef, updates);
      setGigs(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));

      // Get user email for email notification
      const userProfile = users.find(u => u.uid === gigData.userId);
      if (userProfile?.email && status === 'active') {
        await emailService.sendApproval(userProfile.email, gigData.title, 'gig');
      }

      let subTitle = 'Gig Approved! 🚀';
      if (status === 'rejected') subTitle = 'Gig Rejected ❌';
      if (status === 'changes_required') subTitle = 'Gig Changes Required ⚠️';

      let msg = `Your gig "${gigData.title}" has been approved and is now live.`;
      if (status === 'rejected') {
        msg = `Your gig "${gigData.title}" has been rejected. ${feedback ? `Feedback: ${feedback}` : 'Please check the guidelines.'}`;
      } else if (status === 'changes_required') {
        msg = `Your gig "${gigData.title}" requires changes. ${feedback ? `Details: ${feedback}` : ''}`;
      }

      // Send notification to user
      await addDoc(collection(db, 'notifications'), {
        userId: gigData.userId,
        title: subTitle,
        message: msg,
        type: status === 'active' ? 'listing_approved' : 'listing_rejected',
        link: '/dashboard/gigs',
        isRead: false,
        createdAt: serverTimestamp(),
      });
      alert(`Gig marked as ${status} successfully.`);
    } catch (error) {
      console.error('Error updating gig status:', error);
      alert('Failed to update gig status.');
    }
  };

  const promptListingRejection = async (id: string) => {
    const reason = window.prompt("Enter rejection feedback/reason:");
    if (reason === null) return;
    await handleUpdateListingStatus(id, 'rejected', reason);
  };

  const promptListingChangesRequired = async (id: string) => {
    const reason = window.prompt("Enter detailed requirements for changes:");
    if (reason === null) return;
    if (reason.trim() === '') {
      alert("Changes details are required!");
      return;
    }
    await handleUpdateListingStatus(id, 'changes_required', reason);
  };

  const promptGigRejection = async (id: string) => {
    const reason = window.prompt("Enter rejection feedback/reason:");
    if (reason === null) return;
    await handleUpdateGigStatus(id, 'rejected', reason);
  };

  const promptGigChangesRequired = async (id: string) => {
    const reason = window.prompt("Enter detailed requirements for changes:");
    if (reason === null) return;
    if (reason.trim() === '') {
      alert("Changes details are required!");
      return;
    }
    await handleUpdateGigStatus(id, 'changes_required', reason);
  };

  const handleChatWithUser = async (targetUserId: string, listingId?: string, listingTitle?: string) => {
    if (!user) return;
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('buyerId', '==', user.uid),
        where('sellerId', '==', targetUserId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        navigate(`/chat/${querySnapshot.docs[0].id}`);
      } else {
        const newChat = {
          buyerId: user.uid,
          sellerId: targetUserId,
          listingId: listingId || 'admin_chat',
          listingTitle: listingTitle || 'Admin Support',
          createdAt: serverTimestamp(),
          lastMessage: 'Hello, I am the admin. I have some questions regarding your listing.',
          lastMessageAt: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, 'chats'), newChat);
        navigate(`/chat/${docRef.id}`);
      }
    } catch (error) {
      console.error('Error starting admin chat:', error);
    }
  };

  const handleUpdateTransactionStatus = async (id: string, status: Transaction['status'], dealStatus?: Transaction['dealStatus']) => {
    try {
      const transRef = doc(db, 'transactions', id);
      const transSnap = await getDoc(transRef);
      const transData = transSnap.data() as Transaction;

      const updateData: any = { status };
      if (dealStatus) {
        updateData.dealStatus = dealStatus;
        if (dealStatus === 'payment_secured') {
          updateData.status = 'processing';
        }
        if (dealStatus === 'completed') {
          updateData.status = 'completed';
          updateData.sellerPaid = true;
          updateData.sellerPaidAt = serverTimestamp();

          // Update Seller Stats on completion
          const sellerRef = doc(db, 'users', transData.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            await updateDoc(sellerRef, {
              totalSales: (sellerData.totalSales || 0) + transData.salePrice,
              ordersCompleted: (sellerData.ordersCompleted || 0) + 1,
              websitesSold: (sellerData.websitesSold || 0) + (transData.listingId ? 1 : 0)
            });
          }

          // Update Buyer Stats on completion
          const buyerRef = doc(db, 'users', transData.buyerId);
          const buyerSnap = await getDoc(buyerRef);
          if (buyerSnap.exists()) {
            const buyerData = buyerSnap.data();
            await updateDoc(buyerRef, {
              totalPurchases: (buyerData.totalPurchases || 0) + transData.salePrice,
              websitesBought: (buyerData.websitesBought || 0) + (transData.listingId ? 1 : 0)
            });
          }
        }
      }
      
      await updateDoc(transRef, updateData);
      
      // Get buyer profile for email
      const buyerRef = doc(db, 'users', transData.buyerId);
      const buyerSnap = await getDoc(buyerRef);
      const buyerProfile = buyerSnap.exists() ? buyerSnap.data() as UserProfile : null;

      // Notify parties
      if (dealStatus === 'payment_secured') {
        // Send Invoice Email via Resend
        if (buyerProfile?.email) {
          const itemTitle = transData.type === 'listing' 
            ? listings.find(l => l.id === transData.listingId)?.title || 'Digital Asset'
            : gigs.find(g => g.id === transData.gigId)?.title || 'Digital Service';

          await emailService.sendInvoice(buyerProfile.email, {
            orderId: id.slice(-6).toUpperCase(),
            amount: transData.totalPaid.toString(),
            items: [{ title: itemTitle, price: transData.salePrice.toString() }]
          });
        }

        await createNotification(
          transData.buyerId,
          'Payment Secured! ✅',
          `Your payment for order #${id.slice(-6).toUpperCase()} has been verified and secured in escrow.`,
          'payment_update',
          '/dashboard/purchases'
        );
        await createNotification(
          transData.sellerId,
          'Payment Received (Admin Secured) 💰',
          `Admin has verified the payment for order #${id.slice(-6).toUpperCase()}. You can now start working.`,
          'payment_update',
          '/dashboard/sales'
        );
      } else if (dealStatus === 'in_escrow') {
        await createNotification(
          transData.sellerId,
          'Escrow Locked 🔒',
          `Escrow is now locked for order #${id.slice(-6).toUpperCase()}. Please deliver the assets as soon as possible.`,
          'escrow_update',
          '/dashboard/sales'
        );
      } else if (dealStatus === 'completed') {
        await createNotification(
          transData.buyerId,
          'Deal Marked Completed by Admin! 📦',
          `The admin has marked your deal #${id.slice(-6).toUpperCase()} as completed.`,
          'system',
          '/dashboard/purchases'
        );
        await createNotification(
          transData.sellerId,
          'Deal Marked Completed by Admin! ✅',
          `The admin has marked your deal #${id.slice(-6).toUpperCase()} as completed and released payment.`,
          'system',
          '/dashboard/sales'
        );
      }

      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updateData } : t));
      alert(`Transaction ${status}${dealStatus ? ` and deal status ${dealStatus}` : ''} updated successfully.`);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction.');
    }
  };

  const handleWarnUser = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() as UserProfile;
      const newWarningCount = (userData as any).warningCount || 0 + 1;

      await updateDoc(userRef, { 
        warningCount: increment(1),
        lastWarningAt: serverTimestamp()
      });

      await createNotification(
        uid,
        'Official Warning ⚠️',
        `You have received an official warning from the admin. Multiple warnings may lead to account suspension.`,
        'system',
        '/dashboard/settings'
      );

      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, warningCount: (u as any).warningCount + 1 } : u));
      if (selectedUser?.uid === uid) {
        setSelectedUser(prev => prev ? { ...prev, warningCount: (prev as any).warningCount + 1 } : null);
      }
      alert('Warning issued successfully.');
    } catch (error) {
      console.error('Error warning user:', error);
    }
  };

  const handleRemoveUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to ban this user? They will no longer be able to log in.')) return;
    try {
      await updateDoc(doc(db, 'users', uid), { 
        status: 'inactive',
        isBanned: true
      });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: 'inactive' } : u));
      if (selectedUser?.uid === uid) setSelectedUser(null);
      alert('User has been banned.');
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Are you absolutely sure you want to PERMANENTLY DELETE this user from the system? This action is irreversible.')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
      if (selectedUser?.uid === uid) setSelectedUser(null);
      alert('User document deleted successfully.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    }
  };

  const handlePaySeller = async (
    id: string,
    payoutDetails?: {
      bankAccount: string;
      amount: number;
      trxId: string;
      screenshot: string;
      notes: string;
      accountHolderName?: string;
      accountTitle?: string;
      paymentRefCode?: string;
      platformFee?: number;
      transactionFee?: number;
      payoutMethod?: string;
    }
  ) => {
    try {
      const transRef = doc(db, 'transactions', id);
      const transSnap = await getDoc(transRef);
      if (!transSnap.exists()) return;
      const transData = transSnap.data() as Transaction;

      const details = payoutDetails || {
        bankAccount: 'Specified payout wallet',
        amount: transData.salePrice,
        trxId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        screenshot: '',
        notes: 'Dispatched by Administrator',
        platformFee: transData.salePrice * 0.05,
        transactionFee: 0,
        accountHolderName: '',
        accountTitle: 'EasyPaisa',
        payoutMethod: 'EasyPaisa'
      };

      const updateData = {
        dealStatus: 'payment_released' as const,
        payoutDetails: details,
        paymentReleasedAt: serverTimestamp()
      };
      
      await updateDoc(transRef, updateData);

      // Notify Seller
      await createNotification(
        transData.sellerId,
        'Payout Dispatched! ✉️',
        `Admin has released your payout of ${formatCurrency(details.amount)} for order #${id.slice(-6).toUpperCase()}. Please check your account and click Received.`,
        'payment_released',
        '/dashboard/sales'
      );

      // Notify Buyer
      await createNotification(
        transData.buyerId,
        'Payment Dispatched to Seller! 📢',
        `The escrow payment of ${formatCurrency(details.amount)} for order #${id.slice(-6).toUpperCase()} has been dispatched to the seller's account.`,
        'payout_released',
        '/dashboard/purchases'
      );

      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updateData, paymentReleasedAt: Timestamp.now() } as any : t));
    } catch (error) {
      console.error('Error paying seller:', error);
      alert('Failed to update payout status.');
    }
  };

  const renderTransactionCard = (trans: Transaction) => {
    const buyer = users.find(u => u.uid === trans.buyerId);
    const seller = users.find(u => u.uid === trans.sellerId);
    const listing = listings.find(l => l.id === trans.listingId);
    const gig = gigs.find(g => g.id === trans.listingId);

    return (
      <div key={trans.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
        <div className="flex flex-col lg:flex-row justify-between gap-8 pb-8 border-b border-gray-50">
          {/* Transaction Core Info */}
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {listing?.title || gig?.title || 'Unknown Asset'}
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                Order #{trans.id.slice(-6).toUpperCase()} • {formatCurrency(trans.salePrice)}
              </p>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  trans.status === 'completed' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                )}>
                  Status: {trans.dealStatus?.replace('_', ' ')}
                </span>
                {trans.sellerPaid && (
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Payout Status: Paid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Counterparties */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Buyer</span>
              <div className="flex items-center gap-3">
                <ProfileAvatar src={buyer?.photoURL} gender={buyer?.gender} size="sm" />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-gray-900 truncate">{buyer?.name || 'Unknown'}</div>
                  <button 
                    onClick={() => handleChatWithUser(trans.buyerId)}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    Chat with Buyer
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Seller</span>
              <div className="flex items-center gap-3">
                <ProfileAvatar src={seller?.photoURL} gender={seller?.gender} size="sm" />
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-gray-900 truncate">{seller?.name || 'Unknown'}</div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleChatWithUser(trans.sellerId)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Chat
                    </button>
                    <span className="text-gray-300">|</span>
                    <a href={`https://wa.me/${seller?.whatsappNumber}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-green-600 hover:underline">WA</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Proof Visualization for Admin */}
        {(trans.workProofImage || trans.workProofNotes) && (
          <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 flex flex-col md:flex-row gap-6 mb-6">
             <div className="flex-shrink-0">
               <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Completion Proof</div>
               {trans.workProofImage ? (
                 <a href={trans.workProofImage} target="_blank" rel="noreferrer" className="block w-40 aspect-video rounded-xl overflow-hidden border border-indigo-200">
                   <img src={trans.workProofImage} alt="Work Proof" className="w-full h-full object-cover" />
                 </a>
               ) : (
                 <div className="w-40 aspect-video bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-400">
                   <ImageIcon className="w-8 h-8" />
                 </div>
               )}
             </div>
             <div className="flex-grow">
               <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Seller Notes & Rating</div>
               <div className="text-xs text-indigo-900 bg-white p-4 rounded-xl border border-indigo-100 leading-relaxed italic mb-4">
                 "{trans.workProofNotes || 'No delivery notes provided.'}"
               </div>
               {trans.rating && (
                 <div className="flex items-center gap-3 bg-amber-50 p-3 rounded-xl border border-amber-100">
                   <div className="flex gap-0.5">
                     {[1, 2, 3, 4, 5].map(s => (
                       <Star key={s} className={cn("w-3 h-3", trans.rating! >= s ? "text-amber-500 fill-current" : "text-gray-300")} />
                     ))}
                   </div>
                   <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Buyer Rating: {trans.rating}/5</span>
                   {trans.ratingComment && <span className="text-[10px] text-amber-600 italic">"{trans.ratingComment}"</span>}
                 </div>
               )}
             </div>
           </div>
         )}

         {/* Control Panel for this Deal */}
         <div className="flex flex-col gap-6 pt-4 border-t border-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-4 w-full md:w-auto">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Update Pipeline Status</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'payment_secured', label: 'Payment Secured' },
                  { id: 'assets_delivering', label: 'Assets Delivering' },
                  { id: 'asset_transferred', label: 'Assets Delivered' },
                  { id: 'buyer_confirmed', label: 'Buyer Confirmed' },
                  { id: 'payment_released', label: 'Payment Released' },
                  { id: 'completed', label: 'Completed' },
                ].map(step => (
                  <button
                    key={step.id}
                    onClick={() => handleUpdateTransactionStatus(trans.id, trans.status, step.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      trans.dealStatus === step.id 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                        : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200"
                    )}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex items-center gap-8">
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seller Payout</div>
                <div className="text-xl font-black text-gray-900">{formatCurrency(trans.salePrice)}</div>
              </div>
              
              {trans.dealStatus === 'payment_released' ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs bg-white px-4 py-2 rounded-xl shadow-sm border border-green-100">
                    <CheckCircle2 className="w-4 h-4 animate-pulse" />
                    Payout Released (Awaiting Seller)
                  </div>
                  {trans.payoutDetails && (
                    <span className="text-[9px] text-gray-400 font-bold">To: {trans.payoutDetails.bankAccount}</span>
                  )}
                </div>
              ) : trans.dealStatus === 'completed' || trans.sellerPaid ? (
                <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs bg-white px-4 py-2 rounded-xl shadow-sm border border-green-100">
                  <CheckCircle2 className="w-4 h-4" />
                  Deal Finalized
                </div>
              ) : (
                <button
                  onClick={() => {
                    setReleasingTransId(trans.id);
                    setRecipientAccount('');
                    setAccountHolderName('');
                    setAccountTitle('EasyPaisa');
                    const calculatedPlatformFee = trans.salePrice * 0.05;
                    setPayoutPlatformFee(calculatedPlatformFee.toFixed(2));
                    setPayoutTransactionFee('0');
                    setDisbursedAmount((trans.salePrice - calculatedPlatformFee).toFixed(2));
                    setPayoutTrxId(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
                    setPayoutScreenshot('');
                    setMemoNotes(`Official payout for listing/gig #${trans.id.slice(-6).toUpperCase()}`);
                    setIsReleaseModalOpen(true);
                  }}
                  disabled={trans.dealStatus !== 'buyer_confirmed'}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Release Funds
                </button>
              )}
            </div>
          </div>

          {trans.payoutDetails && (
            <div className="mt-6 flex justify-center">
              <ProfessionalReceiptCard transaction={trans as any} role="admin" />
            </div>
          )}

          {/* Reserve / Refund / Delete Options */}
          <div className="mt-2 pt-4 border-t border-dashed border-gray-100 flex items-center justify-between gap-4">
            <div className="text-[10px] text-gray-400 font-bold italic">
              ⚠️ Reserve administrative actions
            </div>
            <div className="flex items-center gap-2">
              {trans.dealStatus !== 'completed' && trans.dealStatus !== 'refunded' && (
                <button
                  onClick={async () => {
                    if (window.confirm(`Are you absolutely sure you want to CANCEL deal #${trans.id.slice(-6).toUpperCase()} and REFUND the buyer? This action is irreversible.`)) {
                      try {
                        const transRef = doc(db, 'transactions', trans.id);
                        await updateDoc(transRef, {
                          dealStatus: 'refunded',
                          status: 'failed'
                        });

                        // Notify seller
                        await createNotification(
                          trans.sellerId,
                          'Order Cancelled by Admin 🛑',
                          `Order #${trans.id.slice(-6).toUpperCase()} has been cancelled and funds refunded by Admin.`,
                          'order_cancelled',
                          '/dashboard/sales'
                        );

                        // Notify buyer
                        await createNotification(
                          trans.buyerId,
                          'Order Refunded Successfully! 💳',
                          `The admin has processed a refund of ${formatCurrency(trans.totalPaid)} for order #${trans.id.slice(-6).toUpperCase()}.`,
                          'order_refunded',
                          '/dashboard/purchases'
                        );

                        setTransactions(prev => prev.map(t => t.id === trans.id ? { ...t, dealStatus: 'refunded', status: 'failed' } as any : t));
                        alert("The transaction has been successfully cancelled and refunded.");
                      } catch (err) {
                        console.error("Error refunding order:", err);
                        alert("Failed to refund order.");
                      }
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider"
                >
                  Cancel & Refund Order
                </button>
              )}
              <button
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to permanently DELETE deal/order #${trans.id.slice(-6).toUpperCase()}? This will erase it from the platform records completely.`)) {
                    try {
                      await deleteDoc(doc(db, 'transactions', trans.id));
                      setTransactions(prev => prev.filter(t => t.id !== trans.id));
                      alert("Transaction record permanently deleted.");
                    } catch (err) {
                      console.error("Error deleting deal:", err);
                      alert("Failed to delete deal record.");
                    }
                  }
                }}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 transition-all rounded-xl text-[10px] font-black uppercase tracking-wider"
              >
                Delete Deal Record
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleAdminReply = async () => {
    if (!selectedTicket || !adminReply.trim()) return;

    setIsReplying(true);
    try {
      const ticketRef = doc(db, 'support_tickets', selectedTicket.id);
      const newReply = {
        message: adminReply,
        isAdmin: true,
        createdAt: new Date().toISOString(),
      };

      const updatedReplies = [...(selectedTicket.replies || []), newReply];
      
      await updateDoc(ticketRef, { 
        replies: updatedReplies,
        status: 'in-progress',
        updatedAt: serverTimestamp()
      });

      // Send notification to user
      await addDoc(collection(db, 'notifications'), {
        userId: selectedTicket.userId,
        title: 'Support Ticket Update',
        message: `An agent has replied to your ticket: "${selectedTicket.subject}"`,
        type: 'system',
        link: '/support',
        isRead: false,
        createdAt: serverTimestamp()
      });

      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, replies: updatedReplies, status: 'in-progress' } : t));
      setSelectedTicket(prev => ({ ...prev, replies: updatedReplies, status: 'in-progress' }));
      setAdminReply('');
    } catch (error) {
      console.error('Error replying to ticket:', error);
    } finally {
      setIsReplying(false);
    }
  };

  if (!isAdmin) return <div className="p-20 text-center font-bold text-red-600">Access Denied. Admins Only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900">Admin Panel</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'listings', icon: LayoutGrid, label: 'Listings' },
            { id: 'gigs', icon: Briefcase, label: 'Gigs' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'payments', icon: DollarSign, label: 'Payments' },
            { id: 'deals', icon: Globe, label: 'Active Deals' },
            { id: 'tickets', icon: MessageSquare, label: 'Tickets' },
            { id: 'feedback', icon: Bug, label: 'Bugs & Ideas' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === item.id 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold border border-gray-100">
              {(profile?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-gray-900 truncate">{profile?.name || user?.email || 'Admin'}</div>
              <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-10 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-10">
            <header>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Overview</h1>
              <p className="text-gray-500">Real-time stats and platform health.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'indigo' },
                { label: 'Total Listings', value: stats.totalListings, icon: LayoutGrid, color: 'blue' },
                { label: 'Total Gigs', value: stats.totalGigs, icon: Briefcase, color: 'purple' },
                { label: 'Total Volume', value: formatCurrency(stats.totalVolume), icon: DollarSign, color: 'green' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  </div>
                  <div className={cn("p-3 rounded-2xl", `bg-${stat.color}-50 text-${stat.color}-600`)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Recent Activity */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Recent Activity
                </h2>
                <div className="space-y-6">
                  {listings.slice(0, 5).map(listing => (
                    <div key={listing.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{listing.title}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Listing ID: {listing.id.slice(-6).toUpperCase()} • {new Date(listing.createdAt?.toDate()).toLocaleString()}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        listing.status === 'approved' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {listing.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Payments */}
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Pending Payments
                </h2>
                <div className="space-y-6">
                  {transactions.filter(t => t.status === 'pending').slice(0, 5).map(trans => (
                    <div key={trans.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                      <div>
                        <div className="text-sm font-bold text-gray-900">{formatCurrency(trans.totalPaid)}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Order #{trans.id.slice(-6).toUpperCase()} • {new Date(trans.createdAt?.toDate()).toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('payments')}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                  {transactions.filter(t => t.status === 'pending').length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">No pending payments.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-10">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Listings</h1>
                <p className="text-gray-500">Approve, reject, or delete platform listings.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search listings..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider min-w-[200px]">Listing</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Seller</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {listings.map(listing => (
                      <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 max-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              <img src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/100/100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-gray-900 truncate" title={listing.title}>{listing.title}</div>
                              <div className="text-[10px] text-gray-400 font-bold truncate" title={listing.url}>{listing.url}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{listing.userId.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(listing.askingPrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            listing.status === 'approved' ? "bg-green-50 text-green-600" : 
                            listing.status === 'changes_required' ? "bg-purple-50 text-purple-600" :
                            listing.status === 'rejected' ? "bg-red-50 text-red-600" :
                            listing.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"
                          )}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {listing.status !== 'approved' && listing.status !== 'sold' && (
                              <button 
                                onClick={() => handleUpdateListingStatus(listing.id, 'approved')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                title="Approve Listing"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {listing.status !== 'changes_required' && listing.status !== 'sold' && (
                              <button 
                                onClick={() => promptListingChangesRequired(listing.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                                title="Changes Required"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            )}
                            {listing.status !== 'rejected' && listing.status !== 'sold' && (
                              <button 
                                onClick={() => promptListingRejection(listing.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Reject Listing"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <div className="h-4 w-px bg-gray-200 mx-1 animate-pulse" />
                            <button 
                              onClick={() => navigate(`/listing/${listing.id}`)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Full Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleChatWithUser(listing.userId, listing.id, listing.title)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors animate-bounce-short"
                              title="Chat with Seller"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!window.confirm('Are you absolutely sure you want to PERMANENTLY DELETE this listing? This action is irreversible.')) return;
                                try {
                                  await deleteDoc(doc(db, 'listings', listing.id));
                                  setListings(prev => prev.filter(l => l.id !== listing.id));
                                  alert("Listing permanently deleted successfully.");
                                } catch (err: any) {
                                  console.error("Error deleting listing:", err);
                                  alert("Failed to delete listing: " + err.message);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Listing permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gigs' && (
          <div className="space-y-10">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Gigs</h1>
                <p className="text-gray-500">Review and manage freelance services.</p>
              </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider min-w-[200px]">Gig</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Freelancer</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {gigs.map(gig => (
                      <tr key={gig.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 max-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                              <img src={gig.images[0] || `https://picsum.photos/seed/${gig.id}/100/100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-gray-900 truncate" title={gig.title}>{gig.title}</div>
                              <div className="text-[10px] text-gray-400 font-bold truncate">{gig.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{gig.userName}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 whitespace-nowrap">{formatCurrency(gig.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            gig.status === 'active' || gig.status === 'approved' ? "bg-green-50 text-green-600" : 
                            gig.status === 'changes_required' ? "bg-purple-50 text-purple-600" :
                            gig.status === 'rejected' ? "bg-red-50 text-red-600" :
                            gig.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400"
                          )}>
                            {gig.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {gig.status !== 'active' && gig.status !== 'approved' && gig.status !== 'sold' && (
                              <button 
                                onClick={() => handleUpdateGigStatus(gig.id, 'active')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                title="Approve Gig (Activate)"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {gig.status !== 'changes_required' && gig.status !== 'sold' && (
                              <button 
                                onClick={() => promptGigChangesRequired(gig.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                                title="Changes Required"
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            )}
                            {gig.status !== 'rejected' && gig.status !== 'sold' && (
                              <button 
                                onClick={() => promptGigRejection(gig.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="Reject Gig"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <div className="h-4 w-px bg-gray-200 mx-1" />
                            <button 
                              onClick={() => navigate(`/gig/${gig.id}`)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleChatWithUser(gig.userId, gig.id, gig.title)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chat with Freelancer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!window.confirm('Are you absolutely sure you want to PERMANENTLY DELETE this gig? This action is irreversible.')) return;
                                try {
                                  await deleteDoc(doc(db, 'gigs', gig.id));
                                  setGigs(prev => prev.filter(g => g.id !== gig.id));
                                  alert("Gig permanently deleted successfully.");
                                } catch (err: any) {
                                  console.error("Error deleting gig:", err);
                                  alert("Failed to delete gig: " + err.message);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Gig permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-10">
            <header>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
              <p className="text-gray-500">Verify manual escrow payments and release funds.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
              {transactions.map(trans => (
                <div key={trans.id} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setSelectedPaymentImage(trans.paymentProofImage)}>
                      {trans.paymentProofImage ? (
                        <img src={trans.paymentProofImage} alt="Proof" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{formatCurrency(trans.totalPaid)}</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
                        {trans.paymentMethod} • Order #{trans.id.slice(-6).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] text-gray-400">Buyer: <span className="text-gray-900 font-bold">{trans.buyerId.slice(0, 8)}...</span></div>
                        <div className="text-[10px] text-gray-400">Seller: <span className="text-gray-900 font-bold">{trans.sellerId.slice(0, 8)}...</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider",
                      trans.status === 'completed' ? "bg-green-50 text-green-600" : 
                      trans.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                    )}>
                      {trans.status}
                    </div>
                    
                    {trans.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUpdateTransactionStatus(trans.id, 'completed', 'payment_secured')}
                          className="px-6 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                        >
                          Approve Payment
                        </button>
                        <button 
                          onClick={() => handleUpdateTransactionStatus(trans.id, 'failed')}
                          className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {(trans.status === 'completed' || trans.status === 'processing') && (
                      <select
                        className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        value={trans.dealStatus || 'payment_secured'}
                        onChange={(e) => handleUpdateTransactionStatus(trans.id, trans.status, e.target.value as any)}
                      >
                        <option value="payment_secured">Payment Secured</option>
                        <option value="in_escrow">In Escrow</option>
                        <option value="asset_transferred">Asset Transferred</option>
                        <option value="completed">Completed</option>
                        <option value="disputed">Disputed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    )}
                    {trans.status === 'completed' && !trans.dealStatus && (
                      <button 
                        onClick={() => handleUpdateTransactionStatus(trans.id, 'processing', 'in_escrow')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        Start Processing
                      </button>
                    )}
                    <button 
                      onClick={() => handleChatWithUser(trans.buyerId)}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title="Chat with Buyer"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to permanently delete this payment/transaction record? This action cannot be undone.')) return;
                        try {
                          await deleteDoc(doc(db, 'transactions', trans.id));
                          setTransactions(prev => prev.filter(t => t.id !== trans.id));
                          alert("Payment / transaction record permanently deleted.");
                        } catch (err) {
                          console.error('Error deleting transaction/payment:', err);
                          alert('Failed to delete transaction.');
                        }
                      }}
                      className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                      title="Delete Payment Record permanently"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
                  <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">No transactions found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-10">
            <header>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
              <p className="text-gray-500">Manage platform users and their permissions.</p>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider min-w-[180px]">User</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Ratings (S/B/F)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 max-w-[200px]">
                          <div 
                            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => setSelectedUser(u)}
                          >
                            <ProfileAvatar src={u.photoURL} gender={u.gender} size="sm" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-gray-900 truncate" title={u.name || u.email}>{u.name || u.email}</div>
                              <div className="text-[10px] text-gray-400 font-bold truncate">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            u.isAdmin ? "bg-purple-50 text-purple-600" : 
                            u.role === 'seller' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {u.isAdmin ? 'Admin' : u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{u.whatsappNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-center">
                            <div className="flex items-center gap-1 text-amber-500" title="Overall Rating">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-black">{u.rating ? u.rating.toFixed(1) : '5.0'}</span>
                            </div>
                            <div className="flex gap-2">
                               <span className="text-[9px] font-bold text-gray-400" title="Seller / Buyer / Freelancer">
                                 {u.sellerRating?.toFixed(1) || '0'} / {u.buyerRating?.toFixed(1) || '0'} / {u.freelancerRating?.toFixed(1) || '0'}
                               </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedUser(u)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Full Profile"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleChatWithUser(u.uid)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Chat with User"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleWarnUser(u.uid)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Warn User"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRemoveUser(u.uid)}
                              className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Ban User (Mark inactive)"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(u.uid)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Tickets</h1>
                <p className="text-gray-500">Manage and respond to user inquiries.</p>
              </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[150px]">User</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[200px]">Subject</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tickets.map(ticket => (
                      <tr 
                        key={ticket.id} 
                        onClick={() => setSelectedTicket(ticket)}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate" title={ticket.userName || 'Anonymous'}>{ticket.userName || 'Anonymous'}</div>
                          <div className="text-[10px] text-gray-400 font-bold truncate" title={ticket.email || 'No email provided'}>{ticket.email || 'No email provided'}</div>
                        </td>
                        <td className="px-6 py-4 max-w-[250px]">
                          <div className="text-sm font-bold text-gray-900 truncate" title={ticket.subject}>{ticket.subject}</div>
                          <div className="text-[10px] text-gray-400 font-medium truncate" title={ticket.message}>{ticket.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {ticket.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            ticket.status === 'open' ? "bg-amber-100 text-amber-600" :
                            ticket.status === 'in-progress' ? "bg-blue-100 text-blue-600" :
                            ticket.status === 'closed' ? "bg-gray-100 text-gray-600" :
                            "bg-green-100 text-green-600" // resolved
                          )}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                          {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSelectedTicket(ticket)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Details & Reply"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleChatWithUser(ticket.userId)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Reply via Direct Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                const newStatus = ticket.status === 'open' ? 'closed' : 'open';
                                try {
                                  await updateDoc(doc(db, 'support_tickets', ticket.id), { status: newStatus });
                                  setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: newStatus } : t));
                                } catch (err) {
                                  console.error("Error setting status:", err);
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={ticket.status === 'open' ? "Close Ticket" : "Reopen Ticket"}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (window.confirm('Are you absolutely sure you want to permanently delete this support ticket? This action is irreversible.')) {
                                  try {
                                    await deleteDoc(doc(db, 'support_tickets', ticket.id));
                                    setTickets(prev => prev.filter(t => t.id !== ticket.id));
                                    alert("Support ticket permanently deleted.");
                                  } catch (err: any) {
                                    alert("Failed to delete support ticket: " + err.message);
                                  }
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete support ticket permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="text-gray-400 font-bold">No support tickets found.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Bugs & Suggestions</h1>
                <p className="text-gray-500">Track and manage user-reported issues and enhancement requests.</p>
              </div>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Submitted At</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {feedback.map(item => (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedFeedback(item)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.userName || 'Anonymous'}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{item.userEmail || 'No email provided'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {item.type === 'bug' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100/50">
                            <Bug className="w-3 h-3 text-rose-500 shrink-0" />
                            Bug
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                            <Lightbulb className="w-3 h-3 text-indigo-500 shrink-0" />
                            Idea
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{item.title}</div>
                        <div className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{item.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          item.status === 'pending' || !item.status ? "bg-amber-100 text-amber-600" :
                          item.status === 'reviewed' ? "bg-blue-100 text-blue-600" :
                          "bg-green-100 text-green-600" // resolved
                        )}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedFeedback(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                            title="View Feedback Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              const newStatus = (item.status === 'pending' || !item.status) ? 'reviewed' : item.status === 'reviewed' ? 'resolved' : 'pending';
                              await updateDoc(doc(db, 'feedback', item.id), { status: newStatus });
                              setFeedback(prev => prev.map(f => f.id === item.id ? { ...f, status: newStatus } : f));
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                            title="Cycle Status (Pending -> Reviewed -> Resolved)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this report?')) {
                                await deleteDoc(doc(db, 'feedback', item.id));
                                setFeedback(prev => prev.filter(f => f.id !== item.id));
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Delete Report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {feedback.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-400 font-bold">No bug reports or suggestions logged yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTicket(null)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full ring-4",
                    selectedTicket.status === 'open' ? "bg-amber-500 ring-amber-100 animate-pulse" : 
                    selectedTicket.status === 'in-progress' ? "bg-blue-500 ring-blue-100 animate-pulse" :
                    selectedTicket.status === 'closed' ? "bg-gray-400 ring-gray-100" :
                    "bg-green-500 ring-green-100"
                  )} />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Ticket Administration</span>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">Master ID: #{selectedTicket.id.toUpperCase()}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {/* User Info & Session Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-sm text-lg border border-indigo-100">
                      {selectedTicket.userName ? selectedTicket.userName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Ticket Submitter</div>
                      <div className="text-sm font-black text-gray-900">{selectedTicket.userName || 'Anonymous'}</div>
                      <div className="text-xs text-indigo-700 font-bold">{selectedTicket.email || 'No email associated'}</div>
                    </div>
                  </div>
                  <div className="text-left md:text-right border-t md:border-t-0 border-indigo-100 pt-3 md:pt-0">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date Created</div>
                    <div className="text-xs font-bold text-gray-900">
                      {selectedTicket.createdAt?.toDate 
                        ? selectedTicket.createdAt.toDate().toLocaleString() 
                        : (selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'N/A')}
                    </div>
                  </div>
                </div>

                {/* Structured Ticket Details card */}
                <div className="bg-gradient-to-br from-indigo-50/30 via-white to-gray-50/30 rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Support Request Card</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
                      selectedTicket.status === 'open' ? "bg-amber-500" : 
                      selectedTicket.status === 'in-progress' ? "bg-blue-500" :
                      selectedTicket.status === 'closed' ? "bg-gray-500" :
                      "bg-green-600"
                    )}>
                      {selectedTicket.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-gray-500">
                    <div className="p-3 bg-white/80 rounded-xl border border-gray-100">
                      <span className="block text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Category</span>
                      <span className={cn(
                        "inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-widest mt-0.5",
                        selectedTicket.category === 'billing' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        selectedTicket.category === 'technical' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                        selectedTicket.category === 'report' ? "bg-orange-50 text-orange-700 border border-orange-100" :
                        selectedTicket.category === 'general' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                        "bg-gray-50 text-gray-700 border border-gray-100"
                      )}>
                        {selectedTicket.category === 'billing' ? "💼 Billing & Payments" :
                         selectedTicket.category === 'technical' ? "⚙️ Technical Issue" :
                         selectedTicket.category === 'report' ? "⚠️ Report User" :
                         selectedTicket.category === 'general' ? "ℹ️ General Inquiry" :
                         `📁 ${selectedTicket.category || 'Other'}`}
                      </span>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-gray-100">
                      <span className="block text-[9px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Urgency Level</span>
                      <span className="inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-widest mt-0.5 bg-red-50 text-red-700 border border-red-100">
                        ⚡ {selectedTicket.priority || 'medium'} priority
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <span className="block text-[9px] uppercase font-black text-indigo-600 tracking-widest">Subject Of Discussion</span>
                    <h4 className="text-base font-extrabold text-gray-900 leading-snug">{selectedTicket.subject}</h4>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-[9px] uppercase font-black text-gray-400 tracking-widest ml-1">Original Issue Details</span>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap relative italic">
                      <span className="absolute -top-3 left-4 text-4xl text-indigo-200/50 font-serif translate-y-1">“</span>
                      <p className="relative z-10 pl-2">{selectedTicket.message}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Conversation Thread</h4>
                  </div>
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    <div className="space-y-6">
                      {selectedTicket.replies.map((reply: any, i: number) => (
                        <div 
                          key={i} 
                          className={cn(
                            "rounded-3xl p-5 border shadow-sm transition-all relative",
                            reply.isAdmin 
                              ? "bg-indigo-50/60 border-indigo-100 ml-12" 
                              : "bg-gray-50 border-gray-100 mr-12"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                              reply.isAdmin ? "text-indigo-600" : "text-gray-500"
                            )}>
                              {reply.isAdmin ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  🛡️ NextFlippers Admin (You)
                                </>
                              ) : "User Submitter"}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : new Date(reply.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-sm text-gray-400 font-bold">No replies yet. Type a response below to start the conversation.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer: Reply Input */}
              <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                <div className="space-y-4">
                  <textarea
                    rows={3}
                    placeholder="Type your reply here..."
                    className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={isUpdatingStatus !== null}
                        onClick={async () => {
                          setIsUpdatingStatus('resolved');
                          try {
                            const newStatus = 'resolved';
                            await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: newStatus });
                            setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
                            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                          } catch (error) {
                            console.error('Error updating ticket status:', error);
                            alert('Failed to mark support ticket as resolved.');
                          } finally {
                            setIsUpdatingStatus(null);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5",
                          selectedTicket.status === 'resolved' 
                            ? "bg-green-600 text-white cursor-default" 
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        )}
                      >
                        {isUpdatingStatus === 'resolved' ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {selectedTicket.status === 'resolved' ? "✓ Resolved" : "Mark as Resolved"}
                      </button>
                      
                      <button
                        type="button"
                        disabled={isUpdatingStatus !== null}
                        onClick={async () => {
                          setIsUpdatingStatus('closed');
                          try {
                            const newStatus = 'closed';
                            await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: newStatus });
                            setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
                            setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                          } catch (error) {
                            console.error('Error updating ticket status:', error);
                            alert('Failed to close support ticket.');
                          } finally {
                            setIsUpdatingStatus(null);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5",
                          selectedTicket.status === 'closed' 
                            ? "bg-gray-600 text-white cursor-default" 
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {isUpdatingStatus === 'closed' ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {selectedTicket.status === 'closed' ? "✗ Closed" : "Close Ticket"}
                      </button>

                      {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                        <button
                          type="button"
                          disabled={isUpdatingStatus !== null}
                          onClick={async () => {
                            setIsUpdatingStatus('open');
                            try {
                              const newStatus = 'open';
                              await updateDoc(doc(db, 'support_tickets', selectedTicket.id), { status: newStatus });
                              setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: newStatus } : t));
                              setSelectedTicket(prev => ({ ...prev, status: newStatus }));
                            } catch (error) {
                              console.error('Error updating ticket status:', error);
                              alert('Failed to reopen support ticket.');
                            } finally {
                              setIsUpdatingStatus(null);
                            }
                          }}
                          className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5"
                        >
                          {isUpdatingStatus === 'open' ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : null}
                          Re-open Ticket
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isUpdatingStatus !== null}
                        onClick={async () => {
                          if (!window.confirm('Are you absolutely sure you want to PERMANENTLY DELETE this support ticket? This action is irreversible.')) return;
                          try {
                            await deleteDoc(doc(db, 'support_tickets', selectedTicket.id));
                            setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                            setSelectedTicket(null);
                            alert("Support ticket permanently removed successfully.");
                          } catch (err: any) {
                            console.error("Error deleting support ticket:", err);
                            alert("Failed to delete support ticket: " + err.message);
                          }
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 px-0.5 h-3" />
                        Delete Ticket
                      </button>
                    </div>
                    <button
                      onClick={handleAdminReply}
                      disabled={isReplying || !adminReply.trim()}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isReplying ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" id="feedback-detail-modal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeedback(null)}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl",
                    selectedFeedback.type === 'bug' ? "bg-rose-50 text-rose-500" : "bg-indigo-50 text-indigo-500"
                  )}>
                    {selectedFeedback.type === 'bug' ? <Bug className="w-6 h-6" /> : <Lightbulb className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      {selectedFeedback.type === 'bug' ? "Bug Report Detail" : "Improvement Suggestion"}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 leading-tight">{selectedFeedback.title}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {/* Meta details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100/80">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Submitted By</span>
                    <div className="text-sm font-bold text-gray-900">{selectedFeedback.userName || 'Anonymous'}</div>
                    <div className="text-xs text-gray-500">{selectedFeedback.userEmail || 'No email'}</div>
                  </div>
                  <div className="space-y-1 md:text-right">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Date Logged</span>
                    <div className="text-sm font-bold text-gray-900">
                      {selectedFeedback.createdAt ? new Date(selectedFeedback.createdAt).toLocaleString() : 'N/A'}
                    </div>
                    <div className="text-xs">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                        selectedFeedback.status === 'pending' || !selectedFeedback.status ? "bg-amber-100 text-amber-800" :
                        selectedFeedback.status === 'reviewed' ? "bg-blue-100 text-blue-800" :
                        "bg-green-100 text-green-800"
                      )}>
                        {selectedFeedback.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submittal text description */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Feedback Description</h4>
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-700 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                    {selectedFeedback.description}
                  </div>
                </div>

                {/* Screenshot Section */}
                {selectedFeedback.screenshot && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Attached Screenshot</h4>
                    <div className="relative border border-slate-100 rounded-3xl overflow-hidden bg-slate-900 p-2 flex justify-center">
                      <img 
                        src={selectedFeedback.screenshot} 
                        alt="Feedback Visual Attachment" 
                        className="max-h-96 w-auto rounded-2xl object-contain shadow-md"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls footer */}
              <div className="p-8 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this feedback report?')) {
                      await deleteDoc(doc(db, 'feedback', selectedFeedback.id));
                      setFeedback(prev => prev.filter(f => f.id !== selectedFeedback.id));
                      setSelectedFeedback(null);
                    }
                  }}
                  className="px-6 py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Delete Report
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Close View
                  </button>
                  <button
                    onClick={async () => {
                      const nextStatus = (selectedFeedback.status === 'pending' || !selectedFeedback.status) ? 'reviewed' : selectedFeedback.status === 'reviewed' ? 'resolved' : 'pending';
                      await updateDoc(doc(db, 'feedback', selectedFeedback.id), { status: nextStatus });
                      setFeedback(prev => prev.map(f => f.id === selectedFeedback.id ? { ...f, status: nextStatus } : f));
                      setSelectedFeedback(prev => ({ ...prev, status: nextStatus }));
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Cycle Status
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="space-y-12">
            <header>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Deals pipeline</h1>
              <p className="text-gray-500">Manage ongoing transfers and seller payouts.</p>
            </header>

            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Active Deals</h2>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                  {transactions.filter(t => (t.status === 'processing' || (t.status === 'pending' && t.dealStatus === 'payment_pending')) && !t.sellerPaid).length} Ongoing
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {transactions
                  .filter(t => (t.status === 'processing' || (t.status === 'pending' && t.dealStatus === 'payment_pending')) && !t.sellerPaid)
                  .map(trans => renderTransactionCard(trans))}
                {transactions.filter(t => (t.status === 'processing' || (t.status === 'pending' && t.dealStatus === 'payment_pending')) && !t.sellerPaid).length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No active deals in the pipeline.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8 pt-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black text-green-800 uppercase tracking-widest">Orders Completed</h2>
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">
                  {transactions.filter(t => t.sellerPaid === true || t.status === 'completed').length} Finalized
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6 opacity-80 backdrop-grayscale-[0.4]">
                {transactions
                  .filter(t => t.sellerPaid === true || t.status === 'completed')
                  .map(trans => renderTransactionCard(trans))}
                {transactions.filter(t => t.sellerPaid === true || t.status === 'completed').length === 0 && (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No completed orders yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="relative h-32 bg-gradient-to-r from-indigo-600 to-blue-700">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-6 flex items-end justify-between">
                  <ProfileAvatar 
                    src={selectedUser.photoURL} 
                    gender={selectedUser.gender} 
                    size="xl" 
                    className="w-32 h-32 border-4 border-white shadow-xl" 
                  />
                  <div className="flex gap-3 mb-2">
                    <button 
                      onClick={() => handleChatWithUser(selectedUser.uid)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat Now
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-500 font-bold">@{selectedUser.username}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Role</div>
                      <div className="flex items-center gap-2 text-indigo-600 font-bold">
                        <Shield className="w-4 h-4" />
                        {selectedUser.isAdmin ? 'Super Admin' : selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</div>
                      <div className="flex items-center gap-2 text-green-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        {selectedUser.status.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Editable Metrics */}
                  <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      User Metrics (Admin Only)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                        <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Rating
                        </div>
                        <div className="text-sm font-black text-amber-700">
                          {selectedUser.rating ? selectedUser.rating.toFixed(1) : 'No Rating'}
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                        <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Warnings</div>
                        <div className="text-sm font-black text-red-700">
                          {(selectedUser as any).warningCount || 0}
                        </div>
                      </div>
                      {[
                        { label: 'Total Sales', key: 'totalSales', type: 'number' },
                        { label: 'Orders Done', key: 'ordersCompleted', type: 'number' },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{field.label}</label>
                          <input
                            type={field.type}
                            step={(field as any).step}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                            value={(selectedUser as any)[field.key] || ''}
                            onChange={async (e) => {
                              const val = field.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                              const updatedUser = { ...selectedUser, [field.key]: val };
                              setSelectedUser(updatedUser);
                              try {
                                await updateDoc(doc(db, 'users', selectedUser.uid), { [field.key]: val });
                                setUsers(prev => prev.map(u => u.uid === selectedUser.uid ? updatedUser : u));
                              } catch (err) {
                                console.error('Error updating metric:', err);
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</div>
                        <div className="text-sm font-bold text-gray-900">{selectedUser.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp Number</div>
                        <div className="text-sm font-bold text-gray-900">{selectedUser.whatsappNumber || 'Not provided'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Country</div>
                        <div className="text-sm font-bold text-gray-900">{selectedUser.country || 'Not provided'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <span>Member Since {new Date(selectedUser.createdAt?.toDate()).toLocaleDateString()}</span>
                    <span>UID: {selectedUser.uid}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedPaymentImage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPaymentImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payment Proof Preview</h3>
                <button 
                  onClick={() => setSelectedPaymentImage(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4 bg-gray-50 flex items-center justify-center min-h-[300px]">
                <img 
                  src={selectedPaymentImage} 
                  alt="Payment Proof" 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                />
              </div>
              <div className="p-6 flex justify-center">
                <a 
                  href={selectedPaymentImage} 
                  download="payment-proof.jpg"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Original
                </a>
              </div>
            </motion.div>
          </div>
        )}

        {/* Release Funds Custom Form Modal */}
        {isReleaseModalOpen && releasingTransId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSubmittingRelease) setIsReleaseModalOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-lg w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Record Payout Details</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Disburse secure escrow funds to seller's account</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsReleaseModalOpen(false)}
                  disabled={isSubmittingRelease}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!recipientAccount.trim()) {
                    alert('Please provide the recipient account number, username, or address.');
                    return;
                  }
                  if (!accountHolderName.trim()) {
                    alert('Please specify the account holder name for security records.');
                    return;
                  }
                  
                  const activeReleasingTrans = transactions.find(t => t.id === releasingTransId);
                  const originalPrice = activeReleasingTrans ? activeReleasingTrans.salePrice : 0;
                  const computedNetPayout = Math.max(0, originalPrice - Number(payoutPlatformFee || 0) - Number(payoutTransactionFee || 0));

                  setIsSubmittingRelease(true);
                  try {
                    await handlePaySeller(releasingTransId, {
                      bankAccount: recipientAccount,
                      amount: computedNetPayout,
                      trxId: payoutTrxId || 'TRX-DIRECT',
                      screenshot: payoutScreenshot,
                      notes: memoNotes || 'Dispatched successfully',
                      accountHolderName: accountHolderName,
                      accountTitle: accountTitle,
                      paymentRefCode: payoutTrxId,
                      platformFee: parseFloat(payoutPlatformFee || '0'),
                      transactionFee: parseFloat(payoutTransactionFee || '0'),
                      payoutMethod: accountTitle
                    });
                    setIsReleaseModalOpen(false);
                    setReleasingTransId(null);
                  } catch (err) {
                    console.error('Error submitting payout details:', err);
                    alert('Failed to save payout details.');
                  } finally {
                    setIsSubmittingRelease(false);
                  }
                }}
                className="p-6 space-y-4"
              >
                {/* Method / Title Choice */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payout Method / Gateway *</label>
                    <select
                      value={accountTitle}
                      onChange={(e) => setAccountTitle(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="EasyPaisa">EasyPaisa</option>
                      <option value="JazzCash">JazzCash</option>
                      <option value="Binance Pay">Binance Pay</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Payoneer">Payoneer</option>
                      <option value="Other Method">Other Method</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name on Account"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Account Number / IBAN / Wallet Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 03XXXXXXXX, PKXXUNILXXXXX, or Wallet ID"
                    value={recipientAccount}
                    onChange={(e) => setRecipientAccount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* Fees calculation dashboard */}
                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 block mb-1">Financial Reconciliation</span>
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Base Value:</span>
                    <span className="font-bold">
                      {formatCurrency(transactions.find(t => t.id === releasingTransId)?.salePrice || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        Platform Fee (5%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Platform Fee"
                        value={payoutPlatformFee}
                        onChange={(e) => setPayoutPlatformFee(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        Transaction Fee (Optional)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Tx Fee"
                        value={payoutTransactionFee}
                        onChange={(e) => setPayoutTransactionFee(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs text-indigo-950 font-black pt-2 border-t border-dashed border-indigo-200/50 bg-indigo-50/30 p-2 rounded-xl">
                    <span className="uppercase tracking-widest text-[10px]">Net Disbursed to Seller:</span>
                    <span className="text-sm text-indigo-600 font-extrabold">
                      {formatCurrency(
                        Math.max(0, 
                          (transactions.find(t => t.id === releasingTransId)?.salePrice || 0) 
                          - Number(payoutPlatformFee || 0) 
                          - Number(payoutTransactionFee || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Payment Reference Code / Trx ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bank Trx ID, EasyPaisa reference code, Binance TxID"
                    value={payoutTrxId}
                    onChange={(e) => setPayoutTrxId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Official Transfer Screenshot / Proof</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      id="screenshot-payout-file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onloadend = () => {
                            setPayoutScreenshot(reader.result as string);
                          };
                        }
                      }}
                    />
                    <label
                      htmlFor="screenshot-payout-file"
                      className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-all border border-dashed border-indigo-200"
                    >
                      <ImageIcon className="w-4 h-4" />
                      {payoutScreenshot ? 'Change Receipt' : 'Upload Receipt Asset'}
                    </label>
                    {payoutScreenshot && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200">
                        <img src={payoutScreenshot} alt="payout receipt preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Dispatch Memo / Admin Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter any private notes, status remarks, bank name or transfer logs..."
                    value={memoNotes}
                    onChange={(e) => setMemoNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={isSubmittingRelease}
                    onClick={() => setIsReleaseModalOpen(false)}
                    className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRelease}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingRelease ? 'Recording Transfer...' : 'Record Payout Details'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
