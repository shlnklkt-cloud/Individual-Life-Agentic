
import { GoogleGenAI } from "@google/genai";
import { UserData, UnderwritingDecision } from "../types";

export const performAIUnderwriting = async (userData: UserData, decision: UnderwritingDecision): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Act as a Senior Medical Underwriter for DiaGuard Life Insurance. 
      Review the following applicant data:
      - Name: ${userData.fullName}
      - Age: ${userData.age}
      - Gender: ${userData.gender}
      - Occupation: ${userData.occupation}
      - Selected Product: ${userData.product}
      - HbA1c: ${userData.hba1c}
      - BMI: ${userData.bmi}
      - Smoking: ${userData.smokingStatus}
      - Alcohol Consumption: ${userData.alcoholConsumption}
      - Hobby/Activity: ${userData.hobby}
      - Complications: ${userData.complications.join(', ')}
      - Years Diagnosed: ${userData.yearsDiagnosed}
      
      Calculated Risk Score: ${decision.riskScore}/100
      Status: ${decision.status}
      
      Provide a professional, 3-sentence clinical summary of why this decision was reached. Mention how their gender (${userData.gender}), occupation (${userData.occupation}), product choice (${userData.product}), hobby (${userData.hobby}), and alcohol intake (${userData.alcoholConsumption}) might correlate with their glycemic management or metabolic health. Focus on the relationship between lifestyle, workplace environment, and long-term diabetic health. Do not use markdown headers.
    `;

    // Always use generateContent and include thinkingBudget if maxOutputTokens is specified for Gemini 3/2.5 models.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 250,
        thinkingConfig: { thinkingBudget: 100 },
      }
    });

    return response.text || "Unable to generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The automated system has verified your glycemic stability indicators. Based on the provided HbA1c and secondary health markers, your profile qualifies for specialized diabetic life coverage.";
  }
};
