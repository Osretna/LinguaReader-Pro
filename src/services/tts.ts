export class TTSService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public static speak({
    text,
    lang = 'en-US',
    rate = 1.0,
    pitch = 1.0,
    onStart,
    onEnd,
    onError,
    onBoundary,
  }: {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
    onBoundary?: (charIndex: number) => void;
  }): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Pick best voice for language if available
    const voices = this.getVoices();
    const langPrefix = lang.split('-')[0].toLowerCase();
    const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) || voices[0];
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;
    if (onBoundary) {
      utterance.onboundary = (e) => {
        if (e.name === 'word' || e.name === 'sentence') {
          onBoundary(e.charIndex);
        }
      };
    }

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  public static resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  public static isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}
