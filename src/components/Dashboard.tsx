import React from 'react';
import { 
  Flame, 
  BrainCircuit, 
  BookOpen, 
  Clock, 
  Trophy, 
  Award, 
  TrendingUp, 
  CheckCircle,
  Calendar,
  Sparkles,
  Mic,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { UserStats } from '../types';

interface DashboardProps {
  stats: UserStats;
  onStartVoiceTest?: () => void;
  onOpenGuide?: () => void;
  isArabic: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  stats, 
  onStartVoiceTest, 
  onOpenGuide, 
  isArabic 
}) => {
  const maxMinutes = Math.max(...stats.weeklyActivity.map((d) => d.minutes), 30);

  return (
    <div id="dashboard-container" className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isArabic ? 'لوحة المتابعة والإنجازات الشخصية' : 'Personal Learning Dashboard'}
          </h1>
          <p className="text-xs text-slate-500">
            {isArabic ? 'تتبع تقدمك اليومي، شعلة الاستمرار، ومعدل اكتساب المفردات ومستواك الصوتي' : 'Track your daily streak, reading time, vocabulary, and voice level'}
          </p>
        </div>

        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isArabic ? 'دليل التعلم السريع بالقراءة' : 'Reading Fluency Guide'}</span>
          </button>
        )}
      </div>

      {/* Voice Level Status Banner */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white border border-slate-800 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                  {isArabic ? 'التقييم الصوتي التفاعلي' : 'Interactive Voice Assessment'}
                </span>
                {stats.lastAssessmentDate && (
                  <span className="text-xs text-slate-400">
                    {isArabic ? `تاريخ آخر فحص: ${stats.lastAssessmentDate}` : `Tested on: ${stats.lastAssessmentDate}`}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-1">
                {stats.assessedLevel ? (
                  isArabic 
                    ? `مستواك الصوتي الحالي: (${stats.assessedLevel}) — درجة التقييم: ${stats.assessmentScore || 85}%` 
                    : `Your Assessed Level: (${stats.assessedLevel}) — Score: ${stats.assessmentScore || 85}%`
                ) : (
                  isArabic
                    ? 'هل ترغب بمعرفة مستواك الحقيقي في التحدث والقراءة بالصوت؟'
                    : 'Discover Your Exact Spoken CEFR Level with AI'
                )}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {stats.assessedLevel ? (
                  isArabic
                    ? 'تم تقييم طلاقتك، بناء الجمل، وثراء المفردات عبر المحادثة الصوتية الذكية. يمكنك إعادة الاختبار في أي وقت لقياس تطورك.'
                    : 'Your fluency, sentence structure, and vocabulary were evaluated via smart voice conversation. Retake anytime to measure growth.'
                ) : (
                  isArabic
                    ? 'محادثة صوتية ذكية مدتها 3 دقائق تقيس طلاقتك وسرعة استرسالك وثراء مفرداتك وتحدد مستواك (A1 إلى C1).'
                    : 'A 3-minute interactive voice conversation measuring fluency, vocabulary, and grammar to determine your CEFR level.'
                )}
              </p>
            </div>
          </div>

          {onStartVoiceTest && (
            <button
              onClick={onStartVoiceTest}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition shrink-0 cursor-pointer"
            >
              {stats.assessedLevel ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>{isArabic ? 'إعادة اختبار مستواي الصوتي' : 'Retake Voice Test'}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>{isArabic ? 'ابدأ الفحص الصوتي الآن' : 'Start Voice Test'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Streak */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
            <Flame className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isArabic ? 'أيام متتالية' : 'Daily Streak'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{stats.streakDays}</span>
              <span className="text-xs font-bold text-amber-600">{isArabic ? 'أيام 🔥' : 'days 🔥'}</span>
            </div>
          </div>
        </div>

        {/* Words Learned */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isArabic ? 'مفردات محفوظة' : 'Words in SRS'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalWordsLearned}</span>
              <span className="text-xs font-bold text-indigo-600">{isArabic ? 'كلمة' : 'words'}</span>
            </div>
          </div>
        </div>

        {/* Reading Time */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isArabic ? 'دقائق القراءة' : 'Reading Minutes'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalReadingMinutes}</span>
              <span className="text-xs font-bold text-emerald-600">{isArabic ? 'دقيقة' : 'mins'}</span>
            </div>
          </div>
        </div>

        {/* Points / XP */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isArabic ? 'نقاط الخبرة (XP)' : 'Total XP'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{stats.points}</span>
              <span className="text-xs font-bold text-purple-600">XP</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Activity Visual Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                {isArabic ? 'نشاط القراءة الأسبوعي (بالدقائق)' : 'Weekly Reading Activity (Minutes)'}
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {isArabic ? 'آخر 7 أيام' : 'Last 7 days'}
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="flex items-end justify-between gap-2 h-44 pt-4 px-2">
            {stats.weeklyActivity.map((item, idx) => {
              const heightPercent = Math.max(8, Math.round((item.minutes / maxMinutes) * 100));
              const isToday = idx === 4; // Wednesday

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition">
                    {item.minutes}m
                  </span>
                  
                  <div className="w-full max-w-[36px] bg-slate-100 rounded-t-xl overflow-hidden h-32 flex items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-purple-500'
                          : 'bg-indigo-400/80 group-hover:bg-indigo-500'
                      }`}
                    />
                  </div>

                  <span className={`text-[11px] font-bold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges & Achievements (1 Col) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {isArabic ? 'الشارات والأوسمة' : 'Badges & Achievements'}
              </h3>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              {stats.badges.filter((b) => b.unlocked).length} / {stats.badges.length}
            </span>
          </div>

          <div className="space-y-3">
            {stats.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border transition flex items-center gap-3 ${
                  badge.unlocked
                    ? 'border-indigo-100 bg-indigo-50/40 text-slate-900'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                }`}
              >
                <div className="text-2xl shrink-0">{badge.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold truncate">{badge.title}</h4>
                    {badge.unlocked && <CheckCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
