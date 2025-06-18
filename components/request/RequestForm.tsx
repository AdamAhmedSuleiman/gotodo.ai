// src/components/request/RequestForm.tsx
import React, { useState, useEffect } from 'react';
import Button from '../ui/Button.js'; 
import Input from '../ui/Input.js'; 
import Textarea from '../ui/Textarea.js'; 
import { RequestData, ServiceType, GeoLocation, AIAnalysisResult, RecipientDetails } from '../../types.js'; 
import { analyzeRequestWithGemini } from '../../services/geminiService.js'; 
import Icon from '../ui/Icon.js'; 
import { ICON_PATHS } from '../../constants.js'; 
import LoadingSpinner from '../ui/LoadingSpinner.js'; 
import { speakText, cancelSpeech } from '../../utils/speechUtils.js';
import { copyToClipboard } from '../../utils/clipboardUtils.js';
import { useToast } from '../../contexts/ToastContext.js';

interface RequestFormProps {
  onSubmit: (requestDetailsForAI: Pick<RequestData, 'textInput' | 'imageB64Data' | 'hasAudio' | 'hasVideo' | 'numUploadedMedia' | 'origin' | 'destination' | 'requestFor' | 'recipientDetails' | 'targetMapLocation'>, aiAnalysis: AIAnalysisResult) => void;
  origin?: GeoLocation | null;
  destination?: GeoLocation | null;
  requestFor: 'self' | 'someone_else';
  recipientDetails?: RecipientDetails;
  targetMapLocation?: GeoLocation | null;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]); 
    reader.onerror = error => reject(error);
  });
};

const RequestForm: React.FC<RequestFormProps> = ({ 
    onSubmit, 
    origin, 
    destination, 
    requestFor, 
    recipientDetails,
    targetMapLocation 
}) => {
  const [textInput, setTextInput] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false); 
  const [audioUrl, setAudioUrl] = useState<string | undefined>(); 
  const [isRecordingVideo, setIsRecordingVideo] = useState(false); 
  const [videoUrl, setVideoUrl] = useState<string | undefined>(); 
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [otherUploadedFiles, setOtherUploadedFiles] = useState<File[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    return () => {
      cancelSpeech();
      setIsSpeakingSummary(false);
    };
  }, [analysisResult]);

  const handleAudioRecord = () => {
    setIsRecordingAudio(!isRecordingAudio);
    if (!isRecordingAudio) { setTimeout(() => { setAudioUrl("simulated_audio_path.mp3"); setIsRecordingAudio(false);}, 2000); } 
    else { setAudioUrl(undefined); }
  };
  const handleVideoRecord = () => {
    setIsRecordingVideo(!isRecordingVideo);
    if (!isRecordingVideo) { setTimeout(() => { setVideoUrl("simulated_video_path.mp4"); setIsRecordingVideo(false);}, 3000); }
    else { setVideoUrl(undefined); }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 4 * 1024 * 1024) { 
        const msg = "Image file is too large (max 4MB).";
        setError(msg);
        addToast(msg, "error");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
      addToast(`Image "${file.name}" selected for upload.`, "info");
    }
  };
  
  const handleOtherFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setOtherUploadedFiles(filesArray);
      if (filesArray.length > 0) {
        addToast(`${filesArray.length} other file(s) selected for upload.`, "info");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    cancelSpeech(); 
    setIsSpeakingSummary(false);

    let imageB64Data: string | undefined = undefined;
    if (imageFile) {
      try {
        imageB64Data = await fileToBase64(imageFile);
      } catch (err) {
        console.error("Error converting image to Base64:", err);
        const msg = "Failed to process image.";
        setError(msg);
        addToast(msg, "error");
        setIsLoading(false);
        return;
      }
    }

    const requestDetailsForAI: Pick<RequestData, 'textInput' | 'imageB64Data' | 'hasAudio' | 'hasVideo' | 'numUploadedMedia' | 'origin' | 'destination' | 'requestFor' | 'recipientDetails' | 'targetMapLocation'> = {
      textInput, imageB64Data, hasAudio: !!audioUrl, hasVideo: !!videoUrl,
      numUploadedMedia: otherUploadedFiles.length, origin: origin || undefined,
      destination: destination || undefined, requestFor,
      recipientDetails: requestFor === 'someone_else' ? recipientDetails : undefined,
      targetMapLocation: targetMapLocation || undefined,
    };
    
    try {
      const aiAnalysis = await analyzeRequestWithGemini(requestDetailsForAI);
      setAnalysisResult(aiAnalysis);
      onSubmit(requestDetailsForAI, aiAnalysis); 
    } catch (err) {
      const msg = (err as Error).message || "Failed to analyze request. Please try again.";
      setError(msg);
      addToast(msg, "error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeakSummary = () => {
    if (isSpeakingSummary) {
      cancelSpeech();
      setIsSpeakingSummary(false);
    } else if (analysisResult?.summary) {
      speakText(analysisResult.summary, () => setIsSpeakingSummary(false));
      setIsSpeakingSummary(true);
    }
  };

  const handleCopySummary = async () => {
    if (analysisResult?.summary) {
      try {
        await copyToClipboard(analysisResult.summary);
        addToast("AI summary copied to clipboard!", "success");
      } catch (err) {
        addToast("Failed to copy summary.", "error");
      }
    }
  };
  
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const interval = setInterval(() => {
        if (!window.speechSynthesis.speaking && isSpeakingSummary) {
          setIsSpeakingSummary(false); 
        }
      }, 250);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [isSpeakingSummary]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        label="Describe your request" name="textInput" value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder="e.g., 'I need a plumber for a leaky faucet', 'Buy fresh apples', 'Ride to airport'"
        rows={3} wrapperClassName="mb-2"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="image-upload" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Image (Optional)</label>
          <Input 
            id="image-upload" name="image-upload" type="file" 
            accept="image/jpeg, image/png, image/webp, image/heic, image/heif"
            onChange={handleImageUpload} 
            className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-blue-300 dark:hover:file:bg-gray-500"
            wrapperClassName="mb-0"
          />
          {imagePreview && <img src={imagePreview} alt="Preview" className="mt-1 max-h-20 rounded border dark:border-gray-600"/>}
        </div>
        <div>
          <label htmlFor="other-file-upload" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Other Media (Optional)</label>
          <Input 
            id="other-file-upload" name="other-file-upload" type="file" multiple 
            onChange={handleOtherFileUpload} 
            className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-blue-300 dark:hover:file:bg-gray-500" 
            wrapperClassName="mb-0" 
          />
           {otherUploadedFiles.length > 0 && (
            <ul className="text-xs list-disc list-inside text-green-600 dark:text-green-400 mt-0.5">
                {otherUploadedFiles.map(f => <li key={f.name}>{f.name}</li>)}
            </ul>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button type="button" onClick={handleAudioRecord} variant={audioUrl ? "secondary" : "ghost"} leftIcon={<Icon path={ICON_PATHS.MICROPHONE} className="w-4 h-4"/>} className="w-full text-sm border dark:border-gray-600">
          {isRecordingAudio ? 'Recording...' : (audioUrl ? 'Audio Added' : 'Record Audio')}
        </Button>
        <Button type="button" onClick={handleVideoRecord} variant={videoUrl ? "secondary" : "ghost"} leftIcon={<Icon path={ICON_PATHS.CAMERA} className="w-4 h-4"/>} className="w-full text-sm border dark:border-gray-600">
          {isRecordingVideo ? 'Recording...' : (videoUrl ? 'Video Added' : 'Record Video')}
        </Button>
      </div>

      {audioUrl && <p className="text-xs text-green-600 dark:text-green-400">Simulated Audio: {audioUrl}</p>}
      {videoUrl && <p className="text-xs text-green-600 dark:text-green-400">Simulated Video: {videoUrl}</p>}
      
      {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 p-2 rounded-md">{error}</p>}

      <Button type="submit" isLoading={isLoading} disabled={!textInput && !audioUrl && !videoUrl && !imageFile && otherUploadedFiles.length === 0 && (!origin && !destination && !targetMapLocation)} className="w-full" size="md">
        Analyze with AI & Get Options
      </Button>

      {isLoading && !error && <div className="text-center py-2"><LoadingSpinner text="AI analyzing..." size="sm"/></div>}

      {analysisResult && !isLoading && (
        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 text-xs">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">AI Analysis:</h4>
            <div className="flex items-center space-x-1">
                {analysisResult.summary && (
                <Button
                    variant="ghost" size="sm" onClick={toggleSpeakSummary}
                    aria-label={isSpeakingSummary ? "Stop speaking summary" : "Speak summary"}
                    className="p-1"
                >
                    <Icon path={isSpeakingSummary ? ICON_PATHS.SPEAKER_X_MARK : ICON_PATHS.SPEAKER_WAVE} className="w-4 h-4" />
                </Button>
                )}
                {analysisResult.summary && (
                <Button
                    variant="ghost" size="sm" onClick={handleCopySummary}
                    aria-label="Copy summary to clipboard"
                    className="p-1"
                >
                    <Icon path={ICON_PATHS.CLIPBOARD_ICON} className="w-4 h-4" />
                </Button>
                )}
            </div>
          </div>
          <p><strong>Type:</strong> <span className="font-medium text-blue-600 dark:text-blue-400">{analysisResult.type}</span></p>
          <p><strong>Summary:</strong> {analysisResult.summary}</p>
          <p><strong>Entities:</strong> <code className="text-xs bg-gray-200 dark:bg-gray-600 p-0.5 rounded">{JSON.stringify(analysisResult.entities)}</code></p>
          {analysisResult.priceSuggestion !== undefined && <p><strong>AI Price:</strong> ${analysisResult.priceSuggestion.toFixed(2)}</p>}
        </div>
      )}
    </form>
  );
};

export default RequestForm;