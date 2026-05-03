import React from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface DealStatusBarProps {
  status: 'payment_pending' | 'payment_secured' | 'in_escrow' | 'asset_transferred' | 'buyer_confirmed' | 'completed' | 'disputed' | 'refunded';
  className?: string;
  role?: 'buyer' | 'seller';
}

const STEPS = [
  { id: 'payment', label: 'Payment Secured', key: 'payment_secured' },
  { id: 'escrow', label: 'Escrow Lock', key: 'in_escrow' },
  { id: 'transfer', label: 'Asset Delivered', key: 'asset_transferred' },
  { id: 'confirmed', label: 'Buyer Confirmed', key: 'buyer_confirmed' },
  { id: 'complete', label: 'Deal Finalized', key: 'completed' },
  { id: 'cancelled', label: 'Refunded/Cancelled', key: 'refunded' }
];

export default function DealStatusBar({ status, className, role }: DealStatusBarProps) {
  const getStepStatus = (stepKey: string, index: number) => {
    const statusOrder = ['payment_pending', 'payment_secured', 'in_escrow', 'asset_transferred', 'buyer_confirmed', 'completed', 'refunded', 'disputed'];
    const currentIdx = statusOrder.indexOf(status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  };

  if (status === 'completed') {
    return (
      <div className={cn("w-full py-8 text-center bg-green-50 rounded-[2rem] border-2 border-green-100", className)}>
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-green-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-green-900 uppercase tracking-widest mb-1">Deal Completed Successfully</h3>
        <p className="text-sm font-bold text-green-700">The transaction is finalized and funds have been released to the seller.</p>
      </div>
    );
  }

  if (status === 'refunded') {
    return (
      <div className={cn("w-full py-8 text-center bg-red-50 rounded-[2rem] border-2 border-red-100", className)}>
        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-red-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-red-900 uppercase tracking-widest mb-1">Order Cancelled & Refunded</h3>
        <p className="text-sm font-bold text-red-700">This transaction has been voided and funds returned to the buyer.</p>
      </div>
    );
  }

  const getStatusDescription = () => {
    switch (status) {
      case 'payment_pending':
        return role === 'buyer' ? "Waiting for admin to confirm your payment." : "Buyer has initiated payment. Waiting for admin confirmation.";
      case 'payment_secured':
        return "Funds are safely held by Admin. Work can begin.";
      case 'in_escrow':
        return "Transaction is in active escrow. Seller is preparing the asset/service.";
      case 'asset_transferred':
        return role === 'buyer' ? "Seller has delivered the work. Please review and confirm." : "You have delivered the work. Waiting for buyer's confirmation.";
      case 'buyer_confirmed':
        return role === 'buyer' ? "You have confirmed the delivery. Waiting for Admin to release payment to the seller." : "Buyer has confirmed your work! Waiting for Admin to release your payment.";
      default:
        return `Current Stage: ${status?.replace(/_/g, ' ') || 'Processing'}`;
    }
  };

  return (
    <div className={cn("w-full py-6", className)}>
      <div className="flex items-center justify-between relative px-4">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
        
        {STEPS.map((step, i) => {
          const stepStatus = getStepStatus(step.key, i);
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500",
                stepStatus === 'completed' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" :
                stepStatus === 'current' ? "bg-white border-2 border-indigo-600 text-indigo-600 ring-4 ring-indigo-50" :
                "bg-white border-2 border-gray-200 text-gray-300"
              )}>
                {stepStatus === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : stepStatus === 'current' ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 fill-current" />
                )}
              </div>
              
              <div className="text-center absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  stepStatus === 'completed' ? "text-indigo-600" :
                  stepStatus === 'current' ? "text-indigo-600" : "text-gray-400"
                )}>
                  {step.label}
                </div>
              </div>

              {/* Connecting Line (Progress) */}
              {i < STEPS.length - 1 && (
                <div className="absolute top-5 left-1/2 w-full h-0.5 pointer-events-none">
                  <div className={cn(
                    "h-full transition-all duration-700",
                    getStepStatus(STEPS[i + 1].key, i + 1) === 'completed' ? "bg-indigo-600 w-full" : "bg-transparent w-0"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Detail Label */}
      <div className="mt-14 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <ArrowRight className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-indigo-900 leading-relaxed">
          {getStatusDescription()}
        </p>
      </div>
    </div>
  );
}
