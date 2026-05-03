import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc,
  getDocs, limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Message, ChatThread, Listing, UserProfile, Gig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, ChevronLeft, Info, DollarSign, Shield, 
  CheckCircle2, AlertCircle, Phone, Globe, ExternalLink, Check, CheckCheck,
  Briefcase, Edit2, Trash2, Reply, X, Image as ImageIcon, Video
} from 'lucide-react';
import { formatCurrency, cn, getOnlineStatus, resizeImage } from '../lib/utils';
import ProfileAvatar from '../components/ProfileAvatar';

export default function ChatPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<ChatThread | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [gig, setGig] = useState<Gig | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [transaction, setTransaction] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchChatData = async () => {
      try {
        const chatSnap = await getDoc(doc(db, 'chats', id));
        if (!chatSnap.exists()) {
          navigate('/dashboard/messages');
          return;
        }
        const chatData = { id: chatSnap.id, ...chatSnap.data() } as ChatThread;
        setChat(chatData);

        // Fetch listing or gig
        const listingSnap = await getDoc(doc(db, 'listings', chatData.listingId));
        if (listingSnap.exists()) {
          setListing({ id: listingSnap.id, ...listingSnap.data() } as Listing);
        } else {
          // Check if it's a gig
          const gigSnap = await getDoc(doc(db, 'gigs', chatData.listingId));
          if (gigSnap.exists()) {
            setGig({ id: gigSnap.id, ...gigSnap.data() } as Gig);
          }
        }

        // Fetch other user
        const otherUserId = chatData.buyerId === user.uid ? chatData.sellerId : chatData.buyerId;
        const otherUserSnap = await getDoc(doc(db, 'users', otherUserId));
        if (otherUserSnap.exists()) setOtherUser({ uid: otherUserSnap.id, ...otherUserSnap.data() } as UserProfile);

        // Fetch transaction if exists
        const transQuery = query(
          collection(db, 'transactions'),
          where('buyerId', '==', chatData.buyerId),
          where('sellerId', '==', chatData.sellerId),
          where('listingId', '==', chatData.listingId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const transSnap = await getDocs(transQuery);
        if (!transSnap.empty) {
          setTransaction({ id: transSnap.docs[0].id, ...transSnap.docs[0].data() });
        }

        // Listen for messages only after we know the chat exists
        const q = query(
          collection(db, 'chats', id, 'messages'),
          orderBy('createdAt', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
          setMessages(msgs);

          // Mark unread messages as read
          snapshot.docs.forEach(async (messageDoc) => {
            const msgData = messageDoc.data();
            if (msgData.senderId !== user.uid && !msgData.isRead) {
              await updateDoc(doc(db, 'chats', id, 'messages', messageDoc.id), { isRead: true });
            }
          });
        }, (error) => {
          console.error("Messages snapshot error:", error);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    let unsubMessages: (() => void) | undefined;
    fetchChatData().then(unsub => {
      unsubMessages = unsub;
    });

    return () => {
      if (unsubMessages) unsubMessages();
    };
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !editingMessage) || !id || !user) return;

    try {
      if (editingMessage) {
        await updateDoc(doc(db, 'chats', id, 'messages', editingMessage.id), {
          message: newMessage.trim(),
          isEdited: true,
          updatedAt: serverTimestamp(),
        });
        setEditingMessage(null);
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
        
        // Update chat thread
        await updateDoc(doc(db, 'chats', id), {
          lastMessage: newMessage.trim(),
          lastMessageAt: serverTimestamp(),
        });

        // Send notification to other user
        const recipientId = chat?.buyerId === user.uid ? chat?.sellerId : chat?.buyerId;
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
        setReplyingTo(null);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await updateDoc(doc(db, 'chats', id!, 'messages', messageId), {
        isDeleted: true,
        message: 'This message was deleted',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !user) return;

    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      alert('Please upload an image only.');
      return;
    }

    // Size limits: 5MB for photos
    const maxPhotoSize = 5 * 1024 * 1024;

    if (file.size > maxPhotoSize) {
      alert('Photo is too large. Max 5MB.');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `chats/${id}/${Date.now()}_${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const mediaUrl = await getDownloadURL(snapshot.ref);

      const messageData = {
        chatId: id,
        senderId: user.uid,
        senderUsername: profile?.username || 'user',
        message: '',
        mediaUrl,
        mediaType: 'image',
        isRead: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'chats', id, 'messages'), messageData);

      await updateDoc(doc(db, 'chats', id), {
        lastMessage: '📷 Photo',
        lastMessageAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Error uploading media:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/messages" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center gap-3">
            <ProfileAvatar 
              src={otherUser?.uid === user?.uid ? user?.photoURL || undefined : undefined} 
              gender={otherUser?.gender} 
              size="md" 
            />
            <div>
              <div className="text-sm font-bold text-gray-900">@{otherUser?.username || otherUser?.name}</div>
              <div className="flex items-center gap-1.5">
                <div className={cn("w-1.5 h-1.5 rounded-full", otherUser?.lastActiveAt ? "bg-green-500" : "bg-gray-300")} />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{getOnlineStatus(otherUser?.lastActiveAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {listing && (
          <div className="hidden md:flex items-center gap-4 p-2 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
              <img src={listing.images[0] || `https://picsum.photos/seed/${listing.id}/100/100`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-gray-900 line-clamp-1">{listing.title}</div>
              <div className="text-[10px] font-bold text-indigo-600">{formatCurrency(listing.askingPrice)}</div>
            </div>
            <Link 
              to={transaction ? (transaction.buyerId === user?.uid ? '/dashboard/purchases' : '/dashboard/sales') : `/listing/${listing.id}`} 
              className="p-2 text-gray-400 hover:text-indigo-600 flex flex-col items-center"
            >
              <ExternalLink className="w-4 h-4" />
              {transaction && <span className="text-[8px] font-black uppercase mt-1">Order</span>}
            </Link>
          </div>
        )}

        {gig && (
          <div className="hidden md:flex items-center gap-4 p-2 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
              <img src={gig.images[0] || `https://picsum.photos/seed/${gig.id}/100/100`} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-gray-900 line-clamp-1">{gig.title}</div>
              <div className="text-[10px] font-bold text-indigo-600">{formatCurrency(gig.price)}</div>
            </div>
            <Link 
              to={transaction ? (transaction.buyerId === user?.uid ? '/dashboard/purchases' : '/dashboard/sales') : `/gig/${gig.id}`} 
              className="p-2 text-gray-400 hover:text-indigo-600 flex flex-col items-center"
            >
              <ExternalLink className="w-4 h-4" />
              {transaction && <span className="text-[8px] font-black uppercase mt-1">Order</span>}
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2">
          {listing && (
            <Link
              to={`/payment/${listing.id}`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
            >
              <DollarSign className="w-3.5 h-3.5" />
              Buy Now
            </Link>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-[#e5ddd5] relative">
        {/* WhatsApp-like background pattern (simulated with CSS) */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
              <Shield className="w-3.5 h-3.5" />
              Escrow Protection Active
            </div>
            <p className="mt-4 text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Always keep your conversations and payments within Next Flippers to stay protected by our manual escrow service.
            </p>
          </div>

          {messages.map((msg, i) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm relative group",
                  isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                )}>
                  {msg.replyTo && (
                    <div className={cn(
                      "mb-2 p-2 rounded-lg text-[10px] border-l-4",
                      isMe ? "bg-white/10 border-white/40 text-white/80" : "bg-gray-50 border-indigo-200 text-gray-500"
                    )}>
                      <div className="font-black mb-1">@{msg.replyTo.senderUsername}</div>
                      <div className="line-clamp-1 italic">"{msg.replyTo.messageText}"</div>
                    </div>
                  )}

                  {msg.mediaUrl ? (
                    <div className="mb-2 rounded-xl overflow-hidden">
                      {msg.mediaType === 'video' ? (
                        <video src={msg.mediaUrl} controls className="max-w-full rounded-xl" />
                      ) : (
                        <img src={msg.mediaUrl} alt="Media" className="max-w-full rounded-xl" />
                      )}
                    </div>
                  ) : (
                    <p className={cn("text-sm leading-relaxed", msg.isDeleted && "italic opacity-60")}>
                      {msg.message}
                    </p>
                  )}

                  <div className={cn("flex items-center justify-between gap-4 mt-2", isMe ? "text-indigo-100" : "text-gray-400")}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold opacity-50">
                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.isEdited && !msg.isDeleted && " (edited)"}
                      </span>
                      {!msg.isDeleted && (
                        <div className="flex items-center gap-3 ml-2">
                          <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-black/5 rounded-full transition-colors" title="Reply">
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          {isMe && !msg.mediaUrl && (
                            <button onClick={() => {
                              setEditingMessage(msg);
                              setNewMessage(msg.message);
                            }} className="p-1 hover:bg-black/5 rounded-full transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isMe && (
                            <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 hover:bg-black/5 rounded-full transition-colors text-red-400" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {isMe && (
                      <div className="flex items-center">
                        {msg.isRead ? (
                          <CheckCheck className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-indigo-200" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 shadow-lg">
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-4xl mx-auto mb-4 p-3 bg-indigo-50 rounded-xl flex items-center justify-between border-l-4 border-indigo-600"
            >
              <div className="overflow-hidden">
                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Replying to @{replyingTo.senderUsername}</div>
                <div className="text-xs text-gray-500 truncate">{replyingTo.message}</div>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          {editingMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-4xl mx-auto mb-4 p-3 bg-amber-50 rounded-xl flex items-center justify-between border-l-4 border-amber-600"
            >
              <div className="overflow-hidden">
                <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Editing Message</div>
                <div className="text-xs text-gray-500 truncate">{editingMessage.message}</div>
              </div>
              <button onClick={() => {
                setEditingMessage(null);
                setNewMessage('');
              }} className="p-1 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:text-indigo-600 transition-all"
          >
            {uploading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </button>

          <div className="flex-grow relative">
            <input
              type="text"
              placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
              className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() && !editingMessage}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all shadow-lg",
                editingMessage ? "bg-amber-600 text-white shadow-amber-100" : "bg-indigo-600 text-white shadow-indigo-100"
              )}
            >
              {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
