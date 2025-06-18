
// src/services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { RequestData, ServiceType, GeoLocation, GroundingChunk, EarningDataPoint, UserRole, AIAnalysisResult, AISmartReplyResponse, AISuggestionResponse, RecipientDetails } from '../src/types.js';
import { GEMINI_TEXT_MODEL } from '../src/constants.js';

// Helper to safely parse JSON from Gemini response, removing markdown fences
const parseGeminiJsonResponse = (jsonString: string): any => {
  let cleanJsonString = jsonString.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanJsonString.match(fenceRegex);
  if (match && match[2]) {
    cleanJsonString = match[2].trim();
  }
  try {
    return JSON.parse(cleanJsonString);
  } catch (e) {
    console.error("Failed to parse JSON response from Gemini:", e);
    console.error("Original string:", jsonString);
    throw new Error("Invalid JSON response from AI.");
  }
};

const getGenAIClient = (): GoogleGenAI | null => {
  const apiKey = window.process?.env?.API_KEY;
  const placeholderKeyFromHtml = "AIzaSyC5RjIN96WwOI_D9xjP0Jl6ZLd9sbyDtAw"; // Key from index.html

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey === placeholderKeyFromHtml) { 
    console.error(`Gemini API key not configured or is a placeholder. Please ensure window.process.env.API_KEY is correctly set in index.html with your actual, functional key. Current key: ${apiKey ? '********' : 'Not set'}`);
     if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY" && apiKey !== placeholderKeyFromHtml && !apiKey.startsWith("AIza")) { 
        console.warn("The configured Gemini API_KEY does not look like a valid key format.");
    }
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeRequestWithGemini = async (
  requestInputs: Pick<RequestData, 'textInput' | 'imageB64Data' | 'hasAudio' | 'hasVideo' | 'numUploadedMedia' | 'origin' | 'destination' | 'requestFor' | 'recipientDetails' | 'targetMapLocation'>
): Promise<AIAnalysisResult> => {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini client not initialized. Check API Key configuration in index.html.");
  }

  const { textInput, imageB64Data, hasAudio, hasVideo, numUploadedMedia, origin, destination, requestFor, recipientDetails, targetMapLocation } = requestInputs;

  let promptContext = `You are an intelligent request analyzer for the 'gotodo.ai' platform.
The user is creating a new request.
Request For: ${requestFor}
`;

  if (requestFor === 'someone_else' && recipientDetails) {
    promptContext += `Recipient Name: ${recipientDetails.name || 'Not specified'}\n`;
    if (recipientDetails.address) {
      promptContext += `Recipient Address: ${recipientDetails.address.address || `Lat/Lng: ${recipientDetails.address.lat}, ${recipientDetails.address.lng}`}\n`;
    }
    if (recipientDetails.contact) {
      promptContext += `Recipient Contact: ${recipientDetails.contact}\n`;
    }
    if (recipientDetails.notes) {
      promptContext += `Recipient Notes: ${recipientDetails.notes}\n`;
    }
  }

  if (origin) {
    promptContext += `Origin Location: ${origin.address || `Lat/Lng: ${origin.lat}, ${origin.lng}`}\n`;
  }
  if (destination) {
    promptContext += `Destination Location: ${destination.address || `Lat/Lng: ${destination.lat}, ${destination.lng}`}\n`;
  }
  if (targetMapLocation && !origin && !destination) { // If a general area is specified and not specific origin/dest
    promptContext += `General Area of Interest: ${targetMapLocation.address || `Lat/Lng: ${targetMapLocation.lat}, ${targetMapLocation.lng}`}\n`;
  }

  promptContext += `User's textual input related to the request: "${textInput || "No text provided."}"\n`;

  const contentParts: any[] = [{ text: "" }]; 

  if (imageB64Data) {
    promptContext += `An image was also provided. Please consider its content in your analysis.\n`;
    contentParts.push({
      inlineData: {
        mimeType: 'image/jpeg', 
        data: imageB64Data,
      },
    });
  }
  if (hasAudio) {
    promptContext += `An audio recording was provided (Note: audio content is not transcribed here, but indicated as present).\n`;
  }
  if (hasVideo) {
    promptContext += `A video recording was provided (Note: video content is not transcribed here, but indicated as present).\n`;
  }
  if (numUploadedMedia && numUploadedMedia > 0) {
    promptContext += `${numUploadedMedia} other media file(s) were uploaded.\n`;
  }

  promptContext += `
Based on ALL available information (including specified locations, recipient details, and user inputs like text/image/audio/video presence):
1.  Determine the most appropriate 'ServiceType'. Valid types are: ${Object.values(ServiceType).join(", ")}. If unsure, use 'UNKNOWN'.
2.  Create a concise 'summary' of the user's core need (max 50 words). This summary should integrate all inputs.
3.  Extract key 'entities' relevant to fulfilling the request. If locations (origin, destination, recipient address) are already provided above, you do not need to re-extract them unless the text input provides MORE SPECIFIC details (e.g., "main entrance of 123 Main St"). Focus on other entities like itemDescription, taskDetails, urgency, quantity, specifications, brand, model. Example entities: 'item', 'serviceRequired', 'problemDescription'.
4.  Suggest a 'priceSuggestion' (a number) if appropriate, otherwise omit or set to 0.

Respond STRICTLY with a single JSON object:
{
  "type": "ServiceType (enum value)",
  "summary": "string",
  "entities": { /* (e.g. "item": "iPhone 15 Pro", "problem": "cracked screen") */ },
  "priceSuggestion": number (optional)
}
`;
  contentParts[0].text = promptContext;

  console.log("Sending to Gemini for analysis:", { model: GEMINI_TEXT_MODEL, contents: { parts: contentParts }, config: { responseMimeType: "application/json" }});

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
      }
    });
    const rawText = response.text;
    console.log("Raw Gemini analysis response:", rawText);
    const parsedJson = parseGeminiJsonResponse(rawText) as AIAnalysisResult;

    if (!Object.values(ServiceType).includes(parsedJson.type)) {
        console.warn(`Gemini returned an invalid service type: ${parsedJson.type}. Defaulting to UNKNOWN.`);
        parsedJson.type = ServiceType.UNKNOWN;
    }
    return parsedJson;

  } catch (error) {
    console.error("Error calling Gemini for request analysis:", error);
    throw new Error("AI analysis failed. Please try again.");
  }
};


export const analyzeAudioForServiceRequest = async (
  audioB64Data: string,
  mimeType: string,
  additionalContext?: string
): Promise<AIAnalysisResult> => {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini client not initialized. Check API Key.");
  }

  let prompt = `You are an intelligent request analyzer for the 'gotodo.ai' platform.
The user has provided an audio recording describing their need.
${additionalContext ? `Additional context: "${additionalContext}"` : ""}

Based on the audio content, please:
1.  Determine the most appropriate 'ServiceType'. Valid types are: ${Object.values(ServiceType).join(", ")}. If unsure, use 'UNKNOWN'.
2.  Create a concise 'summary' of the user's core need from the audio (max 50 words).
3.  Extract key 'entities' relevant to fulfilling the request (e.g., location, itemDescription, destinationAddress, urgency, taskDetails, quantity, specifications, brand, model). This should be a flexible JSON object. Specific entities to look for: 'pickupAddress' (string), 'destinationAddress' (string), 'locationName' (string), 'item' (string), 'serviceRequired' (string).
4.  Suggest a 'priceSuggestion' (a number) if appropriate for the request, otherwise omit it or set to 0.

Respond STRICTLY with a single JSON object with the following schema:
{
  "type": "ServiceType (enum value)",
  "summary": "string",
  "entities": { "key1": "value1", "key2": "value2", ... },
  "priceSuggestion": number (optional)
}`;

  const contentParts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType,
        data: audioB64Data,
      },
    }
  ];
  
  console.log("Sending audio to Gemini for service request analysis:", { model: GEMINI_TEXT_MODEL, contents: { parts: contentParts } });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, 
      contents: { parts: contentParts },
      config: {
        responseMimeType: "application/json",
      }
    });
    const rawText = response.text;
    console.log("Raw Gemini audio analysis response:", rawText);
    const parsedJson = parseGeminiJsonResponse(rawText) as AIAnalysisResult;
     if (!Object.values(ServiceType).includes(parsedJson.type)) {
        console.warn(`Gemini returned an invalid service type from audio: ${parsedJson.type}. Defaulting to UNKNOWN.`);
        parsedJson.type = ServiceType.UNKNOWN;
    }
    return parsedJson;
  } catch (error) {
    console.error("Error calling Gemini for audio request analysis:", error);
    throw new Error("AI audio analysis failed. Please try again.");
  }
};

export const getSuggestionsFromVideo = async (
  videoB64Data: string,
  mimeType: string,
  userQuery?: string 
): Promise<AISuggestionResponse> => {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini client not initialized. Check API Key.");
  }

  let prompt = `You are "GEMMA 3n", an advanced AI assistant for the 'gotodo.ai' platform.
The user is providing a video (which includes audio) and may be speaking or showing something.
${userQuery ? `The user also typed/asked: "${userQuery}"` : "The user is looking for live suggestions or answers based on the video content."}

Analyze the video and audio content. Provide helpful suggestions, answer questions, or identify tasks.
Respond in a conversational, helpful manner. If you identify a clear task, summarize it.
Your response should be a single text block.`;
  
  const contentParts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType, 
        data: videoB64Data,
      },
    }
  ];

  console.log("Sending video to Gemini for suggestions:", { model: GEMINI_TEXT_MODEL, contents: { parts: contentParts } });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL, 
      contents: { parts: contentParts },
    });
    const textResponse = response.text;
    console.log("Raw Gemini video suggestion response:", textResponse);
    return { textResponse };
  } catch (error) {
    console.error("Error calling Gemini for video suggestions:", error);
    throw new Error("AI video suggestion failed. Please try again.");
  }
};


export const getDynamicPriceSuggestion = async (
  serviceType: ServiceType, 
  requestSummary: string, 
  entities: Record<string, any>, 
  distanceKm?: number
): Promise<number> => {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini client not initialized.");
  }

  const prompt = `You are a dynamic pricing engine for the 'gotodo.ai' platform.
A service request has the following details:
Service Type: ${serviceType}
Request Summary: ${requestSummary}
Extracted Entities: ${JSON.stringify(entities)}
${distanceKm ? `Estimated Distance: ${distanceKm} km` : ""}

Based on these details, suggest a fair market price for this service.
Consider factors like complexity, urgency (if implied), item value, distance, etc.

Respond STRICTLY with a single JSON object:
{
  "suggestedPrice": number
}
`;
  console.log("Sending to Gemini for price suggestion:", { model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const rawText = response.text;
    console.log("Raw Gemini price suggestion response:", rawText);
    const parsedJson = parseGeminiJsonResponse(rawText);
    return parsedJson.suggestedPrice || 0;
  } catch (error) {
    console.error("Error calling Gemini for price suggestion:", error);
    throw new Error("AI price suggestion failed.");
  }
};

export const fetchGroundedResponse = async (promptText: string): Promise<{text: string, sources: GroundingChunk[]}> => {
  const ai = getGenAIClient();
  if (!ai) {
    console.warn("Gemini client not initialized for grounded search. Using mocked response.");
    return {
        text: `Mocked grounded response for "${promptText}". (API Key not configured). For accurate, up-to-date information, configure the API key.`,
        sources: [
            { web: { uri: "https://example.com/mock-source1", title: "Mock Source 1 (API Key Missing)" } },
            { retrievedContext: { uri: "https://example.com/mock-retrieved1", title: "Mock Retrieved Context 1 (API Key Missing)" } }
        ]
    };
  }
  console.log("Sending to Gemini for grounded search:", { model: GEMINI_TEXT_MODEL, contents: promptText, config: { tools: [{googleSearch: {}}] } });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: promptText,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    const text = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = (groundingMetadata?.groundingChunks || []) as GroundingChunk[]; 
    console.log("Gemini grounded response:", text, "Sources:", sources);
    return { text, sources };
  } catch (error) {
    console.error("Error calling Gemini API for grounded search:", error);
    throw new Error("AI grounded search failed.");
  }
};

export const getEarningsInsights = async (earningsData: EarningDataPoint[]): Promise<string[]> => {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini client not initialized.");
  }
  const prompt = `You are an AI financial advisor for service providers on the 'gotodo.ai' platform.
Analyze the following weekly earnings data:
${JSON.stringify(earningsData)}

Provide 2-3 actionable insights to help the provider optimize their work or earn more.
Keep insights concise and practical.

Respond STRICTLY with a single JSON object:
{
  "insights": ["Insight text 1", "Insight text 2", ...]
}
`;
  console.log("Sending to Gemini for earnings insights:", { model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const rawText = response.text;
    console.log("Raw Gemini earnings insights response:", rawText);
    const parsedJson = parseGeminiJsonResponse(rawText);
    return parsedJson.insights || ["Could not generate insights at this time."];
  } catch (error) {
    console.error("Error calling Gemini for earnings insights:", error);
    throw new Error("AI insights generation failed.");
  }
};

export const getSmartReplyOrTranslation = async (
    conversationContext: string,
    currentMessage: string,
    userRole: UserRole,
    targetAction: 'suggest_reply' | 'translate',
    targetLanguage?: string
): Promise<AISmartReplyResponse> => {
  const ai = getGenAIClient();
  if (!ai) {
    return { error: "Gemini client not initialized." };
  }

  let prompt = `You are an AI communication assistant for 'gotodo.ai'.
User role: ${userRole}
Conversation context (last few messages): "${conversationContext}"
Current message: "${currentMessage}"
`;

  if (targetAction === 'suggest_reply') {
    prompt += `
Provide 1 to 3 concise, contextually relevant smart replies for the ${userRole}.
Respond STRICTLY with a single JSON object:
{
  "replies": ["Reply option 1", "Reply option 2", ...]
}
`;
  } else if (targetAction === 'translate' && targetLanguage) {
    prompt += `
Translate the current message into ${targetLanguage}.
Respond STRICTLY with a single JSON object:
{
  "translation": "Translated text"
}
`;
  } else {
    return { error: "Invalid target action or missing target language for translation." };
  }
  
  console.log("Sending to Gemini for smart reply/translation:", { model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const rawText = response.text;
    console.log("Raw Gemini smart reply/translation response:", rawText);
    return parseGeminiJsonResponse(rawText) as AISmartReplyResponse;
  } catch (error) {
    console.error("Error calling Gemini for smart reply/translation:", error);
    return { error: "AI communication assistance failed." };
  }
};