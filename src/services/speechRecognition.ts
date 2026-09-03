// Web Speech API Voice Recognition Service for LinguaReader Pro

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export class SpeechRecognitionService {
  private static recognition: any = null;
  private static isListening: boolean = false;

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  private static getRecognitionInstance(): any {
    if (typeof window === 'undefined') return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    if (!this.recognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
    return this.recognition;
  }

  public static startListening({
    lang = 'en-US',
    onResult,
    onError,
    onStart,
    onEnd,
  }: {
    lang?: string;
    onResult: (state: SpeechRecognitionResultState) => void;
    onError?: (error: any) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }): boolean {
    const recognition = this.getRecognitionInstance();
    if (!recognition) {
      if (onError) onError(new Error('Speech recognition not supported'));
      return false;
    }

    try {
      if (this.isListening) {
        recognition.stop();
      }

      recognition.lang = lang;

      recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        let confidence = 0.9;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
            if (res[0].confidence) confidence = res[0].confidence;
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        const fullText = (finalTranscript || interimTranscript).trim();
        if (fullText) {
          onResult({
            transcript: fullText,
            isFinal: !!finalTranscript,
            confidence: confidence || 0.85,
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (onError) onError(event);
      };

      recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      recognition.start();
      return true;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      if (onError) onError(err);
      return false;
    }
  }

  public static stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
      this.isListening = false;
    }
  }

  public static getListeningState(): boolean {
    return this.isListening;
  }
}
