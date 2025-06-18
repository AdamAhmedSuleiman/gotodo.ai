// src/services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
    RequestData, ServiceType, GeoLocation, GroundingChunk, EarningDataPoint, UserRole, 
    AIAnalysisResult, AISmartReplyResponse, AISuggestionResponse, RecipientDetails,
    TaskProject, Product, TaskSubItem, ProjectRisk, AICriticalPathInfo, DailyRoutineRoute, User, ChatMessage
} from '../types.js'; 
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants.js'; 

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
  if (typeof window === 'undefined' || !window.process || !window.process.env) {
    console.error("Gemini API key environment (window.process.env) not found. Ensure it's correctly set up in index.html.");
    return null;
  }

  const apiKey = window.process.env.API_KEY;
  const placeholderKeyFromHtml = "AIzaSyC5RjIN96WwOI_D9xjP0Jl6ZLd9sbyDtAw"; 

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey === placeholderKeyFromHtml) { 
    console.error(`Gemini API key not configured or is a placeholder. Please ensure window.process.env.API_KEY is correctly set in index.html with your actual, functional key. Current key: ${apiKey ? '********' : 'Not set'}`);
     if (apiKey && apiKey !== "YOUR_GEMINI_API_KEY" && apiKey !== placeholderKeyFromHtml && !apiKey.startsWith("AIzaSy")) { 
        console.warn("The configured Gemini API_KEY does not look like a valid key format.");
    }
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeRequestWithGemini = async (
  requestInputs: Pick<RequestData, 'textInput' | 'imageB64Data' | 'hasAudio' | 'hasVideo' | 'numUploadedMedia' | 'origin' | 'destination' | 'requestFor' | 'recipientDetails' | 'targetMapLocation'> & { taskContext?: string }
): Promise<AIAnalysisResult> => {
  const ai = getGenAIClient();
  if (!ai) {
    throw new Error("Gemini client not initialized. Check API Key configuration in index.html.");
  }

  const { textInput, imageB64Data, hasAudio, hasVideo, numUploadedMedia, origin, destination, requestFor, recipientDetails, targetMapLocation, taskContext } = requestInputs;

  let promptContext = `You are an intelligent request analyzer for the 'gotodo.ai' platform.
The user is creating a new request.
Request For: ${requestFor}
`;

  if (taskContext) {
    promptContext += `This request is part of a larger task: "${taskContext}"\n`;
  }

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

  if (origin) promptContext += `Origin Location: ${origin.address || `Lat/Lng: ${origin.lat}, ${origin.lng}`}\n`;
  if (destination) promptContext += `Destination Location: ${destination.address || `Lat/Lng: ${destination.lat}, ${destination.lng}`}\n`;
  if (targetMapLocation && !origin && !destination) promptContext += `General Area of Interest: ${targetMapLocation.address || `Lat/Lng: ${targetMapLocation.lat}, ${targetMapLocation.lng}`}\n`;

  promptContext += `User's textual input related to the request: "${textInput || "No text provided."}"\n`;

  const contentParts: any[] = [{ text: "" }]; 

  if (imageB64Data) {
    promptContext += `An image was also provided. Consider its content.\n`;
    contentParts.push({ inlineData: { mimeType: 'image/jpeg', data: imageB64Data } });
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
Based on ALL available information:
1.  Determine 'ServiceType'. Valid types: ${Object.values(ServiceType).join(", ")}. Default: 'UNKNOWN'.
2.  Create a concise 'summary' (max 50 words).
3.  Extract key 'entities' (item, taskDetails, urgency, quantity, specifications, brand, model).
4.  Suggest 'aiSuggestedTransportationModes' (array of TransportationMode enum values) if relevant.
5.  Suggest a 'priceSuggestion' (number), default 0.

Respond STRICTLY with a single JSON object:
{
  "type": "ServiceType",
  "summary": "string",
  "entities": { /* ... */ },
  "aiSuggestedTransportationModes": ["TransportationMode", ...],
  "priceSuggestion": number
}
`;
  contentParts[0].text = promptContext;

  console.log("Sending to Gemini for analysis:", { model: GEMINI_TEXT_MODEL, contents: { parts: contentParts }, config: { responseMimeType: "application/json" } });
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: { parts: contentParts },
      config: { responseMimeType: "application/json" }
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

export const analyzeForTaskPlanning = async (projectDescription: string, projectLocation?: GeoLocation): Promise<Partial<TaskProject>> => {
    const ai = getGenAIClient();
    if (!ai) {
        console.warn("Gemini client not initialized for task planning. Returning mock project plan.");
        return {
            title: projectDescription.substring(0,30) + " (Mock Plan)",
            description: `Mock AI-generated plan for: ${projectDescription}`,
            itemsNeeded: [
                { id: 'item-1-mock', type: 'service', name: 'Initial Consultation (Mock)', status: 'pending', quantity: 1, unit: 'session' },
                { id: 'item-2-mock', type: 'product', name: 'Basic Supplies (Mock)', quantity: 1, status: 'pending', unit: 'kit' }
            ],
            milestones: [{id: 'milestone-1-mock', name: 'Phase 1 Kickoff (Mock)', date: new Date().toISOString().split('T')[0], completed: false }]
        };
    }

    let prompt = `You are an AI project planning assistant for 'gotodo.ai'.
A user wants to plan a project.
Description: "${projectDescription}"
${projectLocation ? `Primary Location: ${projectLocation.address || `Lat/Lng: ${projectLocation.lat}, ${projectLocation.lng}`}` : ""}

Break this project down into manageable components. Suggest:
1.  A concise 'title' for the project (max 10 words).
2.  A brief overall 'description' of what the AI understands the project to be (max 50 words).
3.  A list of 'itemsNeeded' (array of objects, max 5 items). Each item should have 'id' (string, e.g., "item-1"), 'type' (enum: 'service', 'product', 'logistics'), 'name' (string, concise), optional 'description' (string, brief), optional 'quantity' (number), optional 'unit' (string, e.g., 'pcs', 'hours', 'kg'), and 'status' (fixed string: 'pending').
4.  A few key 'milestones' (array of objects, max 3 milestones). Each milestone should have 'id' (string, e.g., "milestone-1"), 'name' (string, concise), 'date' (string, use current date in YYYY-MM-DD format for mock), and 'completed' (boolean, fixed to false).

Keep names and descriptions concise. The focus is on high-level breakdown.

Respond STRICTLY with a single JSON object matching this exact structure:
{
  "title": "string",
  "description": "string",
  "itemsNeeded": [{ "id": "string", "type": "string", "name": "string", "description": "string", "quantity": number, "unit": "string", "status": "pending" }],
  "milestones": [{ "id": "string", "name": "string", "date": "YYYY-MM-DD", "completed": false }]
}
`;
    console.log("Sending to Gemini for task planning:", { model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } });
    try {
        const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } });
        const parsed = parseGeminiJsonResponse(response.text) as Partial<TaskProject>;
        parsed.itemsNeeded = (parsed.itemsNeeded || []).map((item, index) => ({ 
            ...item, 
            id: item.id || `item-${index}-${Date.now()}`,
            status: 'pending' 
        }));
        parsed.milestones = (parsed.milestones || []).map((milestone, index) => ({ 
            ...milestone, 
            id: milestone.id || `milestone-${index}-${Date.now()}`,
            date: milestone.date || new Date().toISOString().split('T')[0], 
            completed: false 
        }));
        return parsed;
    } catch (error) {
        console.error("Error during AI task planning:", error);
        throw new Error("AI task planning failed.");
    }
};

export const prioritizeTaskSubItems = async (
  projectTitle: string,
  projectDescription: string,
  items: Pick<TaskSubItem, 'id' | 'name' | 'description' | 'type' | 'estimatedCost' | 'dependsOn'>[]
): Promise<{ orderedItemIds: string[], justification: string }> => {
  const ai = getGenAIClient();
  if (!ai) {
    return { orderedItemIds: items.map(item => item.id), justification: "AI client not initialized. Items kept in original order." };
  }
  const itemsContext = items.map(item => 
    `- ID: ${item.id}, Name: ${item.name}, Type: ${item.type}, Desc: ${item.description || 'N/A'}, Est. Cost: $${item.estimatedCost || 0}${item.dependsOn && item.dependsOn.length > 0 ? ', Depends On: ' + item.dependsOn.join(', ') : ''}`
  ).join("\n");

  const prompt = `You are an AI project management assistant for 'gotodo.ai'.
Project Title: "${projectTitle}"
Project Description: "${projectDescription}"
Sub-Items/Tasks:
${itemsContext}

Considering the item details and their dependencies (if any), suggest a logical order for executing these items.
The goal is to complete the project efficiently, respecting dependencies.
If an item 'A' depends on item 'B', 'B' must appear before 'A' in the ordered list.
Provide the order as an array of item IDs ('orderedItemIds') and a brief 'justification' string (max 30 words).

Respond STRICTLY with a single JSON object:
{
  "orderedItemIds": ["item-id-1", "item-id-2", ...],
  "justification": "string"
}`;
  try {
    const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } });
    const parsed = parseGeminiJsonResponse(response.text) as { orderedItemIds: string[], justification: string };
    
    // Basic validation of returned IDs
    const originalIds = new Set(items.map(i => i.id));
    const returnedIds = new Set(parsed.orderedItemIds);
    if (originalIds.size !== returnedIds.size || !Array.from(originalIds).every(id => returnedIds.has(id))) {
        console.warn("AI prioritization response missing some item IDs or has duplicates/extras. Falling back to original order.");
        return { orderedItemIds: items.map(item => item.id), justification: "AI response was incomplete. Items kept in original order." };
    }

    return parsed;
  } catch (error) {
    console.error("Error during AI item prioritization:", error);
    throw new Error("AI item prioritization failed.");
  }
};

export const mockScanAndFetchProductDetails = async (scanType: 'barcode' | 'qrcode'): Promise<Partial<Product>> => {
    console.log(`Simulating ${scanType} scan and fetching product details...`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    if (scanType === 'barcode') {
        return {
            name: "Scanned Coffee Beans (Mock)",
            description: "Premium whole bean coffee, ethically sourced from Colombia. Rich and aromatic.",
            price: 15.99,
            stock: 50,
            category: "Groceries > Beverages > Coffee",
            barcode: "123456789012",
            photos: ["https://picsum.photos/seed/coffeebeans/200/200"],
        };
    } else { // qrcode
        return {
            name: "AI Smart Thermostat (QR Mock)",
            description: "Learns your schedule and programs itself. Energy Star certified.",
            price: 129.00,
            stock: 25,
            category: "Electronics > Smart Home > Thermostats",
            websiteUrl: "https://example.com/smart-thermostat",
            photos: ["https://picsum.photos/seed/thermostat/200/200"],
        };
    }
};

export const analyzeImageForProduct = async (imageBase64: string, mimeType: string): Promise<Partial<Product>> => {
    const ai = getGenAIClient();
    if (!ai) {
        console.warn("Gemini client not initialized for image analysis. Returning mock product.");
        return { name: "Product from Image (Mock)", description: "Details identified from image by mock AI.", price: 29.99, stock: 10 };
    }

    const prompt = `Analyze the provided image of a product.
Identify the product's name, provide a brief description, suggest a category, and estimate its price and stock level if possible from visual cues or common knowledge.
If specific details like barcode are visible, try to extract them.

Respond STRICTLY with a single JSON object:
{
  "name": "string (product name)",
  "description": "string (product description)",
  "category": "string (e.g., Electronics, Apparel, Groceries)",
  "price": number (estimated price, or 0 if unknown),
  "stock": number (estimated stock, or 0 if unknown),
  "barcode": "string (if visible, otherwise omit)"
}`;

    const contentParts = [
        { text: prompt },
        { inlineData: { mimeType, data: imageBase64 } }
    ];
    
    try {
        const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: { parts: contentParts }, config: { responseMimeType: "application/json" }});
        return parseGeminiJsonResponse(response.text) as Partial<Product>;
    } catch (error) {
        console.error("Error during AI image analysis for product:", error);
        throw new Error("AI product image analysis failed.");
    }
};

export const generateProjectSummaryAI = async (project: TaskProject): Promise<string> => {
    const ai = getGenAIClient();
    if (!ai) return "AI Summary not available. Please check API Key.";

    const itemsSummary = project.itemsNeeded?.map(i => `- ${i.name} (${i.type}, Status: ${i.status})`).join('\n') || "No items defined.";
    const milestonesSummary = project.milestones?.map(m => `- ${m.name} (Due: ${m.date}, Completed: ${m.completed ? 'Yes' : 'No'})`).join('\n') || "No milestones defined.";

    const prompt = `Generate a concise executive summary for the following project.
Focus on the project's goal, current status, key items, and upcoming milestones.
Mention any high-severity risks if present.
Keep the summary to 3-4 paragraphs.

Project Title: ${project.title}
Description: ${project.description}
Status: ${project.status}
Budget: $${project.budget || 'N/A'}, Spent: $${project.totalSpent || 0}
Start Date: ${project.startDate || 'N/A'}, End Date: ${project.endDate || 'N/A'}
Items/Sub-Tasks:
${itemsSummary}
Milestones:
${milestonesSummary}
Identified Risks: ${project.aiIdentifiedRisks?.filter(r => r.severity === 'high').map(r => r.description).join('; ') || 'None High Severity'}

Summary:
`;
    try {
        const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt });
        return response.text;
    } catch (error) {
        console.error("Error generating AI project summary:", error);
        return "Failed to generate AI summary for the project.";
    }
};

export const assessProjectRisksAI = async (project: TaskProject): Promise<{risks: ProjectRisk[], assessmentSummary: string}> => {
  const ai = getGenAIClient();
  if (!ai) return {risks: [], assessmentSummary: "AI Risk Assessment not available. API Key missing."};

  const itemsContext = project.itemsNeeded?.map(item => 
    `Item: ${item.name} (Type: ${item.type}, Est.Cost: $${item.estimatedCost || 0}, DependsOn: ${item.dependsOn?.join(',') || 'None'})`
  ).join('\n') || 'No specific items listed.';

  const prompt = `You are an AI project risk assessment tool for 'gotodo.ai'.
Project Title: "${project.title}"
Description: "${project.description}"
Overall Status: ${project.status}
Start Date: ${project.startDate || 'N/A'}, End Date: ${project.endDate || 'N/A'}
Budget: $${project.budget || 'Not Set'}, Total Spent: $${project.totalSpent || 0}
Items:
${itemsContext}

Based on the project details, identify potential risks (max 3-5). For each risk:
- Provide a concise 'description'.
- Assign a 'severity' (enum: "low", "medium", "high").
- Suggest a brief 'mitigationSuggestion' if obvious.
- Default 'status' to "open".
Also, provide a very brief overall 'assessmentSummary' (1-2 sentences) of the project's risk profile.

Respond STRICTLY with a single JSON object:
{
  "assessmentSummary": "string",
  "risks": [{ "id": "risk-UUID", "description": "string", "severity": "string", "mitigationSuggestion": "string", "status": "open" }, ...]
}
Generate unique UUIDs for risk IDs.
`;
  try {
    const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" }});
    const parsed = parseGeminiJsonResponse(response.text) as {risks: ProjectRisk[], assessmentSummary: string};
    // Ensure IDs are present if AI forgets
    parsed.risks = parsed.risks.map(r => ({...r, id: r.id || `risk-${Date.now()}-${Math.random().toString(16).slice(2)}`}));
    return parsed;
  } catch (error) {
    console.error("Error during AI risk assessment:", error);
    throw new Error("AI risk assessment failed.");
  }
};

export const identifyCriticalPathAI = async (project: TaskProject): Promise<AICriticalPathInfo> => {
  const ai = getGenAIClient();
  if (!ai) return { pathItemIds: [], analysisNotes: "AI Critical Path Analysis not available. API Key missing." };

  if (!project.itemsNeeded || project.itemsNeeded.length === 0) {
    return { pathItemIds: [], analysisNotes: "No items in the project to analyze for critical path." };
  }

  const itemsContext = project.itemsNeeded.map(item => 
    `Item ID: ${item.id}, Name: ${item.name}, Status: ${item.status}, Depends On: [${item.dependsOn?.join(', ') || ''}]`
  ).join("\n");

  const prompt = `You are an AI project scheduling assistant for 'gotodo.ai'.
Project Title: "${project.title}"
Project Items and their dependencies:
${itemsContext}

Identify the critical path for this project based on the item dependencies. The critical path is the sequence of items that determines the minimum project duration. An item is on the critical path if delaying it would delay the entire project.
Assume tasks take a standard duration if not specified. Focus on the sequence derived from dependencies.
List the IDs of the items on the critical path in their execution order ('pathItemIds').
Provide brief 'analysisNotes' explaining your reasoning (max 2 sentences).

Respond STRICTLY with a single JSON object:
{
  "pathItemIds": ["item-id-1", "item-id-2", ...],
  "analysisNotes": "string"
}`;
  try {
    const response = await ai.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" }});
    const parsed = parseGeminiJsonResponse(response.text) as AICriticalPathInfo;
    // Validate returned IDs against existing items
    const validItemIds = new Set(project.itemsNeeded.map(i => i.id));
    parsed.pathItemIds = parsed.pathItemIds.filter(id => validItemIds.has(id));
    return parsed;
  } catch (error) {
    console.error("Error during AI critical path analysis:", error);
    throw new Error("AI critical path analysis failed.");
  }
};


export const optimizeActiveTaskRouteAI = async ( activeTasks: RequestData[], currentProviderLocation?: GeoLocation ): Promise<{ orderedTaskIds: string[], notes: string }> => { console.warn("optimizeActiveTaskRouteAI not fully implemented - returning mock data"); return { orderedTaskIds: activeTasks.map(t => t.id), notes: "Mock AI optimization: Tasks kept in original order." }; };
export const optimizeDailyRouteAI = async ( stops: GeoLocation[], routeName: string ): Promise<{ optimizedStops: GeoLocation[], notes: string }> => { console.warn("optimizeDailyRouteAI not fully implemented - returning mock data"); return { optimizedStops: stops, notes: "Mock AI optimization: Stops kept in original order." }; };
export const generateChatResponseWithToolUsage = async ( currentConversation: ChatMessage[], user: User, currentMessageText: string ): Promise<ChatMessage> => { console.warn("generateChatResponseWithToolUsage not fully implemented - returning mock data"); const ai = getGenAIClient(); if (!ai) return { id: 'ai-err', requestId: currentConversation[0]?.requestId || 'unknown', senderId: 'ai-assistant', senderName: 'Gemma', text: 'AI Assistant is temporarily unavailable (Key Error).', timestamp: new Date().toISOString(), isAIMessage: true }; return { id: 'ai-mock', requestId: currentConversation[0]?.requestId || 'unknown', senderId: 'ai-assistant', senderName: 'Gemma', text: 'This is a mock AI response.', timestamp: new Date().toISOString(), isAIMessage: true }; };
