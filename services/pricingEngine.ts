import { UserData, UnderwritingDecision } from '../types';
import { BASE_MONTHLY_RATE } from '../constants';

export class PricingEngine {
  static calculate(data: UserData): UnderwritingDecision {
    const multipliers: Record<string, number> = {};
    let totalMultiplier = 1.0;

    // Age Factor
    const ageMultiplier = 1 + Math.max(0, (data.age - 18) * 0.04);
    multipliers['Age Loading'] = ageMultiplier;
    totalMultiplier *= ageMultiplier;

    // Gender Factor
    let genderMultiplier = 1.0;
    if (data.gender === 'Female') genderMultiplier = 0.95;
    if (data.gender === 'Male') genderMultiplier = 1.05;
    multipliers['Actuarial Segment'] = genderMultiplier;
    totalMultiplier *= genderMultiplier;

    // Product Factor
    let productMultiplier = 1.0;
    if (data.product === '10-year Term Life') productMultiplier = 0.8;
    if (data.product === '20-year Term Life') productMultiplier = 1.0;
    if (data.product === '30-year Term Life') productMultiplier = 1.3;
    if (data.product === 'Whole Life') productMultiplier = 3.5;
    multipliers[`Plan: ${data.product}`] = productMultiplier;
    totalMultiplier *= productMultiplier;

    // Occupation Factor
    let occMultiplier = 1.0;
    if (data.occupation === 'Trades & Construction') occMultiplier = 1.25;
    if (data.occupation === 'Healthcare') occMultiplier = 1.1;
    if (data.occupation === 'Government & Public Sector') occMultiplier = 1.05;
    multipliers['Occupational Risk'] = occMultiplier;
    totalMultiplier *= occMultiplier;

    // Smoking Factor
    const smokingMultiplier = data.smokingStatus === 'SMOKER' ? 2.1 : 1.0;
    if (smokingMultiplier > 1) multipliers['Tobacco Use'] = smokingMultiplier;
    totalMultiplier *= smokingMultiplier;

    // Alcohol Factor
    let alcoholMultiplier = 1.0;
    if (data.alcoholConsumption === 'Moderate') alcoholMultiplier = 1.15;
    if (data.alcoholConsumption === 'Frequent') alcoholMultiplier = 1.4;
    if (alcoholMultiplier > 1) multipliers['Alcohol Usage Loading'] = alcoholMultiplier;
    totalMultiplier *= alcoholMultiplier;

    // Hobby Risk Factor
    let hobbyMultiplier = 1.0;
    const hazardousHobbies: Record<string, number> = {
      'Scuba diving': 1.15,
      'Skydiving': 1.50,
      'Mountaineering': 1.25,
      'Racing': 1.30
    };
    if (hazardousHobbies[data.hobby]) {
      hobbyMultiplier = hazardousHobbies[data.hobby];
      multipliers[`Hobby Risk: ${data.hobby}`] = hobbyMultiplier;
    }
    totalMultiplier *= hobbyMultiplier;

    // HbA1c Factor
    let hba1cMultiplier = 1.0;
    if (data.hba1c >= 6.5 && data.hba1c < 7.5) hba1cMultiplier = 1.4;
    else if (data.hba1c >= 7.5 && data.hba1c < 8.5) hba1cMultiplier = 2.2;
    else if (data.hba1c >= 8.5 && data.hba1c < 10.0) hba1cMultiplier = 3.5;
    else if (data.hba1c >= 10.0) hba1cMultiplier = 8.0;
    
    if (hba1cMultiplier > 1) {
        multipliers['HbA1c Level'] = hba1cMultiplier;
        totalMultiplier *= hba1cMultiplier;
    }

    // BMI Factor
    let bmiMultiplier = 1.0;
    if (data.bmi > 30) bmiMultiplier = 1.2;
    if (data.bmi > 35) bmiMultiplier = 1.6;
    if (bmiMultiplier > 1) multipliers['BMI Adjustment'] = bmiMultiplier;
    totalMultiplier *= bmiMultiplier;

    // Complications Factor
    const complicationCount = data.complications.filter(c => c !== 'None').length;
    const complicationsMultiplier = 1 + (complicationCount * 0.5);
    if (complicationsMultiplier > 1) multipliers['Medical History'] = complicationsMultiplier;
    totalMultiplier *= complicationsMultiplier;

    // Family History Factor
    let fhMultiplier = 1.0;
    const fhWeights: Record<string, number> = { 'Father': 1.1, 'Mother': 1.1, 'Siblings': 1.15, 'Multiple': 1.25 };
    if (fhWeights[data.fhHeartDisease]) fhMultiplier *= fhWeights[data.fhHeartDisease];
    if (fhWeights[data.fhDiabetes]) fhMultiplier *= fhWeights[data.fhDiabetes];
    if (fhWeights[data.fhCancer]) fhMultiplier *= fhWeights[data.fhCancer];
    if (fhWeights[data.fhGenetic]) fhMultiplier *= fhWeights[data.fhGenetic];

    if (fhMultiplier > 1) {
        multipliers['Family History Loading'] = fhMultiplier;
        totalMultiplier *= fhMultiplier;
    }

    const coverageFactor = data.coverageAmount / 100000;
    const basePremium = BASE_MONTHLY_RATE * coverageFactor;
    const adjustedPremium = basePremium * totalMultiplier;

    let status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' = 'APPROVED';
    if (data.hba1c >= 10.0 || complicationCount >= 3 || totalMultiplier > 15) {
      status = 'MANUAL_REVIEW';
    }

    const riskScore = Math.min(100, (totalMultiplier / 10) * 100);

    return {
      riskScore,
      basePremium,
      adjustedPremium,
      multipliers,
      status,
      reasoning: this.generateReasoning(data, status)
    };
  }

  private static generateReasoning(data: UserData, status: string): string {
    const hasFamilyHistory = data.fhHeartDisease !== 'None' || data.fhDiabetes !== 'None' || data.fhCancer !== 'None' || data.fhGenetic !== 'None';
    
    if (status === 'MANUAL_REVIEW') {
      return `Application flagged for expert review. Clinical markers (HbA1c: ${data.hba1c}) or complex risk aggregation including ${hasFamilyHistory ? 'significant family history' : 'lifestyle factors'} require manual adjudication.`;
    }
    return `Patient demonstrates managed glycemic control. Multi-agent cluster factored in occupational risk, active hobby profile, and ${hasFamilyHistory ? 'disclosed family history markers' : 'unremarkable family history'}. Terms optimized for clinical stability.`;
  }
}