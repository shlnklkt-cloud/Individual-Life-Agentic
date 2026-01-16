
export enum AppState {
  INTERVIEW = 'INTERVIEW',
  AGENT_PROCESSING = 'AGENT_PROCESSING',
  QUOTE = 'QUOTE',
  PAYMENT = 'PAYMENT',
  ISSUANCE = 'ISSUANCE'
}

export enum ClaimAppState {
  INTRO = 'INTRO',
  INTAKE = 'INTAKE',
  SPLITTING = 'SPLITTING',
  CLASSIFICATION = 'CLASSIFICATION',
  EXTRACTION = 'EXTRACTION',
  SUMMARIZATION = 'SUMMARIZATION',
  QUALITY_CHECK = 'QUALITY_CHECK'
}

export type MainView = 'LOGIN' | 'DASHBOARD' | 'POLICY' | 'CLAIM';

export type AgentName = 
  | 'Orchestrator Agent'
  | 'Application Intake Agent'
  | 'Data Integrity & Disclosure Validation'
  | 'Fraud & Anomaly Detection'
  | 'Med Triage'
  | 'Med Evidence Collection'
  | 'Med Risk Interpretation'
  | 'Lifestyle & Medical Interaction'
  | 'Mortality Scoring & Risk Aggregation'
  | 'Pricing & Terms Recommendation'
  | 'Explainability & Adverse Action'
  | 'Human Underwriter Collaboration'
  | 'Final Underwriting Decision'
  | 'Finley'
  | 'Lyra'
  // Claims Agents
  | 'Intake Orchestration Agent'
  | 'Document Splitting Agent'
  | 'Document Classification Agent'
  | 'Data Extraction Agent'
  | 'Claim Summarization Agent'
  | 'Quality & Confidence Agent';

export interface Message {
  id: string;
  role: 'agent' | 'user';
  agentName?: AgentName;
  text: string;
  timestamp: Date;
  type?: 'text' | 'thought' | 'action';
}

export interface UserData {
  fullName: string;
  email: string;
  dob?: string;
  age: number;
  gender: string;
  occupation: string;
  product: string;
  smokingStatus: 'NON_SMOKER' | 'SMOKER';
  alcoholConsumption: 'None' | 'Occasional' | 'Moderate' | 'Frequent';
  hobby: string;
  coverageAmount: number;
  hba1c: number;
  bmi: number;
  yearsDiagnosed: number;
  complications: string[];
  hasDiabetes?: 'Yes' | 'No';
  medicalReportName?: string;
  fhHeartDisease: string;
  fhDiabetes: string;
  fhCancer: string;
  fhGenetic: string;
}

export interface UnderwritingDecision {
  riskScore: number;
  basePremium: number;
  adjustedPremium: number;
  multipliers: Record<string, number>;
  status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasoning: string;
}
