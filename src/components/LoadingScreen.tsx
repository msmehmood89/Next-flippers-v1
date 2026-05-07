import React from 'react';
import { motion } from 'motion/react';
import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-400 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-400 blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="relative z-10 mb-12"
      >
        <Logo size="lg" />
      </motion.div>
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Modern progress bar */}
        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            animate={{ 
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="h-full w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-orange-400"
          />
        </div>
        
        <div className="text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1"
          >
            Please Wait
          </motion.p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] animate-pulse">
            Authenticating & Syncing...
          </p>
        </div>
      </div>

      {/* Security note */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 2 }}
        className="absolute bottom-12 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Secure Connection Established
      </motion.div>
    </div>
  );
}
