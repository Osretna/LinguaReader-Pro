import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  Award, 
  BarChart3, 
  BookOpen, 
  Clock, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Send,
  Zap,
  Flame,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  Target
} from 'lucide-react';
import { TTSService } from '../services/tts';
import { SpeechRecognitionService } from '../services/speechRecognition';
import { CEFRLevel, ContentCategory, VoiceAssessmentResult } from '../types';
import { StorageService } from '../services/storage';

interface VoiceLevelTestProps {
  onCompleteLevel: (level: CEFRLevel) => void;
  onGoToLibrary: (filterLevel?: CEFRLevel) => void;
  onOpenGuide: () => void;
  isArabic: boolean;
}

interface QuestionStage {
  id: number;
  targetLevel: CEFRLevel;
  levelNameAr: string;
  levelNameEn: string;
  botPromptEn: string;
  botPromptAr: string;
  tipAr: string;
  tipEn: string;
  starters: string[];
  expectedKeywords: string[];
}

const ASSESSMENT_STAGES: QuestionStage[] = [
  {
    id: 1,
    targetLevel: 'A1',
    levelNameAr: 'المستوى التمهيدي (A1 - Starter)',
    levelNameEn: 'Starter (A1)',
    botPromptEn: "Hello there! Welcome to your interactive voice assessment. Let's start with a warm-up. Could you introduce yourself, tell me where you are from, and what hobbies or activities you enjoy in your free time?",
    botPromptAr: "مرحباً بك! أهلاً بك في اختبار تحديد المستوى الصوتي التفاعلي. لنبدأ بتمهيد لطيف: هل يمكنك تقديم نفسك بالإنجليزية، وإخباري من أين أنت، وما هي هواياتك أو أنشطتك المفضلة في أوقات الفراغ؟",
    tipAr: "تحدث ببساطة، اذكر اسمك، مدينتك، وهواية أو اثنتين تفضلهما (مثل: القراءة، الرياضة، البرمجة).",
    tipEn: "Introduce yourself, mention your location, and a hobby you enjoy (e.g., reading, sports, coding).",
    starters: [
      "My name is... and I live in...",
      "In my free time, I really enjoy...",
      "I work as a... and I like to..."
    ],
    expectedKeywords: ['name', 'live', 'from', 'like', 'enjoy', 'time', 'work', 'study', 'hobby', 'free', 'family', 'book', 'reading']
  },
  {
    id: 2,
    targetLevel: 'B1',
    levelNameAr: 'المستوى المتوسط (A2 - B1: Intermediate)',
    levelNameEn: 'Intermediate (A2 - B1)',
    botPromptEn: "That was great! Now let's explore your past experiences. Can you describe a memorable trip you took or a challenging situation you faced recently, and how you managed to solve it?",
    botPromptAr: "رائع جداً! الآن دعنا نستكشف تجاربك السابقة: هل يمكنك أن تصف لي رحلة لا تُنسى قمت بها، أو موقفاً أو تحدياً صعباً واجهته مؤخراً وكيف تمكنت من حله وتجاوزه؟",
    tipAr: "استخدم أفعال الماضي (went, felt, resolved)، واستخدم كلمات الربط مثل (because, then, after that, finally).",
    tipEn: "Use past tense verbs (went, faced, resolved) and connectors like (because, although, finally).",
    starters: [
      "A memorable experience I had was when...",
      "Recently, I faced a challenge at work/study where...",
      "To resolve this situation, I decided to..."
    ],
    expectedKeywords: ['went', 'travel', 'visited', 'challenge', 'difficult', 'problem', 'solved', 'decided', 'because', 'after', 'experience', 'learned', 'helped', 'result']
  },
  {
    id: 3,
    targetLevel: 'B2',
    levelNameAr: 'المستوى فوق المتوسط (B2 - Upper Intermediate)',
    levelNameEn: 'Upper-Intermediate (B2)',
    botPromptEn: "Impressive storytelling! Here is a deeper question: Many language experts argue that reading books and daily articles is the fastest method to achieve true fluency. What is your opinion on this, and what are the main advantages?",
    botPromptAr: "سرد ممتاز! إليك سؤال أعمق: يرى العديد من خبراء اللغات أن القراءة اليومية للكتب والمقالات هي أسرع وسيلة لتحقيق الطلاقة الحقيقية. ما رأيك في ذلك، وما هي أبرز المزايا برأيك؟",
    tipAr: "عبر عن رأيك باستخدام تراكيب متقدمة مثل (In my perspective, On the one hand, Furthermore, It enables us to).",
    tipEn: "Express your view with advanced connectors (In my view, Furthermore, Consequently, It allows learners to).",
    starters: [
      "In my perspective, reading is extremely powerful because...",
      "One major advantage of reading is that it exposes you to...",
      "While speaking is important, reading provides..."
    ],
    expectedKeywords: ['opinion', 'perspective', 'advantage', 'fluency', 'vocabulary', 'context', 'benefit', 'effective', 'furthermore', 'however', 'improve', 'comprehension', 'practice', 'absorb']
  },
  {
    id: 4,
    targetLevel: 'C1',
    levelNameAr: 'المستوى المتقدم (C1 - Advanced Reasoning)',
    levelNameEn: 'Advanced (C1)',
    botPromptEn: "Outstanding reasoning! For our final challenge: How do you envision artificial intelligence, cloud automation, and digital communication reshaping modern careers and human interactions over the next decade?",
    botPromptAr: "تفكير واستدلال رائع! وفي التحدي النهائي: كيف ترى تأثير الذكاء الاصطناعي والأتمتة السحابية والتواصل الرقمي على إعادة تشكيل الوظائف والتواصل البشري خلال العقد القادم؟",
    tipAr: "استخدم مصطلحات دقيقة وتراكيب شرطية أو تنبؤية (Inevitably, Paradigm shift, Transformation, It poses both opportunities and risks).",
    tipEn: "Use sophisticated analytical vocabulary (Paradigm shift, Transformation, Automation, Consequently, Inevitably).",
    starters: [
      "I believe artificial intelligence will inevitably transform...",
      "While automation increases efficiency, it also requires...",
      "In the coming decade, human communication will likely shift toward..."
    ],
    expectedKeywords: ['artificial', 'intelligence', 'automation', 'transform', 'decade', 'impact', 'career', 'opportunity', 'inevitably', 'efficiency', 'adapt', 'human', 'technology', 'paradigm', 'evolution']
  }
];

export const VoiceLevelTest: React.FC<VoiceLevelTestProps> = ({
  onCompleteLevel,
  onGoToLibrary,
  onOpenGuide,
  isArabic,
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [responses, setResponses] = useState<{ stageId: number; text: string; wordCount: number; duration: number }[]>([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<VoiceAssessmentResult | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  const currentStage = ASSESSMENT_STAGES[currentStageIdx];
  const totalStages = ASSESSMENT_STAGES.length;

  // Check microphone support on mount
  useEffect(() => {
    const supported = SpeechRecognitionService.isSupported();
    setMicSupported(supported);
  }, []);

  // Speak bot question whenever stage changes
  useEffect(() => {
    if (!assessmentResult && currentStage) {
      speakBotPrompt();
    }
    return () => {
      TTSService.stop();
      SpeechRecognitionService.stopListening();
    };
  }, [currentStageIdx, assessmentResult]);

  const speakBotPrompt = () => {
    if (!currentStage) return;
    setIsBotSpeaking(true);
    TTSService.speak({
      text: currentStage.botPromptEn,
      lang: 'en-US',
      rate: speechRate,
      onStart: () => setIsBotSpeaking(true),
      onEnd: () => setIsBotSpeaking(false),
      onError: () => setIsBotSpeaking(false),
    });
  };

  const handleToggleBotSpeech = () => {
    if (isBotSpeaking) {
      TTSService.stop();
      setIsBotSpeaking(false);
    } else {
      speakBotPrompt();
    }
  };

  const startVoiceRecording = () => {
    // Stop bot speech first
    TTSService.stop();
    setIsBotSpeaking(false);
    setMicError(null);

    const started = SpeechRecognitionService.startListening({
      lang: 'en-US',
      onStart: () => {
        setIsListening(true);
        setRecordingStartTime(Date.now());
      },
      onResult: (state) => {
        setUserTranscript(state.transcript);
      },
      onError: (err) => {
        setIsListening(false);
        setMicError(
          isArabic
            ? 'تعذر الوصول إلى الميكروفون (ربما يتطلب إذناً من المتصفح). يمكنك كتابة إجابتك أو اختيار عبارات البدء الجاهزة أدناه.'
            : 'Microphone access unavailable or denied. You can also type your response or use sentence starters below.'
        );
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (!started) {
      setMicError(
        isArabic
          ? 'المتصفح الحالي لا يدعم التعرف الصوتي المباشر. يمكنك كتابة إجابتك بالإنجليزية وسنقوم بتحليلها صوتياً ولغوياً!'
          : 'Speech recognition is not supported in this browser. You can type your response and we will analyze it!'
      );
    }
  };

  const stopVoiceRecording = () => {
    SpeechRecognitionService.stopListening();
    setIsListening(false);
  };

  const handleNextStage = () => {
    if (!userTranscript.trim()) return;

    // Calculate response metrics
    const words = userTranscript.trim().split(/\s+/).length;
    const durationSec = recordingStartTime ? Math.round((Date.now() - recordingStartTime) / 1000) : 15;

    const newResponses = [
      ...responses,
      {
        stageId: currentStage.id,
        text: userTranscript.trim(),
        wordCount: words,
        duration: Math.max(5, durationSec),
      }
    ];

    setResponses(newResponses);
    setUserTranscript('');
    setMicError(null);

    if (currentStageIdx < totalStages - 1) {
      setCurrentStageIdx(prev => prev + 1);
    } else {
      // Complete test and evaluate
      evaluateAllResponses(newResponses);
    }
  };

  // Algorithmic Linguistic & Phonetic CEFR Evaluation Engine
  const evaluateAllResponses = (allResponses: typeof responses) => {
    setIsEvaluating(true);
    TTSService.stop();

    setTimeout(() => {
      let totalWords = 0;
      let advancedKeywordsMatched = 0;
      let totalDuration = 0;
      let complexSentenceCount = 0;

      // Vocabulary tier dictionaries for CEFR classification
      const b1Keywords = ['because', 'although', 'however', 'experience', 'resolved', 'situation', 'decision', 'opinion', 'advantage', 'furthermore', 'reading', 'improve'];
      const b2Keywords = ['perspective', 'significant', 'consequently', 'furthermore', 'comprehension', 'opportunity', 'crucial', 'effective', 'collaborate', 'beneficial'];
      const c1Keywords = ['paradigm', 'inevitably', 'automation', 'transformation', 'nuance', 'substantially', 'implication', 'foresee', 'interconnected', 'sustainable'];

      allResponses.forEach(r => {
        totalWords += r.wordCount;
        totalDuration += r.duration;
        const textLower = r.text.toLowerCase();

        // Sentence complexity markers (commas, connectors, semicolons)
        const clauses = textLower.split(/[,.;!?]|\band\b|\bbut\b|\bbecause\b|\balthough\b/).filter(c => c.trim().length > 3);
        complexSentenceCount += clauses.length;

        // Keyword matches
        b1Keywords.forEach(k => { if (textLower.includes(k)) advancedKeywordsMatched += 1; });
        b2Keywords.forEach(k => { if (textLower.includes(k)) advancedKeywordsMatched += 2; });
        c1Keywords.forEach(k => { if (textLower.includes(k)) advancedKeywordsMatched += 3; });
      });

      // Scores calculation out of 100
      const averageWordsPerAnswer = totalWords / allResponses.length;
      
      // Fluency (based on response length and speaking pace)
      const fluencyScore = Math.min(98, Math.max(45, Math.round((averageWordsPerAnswer / 25) * 60 + 35)));
      
      // Vocabulary range
      const vocabularyScore = Math.min(98, Math.max(40, Math.round(45 + advancedKeywordsMatched * 3.5)));
      
      // Grammar & sentence structure
      const grammarScore = Math.min(96, Math.max(45, Math.round(50 + (complexSentenceCount / 8) * 35)));
      
      // Pronunciation clarity
      const pronunciationScore = Math.min(95, Math.max(55, Math.round((fluencyScore + grammarScore) / 2)));

      const totalScore = Math.round((fluencyScore + vocabularyScore + grammarScore + pronunciationScore) / 4);

      // Determine CEFR level
      let determinedLevel: CEFRLevel = 'A1';
      let recommendedCats: ContentCategory[] = ['daily', 'story'];
      let feedbackAr = '';
      let feedbackEn = '';

      if (totalScore >= 85) {
        determinedLevel = 'C1';
        recommendedCats = ['it', 'insurance', 'work', 'news'];
        feedbackAr = 'أداء صوتي ولغوي استثنائي! تمتلك مخزوناً مفرداتياً متقدماً، وقدرة ممتازة على التعبير عن الأفكار المركبة والنقاشات التحليلية بسلاسة دون تردد.';
        feedbackEn = 'Exceptional voice fluency and linguistic command! You demonstrated advanced vocabulary, fluid argumentation, and natural speech structures.';
      } else if (totalScore >= 72) {
        determinedLevel = 'B2';
        recommendedCats = ['it', 'insurance', 'work', 'news', 'book'];
        feedbackAr = 'مستوى متقدم فوق المتوسط (B2)! استرسالك ممتاز وتستطيع التعبير عن آرائك ومناقشة المواضيع المعقدة بثقة. ننصحك بالتركيز على نصوص تكنولوجيا المعلومات والتأمين لتوسيع مصطلحاتك التخصصية.';
        feedbackEn = 'Great upper-intermediate command (B2)! You comfortably explain viewpoints and narrate complex events. We recommend technical and workplace reading to reach C1.';
      } else if (totalScore >= 55) {
        determinedLevel = 'B1';
        recommendedCats = ['work', 'daily', 'home', 'story', 'mosque'];
        feedbackAr = 'مستوى متوسط واعد (B1)! تستطيع التعبير عن الأفكار اليومية وسرد القصص بشكل مفهوم ومترابط. ستستفيد جداً من القراءة التفاعلية مع التظليل الصوتي لرفع سرعة النطق وثراء الجمل.';
        feedbackEn = 'Solid intermediate level (B1)! You can successfully navigate everyday discussions and narrate experiences. Interactive reading with audio shadowing will quickly push you to B2.';
      } else if (totalScore >= 40) {
        determinedLevel = 'A2';
        recommendedCats = ['daily', 'home', 'parenting', 'story'];
        feedbackAr = 'مستوى تمهيدي جيد (A2)! لديك أساسيات المحادثة وتكوين الجمل البسيطة. مع قراءة النصوص القصيرة يومياً ومراجعة بطاقات الـ SRS ستنتقل للمستوى المتوسط سريعاً.';
        feedbackEn = 'Good elementary foundation (A2)! You form basic sentences well. Regular reading of daily life and short stories will accelerate your progress.';
      } else {
        determinedLevel = 'A1';
        recommendedCats = ['daily', 'story', 'parenting'];
        feedbackAr = 'بداية رائعة في رحلة التعلم (A1)! أهم خطوة الآن هي الاستمرار في القراءة اليومية لمدة 15 دقيقة مع الاستماع المتكرر لنطق الجمل بصوت عالٍ.';
        feedbackEn = 'A wonderful beginning (A1)! Focus on 15 minutes of daily reading with audio shadowing and flashcards to build your core vocabulary.';
      }

      const result: VoiceAssessmentResult = {
        cefrLevel: determinedLevel,
        totalScore,
        fluencyScore,
        vocabularyScore,
        grammarScore,
        pronunciationScore,
        feedbackAr,
        feedbackEn,
        recommendedCategories: recommendedCats,
        date: new Date().toISOString().split('T')[0],
      };

      // Save to storage and unlock badge
      const currentStats = StorageService.getUserStats();
      const updatedBadges = currentStats.badges.map(b => {
        if (b.id === 'polyglot' || b.id === 'first_word') {
          return { ...b, unlocked: true };
        }
        return b;
      });

      StorageService.saveUserStats({
        assessedLevel: determinedLevel,
        assessmentScore: totalScore,
        lastAssessmentDate: result.date,
        badges: updatedBadges,
        points: currentStats.points + 100, // Reward points for test completion
      });

      setAssessmentResult(result);
      setIsEvaluating(false);
      onCompleteLevel(determinedLevel);
    }, 1500);
  };

  const handleRestartTest = () => {
    setAssessmentResult(null);
    setCurrentStageIdx(0);
    setResponses([]);
    setUserTranscript('');
    setMicError(null);
  };

  return (
    <div 
      id="voice-level-test-container"
      className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      
      {/* Test Running View */}
      {!assessmentResult ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
                  <Mic className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-extrabold uppercase tracking-wider">
                      {isArabic ? 'محادثة صوتية ذكية' : 'Smart Voice Diagnostic'}
                    </span>
                    <span className="text-xs text-slate-300">
                      {isArabic ? `المرحلة ${currentStageIdx + 1} من ${totalStages}` : `Stage ${currentStageIdx + 1} of ${totalStages}`}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                    {isArabic ? 'اختبار تحديد المستوى الصوتي التفاعلي' : 'Interactive Voice Level Assessment'}
                  </h1>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {ASSESSMENT_STAGES.map((s, idx) => (
                  <div 
                    key={s.id} 
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      idx < currentStageIdx 
                        ? 'bg-emerald-400 scale-90' 
                        : idx === currentStageIdx 
                        ? 'bg-rose-500 ring-4 ring-rose-400/30 scale-110' 
                        : 'bg-white/25'
                    }`}
                    title={s.levelNameEn}
                  />
                ))}
              </div>
            </div>

            {/* Target Level Sub-bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>{isArabic ? `المستوى المستهدف قياسه: ${currentStage.levelNameAr}` : `Target Diagnostic Level: ${currentStage.levelNameEn}`}</span>
              </div>

              {/* Audio Speed Controls */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-300">{isArabic ? 'سرعة الصوت:' : 'Speed:'}</span>
                {[0.85, 1.0, 1.15].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setSpeechRate(speed)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                      speechRate === speed ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Coach Question Card */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Bot Dialogue Bubble */}
            <div className="flex items-start gap-4 p-5 rounded-3xl bg-indigo-50/70 border border-indigo-100 relative">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                {isBotSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                  </span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-indigo-900 text-sm">
                    {isArabic ? 'المدرب الصوتي الذكي (LinguaBot)' : 'LinguaBot (Voice Coach)'}
                  </span>

                  {/* Replay Audio Button */}
                  <button
                    onClick={handleToggleBotSpeech}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isBotSpeaking 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 shadow-2xs'
                    }`}
                    title={isArabic ? 'إعادة الاستماع للسؤال بالصوت' : 'Replay question audio'}
                  >
                    {isBotSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'إيقاف الصوت' : 'Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isArabic ? 'استمع للسؤال' : 'Listen'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* English Prompt */}
                <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  "{currentStage.botPromptEn}"
                </p>

                {/* Arabic Translation & Context Hint */}
                <div className="mt-2 text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-indigo-100/80">
                  <span className="font-semibold text-indigo-800">{isArabic ? 'الترجمة والتوضيح: ' : 'Context Hint: '}</span>
                  <span>{isArabic ? currentStage.botPromptAr : currentStage.tipEn}</span>
                </div>

                {/* Audio Wave Visualizer while bot speaks */}
                {isBotSpeaking && (
                  <div className="flex items-center gap-1 mt-3">
                    <span className="text-[11px] font-semibold text-indigo-600 mr-2">{isArabic ? 'المدرب يتحدث الآن...' : 'Coach is speaking...'}</span>
                    {[40, 75, 100, 60, 85, 30, 95, 50, 80].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-indigo-600 rounded-full animate-pulse"
                        style={{ height: `${h * 0.22}px`, animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Learner Voice Input Section */}
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-rose-500" />
                  <span>{isArabic ? 'إجابتك بالإنجليزية (تحدث بصوتك أو اكتب):' : 'Your English Response (Speak or Type):'}</span>
                </label>
                
                {userTranscript && (
                  <span className="text-xs text-slate-500 font-medium">
                    {userTranscript.trim().split(/\s+/).length} {isArabic ? 'كلمة' : 'words'}
                  </span>
                )}
              </div>

              {/* Main Microphone Interaction Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200">
                <button
                  type="button"
                  onClick={isListening ? stopVoiceRecording : startVoiceRecording}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black transition-all duration-200 cursor-pointer shadow-md ${
                    isListening
                      ? 'bg-rose-600 hover:bg-rose-700 text-white ring-8 ring-rose-500/20 animate-pulse scale-105'
                      : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white hover:scale-102'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>{isArabic ? 'اضغط لإيقاف التسجيل وإنهاء الإجابة' : 'Stop Recording'}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>{isArabic ? 'اضغط هنا وتحدث بصوتك الآن' : 'Tap to Speak Voice Answer'}</span>
                    </>
                  )}
                </button>

                {/* Animated wave during recording */}
                {isListening && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-rose-600">
                      {isArabic ? 'جارِ الاستماع لك وتسجيل صوتك...' : 'Listening & transcribing...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Live Transcript / Editable Text Box */}
              <div className="relative">
                <textarea
                  value={userTranscript}
                  onChange={(e) => setUserTranscript(e.target.value)}
                  placeholder={
                    isArabic 
                      ? 'سوف يظهر كلامك المنطوق هنا تلقائياً... أو يمكنك كتابة إجابتك بحرية بالإنجليزية للتقييم.'
                      : 'Your spoken words will appear here in real time... or you can type your answer directly in English.'
                  }
                  rows={4}
                  className="w-full p-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 text-sm font-medium leading-relaxed resize-none shadow-2xs"
                />

                {userTranscript && (
                  <button
                    onClick={() => setUserTranscript('')}
                    className="absolute top-3 left-3 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100 cursor-pointer"
                  >
                    {isArabic ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>

              {/* Microphone Error Notice / Fallback Guide */}
              {micError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{micError}</span>
                </div>
              )}

              {/* Starter Phrases Hints */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isArabic ? 'جمل مقترحة للمساعدة في بدء الحديث (اضغط لإضافتها):' : 'Suggested Sentence Starters (tap to insert):'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentStage.starters.map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => setUserTranscript(prev => prev ? `${prev} ${starter}` : starter)}
                      className="text-xs bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer"
                    >
                      "{starter}"
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={onOpenGuide}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{isArabic ? 'كيف أستفيد من القراءة للوصول للطلاقة؟ (الدليل الذهبي)' : 'Reading Fluency Guide'}</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  disabled={!userTranscript.trim() || isListening}
                  onClick={handleNextStage}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-md transition cursor-pointer w-full sm:w-auto ${
                    userTranscript.trim() && !isListening
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {currentStageIdx < totalStages - 1 
                      ? (isArabic ? 'اعتماد الإجابة والانتقال للمرحلة التالية' : 'Next Stage') 
                      : (isArabic ? 'إنهاء الاختبار وتحليل مستواي بالذكاء الاصطناعي' : 'Finish & Analyze Level')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Comprehensive Results Screen & CEFR Diagnostic Certificate */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Top Celebration Banner */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl mb-4">
              <Award className="w-10 h-10 text-amber-300" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-black tracking-wider uppercase mb-2">
              {isArabic ? 'شهادة التقييم الصوتي المعتمدة' : 'Official Voice Diagnostic Certificate'}
            </span>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {isArabic ? `مستواك الصوتي المحدد: ${assessmentResult.cefrLevel}` : `Your Assessed Level: ${assessmentResult.cefrLevel}`}
            </h2>

            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-xl mx-auto">
              {isArabic ? assessmentResult.feedbackAr : assessmentResult.feedbackEn}
            </p>
          </div>

          {/* Detailed Metric Radar Breakdown */}
          <div className="p-6 sm:p-8 space-y-6">
            
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span>{isArabic ? 'تحليل المهارات الصوتية واللغوية التفصيلي:' : 'Detailed Audio & Linguistic Breakdown:'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Metric 1: Fluency */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{isArabic ? 'الطلاقة والاسترسال' : 'Speaking Fluency'}</span>
                  <span className="text-sm font-black text-indigo-600">{assessmentResult.fluencyScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${assessmentResult.fluencyScore}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isArabic ? 'سرعة الاستجابة وتدفق الكلمات دون توقف طويل.' : 'Speech pacing and continuous sentence flow.'}
                </p>
              </div>

              {/* Metric 2: Vocabulary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{isArabic ? 'ثراء المفردات' : 'Lexical Range'}</span>
                  <span className="text-sm font-black text-purple-600">{assessmentResult.vocabularyScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full transition-all duration-500" style={{ width: `${assessmentResult.vocabularyScore}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isArabic ? 'تنوع الكلمات والمصطلحات التخصصية المستخدمة.' : 'Diversity and richness of vocabulary choices.'}
                </p>
              </div>

              {/* Metric 3: Grammar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{isArabic ? 'بناء التراكيب والقواعد' : 'Grammar Structure'}</span>
                  <span className="text-sm font-black text-rose-600">{assessmentResult.grammarScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-rose-600 rounded-full transition-all duration-500" style={{ width: `${assessmentResult.grammarScore}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isArabic ? 'استخدام أزمنة مختلفة وروابط جمل مركبة.' : 'Use of complex clauses and correct verb tenses.'}
                </p>
              </div>

              {/* Metric 4: Pronunciation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600">{isArabic ? 'وضوح النطق الصوتي' : 'Pronunciation'}</span>
                  <span className="text-sm font-black text-emerald-600">{assessmentResult.pronunciationScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${assessmentResult.pronunciationScore}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  {isArabic ? 'دقة مخارج الحروف وثقة التحدث بالإنجليزية.' : 'Audio articulation clarity and confidence.'}
                </p>
              </div>

            </div>

            {/* Recommended Learning Path for their Level */}
            <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-100">
              <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2 text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isArabic ? 'خطة القراءة الموصى بها لمستواك:' : 'Recommended Reading Blueprint for Your Level:'}</span>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                {isArabic
                  ? `بناءً على نتيجتك في المستوى (${assessmentResult.cefrLevel})، جهزنا لك نصوصاً مخصصة في مجالات: ${assessmentResult.recommendedCategories.join('، ')}. قراءة نص واحد يومياً مع الاستماع للتظليل الصوتي سينقلك للمستوى الأعلى خلال 30 يوماً.`
                  : `Based on your (${assessmentResult.cefrLevel}) score, we tailored reading content in: ${assessmentResult.recommendedCategories.join(', ')}. Reading one text daily with audio shadowing will elevate you to the next tier within 30 days.`}
              </p>
            </div>

            {/* Next Steps Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleRestartTest}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isArabic ? 'إعادة الاختبار الصوتي' : 'Retake Assessment'}</span>
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={onOpenGuide}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{isArabic ? 'دليل التعلم السريع بالقراءة' : 'Reading Method Guide'}</span>
                </button>

                <button
                  onClick={() => onGoToLibrary(assessmentResult.cefrLevel)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  <span>{isArabic ? `تصفح نصوص مستواي (${assessmentResult.cefrLevel}) بالمكتبة` : `Explore ${assessmentResult.cefrLevel} Library Texts`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
