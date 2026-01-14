
import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  Smartphone, 
  Wallet, 
  Building2, 
  ChevronRight,
  ShieldCheck,
  Circle,
  Lock,
  Loader2
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  iconBg: string;
}

interface Props {
  amount: number;
  onPay: (method: string) => void;
  isProcessing: boolean;
}

const METHODS: PaymentMethod[] = [
  { 
    id: 'card', 
    name: 'Standard Clearing', 
    description: 'Visa, Mastercard, AMEX Corporate', 
    icon: <CreditCard className="w-5 h-5" />, 
    color: 'border-black/10 bg-black/5',
    iconBg: 'bg-black'
  },
  { 
    id: 'applepay', 
    name: 'Biometric Pay', 
    description: 'Instant verification via Apple Pay', 
    icon: <Smartphone className="w-5 h-5" />, 
    color: 'border-black/5 bg-white',
    iconBg: 'bg-black'
  },
  { 
    id: 'zelle', 
    name: 'RTGS Network', 
    description: 'Direct bank-to-bank wire protocol', 
    icon: <Building2 className="w-5 h-5" />, 
    color: 'border-black/5 bg-white',
    iconBg: 'bg-black'
  }
];

const PaymentGateway: React.FC<Props> = ({ amount, onPay, isProcessing }) => {
  const [selected, setSelected] = useState('card');
  const annualAmount = amount * 12;

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-[2.5rem] shadow-[0_64px_128px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-black/5 animate-in fade-in zoom-in duration-700">
      <div className="bg-black px-10 py-8 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/20"><Lock className="w-5 h-5 text-red-500" /></div>
          <h2 className="font-black text-sm uppercase tracking-[0.2em]">Secure Clearing</h2>
        </div>
        <button className="text-white/30 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-12 text-center bg-black/5 border-b border-black/5">
        <p className="text-[10px] text-black/30 font-black uppercase tracking-[0.2em]">Annual Authorized Premium</p>
        <div className="mt-4 flex items-baseline justify-center gap-2">
          <span className="text-3xl font-black text-black/20">$</span>
          <span className="text-7xl font-black text-black tracking-tighter">
            {annualAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="inline-flex items-center gap-3 mt-6 px-4 py-1.5 bg-white border border-black/10 rounded-full shadow-sm">
           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[10px] font-black text-black uppercase tracking-widest">Guaranteed Rate</span>
        </div>
      </div>

      <div className="p-10 space-y-5">
        <div className="space-y-4">
          {METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                selected === method.id 
                  ? `bg-black text-white border-black scale-[1.02] shadow-2xl` 
                  : 'border-black/5 hover:border-black/20 bg-white text-black'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xl ${method.id === selected ? 'bg-red-600' : 'bg-black'}`}>
                {method.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-[14px] uppercase tracking-tighter leading-none">{method.name}</h4>
                <p className={`text-[11px] font-bold mt-1.5 ${selected === method.id ? 'text-white/40' : 'text-black/30'}`}>{method.description}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected === method.id ? 'border-red-600' : 'border-black/10'}`}>
                 {selected === method.id && <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]" />}
              </div>
            </button>
          ))}
        </div>

        <button 
          onClick={() => onPay(selected)}
          disabled={isProcessing}
          className="w-full mt-10 py-7 bg-black hover:bg-[#B11226] text-white rounded-3xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-5 active:scale-95 disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="flex items-center gap-4">
               <Loader2 className="w-6 h-6 animate-spin" />
               <span>Verifying Clearing House...</span>
            </div>
          ) : (
            <>
              Confirm & Bind Policy
              <ShieldCheck className="w-6 h-6 text-red-500" />
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-black/20 font-black uppercase tracking-[0.2em] mt-8">
           SECURE TRANSACTION // ENCRYPTED NODE DGL-P1
        </p>
      </div>
    </div>
  );
};

export default PaymentGateway;
