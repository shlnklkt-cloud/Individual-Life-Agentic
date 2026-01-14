
import React from 'react';
import { 
  UserCircle, 
  Stethoscope, 
  Cpu, 
  FileText, 
  CreditCard, 
  CheckCircle 
} from 'lucide-react';

export const STEPS = [
  { id: 'INTAKE', label: 'Basic Info', icon: <UserCircle className="w-5 h-5" /> },
  { id: 'MEDICAL', label: 'Medical Profile', icon: <Stethoscope className="w-5 h-5" /> },
  { id: 'AGENT_PROCESSING', label: 'AI Analysis', icon: <Cpu className="w-5 h-5" /> },
  { id: 'QUOTE', label: 'Your Quote', icon: <FileText className="w-5 h-5" /> },
  { id: 'PAYMENT', label: 'Secure Payment', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'ISSUANCE', label: 'Policy Issued', icon: <CheckCircle className="w-5 h-5" /> },
];

export const BASE_MONTHLY_RATE = 45.00;

export const COMPLICATIONS_OPTIONS = [
  "Retinopathy",
  "Neuropathy",
  "Nephropathy",
  "Cardiovascular Disease",
  "None"
];
