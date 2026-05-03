import { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ChatThread, Listing, Gig } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Search, ChevronRight, Clock, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import ProfileAvatar from '../../components/ProfileAvatar';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const buyerQ = query(collection(db, 'chats'), where('buyerId', '==', user.uid));
    const sellerQ = query(collection(db, 'chats'), where('sellerId', '==', user.uid));

    const unsubBuyer = onSnapshot(buyerQ, (snapshot) => {
      updateChats(snapshot.docs, 'buyer');
    });

    const unsubSeller = onSnapshot(sellerQ, (snapshot) => {
      updateChats(snapshot.docs, 'seller');
    });

    const updateChats = async (docs: any[], type: string) => {
      const newChats = docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatThread));
      
      setChats(prev => {
        const otherTypeChats = prev.filter(c => type === 'buyer' ? c.sellerId === user.uid : c.buyerId === user.uid);
        const combined = [...otherTypeChats, ...newChats];
        
        // Remove duplicates
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        
        return unique.sort((a, b) => {
          const timeA = a.lastMessageAt?.toMillis() || a.createdAt?.toMillis() || 0;
          const timeB = b.lastMessageAt?.toMillis() || b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });
      });

      // Enrich chats with unread counts and other info
      const enriched = await Promise.all(newChats.map(async (chat) => {
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

        let title = 'Unknown Listing';
        if (listingSnap.exists()) title = (listingSnap.data() as Listing).title;
        else if (gigSnap.exists()) title = (gigSnap.data() as Gig).title;

        return {
          ...chat,
          listingTitle: title,
          otherUserName: otherUserSnap.exists() ? otherUserSnap.data().name : 'User',
          otherUserGender: otherUserSnap.exists() ? otherUserSnap.data().gender : 'male',
          otherUserPhoto: otherUserSnap.exists() ? otherUserSnap.data().photoURL : undefined,
          unreadCount: messagesSnap.size
        };
      }));

      setChats(prev => {
        const updated = prev.map(c => {
          const found = enriched.find(e => e.id === c.id);
          return found ? found : c;
        });
        return updated.sort((a, b) => {
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

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-500">Connect with buyers and sellers to close your deals.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chats.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {chats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className="p-6 hover:bg-gray-50 transition-all flex items-center gap-6 group"
                >
                  <ProfileAvatar 
                    src={(chat as any).otherUserPhoto} 
                    gender={(chat as any).otherUserGender} 
                    size="lg" 
                  />
                  <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{chat.otherUserName}</div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {chat.lastMessageAt?.toDate().toLocaleDateString() || chat.createdAt?.toDate().toLocaleDateString()}
                      </div>
                      {(chat as any).unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-indigo-100">
                          {(chat as any).unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 font-medium mb-1 line-clamp-1">Re: {chat.listingTitle}</div>
                  <div className="text-xs text-gray-400 line-clamp-1 italic">Click to view conversation</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500 mb-8">When you contact a seller or receive an offer, it will appear here.</p>
            <Link
              to="/listings"
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm"
            >
              Start Browsing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
