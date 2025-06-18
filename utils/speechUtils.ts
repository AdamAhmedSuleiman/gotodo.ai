// src/utils/speechUtils.ts

/**
 * Speaks the given text using the browser's SpeechSynthesis API.
 * Cancels any ongoing speech before starting new speech.
 * @param text The text to be spoken.
 * @param onEndCallback Optional callback when speech ends or is cancelled.
 */
export const speakText = (text: string, onEndCallback?: () => void): void => {
  if ('speechSynthesis' in window) {
    // Cancel any currently speaking utterances to prevent overlap
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      if (onEndCallback) onEndCallback(); // If something was speaking and we cancelled, call onEnd
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;

    if (onEndCallback) {
      utterance.onend = onEndCallback;
      utterance.onerror = (event) => { // Also call onEnd if there's an error
        console.error("SpeechSynthesisUtterance.onerror", event);
        onEndCallback();
      };
    }

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Browser does not support SpeechSynthesis.");
    if (onEndCallback) onEndCallback(); // Call onEnd if not supported
    // Optionally, provide a fallback or notify the user
    // alert("Sorry, your browser does not support text-to-speech.");
  }
};

/**
 * Cancels any ongoing speech.
 */
export const cancelSpeech = (): void => {
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
};