import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  Layers,
  Lightbulb,
  Play,
  Rocket,
  RotateCcw,
  Sparkles,
  Terminal,
  Volume2,
} from "lucide-react";
import { HologramStage } from "./components/HologramStage";
import { NasaDossierModal } from "./components/NasaDossierModal";
import { NasaTelemetryDeck } from "./components/NasaTelemetryDeck";
import { ZeroProPanel, type ExecLogItem, type SnapshotItem } from "./components/ZeroProPanel";
import {
  buildGalleryDemoCode,
  buildHoloDemoCode,
  buildJsGalleryDemo,
  buildJsHoloDemo,
  buildJsSolarDemo,
  buildNasaDemoCode,
  buildNasaLessons,
  buildNasaQuizzes,
  buildSolarDemoCode,
} from "./data/nasaLessons";
import type { HoloItem, NasaBundle, NasaEntityProfile } from "./types/nasa";
import {
  PY_URL,
  SNAP_SRC,
  explainError,
  fallbackRun,
  playTone,
  reviewCode,
  runPy,
  type ExplainedError,
  type PyodideInstance,
} from "./utils/pythonEngine";

const RANKS = [
  { min: 0, name: "متعلم مبتدئ" },
  { min: 200, name: "مطوّر بايثون" },
  { min: 400, name: "محلل بيانات ناسا" },
  { min: 550, name: "خبير Zero" },
  { min: 700, name: "رائد بيانات" },
];

const TYPE_STYLE: Record<string, string> = {
  int: "text-emerald-300 border-emerald-500/40",
  float: "text-cyan-300 border-cyan-500/40",
  str: "text-blue-300 border-blue-500/40",
  list: "text-amber-300 border-amber-500/40",
  dict: "text-amber-300 border-amber-500/40",
  bool: "text-fuchsia-300 border-fuchsia-500/40",
};

const PROG_KEY = "mrzero_nasa_progress";

function loadProg(): { done: number[]; xp: number } {
  try {
    const v = JSON.parse(localStorage.getItem(PROG_KEY) || "null");
    if (v && Array.isArray(v.done)) {
      return { done: v.done, xp: Number(v.xp) || 0 };
    }
  } catch {
    // ignore storage errors
  }
  return { done: [], xp: 0 };
}

export default function App() {
  const [bundle, setBundle] = useState<NasaBundle | null>(null);
  const [nasaLoading, setNasaLoading] = useState(true);
  const [nasaError, setNasaError] = useState<string | null>(null);

  const [dossierOpen, setDossierOpen] = useState(false);
  const [dossierProfile, setDossierProfile] = useState<NasaEntityProfile | null>(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);

  const [idx, setIdx] = useState(0);
  const [code, setCode] = useState("# جارٍ جلب بيانات ناسا الرسمية...\n");
  const [userEdited, setUserEdited] = useState(false);

  const [out, setOut] = useState<string[] | null>(null);
  const [vars, setVars] = useState<Array<[string, string, string]>>([]);
  const [err, setErr] = useState<ExplainedError | { type: "hint"; msg: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [runNotice, setRunNotice] = useState("");
  const [pyStatus, setPyStatus] = useState<"loading" | "ready" | "fallback">("loading");

  const [done, setDone] = useState<number[]>(() => loadProg().done);
  const [xp, setXp] = useState<number>(() => loadProg().xp);
  const [ms, setMs] = useState<number | null>(null);
  const [holo, setHolo] = useState<HoloItem[]>(() => buildJsHoloDemo(null));

  const [hintLvl, setHintLvl] = useState(0);
  const [childName, setChildName] = useState("");
  const [orbitBonus, setOrbitBonus] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const todayKey = new Date().toISOString().slice(0, 10);
  const [dailyDone, setDailyDone] = useState(() => {
    try {
      return localStorage.getItem("mrzero_daily") === todayKey;
    } catch {
      return false;
    }
  });

  const [query, setQuery] = useState("");
  const [completedOnly, setCompletedOnly] = useState(false);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mrzero_favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [focus, setFocus] = useState(false);
  const [fontScale, setFontScale] = useState(() => {
    try {
      return Number(localStorage.getItem("mrzero_font_scale")) || 1;
    } catch {
      return 1;
    }
  });
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem("mrzero_notes") || "";
    } catch {
      return "";
    }
  });
  const [history, setHistory] = useState<SnapshotItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mrzero_history") || "[]");
    } catch {
      return [];
    }
  });
  const [execHistory, setExecHistory] = useState<ExecLogItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("mrzero_exec_history") || "[]");
    } catch {
      return [];
    }
  });
  const [streak, setStreak] = useState(() => {
    try {
      return Number(localStorage.getItem("mrzero_streak")) || 1;
    } catch {
      return 1;
    }
  });
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(() => {
    try {
      return Number(localStorage.getItem("mrzero_quiz_score")) || 0;
    } catch {
      return 0;
    }
  });

  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    try {
      return localStorage.getItem("mrzero_sound") !== "off";
    } catch {
      return true;
    }
  });
  const [highContrast, setHighContrast] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(0);
  const [challengeTimerRunning, setChallengeTimerRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [online, setOnline] = useState(() => navigator.onLine);

  const pyRef = useRef<PyodideInstance | null>(null);
  const gutRef = useRef<HTMLDivElement | null>(null);

  const fetchNasaBundle = useCallback(async (forceRefresh = false) => {
    setNasaLoading(true);
    setNasaError(null);
    try {
      const res = await fetch(`/api/nasa/bundle${forceRefresh ? "?refresh=1" : ""}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as NasaBundle;
      setBundle(data);
      setHolo(buildJsHoloDemo(data));
    } catch (e) {
      setNasaError(e instanceof Error ? e.message : "تعذر جلب بيانات ناسا الرسمية.");
    } finally {
      setNasaLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNasaBundle(false);
  }, [fetchNasaBundle]);

  const inspectNasaEntity = useCallback(
    async (kind: "model" | "asteroid" | "exoplanet", id: string, q?: string) => {
      setDossierOpen(true);
      setDossierLoading(true);
      setDossierError(null);
      setDossierProfile(null);
      try {
        const params = new URLSearchParams({ kind, id });
        if (q) params.set("q", q);
        const res = await fetch(`/api/nasa/profile?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const profile = (await res.json()) as NasaEntityProfile;
        setDossierProfile(profile);
      } catch (e) {
        setDossierError(e instanceof Error ? e.message : "تعذر جلب الملف الكامل من ناسا.");
      } finally {
        setDossierLoading(false);
      }
    },
    []
  );

  const loadSnippetIntoLab = useCallback(
    async (snippet: string, title: string) => {
      setUserEdited(true);
      setCode(snippet);
      setOut(null);
      setErr(null);
      setRunNotice(`تم تحميل كود تحليل: ${title}`);
      document.getElementById("lab-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (pyStatus === "ready" && pyRef.current) {
        const res = await runPy(pyRef.current, snippet);
        setOut(res.out);
        setVars(res.vars || []);
        if (res.holo && res.holo.length > 0) setHolo(res.holo);
      }
    },
    [pyStatus]
  );

  const lessons = useMemo(() => {
    if (!bundle) return [];
    return buildNasaLessons(bundle);
  }, [bundle]);

  const quizzes = useMemo(() => buildNasaQuizzes(bundle), [bundle]);

  const activeLesson = lessons[idx] || null;
  const dailyIdx = lessons.length ? Math.floor(Date.now() / 86400000) % lessons.length : 0;

  useEffect(() => {
    if (activeLesson && !userEdited) {
      setCode(activeLesson.starter);
    }
  }, [activeLesson, userEdited]);

  useEffect(() => {
    try {
      localStorage.setItem(PROG_KEY, JSON.stringify({ done, xp }));
    } catch {
      // ignore
    }
  }, [done, xp]);

  useEffect(() => {
    try {
      localStorage.setItem("mrzero_favorites", JSON.stringify(favorites));
      localStorage.setItem("mrzero_font_scale", String(fontScale));
      localStorage.setItem("mrzero_notes", notes);
      localStorage.setItem("mrzero_history", JSON.stringify(history));
      localStorage.setItem("mrzero_exec_history", JSON.stringify(execHistory));
      localStorage.setItem("mrzero_streak", String(streak));
      localStorage.setItem("mrzero_quiz_score", String(quizScore));
      localStorage.setItem("mrzero_sound", soundOn ? "on" : "off");
    } catch {
      // ignore
    }
  }, [favorites, fontScale, notes, history, execHistory, streak, quizScore, soundOn]);

  useEffect(() => {
    let alive = true;
    let stdlibBlobUrl: string | null = null;
    const timeoutId = setTimeout(() => {
      if (alive && !pyRef.current) setPyStatus("fallback");
    }, 35000);

    const bootPyodide = async () => {
      const win = window as unknown as {
        loadPyodide?: (cfg: {
          indexURL: string;
          stdLibURL?: string;
          stderr?: (msg: string) => void;
        }) => Promise<PyodideInstance>;
      };

      const pyBase = new URL(PY_URL, window.location.origin).toString();

      if (typeof win.loadPyodide !== "function") {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = `${pyBase}pyodide.js`;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load pyodide.js"));
          document.head.appendChild(s);
        });
      }

      if (typeof win.loadPyodide !== "function") {
        throw new Error("loadPyodide unavailable");
      }

      // Fetch and verify python_stdlib.zip header (PK\x03\x04) to avoid PYTHONHOME='/' corruption
      const zipRes = await fetch(`${pyBase}python_stdlib.zip`, { cache: "no-store" });
      if (!zipRes.ok) throw new Error(`stdlib HTTP ${zipRes.status}`);
      const zipBuf = await zipRes.arrayBuffer();
      const head = new Uint8Array(zipBuf, 0, 4);
      if (head.length < 4 || head[0] !== 0x50 || head[1] !== 0x4b || head[2] !== 0x03 || head[3] !== 0x04) {
        throw new Error("Invalid python_stdlib.zip header");
      }
      stdlibBlobUrl = URL.createObjectURL(new Blob([zipBuf], { type: "application/zip" }));

      const p = await win.loadPyodide({
        indexURL: pyBase,
        stdLibURL: stdlibBlobUrl,
        stderr: (msg: string) => console.warn("[Pyodide]", msg),
      });
      p.runPython(SNAP_SRC);
      if (alive) {
        pyRef.current = p;
        setPyStatus("ready");
      }
    };

    bootPyodide()
      .catch(() => {
        if (alive) setPyStatus("fallback");
      })
      .finally(() => {
        if (stdlibBlobUrl) {
          URL.revokeObjectURL(stdlibBlobUrl);
          stdlibBlobUrl = null;
        }
      });

    return () => {
      alive = false;
      clearTimeout(timeoutId);
      if (stdlibBlobUrl) URL.revokeObjectURL(stdlibBlobUrl);
    };
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setSessionSeconds((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!timerRunning || timer <= 0) return undefined;
    const id = setInterval(() => setTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [timerRunning, timer]);

  useEffect(() => {
    if (timer === 0 && timerRunning) {
      setTimerRunning(false);
      setRunNotice("انتهى مؤقت التركيز.");
    }
  }, [timer, timerRunning]);

  useEffect(() => {
    if (!challengeTimerRunning || challengeTimer <= 0) return undefined;
    const id = setInterval(() => setChallengeTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, [challengeTimerRunning, challengeTimer]);

  useEffect(() => {
    if (challengeTimer === 0 && challengeTimerRunning) {
      setChallengeTimerRunning(false);
      setRunNotice("انتهى وقت التحدي. راجع التلميح وأعد المحاولة.");
    }
  }, [challengeTimer, challengeTimerRunning]);

  const lines = code.split("\n").length;
  const codeStats = useMemo(
    () => ({
      chars: code.length,
      lines: code.split("\n").length,
      prints: (code.match(/print\s*\(/g) || []).length,
    }),
    [code]
  );
  const rev = useMemo(() => reviewCode(code), [code]);

  const rankIdx = RANKS.reduce((a, r, i) => (xp >= r.min ? i : a), 0);
  const rank = RANKS[rankIdx];
  const nextRank = RANKS[rankIdx + 1];
  const pct = nextRank ? Math.min(100, ((xp - rank.min) / (nextRank.min - rank.min)) * 100) : 100;

  const visibleLessons = useMemo(
    () =>
      lessons
        .map((lesson, i) => ({ ...lesson, i }))
        .filter(
          (lesson) =>
            (!completedOnly || done.includes(lesson.i)) &&
            (!query.trim() || (lesson.title + lesson.challenge + lesson.source).includes(query.trim()))
        ),
    [lessons, query, completedOnly, done]
  );

  const selectLesson = useCallback(
    (i: number) => {
      if (!lessons[i]) return;
      setHintLvl(0);
      setIdx(i);
      setUserEdited(false);
      setCode(lessons[i].starter);
      setOut(null);
      setVars([]);
      setErr(null);
      setChallengeTimer(0);
      setChallengeTimerRunning(false);
      setRunNotice("تم تحميل بيانات ناسا للدرس المحدد.");
    },
    [lessons]
  );

  const nextLesson = useCallback(() => {
    if (!lessons.length) return;
    selectLesson((idx + 1) % lessons.length);
  }, [idx, lessons.length, selectLesson]);

  const firstIncomplete = () => {
    const i = lessons.findIndex((_, n) => !done.includes(n));
    selectLesson(i < 0 ? 0 : i);
  };

  const randomLesson = () => {
    if (!lessons.length) return;
    selectLesson(Math.floor(Math.random() * lessons.length));
  };

  const run = useCallback(async () => {
    if (running || !activeLesson) return;
    if (/while\s+True\s*:/.test(code) && !/break/.test(code)) {
      setOut([]);
      setRunNotice("تم إيقاف التشغيل الآمن: أضف break إلى الحلقة أولاً.");
      setErr({
        type: "تحذير",
        line: null,
        src: "",
        detail: "",
        msg: "حلقة while True بلا break قد تجمّد المتصفح. أضف شرط خروج أولاً.",
      });
      return;
    }

    setRunning(true);
    setErr(null);
    setRunNotice("جارٍ تنفيذ الكود وتحليل الذاكرة...");
    const t0 = performance.now();
    const r = pyStatus === "ready" && pyRef.current ? await runPy(pyRef.current, code) : fallbackRun(code);
    setMs(Math.round(performance.now() - t0));
    setOut(r.out);
    setVars(r.vars || []);
    setExecHistory((items) =>
      [{ title: activeLesson.title, output: r.out, ok: !r.error, time: new Date().toLocaleTimeString("ar-EG") }, ...items].slice(0, 12)
    );

    if (pyStatus === "ready" && r.holo && r.holo.length > 0) {
      setHolo(r.holo);
    }

    const expected = activeLesson.expect.trim();
    const isMatched = r.out.some((line) => {
      const trimmed = line.trim();
      if (trimmed === expected) return true;
      const numA = Number(trimmed);
      const numB = Number(expected);
      return Number.isFinite(numA) && Number.isFinite(numB) && trimmed !== "" && Math.abs(numA - numB) < 0.05;
    });

    if (r.error) {
      setErr(explainError(r.error, code));
      setRunNotice("انتهى التشغيل مع خطأ — راجع التوضيح أسفل المخرجات.");
      playTone(220, 0.25, soundOn);
    } else if (isMatched) {
      if (!done.includes(idx)) {
        setDone((d) => [...d, idx]);
        setXp((x) => x + 100);
        setRunNotice("إجابة مطابقة لبيانات ناسا! +100 XP");
      } else {
        setRunNotice("إجابة صحيحة ومطابقة لبيانات ناسا.");
      }
      playTone(880, 0.12, soundOn);
      setTimeout(() => playTone(1320, 0.18, soundOn), 130);
      if (autoAdvance) setTimeout(nextLesson, 700);
    } else {
      setRunNotice("اكتمل التنفيذ. راجع المخرجات وقارنها بمهمة الدرس.");
    }

    if (!r.error && idx === dailyIdx && !dailyDone && isMatched) {
      setDailyDone(true);
      setXp((x) => x + 50);
      try {
        localStorage.setItem("mrzero_daily", todayKey);
      } catch {
        // ignore
      }
    }

    if (!r.error && !orbitBonus && r.holo && r.holo.some((h) => h.t === "satellite")) {
      setOrbitBonus(true);
      setXp((x) => x + 50);
      playTone(1100, 0.14, soundOn);
    }

    setRunning(false);
  }, [
    running,
    activeLesson,
    code,
    pyStatus,
    done,
    idx,
    soundOn,
    autoAdvance,
    nextLesson,
    dailyIdx,
    dailyDone,
    todayKey,
    orbitBonus,
  ]);

  useEffect(() => {
    const onShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [run]);

  const onEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const t = e.currentTarget;
    const s = t.selectionStart;
    setUserEdited(true);
    setCode(code.slice(0, s) + "    " + code.slice(t.selectionEnd));
    requestAnimationFrame(() => {
      t.selectionStart = t.selectionEnd = s + 4;
    });
  };

  const statusText: Record<string, string> = {
    loading: "جارٍ تحميل محرك Python...",
    ready: "● Python 3.12 جاهز",
    fallback: "● وضع التحليل المبسّط",
  };
  const statusTone: Record<string, string> = {
    loading: "text-amber-700",
    ready: "text-emerald-700",
    fallback: "text-blue-700",
  };

  return (
    <div className={`${highContrast ? "high-contrast " : ""}min-h-screen bg-[#f4f5fb] text-[#19233b]`} style={{ fontSize: `${fontScale}em` }}>
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-8">
          <a href="#lab-workspace" className="text-lg font-black tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            مستر زيرو
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#lab-workspace" className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              المختبر
            </a>
            <a href="#nasa-gallery" className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              معرض ناسا
            </a>
            <a href="#nasa-telemetry" className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              بيانات ناسا
            </a>
            <a href="#zero-pro" className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Zero Pro
            </a>
            <a
              href="/pitch-deck.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-700 font-semibold hover:text-violet-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              العرض التقديمي (7 شرائح)
            </a>
          </nav>

          <button
            type="button"
            onClick={() => fetchNasaBundle(true)}
            disabled={nasaLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {nasaLoading ? "جارٍ المزامنة..." : "تحديث بيانات ناسا"}
          </button>
        </div>
      </header>

      {/* Telemetry & Rank Strip */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className={`font-semibold ${statusTone[pyStatus]}`}>{statusText[pyStatus]}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-600">
              {bundle ? `واجهات ناسا الرسمية متصلة (${bundle.metrics.length} مؤشرات حية)` : "جارٍ الاتصال بواجهات ناسا..."}
            </span>
          </div>

          <div className="flex items-center gap-4 min-w-[210px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-emerald-700">{rank.name}</span>
                <span className="mono text-slate-600">{xp} XP</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="xp-bar h-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily NASA Challenge */}
      {lessons.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-amber-800">تحدي ناسا اليومي: {lessons[dailyIdx].title}</span>
            <span className="text-slate-600 flex-1 min-w-[220px]">{lessons[dailyIdx].challenge}</span>
            <span className={`font-semibold whitespace-nowrap ${dailyDone ? "text-emerald-700" : "text-slate-500"}`}>
              {dailyDone ? "مكتمل اليوم (+50 XP)" : "أكمله اليوم (+50 XP)"}
            </span>
          </div>
        </div>
      )}

      {/* Zero Pro Tools */}
      {lessons.length > 0 && (
        <ZeroProPanel
          lessons={lessons}
          idx={idx}
          done={done}
          xp={xp}
          streak={streak}
          quizScore={quizScore}
          reviewScore={rev.score}
          query={query}
          setQuery={setQuery}
          completedOnly={completedOnly}
          setCompletedOnly={(fn) => setCompletedOnly(fn)}
          favorites={favorites}
          toggleFavorite={(i) => setFavorites((items) => (items.includes(i) ? items.filter((v) => v !== i) : [...items, i]))}
          visibleCount={visibleLessons.length}
          focus={focus}
          setFocus={(fn) => setFocus(fn)}
          timer={timer}
          timerRunning={timerRunning}
          startFocusTimer={() => {
            setTimer(25 * 60);
            setTimerRunning(true);
            setFocus(true);
          }}
          stopFocusTimer={() => {
            setTimer(0);
            setTimerRunning(false);
          }}
          fontScale={fontScale}
          setFontScale={(fn) => setFontScale(fn)}
          history={history}
          saveSnapshot={() => {
            if (!activeLesson) return;
            setHistory((items) => [{ code, title: activeLesson.title, time: new Date().toLocaleString("ar-EG") }, ...items].slice(0, 8));
            setRunNotice("تم حفظ نسخة من الكود.");
          }}
          restoreSnapshot={(snap) => {
            setUserEdited(true);
            setCode(snap.code);
            setRunNotice("تم استرجاع النسخة المحفوظة.");
          }}
          execHistory={execHistory}
          clearExecHistory={() => setExecHistory([])}
          exportData={() => {
            const payload = { done, xp, favorites, notes, history, execHistory, quizScore, streak, exportedAt: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "mrzero-nasa-progress.json";
            a.click();
            URL.revokeObjectURL(a.href);
            setRunNotice("تم تصدير ملف التقدم.");
          }}
          importData={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "application/json";
            input.onchange = async () => {
              try {
                const file = input.files?.[0];
                if (!file) return;
                const payload = JSON.parse(await file.text());
                if (Array.isArray(payload.done)) setDone(payload.done);
                if (Number.isFinite(payload.xp)) setXp(payload.xp);
                if (Array.isArray(payload.favorites)) setFavorites(payload.favorites);
                if (typeof payload.notes === "string") setNotes(payload.notes);
                if (Array.isArray(payload.history)) setHistory(payload.history);
                if (Array.isArray(payload.execHistory)) setExecHistory(payload.execHistory);
                if (Number.isFinite(payload.quizScore)) setQuizScore(payload.quizScore);
                if (Number.isFinite(payload.streak)) setStreak(payload.streak);
                setRunNotice("تم استيراد التقدم بنجاح.");
              } catch {
                setRunNotice("ملف التقدم غير صالح.");
              }
            };
            input.click();
          }}
          clearProgress={() => {
            if (!confirmClear) {
              setConfirmClear(true);
              setRunNotice("اضغط تصفير التقدم مرة أخرى للتأكيد.");
              setTimeout(() => setConfirmClear(false), 4000);
              return;
            }
            setDone([]);
            setXp(0);
            setFavorites([]);
            setStreak(0);
            setConfirmClear(false);
            setRunNotice("تم تصفير التقدم.");
          }}
          nextLesson={nextLesson}
          firstIncomplete={firstIncomplete}
          randomLesson={randomLesson}
          copyChallenge={() => {
            if (!activeLesson) return;
            navigator.clipboard?.writeText(`${activeLesson.title}\n${activeLesson.challenge}`);
            setRunNotice("تم نسخ نص التحدي.");
          }}
          shareProgress={async () => {
            const text = `رتبتي ${rank.name} في Mr. Zero NASA Lab وأنجزت ${done.length}/${lessons.length} دروس بـ ${xp} XP.`;
            try {
              if (navigator.share) await navigator.share({ title: "Mr. Zero NASA Lab", text, url: window.location.href });
              else {
                await navigator.clipboard.writeText(text);
                setRunNotice("تم نسخ ملخص تقدمك.");
              }
            } catch {
              // ignore share cancel
            }
          }}
          challengeTimer={challengeTimer}
          startChallengeTimer={() => {
            setChallengeTimer(10 * 60);
            setChallengeTimerRunning(true);
          }}
          stopChallengeTimer={() => {
            setChallengeTimer(0);
            setChallengeTimerRunning(false);
          }}
          autoAdvance={autoAdvance}
          setAutoAdvance={setAutoAdvance}
          sessionSeconds={sessionSeconds}
          soundOn={soundOn}
          setSoundOn={(fn) => setSoundOn(fn)}
          highContrast={highContrast}
          setHighContrast={(fn) => setHighContrast(fn)}
          toggleFullscreen={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
            else document.exitFullscreen?.();
          }}
          showShortcuts={showShortcuts}
          setShowShortcuts={(fn) => setShowShortcuts(fn)}
          online={online}
          quizzes={quizzes}
          quizIndex={quizIndex}
          quizAnswer={quizAnswer}
          answerQuiz={(answerIdx) => {
            if (quizAnswer !== null) return;
            setQuizAnswer(answerIdx);
            if (answerIdx === quizzes[quizIndex % quizzes.length].answer) {
              setQuizScore((v) => v + 1);
              setXp((v) => v + 10);
              setRunNotice("إجابة صحيحة! +10 XP");
            } else {
              setRunNotice("إجابة غير صحيحة. راجع موجز ناسا أدناه.");
            }
          }}
          nextQuiz={() => {
            setQuizIndex((i) => (i + 1) % quizzes.length);
            setQuizAnswer(null);
          }}
          notes={notes}
          setNotes={setNotes}
        />
      )}

      {/* Lesson Navigation Strip */}
      <nav className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visibleLessons.map((l) => (
            <button
              key={l.i}
              type="button"
              onClick={() => selectLesson(l.i)}
              className={`shrink-0 px-3 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                l.i === idx
                  ? "border-violet-500 bg-violet-50 text-violet-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <span className="mono text-xs text-slate-500">{String(l.i + 1).padStart(2, "0")}</span>
              <span>{l.title}</span>
              {favorites.includes(l.i) && <span className="text-amber-600">★</span>}
              {done.includes(l.i) && <Check className="w-3.5 h-3.5 text-emerald-700" />}
            </button>
          ))}
          {!visibleLessons.length && lessons.length > 0 && (
            <span className="text-xs text-slate-500 py-2">لا توجد دروس مطابقة للبحث.</span>
          )}
        </div>
      </nav>

      {/* Printable Certificate on Full Completion */}
      {lessons.length > 0 && done.length === lessons.length && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="rounded-xl border border-emerald-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-900">
              أكملت مسار بيانات ناسا بالكامل · {xp} XP · رتبة {rank.name}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="اكتب الاسم للشهادة"
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-violet-500"
              />
              <button type="button" onClick={() => window.print()} className="glow-em px-4 py-2 rounded-lg text-xs font-bold">
                طباعة الشهادة
              </button>
            </div>
          </div>
          <div id="cert" className="mt-3 rounded-xl border-2 border-amber-400 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">شهادة إتمام مسار تحليل بيانات ناسا</p>
            <h2 className="text-3xl font-black text-slate-900 my-3">{childName || "اسم المتعلم"}</h2>
            <p className="text-slate-600">أتم جميع تحديات بايثون باستخدام واجهات برمجة تطبيقات ناسا الرسمية.</p>
            <p className="mono text-sm mt-4 text-emerald-700">XP: {xp}</p>
            <p className="text-xs text-slate-400 mt-2">{new Date().toLocaleDateString("ar-EG")}</p>
          </div>
        </div>
      )}

      {/* Main 3-Column Lab Workspace */}
      <main id="lab-workspace" className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Lesson Column (Right in RTL) */}
        <section className={`${focus ? "hidden " : ""}rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3 space-y-4`}>
          {activeLesson ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-violet-700 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  الدرس {idx + 1} من {lessons.length}
                </span>
                <span className="mono">{activeLesson.datasetTag}</span>
              </div>

              <h1 className="text-xl font-black text-slate-900 leading-snug">{activeLesson.title}</h1>
              <p className="text-sm leading-7 text-slate-600">{activeLesson.concept}</p>

              <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-3.5 space-y-1.5">
                <div className="font-bold text-violet-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  المهمة التطبيقية
                </div>
                <p className="text-sm leading-7 text-slate-800">{activeLesson.challenge}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(hintLvl + 1, 2);
                    setHintLvl(next);
                    setErr({
                      type: "hint",
                      msg:
                        next === 1
                          ? `تلميح الخطوة الأولى: ${activeLesson.challenge.split("،")[0]}`
                          : activeLesson.hint,
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-50 whitespace-nowrap"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  تلميح
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if ("speechSynthesis" in window) {
                      speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(`${activeLesson.concept} ${activeLesson.challenge}`);
                      u.lang = "ar";
                      speechSynthesis.speak(u);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  استمع
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserEdited(false);
                    setCode(activeLesson.starter);
                    setOut(null);
                    setVars([]);
                    setErr(null);
                    setRunNotice("تمت إعادة ضبط الكود.");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  إعادة
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                المصدر الرسمي: <span className="text-slate-700 font-medium">{activeLesson.source}</span>
              </p>

              {/* Official NASA Live Metrics Table */}
              {bundle && bundle.metrics.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h2 className="text-xs font-bold text-slate-700">قراءات ناسا الرسمية الحية</h2>
                  <div className="divide-y divide-slate-100">
                    {bundle.metrics.map((m, i) => (
                      <div key={i} className="py-2 flex items-baseline justify-between gap-2 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800">{m.label}</div>
                          <div className="text-[11px] text-slate-500">
                            {m.source} · <span className="mono">{m.date}</span>
                          </div>
                        </div>
                        <span className="mono font-bold text-violet-700 whitespace-nowrap shrink-0" dir="ltr">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500 py-6">جارٍ تحميل بيانات الدروس من واجهات ناسا الرسمية...</div>
          )}
        </section>

        {/* Center Column: Python Editor + Hologram + Console */}
        <section className={`${focus ? "lg:col-span-9 " : "lg:col-span-5 "}space-y-4`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-violet-700" />
                محرر Python
              </span>
              <div className="flex flex-wrap gap-1.5">
                {bundle && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setUserEdited(true);
                        setCode(buildNasaDemoCode(bundle));
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 whitespace-nowrap"
                    >
                      مثال ناسا
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserEdited(true);
                        setCode(buildHoloDemoCode(bundle));
                        if (pyStatus !== "ready") setHolo(buildJsHoloDemo(bundle));
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-cyan-200 text-cyan-800 hover:bg-cyan-50 whitespace-nowrap"
                    >
                      هولوجرام ISS
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserEdited(true);
                        setCode(buildSolarDemoCode(bundle));
                        if (pyStatus !== "ready") setHolo(buildJsSolarDemo(bundle));
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 whitespace-nowrap"
                    >
                      نظام شمسي JPL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserEdited(true);
                        setCode(buildGalleryDemoCode());
                        if (pyStatus !== "ready") setHolo(buildJsGalleryDemo());
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                    >
                      معرض 29 نموذج
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(code);
                    setRunNotice("تم نسخ الكود.");
                    playTone(990, 0.08, soundOn);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                >
                  نسخ
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0b1220] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#070d18] border-b border-slate-800 text-[11px] text-slate-400">
                <span className="mono" dir="ltr">
                  {codeStats.lines} lines · {codeStats.chars} chars · {codeStats.prints} print
                </span>
                <span className="mono" dir="ltr">
                  main.py · Ctrl/Cmd+Enter
                </span>
              </div>
              <div className="flex mono text-sm" dir="ltr">
                <div
                  ref={gutRef}
                  className="select-none text-right px-2.5 py-3 text-slate-500 bg-black/25 overflow-hidden h-64"
                  style={{ lineHeight: "1.6rem" }}
                >
                  {Array.from({ length: lines }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => {
                    setUserEdited(true);
                    setCode(e.target.value);
                  }}
                  onKeyDown={onEditorKeyDown}
                  onScroll={(e) => {
                    if (gutRef.current) gutRef.current.scrollTop = e.currentTarget.scrollTop;
                  }}
                  spellCheck={false}
                  dir="ltr"
                  className="flex-1 h-64 bg-transparent p-3 text-emerald-300 outline-none resize-none"
                  style={{ lineHeight: "1.6rem" }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={run}
              disabled={running || !activeLesson}
              className="glow-em w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {running ? "جارٍ التشغيل..." : "تشغيل وتحليل الكود"}
            </button>
            {runNotice && (
              <p className="text-xs text-center text-slate-600" role="status">
                {runNotice}
              </p>
            )}
          </div>

          {/* Output Console */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex justify-between items-center gap-3">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-700" />
                المخرجات
              </span>
              <div className="flex items-center gap-3">
                <span className="mono text-xs text-emerald-700">{ms !== null ? `${ms} ms` : ""}</span>
                {out !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setOut(null);
                      setRunNotice("تم مسح المخرجات.");
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    مسح
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-[#0b1220] border border-slate-800 p-3 mono text-xs min-h-[72px] whitespace-pre-wrap" dir="ltr">
              {out === null ? (
                <span className="text-slate-400">لم يُنفَّذ أي كود بعد.</span>
              ) : out.length === 0 ? (
                <span className="text-slate-400">انتهى التنفيذ بدون مخرجات.</span>
              ) : (
                out.map((l, i) => (
                  <div key={i} className="text-emerald-300">
                    {l}
                  </div>
                ))
              )}
            </div>

            {err && err.type !== "hint" && "detail" in err && (
              <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 space-y-1.5">
                <div className="font-bold text-sm text-rose-800">
                  {err.type}
                  {err.line ? ` · السطر ${err.line}` : ""}
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">{err.msg}</p>
                {err.src && (
                  <div className="mono text-xs bg-white border border-rose-200 rounded p-2 text-rose-800" dir="ltr">
                    {err.src}
                  </div>
                )}
                <p className="text-xs text-slate-600 mono" dir="ltr">
                  {err.detail}
                </p>
              </div>
            )}

            {err && err.type === "hint" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-sm space-y-1.5">
                <p className="font-bold text-amber-900">تلميح الحل:</p>
                <pre className="mono text-xs text-slate-800 whitespace-pre-wrap" dir="ltr">
                  {err.msg}
                </pre>
              </div>
            )}
          </div>

          {/* Interactive Hologram & 29 NASA Models */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-cyan-700" />
                شاشة الهولوجرام الفضائي
              </span>
              <span className="mono text-xs text-slate-500">{holo.length} عنصر</span>
            </div>
            <HologramStage
              items={holo}
              soundOn={soundOn}
              onInspectProfile={inspectNasaEntity}
              onLoadCode={loadSnippetIntoLab}
            />
          </div>
        </section>

        {/* Left Column in RTL: Memory Visualizer + Zero AI Code Reviewer */}
        <section className={`${focus ? "hidden " : ""}lg:col-span-4 space-y-4`}>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-violet-700" />
              لوحة حالة الذاكرة
            </span>
            {vars.length === 0 ? (
              <p className="text-xs text-slate-500">شغّل الكود لعرض المتغيرات وأنواعها وقيمها في الذاكرة.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vars.map(([name, type, value], i) => (
                  <div
                    key={name + i}
                    className={`rounded-lg border bg-[#0b1220] p-2.5 ${TYPE_STYLE[type] || "border-slate-700 text-slate-200"}`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="mono font-bold text-slate-100" dir="ltr">
                        {name}
                      </span>
                      <span className="mono text-[11px] text-slate-300" dir="ltr">
                        {type}
                      </span>
                    </div>
                    <div className="mono text-xs mt-1.5 truncate" dir="ltr" title={value}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-700" />
                المراجع الذكي (PEP 8)
              </span>
              <span
                className={`mono text-lg font-black ${
                  rev.score >= 80 ? "text-emerald-700" : rev.score >= 60 ? "text-amber-700" : "text-rose-700"
                }`}
              >
                {rev.score}
                <span className="text-xs text-slate-500">/100</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="xp-bar h-full" style={{ width: `${rev.score}%` }} />
            </div>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {rev.items.map((it, i) => (
                <li key={i} className="flex gap-2 text-xs leading-6 text-slate-700">
                  <span className="mt-1 shrink-0">
                    {it.l === "ok" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <AlertTriangle
                        className={`w-3.5 h-3.5 ${
                          it.l === "err" ? "text-rose-700" : it.l === "warn" ? "text-amber-700" : "text-blue-700"
                        }`}
                      />
                    )}
                  </span>
                  <span>{it.m}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* Live Official NASA APIs Explorer */}
      <NasaTelemetryDeck
        bundle={bundle}
        loading={nasaLoading}
        error={nasaError}
        onRefresh={() => fetchNasaBundle(true)}
        onInspectProfile={inspectNasaEntity}
      />

      <NasaDossierModal
        profile={dossierProfile}
        loading={dossierLoading}
        error={dossierError}
        open={dossierOpen}
        onClose={() => setDossierOpen(false)}
        onLoadCode={loadSnippetIntoLab}
      />
    </div>
  );
}
