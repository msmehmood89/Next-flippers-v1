import React from 'react';
import { User, UserRound } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface ProfileAvatarProps {
  src?: string;
  gender?: 'male' | 'female';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  username?: string;
  isOnline?: boolean;
}

export default function ProfileAvatar({ src, gender, className, size = 'md', username, isOnline }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    full: 'w-full h-full'
  };

  const dotSizes = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3 h-3 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-2',
    full: 'w-6 h-6 border-2'
  };

  const content = (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt="Profile"
          referrerPolicy="no-referrer"
          className={cn(
            'rounded-full object-cover border-2 border-white shadow-sm',
            sizeClasses[size],
            className
          )}
        />
      ) : gender === 'female' ? (
        <div className={cn(
          'rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600 text-white border-2 border-white shadow-md overflow-hidden relative group',
          sizeClasses[size],
          className
        )}>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <UserRound className={cn('w-3/5 h-3/5 drop-shadow-md')} />
        </div>
      ) : (
        <div className={cn(
          'rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 text-white border-2 border-white shadow-md overflow-hidden relative group',
          sizeClasses[size],
          className
        )}>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <User className={cn('w-3/5 h-3/5 drop-shadow-md')} />
        </div>
      )}
      
      {isOnline && (
        <div className={cn(
          "absolute bottom-0 right-0 rounded-full bg-green-500 border-white shadow-sm z-10",
          dotSizes[size]
        )} />
      )}
    </div>
  );

  if (username) {
    return (
      <Link to={`/profile/${username}`} className="block hover:scale-105 transition-transform">
        {content}
      </Link>
    );
  }

  return content;
}
