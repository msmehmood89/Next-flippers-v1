import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight, ShieldCheck, Truck, ThumbsUp, DollarSign, Wallet, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface DealStatusBarProps {
  status: 'payment_pending' | 'payment_secured' | 'in_escrow' | 'assets_delivering' | 'asset_transferred' | 'buyer_confirmed' | 'payment_released' | 'seller_received' | 'completed' | 'disputed' | 'refunded';
  className?: string;
  role?: 'buyer' | 'seller';
}

const STEPS = [
  { id: 'payment', label: 'Payment Secured', key: 'payment_secured', icon: ShieldCheck },
  { id: 'delivering', label: 'Assets Delivering', key: 'assets_delivering', icon: Truck },
  { id: 'transfer', label: 'Assets Delivered', key: 'asset_transferred', icon: ThumbsUp },
  { id: 'confirmed', label: 'Buyer Confirmed', key: 'buyer_confirmed', icon: CheckCircle2 },
  { id: 'released', label: 'Payment Released', key: 'payment_released', icon: DollarSign },
  { id: 'received', label: 'Payment Received', key: 'seller_received', icon: Wallet },
  { id: 'complete', label: 'Deal Completed', key: 'completed', icon: CheckCircle }
];

export default function DealStatusBar({ status, className, role }: DealStatusBarProps) {
  // Translate old status 'in_escrow' to modern 'assets_delivering' for legacy support
  const activeStatus = status === 'in_escrow' ? 'assets_delivering' : status;

  const getStepStatus = (stepKey: string, index: number) => {
    const statusOrder = [
      'payment_pending',
      'payment_secured',
      'assets_delivering',
      'asset_transferred',
      'buyer_confirmed',
      'payment_released',
      'seller_received',
      'completed'
    ];
    const currentIdx = statusOrder.indexOf(activeStatus);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  if (activeStatus === 'completed') {
    return (
      <div className={cn("w-full py-8 px-6 text-center bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-[2rem] border-2 border-emerald-100/80 shadow-md", className)}>
        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-emerald-150 animate-bounce">
          <CheckCircle className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-black text-emerald-900 uppercase tracking-widest mb-1.5 leading-none">Deal Completed Successfully</h3>
        <p className="text-xs font-bold text-emerald-700/80 max-w-lg mx-auto">
          The transaction is completely finalized. The buyer has confirmed receiving the assets, the admin has released the payment, and the seller has confirmed safe receipt of funds.
        </p>
      </div>
    );
  }

  if (activeStatus === 'refunded') {
    return (
      <div className={cn("w-full py-8 px-6 text-center bg-red-50/50 rounded-[2rem] border-2 border-red-150", className)}>
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-red-200">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-black text-red-900 uppercase tracking-widest mb-1 leading-none">Order Cancelled & Refunded</h3>
        <p className="text-xs font-bold text-red-700 max-w-md mx-auto">
          This transaction has been cancelled. Funds have been securely reverted and refunded back to the buyer's account.
        </p>
      </div>
    );
  }

  const getStatusDescription = () => {
    switch (activeStatus) {
      case 'payment_pending':
        return role === 'buyer' 
          ? "Waiting for administrative team to securely verify your transfer receipt." 
          : "Buyer has initiated transaction. Waiting for admin to secure the payment.";
      case 'payment_secured':
        return role === 'buyer'
          ? "Your payment is secured in Escrow! Assets delivery is now starting."
          : "Buyer's payment is verified and secured in Escrow. Please begin delivering the assets immediately.";
      case 'assets_delivering':
        return role === 'buyer'
          ? "The seller is currently in the process of preparing and delivering your assets/services."
          : "Please deliver the digital assets or credentials to the buyer, then mark them as delivered below.";
      case 'asset_transferred':
        return role === 'buyer'
          ? "Seller has marked assets as Delivered. Please inspect carefully then submit your confirmation."
          : "You have delivered the assets. Awaiting the buyer's review and security confirmation.";
      case 'buyer_confirmed':
        return role === 'buyer'
          ? "You have confirmed delivery! The admin is now processing payment dispatch to the seller."
          : "Buyer has verified safe receipt! Admin is now reviewing details to release your funds.";
      case 'payment_released':
        return role === 'buyer'
          ? "Admin has released and dispatched funds to the seller's account."
          : "Congratulations! Admin has dispatched payment to your account. Please check your account and mark as received.";
      case 'seller_received':
        return "Seller has confirmed receipt of funds! Completing the transaction pipeline...";
      default:
        return `Current Stage: ${activeStatus?.replace(/_/g, ' ') || 'Processing'}`;
    }
  };

  return (
    <div className={cn("w-full p-1", className)}>
      {/* Scrollable container on mobile, flex row on desktop */}
      <div className="overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex items-center justify-between min-w-[850px] relative px-4 py-6">
          {/* Progress bar backbone */}
          <div className="absolute top-[40px] left-12 right-12 h-1 bg-gray-100 z-0 rounded-full" />
          
          {STEPS.map((step, i) => {
            const stepStatus = getStepStatus(step.key, i);
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 flex-1 min-w-[110px]">
                {/* Connector progress fill */}
                {i > 0 && (
                  <div className="absolute right-1/2 top-[24px] -translate-y-1/2 w-full h-1 -z-10 pointer-events-none">
                    <div className={cn(
                      "h-full transition-all duration-700 rounded-full",
                      stepStatus === 'completed' || stepStatus === 'current' ? "bg-indigo-600" : "bg-transparent"
                    )} />
                  </div>
                )}

                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative",
                  stepStatus === 'completed' ? "bg-indigo-600 text-white shadow-md shadow-indigo-150 border-2 border-indigo-600" :
                  stepStatus === 'current' ? "bg-white border-2 border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-inner" :
                  "bg-white border-2 border-gray-200 text-gray-300"
                )}>
                  <StepIcon className="w-5 h-5" />
                  {stepStatus === 'current' && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
                  )}
                </div>
                
                <div className="text-center mt-1 px-1 max-w-[110px]">
                  <div className={cn(
                    "text-[10px] font-black uppercase tracking-wider block leading-snug whitespace-normal break-words",
                    stepStatus === 'completed' ? "text-indigo-600 font-extrabold" :
                    stepStatus === 'current' ? "text-indigo-600 font-extrabold" : "text-gray-400"
                  )}>
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Escrow Guidance Card */}
      <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50/60 to-white rounded-2xl border border-indigo-100/50 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
          <ArrowRight className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Escrow Guidance</div>
          <p className="text-xs font-bold text-indigo-900 leading-relaxed">
            {getStatusDescription()}
          </p>
        </div>
      </div>
    </div>
  );
}
