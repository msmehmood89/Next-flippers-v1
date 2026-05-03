import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface FavoriteButtonProps {
  itemId: string;
  className?: string;
}

export default function FavoriteButton({ itemId, className }: FavoriteButtonProps) {
  const { user, profile } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.favorites) {
      setIsFavorited(profile.favorites.includes(itemId));
    }
  }, [profile?.favorites, itemId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please login to add to favorites');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      if (isFavorited) {
        await updateDoc(userRef, {
          favorites: arrayRemove(itemId)
        });
        setIsFavorited(false);
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(itemId)
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleFavorite}
      disabled={loading}
      className={cn(
        "p-2.5 md:p-3 rounded-full transition-all duration-300 transform active:scale-90",
        isFavorited 
          ? "bg-red-500 text-white shadow-lg shadow-red-200" 
          : "bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-md",
        className
      )}
    >
      <Heart className={cn("w-5 h-5 md:w-6 md:h-6 transition-colors", isFavorited && "fill-current")} />
    </motion.button>
  );
}
