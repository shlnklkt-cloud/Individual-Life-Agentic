
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

    // Gender Factor (Standard actuarial adjustment: Female is lower risk for mortality)
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
    if (data.occupation === 'Manual Labor/Trade') occMultiplier = 1.25;
    if (data.occupation === 'Healthcare Professional') occMultiplier = 1.1;
    if (data.occupation === 'IT Project Manager' || data.occupation === 'Office/Admin') occMultiplier = 1.0;
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

    // HbA1c Factor (The Core Diabetic Risk)
    let hba1cMultiplier = 1.0;
    if (data.hba1c < 6.5) {
      hba1cMultiplier = 1.0;
    } else if (data.hba1c < 7.5) {
      hba1cMultiplier = 1.4;
    } else if (data.hba1c < 8.5) {
      hba1cMultiplier = 2.2;
    } else if (data.hba1c < 10.0) {
      hba1cMultiplier = 3.5;
    } else {
      hba1cMultiplier = 10.0; // Automatic Manual Review / Decline
    }
    multipliers['HbA1c Level'] = hba1cMultiplier;
    totalMultiplier *= hba1cMultiplier;

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

    // Coverage Amount Factor (Base rate is for $100k)
    const coverageFactor = data.coverageAmount / 100000;
    
    const basePremium = BASE_MONTHLY_RATE * coverageFactor;
    const adjustedPremium = basePremium * totalMultiplier;

    let status: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW' = 'APPROVED';
    if (data.hba1c >= 10.0 || complicationCount >= 3 || data.alcoholConsumption === 'Frequent') {
      status = 'MANUAL_REVIEW';
    }

    // Risk Score (0-100)
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
    const activityLevel = ['Walking/Hiking', 'Yoga', 'Swimming', 'Team Sports', 'Gardening'].includes(data.hobby) ? 'active' : 'sedentary';
    const alcoholLevel = data.alcoholConsumption.toLowerCase();
    
    if (status === 'MANUAL_REVIEW') {
      return `Application flagged for expert review due to clinical markers (HbA1c: ${data.hba1c}) or lifestyle factors (${alcoholLevel} alcohol usage). Initial automated screening suggests potential volatility for the requested ${data.product}. Activity levels via hobby (${data.hobby}) and occupational profile (${data.occupation}) noted for final review.`;
    }
    return `Patient demonstrates ${data.hba1c < 7 ? 'excellent' : 'managed'} glycemic control with an HbA1c of ${data.hba1c}. Hobbies include ${data.hobby}, and alcohol consumption is ${alcoholLevel}. Occupational profile (${data.occupation}) and selected ${data.product} have been factored into demographic adjustments. Coverage approved.`;
  }
}
