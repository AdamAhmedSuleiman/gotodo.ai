// src/components/interaction/AudioInputModal.tsx
import React, { useState, useRef, useCallback } from 'react';
import Modal from '../ui/Modal.js'; 
import Button from '../ui/Button.js'; 
import Icon from '../ui/Icon.js'; 
import { ICON_PATHS } from '../../constants.js'; 
import { AudioInputModalProps, AIAnalysisResult } from '../../types.js'; 
import { analyzeAudioForServiceRequest } from '../../services/geminiService.js'; 
import LoadingSpinner from '../ui/LoadingSpinner.js'; 

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve((reader.result as string).split(',')[1]); // Get only Base64 part
      } else {
        reject(new Error("Failed to read blob as Base64."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const AudioInputModal: React.FC<AudioInputModalProps> = ({ isOpen, onClose, onAnalysisComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("Click the microphone to start recording your request.");

  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/ogg;codecs=opus';


  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setFeedbackMessage("Requesting microphone access...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setFeedbackMessage("Recording...");
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const completeAudioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(completeAudioBlob);
        setIsRecording(false);
        setFeedbackMessage("Recording finished. Click 'Analyze Audio' to proceed.");
        // Stop microphone tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      let userFriendlyError = "Could not access microphone. Please check permissions and try again.";
      if ((err as Error).name === "NotAllowedError") {
        userFriendlyError = "Microphone access denied. Please enable it in your browser settings for this site.";
      } else if ((err as Error).name === "NotFoundError") {
        userFriendlyError = "No microphone found. Please ensure a microphone is connected and enabled.";
      }
      setError(userFriendlyError);
      setFeedbackMessage(`Error: ${userFriendlyError}`);
      setIsRecording(false);
    }
  }, [mimeType]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stream tracks are stopped in onstop handler
    }
  }, [isRecording]);

  const handleAnalyze = async () => {
    if (!audioBlob) {
      setError("No audio recorded to analyze.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setFeedbackMessage("AI is analyzing your voice...");

    try {
      const audioB64 = await blobToBase64(audioBlob);
      const audioFileName = `audio_request_${Date.now()}.${mimeType.split('/')[1].split(';')[0]}`;
      
      const analysisResult = await analyzeAudioForServiceRequest(audioB64, audioBlob.type);
      onAnalysisComplete(analysisResult, audioFileName);
      // onClose(); // Modal will be closed by HomePage after navigation or further action
    } catch (err) {
      console.error("Error analyzing audio:", err);
      setError((err as Error).message || "Failed to analyze audio. Please try again.");
      setFeedbackMessage("Error: AI analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    if (isRecording) {
        stopRecording();
    }
    setError(null);
    setAudioBlob(null);
    setIsLoading(false);
    setFeedbackMessage("Click the microphone to start recording your request.");
    onClose();
  }

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        title="Speak Your Request"
        size="md"
        footer={
            <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={handleCloseModal} disabled={isLoading}>Cancel</Button>
                <Button 
                    onClick={handleAnalyze} 
                    disabled={!audioBlob || isLoading || isRecording}
                    isLoading={isLoading && !isRecording}
                >
                    Analyze Audio
                </Button>
            </div>
        }
    >
      <div className="text-center p-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={`p-4 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
            ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400 animate-pulse' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400'}
            mx-auto flex items-center justify-center w-20 h-20 mb-4 disabled:opacity-50`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          <Icon path={isRecording ? ICON_PATHS.STOP_CIRCLE : ICON_PATHS.MICROPHONE} className="w-10 h-10" />
        </button>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 min-h-[40px]">{feedbackMessage}</p>

        {audioBlob && !isRecording && !isLoading && (
          <div className="my-3">
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
            <p className="text-xs text-gray-500 mt-1">Playback your recording (approx. {(audioBlob.size / 1024).toFixed(1)} KB)</p>
          </div>
        )}

        {isLoading && <div className="my-4"><LoadingSpinner text="AI Processing..." /></div>}
        {error && <p className="mt-3 text-sm text-red-600 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{error}</p>}
      </div>
    </Modal>
  );
};

export default AudioInputModal;