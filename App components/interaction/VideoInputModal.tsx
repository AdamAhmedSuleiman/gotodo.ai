
// src/components/interaction/VideoInputModal.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Modal from '../ui/Modal.js'; 
import Button from '../ui/Button.js'; 
import Icon from '../ui/Icon.js'; 
import { ICON_PATHS } from '../../src/constants.js'; 
import { VideoInputModalProps } from '../../src/types.js'; 
import { getSuggestionsFromVideo } from '../../src/services/geminiService.js'; 
import LoadingSpinner from '../ui/LoadingSpinner.js'; 
import Textarea from '../ui/Textarea.js'; 
import { speakText, cancelSpeech } from '../../src/utils/speechUtils.js'; 

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]); 
      } else {
        reject(new Error("Failed to read blob as Base64."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


const VideoInputModal: React.FC<VideoInputModalProps> = ({ isOpen, onClose, onSuggestionReceived }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("Click the camera to start live video session.");
  const [userQuery, setUserQuery] = useState<string>("");
  const [currentSuggestion, setCurrentSuggestion] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
    ? 'video/webm;codecs=vp9,opus' 
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') 
    ? 'video/webm;codecs=vp8,opus' 
    : 'video/webm';


  const startRecording = useCallback(async () => {
    setError(null);
    setVideoBlob(null);
    setVideoUrl(null);
    setCurrentSuggestion(null);
    cancelSpeech();
    setFeedbackMessage("Starting video stream...");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = streamRef.current;
        videoPreviewRef.current.play().catch(e => console.warn("Video preview play error:", e));
      }
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType });
      videoChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const completeVideoBlob = new Blob(videoChunksRef.current, { type: mimeType });
        setVideoBlob(completeVideoBlob);
        setVideoUrl(URL.createObjectURL(completeVideoBlob));
        setIsRecording(false);
        setFeedbackMessage("Recording finished. Add a query if needed, then click 'Get AI Suggestions'.");
        // Stream tracks are stopped in handleCloseModal or when starting new recording
      };

      mediaRecorderRef.current.start(1000); // Capture in chunks for potential live streaming in future
      setIsRecording(true);
      setFeedbackMessage("Live video session started. Speak or show what you need assistance with.");
    } catch (err) {
      console.error("Error accessing camera/microphone:", err);
      setError("Could not access camera/microphone. Please check permissions and try again.");
      setFeedbackMessage("Error: Could not access camera/microphone.");
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [mimeType]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
    }
    setIsRecording(false); 
  }, [isRecording]);

  const handleGetSuggestions = async () => {
    if (!videoBlob) {
      setError("No video recorded to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentSuggestion(null);
    cancelSpeech();
    setFeedbackMessage("AI is analyzing your video...");

    try {
      const videoB64 = await blobToBase64(videoBlob);
      const videoFileName = `video_request_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`;
      
      const suggestionResult = await getSuggestionsFromVideo(videoB64, videoBlob.type, userQuery);
      setCurrentSuggestion(suggestionResult.textResponse);
      setFeedbackMessage("AI suggestion received.");
      // Do not call onSuggestionReceived here yet, wait for "Use Suggestion & Create Task"
    } catch (err) {
      console.error("Error analyzing video:", err);
      setError((err as Error).message || "Failed to analyze video. Please try again.");
      setFeedbackMessage("Error: AI analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseSuggestion = () => {
    if (currentSuggestion) {
      onSuggestionReceived(currentSuggestion, videoBlob ? `video_from_suggestion_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}` : undefined);
      handleCloseModal(false); // Close without full reset if suggestion is used
    }
  };
  
  const handleCloseModal = (performFullReset = true) => {
    if (isRecording) {
        stopRecording();
    }
    if (performFullReset) {
        setError(null);
        setVideoBlob(null);
        setVideoUrl(null);
        setUserQuery("");
        setCurrentSuggestion(null);
        setFeedbackMessage("Click the camera to start live video session.");
    }
    cancelSpeech();
    setIsSpeaking(false);
    setIsLoading(false);
    onClose();
  }

  const toggleSpeakSuggestion = () => {
    if (isSpeaking) {
      cancelSpeech();
      setIsSpeaking(false);
    } else if (currentSuggestion) {
      speakText(currentSuggestion, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    // Ensure stream is stopped if modal is closed while recording
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      cancelSpeech();
    };
  }, []);


  return (
    <Modal 
        isOpen={isOpen} 
        onClose={() => handleCloseModal()} 
        title="Live AI Video Session"
        size="xl"
        footer={
            <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={() => handleCloseModal()} disabled={isLoading}>Cancel</Button>
                {currentSuggestion && !isLoading && (
                   <Button 
                        onClick={handleUseSuggestion}
                        variant="primary"
                    >
                        Use Suggestion & Create Task
                    </Button>
                )}
                {!currentSuggestion && (
                     <Button 
                        onClick={handleGetSuggestions} 
                        disabled={!videoBlob || isLoading || isRecording}
                        isLoading={isLoading && !isRecording}
                        variant="primary"
                    >
                        Get AI Suggestions
                    </Button>
                )}
            </div>
        }
    >
      <div className="p-2 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading && !isRecording} // Disable if loading suggestions but allow stopping recording
            className={`p-3 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 animate-pulse' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'}
                mx-auto sm:mx-0 flex items-center justify-center w-16 h-16 mb-2 sm:mb-0 disabled:opacity-50`}
            aria-label={isRecording ? "Stop video session" : "Start video session"}
            >
            <Icon path={isRecording ? ICON_PATHS.STOP_CIRCLE : ICON_PATHS.VIDEO_CAMERA} className="w-8 h-8" />
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-300 flex-grow text-center sm:text-left min-h-[20px]">{feedbackMessage}</p>
        </div>

        <div className="bg-gray-900 rounded-md overflow-hidden aspect-video max-h-[300px] mx-auto w-full max-w-md">
            <video ref={videoPreviewRef} muted playsInline className="w-full h-full object-cover" />
        </div>

        {videoUrl && !isRecording && !isLoading && (
          <div className="my-2 text-center">
            <video controls src={videoUrl} className="w-full max-w-md mx-auto rounded-md border dark:border-gray-700" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Playback your recording (approx. {videoBlob ? (videoBlob.size / (1024*1024)).toFixed(1) : 'N/A'} MB)</p>
          </div>
        )}

        <Textarea
            label="Optional: Add a question or context for the AI"
            name="userQuery"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            rows={2}
            placeholder="e.g., What's wrong with this? or Can you help me identify this?"
            disabled={isLoading || isRecording}
        />

        {isLoading && <div className="my-3 text-center"><LoadingSpinner text="AI Processing Video..." /></div>}
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{error}</p>}

        {currentSuggestion && !isLoading && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-800 rounded-md border border-green-200 dark:border-green-700">
                <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-green-700 dark:text-green-300">AI Suggestion:</h4>
                    <Button variant="ghost" size="sm" onClick={toggleSpeakSuggestion} aria-label={isSpeaking ? "Stop speaking" : "Speak suggestion"} className="p-1">
                        <Icon path={isSpeaking ? ICON_PATHS.SPEAKER_X_MARK : ICON_PATHS.SPEAKER_WAVE} className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{currentSuggestion}</p>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default VideoInputModal;