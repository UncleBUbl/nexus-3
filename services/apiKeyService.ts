
export const apiKeyService = {
  /**
   * Checks if an API key is currently available/selected.
   * Checks the AI Studio environment first, then falls back to process.env for local dev.
   */
  hasApiKey: async (): Promise<boolean> => {
    // Cast to any to avoid TypeScript conflict with global Window definition of aistudio
    const win = window as any;
    if (win.aistudio) {
      return await win.aistudio.hasSelectedApiKey();
    }
    // Fallback for local development, checking both standard and requested key names
    return !!(process.env.API_KEY || process.env.GEMINI_API_KEY);
  },

  /**
   * Opens the secure dialog for the user to select an API key.
   */
  requestApiKey: async (): Promise<void> => {
    const win = window as any;
    if (win.aistudio) {
      await win.aistudio.openSelectKey();
    } else {
      console.warn("AI Studio environment not detected. Ensure API_KEY or GEMINI_API_KEY is set in .env");
    }
  }
};
