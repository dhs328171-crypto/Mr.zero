import type { NasaLesson, NasaQuizItem } from "../types/nasa";

export interface ExecLogItem {
  title: string;
  output: string[];
  ok: boolean;
  time: string;
}

export interface SnapshotItem {
  code: string;
  title: string;
  time: string;
}

export interface BadgeDef {
  id: string;
  name: string;
  test: (ctx: { done: number[]; score: number; streak: number; total: number }) => boolean;
}

export const BADGES: BadgeDef[] = [
  { id: "first", name: "أول إقلاع", test: ({ done }) => done.length >= 1 },
  { id: "three", name: "ثلاثة مدارات", test: ({ done }) => done.length >= 3 },
  { id: "all", name: "رائد بيانات ناسا", test: ({ done, total }) => done.length === total },
  { id: "clean", name: "كود نظيف", test: ({ score }) => score >= 90 },
  { id: "streak", name: "سلسلة يومية", test: ({ streak }) => streak >= 3 },
];

interface ZeroProPanelProps {
  lessons: NasaLesson[];
  idx: number;
  done: number[];
  xp: number;
  streak: number;
  quizScore: number;
  reviewScore: number;
  query: string;
  setQuery: (v: string) => void;
  completedOnly: boolean;
  setCompletedOnly: (fn: (v: boolean) => boolean) => void;
  favorites: number[];
  toggleFavorite: (i: number) => void;
  visibleCount: number;
  focus: boolean;
  setFocus: (fn: (v: boolean) => boolean) => void;
  timer: number;
  timerRunning: boolean;
  startFocusTimer: () => void;
  stopFocusTimer: () => void;
  fontScale: number;
  setFontScale: (fn: (v: number) => number) => void;
  history: SnapshotItem[];
  saveSnapshot: () => void;
  restoreSnapshot: (s: SnapshotItem) => void;
  execHistory: ExecLogItem[];
  clearExecHistory: () => void;
  exportData: () => void;
  importData: () => void;
  clearProgress: () => void;
  nextLesson: () => void;
  firstIncomplete: () => void;
  randomLesson: () => void;
  copyChallenge: () => void;
  shareProgress: () => void;
  challengeTimer: number;
  startChallengeTimer: () => void;
  stopChallengeTimer: () => void;
  autoAdvance: boolean;
  setAutoAdvance: (v: boolean) => void;
  sessionSeconds: number;
  soundOn: boolean;
  setSoundOn: (fn: (v: boolean) => boolean) => void;
  highContrast: boolean;
  setHighContrast: (fn: (v: boolean) => boolean) => void;
  toggleFullscreen: () => void;
  showShortcuts: boolean;
  setShowShortcuts: (fn: (v: boolean) => boolean) => void;
  online: boolean;
  quizzes: NasaQuizItem[];
  quizIndex: number;
  quizAnswer: number | null;
  answerQuiz: (i: number) => void;
  nextQuiz: () => void;
  notes: string;
  setNotes: (v: string) => void;
}

export function ZeroProPanel(props: ZeroProPanelProps) {
  const formatTime = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const unlockedBadges = BADGES.filter((b) =>
    b.test({ done: props.done, score: props.reviewScore, streak: props.streak, total: props.lessons.length })
  );

  const currentQuiz = props.quizzes[props.quizIndex % props.quizzes.length];

  return (
    <section id="zero-pro" className="max-w-7xl mx-auto px-4 pt-4">
      <details className="rounded-xl border border-slate-200 bg-white p-4 group">
        <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-3 font-bold text-sm text-slate-800">
          <span>
            أدوات Zero Pro
            <span className="mx-2 text-slate-300">·</span>
            <span className="font-normal text-slate-600 mono">
              {unlockedBadges.length} شارات · {props.streak} يوم سلسلة · {props.quizScore} إجابات صحيحة
            </span>
          </span>
          <span className="text-xs text-violet-700 group-open:rotate-180 transition-transform">⌄</span>
        </summary>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">ملاحة الدروس</h3>
            <input
              value={props.query}
              onChange={(e) => props.setQuery(e.target.value)}
              placeholder="ابحث في دروس ناسا..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => props.setCompletedOnly((v) => !v)}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap ${
                  props.completedOnly ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "border-slate-200 text-slate-600"
                }`}
              >
                المكتملة فقط
              </button>
              <button
                type="button"
                onClick={() => props.setQuery("")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 whitespace-nowrap"
              >
                إظهار الكل
              </button>
              <button
                type="button"
                onClick={() => props.toggleFavorite(props.idx)}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap ${
                  props.favorites.includes(props.idx)
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {props.favorites.includes(props.idx) ? "★ محفوظ" : "☆ حفظ الدرس"}
              </button>
            </div>
            <p className="text-xs text-slate-500 mono">
              يعرض {props.visibleCount} من {props.lessons.length} دروس
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">وضع التركيز والخط</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => props.setFocus((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 whitespace-nowrap"
              >
                {props.focus ? "إيقاف التركيز" : "بدء جلسة تركيز"}
              </button>
              <button
                type="button"
                onClick={props.startFocusTimer}
                className="px-3 py-1.5 rounded-lg border border-cyan-200 text-cyan-800 whitespace-nowrap"
              >
                مؤقت 25 دقيقة
              </button>
              <button
                type="button"
                onClick={props.stopFocusTimer}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 whitespace-nowrap"
              >
                إيقاف المؤقت
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{props.timerRunning ? "جلسة مركّزة نشطة" : "المؤقت متوقف"}</span>
              <span className="mono font-bold text-violet-700">{formatTime(props.timer)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">حجم الخط</span>
              <button
                type="button"
                onClick={() => props.setFontScale((v) => Math.max(0.9, +(v - 0.1).toFixed(1)))}
                className="px-2.5 py-1 rounded border border-slate-200"
              >
                −
              </button>
              <span className="mono">{Math.round(props.fontScale * 100)}%</span>
              <button
                type="button"
                onClick={() => props.setFontScale((v) => Math.min(1.2, +(v + 0.1).toFixed(1)))}
                className="px-2.5 py-1 rounded border border-slate-200"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900">التقدم والنسخ الاحتياطي</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <b className="block text-base text-violet-700 mono">{props.done.length}</b>
                <span className="text-slate-500">دروس</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <b className="block text-base text-emerald-700 mono">{props.xp}</b>
                <span className="text-slate-500">XP</span>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <b className="block text-base text-amber-700 mono">{props.history.length}</b>
                <span className="text-slate-500">نسخ</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={props.exportData} className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 whitespace-nowrap">
                تصدير التقدم
              </button>
              <button type="button" onClick={props.importData} className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-800 whitespace-nowrap">
                استيراد التقدم
              </button>
              <button type="button" onClick={props.clearProgress} className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 whitespace-nowrap">
                تصفير التقدم
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">تنقّل سريع</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={props.nextLesson} className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-800 whitespace-nowrap">
                الدرس التالي
              </button>
              <button type="button" onClick={props.firstIncomplete} className="px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 whitespace-nowrap">
                أول درس ناقص
              </button>
              <button type="button" onClick={props.randomLesson} className="px-3 py-1.5 rounded-lg border border-violet-200 text-violet-800 whitespace-nowrap">
                درس عشوائي
              </button>
              <button type="button" onClick={props.copyChallenge} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 whitespace-nowrap">
                نسخ التحدي
              </button>
              <button type="button" onClick={props.shareProgress} className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800 whitespace-nowrap">
                مشاركة التقدم
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">مؤقت التحدي</h3>
            <div className="flex items-center gap-2">
              <span className="mono text-lg font-bold text-rose-700">{formatTime(props.challengeTimer)}</span>
              <button type="button" onClick={props.startChallengeTimer} className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 whitespace-nowrap">
                ابدأ 10 د
              </button>
              <button type="button" onClick={props.stopChallengeTimer} className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 whitespace-nowrap">
                إيقاف
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={props.autoAdvance}
                onChange={(e) => props.setAutoAdvance(e.target.checked)}
              />
              انتقل تلقائياً بعد النجاح
            </label>
            <p className="text-xs text-slate-500 mono">وقت الجلسة: {formatTime(props.sessionSeconds)}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">إعدادات التجربة</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <button type="button" onClick={() => props.setSoundOn((v) => !v)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 whitespace-nowrap">
                {props.soundOn ? "الصوت يعمل" : "الصوت صامت"}
              </button>
              <button type="button" onClick={() => props.setHighContrast((v) => !v)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 whitespace-nowrap">
                {props.highContrast ? "تباين عادي" : "تباين عالٍ"}
              </button>
              <button type="button" onClick={props.toggleFullscreen} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 whitespace-nowrap">
                ملء الشاشة
              </button>
              <button type="button" onClick={() => props.setShowShortcuts((v) => !v)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 whitespace-nowrap">
                اختصارات
              </button>
            </div>
            <span className={`text-xs font-semibold ${props.online ? "text-emerald-700" : "text-amber-700"}`}>
              {props.online ? "● متصل بالشبكة وواجهات ناسا" : "● وضع محلي"}
            </span>
          </div>
        </div>

        {props.showShortcuts && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <strong>اختصارات لوحة المفاتيح:</strong>{" "}
            <span className="mono">Ctrl/Cmd + Enter</span> تشغيل الكود · <span className="mono">Tab</span> مسافة بادئة ·{" "}
            <span className="mono">Esc</span> الخروج من ملء الشاشة
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">الشارات</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {BADGES.map((b) => {
                const active = unlockedBadges.some((x) => x.id === b.id);
                return (
                  <span
                    key={b.id}
                    className={`px-2.5 py-1 rounded-lg border ${
                      active ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold" : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    {b.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-slate-900">اختبار ناسا السريع</h3>
              <span className="text-[11px] text-slate-500 mono">{currentQuiz.source}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{currentQuiz.q}</p>
            <div className="grid grid-cols-2 gap-2">
              {currentQuiz.options.map((option, i) => (
                <button
                  key={option}
                  type="button"
                  disabled={props.quizAnswer !== null}
                  onClick={() => props.answerQuiz(i)}
                  className={`text-xs px-2.5 py-2 rounded-lg border text-right truncate ${
                    props.quizAnswer === i
                      ? i === currentQuiz.answer
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold"
                        : "bg-rose-50 border-rose-400 text-rose-800"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button type="button" onClick={props.nextQuiz} className="text-xs font-semibold text-violet-700 hover:underline">
              سؤال آخر ←
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">ملاحظات الرحلة</h3>
            <textarea
              value={props.notes}
              onChange={(e) => props.setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك حول بيانات ناسا وبايثون..."
              className="w-full h-20 border border-slate-200 rounded-lg p-2 text-xs resize-none outline-none focus:border-violet-500"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={props.saveSnapshot}
                className="text-xs px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 whitespace-nowrap"
              >
                حفظ نسخة الكود
              </button>
              <span className="text-[11px] text-slate-400">يتم الحفظ محلياً</span>
            </div>
          </div>
        </div>

        {props.history.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 mb-2">سجل نسخ الكود</h3>
            <div className="flex flex-wrap gap-2">
              {props.history.map((snap, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => props.restoreSnapshot(snap)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {snap.title} · {snap.time}
                </button>
              ))}
            </div>
          </div>
        )}

        {props.execHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-900">سجل التشغيل</h3>
              <button type="button" onClick={props.clearExecHistory} className="text-xs text-rose-700 hover:underline">
                مسح السجل
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {props.execHistory.slice(0, 6).map((item, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-xs">
                  <div className="flex justify-between">
                    <strong className="text-slate-800">{item.title}</strong>
                    <span className={item.ok ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                      {item.ok ? "نجح" : "خطأ"}
                    </span>
                  </div>
                  <div className="text-slate-500 mono mt-1 truncate">
                    {item.time} · {item.output?.slice(0, 2).join(" · ") || "بدون مخرجات"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </details>
    </section>
  );
}
