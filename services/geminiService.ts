
import { GoogleGenAI } from "@google/genai";
import type { JournalEntry, GroundingChunk, UserLocation } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface QueryResult {
  text: string;
  groundingChunks?: GroundingChunk[];
}

const SYSTEM_INSTRUCTION = `You are a private personal knowledge base assistant. Your primary task is to answer questions based on the provided journal entries.

Rules:
1. Always check the provided journal entries first. If the answer is there, use it.
2. When you use information from an entry, you MUST cite its date in the format [Source: YYYY-MM-DD].
3. If the answer requires real-time geographic information or is about a location not fully detailed in the entries, use the Google Maps tool.
4. If the information is not in the journal and not related to location, simply state that you don't have that information in the journal.`;

const buildPrompt = (question: string, entries: JournalEntry[]): string => {
  const entriesText = entries.map(entry => {
    const ticketInfo = entry.ticketNumber ? `Ticket: ${entry.ticketNumber}\n` : '';
    return `---
${ticketInfo}Date: ${new Date(entry.date).toLocaleDateString('en-CA')}
Content:
${entry.content}
---`
  }).join('\n\n');

  return `Here are the journal entries to reference:

${entriesText}

Question: "${question}"`;
};

export const queryJournal = async (question: string, entries: JournalEntry[], location: UserLocation | null): Promise<QueryResult> => {
  if (!question.trim()) {
    return { text: "Please enter a question." };
  }

  const prompt = buildPrompt(question, entries);

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ googleMaps: {} }],
  };

  if (location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude,
        }
      }
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: config,
    });
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    return {
      text: response.text || "I couldn't generate a response.",
      groundingChunks: (groundingMetadata?.groundingChunks || []) as GroundingChunk[],
    };
  } catch (error) {
    console.error("Error querying Gemini API:", error);
    return { 
      text: "Sorry, I encountered an error while trying to answer your question. Please check the console for details." 
    };
  }
};

export const analyzeImageForText = async (base64Image: string, mimeType: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [
            imagePart, 
            { text: "Extract all text from this image." }
        ] 
      },
      config: {
        systemInstruction: "You are an expert at reading text from images, especially from equipment nameplates and labels. Analyze the image and extract all text you can find. Present the extracted text clearly. If there are multiple fields, format them as 'Label: Value'.",
      }
    });
    
    return response.text || "No text found in the image.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Error: Could not analyze the image.";
  }
};
