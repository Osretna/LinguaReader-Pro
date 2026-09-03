import React, { useState } from 'react';
import { 
  BookOpen, 
  Newspaper, 
  Sparkles, 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  PlusCircle, 
  Upload, 
  ArrowUpRight,
  Globe2,
  X,
  Laptop,
  ShieldCheck,
  Coffee,
  Briefcase,
  Home,
  Heart,
  Moon,
  Mic,
  Lightbulb
} from 'lucide-react';
import { ContentItem, CEFRLevel, ContentCategory } from '../types';
import { INITIAL_CONTENT_ITEMS } from '../data/mockContent';
import { StorageService } from '../services/storage';

interface LibraryProps {
  onSelectContent: (item: ContentItem) => void;
  onStartVoiceTest?: () => void;
  onOpenGuide?: () => void;
  isArabic: boolean;
}

export function getCategoryMeta(category: ContentCategory, isArabic: boolean): { label: string; icon: React.ReactNode; badgeClass: string } {
  switch (category) {
    case 'it':
      return {
        label: isArabic ? 'تكنولوجيا المعلومات (IT)' : 'IT & Tech',
        badgeClass: 'text-cyan-700 bg-cyan-50 border-cyan-200',
        icon: <Laptop className="w-3.5 h-3.5" />
      };
    case 'insurance':
      return {
        label: isArabic ? 'شركات التأمين' : 'Insurance',
        badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
        icon: <ShieldCheck className="w-3.5 h-3.5" />
      };
    case 'daily':
      return {
        label: isArabic ? 'المعاملات اليومية' : 'Daily Life',
        badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: <Coffee className="w-3.5 h-3.5" />
      };
    case 'work':
      return {
        label: isArabic ? 'بيئة العمل والشركات' : 'Workplace',
        badgeClass: 'text-purple-700 bg-purple-50 border-purple-200',
        icon: <Briefcase className="w-3.5 h-3.5" />
      };
    case 'home':
      return {
        label: isArabic ? 'المنزل والأسرة' : 'Home & Household',
        badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        icon: <Home className="w-3.5 h-3.5" />
      };
    case 'parenting':
      return {
        label: isArabic ? 'التعامل مع الأبناء' : 'Parenting & Kids',
        badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
        icon: <Heart className="w-3.5 h-3.5" />
      };
    case 'mosque':
      return {
        label: isArabic ? 'المسجد والمجتمع' : 'Mosque & Community',
        badgeClass: 'text-teal-700 bg-teal-50 border-teal-200',
        icon: <Moon className="w-3.5 h-3.5" />
      };
    case 'book':
      return {
        label: isArabic ? 'روايات وكتب' : 'Books & Novels',
        badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        icon: <BookOpen className="w-3.5 h-3.5" />
      };
    case 'news':
      return {
        label: isArabic ? 'أخبار ومقالات' : 'Daily News',
        badgeClass: 'text-sky-700 bg-sky-50 border-sky-200',
        icon: <Newspaper className="w-3.5 h-3.5" />
      };
    case 'story':
      return {
        label: isArabic ? 'قصص قصيرة' : 'Short Stories',
        badgeClass: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
        icon: <FileText className="w-3.5 h-3.5" />
      };
    default:
      return {
        label: isArabic ? 'محتوى مخصص' : 'Custom Upload',
        badgeClass: 'text-slate-700 bg-slate-100 border-slate-200',
        icon: <BookOpen className="w-3.5 h-3.5" />
      };
  }
}

const CATEGORY_FILTERS: { id: ContentCategory | 'all'; labelAr: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All', icon: Sparkles },
  { id: 'it', labelAr: 'تكنولوجيا المعلومات (IT)', labelEn: 'IT & Tech', icon: Laptop },
  { id: 'insurance', labelAr: 'شركات التأمين', labelEn: 'Insurance', icon: ShieldCheck },
  { id: 'daily', labelAr: 'المعاملات اليومية', labelEn: 'Daily Life', icon: Coffee },
  { id: 'work', labelAr: 'بيئة العمل', labelEn: 'Workplace', icon: Briefcase },
  { id: 'home', labelAr: 'المنزل والأسرة', labelEn: 'Home', icon: Home },
  { id: 'parenting', labelAr: 'التعامل مع الأبناء', labelEn: 'Parenting', icon: Heart },
  { id: 'mosque', labelAr: 'المسجد والمجتمع', labelEn: 'Mosque', icon: Moon },
  { id: 'book', labelAr: 'الروايات والكتب', labelEn: 'Books', icon: BookOpen },
  { id: 'news', labelAr: 'الأخبار اليومية', labelEn: 'News', icon: Newspaper },
  { id: 'story', labelAr: 'القصص القصيرة', labelEn: 'Stories', icon: FileText },
];

export const Library: React.FC<LibraryProps> = ({ 
  onSelectContent, 
  onStartVoiceTest,
  onOpenGuide,
  isArabic 
}) => {
  const userStats = StorageService.getUserStats();
  const assessedLevel = userStats.assessedLevel;

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>(assessedLevel || 'all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom text modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customLanguage, setCustomLanguage] = useState('en');
  const [customLevel, setCustomLevel] = useState<CEFRLevel>('B1');
  const [customCategory, setCustomCategory] = useState<ContentCategory>('it');
  const [customText, setCustomText] = useState('');

  // Load standard items + user custom items
  const customItems = StorageService.getCustomTexts();
  const allItems: ContentItem[] = [...customItems, ...INITIAL_CONTENT_ITEMS];

  // Filters
  const filteredItems = allItems.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesLevel = selectedLevel === 'all' || item.level === selectedLevel;
    const matchesLanguage = selectedLanguage === 'all' || item.language === selectedLanguage;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesLevel && matchesLanguage && matchesSearch;
  });

  const handleSaveCustomText = () => {
    if (!customTitle.trim() || !customText.trim()) return;

    const words = customText.trim().split(/\s+/).length;
    const newItem: ContentItem = {
      id: 'custom-' + Date.now(),
      title: customTitle,
      author: customAuthor.trim() || (isArabic ? 'محتوى مخصص' : 'Custom Upload'),
      language: customLanguage,
      level: customLevel,
      category: customCategory,
      description: customText.slice(0, 140) + '...',
      estimatedMinutes: Math.max(1, Math.round(words / 100)),
      wordCount: words,
      text: customText,
      coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    };

    StorageService.saveCustomText(newItem);
    setShowCustomModal(false);
    onSelectContent(newItem);
  };

  const getLevelBadgeColor = (level: CEFRLevel) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'B1':
      case 'B2':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'C1':
      case 'C2':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div id="library-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Welcome banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-10 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            {isArabic ? 'القراءة التفاعلية الموسعة' : 'Extensive Smart Reading'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            {isArabic ? 'تعلّم أي لغة بالقراءة الذكية الممتعة' : 'Master Languages Through Real Stories & News'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed mb-6">
            {isArabic 
              ? 'اختر من بين الروايات العالمية، المقالات الإخبارية، والقصص القصيرة المتدرجة حسب مستواك (A1→C2). انقر على أي كلمة للحصول على ترجمتها ونطقها الصوتي فوراً.'
              : 'Graded literature, news, and short stories tailored to your CEFR level. Tap any word for instant audio pronunciation, translation, and grammar breakdown.'}
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            {onStartVoiceTest && (
              <button
                id="hero-voice-test-btn"
                onClick={onStartVoiceTest}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition cursor-pointer"
              >
                <Mic className="w-4 h-4 text-white animate-pulse" />
                <span>{isArabic ? 'اختبار تحديد المستوى الصوتي' : 'Voice Level Diagnostic'}</span>
              </button>
            )}

            {onOpenGuide && (
              <button
                id="hero-reading-guide-btn"
                onClick={onOpenGuide}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-900" />
                <span>{isArabic ? 'كيف أتعلم بسرعة بالقراءة؟' : 'How to Learn Fast (Guide)'}</span>
              </button>
            )}

            <button
              id="import-custom-text-btn"
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-indigo-200" />
              <span>{isArabic ? 'إضافة نص مخصص' : 'Import Custom Text'}</span>
            </button>
          </div>

          {assessedLevel && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 text-xs text-indigo-100">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {isArabic 
                  ? `مستواك الصوتي المعتمد: (${assessedLevel}) — تم تصفية نصوص المكتبة لتناسب مستواك!`
                  : `Your Assessed Level: (${assessedLevel}) — Library filtered to match your level!`}
              </span>
            </div>
          )}
        </div>

        {/* Ambient decorative elements */}
        <div className="absolute -bottom-10 -end-10 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 end-0 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-4 mb-8">
        
        {/* Category Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin max-w-full">
            {CATEGORY_FILTERS.map((cat) => {
              const IconComp = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* CEFR Level Selector & Language Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
            >
              <option value="all">{isArabic ? 'جميع اللغات' : 'All Languages'}</option>
              <option value="en">English (الإنجليزية)</option>
              <option value="fr">Français (الفرنسية)</option>
              <option value="es">Español (الإسبانية)</option>
              <option value="de">Deutsch (الألمانية)</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-indigo-500 cursor-pointer"
            >
              <option value="all">{isArabic ? 'المستوى (A1-C2)' : 'All Levels'}</option>
              <option value="A1">A1 - مبتدئ جداً</option>
              <option value="A2">A2 - أساسي</option>
              <option value="B1">B1 - متوسط</option>
              <option value="B2">B2 - فوق المتوسط</option>
              <option value="C1">C1 - متقدم</option>
              <option value="C2">C2 - إتقان كامل</option>
            </select>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isArabic ? 'ابحث عن كتاب، كاتب، مقال إخباري، أو موضوع...' : 'Search books, authors, or articles...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Graded Content Cards */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold">{isArabic ? 'لا توجد نتائج مطابقة لبحثك' : 'No items found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectContent(item)}
              className="group rounded-3xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Cover Image with Level Badge */}
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-50 to-purple-50 text-indigo-400"
                    style={{ display: item.coverImage ? 'none' : 'flex' }}
                  >
                    <BookOpen className="w-12 h-12 opacity-60" />
                  </div>

                  {/* Badges on Cover */}
                  <div className="absolute top-3 start-3 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-extrabold uppercase shadow-xs ${getLevelBadgeColor(item.level)}`}>
                      {item.level}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase">
                      {item.language.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    {(() => {
                      const meta = getCategoryMeta(item.category, isArabic);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${meta.badgeClass}`}>
                          {meta.icon}
                          <span>{meta.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                  
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-400 font-medium mb-2.5">
                    {item.author}
                  </p>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>~{item.estimatedMinutes} {isArabic ? 'دقائق' : 'mins'}</span>
                  <span>•</span>
                  <span>{item.wordCount} {isArabic ? 'كلمة' : 'words'}</span>
                </div>

                <div className="flex items-center gap-1 text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                  <span>{isArabic ? 'اقرأ الآن' : 'Read'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Custom Text Import */}
      {showCustomModal && (
        <div 
          id="custom-text-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowCustomModal(false)}
        >
          <div 
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isArabic ? 'إضافة نص أو مقال للقراءة التفاعلية' : 'Import Custom Text'}
                </h3>
              </div>
              <button 
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isArabic ? 'عنوان النص أو المقال:' : 'Title:'}
                </label>
                <input
                  type="text"
                  placeholder={isArabic ? 'مثال: The Secret Garden - Chapter 2' : 'e.g., Short Essay on Science'}
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'اللغة:' : 'Language:'}
                  </label>
                  <select
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  >
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="es">Español</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'المستوى المقترح:' : 'Level:'}
                  </label>
                  <select
                    value={customLevel}
                    onChange={(e) => setCustomLevel(e.target.value as CEFRLevel)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'التصنيف والمجال:' : 'Category:'}
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as ContentCategory)}
                    className="w-full p-2 rounded-xl border border-slate-200 font-medium"
                  >
                    <option value="it">{isArabic ? 'تكنولوجيا المعلومات (IT)' : 'IT & Tech'}</option>
                    <option value="insurance">{isArabic ? 'شركات التأمين' : 'Insurance'}</option>
                    <option value="daily">{isArabic ? 'المعاملات اليومية' : 'Daily Life'}</option>
                    <option value="work">{isArabic ? 'بيئة العمل' : 'Workplace'}</option>
                    <option value="home">{isArabic ? 'المنزل والأسرة' : 'Home'}</option>
                    <option value="parenting">{isArabic ? 'التعامل مع الأبناء' : 'Parenting'}</option>
                    <option value="mosque">{isArabic ? 'المسجد والمجتمع' : 'Mosque'}</option>
                    <option value="book">{isArabic ? 'الروايات والكتب' : 'Books'}</option>
                    <option value="news">{isArabic ? 'الأخبار' : 'News'}</option>
                    <option value="story">{isArabic ? 'قصص' : 'Stories'}</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {isArabic ? 'المصدر أو الكاتب:' : 'Author:'}
                  </label>
                  <input
                    type="text"
                    placeholder="Web / Team"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isArabic ? 'ألصق النص هنا:' : 'Paste Text Here:'}
                </label>
                <textarea
                  rows={8}
                  dir="ltr"
                  placeholder="Paste any article or book chapter in any language..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-serif text-slate-800 focus:outline-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveCustomText}
                disabled={!customTitle.trim() || !customText.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
              >
                {isArabic ? 'بدء القراءة فوراً' : 'Start Reading'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
