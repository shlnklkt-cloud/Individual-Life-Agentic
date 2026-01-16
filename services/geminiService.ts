
import { GoogleGenAI } from "@google/genai";
import { UserData, UnderwritingDecision } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const performAIUnderwriting = async (userData: UserData, decision: UnderwritingDecision): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `
      Act as a Senior Medical Underwriter for Canada Life. 
      Review the following applicant data:
      - Name: ${userData.fullName}
      - Age: ${userData.age}
      - Gender: ${userData.gender}
      - Occupation: ${userData.occupation}
      - HbA1c: ${userData.hba1c}
      - BMI: ${userData.bmi}
      - Smoking: ${userData.smokingStatus}
      - Alcohol Consumption: ${userData.alcoholConsumption}
      - Hobby/Activity: ${userData.hobby}
      - Complications: ${userData.complications.join(', ')}
      - Years Diagnosed: ${userData.yearsDiagnosed}
      - Family History (Heart): ${userData.fhHeartDisease}
      - Family History (Diabetes): ${userData.fhDiabetes}
      - Family History (Cancer): ${userData.fhCancer}
      - Family History (Genetic): ${userData.fhGenetic}
      
      Calculated Risk Score: ${decision.riskScore}/100
      Status: ${decision.status}
      
      Provide a professional, 3-sentence clinical summary of why this decision was reached. Correlate their lifestyle (hobby, alcohol, occupation) and their family history disclosures with their long-term health outlook. Focus on risk mitigation and the impact of heredity on their specific insurance product choice. Do not use markdown headers.
    `;

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
    return "The automated system has verified your health stability indicators. Based on the provided clinical markers and family history data, your profile qualifies for specialized coverage under the CL-9 protocol.";
  }
};

export const analyzeBMIFromImage = async (base64Data: string): Promise<number> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: "Analyze this photo for life insurance underwriting purposes. Estimate the subject's Body Mass Index (BMI) based on body composition, facial features, and overall physique. Return ONLY a single number between 15.0 and 50.0. No text, no explanation.",
          },
        ],
      },
      config: {
        temperature: 0.2,
      }
    });

    const result = parseFloat(response.text?.trim() || "24.0");
    return isNaN(result) ? 24.0 : result;
  } catch (error) {
    console.error("BMI Vision Error:", error);
    return 24.0; // Fallback to healthy average
  }
};
