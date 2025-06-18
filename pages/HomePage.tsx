
// src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { UserRole, AIAnalysisResult, RequestData, ServiceType, GroundingChunk } from '../src/types.js'; 
import LoadingSpinner from '../App components/ui/LoadingSpinner.js'; 
import Button from '../App components/ui/Button.js'; 
import Icon from '../App components/ui/Icon.js'; 
import { ICON_PATHS, APP_NAME } from '../src/constants.js'; 
import AudioInputModal from '../App components/interaction/AudioInputModal.js';
import VideoInputModal from '../App components/interaction/VideoInputModal.js';
import Textarea from '../App components/ui/Textarea.js'; 
import { fetchGroundedResponse, analyzeRequestWithGemini } from '../services/geminiService.js'; 
import { useToast } from '../contexts/ToastContext.js';
import { speakText, cancelSpeech } from '../utils/speechUtils.js';
import { copyToClipboard } from '../utils/clipboardUtils.js';

const HomePage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [lastVideoSuggestion, setLastVideoSuggestion] = useState<string | null>(null);
  const [isAnalyzingSuggestion, setIsAnalyzingSuggestion] = useState(false);

  const [groundedQuery, setGroundedQuery] = useState("");
  const [groundedResponse, setGroundedResponse] = useState<string | null>(null);
  const [groundedSources, setGroundedSources] = useState<GroundingChunk[]>([]);
  const [isGroundedLoading, setIsGroundedLoading] = useState(false);
  const [groundedError, setGroundedError] = useState<string | null>(null);
  const [isSpeakingGroundedResponse, setIsSpeakingGroundedResponse] = useState(false);

  useEffect(() => {
    // Cleanup speech on component unmount
    return () => { 
      cancelSpeech();
    };
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900"><LoadingSpinner text="Loading your experience..." /></div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect provider to their portal
  if (user.role === UserRole.PROVIDER) {
    return <Navigate to="/provider-portal" replace />;
  }
  
  const handleAudioAnalysisComplete = (analysis: AIAnalysisResult, audioFileName?: string) => {
    setIsAudioModalOpen(false);
    const requestFromAudio: Partial<RequestData> = {
        type: analysis.type,
        aiAnalysisSummary: analysis.summary,
        aiExtractedEntities: analysis.entities,
        suggestedPrice: analysis.priceSuggestion,
        audioInputUrl: audioFileName ? `simulated_audio_path/${audioFileName}`: undefined,
        textInput: `Audio request: ${analysis.summary}`, 
        requestFor: 'self', // Default, can be changed in RequesterPortal if needed
    };
    addToast("AI analysis from audio complete. Navigating to request portal...", "success");
    navigate('/requester-portal', { state: { newRequestFromInteraction: requestFromAudio, aiAnalysis: analysis } });
  };

  const handleVideoSuggestionReceived = (suggestion: string, videoFileName?: string) => {
    setIsVideoModalOpen(false);
    setLastVideoSuggestion(suggestion);
    setInteractionError(null);
    addToast("AI suggestion from video received.", "info");
  };

  const handleCreateTaskFromVideoSuggestion = async () => {
    if (!lastVideoSuggestion) return;
    setIsAnalyzingSuggestion(true);
    setInteractionError(null);
    try {
      const analysisResult = await analyzeRequestWithGemini({
        textInput: lastVideoSuggestion,
        imageB64Data: undefined,    
        hasAudio: true,             
        hasVideo: true,             
        numUploadedMedia: undefined,
        origin: undefined,          
        destination: undefined,
        requestFor: 'self',         
        recipientDetails: undefined,
        targetMapLocation: undefined,
      });
      
      const requestFromVideoSuggestion: Partial<RequestData> = {
        type: analysisResult.type,
        aiAnalysisSummary: analysisResult.summary,
        aiExtractedEntities: analysisResult.entities,
        suggestedPrice: analysisResult.priceSuggestion,
        textInput: `Task from video session: ${analysisResult.summary}`,
        requestFor: 'self',
        hasVideo: true,
      };
      addToast("AI processed the suggestion. Let's find providers!", "success");
      navigate('/requester-portal', { state: { newRequestFromInteraction: requestFromVideoSuggestion, aiAnalysis: analysisResult } });

    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to analyze suggestion for task creation.";
      setInteractionError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setIsAnalyzingSuggestion(false);
    }
  };
  
  const openAudioModal = () => {
    setInteractionError(null);
    setLastVideoSuggestion(null);
    cancelSpeech(); // Stop any ongoing speech before opening modal
    setIsAudioModalOpen(true);
  }
  const openVideoModal = () => {
    setInteractionError(null);
    setLastVideoSuggestion(null);
    cancelSpeech(); // Stop any ongoing speech
    setIsVideoModalOpen(true);
  }

  const handleGroundedQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundedQuery.trim()) return;

    setIsGroundedLoading(true);
    setGroundedError(null);
    setGroundedResponse(null);
    setGroundedSources([]);
    cancelSpeech(); // Stop any ongoing speech
    setIsSpeakingGroundedResponse(false);

    try {
      const result = await fetchGroundedResponse(groundedQuery);
      setGroundedResponse(result.text);
      setGroundedSources(result.sources);
      addToast("AI response received.", "success");
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to fetch AI response.";
      setGroundedError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setIsGroundedLoading(false);
    }
  };

  const toggleSpeakGroundedResponse = () => {
    if (isSpeakingGroundedResponse) {
      cancelSpeech();
      setIsSpeakingGroundedResponse(false);
    } else if (groundedResponse) {
      speakText(groundedResponse, () => setIsSpeakingGroundedResponse(false)); 
      setIsSpeakingGroundedResponse(true);
    }
  };

  const handleCopyGroundedResponse = async () => {
    if (groundedResponse) {
      try {
        await copyToClipboard(groundedResponse);
        addToast("AI response copied to clipboard!", "success");
      } catch (err) {
        addToast("Failed to copy AI response.", "error");
      }
    }
  };
  
  return (
    <div className="container mx-auto p-6 sm:p-8 text-center bg-gray-100 dark:bg-gray-900 min-h-[calc(100vh-128px)] flex flex-col justify-center transition-colors duration-300">
      <Icon path={ICON_PATHS.SPARKLES} className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">
        Welcome back to {APP_NAME}, {user.name}!
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
        How can our AI assist you today? (Role: {user.role})
      </p>
      
      {(user.role === UserRole.REQUESTER || user.role === UserRole.ADMIN) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Button 
            type="button" 
            onClick={openAudioModal}
            className="py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg transform hover:scale-105 transition-transform"
            aria-label="Speak to AI to make a request"
          >
            <Icon path={ICON_PATHS.MICROPHONE} className="w-8 h-8 mr-3" />
            Speak your Request
          </Button>
          <Button 
            type="button" 
            onClick={openVideoModal}
            className="py-6 text-lg bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-600 dark:hover:bg-teal-700 shadow-lg transform hover:scale-105 transition-transform"
            aria-label="Start Live AI Video session for suggestions"
          >
            <Icon path={ICON_PATHS.VIDEO_CAMERA} className="w-8 h-8 mr-3" />
            Live AI Video Session
          </Button>
        </div>
      )}

      {interactionError && (
        <p className="mt-6 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-3 rounded-md max-w-md mx-auto">{interactionError}</p>
      )}
      {lastVideoSuggestion && (
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-700 rounded-lg max-w-lg mx-auto text-left">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">AI Video Session Suggestion:</h3>
            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{lastVideoSuggestion}</p>
            <Button
                onClick={handleCreateTaskFromVideoSuggestion}
                isLoading={isAnalyzingSuggestion}
                variant="primary"
                size="sm"
                className="mt-3 w-full sm:w-auto"
                leftIcon={<Icon path={ICON_PATHS.PLUS_CIRCLE} className="w-4 h-4" />}
            >
                Create Task from Suggestion
            </Button>
        </div>
      )}
       {isAnalyzingSuggestion && (
         <div className="mt-4">
            <LoadingSpinner text="Analyzing suggestion for task creation..." />
         </div>
        )}

      {(user.role === UserRole.REQUESTER || user.role === UserRole.ADMIN) && (
        <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 max-w-xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center justify-center">
            <Icon path={ICON_PATHS.QUESTION_MARK_CIRCLE} className="w-8 h-8 mr-2 text-indigo-600 dark:text-indigo-400" />
            Ask {APP_NAME} Anything
          </h2>
          <form onSubmit={handleGroundedQuerySubmit} className="space-y-4">
            <Textarea
              name="groundedQuery"
              label="Have a question? Get AI-powered answers with web sources."
              placeholder="e.g., What are common permits needed for home renovation in California?"
              value={groundedQuery}
              onChange={(e) => setGroundedQuery(e.target.value)}
              rows={3}
              required
            />
            <Button type="submit" isLoading={isGroundedLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
              Get AI Answer
            </Button>
          </form>
          {isGroundedLoading && <div className="mt-4"><LoadingSpinner text="Searching for answers..." /></div>}
          {groundedError && <p className="mt-4 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-3 rounded-md">{groundedError}</p>}
          {groundedResponse && (
            <div className="mt-6 p-4 bg-gray-200 dark:bg-gray-800 rounded-lg text-left shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">AI Response:</h3>
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={toggleSpeakGroundedResponse} aria-label={isSpeakingGroundedResponse ? "Stop speaking" : "Speak response"} className="p-1" disabled={isGroundedLoading}>
                    <Icon path={isSpeakingGroundedResponse ? ICON_PATHS.SPEAKER_X_MARK : ICON_PATHS.SPEAKER_WAVE} className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopyGroundedResponse} aria-label="Copy AI response to clipboard" className="p-1">
                        <Icon path={ICON_PATHS.CLIPBOARD_ICON} className="w-5 h-5" />
                    </Button>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{groundedResponse}</p>
              {groundedSources.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-gray-700 dark:text-gray-200">Sources:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                    {groundedSources.map((source, index) => (
                      <li key={index}>
                        <a 
                            href={source.web?.uri || source.retrievedContext?.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                        >
                          {source.web?.title || source.retrievedContext?.title || "Source"}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <div className="mt-12">
        <p className="text-gray-500 dark:text-gray-400">Or, you can proceed to your main portal:</p>
        <Button
            type="button"
            onClick={() => navigate(user.role === UserRole.REQUESTER ? "/requester-portal" : (user.role === UserRole.ADMIN ? "/admin-portal" : "/provider-portal") )}
            variant="ghost"
            className="mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
            Go to {user.role === UserRole.REQUESTER ? "Requester Dashboard" : (user.role === UserRole.ADMIN ? "Admin Dashboard" : "Provider Dashboard")}
            <Icon path={ICON_PATHS.ARROW_RIGHT_ON_RECTANGLE} className="w-5 h-5 ml-2" />
        </Button>
      </div>

      <AudioInputModal 
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onAnalysisComplete={handleAudioAnalysisComplete}
      />
      <VideoInputModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSuggestionReceived={handleVideoSuggestionReceived}
      />
    </div>
  );
};

export default HomePage;