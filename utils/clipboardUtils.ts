// src/utils/clipboardUtils.ts

/**
 * Copies the given text to the clipboard.
 * @param text The text to copy.
 * @returns Promise that resolves if copy is successful, rejects otherwise.
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (!navigator.clipboard) {
    // Fallback for older browsers or insecure contexts if needed, though modern approach is preferred.
    // For this app, we'll assume navigator.clipboard is available.
    console.warn('Clipboard API not available.');
    throw new Error('Clipboard API not supported or context is insecure.');
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    throw new Error('Could not copy text to clipboard.');
  }
};