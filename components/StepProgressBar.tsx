
import React from 'react';
import { 
  Shield, 
  Cpu, 
  FileText, 
  CreditCard, 
  CheckCircle 
} from 'lucide-react';
import { AppState } from '../types';

interface Props {
  currentState: AppState;
}

const STEPS = [
  { id: 'INTERVIEW', label: 'Ingestion', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'AGENT_PROCESSING', label: 'Synthesis', icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: 'QUOTE', label: 'Terms', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'PAYMENT', label: 'Execution', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: 'ISSUANCE', label: 'Finality', icon: <CheckCircle className="w-3.5 h-3.5" /> },
];

const StepProgressBar: React.FC<Props> = ({ currentState }) => {
  const currentIdx = STEPS.findIndex(s => s.id === currentState);

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-6">
        {STEPS.map((step, idx) => {
          const isActive = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {idx !== 0 && (
                <div 
                  className={`absolute top-4 -left-1/2 w-full h-[2px] z-0 transition-all duration-700 ${
                    idx <= currentIdx ? 'bg-[#B11226]' : 'bg-black/10'
                  }`} 
                />
              )}
              
              <div className={`
                relative z-10 flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all duration-500
                ${isCurrent ? 'bg-[#B11226] border-[#B11226] text-white shadow-xl rotate-45 scale-110' : 
                  isActive ? 'bg-white border-[#B11226] text-[#B11226]' : 'bg-white border-black/10 text-black/20'}
              `}>
                <div className={isCurrent ? '-rotate-45' : ''}>
                  {step.icon}
                </div>
              </div>
              
              <div className="mt-3 flex flex-col items-center">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isActive ? 'text-black' : 'text-black/30'
                }`}>
                  {step.label}
                </span>
                {isCurrent && <div className="w-1 h-1 bg-[#B11226] rounded-full mt-1 animate-ping" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressBar;
