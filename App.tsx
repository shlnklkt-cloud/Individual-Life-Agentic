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
  ChevronDown,
  Scissors,
  Tag,
  Database,
  ShieldCheck,
  FileSearch,
  Check,
  Loader2,
  Upload,
  File as FileIcon,
  Activity as HeartPulse,
  Camera,
  Scan,
  Users,
  SearchCheck,
  Plus,
  PiggyBank,
  Sunrise,
  Building,
  Lightbulb,
  ArrowRightCircle,
  ExternalLink,
  ChevronRightCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from "@google/genai";
import StepProgressBar from './components/StepProgressBar';
import AgentUI from './components/AgentUI';
import PaymentGateway from './components/PaymentGateway';
import { AppState, ClaimAppState, UserData, UnderwritingDecision, Message, AgentName, MainView } from './types';
import { COMPLICATIONS_OPTIONS } from './constants';
import { PricingEngine } from './services/pricingEngine';
import { performAIUnderwriting, analyzeBMIFromImage } from './services/geminiService';

const GROUP_LIFE_URL = "https://ai.studio/apps/drive/14qeBjrFetwCRrt6QCTJFxIeLKPX16qRM?fullscreenApplet=true";

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
  'Lyra': { role: 'Issuance Officer', icon: <FileCheck className="w-4 h-4" />, color: 'bg-pink-700', accent: 'text-pink-400' },
  'Intake Orchestration Agent': { role: 'Claims Lead', icon: <Briefcase className="w-4 h-4" />, color: 'bg-slate-900', accent: 'text-slate-400' },
  'Document Splitting Agent': { role: 'Logical Parser', icon: <Scissors className="w-4 h-4" />, color: 'bg-blue-700', accent: 'text-blue-300' },
  'Document Classification Agent': { role: 'Type Classifier', icon: <Tag className="w-4 h-4" />, color: 'bg-purple-700', accent: 'text-purple-300' },
  'Data Extraction Agent': { role: 'Structured Parser', icon: <Database className="w-4 h-4" />, color: 'bg-teal-700', accent: 'text-teal-300' },
  'Claim Summarization Agent': { role: 'Narrative Lead', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-700', accent: 'text-orange-300' },
  'Quality & Confidence Agent': { role: 'Compliance Auditor', icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-[#B11226]', accent: 'text-white' }
};

const FH_OPTIONS = ['None', 'Father', 'Mother', 'Siblings', 'Grandparents', 'Multiple'];

const INTERVIEW_STEPS: { label: string; key: keyof UserData; question: any; type: string; agent: AgentName; options?: any; labels?: any; min?: any; max?: any; step?: any }[] = [
  { label: 'Name', key: 'fullName', agent: 'Orchestrator Agent', question: "Welcome. I am the Orchestrator. We are beginning the ingestion phase for your life insurance application. Let's start with your legal name.", type: 'text' },
  { label: 'Date of Birth', key: 'dob', agent: 'Application Intake Agent', question: (name: string) => `Received, ${name.split(' ')[0]}. Intake is active. Please provide your date of birth.`, type: 'date' },
  { label: 'Gender', key: 'gender', agent: 'Application Intake Agent', question: "Identify your gender for actuarial modeling.", type: 'choice', options: ['Male', 'Female', 'Other'], labels: ['Male', 'Female', 'Non-binary / Other'] },
  { label: 'Occupation', key: 'occupation', agent: 'Data Integrity & Disclosure Validation', question: "Validation Agent active. What is your current professional occupation?", type: 'choice', options: ['Healthcare', 'IT & Technology', 'Finance & Accounting', 'Business & Management', 'Trades & Construction', 'Education', 'Arts, Media & Hospitality', 'Government & Public Sector', 'Sales & Customer Service', 'Student / Freelancer / Other'], labels: ['Healthcare', 'IT & Technology', 'Finance & Accounting', 'Business & Management', 'Trades & Construction', 'Education', 'Arts, Media & Hospitality', 'Government & Public Sector', 'Sales & Customer Service', 'Student / Freelancer / Other'] },
  { label: 'Product Selection', key: 'product', agent: 'Application Intake Agent', question: "Select your desired coverage.", type: 'choice', options: ['10-year Term Life', '20-year Term Life', '30-year Term Life', 'Whole Life'], labels: ['10-year Term Life', '20-year Term Life', '30-year Term Life', 'Whole Life'] },
  { label: 'Email', key: 'email', agent: 'Data Integrity & Disclosure Validation', question: "Provide a secure email for digital document encryption.", type: 'email' },
  { label: 'Tobacco Status', key: 'smokingStatus', agent: 'Fraud & Anomaly Detection', question: "Audit Agent checking in. Disclose any tobacco or nicotine product history.", type: 'choice', options: ['NON_SMOKER', 'SMOKER'], labels: ['No History', 'Active Use'] },
  { label: 'Alcohol Intake', key: 'alcoholConsumption', agent: 'Fraud & Anomaly Detection', question: "Quantify your weekly alcohol consumption for our lifestyle models.", type: 'choice', options: ['None', 'Occasional', 'Moderate', 'Frequent'], labels: ['None', 'Occasional (1-2)', 'Moderate (3-7)', 'Frequent (7+)'] },
  { label: 'Hobby & Activity', key: 'hobby', agent: 'Lifestyle & Medical Interaction', question: "Lifestyle Synthesis active. What is your primary physical activity hobby?", type: 'choice', options: ['Walking/Hiking', 'Yoga', 'Swimming', 'Team Sports', 'Reading/Gaming', 'Gardening', 'Scuba diving', 'Skydiving', 'Mountaineering', 'Racing'], labels: ['Walking/Hiking', 'Yoga', 'Swimming', 'Team Sports', 'Reading/Gaming', 'Gardening', 'Scuba diving', 'Skydiving', 'Mountaineering', 'Racing'] },
  { label: 'Coverage Amount', key: 'coverageAmount', agent: 'Med Triage', question: "Triage is active. Select requested death benefit (USD).", type: 'range', min: 100000, max: 1000000, step: 50000 },
  { label: 'Biometric Scan', key: 'bmi', agent: 'Med Evidence Collection', question: "For high-precision biometric underwriting, please upload a clear, natural photo (no makeup/filters preferred). Our neural cluster will automatically derive your BMI and physical health markers.", type: 'biometric' },
  { label: 'Diabetes Status', key: 'hasDiabetes', agent: 'Med Triage', question: "Clinical audit checking in. Have you ever been diagnosed with diabetes or any glycemic regulation disorder?", type: 'choice', options: ['Yes', 'No'], labels: ['Yes, Diagnosed', 'No, Never'] },
  { label: 'Medical Report', key: 'medicalReportName', agent: 'Med Evidence Collection', question: "Underwriting protocol requires validation. Please upload your latest Medical Test Report (PDF/JPG) as proof of glycemic diagnostic history.", type: 'file' },
  { label: 'Diagnosis Duration', key: 'yearsDiagnosed', agent: 'Med Triage', question: "Years since primary diabetic diagnosis?", type: 'choice', options: [0.5, 3, 8, 15, 25], labels: ['< 1 Year', '1-5 Years', '5-10 Years', '10-20 Years', '20+ Years'] },
  { label: 'HbA1c Level', key: 'hba1c', agent: 'Med Evidence Collection', question: "Evidence Collection initiated. Most recent HbA1c percentage (%)?", type: 'range', min: 4, max: 12, step: 0.1 },
  { label: 'Complications', key: 'complications', agent: 'Med Risk Interpretation', question: "Risk Pathologist active. Select any clinical complications present.", type: 'multi-choice', options: COMPLICATIONS_OPTIONS },
  { label: 'FH Heart Disease', key: 'fhHeartDisease', agent: 'Mortality Scoring & Risk Aggregation', question: "Any family history of Heart Disease?", type: 'choice', options: FH_OPTIONS, labels: FH_OPTIONS },
  { label: 'FH Diabetes', key: 'fhDiabetes', agent: 'Mortality Scoring & Risk Aggregation', question: "Any family history of Diabetes?", type: 'choice', options: FH_OPTIONS, labels: FH_OPTIONS },
  { label: 'FH Cancer', key: 'fhCancer', agent: 'Mortality Scoring & Risk Aggregation', question: "Any family history of Cancer?", type: 'choice', options: FH_OPTIONS, labels: FH_OPTIONS },
  { label: 'FH Genetic Disorders', key: 'fhGenetic', agent: 'Mortality Scoring & Risk Aggregation', question: "Any family history of Genetic Disorders?", type: 'choice', options: FH_OPTIONS, labels: FH_OPTIONS },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<MainView>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // Dropdown States
  const [showInsuranceDropdown, setShowInsuranceDropdown] = useState(false);

  const [state, setState] = useState<AppState>(AppState.INTERVIEW);
  const [activeAgent, setActiveAgent] = useState<AgentName>('Orchestrator Agent');
  const [transferring, setTransferring] = useState<AgentName | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [showModifyMenu, setShowModifyMenu] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'agent', agentName: 'Orchestrator Agent', text: INTERVIEW_STEPS[0].question as string, timestamp: new Date() }
  ]);
  const [userData, setUserData] = useState<UserData>({
    fullName: '', email: '', dob: '', age: 45, gender: 'Other', occupation: 'Student / Freelancer / Other', product: '20-year Term Life',
    smokingStatus: 'NON_SMOKER', alcoholConsumption: 'None', hobby: 'Reading/Gaming',
    coverageAmount: 250000, hba1c: 5.5, bmi: 24, yearsDiagnosed: 0, complications: ['None'], hasDiabetes: 'No', medicalReportName: '',
    fhHeartDisease: 'None', fhDiabetes: 'None', fhCancer: 'None', fhGenetic: 'None'
  });

  const [decision, setDecision] = useState<UnderwritingDecision | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [policyId, setPolicyId] = useState<string>('');

  const [claimState, setClaimState] = useState<ClaimAppState>(ClaimAppState.INTRO);
  const [claimMessages, setClaimMessages] = useState<Message[]>([
    { id: 'c1', role: 'agent', agentName: 'Intake Orchestration Agent', text: "Hello! 👋 Welcome to Claims Intelligence. I’m here to help—please let me know how I can assist you today.", timestamp: new Date() }
  ]);
  const [claimIsProcessing, setClaimIsProcessing] = useState(false);
  const [claimActiveAgent, setClaimActiveAgent] = useState<AgentName>('Intake Orchestration Agent');
  const [claimId, setClaimId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const insuranceDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const policyFileInputRef = useRef<HTMLInputElement>(null);
  const biometricInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, claimMessages, currentView, state]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (insuranceDropdownRef.current && !insuranceDropdownRef.current.contains(target)) setShowInsuranceDropdown(false);
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
    clearAllState();
  };

  const clearAllState = () => {
    setMessages([{ id: '1', role: 'agent', agentName: 'Orchestrator Agent', text: INTERVIEW_STEPS[0].question as string, timestamp: new Date() }]);
    setStepIndex(0);
    setState(AppState.INTERVIEW);
    setDecision(null);
    setAiReasoning('');
    setClaimId(null);
    setClaimState(ClaimAppState.INTRO);
    setClaimMessages([
      { id: 'c1', role: 'agent', agentName: 'Intake Orchestration Agent', text: "Hello! 👋 Welcome to Claims Intelligence. I’m here to help—please let me know how I can assist you today.", timestamp: new Date() }
    ]);
    setUserData({
      fullName: '', email: '', dob: '', age: 45, gender: 'Other', occupation: 'Student / Freelancer / Other', product: '20-year Term Life',
      smokingStatus: 'NON_SMOKER', alcoholConsumption: 'None', hobby: 'Reading/Gaming',
      coverageAmount: 250000, hba1c: 5.5, bmi: 24, yearsDiagnosed: 0, complications: ['None'], hasDiabetes: 'No', medicalReportName: '',
      fhHeartDisease: 'None', fhDiabetes: 'None', fhCancer: 'None', fhGenetic: 'None'
    });
  };

  const startPolicyApp = () => {
    clearAllState();
    setCurrentView('POLICY');
    setShowInsuranceDropdown(false);
  };

  const startClaimWorkflow = () => {
    clearAllState();
    setCurrentView('CLAIM');
    setShowInsuranceDropdown(false);
  };

  const startGroupLifeRedirect = () => {
    window.open(GROUP_LIFE_URL, '_blank');
    setShowInsuranceDropdown(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const processFileWithAI = async (file: File) => {
    if (!process.env.API_KEY) return;
    setClaimIsProcessing(true);
    setClaimId(null);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      const base64Data = await fileToBase64(file);
      const mimeType = file.type || 'application/pdf';
      const filePart = { inlineData: { data: base64Data, mimeType } };

      // 1. Intake Orchestration
      setClaimActiveAgent('Intake Orchestration Agent');
      setClaimMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `Submitting claim file: ${file.name}`, timestamp: new Date() }]);
      await delay(1200);

      // 2. Handover: Intake -> Splitting
      setClaimMessages(prev => [...prev, { id: `h1-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER Intake Orchestration Agent ➔ Document Splitting Agent`, timestamp: new Date() } as Message]);
      await delay(1000);
      
      setClaimState(ClaimAppState.SPLITTING);
      setClaimActiveAgent('Document Splitting Agent');
      const splitResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [filePart, { text: "Analyze the uploaded file for document boundaries. Identify if this is a single document or multiple files merged into one. List logical document sections." }] }
      });
      setClaimMessages(prev => [...prev, { id: 'a2', role: 'agent', agentName: 'Document Splitting Agent', text: splitResponse.text || "Segmentation complete. Multiple logical boundaries identified.", timestamp: new Date() }]);
      await delay(1500);

      // 3. Handover: Splitting -> Classification
      setClaimMessages(prev => [...prev, { id: `h2-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER Document Splitting Agent ➔ Document Classification Agent`, timestamp: new Date() } as Message]);
      await delay(1000);

      setClaimState(ClaimAppState.CLASSIFICATION);
      setClaimActiveAgent('Document Classification Agent');
      const classResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [filePart, { text: "Classify this claim document. Primary options: Death Certificate, Attending Physician Statement, Medical Invoice, Employer Certification. Provide a classification and confidence score." }] }
      });
      setClaimMessages(prev => [...prev, { id: 'a3', role: 'agent', agentName: 'Document Classification Agent', text: classResponse.text || "Classification logic complete. Confidence: 98%.", timestamp: new Date() }]);
      await delay(1500);

      // 4. Handover: Classification -> Data Extraction
      setClaimMessages(prev => [...prev, { id: `h3-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER Document Classification Agent ➔ Data Extraction Agent`, timestamp: new Date() } as Message]);
      await delay(1000);

      setClaimState(ClaimAppState.EXTRACTION);
      setClaimActiveAgent('Data Extraction Agent');
      const extractResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [filePart, { text: "Extract critical fields for life insurance claim. Look for: Deceased Name, Date of Death, Cause of Death, Policy Number (if available), Beneficiary Name, and total claim amount. Format as a structured list." }] }
      });
      setClaimMessages(prev => [...prev, { id: 'a4', role: 'agent', agentName: 'Data Extraction Agent', text: extractResponse.text || "Data fields extracted and verified against OCR results.", timestamp: new Date() }]);
      await delay(1500);

      // 5. Handover: Extraction -> Summarization
      setClaimMessages(prev => [...prev, { id: `h4-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER Data Extraction Agent ➔ Claim Summarization Agent`, timestamp: new Date() } as Message]);
      await delay(1000);

      setClaimState(ClaimAppState.SUMMARIZATION);
      setClaimActiveAgent('Claim Summarization Agent');
      
      const summarizationPrompt = `
        Act as a Professional Claims Adjudicator. Synthesize the extracted claim data into a structured report following this EXACT format:

        ### 1. Claim Overview
        - Claim Type: [Derived]
        - Policy Type: [Derived]
        - Employee Status: [Derived from context]
        - Date of Death: [Derived]
        - Cause of Death: [Derived]
        - Coverage Amount Claimed: [Derived]
        - Beneficiary: [Derived]

        ### 2. Medical Findings
        - Primary Diagnosis: [Derived]
        - Relevant Medical History Identified: [Derived or 'None Identified']
        - Hospitalization: [Summary of dates and events]
        - Medical Evidence Status: [List items present: APS, Discharge Summary, etc.]
        - Medical Risk Flags: [List flags or 'None detected']

        ### 3. Financial Eligibility
        - Annual Salary: [Estimate if found, else 'Pending Verification']
        - Coverage Formula: [Derived]
        - Calculated Eligible Coverage: [Derived]
        - Coverage vs Eligibility: [Compare values]
        - Evidence of Insurability (EOI): [Derived status]
        Financial eligibility confirmed status: [Derived]

        ### 4. Missing Information
        - ❌ [List missing document 1]
        - ❌ [List missing document 2]

        ### 5. Next Steps (AI-Recommended)
        1. [Step 1]
        2. [Step 2]
        3. [Step 3]

        **Insight for Claims Adjudicator**
        [Professional one-paragraph summary of claim payability and risks]
      `;

      const sumResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [filePart, { text: summarizationPrompt }] }
      });
      setClaimMessages(prev => [...prev, { id: 'a5', role: 'agent', agentName: 'Claim Summarization Agent', text: sumResponse.text || "Report generated.", timestamp: new Date() }]);
      await delay(2000);

      // 6. Handover: Summarization -> Quality & Confidence
      setClaimMessages(prev => [...prev, { id: `h5-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER Claim Summarization Agent ➔ Quality & Confidence Agent`, timestamp: new Date() } as Message]);
      await delay(1000);

      setClaimState(ClaimAppState.QUALITY_CHECK);
      setClaimActiveAgent('Quality & Confidence Agent');
      const newId = `CLM-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`;
      setClaimId(newId);
      setClaimMessages(prev => [...prev, { id: 'a10', role: 'agent', agentName: 'Quality & Confidence Agent', text: `FINAL_AUDIT: Data integrity score 99.8%. No anomalies detected in cause of death vs policy inception. Tracking Identifier: ${newId}. Record committed to payout queue.`, timestamp: new Date() }]);
    } catch (err) {
      setClaimMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', agentName: 'Intake Orchestration Agent', text: "CRITICAL_FAILURE: Neural cluster unable to reach consensus on document authenticity. Manual intervention requested.", timestamp: new Date() }]);
    } finally {
      setClaimIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFileWithAI(file);
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

  const startAgentAnalysis = async (data: UserData) => {
    setIsProcessing(true);
    const result = PricingEngine.calculate(data);
    setDecision(result);
    const smartSummary = await performAIUnderwriting(data, result);
    setAiReasoning(smartSummary);
    setTimeout(() => setIsProcessing(false), 9000);
  };

  const handleUserResponse = (value: any, displayValue?: string) => {
    const currentStep = INTERVIEW_STEPS[stepIndex];
    const textValue = displayValue || String(value);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    let extraData = {};
    if (currentStep.key === 'dob') {
       const birthDate = new Date(value);
       const today = new Date();
       let calculatedAge = today.getFullYear() - birthDate.getFullYear();
       const m = today.getMonth() - birthDate.getMonth();
       if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
       extraData = { age: calculatedAge };
    }

    const updatedData = { ...userData, [currentStep.key]: value, ...extraData };
    setUserData(updatedData);

    if (currentStep.key === 'hasDiabetes' && value === 'No') {
      const nextStepIdx = INTERVIEW_STEPS.findIndex(s => s.key === 'fhHeartDisease');
      const nextStep = INTERVIEW_STEPS[nextStepIdx];
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `handover-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER ${activeAgent} ➔ ${nextStep.agent}`, timestamp: new Date() } as Message]);
        setActiveAgent(nextStep.agent);
        const nextQuestion = typeof nextStep.question === 'function' ? nextStep.question(updatedData.fullName) : nextStep.question;
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'agent', agentName: nextStep.agent, text: nextQuestion, timestamp: new Date() }]);
        setStepIndex(nextStepIdx);
        setInputValue('');
      }, 800);
      return;
    }

    if (stepIndex >= INTERVIEW_STEPS.length - 1) {
      setMessages(prev => [...prev, { id: 'end', role: 'agent', agentName: 'Orchestrator Agent', text: "INGESTION_SUCCESS: High-fidelity clinical ingestion complete. Initiating multi-agent risk synthesis protocol.", timestamp: new Date() }]);
      setTimeout(() => {
        handleTransfer('Final Underwriting Decision', AppState.AGENT_PROCESSING, () => startAgentAnalysis(updatedData));
      }, 1200);
    } else {
      const nextStepIdx = stepIndex + 1;
      const nextStep = INTERVIEW_STEPS[nextStepIdx];
      setTimeout(() => {
        if (nextStep.agent !== activeAgent) {
           setMessages(prev => [...prev, { id: `handover-${Date.now()}`, role: 'agent', text: `PROTOCOL: HANDOVER ${activeAgent} ➔ ${nextStep.agent}`, timestamp: new Date() } as Message]);
           setActiveAgent(nextStep.agent);
        }
        const nextQuestion = typeof nextStep.question === 'function' ? nextStep.question(updatedData.fullName) : nextStep.question;
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'agent', agentName: nextStep.agent, text: nextQuestion, timestamp: new Date() }]);
        setStepIndex(nextStepIdx);
        setInputValue('');
      }, 800);
    }
  };

  const handleBiometricUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsBiometricLoading(true);
      try {
        const base64 = await fileToBase64(file);
        const bmiValue = await analyzeBMIFromImage(base64);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: `Biometric Packet Received: ${file.name}`, timestamp: new Date() }]);
        setMessages(prev => [...prev, { 
          id: `bio-${Date.now()}`, 
          role: 'agent', 
          agentName: 'Med Evidence Collection', 
          text: `Neural analysis successful. Physical health markers derived. AI-Calculated BMI: ${bmiValue.toFixed(1)}. Moving to clinical checks...`, 
          timestamp: new Date() 
        }]);
        handleUserResponse(bmiValue, `AI-Derived BMI: ${bmiValue.toFixed(1)}`);
      } catch (err) {
        console.error(err);
      } finally {
        setIsBiometricLoading(false);
      }
    }
  };

  const handleJumpToQuestion = (index: number) => {
    const targetStep = INTERVIEW_STEPS[index];
    setMessages(prev => [...prev, { 
      id: `modify-${Date.now()}`, 
      role: 'agent', 
      agentName: 'Orchestrator Agent',
      text: `DIRECT_JUMP: Moving session back to ${targetStep.label} records.`,
      timestamp: new Date() 
    }]);
    setStepIndex(index);
    setState(AppState.INTERVIEW);
    setActiveAgent(targetStep.agent);
    setShowModifyMenu(false);
  };

  const downloadPolicyPDF = () => {
    if (!decision) return;
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(177, 18, 38);
    doc.setFont("helvetica", "bold");
    doc.text('CANADA LIFE', 20, y);
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text('Individual Life Insurance Quote', 20, y);
    y += 15;

    doc.setDrawColor(177, 18, 38);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Policy Summary
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text('POLICY SUMMARY', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Policy ID: ${policyId}`, 20, y);
    doc.text(`Product Type: ${userData.product}`, 100, y);
    y += 6;
    doc.text(`Coverage Amount: $${userData.coverageAmount.toLocaleString()}`, 20, y);
    doc.text(`Monthly Premium: $${decision.adjustedPremium.toFixed(2)}`, 100, y);
    y += 6;
    doc.text(`Risk Index Score: ${decision.riskScore.toFixed(1)}/100`, 20, y);
    doc.text(`Adjudication Status: ${decision.status}`, 100, y);
    y += 12;

    // Applicant Information
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('APPLICANT INFORMATION', 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Full Legal Name: ${userData.fullName}`, 20, y);
    doc.text(`Calculated Age: ${userData.age}`, 100, y);
    y += 6;
    doc.text(`Gender: ${userData.gender}`, 20, y);
    doc.text(`Current Occupation: ${userData.occupation}`, 100, y);
    y += 6;
    doc.text(`Contact Email: ${userData.email}`, 20, y);
    y += 12;

    // Medical Disclosure
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('MEDICAL PROFILE', 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`HbA1c Level: ${userData.hba1c}%`, 20, y);
    doc.text(`BMI (AI Vision Estimated): ${userData.bmi.toFixed(1)}`, 100, y);
    y += 6;
    doc.text(`Years Since Diagnosis: ${userData.yearsDiagnosed}`, 20, y);
    doc.text(`Clinical Complications: ${userData.complications.join(', ')}`, 100, y);
    y += 12;

    // Lifestyle & Heredity
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('LIFESTYLE & RISK FACTORS', 20, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Tobacco Usage: ${userData.smokingStatus === 'SMOKER' ? 'Active User' : 'Non-Smoker'}`, 20, y);
    doc.text(`Alcohol Consumption: ${userData.alcoholConsumption}`, 100, y);
    y += 6;
    doc.text(`Primary Physical Activity: ${userData.hobby}`, 20, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Family History Disclosures:`, 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`- Heart Disease: ${userData.fhHeartDisease}`, 25, y);
    doc.text(`- Diabetes: ${userData.fhDiabetes}`, 100, y);
    y += 6;
    doc.text(`- Cancer: ${userData.fhCancer}`, 25, y);
    doc.text(`- Genetic Disorders: ${userData.fhGenetic}`, 100, y);
    y += 14;

    // AI Underwriting Commentary
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('NEURAL UNDERWRITING COMMENTARY', 20, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    const splitText = doc.splitTextToSize(aiReasoning, 170);
    doc.text(splitText, 20, y);
    y += (splitText.length * 4.5) + 12;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text('DISCLAIMER: This document is a computer-generated quote authorized via multi-agent neural consensus.', 20, y);
    y += 4;
    doc.text(`Authorized Timestamp: ${new Date().toLocaleString()} // Node: CL-FINALITY-INTEL-NODE`, 20, y);
    y += 4;
    doc.text('Canada Life Assurance Company - All Rights Reserved © 2024', 20, y);

    doc.save(`CanadaLife_Detailed_Quote_${policyId}.pdf`);
  };

  const handlePaymentTransition = () => handleTransfer('Finley', AppState.PAYMENT);

  const handlePolicyIssuance = () => {
    setIsIssuing(true);
    setTimeout(() => {
      const id = `CL-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
      setPolicyId(id);
      setIsIssuing(false);
      handleTransfer('Lyra', AppState.ISSUANCE);
    }, 2500);
  };

  const handlePolicyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUserResponse(file.name, `Proof: ${file.name}`);
  };

  const handleInitiateClaim = () => {
    setClaimMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "Initiate Claim", timestamp: new Date() }]);
    setTimeout(() => {
      setClaimState(ClaimAppState.INTAKE);
      setClaimMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', agentName: 'Intake Orchestration Agent', text: "Claims Document Intelligence module active. Please upload your claim package (PDF) to initiate the autonomous parsing cluster.", timestamp: new Date() }]);
    }, 600);
  };

  const handleStatusCheck = () => {
    setClaimMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "Claim Status Check", timestamp: new Date() }]);
    setTimeout(() => {
      setClaimMessages(prev => [...prev, { id: Date.now().toString(), role: 'agent', agentName: 'Intake Orchestration Agent', text: "PROTOCOL: STATUS_CHECK. Please enter your Claim Reference Number to retrieve active record status.", timestamp: new Date() }]);
    }, 600);
  };

  if (currentView === 'LOGIN') {
    return (
      <div className="min-h-screen bg-[#B11226] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 border-4 border-white rounded-full animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full opacity-5" />
        </div>
        <div className="w-full max-md bg-white rounded-[2.5rem] shadow-2xl p-12 relative z-10 animate-in zoom-in duration-700">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#B11226] rounded-2xl flex items-center justify-center text-white shadow-2xl mb-6"><Shield className="w-10 h-10" /></div>
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter">Canada Life</h1>
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mt-2">Enterprise Access Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-2">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-6 pr-6 py-4 bg-black/5 rounded-2xl border-2 border-transparent focus:border-[#B11226] outline-none transition-all font-bold" placeholder="SUPERUSER" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/60 px-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-6 pr-6 py-4 bg-black/5 rounded-2xl border-2 border-transparent focus:border-[#B11226] outline-none transition-all font-bold" placeholder="••••••••" />
            </div>
            {loginError && <p className="text-xs font-bold text-red-600 px-2">Unauthorized credentials.</p>}
            <button type="submit" className="w-full py-5 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">Secure Login <ArrowRight className="w-5 h-5" /></button>
          </form>
          <p className="text-center text-[9px] text-black/20 font-bold uppercase tracking-widest mt-12">Protocol: AES-256 // Node: CL-AUTH-PRIMARY</p>
        </div>
      </div>
    );
  }

  const demographicSteps = INTERVIEW_STEPS.slice(0, 3);
  const lifestyleSteps = [...INTERVIEW_STEPS.slice(3, 4), ...INTERVIEW_STEPS.slice(6, 9)];
  const medicalSteps = [INTERVIEW_STEPS[4], INTERVIEW_STEPS[5], ...INTERVIEW_STEPS.slice(9, 16)];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-red-100 bg-white">
      <header className="bg-white border-b border-black/5 sticky top-0 z-[100] h-20 shadow-sm px-8 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center cursor-pointer group" onClick={() => setCurrentView('DASHBOARD')}>
            <span className="text-3xl font-normal tracking-tight text-[#71726a] mr-2">canada</span>
            <div className="bg-[#B11226] w-12 h-12 flex items-center justify-center rounded-sm shadow-md group-hover:scale-105 transition-transform overflow-hidden pb-1 px-1">
              <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>life</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-6">
            <div className="relative group/insurance" ref={insuranceDropdownRef}>
              <button 
                onClick={() => setShowInsuranceDropdown(!showInsuranceDropdown)} 
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors ${showInsuranceDropdown || currentView === 'POLICY' || currentView === 'CLAIM' ? 'text-[#B11226]' : 'text-slate-600 hover:text-black'}`}
              >
                Insurance <ChevronDown className={`w-3 h-3 transition-transform ${showInsuranceDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showInsuranceDropdown && (
                <div className="absolute top-full left-0 mt-3 w-[450px] bg-white border border-black/5 rounded-3xl shadow-2xl p-6 z-[200] animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Policy Submenu */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-[#B11226]/10 rounded-lg flex items-center justify-center text-[#B11226]"><Shield className="w-4 h-4" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#B11226]">Policy</span>
                      </div>
                      <div className="space-y-2">
                        <button onClick={startPolicyApp} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 group transition-all">
                          <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 flex items-center justify-between">Individual Life <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                          <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">Direct Clinical Underwriting</p>
                        </button>
                        <button onClick={startGroupLifeRedirect} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 group transition-all">
                          <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 flex items-center justify-between">Group Life <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                          <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">Enterprise Benefit Access</p>
                        </button>
                      </div>
                    </div>

                    {/* Claim Submenu */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600"><Briefcase className="w-4 h-4" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Claim</span>
                      </div>
                      <div className="space-y-2">
                        <button className="w-full text-left p-3 rounded-xl opacity-40 cursor-not-allowed">
                          <p className="text-[11px] font-black uppercase tracking-tight text-slate-800">Individual Claim</p>
                          <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">Retail Case Management</p>
                        </button>
                        <button onClick={startClaimWorkflow} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 group transition-all">
                          <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 flex items-center justify-between">Group Claim <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
                          <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">Institutional Records Audit</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-black">Investing & Saving</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-black">Retirement</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-black">Business Solutions</button>
            <button className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-black">Insights & Advice</button>
          </nav>
        </div>
        
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 rounded-full hover:bg-[#B11226] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">Sign out</button>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-6 py-12">
        {currentView === 'DASHBOARD' && (
          <div className="animate-in fade-in duration-700">
            <div className="text-center mb-16">
              <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 text-slate-900 leading-none">Intelligence Engine</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Strategic Portfolios & Global Risk Adjudication</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* INSURANCE CARD with Nested Options */}
              <div className="p-10 border border-black/5 rounded-[3.5rem] bg-white shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#B11226]/5 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform" />
                <div className="w-16 h-16 bg-[#B11226] rounded-2xl flex items-center justify-center text-white mb-10 shadow-xl group-hover:rotate-6 transition-transform">
                  <Shield className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 text-slate-900">Insurance</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase leading-relaxed mb-8 flex-1">Multi-modal risk shielding across life, health, and group assets.</p>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="w-3.5 h-3.5 text-[#B11226]" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B11226]">1. Policy Submenu</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={startPolicyApp} className="py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-[#B11226] hover:text-white transition-all text-center">Individual Life</button>
                       <button onClick={startGroupLifeRedirect} className="py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-center flex items-center justify-center gap-1.5 px-2">Group Life <ExternalLink className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">2. Claim Submenu</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <button className="py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed text-center">Individual Claim</button>
                       <button onClick={startClaimWorkflow} className="py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-[#B11226] hover:text-white transition-all text-center">Group Claim</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* INVESTING & SAVING */}
              <div className="p-10 border border-black/5 rounded-[3.5rem] bg-white shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group relative overflow-hidden">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-10 shadow-xl group-hover:rotate-6 transition-transform">
                  <PiggyBank className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 text-slate-900">Investing</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase leading-relaxed mb-8 flex-1">Global market exposure and strategic wealth accumulation protocols.</p>
                <div className="mt-auto">
                   <button className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed">Access Blocked</button>
                </div>
              </div>

              {/* RETIREMENT */}
              <div className="p-10 border border-black/5 rounded-[3.5rem] bg-white shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group relative overflow-hidden">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-10 shadow-xl group-hover:rotate-6 transition-transform">
                  <Sunrise className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 text-slate-900">Retirement</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase leading-relaxed mb-8 flex-1">Securing long-horizon capital and deterministic income streams.</p>
                <div className="mt-auto">
                   <button className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed">Access Blocked</button>
                </div>
              </div>

              {/* Business solutions */}
              <div className="p-10 border border-black/5 rounded-[3.5rem] bg-white shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group relative overflow-hidden">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-10 shadow-xl group-hover:rotate-6 transition-transform">
                  <Building className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 text-slate-900">Business</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase leading-relaxed mb-8 flex-1">Institutional liquidity and bespoke employee benefit architectures.</p>
                <div className="mt-auto">
                   <button className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed">Access Blocked</button>
                </div>
              </div>

              {/* Insights & advice */}
              <div className="p-10 border border-black/5 rounded-[3.5rem] bg-white shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group relative overflow-hidden">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white mb-10 shadow-xl group-hover:rotate-6 transition-transform">
                  <Lightbulb className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-black uppercase mb-4 text-slate-900">Insights</h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase leading-relaxed mb-8 flex-1">Algorithmic advisement and neural market forecasting.</p>
                <div className="mt-auto">
                   <button className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-300 cursor-not-allowed">Access Blocked</button>
                </div>
              </div>

              {/* STATS CARD */}
              <div className="p-10 bg-[#B11226] rounded-[3.5rem] text-white flex flex-col justify-between group shadow-2xl">
                <div>
                  <Activity className="w-10 h-10 mb-6 opacity-50 group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-black uppercase leading-none mb-2">System Status</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Node: CL-GLOBAL-ALPHA</p>
                </div>
                <div className="mt-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black uppercase">Neutral Bandwidth</span>
                    <span className="text-xl font-black">99.9%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-[99.9%] bg-white rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- POLICY WORKFLOW --- */}
        {currentView === 'POLICY' && (
          <div className="animate-in fade-in duration-700">
            <StepProgressBar currentState={state} />
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-black/5 overflow-hidden flex flex-col min-h-[600px] relative">
              {transferring && (
                <div className="absolute inset-0 z-[150] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 ${AGENT_REGISTRY[transferring].color}`}>{AGENT_REGISTRY[transferring].icon}</div>
                  <h3 className="text-xl font-black uppercase tracking-widest">Routing Context...</h3>
                  <p className="text-white/40 font-mono text-[10px] mt-2">DETERMINING NEURAL PATH</p>
                </div>
              )}

              {state === AppState.INTERVIEW && (
                <div className="flex-1 flex flex-col h-[600px]">
                  <div className="bg-slate-50 px-8 py-3 border-b border-black/5 flex justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">ACTIVE_AGENT: <span className="text-black">{activeAgent}</span></span>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#B11226] rounded-full animate-pulse" /><span className="text-[9px] font-bold uppercase">Streaming Live</span></div>
                  </div>
                  <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/20">
                    {messages.map((m) => {
                      const isHandover = m.text.includes('PROTOCOL: HANDOVER');
                      if (isHandover) {
                        return (
                          <div key={m.id} className="flex justify-center my-6 animate-in fade-in zoom-in duration-500">
                            <div className="flex items-center gap-3 px-6 py-2.5 bg-black border border-white/10 rounded-full text-[9px] font-black text-white tracking-[0.15em] uppercase shadow-2xl">
                              <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
                              {m.text.split('PROTOCOL: HANDOVER ')[1]}
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div key={m.id} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[75%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${m.role === 'agent' ? AGENT_REGISTRY[m.agentName || activeAgent]?.color : 'bg-[#B11226]'}`}>
                              {m.role === 'agent' ? AGENT_REGISTRY[m.agentName || activeAgent]?.icon : <User className="w-5 h-5" />}
                            </div>
                            <div className={`p-5 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${m.role === 'agent' ? 'bg-white text-black rounded-tl-none border border-black/5 shadow-sm' : 'bg-[#B11226] text-white rounded-tr-none shadow-lg'}`}>
                              {m.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isBiometricLoading && (
                      <div className="flex items-center gap-3 text-[#B11226] text-[10px] font-black uppercase tracking-widest ml-14 animate-pulse">
                        <Scan className="w-4 h-4 animate-spin" /> Analyzing physical biometric markers...
                      </div>
                    )}
                  </div>
                  <div className="p-8 bg-white border-t border-black/5">
                    <div className="max-w-2xl mx-auto">
                      {INTERVIEW_STEPS[stepIndex].type === 'biometric' ? (
                        <div className="w-full">
                          <input type="file" ref={biometricInputRef} onChange={handleBiometricUpload} className="hidden" accept="image/*" />
                          <button onClick={() => biometricInputRef.current?.click()} disabled={isBiometricLoading} className="w-full p-10 border-2 border-dashed rounded-[2rem] border-[#B11226]/20 hover:bg-[#B11226]/5 transition-all flex flex-col items-center gap-4 group">
                             <div className="w-16 h-16 bg-[#B11226] rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform"><Camera className="w-8 h-8" /></div>
                             <p className="font-black uppercase text-sm tracking-tight">Upload Natural Face Scan</p>
                             <p className="text-xs text-black/40 font-bold uppercase">No Filters Required</p>
                          </button>
                        </div>
                      ) : INTERVIEW_STEPS[stepIndex].type === 'choice' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {INTERVIEW_STEPS[stepIndex].options.map((opt: string, i: number) => (
                            <button key={opt} onClick={() => handleUserResponse(opt, INTERVIEW_STEPS[stepIndex].labels?.[i] || opt)} className="px-6 py-4 bg-white border-2 border-black/5 rounded-2xl font-bold hover:border-[#B11226] hover:bg-[#B11226] hover:text-white transition-all text-xs">
                              {INTERVIEW_STEPS[stepIndex].labels?.[i] || opt}
                            </button>
                          ))}
                        </div>
                      ) : INTERVIEW_STEPS[stepIndex].type === 'range' ? (
                        <div className="space-y-6 px-4">
                          <div className="flex justify-between items-end">
                            <span className="text-4xl font-black text-[#B11226] tracking-tighter">
                              {INTERVIEW_STEPS[stepIndex].key === 'coverageAmount' ? `$${userData.coverageAmount.toLocaleString()}` : `${userData.hba1c}%`}
                            </span>
                          </div>
                          <input type="range" min={INTERVIEW_STEPS[stepIndex].min} max={INTERVIEW_STEPS[stepIndex].max} step={INTERVIEW_STEPS[stepIndex].step} className="w-full h-1.5 bg-black/5 rounded-full appearance-none cursor-pointer accent-[#B11226]" value={INTERVIEW_STEPS[stepIndex].key === 'hba1c' ? userData.hba1c : userData.coverageAmount} onChange={(e) => setUserData({...userData, [INTERVIEW_STEPS[stepIndex].key]: parseFloat(e.target.value)})} />
                          <button onClick={() => handleUserResponse(INTERVIEW_STEPS[stepIndex].key === 'hba1c' ? userData.hba1c : userData.coverageAmount, INTERVIEW_STEPS[stepIndex].key === 'hba1c' ? `${userData.hba1c}%` : `$${userData.coverageAmount.toLocaleString()}`)} className="w-full py-5 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl">Confirm Amount</button>
                        </div>
                      ) : INTERVIEW_STEPS[stepIndex].type === 'multi-choice' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {INTERVIEW_STEPS[stepIndex].options?.map((opt: string) => (
                              <button key={opt} onClick={() => { const newComps = userData.complications.includes(opt) ? userData.complications.filter(c => c !== opt) : [...userData.complications.filter(c => c !== 'None'), opt]; setUserData({...userData, complications: newComps.length ? newComps : ['None']}); }} className={`px-6 py-4 rounded-2xl text-[11px] font-bold transition-all border-2 text-center flex flex-col gap-1 ${userData.complications.includes(opt) ? 'bg-[#B11226] border-[#B11226] text-white' : 'bg-white border-black/5 text-black hover:border-black/20'}`}>{opt}</button>
                            ))}
                          </div>
                          <button onClick={() => handleUserResponse(userData.complications, userData.complications.join(', '))} className="w-full py-5 bg-[#B11226] text-white rounded-[1.25rem] font-black uppercase tracking-widest shadow-2xl">Confirm Selections</button>
                        </div>
                      ) : INTERVIEW_STEPS[stepIndex].type === 'file' ? (
                        <div className="w-full">
                          <input type="file" ref={policyFileInputRef} onChange={handlePolicyFileUpload} className="hidden" accept=".pdf,image/*" />
                          <button onClick={() => policyFileInputRef.current?.click()} className="w-full p-8 border-2 border-dashed border-[#B11226]/30 rounded-[1.25rem] hover:bg-[#B11226]/5 transition-all flex flex-col items-center gap-4 group">
                            <Upload className="w-8 h-8 text-[#B11226] group-hover:rotate-6 transition-transform" />
                            <p className="text-sm font-black uppercase">Upload Medical Proof</p>
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={(e) => { e.preventDefault(); if(inputValue) handleUserResponse(inputValue); }} className="relative">
                          <input autoFocus type={INTERVIEW_STEPS[stepIndex].type} className="w-full px-8 py-5 rounded-2xl border-2 border-black/5 focus:border-[#B11226] outline-none font-bold" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter response..." />
                          <button type="submit" className="absolute right-3 top-3 bottom-3 px-6 bg-[#B11226] text-white rounded-xl font-black uppercase text-[10px]">Enter</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {state === AppState.AGENT_PROCESSING && (
                <div className="p-12 flex-1 flex flex-col justify-center animate-in fade-in duration-1000">
                  <AgentUI isProcessing={isProcessing} reasoning={aiReasoning} decisionText={decision?.reasoning || ""} riskScore={decision?.riskScore || 0} />
                  {!isProcessing && (
                    <button onClick={() => setState(AppState.QUOTE)} className="mt-12 mx-auto px-12 py-5 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center gap-3">
                      View Underwritten Terms <ArrowUpRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {state === AppState.QUOTE && decision && (
                <div className="p-12 flex-1 flex flex-col space-y-12 animate-in zoom-in duration-500 relative">
                  {showModifyMenu && (
                    <div className="absolute inset-0 z-[200] bg-white p-12 overflow-y-auto animate-in fade-in slide-in-from-bottom-12 duration-700">
                      <div className="flex items-center justify-between mb-12">
                        <h3 className="text-3xl font-black text-[#B11226] uppercase tracking-tighter">Modification Panel</h3>
                        <button onClick={() => setShowModifyMenu(false)} className="w-12 h-12 flex items-center justify-center bg-black/5 rounded-2xl"><ChevronLeft className="w-6 h-6" /></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase text-slate-400">Demographics</p>
                          {demographicSteps.map((step) => (
                            <button key={step.key} onClick={() => handleJumpToQuestion(INTERVIEW_STEPS.indexOf(step))} className="w-full flex items-center justify-between p-4 bg-white border border-black/5 rounded-xl hover:border-[#B11226] transition-all text-xs font-bold">{step.label} <Edit3 className="w-3 h-3 text-slate-300" /></button>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase text-slate-400">Metabolic Profile</p>
                          {lifestyleSteps.map((step) => (
                            <button key={step.key} onClick={() => handleJumpToQuestion(INTERVIEW_STEPS.indexOf(step))} className="w-full flex items-center justify-between p-4 bg-white border border-black/5 rounded-xl hover:border-[#B11226] transition-all text-xs font-bold">{step.label} <Edit3 className="w-3 h-3 text-slate-300" /></button>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase text-slate-400">Medical Data</p>
                          {medicalSteps.map((step) => (
                            <button key={step.key} onClick={() => handleJumpToQuestion(INTERVIEW_STEPS.indexOf(step))} className="w-full flex items-center justify-between p-4 bg-white border border-black/5 rounded-xl hover:border-[#B11226] transition-all text-xs font-bold">{step.label} <Edit3 className="w-3 h-3 text-slate-300" /></button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 text-left space-y-4">
                      <span className="px-3 py-1 bg-[#B11226] text-white rounded-full text-[9px] font-black uppercase tracking-widest">OFFER_FINAL_CL</span>
                      <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Your Underwritten Terms</h2>
                      <p className="text-black/60">Calculated via multi-agent neural consensus based on your biometric profile and lifestyle disclosures.</p>
                    </div>
                    <div className="w-full md:w-[320px] bg-[#B11226] p-10 rounded-[2.5rem] text-white shadow-2xl">
                       <p className="text-[10px] font-black uppercase opacity-60">Monthly Premium</p>
                       <div className="flex items-baseline gap-2 mt-2">
                         <span className="text-3xl font-bold opacity-40">$</span>
                         <span className="text-7xl font-black tracking-tighter">{decision.adjustedPremium.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-[#B11226]/5 p-8 rounded-3xl border border-[#B11226]/10">
                        <h4 className="text-[10px] font-black uppercase mb-6 text-[#B11226]">Consensus Multipliers</h4>
                        <div className="space-y-3">
                           {Object.entries(decision.multipliers).map(([k, v]) => (
                             <div key={k} className="flex justify-between text-xs font-bold py-2 border-b border-black/5"><span>{k}</span><span className="text-[#B11226]">x{(v as number).toFixed(2)}</span></div>
                           ))}
                        </div>
                     </div>
                     <div className="flex flex-col gap-4 justify-center">
                        <button onClick={handlePaymentTransition} className="w-full py-6 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all">Accept Offer & Bind Policy</button>
                        <button onClick={() => setShowModifyMenu(true)} className="w-full py-5 bg-slate-100 rounded-2xl font-black uppercase text-[10px] tracking-widest">Modify Records</button>
                     </div>
                  </div>
                </div>
              )}

              {state === AppState.PAYMENT && (
                <div className="flex-1 flex flex-col items-center justify-center p-12">
                  <PaymentGateway amount={decision?.adjustedPremium || 0} isProcessing={isIssuing} onPay={handlePolicyIssuance} />
                </div>
              )}

              {state === AppState.ISSUANCE && (
                <div className="p-16 text-center space-y-12 animate-in zoom-in duration-1000">
                  <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce">
                    <CheckCircle className="w-14 h-14 text-white" />
                  </div>
                  <h2 className="text-5xl font-black uppercase tracking-tighter">Policy Bound</h2>
                  <div className="bg-slate-50 border border-black/5 p-10 rounded-[2.5rem] max-w-sm mx-auto shadow-sm">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Policy Identifier</p>
                    <h3 className="text-2xl font-black tracking-tight mb-8">#{policyId}</h3>
                    <button onClick={downloadPolicyPDF} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#B11226] transition-all">
                      <Download className="w-5 h-5" /> Download Quote Copy
                    </button>
                    <button onClick={clearAllState} className="mt-6 text-[9px] font-black uppercase tracking-widest text-black/40 hover:text-[#B11226]">Initiate New Session</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- CLAIM WORKFLOW --- */}
        {currentView === 'CLAIM' && (
          <div className="animate-in fade-in duration-700">
             <div className="bg-white rounded-[2.5rem] shadow-xl border border-black/5 flex flex-col min-h-[600px] overflow-hidden">
                <div className="bg-slate-50 px-8 py-3 border-b border-black/5 flex justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">Claims Intelligence Engine</span>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#B11226] rounded-full animate-pulse" /><span className="text-[9px] font-bold uppercase">Ready</span></div>
                </div>
                
                <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/20">
                  {claimMessages.map(m => {
                    const isHandover = m.text.includes('PROTOCOL: HANDOVER');
                    if (isHandover) {
                      return (
                        <div key={m.id} className="flex justify-center my-6 animate-in fade-in zoom-in duration-500">
                          <div className="flex items-center gap-3 px-6 py-2.5 bg-black border border-white/10 rounded-full text-[9px] font-black text-white tracking-[0.15em] uppercase shadow-2xl">
                            <RefreshCw className="w-3 h-3 animate-spin text-red-500" />
                            {m.text.split('PROTOCOL: HANDOVER ')[1]}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={m.id} className={`flex ${m.role === 'agent' ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[75%] flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${m.role === 'agent' ? AGENT_REGISTRY[m.agentName || claimActiveAgent]?.color : 'bg-[#B11226]'}`}>
                                {m.role === 'agent' ? AGENT_REGISTRY[m.agentName || claimActiveAgent]?.icon : <User className="w-5 h-5" />}
                              </div>
                              <div className={`p-5 rounded-2xl text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${m.role === 'agent' ? 'bg-white text-black rounded-tl-none border border-black/5 shadow-sm' : 'bg-[#B11226] text-white rounded-tr-none shadow-lg'}`}>
                                {m.text}
                              </div>
                          </div>
                      </div>
                    );
                  })}
                  
                  {claimIsProcessing && <div className="flex items-center gap-3 text-[#B11226] text-[10px] font-black uppercase tracking-widest ml-14 animate-pulse"><Loader2 className="w-4 h-4 animate-spin" /> {claimActiveAgent} is processing records...</div>}
                  {claimId && !claimIsProcessing && <div className="ml-14 p-6 bg-emerald-50 border border-emerald-200 rounded-3xl"><h3 className="text-xl font-black text-emerald-900 uppercase">Tracking ID: {claimId}</h3><p className="text-[10px] font-bold text-emerald-700 uppercase mt-1">Status: Document Verified & Payout Authorized</p></div>}
                </div>

                <div className="p-8 bg-white border-t border-black/5">
                    <div className="max-w-2xl mx-auto">
                        {claimState === ClaimAppState.INTRO && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={handleStatusCheck}
                                    className="p-6 bg-white border-2 border-black/5 rounded-[1.5rem] flex flex-col items-center gap-3 hover:border-[#B11226] transition-all group"
                                >
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-[#B11226] group-hover:text-white transition-colors">
                                        <SearchCheck className="w-6 h-6" />
                                    </div>
                                    <span className="font-black uppercase text-xs tracking-widest">Claim Status Check</span>
                                </button>
                                <button 
                                    onClick={handleInitiateClaim}
                                    className="p-6 bg-white border-2 border-black/5 rounded-[1.5rem] flex flex-col items-center gap-3 hover:border-[#B11226] transition-all group"
                                >
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-[#B11226] group-hover:text-white transition-colors">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-black uppercase text-xs tracking-widest">Initiate Claim</span>
                                </button>
                            </div>
                        )}

                        {claimState === ClaimAppState.INTAKE && !claimIsProcessing && (
                            <div className="w-full">
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
                                <button onClick={() => fileInputRef.current?.click()} className="w-full p-10 border-2 border-dashed rounded-[2rem] border-[#B11226]/20 hover:bg-[#B11226]/5 transition-all flex flex-col items-center gap-4 group">
                                    <div className="w-16 h-16 bg-[#B11226] rounded-2xl flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform"><Upload className="w-8 h-8" /></div>
                                    <p className="font-black uppercase text-sm tracking-tight">Upload Claim Package (PDF)</p>
                                    <p className="text-xs text-black/40 font-bold uppercase">Multi-modal Intelligent Processing</p>
                                </button>
                            </div>
                        )}

                        {claimId && !claimIsProcessing && (
                          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button 
                                onClick={clearAllState}
                                className="w-full py-5 bg-[#B11226] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
                            >
                                <RefreshCw className="w-5 h-5" /> Process Another Claim
                            </button>
                          </div>
                        )}
                    </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <footer className="py-12 bg-slate-900 text-white/40 text-[10px] font-bold uppercase tracking-widest text-center">
        &copy; 2024 Canada Life Strategic Partnership // Node CL-NODE-AUTH-SEC
      </footer>
    </div>
  );
};

export default App;