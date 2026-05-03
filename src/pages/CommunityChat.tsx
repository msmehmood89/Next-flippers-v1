import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, serverTimestamp, limit, doc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { CommunityMessage } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Users, Shield, Info, 
  MessageSquare, Heart, Smile, Image as ImageIcon,
  Edit2, Trash2, Reply, X, Check, Video
} from 'lucide-react';
import { cn, resizeImage } from '../lib/utils';
import ProfileAvatar from '../components/ProfileAvatar';

export default function CommunityChat() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingMessage, setEditingMessage] = useState<CommunityMessage | null>(null);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'community_messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityMessage)).reverse();
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Community chat error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !editingMessage) || !user) return;

    try {
      if (editingMessage) {
        await updateDoc(doc(db, 'community_messages', editingMessage.id), {
          message: newMessage.trim(),
          isEdited: true,
          updatedAt: serverTimestamp(),
        });
        setEditingMessage(null);
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
        setReplyingTo(null);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending community message:', error);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await updateDoc(doc(db, 'community_messages', id), {
        isDeleted: true,
        message: 'This message was deleted',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
      const storageRef = ref(storage, `community/${Date.now()}_${file.name}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const mediaUrl = await getDownloadURL(snapshot.ref);

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
    } catch (error: any) {
      console.error('Error uploading media:', error);
      alert(`Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col bg-white shadow-2xl shadow-indigo-100/20 border-x border-gray-100">
        {/* Chat Header */}
        <header className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Community Chat</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Group Active</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5" />
            Safe Space
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-[#e5ddd5] relative">
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="text-center py-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-400 text-[10px] font-black rounded-full border border-gray-100 uppercase tracking-widest shadow-sm">
                <Info className="w-3.5 h-3.5" />
                Welcome to the Next Flippers Global Chat
              </div>
              <p className="mt-4 text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Connect with other buyers, sellers, and freelancers. Be respectful and follow our community guidelines.
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                    <div className="flex-grow space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-10 bg-gray-200 rounded-2xl w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === user?.uid;
                const showAvatar = i === 0 || messages[i-1].senderId !== msg.senderId;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-4", isMe ? "flex-row-reverse" : "flex-row")}
                  >
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <ProfileAvatar 
                          gender={(msg as any).senderGender} 
                          size="md" 
                          className="rounded-xl"
                        />
                      ) : (
                        <div className="w-10" />
                      )}
                    </div>
                    
                    <div className={cn("max-w-[70%] space-y-1", isMe ? "items-end" : "items-start")}>
                      {showAvatar && (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          @{msg.senderUsername}
                        </span>
                      )}
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm relative group",
                        isMe 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
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

                        <div className="flex items-center justify-between gap-4 mt-2">
                          <span className={cn(
                            "text-[9px] font-bold opacity-40",
                            isMe ? "text-white" : "text-gray-400"
                          )}>
                            {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.isEdited && !msg.isDeleted && " (edited)"}
                          </span>

                          {!msg.isDeleted && (
                            <div className={cn(
                              "flex items-center gap-3 ml-2 transition-opacity",
                              isMe ? "text-white/60" : "text-gray-400"
                            )}>
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
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100">
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-4 p-3 bg-indigo-50 rounded-xl flex items-center justify-between border-l-4 border-indigo-600"
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
                className="mb-4 p-3 bg-amber-50 rounded-xl flex items-center justify-between border-l-4 border-amber-600"
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

          <form onSubmit={handleSendMessage} className="flex items-center gap-4">
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
                placeholder={editingMessage ? "Edit your message..." : "Type a message to the community..."}
                className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !editingMessage}
                  className={cn(
                    "p-2 rounded-xl transition-all shadow-lg",
                    editingMessage ? "bg-amber-600 text-white shadow-amber-100" : "bg-indigo-600 text-white shadow-indigo-100"
                  )}
                >
                  {editingMessage ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
