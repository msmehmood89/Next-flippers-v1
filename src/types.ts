import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  whatsappNumber: string;
  country: string;
  gender: 'male' | 'female';
  role: 'buyer' | 'seller' | 'admin' | 'freelancer';
  isAdmin?: boolean;
  status: 'active' | 'inactive';
  isVerified?: boolean;
  lastActiveAt?: Timestamp;
  createdAt: Timestamp;
  photoURL?: string;
  rating?: number;
  totalReviews?: number;
  
  // Categorized Ratings
  sellerRating?: number;
  sellerReviews?: number;
  buyerRating?: number;
  buyerReviews?: number;
  freelancerRating?: number;
  freelancerReviews?: number;

  ordersCompleted?: number;
  websitesBought?: number;
  websitesSold?: number;
  totalSales?: number;
  totalPurchases?: number;
  freelanceValue?: number;
  failedOrders?: number;
  responseTime?: string;
  address?: string;
  mainBusiness?: string;
  monthlyRevenue?: string;
  bio?: string;
  experience?: string;
  lookingFor?: string;
  skills?: string[];
  fullTimeJob?: string;
  partTimeJob?: string;
  privacySettings?: {
    showAddress?: boolean;
    showRevenue?: boolean;
    showContact?: boolean;
    showHistory?: boolean;
  };
  favorites?: string[];
}

export interface Listing {
  id: string;
  userId: string;
  username?: string;
  title: string;
  type: 'website' | 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'threads' | 'theme_plugin' | 'mobile_app' | 'group_buy' | 'premium_tool' | 'other_service' | 'games';
  url?: string;
  description: string;
  category: string;
  platform?: string; // e.g., WordPress, Shopify, YouTube, TikTok
  
  // Website specific
  monthlyRevenue?: number;
  monthlyProfit?: number;
  monthlyTraffic?: number;
  siteAge?: number;
  
  // YouTube/Social specific
  subscribers?: number;
  followers?: number;
  totalLikes?: number;
  watchTime?: number;
  isMonetized?: boolean;
  
  // Games specific
  gameLevel?: string;
  inGameCurrency?: string;
  isFullAccess?: boolean;

  // Tools specific
  toolType?: string; // e.g., Ahrefs, Semrush, ChatGPT
  validityPeriod?: string; // e.g., 1 Month, 1 Year
  accountType?: string; // e.g., Shared, Private
  
  askingPrice: number;
  includedAssets: string[];
  images: string[];
  status: 'pending' | 'approved' | 'sold' | 'rejected' | 'changes_required';
  adminFeedback?: string;
  views: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface ChatThread {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
  listingTitle?: string;
  otherUserName?: string;
  otherUserUsername?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderUsername?: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  isEdited?: boolean;
  isDeleted?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  replyTo?: {
    messageId: string;
    messageText: string;
    senderUsername: string;
  };
}

export interface CartItem {
  id: string;
  type: 'listing' | 'gig';
  title: string;
  price: number;
  image: string;
  sellerId: string;
}

export interface Transaction {
  id: string;
  listingId: string | null;
  gigId?: string | null;
  buyerId: string;
  sellerId: string;
  salePrice: number;
  platformFee?: number;
  transactionFee?: number;
  commissionAmount: number;
  totalPaid: number;
  paymentMethod: 'bank' | 'binance' | 'crypto' | 'pending';
  paymentProofImage?: string;
  dealStatus: 'payment_pending' | 'payment_secured' | 'in_escrow' | 'asset_transferred' | 'buyer_confirmed' | 'completed' | 'disputed' | 'refunded';
  status: 'pending' | 'completed' | 'processing' | 'failed' | 'disputed' | 'active';
  type?: 'listing' | 'gig';
  sellerPaid?: boolean;
  sellerPaidAt?: Timestamp;
  rating?: number;
  ratingComment?: string;
  buyerRating?: number;
  buyerRatingComment?: string;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: Timestamp;
  workProofImage?: string;
  workProofNotes?: string;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'listing_approved' | 'listing_rejected' | 'new_message' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface Gig {
  id: string;
  userId: string;
  userName: string;
  userUsername?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  deliveryTime: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'paused' | 'changes_required';
  adminFeedback?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunityMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  message: string;
  createdAt: Timestamp;
  isEdited?: boolean;
  isDeleted?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  replyTo?: {
    messageId: string;
    messageText: string;
    senderUsername: string;
  };
}
