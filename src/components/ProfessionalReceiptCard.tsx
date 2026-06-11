import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ShieldCheck, Receipt, DollarSign, CreditCard, 
  User, CheckCircle2, Calendar, FileText, ArrowRight, FileCheck2, Landmark
} from 'lucide-react';

interface ProfessionalReceiptCardProps {
  transaction: Transaction & { title?: string; image?: string };
  className?: string;
  role?: 'buyer' | 'seller' | 'admin';
}

export default function ProfessionalReceiptCard({ transaction, className, role = 'buyer' }: ProfessionalReceiptCardProps) {
  const payout = transaction.payoutDetails;
  
  if (!payout) {
    return null;
  }

  const basePrice = transaction.salePrice || 0;
  const platformFee = payout.platformFee !== undefined ? payout.platformFee : (basePrice * 0.05);
  const transactionFee = payout.transactionFee !== undefined ? payout.transactionFee : 0;
  const netDisbursed = payout.amount !== undefined ? payout.amount : (basePrice - platformFee - transactionFee);
  
  // Format dates elegantly
  const rawDate = (transaction as any).sellerPaidAt || transaction.createdAt;
  const dateFormatted = rawDate 
    ? new Date((rawDate as any).toDate ? (rawDate as any).toDate() : rawDate).toLocaleString()
    : new Date().toLocaleString();

  return (
    <div className={cn("w-full max-w-xl mx-auto bg-white rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-50/40 overflow-hidden", className)}>
      {/* Receipt Ribbon Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 text-white relative">
        {/* Dynamic dot design */}
        <div className="absolute right-4 top-4 w-20 h-20 bg-white/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Receipt className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-black tracking-widest text-indigo-200 block leading-none">NEXT FLIPPERS</span>
              <h4 className="text-sm font-black uppercase tracking-wider mt-0.5">Escrow Disbursement Receipt</h4>
            </div>
          </div>
          
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/30">
              <ShieldCheck className="w-2.5 h-2.5" />
              Released
            </span>
          </div>
        </div>
      </div>

      {/* Main Ticket Content */}
      <div className="p-6 space-y-6 relative">
        
        {/* Transaction Meta Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-dashed border-gray-100">
          <div className="min-w-0 w-full sm:w-auto">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 block leading-none mb-1">Transaction Ref</span>
            <span className="font-mono text-[10px] sm:text-xs font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 block sm:inline-block truncate select-all">
              #{transaction.id.toUpperCase()}
            </span>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 block leading-none mb-1">Disbursement Date & Time</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 flex items-center gap-1 justify-start sm:justify-end">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {dateFormatted}
            </span>
          </div>
        </div>

        {/* Financial Reconciliation Section */}
        <div className="space-y-3">
          <span className="text-[9px] uppercase font-black tracking-widest text-indigo-500 block">Funds Audit Trail</span>
          
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/50 space-y-2.5">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Gross Deal Price:</span>
              <span className="font-semibold text-gray-800">{formatCurrency(basePrice)}</span>
            </div>
            
            <div className="flex justify-between text-xs text-rose-600/90">
              <span className="flex items-center gap-1">Platform Facilitation Fee (5%):</span>
              <span className="font-semibold">- {formatCurrency(platformFee)}</span>
            </div>

            {transactionFee > 0 && (
              <div className="flex justify-between text-xs text-rose-600/90">
                <span className="flex items-center gap-1">Transaction/Gateway Fee:</span>
                <span className="font-semibold">- {formatCurrency(transactionFee)}</span>
              </div>
            )}

            <div className="pt-2.5 border-t border-dashed border-gray-200 flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-gray-100">
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Net Amount Settled:</span>
              <span className="text-base font-black text-indigo-600">{formatCurrency(netDisbursed)}</span>
            </div>
          </div>
        </div>

        {/* Recipient Bank Details Block */}
        <div className="space-y-3">
          <span className="text-[9px] uppercase font-black tracking-widest text-indigo-500 block">Beneficiary Credentials</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/40">
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-indigo-400 tracking-wider">
                <User className="w-3.5 h-3.5" />
                Account Holder
              </div>
              <p className="text-xs font-bold text-indigo-950 truncate">
                {payout.accountHolderName || "Authorized Merchant"}
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-indigo-400 tracking-wider">
                <Landmark className="w-3.5 h-3.5" />
                Payout Gateway / Method
              </div>
              <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full shadow" />
                {payout.payoutMethod || payout.accountTitle || "Standard Gateway"}
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2 pt-2.5 border-t border-indigo-100/30">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-indigo-400 tracking-wider">
                <CreditCard className="w-3.5 h-3.5" />
                Receiving Account / Address / IBAN
              </div>
              <p className="text-xs font-mono font-bold text-indigo-950 bg-white/70 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 break-all select-all">
                {payout.bankAccount || "Saved payout wallet"}
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-indigo-100/10">
              <div className="flex items-center gap-1.5 text-[9px] uppercase font-black text-indigo-400 tracking-wider">
                <FileCheck2 className="w-3.5 h-3.5" />
                Receipt Reference ID
              </div>
              <p className="text-xs font-mono font-bold text-emerald-700 bg-white/70 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 break-all">
                {payout.trxId || payout.paymentRefCode || "Internal Settlement"}
              </p>
            </div>

          </div>
        </div>

        {/* Administration Notes */}
        {payout.notes && (
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 block">Verification Memo</span>
            <p className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-150 rounded-2xl p-4 italic relative">
              "{payout.notes}"
            </p>
          </div>
        )}

        {/* Transfer Screenshot Attachment */}
        {payout.screenshot && (
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-400 block">Secured Transfer Screenshot</span>
            <a 
              href={payout.screenshot} 
              target="_blank" 
              rel="noreferrer" 
              className="block overflow-hidden rounded-2xl border border-dashed border-gray-200 aspect-[16/9] hover:opacity-90 transition-opacity bg-neutral-900 relative group"
            >
              <img src={payout.screenshot} alt="Payment Receipt" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                View Proof In New Tab
              </div>
            </a>
          </div>
        )}

        {/* Professional Border Ticket Cutout Effect */}
        <div className="absolute -left-3 bottom-[90px] w-6 h-6 bg-gray-50 rounded-full border-r border-indigo-100 z-10 pointer-events-none hidden md:block" />
        <div className="absolute -right-3 bottom-[90px] w-6 h-6 bg-gray-50 rounded-full border-l border-indigo-100 z-10 pointer-events-none hidden md:block" />
      </div>

      {/* Bottom Legal Disclaimer Footer */}
      <div className="bg-gray-50/50 p-4 border-t border-gray-100 text-center">
        <p className="text-[9px] text-gray-400 font-bold leading-normal">
          Verified Next Flippers Transaction Ledger. Protected under escrow vault protocols. Generated on {dateFormatted}
        </p>
      </div>
    </div>
  );
}
