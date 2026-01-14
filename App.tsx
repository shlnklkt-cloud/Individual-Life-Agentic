
import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  ArrowRight, 
  Download, 
  Shield, 
  PlusCircle, 
  CheckCircle, 
  Send, 
  User, 
  ArrowRightLeft, 
  Stethoscope, 
  Wallet, 
  FileCheck, 
  LayoutGrid, 
  MessageSquarePlus, 
  ClipboardCheck, 
  Fingerprint, 
  FlaskConical, 
  Brain, 
  Zap, 
  Dna, 
  Coins, 
  Search, 
  UserCheck, 
  Scale, 
  Settings2, 
  ChevronLeft, 
  ChevronRight,
  Edit3, 
  Activity, 
  Command, 
  ArrowUpRight, 
  RefreshCw, 
  Cpu,
  Lock,
  LogOut,
  AlertCircle,
  Briefcase,
  FileText,
  ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import StepProgressBar from './components/StepProgressBar';
import AgentUI from './components/AgentUI';
import PaymentGateway from './components/PaymentGateway';
import { AppState, UserData, UnderwritingDecision, Message, AgentName, MainView } from './types';
import { COMPLICATIONS_OPTIONS } from './constants';
import { PricingEngine } from './services/pricingEngine';
import { performAIUnderwriting } from './services/geminiService';

const AGENT_REGISTRY: Record<AgentName, { role: string; icon: React.ReactNode; color: string; accent: string }> = {
  'Orchestrator Agent': { role: 'Workflow Lead', icon: <LayoutGrid className="w-4 h-4" />, color: 'bg-slate-900', accent: 'text-slate-400' },
  'Application Intake Agent': { role: 'Intake Specialist', icon: <MessageSquarePlus className="w-4 h-4" />, color: 'bg-red-700', accent: 'text-red-400' },
  'Data Integrity & Disclosure Validation': { role: 'KYC Expert', icon: <ClipboardCheck className="w-4 h-4" />, color: 'bg-rose-700', accent: 'text-rose-300' },
  'Fraud & Anomaly Detection': { role: 'Risk Auditor', icon: <Fingerprint className="w-4 h-4" />, color: 'bg-slate-950', accent: 'text-red-500' },
  'Med Triage': { role: 'Clinical Filter', icon: <Stethoscope className="w-4 h-4" />, color: 'bg-emerald-700', accent: 'text-emerald-400' },
  'Med Evidence Collection': { role: 'Data Harvester', icon: <FlaskConical className="w-4 h-4" />, color: 'bg-teal-700', accent: 'text-teal-400' },
  'Med Risk Interpretation': { role: 'Clinical Pathologist', icon: <Brain className="w-4 h-4" />, color: 'bg-violet-700', accent: 'text-violet-400' },
  'Lifestyle & Medical Interaction': { role: 'Metabolic Specialist', icon: <Zap className="w-4 h-4" />, color: 'bg-amber-600', accent: 'text-amber-400' },
  'Mortality Scoring & Risk Aggregation': { role: 'Actuarial Scientist', icon: <Dna className="w-4 h-4" />, color: 'bg-red-900', accent: 'text-red-600' },
  'Pricing & Terms Recommendation': { role: 'Premium Strategist', icon: <Coins className="w-4 h-4" />, color: 'bg-yellow-600', accent: 'text-yellow-400' },
  'Explainability & Adverse Action': { role: 'Compliance Officer', icon: <Search className="w-4 h-4" />, color: 'bg-cyan-700', accent: 'text-cyan-400' },
  'Human Underwriter Collaboration': { role: 'Bridge Agent', icon: <UserCheck className="w-4 h-4" />, color: 'bg-orange-600', accent: 'text-orange-400' },
  'Final Underwriting Decision': { role: 'Executive Sign-off', icon: <Scale className="w-4 h-4" />, color: 'bg-[#B11226]', accent: 'text-white' },
  'Finley': { role: 'Finance Agent', icon: <Wallet className="w-4 h-4" />, color: 'bg-indigo-700', accent: 'text-indigo-400' },
  'Lyra': { role: 'Issuance Officer', icon: <FileCheck className="w-4 h-4" />, color: 'bg-pink-700', accent: 'text-pink-400' }
};

const INTERVIEW_STEPS: { label: string; key: keyof UserData; question: any; type: string; agent: AgentName; options?: any; labels?: any; min?: any; max?: any; step?: any }[] = [
  { label: 'Name', key: 'fullName', agent: 'Orchestrator Agent', question: "Welcome. I am the Orchestrator. We are beginning the ingestion phase for your clinical life insurance application. Let's start with your legal name.", type: 'text' },
  { label: 'Age', key: 'age', agent: 'Application Intake Agent', question: (name: string) => `Received, ${name.split(' ')[0]}. Intake is active. Please state your current age.`, type: 'number' },
  { label: 'Gender', key: 'gender', agent: 'Application Intake Agent', question: "Identify your gender for actuarial modeling.", type: 'choice', options: ['Male', 'Female', 'Other'], labels: ['Male', 'Female', 'Non-binary / Other'] },
  { label: 'Occupation', key: 'occupation', agent: 'Data Integrity & Disclosure Validation', question: "Validation Agent active. What is your current professional occupation?", type: 'choice', options: ['IT Project Manager', 'Office/Admin', 'Healthcare Professional', 'Manual Labor/Trade', 'Education', 'Other'], labels: ['IT Project Manager', 'Office/Administrative', 'Healthcare', 'Manual Labor/Trade', 'Education', 'Other'] },
  { label: 'Product Selection', key: 'product', agent: 'Application Intake Agent', question: "Select your desired coverage vehicle.", type: 'choice', options: ['10-year Term Life', '20-year Term Life', '30-year Term Life', 'Whole Life'], labels: ['10-year Term Life', '20-year Term Life', '30-year Term Life', 'Whole Life'] },
  { label: 'Email', key: 'email', agent: 'Data Integrity & Disclosure Validation', question: "Provide a secure email for digital document encryption.", type: 'email' },
  { label: 'Tobacco Status', key: 'smokingStatus', agent: 'Fraud & Anomaly Detection', question: "Audit Agent checking in. Disclose any tobacco or nicotine product history.", type: 'choice', options: ['NON_SMOKER', 'SMOKER'], labels: ['No History', 'Active Use'] },
  { label: 'Alcohol Intake', key: 'alcoholConsumption', agent: 'Fraud & Anomaly Detection', question: "Quantify your weekly alcohol consumption for our lifestyle models.", type: 'choice', options: ['None', 'Occasional', 'Moderate', 'Frequent'], labels: ['None', 'Occasional (1-2)', 'Moderate (3-7)', 'Frequent (7+)'] },
  { label: 'Hobby & Activity', key: 'hobby', agent: 'Lifestyle & Medical Interaction', question: "Lifestyle Synthesis active. What is your primary physical activity hobby?", type: 'choice', options: ['Walking/Hiking', 'Yoga', 'Swimming', 'Team Sports', 'Reading/Gaming', 'Gardening'], labels: ['Walking/Hiking', 'Yoga', 'Swimming', 'Team Sports', 'Reading/Gaming', 'Gardening'] },
  { label: 'Coverage Amount', key: 'coverageAmount', agent: 'Med Triage', question: "Triage is active. Select requested death benefit (USD).", type: 'range', min: 100000, max: 1000000, step: 50000 },
  { label: 'Diagnosis Duration', key: 'yearsDiagnosed', agent: 'Med Triage', question: "Years since primary diabetic diagnosis?", type: 'choice', options: [0.5, 3, 8, 15, 25], labels: ['< 1 Year', '1-5 Years', '5-10 Years', '10-20 Years', '20+ Years'] },
  { label: 'HbA1c Level', key: 'hba1c', agent: 'Med Evidence Collection', question: "Evidence Collection initiated. Most recent HbA1c percentage (%)?", type: 'range', min: 4, max: 12, step: 0.1 },
  { label: 'BMI Index', key: 'bmi', agent: 'Med Evidence Collection', question: "Provide your current Body Mass Index (BMI).", type: 'choice', options: [17.5, 22.0, 27.5, 32.5, 38.0], labels: ['Underweight', 'Healthy (18-25)', 'Overweight', 'Obese (30+)', 'Severely Obese'] },
  { label: 'Complications', key: 'complications', agent: 'Med Risk Interpretation', question: "Risk Pathologist active. Select any clinical complications present.", type: 'multi-choice', options: COMPLICATIONS_OPTIONS },
];

const App: React.FC = () => {
  // Auth & View State
  const [currentView, setCurrentView] = useState<MainView>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showInsuranceDropdown, setShowInsuranceDropdown] = useState(false);

  // Bot State
  const [state, setState] = useState<AppState>(AppState.INTERVIEW);
  const [activeAgent, setActiveAgent] = useState<AgentName>('Orchestrator Agent');
  const [transferring, setTransferring] = useState<AgentName | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showModifyMenu, setShowModifyMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', agentName: 'Orchestrator Agent', text: INTERVIEW_STEPS[0].question as string, timestamp: new Date() }
  ]);
  const [userData, setUserData] = useState<UserData>({
    fullName: '', email: '', age: 45, gender: 'Other', occupation: 'Office/Admin', product: '20-year Term Life',
    smokingStatus: 'NON_SMOKER', alcoholConsumption: 'None', hobby: 'Reading/Gaming',
    coverageAmount: 250000, hba1c: 6.2, bmi: 24, yearsDiagnosed: 5, complications: ['None'],
  });

  const [decision, setDecision] = useState<UnderwritingDecision | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [policyId, setPolicyId] = useState<string>('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const insuranceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (insuranceDropdownRef.current && !insuranceDropdownRef.current.contains(event.target as Node)) {
        setShowInsuranceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'SUPERUSER' && password === 'Password@2026') {
      setCurrentView('DASHBOARD');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setCurrentView('LOGIN');
    setUsername('');
    setPassword('');
  };

  const startPolicyApp = () => {
    setMessages([{ id: '1', role: 'agent', agentName: 'Orchestrator Agent', text: INTERVIEW_STEPS[0].question as string, timestamp: new Date() }]);
    setStepIndex(0);
    setState(AppState.INTERVIEW);
    setUserData({
      fullName: '', email: '', age: 45, gender: 'Other', occupation: 'Office/Admin', product: '20-year Term Life',
      smokingStatus: 'NON_SMOKER', alcoholConsumption: 'None', hobby: 'Reading/Gaming',
      coverageAmount: 250000, hba1c: 6.2, bmi: 24, yearsDiagnosed: 5, complications: ['None'],
    });
    setCurrentView('POLICY');
    setShowInsuranceDropdown(false);
  };

  const handleTransfer = (nextAgent: AgentName, nextState: AppState, callback?: () => void) => {
    setTransferring(nextAgent);
    setTimeout(() => {
      setActiveAgent(nextAgent);
      setState(nextState);
      setTransferring(null);
      if (callback) callback();
    }, 1500);
  };

  const handleJumpToQuestion = (index: number) => {
    const targetStep = INTERVIEW_STEPS[index];
    setMessages(prev => [...prev, { 
      id: `modify-${Date.now()}`, 
      role: 'agent', 
      agentName: 'Orchestrator Agent',
      text: `INTERRUPT: Direct-jump to ${targetStep.label} records. Re-initiating ingestion for this data point.`,
      timestamp: new Date() 
    }]);
    setStepIndex(index);
    setState(AppState.INTERVIEW);
    setActiveAgent(targetStep.agent);
    setShowModifyMenu(false);
  };

  const currentStep = INTERVIEW_STEPS[stepIndex];

  const handleUserResponse = (value: any, displayValue?: string) => {
    const textValue = displayValue || String(value);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    const updatedData = { ...userData, [currentStep.key]: value };
    setUserData(updatedData);

    if (stepIndex < INTERVIEW_STEPS.length - 1) {
      const nextStep = INTERVIEW_STEPS[stepIndex + 1];
      const nextAgentName = nextStep.agent;
      const agentChanged = nextAgentName !== activeAgent;

      setTimeout(() => {
        if (agentChanged) {
          setMessages(prev => [...prev, { 
            id: `handover-${Date.now()}`, 
            role: 'agent', 
            text: `PROTOCOL: HANDOVER ${activeAgent} ➔ ${nextAgentName}`,
            timestamp: new Date() 
          } as Message]);
          setActiveAgent(nextAgentName);
        }

        const nextQuestion = typeof nextStep.question === 'function' ? nextStep.question(updatedData.fullName) : nextStep.question;
        const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', agentName: nextAgentName, text: nextQuestion, timestamp: new Date() };
        setMessages(prev => [...prev, agentMsg]);
        setStepIndex(stepIndex + 1);
        setInputValue('');
      }, 800);
    } else {
      setMessages(prev => [...prev, { id: 'end', role: 'agent', agentName: 'Orchestrator Agent', text: "INGESTION_COMPLETE: Commencing multi-agent synthesis protocol.", timestamp: new Date() }]);
      setTimeout(() => {
        handleTransfer('Final Underwriting Decision', AppState.AGENT_PROCESSING, () => startAgentAnalysis(updatedData));
      }, 1200);
    }
  };

  const startAgentAnalysis = async (data: UserData) => {
    setIsProcessing(true);
    const result = PricingEngine.calculate(data);
    setDecision(result);
    const smartSummary = await performAIUnderwriting(data, result);
    setAiReasoning(smartSummary);
    setTimeout(() => setIsProcessing(false), 9000);
  };

  const handlePaymentTransition = () => {
    handleTransfer('Finley', AppState.PAYMENT);
  };

  const handlePolicyIssuance = () => {
    setIsIssuing(true);
    setTimeout(() => {
      const currentYear = new Date().getFullYear();
      const sequence = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      const id = `DGL-${currentYear}-${sequence}`;
      setPolicyId(id);
      setIsIssuing(false);
      handleTransfer('Lyra', AppState.ISSUANCE);
    }, 2500);
  };

  const downloadPolicyPDF = () => {
    if (!decision) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(177, 18, 38);
    doc.text('DIAGUARD LIFE INSURANCE POLICY', 20, 30);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Policy ID: ${policyId}`, 20, 50);
    doc.text(`Insured: ${userData.fullName}`, 20, 60);
    doc.text(`Coverage: $${userData.coverageAmount.toLocaleString()}`, 20, 70);
    doc.text(`Monthly Premium: $${decision.adjustedPremium.toFixed(2)}`, 20, 80);
    doc.text(`Risk Score: ${decision.riskScore.toFixed(1)}/100`, 20, 90);
    doc.text('Authorized by DiaGuard Intelligence Multi-Agent System', 20, 110);
    doc.save(`DiaGuard_Policy_${policyId}.pdf`);
  };

  if (currentView === 'LOGIN') {
    return (
      <div className="min-h-screen bg-[#B11226] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border-4 border-white rounded-full animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border-2 border-white rounded-full opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full opacity-5" />
        </div>

        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_64px_128px_-12px_rgba(0,0,0,0.3)] p-12 relative z-10 animate-in zoom-in fade-in duration-700">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#B11226] rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter">DiaGuard</h1>
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mt-2">Enterprise Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-2">Username</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-black/5 rounded-2xl border-2 border-transparent focus:border-[#B11226] focus:bg-white outline-none transition-all font-bold" 
                  placeholder="SUPERUSER"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-2">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-black/5 rounded-2xl border-2 border-transparent focus:border-[#B11226] focus:bg-white outline-none transition-all font-bold" 
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-xs font-bold text-red-600">Unauthorized credentials.</p>
              </div>
            )}

            <button type="submit" className="w-full py-5 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-black hover:shadow-black/20 transition-all flex items-center justify-center gap-3 active:scale-95">
              Secure Login <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center text-[9px] text-black/20 font-bold uppercase tracking-widest mt-12">
            Protocol: AES-256 // Node: DGL-AUTH-PRIMARY
          </p>
        </div>
      </div>
    );
  }

  const demographicSteps = INTERVIEW_STEPS.slice(0, 3);
  const lifestyleSteps = [...INTERVIEW_STEPS.slice(3, 4), ...INTERVIEW_STEPS.slice(6, 9)];
  const medicalSteps = [INTERVIEW_STEPS[4], INTERVIEW_STEPS[5], ...INTERVIEW_STEPS.slice(9)];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-red-100 selection:text-[#B11226] bg-white">
      {/* Top Utility Bar */}
      <div className="bg-slate-50 border-b border-black/5 py-2">
         <div className="max-w-7xl mx-auto px-6 flex justify-end gap-6 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <button className="hover:text-[#B11226] transition-colors">Find a form</button>
            <button className="hover:text-[#B11226] transition-colors">Contact us</button>
            <button className="hover:text-[#B11226] transition-colors">FR</button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 bg-[#B11226] text-white rounded-lg hover:bg-black transition-all">
              <LogOut className="w-3 h-3" />
              <span>Sign out</span>
            </button>
         </div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-[100] h-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Canada Life Style Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('DASHBOARD')}>
              <span className="text-2xl font-medium tracking-tighter text-slate-600">canada <span className="font-bold text-slate-800">life</span></span>
              <div className="w-10 h-10 bg-[#B11226] flex items-center justify-center text-white font-bold rounded-sm group-hover:rotate-6 transition-transform">
                TM
              </div>
            </div>
            
            <nav className="hidden lg:flex items-center space-x-8">
              {/* Insurance Menu with Dropdown */}
              <div className="relative" ref={insuranceDropdownRef}>
                <button 
                  onClick={() => setShowInsuranceDropdown(!showInsuranceDropdown)} 
                  className={`text-sm font-bold tracking-tight py-2 transition-colors border-b-2 flex items-center gap-1.5 ${currentView === 'POLICY' ? 'border-[#B11226] text-slate-900' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                >
                  Insurance <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showInsuranceDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showInsuranceDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-black/5 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.1)] rounded-xl py-3 animate-in fade-in slide-in-from-top-2 duration-300 z-[110]">
                    <button 
                      onClick={startPolicyApp}
                      className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#B11226] hover:bg-slate-50 transition-all flex items-center justify-between group"
                    >
                      Individual Life
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                    <button 
                      onClick={() => { setShowInsuranceDropdown(false); setCurrentView('CLAIM'); }}
                      className="w-full text-left px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#B11226] hover:bg-slate-50 transition-all flex items-center justify-between group"
                    >
                      Group Life
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  </div>
                )}
              </div>

              <button className="text-sm font-bold tracking-tight text-slate-600 hover:text-slate-900 flex items-center gap-1">Investing & saving <ChevronDown className="w-3.5 h-3.5" /></button>
              <button className="text-sm font-bold tracking-tight text-slate-600 hover:text-slate-900">Retirement</button>
              <button className="text-sm font-bold tracking-tight text-slate-600 hover:text-slate-900">Business solutions</button>
              <button className="text-sm font-bold tracking-tight text-slate-600 hover:text-slate-900">Insights & advice</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-2.5 hover:bg-slate-50 rounded-full transition-all group flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400 group-hover:text-[#B11226]" />
              <span className="text-sm font-bold text-slate-600">Search</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 py-12">
        
        {currentView === 'DASHBOARD' && (
          <div className="flex-1 animate-in fade-in duration-700">
            <div className="mb-12">
              <h1 className="text-5xl font-black text-black tracking-tighter uppercase mb-4">Central Hub</h1>
              <p className="text-black/60 font-medium">Select a specialized workflow to begin underwriting or claims processing.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div 
                onClick={startPolicyApp}
                className="group relative bg-white border border-black/5 rounded-[2.5rem] p-12 shadow-sm hover:shadow-2xl hover:border-[#B11226]/20 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Shield className="w-48 h-48 text-[#B11226]" />
                </div>
                <div className="w-16 h-16 bg-[#B11226] rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl">
                  <Briefcase className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-black uppercase tracking-tighter mb-4">Individual Life</h3>
                <p className="text-black/60 leading-relaxed mb-8 max-w-xs">Launch the multi-agent clinical ingestion protocol for specialized diabetic life insurance applications.</p>
                <div className="flex items-center gap-3 text-[#B11226] font-black text-xs uppercase tracking-widest">
                  Start Application <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>

              <div 
                onClick={() => setCurrentView('CLAIM')}
                className="group relative bg-white border border-black/5 rounded-[2.5rem] p-12 shadow-sm hover:shadow-2xl hover:border-[#B11226]/20 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Wallet className="w-48 h-48 text-[#B11226]" />
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black text-black uppercase tracking-tighter mb-4">Group Life & Claims</h3>
                <p className="text-black/60 leading-relaxed mb-8 max-w-xs">Verify clinical event markers and automate death benefit distribution through the secure clearing node.</p>
                <div className="flex items-center gap-3 text-slate-900 font-black text-xs uppercase tracking-widest">
                  Access Ledger <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'CLAIM' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-8">
              <Briefcase className="w-12 h-12 text-black/20" />
            </div>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter mb-4">Service Offline</h2>
            <p className="text-black/60 max-w-md mb-10">This module is currently in development. Specialized individual underwriting via our AI cluster is active.</p>
            <button 
              onClick={() => setCurrentView('DASHBOARD')}
              className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-[#B11226] transition-all shadow-xl"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {currentView === 'POLICY' && (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-700">
            <StepProgressBar currentState={state} />

            <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.1)] border border-black/5 overflow-hidden relative">
              
              {transferring && (
                <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
                  <div className="flex items-center gap-12 mb-8">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl shadow-2xl animate-pulse ${AGENT_REGISTRY[activeAgent].color}`}>
                      {AGENT_REGISTRY[activeAgent].icon}
                    </div>
                    <div className="relative">
                      <ArrowRightLeft className="w-10 h-10 text-[#B11226]/50" />
                      <div className="absolute inset-0 w-full h-full border-2 border-[#B11226] rounded-full animate-ping opacity-20" />
                    </div>
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl shadow-2xl ${AGENT_REGISTRY[transferring].color}`}>
                      {AGENT_REGISTRY[transferring].icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">Context Transfer</h3>
                  <p className="text-white mt-2 font-mono text-[10px] uppercase">Routing session to specialized agent...</p>
                </div>
              )}

              {state === AppState.INTERVIEW && (
                <div className="flex-1 flex flex-col overflow-hidden h-[600px]">
                  <div className="bg-black/5 px-8 py-3 border-b border-black/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-black uppercase tracking-widest">Operational Core:</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeAgent === 'Orchestrator Agent' ? 'text-black' : 'text-[#B11226]'}`}>{activeAgent}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-black/10 rounded-full shadow-sm">
                          <div className="w-1.5 h-1.5 bg-[#B11226] rounded-full animate-pulse" />
                          <span className="text-[9px] font-bold text-black uppercase">Live Intake</span>
                      </div>
                    </div>
                  </div>

                  <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 scroll-smooth custom-scrollbar">
                    {messages.map((m) => {
                      const isHandover = m.text.includes('PROTOCOL:');
                      if (isHandover) {
                        return (
                          <div key={m.id} className="flex justify-center my-6 animate-in fade-in zoom-in duration-500">
                            <div className="flex items-center gap-3 px-6 py-2 bg-black border border-white/10 rounded-full text-[9px] font-black text-white tracking-[0.15em] uppercase shadow-2xl">
                              <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
                              {m.text.split('PROTOCOL: ')[1]}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={m.id} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                          <div className={`max-w-[75%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${m.role === 'agent' ? (AGENT_REGISTRY[m.agentName || activeAgent]?.color || 'bg-black') + ' text-white border-white/10' : 'bg-white border-black/10 text-black'}`}>
                              {m.role === 'agent' ? AGENT_REGISTRY[m.agentName || activeAgent]?.icon : <User className="w-5 h-5" />}
                            </div>
                            <div className="flex flex-col">
                              {m.role === 'agent' && <p className="text-[9px] font-black uppercase mb-1.5 text-black tracking-widest">{m.agentName || activeAgent}</p>}
                              <div className={`p-5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${m.role === 'agent' ? 'bg-black/5 text-black rounded-tl-none border border-black/5' : 'bg-[#B11226] text-white rounded-tr-none'}`}>
                                {m.text}
                              </div>
                              <span className="text-[8px] font-bold text-black uppercase mt-1 self-end">{m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-8 border-t border-black/10 bg-white shadow-[0_-8px_32px_rgba(0,0,0,0.03)]">
                    <div className="max-w-3xl mx-auto">
                      {currentStep.type === 'text' || currentStep.type === 'email' || currentStep.type === 'number' ? (
                        <form onSubmit={(e) => { e.preventDefault(); if(inputValue) handleUserResponse(inputValue); }} className="relative group">
                          <input autoFocus type={currentStep.type === 'email' ? 'email' : currentStep.type === 'number' ? 'number' : 'text'} className="w-full pl-8 pr-20 py-5 rounded-[1.25rem] border-2 border-black/5 focus:border-[#B11226] focus:ring-0 outline-none transition-all font-medium text-black placeholder:text-black" placeholder="Awaiting input..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                          <button type="submit" className="absolute right-3 top-3 bottom-3 px-6 bg-[#B11226] text-white rounded-xl hover:bg-[#8B0E1D] transition-all shadow-lg active:scale-95 flex items-center gap-2"><Send className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Enter</span></button>
                        </form>
                      ) : currentStep.type === 'choice' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {currentStep.options?.map((opt, i) => (
                            <button key={opt} onClick={() => handleUserResponse(opt, currentStep.labels?.[i])} className="px-6 py-4 bg-white border-2 border-black/5 rounded-2xl font-bold text-black hover:border-[#B11226] hover:bg-[#B11226] hover:text-white transition-all text-xs flex flex-col items-center gap-2 group shadow-sm">
                              <span className="text-[#B11226] group-hover:text-red-200 font-mono text-[9px] uppercase tracking-widest font-bold">OPTION {i+1}</span>
                              {currentStep.labels?.[i]}
                            </button>
                          ))}
                        </div>
                      ) : currentStep.type === 'range' ? (
                        <div className="space-y-6 px-4">
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-black uppercase tracking-widest">Magnitude</span>
                              <span className="text-4xl font-black text-[#B11226]">{currentStep.key === 'coverageAmount' ? `$${userData.coverageAmount.toLocaleString()}` : `${userData.hba1c}%`}</span>
                            </div>
                            <div className="text-right flex flex-col">
                              <span className="text-[10px] font-bold text-black uppercase tracking-widest">Step: {currentStep.step}</span>
                            </div>
                          </div>
                          <input type="range" min={currentStep.min} max={currentStep.max} step={currentStep.step} className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer accent-[#B11226]" value={currentStep.key === 'hba1c' ? userData.hba1c : userData.coverageAmount} onChange={(e) => setUserData({...userData, [currentStep.key]: parseFloat(e.target.value)})} />
                          <button onClick={() => handleUserResponse(currentStep.key === 'hba1c' ? userData.hba1c : userData.coverageAmount, currentStep.key === 'hba1c' ? `${userData.hba1c}%` : `$${userData.coverageAmount.toLocaleString()}`)} className="w-full py-5 bg-[#B11226] text-white rounded-[1.25rem] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all">Verify Magnitude</button>
                        </div>
                      ) : currentStep.type === 'multi-choice' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {currentStep.options?.map(opt => (
                              <button key={opt} onClick={() => { const newComps = userData.complications.includes(opt) ? userData.complications.filter(c => c !== opt) : [...userData.complications.filter(c => c !== 'None'), opt]; setUserData({...userData, complications: newComps.length ? newComps : ['None']}); }} className={`px-6 py-4 rounded-2xl text-[11px] font-bold transition-all border-2 text-center flex flex-col gap-1 ${userData.complications.includes(opt) ? 'bg-[#B11226] border-[#B11226] text-white' : 'bg-white border-black/5 text-black hover:border-black/20'}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => handleUserResponse(userData.complications, userData.complications.join(', '))} className="w-full py-5 bg-[#B11226] text-white rounded-[1.25rem] font-black uppercase tracking-widest shadow-2xl">Confirm Selection</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {state === AppState.AGENT_PROCESSING && (
                <div className="p-12 flex-1 flex flex-col justify-center">
                  <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-[#B11226] shadow-2xl border border-white/10"><Cpu className="w-7 h-7" /></div>
                      <div>
                        <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Underwriting Synthesis</h2>
                        <p className="text-[11px] font-bold text-black uppercase tracking-widest mt-1">Evaluating 13-agent consensus metrics</p>
                      </div>
                    </div>
                    {isProcessing && <div className="flex items-center gap-2 px-4 py-2 bg-[#B11226]/5 text-[#B11226] rounded-full font-black text-[10px] uppercase tracking-widest border border-[#B11226]/10 animate-pulse">Running Calculations...</div>}
                  </div>
                  <AgentUI isProcessing={isProcessing} reasoning={aiReasoning} decisionText={decision?.reasoning || ""} riskScore={decision?.riskScore || 0} />
                  {!isProcessing && (
                    <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-6 duration-700">
                      <button onClick={() => setState(AppState.QUOTE)} className="group px-14 py-5 bg-[#B11226] text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:bg-black shadow-2xl transition-all flex items-center gap-4">Access Terms <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></button>
                    </div>
                  )}
                </div>
              )}

              {state === AppState.QUOTE && (
                <div className="flex-1 flex flex-col p-12 space-y-12 animate-in fade-in zoom-in duration-500 relative bg-[url('https://www.transparenttextures.com/patterns/white-diamond.png')]">
                  {showModifyMenu && (
                    <div className="absolute inset-0 z-[200] bg-white p-12 overflow-y-auto animate-in fade-in slide-in-from-bottom-12 duration-700">
                      <div className="flex items-center justify-between mb-12">
                        <div>
                          <h3 className="text-3xl font-black text-[#B11226] uppercase tracking-tighter">Modification Panel</h3>
                          <p className="text-black font-bold uppercase text-[10px] tracking-widest mt-2">Manual override for ingested data points</p>
                        </div>
                        <button onClick={() => setShowModifyMenu(false)} className="w-12 h-12 flex items-center justify-center bg-black/5 hover:bg-black/10 rounded-2xl transition-all border border-black/5"><ChevronLeft className="w-6 h-6 text-black" /></button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-[#B11226]/5 rounded-xl w-fit border border-[#B11226]/10">
                            <User className="w-3.5 h-3.5 text-[#B11226]" />
                            <span className="text-[10px] font-black uppercase text-[#B11226] tracking-widest">Identity</span>
                          </div>
                          <div className="space-y-3">
                            {demographicSteps.map((step) => (
                              <button key={step.key} onClick={() => handleJumpToQuestion(INTERVIEW_STEPS.indexOf(step))} className="w-full flex items-center justify-between p-5 bg-white border border-black/5 rounded-[1.25rem] hover:border-[#B11226] hover:shadow-2xl transition-all text-left group">
                                <span className="text-sm font-bold text-black">{step.label}</span>
                                <div className="p-1.5 bg-black/5 rounded-lg group-hover:bg-[#B11226] group-hover:text-white transition-colors"><Edit3 className="w-3 h-3" /></div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-amber-50 rounded-xl w-fit border border-amber-100">
                            <Activity className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Metabolic</span>
                          </div>
                          <div className="space-y-3">
                            {lifestyleSteps.map((step) => (
                              <button key={step.key} onClick={() => handleJumpToQuestion(INTERVIEW_STEPS.indexOf(step))} className="w-full flex items-center justify-between p-5 bg-white border border-black/5 rounded-[1.25rem] hover:border-amber-600 hover:shadow-2xl transition-all text-left group">
                                <span className="text-sm font-bold text-black">{step.label}</span>
                                <div className="p-1.5 bg-black/5 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Edit3 className="w-3 h-3" /></div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center gap-3 px-3 py-1.5 bg-emerald-50 rounded-xl w-fit border border-emerald-100">
                            <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-widest">Clinical Path</span>
                          </div>
                          <div className="space-y-3">
                            {medicalSteps.map((step) => (
                              <button key={step.key} onClick={() => handleJumpToQuestion(INTERVIEW_STEPS.indexOf(step))} className="w-full flex items-center justify-between p-5 bg-white border border-black/5 rounded-[1.25rem] hover:border-emerald-600 hover:shadow-2xl transition-all text-left group">
                                <span className="text-sm font-bold text-black">{step.label}</span>
                                <div className="p-1.5 bg-black/5 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Edit3 className="w-3 h-3" /></div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-[#B11226] text-white rounded-full text-[9px] font-black uppercase tracking-widest">Verified Offer</span>
                          <span className="text-[10px] font-bold text-black uppercase tracking-widest">Ref: DIAGUARD-{Math.floor(Math.random()*90000)}</span>
                        </div>
                        <h2 className="text-4xl font-black text-black leading-[1.1] uppercase tracking-tighter">Your Intelligence-Backed Premium Schedule</h2>
                        <p className="text-black text-sm leading-relaxed max-w-md">Our 13-agent cluster has reached consensus on your risk profile. The terms below reflect specialized diabetic actuarial tables with metabolic lifestyle adjustments.</p>
                    </div>
                    
                    <div className="w-full md:w-[320px] bg-[#B11226] rounded-[2.5rem] p-8 text-white shadow-[0_32px_128px_-12px_rgba(177,18,38,0.3)] relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 blur-3xl rounded-full group-hover:bg-white/30 transition-all duration-700" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Monthly Installment</span>
                        <div className="flex items-baseline gap-1.5 mt-4">
                          <span className="text-3xl font-bold opacity-40">$</span>
                          <span className="text-7xl font-black tracking-tighter">{decision?.adjustedPremium.toFixed(2)}</span>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-white">Coverage Basis</span>
                              <span>${userData.coverageAmount.toLocaleString()}</span>
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#B11226]/5 rounded-3xl p-8 border border-[#B11226]/10">
                      <h4 className="text-[10px] font-black text-[#B11226] uppercase tracking-widest mb-6 border-b border-[#B11226]/10 pb-3">Multi-Agent Underwriting Factors</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                        {decision && Object.entries(decision.multipliers).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-center py-2 border-b border-[#B11226]/5 group">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-[#B11226] rounded-full group-hover:scale-125 transition-transform" />
                              <span className="text-xs font-bold text-black">{k}</span>
                            </div>
                            <span className="font-mono text-[11px] font-black text-[#B11226]">x{(v as number).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <button onClick={handlePaymentTransition} className="group w-full py-6 bg-[#B11226] text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-black shadow-2xl shadow-red-200 transition-all flex items-center justify-center gap-3">
                        View Quote <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button onClick={() => setShowModifyMenu(true)} className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#B11226]/5 flex items-center justify-center gap-2 border border-black/5 transition-all">
                        <Settings2 className="w-3.5 h-3.5" /> Modify Quote
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {state === AppState.PAYMENT && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
                  <div className="w-full mb-10 flex items-center gap-5 bg-[#B11226] p-6 rounded-3xl border border-white/10 max-w-md shadow-2xl">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#B11226] shadow-xl"><Wallet className="w-7 h-7" /></div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest leading-none">Finley</h4>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-tighter mt-1">Authorized Financial Execution Core</p>
                    </div>
                  </div>
                  <PaymentGateway amount={decision?.adjustedPremium || 0} isProcessing={isIssuing} onPay={() => handlePolicyIssuance()} />
                </div>
              )}

              {state === AppState.ISSUANCE && (
                <div className="p-16 text-center space-y-10 animate-in zoom-in duration-1000">
                  <div className="flex items-center justify-center gap-4 bg-black p-5 rounded-full border border-white/10 max-w-sm mx-auto mb-10 shadow-2xl">
                    <div className="w-10 h-10 bg-[#B11226] rounded-full flex items-center justify-center text-white"><FileCheck className="w-5 h-5" /></div>
                    <div className="text-left">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Lyra Core</h4>
                      <p className="text-[9px] font-bold text-white uppercase tracking-widest">Issuance Finalized & Encrypted</p>
                    </div>
                  </div>
                  
                  <div className="relative inline-block">
                    <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-12 group hover:rotate-0 transition-transform duration-700">
                      <CheckCircle className="w-14 h-14 text-white -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                    </div>
                    <div className="absolute -inset-4 border-2 border-emerald-500 rounded-[3rem] animate-ping opacity-10" />
                  </div>

                  <div className="max-w-md mx-auto">
                    <h2 className="text-5xl font-black text-black tracking-tighter uppercase">Policy Binding</h2>
                    <p className="text-black text-sm font-medium mt-4 leading-relaxed tracking-wide">Your digital policy certificate has been cryptographic signed and issued to the registry.</p>
                  </div>

                  <div className="bg-black/5 border border-black/5 rounded-[2.5rem] p-10 max-w-sm mx-auto shadow-sm">
                    <div className="flex flex-col items-center mb-8">
                        <span className="text-[10px] font-black text-black uppercase tracking-widest mb-1">Policy Identity</span>
                        <h3 className="text-2xl font-black text-black">#{policyId}</h3>
                    </div>
                    <button onClick={downloadPolicyPDF} className="w-full py-5 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black flex items-center justify-center gap-3 transition-all shadow-2xl"><Download className="w-5 h-5" /> Download Vault Copy</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 bg-slate-900 text-white/50 text-[11px] font-bold uppercase tracking-widest mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-8">
              <span>&copy; 2024 DiaGuard | Canada Life Partnership</span>
              <span>Privacy</span>
              <span>Terms of use</span>
              <span>Accessibility</span>
           </div>
           <div className="flex items-center gap-6">
              <span className="text-white/20">|</span>
              <span className="text-emerald-500">System Status: Nominal</span>
              <span className="text-white/20">|</span>
              <span className="text-[#B11226]">DGL-NODE-AUTH-SEC</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
