import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, getDoc, updateDoc,
  getDocs, limit, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Message, ChatThread, Listing, UserProfile, Gig, CommunityMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, ChevronLeft, DollarSign, Shield, 
  Globe, ExternalLink, Check, CheckCheck,
  Edit2, Trash2, Reply, X, Image as ImageIcon,
  Search, Users, MoreVertical, Paperclip, MessageSquare, Menu, Smile
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus } from '../lib/utils';
import ProfileAvatar from '../components/ProfileAvatar';
import LoadingScreen from '../components/LoadingScreen';

// Enhanced types for the UI
interface EnhancedChatThread extends ChatThread {
  otherUserName?: string;
  otherUserUsername?: string;
  otherUserPhoto?: string;
  otherUserGender?: 'male' | 'female';
  otherUserLastActiveAt?: Timestamp;
  unreadCount?: number;
  listingTitle?: string;
  type?: 'private' | 'community';
}

export default function ChatPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Unified State
  const [chats, setChats] = useState<EnhancedChatThread[]>([]);
  const [messages, setMessages] = useState<any[]>([]); // Can be Message or CommunityMessage
  const [activeChat, setActiveChat] = useState<EnhancedChatThread | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [gig, setGig] = useState<Gig | null>(null);
  const [transaction, setTransaction] = useState<any | null>(null);
  
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch Conversations List
  useEffect(() => {
    if (!user) return;

    const buyerQ = query(collection(db, 'chats'), where('buyerId', '==', user.uid));
    const sellerQ = query(collection(db, 'chats'), where('sellerId', '==', user.uid));

    const unsubBuyer = onSnapshot(buyerQ, (snapshot) => {
      handleChatUpdate(snapshot.docs, 'buyer');
    });

    const unsubSeller = onSnapshot(sellerQ, (snapshot) => {
      handleChatUpdate(snapshot.docs, 'seller');
    });

    const handleChatUpdate = async (docs: any[], type: string) => {
      const chatData = docs.map(doc => ({ id: doc.id, ...doc.data() } as EnhancedChatThread));
      
      setChats(prev => {
        // Keep community chat
        const community = prev.filter(c => c.type === 'community');
        const others = prev.filter(c => c.type !== 'community' && (type === 'buyer' ? c.sellerId === user.uid : c.buyerId === user.uid));
        
        const combined = [...community, ...others, ...chatData];
        // Remove duplicates & sort
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        
        return unique.sort((a, b) => {
          if (a.id === 'community') return -1;
          if (b.id === 'community') return 1;
          const timeA = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
          const timeB = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      });

      // Enrich chats (metadata like names, labels, unread counts)
      const enriched = await Promise.all(chatData.map(async (chat) => {
        const otherUserId = chat.buyerId === user.uid ? chat.sellerId : chat.buyerId;
        const [listingSnap, gigSnap, otherUserSnap, messagesSnap] = await Promise.all([
          getDoc(doc(db, 'listings', chat.listingId)),
          getDoc(doc(db, 'gigs', chat.listingId)),
          getDoc(doc(db, 'users', otherUserId)),
          getDocs(query(
            collection(db, 'chats', chat.id, 'messages'),
            where('isRead', '==', false),
            where('senderId', '!=', user.uid)
          ))
        ]);

        let title = 'Unknown Item';
        if (listingSnap.exists()) title = (listingSnap.data() as Listing).title;
        else if (gigSnap.exists()) title = (gigSnap.data() as Gig).title;

        return {
          ...chat,
          type: 'private' as const,
          listingTitle: title,
          otherUserName: otherUserSnap.exists() ? (otherUserSnap.data() as UserProfile).name : 'User',
          otherUserUsername: otherUserSnap.exists() ? (otherUserSnap.data() as UserProfile).username : 'user',
          otherUserGender: otherUserSnap.exists() ? (otherUserSnap.data() as UserProfile).gender : 'male',
          otherUserPhoto: otherUserSnap.exists() ? (otherUserSnap.data() as UserProfile).photoURL : undefined,
          otherUserLastActiveAt: otherUserSnap.exists() ? (otherUserSnap.data() as UserProfile).lastActiveAt : undefined,
          unreadCount: messagesSnap.size
        };
      }));

      setChats(prev => {
        const updated = prev.map(c => {
          const found = enriched.find(e => e.id === c.id);
          return found ? found : c;
        });

        // Add community chat if not exists
        if (!updated.find(c => c.id === 'community')) {
          updated.push({
            id: 'community',
            type: 'community',
            listingTitle: 'Community Discussion',
            otherUserName: 'Global Community',
            otherUserUsername: 'community',
            buyerId: '',
            sellerId: '',
            listingId: '',
            createdAt: Timestamp.now(),
          });
        }

        return updated.sort((a, b) => {
          if (a.id === 'community') return -1;
          if (b.id === 'community') return 1;
          const timeA = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
          const timeB = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      });
      setLoading(false);
    };

    return () => {
      unsubBuyer();
      unsubSeller();
    };
  }, [user]);

  // 2. Handle Conversation Change
  useEffect(() => {
    if (!id || !user) {
      setActiveChat(null);
      setMessages([]);
      return;
    }

    const currentChat = chats.find(c => c.id === id);
    if (!currentChat && id !== 'community' && !loading) {
      // If chat not found in list, might be a direct link, fetch it
      const fetchDirectChat = async () => {
        try {
          const chatSnap = await getDoc(doc(db, 'chats', id));
          if (chatSnap.exists()) {
             const chatData = { id: chatSnap.id, ...chatSnap.data() } as EnhancedChatThread;
             const otherUserId = chatData.buyerId === user.uid ? chatData.sellerId : chatData.buyerId;
             const [otherUserSnap, listingSnap, gigSnap] = await Promise.all([
               getDoc(doc(db, 'users', otherUserId)),
               getDoc(doc(db, 'listings', chatData.listingId)),
               getDoc(doc(db, 'gigs', chatData.listingId))
             ]);

             const enriched: EnhancedChatThread = {
               ...chatData,
               type: 'private',
               otherUserName: otherUserSnap.exists() ? otherUserSnap.data()?.name : 'User',
               otherUserUsername: otherUserSnap.exists() ? otherUserSnap.data()?.username : 'user',
               otherUserGender: otherUserSnap.exists() ? otherUserSnap.data()?.gender : 'male',
               otherUserPhoto: otherUserSnap.exists() ? otherUserSnap.data()?.photoURL : undefined,
               otherUserLastActiveAt: otherUserSnap.exists() ? otherUserSnap.data()?.lastActiveAt : undefined,
               listingTitle: listingSnap.exists() ? listingSnap.data()?.title : (gigSnap.exists() ? gigSnap.data()?.title : 'Item')
             };
             setActiveChat(enriched);
          }
        } catch (e) {
          console.error("Direct chat fetch error:", e);
        }
      };
      fetchDirectChat();
    } else {
      setActiveChat(currentChat || null);
    }
    
    if (window.innerWidth < 1024) setShowSidebar(false);

    let unsubscribe: () => void;

    if (id === 'community') {
      const q = query(
        collection(db, 'community_messages'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityMessage)).reverse();
        setMessages(msgs);
        setMessagesLoading(false);
      });
    } else {
      setMessagesLoading(true);
      const q = query(
        collection(db, 'chats', id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
        setMessagesLoading(false);

        // Mark unread messages as read
        snapshot.docs.forEach(async (messageDoc) => {
          const msgData = messageDoc.data();
          if (msgData.senderId !== user.uid && !msgData.isRead) {
            await updateDoc(doc(db, 'chats', id, 'messages', messageDoc.id), { isRead: true });
          }
        });
      });

      // Load listing/gig details for the active chat context
      const loadContext = async () => {
         const chatSnap = await getDoc(doc(db, 'chats', id));
         if (chatSnap.exists()) {
           const c = chatSnap.data();
           const lSnap = await getDoc(doc(db, 'listings', c.listingId));
           if (lSnap.exists()) {
             setListing({ id: lSnap.id, ...lSnap.data() } as Listing);
           } else {
             const gSnap = await getDoc(doc(db, 'gigs', c.listingId));
             if (gSnap.exists()) setGig({ id: gSnap.id, ...gSnap.data() } as Gig);
           }
         }
      };
      loadContext();
    }

    return () => {
      if (unsubscribe) unsubscribe();
      setListing(null);
      setGig(null);
      setTransaction(null);
    };
  }, [id, user, chats.length, loading]);

  // 3. Listen to other user's real-time status
  useEffect(() => {
    if (!activeChat || activeChat.id === 'community' || !user) {
      setOtherUser(null);
      return;
    }

    const otherUserId = activeChat.buyerId === user.uid ? activeChat.sellerId : activeChat.buyerId;
    const unsub = onSnapshot(doc(db, 'users', otherUserId), (docSnap) => {
      if (docSnap.exists()) {
        setOtherUser({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
      }
    });

    return () => unsub();
  }, [activeChat?.id, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !editingMessage) || !id || !user) return;

    try {
      if (id === 'community') {
        if (editingMessage) {
          await updateDoc(doc(db, 'community_messages', editingMessage.id), {
            message: newMessage.trim(),
            isEdited: true,
            updatedAt: serverTimestamp(),
          });
        } else {
          const messageData: any = {
            senderId: user.uid,
            senderName: profile?.name || 'Anonymous',
            senderUsername: profile?.username || 'user',
            senderGender: profile?.gender || 'male',
            message: newMessage.trim(),
            createdAt: serverTimestamp(),
          };
          if (replyingTo) {
            messageData.replyTo = {
              messageId: replyingTo.id,
              messageText: replyingTo.message,
              senderUsername: replyingTo.senderUsername,
            };
          }
          await addDoc(collection(db, 'community_messages'), messageData);
        }
      } else {
        if (editingMessage) {
          await updateDoc(doc(db, 'chats', id, 'messages', editingMessage.id), {
            message: newMessage.trim(),
            isEdited: true,
            updatedAt: serverTimestamp(),
          });
        } else {
          const messageData: any = {
            chatId: id,
            senderId: user.uid,
            senderUsername: profile?.username || 'user',
            message: newMessage.trim(),
            isRead: false,
            createdAt: serverTimestamp(),
          };

          if (replyingTo) {
            messageData.replyTo = {
              messageId: replyingTo.id,
              messageText: replyingTo.message,
              senderUsername: replyingTo.senderUsername || 'user',
            };
          }
          
          await addDoc(collection(db, 'chats', id, 'messages'), messageData);
          
          await updateDoc(doc(db, 'chats', id), {
            lastMessage: newMessage.trim(),
            lastMessageAt: serverTimestamp(),
          });

          const recipientId = activeChat?.buyerId === user.uid ? activeChat?.sellerId : activeChat?.buyerId;
          if (recipientId) {
            await addDoc(collection(db, 'notifications'), {
              userId: recipientId,
              title: 'New Message',
              message: `${profile?.username || 'Someone'} sent you a message`,
              type: 'new_message',
              link: `/chat/${id}`,
              isRead: false,
              createdAt: serverTimestamp(),
            });
          }
        }
      }

      setNewMessage('');
      setEditingMessage(null);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Images only for now.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `chats/${id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const mediaUrl = await getDownloadURL(snapshot.ref);

      if (id === 'community') {
        await addDoc(collection(db, 'community_messages'), {
          senderId: user.uid,
          senderName: profile?.name || 'Anonymous',
          senderUsername: profile?.username || 'user',
          senderGender: profile?.gender || 'male',
          message: '',
          mediaUrl,
          mediaType: 'image',
          createdAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'chats', id, 'messages'), {
          chatId: id,
          senderId: user.uid,
          senderUsername: profile?.username || 'user',
          message: '',
          mediaUrl,
          mediaType: 'image',
          isRead: false,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'chats', id), {
          lastMessage: '📷 Photo',
          lastMessageAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredChats = chats.filter(c => 
    c.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUserUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#f0f2f5] overflow-hidden">
      {/* 1. Sidebar - Chat List */}
      <aside className={cn(
        "lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        !showSidebar ? "hidden lg:flex" : "w-full lg:w-96 flex"
      )}>
        {/* Sidebar Header */}
        <header className="px-5 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
             <Link to="/dashboard" className="p-2 -ml-2 text-gray-500 hover:text-indigo-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <ProfileAvatar size="md" gender={profile?.gender} src={profile?.photoURL} />
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <Link to="/community" title="Community"><Users className="w-5 h-5 hover:text-indigo-600 transition-all cursor-pointer" /></Link>
          </div>
        </header>

        {/* Sidebar Search */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-grow overflow-y-auto">
          {filteredChats.map((chat) => {
            const isCommunity = chat.id === 'community';
            const isActive = id === chat.id;
            
            return (
              <Link 
                key={chat.id}
                to={`/chat/${chat.id}`}
                className={cn(
                  "flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-all cursor-pointer border-b border-gray-50 group",
                  isActive ? "bg-gray-100" : "bg-white"
                )}
              >
                <div className="relative">
                  {isCommunity ? (
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                      <Users className="w-6 h-6" />
                    </div>
                  ) : (
                    <ProfileAvatar 
                      gender={chat.otherUserGender} 
                      size="lg" 
                      src={chat.otherUserPhoto} 
                      className="rounded-full shadow-sm"
                      isOnline={chat.otherUserLastActiveAt ? (Date.now() - chat.otherUserLastActiveAt.toMillis() < 300000) : false}
                    />
                  )}
                  {!isCommunity && chat.unreadCount && chat.unreadCount > 0 ? (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {chat.unreadCount}
                    </div>
                  ) : null}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {isCommunity ? 'Community Chat' : chat.otherUserName}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {chat.lastMessageAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 
                       chat.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {chat.type === 'private' && chat.lastMessage && <CheckCheck className="w-3 h-3 text-gray-300" />}
                    <p className="text-xs text-gray-500 truncate font-medium">
                      {isCommunity ? 'Join the community discussion' : (chat.lastMessage || `Re: ${chat.listingTitle}`)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className={cn(
        "flex-grow flex flex-col bg-[#e5ddd5] relative transition-all duration-300",
        showSidebar && "hidden lg:flex"
      )}>
        {/* WhatsApp Background Pattern */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1px)', backgroundSize: '24px 24px' }} />

        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowSidebar(true)} 
                  className="lg:hidden p-2 -ml-2 text-gray-500"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(activeChat.id === 'community' ? '/community' : `/profile/${activeChat.otherUserUsername}`)}
                >
                  <div className="relative">
                    {activeChat.id === 'community' ? (
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm">
                        <Users className="w-5 h-5" />
                      </div>
                    ) : (
                      <ProfileAvatar 
                        size="md" 
                        gender={activeChat.otherUserGender} 
                        src={activeChat.otherUserPhoto} 
                        isOnline={otherUser?.lastActiveAt ? (Date.now() - otherUser.lastActiveAt.toMillis() < 300000) : false}
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 leading-tight">
                      {activeChat.id === 'community' ? 'Community Chat' : activeChat.otherUserName}
                    </h2>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      otherUser?.lastActiveAt && (Date.now() - otherUser.lastActiveAt.toMillis() < 300000) 
                        ? "text-green-600" 
                        : "text-gray-400"
                    )}>
                      {activeChat.id === 'community' ? 'Online' : getOnlineStatus(otherUser?.lastActiveAt || activeChat.otherUserLastActiveAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-500">
                <button 
                  onClick={() => navigate(`/profile/${activeChat.otherUserUsername}`)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="View Profile"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Context Widget (Listing info) */}
            {activeChat.type === 'private' && (listing || gig) && (
              <div className="px-6 py-2 bg-indigo-50/80 backdrop-blur-sm border-b border-indigo-100 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-indigo-100 p-0.5">
                    <img src={listing?.images[0] || gig?.images[0]} alt="" className="w-full h-full object-cover rounded" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Inquiry Context</div>
                    <div className="text-xs font-bold text-gray-900 line-clamp-1">{listing?.title || gig?.title}</div>
                  </div>
                </div>
                <Link 
                  to={`/payment/${listing?.id || gig?.id}`} 
                  className="p-1 px-3 bg-indigo-600 text-white rounded-lg text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase"
                >
                  Buy Now
                </Link>
              </div>
            )}

            {/* Messages Scroll Area */}
            <div className="flex-grow overflow-y-auto px-6 py-8 space-y-3 relative z-10 font-medium">
              <div className="max-w-4xl mx-auto space-y-4">
                {messagesLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.map((msg, idx) => {
                  const isMe = msg.senderId === user?.uid;
                  const isCommunityChat = activeChat.id === 'community';
                  const showSender = isCommunityChat && !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
                  
                  return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn("flex w-full mb-1", isMe ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "relative max-w-[85%] sm:max-w-[70%] px-4 py-2 rounded-2xl shadow-sm text-sm group transition-all",
                        isMe 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                      )}>
                        {msg.replyTo && (
                          <div className={cn(
                            "mb-1.5 p-2 rounded-lg text-[10px] border-l-4 overflow-hidden",
                            isMe ? "bg-black/10 border-white/50 text-white/80" : "bg-gray-50 border-indigo-400 text-gray-500"
                          )}>
                            <div className="font-black mb-0.5 truncate">@{msg.replyTo.senderUsername}</div>
                            <div className="line-clamp-1 italic text-[9px]">"{msg.replyTo.messageText}"</div>
                          </div>
                        )}

                        {showSender && (
                          <div className="text-[10px] font-black text-indigo-500 mb-0.5 uppercase tracking-widest px-1">
                            @{msg.senderUsername}
                          </div>
                        )}

                        {msg.mediaUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-black/5">
                            <img src={msg.mediaUrl} alt="" className="max-w-full h-auto" />
                          </div>
                        )}

                        <p className={cn("leading-relaxed break-words", msg.isDeleted && "italic opacity-60")}>
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-end gap-1.5 mt-1 opacity-70">
                          <span className="text-[9px] font-medium origin-right scale-90">
                             {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                             <div className="flex items-center">
                               {msg.isRead ? (
                                 <CheckCheck className="w-3 h-3 text-white" />
                               ) : (
                                 <Check className="w-3 h-3 text-white/60" />
                               )}
                             </div>
                          )}
                        </div>

                        {!msg.isDeleted && (
                          <div className={cn(
                            "absolute top-0 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 pt-1 px-2 pointer-events-none group-hover:pointer-events-auto",
                            isMe ? "right-full mr-2" : "left-full ml-2"
                          )}>
                            <button onClick={() => setReplyingTo(msg)} className="p-1 px-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:text-indigo-600 transition-colors">
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            {isMe && !msg.mediaUrl && (
                              <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.message); }} className="p-1 px-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:text-indigo-600 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isMe && (
                              <button onClick={async () => {
                                if(window.confirm('Delete message?')) {
                                  const path = activeChat.id === 'community' ? 'community_messages' : `chats/${activeChat.id}/messages`;
                                  await updateDoc(doc(db, path, msg.id), { isDeleted: true, message: 'Message deleted' });
                                }
                              }} className="p-1 px-2 bg-white rounded-lg shadow-sm border border-gray-100 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 px-6 relative z-10 shadow-lg">
              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="max-w-4xl mx-auto mb-3 p-3 px-5 bg-white rounded-2xl flex items-center justify-between border-l-4 border-indigo-600 shadow-sm"
                  >
                    <div className="overflow-hidden">
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Replying to @{replyingTo.senderUsername}</div>
                      <div className="text-xs text-gray-500 truncate italic">"{replyingTo.message}"</div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1.5 text-gray-400 hover:text-red-500 bg-gray-50 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
                 {editingMessage && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="max-w-4xl mx-auto mb-3 p-3 px-5 bg-amber-50 rounded-2xl flex items-center justify-between border-l-4 border-amber-600 shadow-sm"
                  >
                    <div className="overflow-hidden">
                      <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Editing Message</div>
                      <div className="text-xs text-gray-500 truncate italic">"{editingMessage.message}"</div>
                    </div>
                    <button onClick={() => { setEditingMessage(null); setNewMessage(''); }} className="p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <label className="p-2.5 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} disabled={uploading} />
                    {uploading ? <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-6 h-6" />}
                  </label>
                </div>

                <div className="flex-grow flex items-center bg-white rounded-2xl border border-gray-200 px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                  <input 
                    type="text" 
                    placeholder="Type a message..."
                    className="flex-grow bg-transparent border-none outline-none text-sm py-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!newMessage.trim() && !editingMessage}
                  className={cn(
                    "p-3.5 rounded-2xl text-white shadow-xl transition-all active:scale-95 disabled:grayscale disabled:opacity-50",
                    editingMessage ? "bg-amber-600 shadow-amber-200" : "bg-indigo-600 shadow-indigo-200"
                  )}
                >
                  {editingMessage ? <Check className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center relative z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-xl mb-6">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Your Messages</h2>
            <p className="text-gray-500 max-w-sm mb-8 font-medium">
              Select a conversation from the sidebar to start messaging. Your community and private chats are all in one place.
            </p>
            <button 
              onClick={() => setShowSidebar(true)}
              className="lg:hidden bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 flex items-center gap-2"
            >
              <Menu className="w-5 h-5" />
              Show Conversations
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
