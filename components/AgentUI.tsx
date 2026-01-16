
import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  LayoutGrid, 
  MessageSquarePlus, 
  ClipboardCheck, 
  Fingerprint, 
  Stethoscope, 
  FlaskConical, 
  Brain, 
  Zap, 
  Dna, 
  Coins, 
  Search, 
  UserCheck, 
  Scale,
  Activity,
  Terminal,
  ShieldAlert
} from 'lucide-react';

interface Props {
  reasoning: string;
  decisionText: string;
  isProcessing: boolean;
  riskScore: number;
}

const AGENTS_CHAIN = [
  { name: 'Orchestrator Agent', icon: <LayoutGrid className="w-4 h-4" /> },
  { name: 'Application Intake Agent', icon: <MessageSquarePlus className="w-4 h-4" /> },
  { name: 'Data Integrity & Disclosure Validation', icon: <ClipboardCheck className="w-4 h-4" /> },
  { name: 'Fraud & Anomaly Detection', icon: <Fingerprint className="w-4 h-4" /> },
  { name: 'Med Triage', icon: <Stethoscope className="w-4 h-4" /> },
  { name: 'Med Evidence Collection', icon: <FlaskConical className="w-4 h-4" /> },
  { name: 'Med Risk Interpretation', icon: <Brain className="w-4 h-4" /> },
  { name: 'Lifestyle & Medical Interaction', icon: <Zap className="w-4 h-4" /> },
  { name: 'Mortality Scoring & Risk Aggregation', icon: <Dna className="w-4 h-4" /> },
  { name: 'Pricing & Terms Recommendation', icon: <Coins className="w-4 h-4" /> },
  { name: 'Explainability & Adverse Action', icon: <Search className="w-4 h-4" /> },
  { name: 'Human Underwriter Collaboration', icon: <UserCheck className="w-4 h-4" /> },
  { name: 'Final Underwriting Decision', icon: <Scale className="w-4 h-4" /> }
];

const AGENT_LOGS = [
  "PROTOCOL_INIT: Initializing multi-agent underwriting cluster...",
  "CORE_INTAKE: Mapping user identity to demographic risk models.",
  "VALIDATION: Verifying disclosure integrity against external repositories.",
  "AUDIT_SCAN: Running behavioral anomaly detection on submission patterns.",
  "TRIAGE_ACT: Calculating clinical urgency markers for HbA1c/BMI.",
  "EVIDENCE_HARVEST: Aggregating historical clinical snapshots.",
  "RISK_PATH: Synthesizing diabetic complication mapping...",
  "LIFESTYLE_SYNC: Adjusting metabolic risk for activity hobbies.",
  "ACTUARIAL_SIM: Running 1,000,000 mortality simulations...",
  "PRICING_OPT: Optimizing premium terms for clinical stability.",
  "COMPLIANCE_GEN: Drafting explainability logic for adverse actions.",
  "SYNC_BRIDGE: Transmitting case file for human-agent consensus.",
  "FINAL_AUTH: Authorizing policy issuance under protocol CL-9."
];

const AgentUI: React.FC<Props> = ({ reasoning, decisionText, isProcessing, riskScore }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isProcessing) {
      setLogs([]);
      let i = 0;
      const interval = setInterval(() => {
        if (i < AGENT_LOGS.length) {
          setLogs(prev => [...prev, AGENT_LOGS[i]]);
          setActiveIndex(i);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 550);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  if (isProcessing) {
    return (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-7 sm:grid-cols-13 gap-2 px-4 py-6 bg-black/5 rounded-2xl border border-black/10">
          {AGENTS_CHAIN.map((agent, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 border-2 ${
                  idx === activeIndex ? 'bg-[#B11226] text-white scale-110 shadow-2xl border-[#B11226] agent-node-active' : 
                  idx < activeIndex ? 'bg-black text-white border-black' : 'bg-white text-black border-black/5'
                }`}
              >
                {agent.icon}
              </div>
              <div className={`w-1 h-1 rounded-full ${idx === activeIndex ? 'bg-[#B11226]' : idx < activeIndex ? 'bg-black' : 'bg-black/10'}`} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dark-glass rounded-3xl p-8 font-mono text-[11px] overflow-hidden relative shadow-2xl">
            <div className="scan-line" />
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-red-500" />
                <span className="text-red-500 font-black uppercase tracking-widest">Operational System Audit</span>
              </div>
              <span className="text-white text-[9px] font-bold">NODE_01 // SECURE_INTAKE</span>
            </div>
            <div className="space-y-2.5 h-[220px] overflow-y-auto custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 items-start animate-in slide-in-from-left-4 duration-300">
                  <span className="text-white shrink-0 font-bold">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                  <span className={i === activeIndex ? "text-red-400 font-bold" : "text-white"}>
                     {i === activeIndex ? ">>> " : "    "}{log}
                  </span>
                </div>
              ))}
              {logs.length < AGENT_LOGS.length && (
                <div className="flex items-center gap-3 text-white pt-3 italic font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing metabolic data packets...</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-black/10 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="w-5 h-5 text-black" />
                <span className="text-[10px] font-black uppercase text-black tracking-[0.2em]">System Integrity</span>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs font-bold">
                   <span className="text-black uppercase tracking-tighter">Throughput</span>
                   <span>94.2%</span>
                </div>
                <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[#B11226] w-11/12 rounded-full animate-pulse shadow-[0_0_8px_rgba(177,18,38,0.5)]" />
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                   <span className="text-black uppercase tracking-tighter">Chain Consensus</span>
                   <span className="text-[#B11226]">VALIDATING</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                   <span className="text-black uppercase tracking-tighter">Encryption</span>
                   <span className="text-black">ACTIVE</span>
                </div>
              </div>
            </div>
            <div className="mt-8 p-5 bg-black text-white rounded-2xl border border-white/10 shadow-xl">
               <p className="text-[9px] font-bold leading-relaxed uppercase tracking-widest text-center">Protocol CL-OS active. Deterministic underwriting in progress.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-black/10 shadow-xl flex flex-col items-center justify-center text-center">
          <div className="relative w-36 h-36 flex items-center justify-center mb-5">
            <svg className="w-full h-full -rotate-90">
              <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-black/5" />
              <circle 
                cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="10" fill="transparent" 
                strokeDasharray={402.12}
                strokeDashoffset={402.12 - (402.12 * riskScore) / 100}
                className={`transition-all duration-1000 ${riskScore < 30 ? 'text-emerald-500' : riskScore < 60 ? 'text-amber-500' : 'text-[#B11226]'}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-black leading-none tracking-tighter">{riskScore.toFixed(0)}</span>
              <span className="text-[10px] font-black text-black uppercase mt-2 tracking-widest">Risk Index</span>
            </div>
          </div>
          <p className="text-[10px] font-black text-black px-4 uppercase tracking-widest">Aggregate Actuarial Score</p>
        </div>

        <div className="md:col-span-3 bg-black rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-white pointer-events-none">
            <Activity className="w-48 h-48" />
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#B11226] rounded-2xl shadow-xl shadow-red-900/20"><Search className="w-5 h-5 text-white" /></div>
            <div>
              <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.2em]">Clinical Explainability Summary</h4>
              <p className="text-[9px] font-bold text-white uppercase tracking-widest">AUTHORIZED PROTOCOL CL-X</p>
            </div>
          </div>
          <p className="text-white text-base leading-relaxed font-medium">"{reasoning}"</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-8 shadow-sm flex items-start gap-8">
        <div className="p-5 bg-black text-white rounded-2xl shadow-2xl shrink-0">
          <Scale className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-2">Final System Authorization</h4>
          <p className="text-black text-xl font-black leading-tight tracking-tight">{decisionText}</p>
        </div>
      </div>
    </div>
  );
};

export default AgentUI;