import React from 'react';
import { SavedWord } from '../types';
import { 
  Flame, 
  BookCheck, 
  Brain, 
  Trophy, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Sparkles,
  Zap
} from 'lucide-react';

interface StatsViewProps {
  savedWords: SavedWord[];
}

export const StatsView: React.FC<StatsViewProps> = ({ savedWords }) => {
  const totalWordsSaved = savedWords.length;
  const masteredWords = savedWords.filter(w => w.masteryPercent >= 80).length;
  const inProgressWords = savedWords.filter(w => w.masteryPercent < 80).length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>لوحة تقدمك اللغوي</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            استمرارية رائعة! لقد قطعت شوطاً مميزاً
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            القراءة اليومية لمدة 15 دقيقة تزيد من حصيلتك اللغوية بمعدل أكثر من 1,000 كلمة شهرياً.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">سلسلة الأيام النشطة</span>
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white flex items-baseline gap-1">
            <span>7</span>
            <span className="text-xs text-orange-400 font-normal">أيام متتالية 🔥</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">إجمالي الكلمات المحفوظة</span>
            <Brain className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">{totalWordsSaved}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">الكلمات المتقنة</span>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-300">{masteredWords}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs">دقائق القراءة الإجمالية</span>
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-300">42 دقيقة</div>
        </div>
      </div>

      {/* CEFR Level Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <span>مستويات الصعوبة وإتقان المفردات (CEFR Framework)</span>
        </h3>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>المستوى A1 - A2 (مبتدئ وأساسي)</span>
              <span className="font-semibold text-emerald-400">90% مكتمل</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>المستوى B1 - B2 (متوسط وفوق المتوسط)</span>
              <span className="font-semibold text-indigo-400">65% قيد التقدم</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>المستوى C1 - C2 (متقدم وطلاقة)</span>
              <span className="font-semibold text-purple-400">30%</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: '30%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
