
export enum AppState {
  INTERVIEW = 'INTERVIEW',
  AGENT_PROCESSING = 'AGENT_PROCESSING',
  QUOTE = 'QUOTE',
  PAYMENT = 'PAYMENT',
  ISSUANCE = 'ISSUANCE'
}

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
  | 'Lyra';

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
}

export interface UnderwritingDecision {
  riskScore: number;
  basePremium: number;
  adjustedPremium: number;
  multipliers: Record<string, number>;
  status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  reasoning: string;
}
