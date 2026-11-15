import type { HoloItem } from "../types/nasa";

export const PY_URL = "/pyodide/";
export function getPyodideBaseUrl(): string {
  return typeof window !== "undefined" ? new URL(PY_URL, window.location.origin).toString() : PY_URL;
}

export const HOLO_SRC = `import json
_HOLO = []
def draw_orbit(cx, cy, r, color="#22d3ee"):
    _HOLO.append({"t": "orbit", "x": cx, "y": cy, "r": r, "c": color})
def draw_planet(x, y, r, color="#f59e0b", label=""):
    _HOLO.append({"t": "planet", "x": x, "y": y, "r": r, "c": color, "l": label})
def draw_earth(x, y, r, label="Earth"):
    _HOLO.append({"t": "earth", "x": x, "y": y, "r": r, "l": label})
def draw_sun(x, y, r, label="Sun"):
    _HOLO.append({"t": "sun", "x": x, "y": y, "r": r, "l": label})
def draw_satellite(cx, cy, r, dur=8, color="#f59e0b", size=3):
    _HOLO.append({"t": "satellite", "x": cx, "y": cy, "r": r, "dur": dur, "c": color, "pr": size})
def draw_rocket(x, y, angle=0, color="#e0f2fe"):
    _HOLO.append({"t": "rocket", "x": x, "y": y, "a": angle, "c": color})
def draw_line(x1, y1, x2, y2, color="#22d3ee"):
    _HOLO.append({"t": "line", "x1": x1, "y1": y1, "x2": x2, "y2": y2, "c": color})
def draw_text(x, y, text, color="#e0f2fe"):
    _HOLO.append({"t": "text", "x": x, "y": y, "s": str(text), "c": color})
def draw_shape(name, x, y, size=30, color="#22d3ee"):
    _HOLO.append({"t": "shape", "n": name, "x": x, "y": y, "s": size, "c": color})
def holo_flush():
    return json.dumps(_HOLO)`;

export const SNAP_SRC = `import json, types
def snap(ns):
    o = []
    for k, v in ns.items():
        if k.startswith('_') or isinstance(v, (types.ModuleType, types.FunctionType, type)):
            continue
        try:
            r = repr(v)
        except Exception:
            r = '?'
        o.append([k, type(v).__name__, r[:160]])
    return json.dumps(o, ensure_ascii=False)`;

export interface PyRunResult {
  out: string[];
  vars: Array<[string, string, string]>;
  holo?: HoloItem[];
  error?: string;
}

export interface PyodideInstance {
  globals: { get: (k: string) => { (): Record<string, unknown>; destroy?: () => void } };
  setStdout: (cfg: { batched: (s: string) => void }) => void;
  setStderr: (cfg: { batched: (s: string) => void }) => void;
  runPython: (code: string, opts?: { globals?: unknown }) => string;
  runPythonAsync: (code: string, opts?: { globals?: unknown }) => Promise<unknown>;
}

export async function runPy(p: PyodideInstance, code: string): Promise<PyRunResult> {
  const out: string[] = [];
  p.setStdout({ batched: (s) => out.push(s) });
  p.setStderr({ batched: (s) => out.push(s) });
  const dictCtor = p.globals.get("dict") as unknown as () => {
    get: (k: string) => () => string;
    destroy: () => void;
  };
  const ns = dictCtor();
  try {
    p.runPython(HOLO_SRC, { globals: ns });
    await p.runPythonAsync(code, { globals: ns });
    let holo: HoloItem[] = [];
    try {
      holo = JSON.parse(ns.get("holo_flush")()) as HoloItem[];
    } catch {
      holo = [];
    }
    const snapFn = p.globals.get("snap") as unknown as (n: unknown) => string;
    return {
      out,
      vars: JSON.parse(snapFn(ns)) as Array<[string, string, string]>,
      holo,
    };
  } catch (e) {
    return {
      out,
      vars: [],
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    ns.destroy();
  }
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q: string | null = null;
  for (const ch of s) {
    if (q) {
      cur += ch;
      if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") {
      q = ch;
      cur += ch;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function fallbackRun(code: string): PyRunResult {
  const vars: Record<string, [string, string, string]> = {};
  const out: string[] = [];
  const lit = (s: string): [string, string] | null => {
    const t = s.trim();
    if (/^-?\d+$/.test(t)) return ["int", t];
    if (/^-?\d+\.\d+$/.test(t)) return ["float", t];
    if (/^(True|False)$/.test(t)) return ["bool", t];
    if (/^(["']).*\1$/.test(t)) return ["str", t];
    if (/^\[.*\]$/.test(t)) return ["list", t];
    if (/^\{.*\}$/.test(t)) return ["dict", t];
    return null;
  };
  const env: Record<string, string> = {};
  code.split("\n").forEach((raw) => {
    const t = raw.trim().replace(/\s+#[^"']*$/, "");
    const assignMatch = t.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    const printMatch = t.match(/^print\((.*)\)$/);
    if (assignMatch && lit(assignMatch[2])) {
      const parsed = lit(assignMatch[2])!;
      vars[assignMatch[1]] = [assignMatch[1], parsed[0], parsed[1]];
      env[assignMatch[1]] = parsed[1];
    } else if (printMatch) {
      const parts = splitArgs(printMatch[1]).map((a) => {
        if (/^(["']).*\1$/.test(a)) return a.slice(1, -1);
        if (env[a] !== undefined) return String(env[a]).replace(/^(["'])(.*)\1$/, "$2");
        return "(تعبير يتطلب تحميل محرك Pyodide)";
      });
      out.push(parts.join(" "));
    } else if (/^draw_/.test(t)) {
      if (!out.some((x) => x.startsWith("ملاحظة:"))) {
        out.push("ملاحظة: أوامر الرسم الهولوجرامي تعمل مع محرك Python الكامل.");
      }
    }
  });
  return { out, vars: Object.values(vars) };
}

export interface ExplainedError {
  type: string;
  detail: string;
  line: number | null;
  src: string;
  msg: string;
}

export function explainError(msg: string, code: string): ExplainedError {
  const locs = [...msg.matchAll(/File "<exec>", line (\d+)/g)];
  const ln = locs.length ? +locs[locs.length - 1][1] : null;
  const errs = [...msg.matchAll(/(\w+(?:Error|Exception|Interrupt)):\s*(.*)/g)];
  const type = errs.length ? errs[errs.length - 1][1] : "Error";
  const detail = errs.length ? errs[errs.length - 1][2] : msg.split("\n").pop() || msg;
  const src = ln ? (code.split("\n")[ln - 1] || "").trim() : "";
  const at = ln ? `في السطر ${ln}` : "";
  const map: Record<string, string> = {
    SyntaxError: `خطأ في الصياغة ${at}: تحقق من الأقواس وعلامات التنصيص، وتأكد من وجود النقطتين : بعد if و for و def.`,
    IndentationError: `خطأ في المسافات البادئة ${at}: الأسطر داخل الكتلة يجب أن تُزاح بالتساوي (4 مسافات).`,
    NameError: `اسم غير معرّف ${at}: استخدمت متغيراً قبل تعريفه، أو كتبت اسمه بشكل مختلف.`,
    ZeroDivisionError: `القسمة على صفر ${at}: تحقق من قيمة المقام قبل القسمة.`,
    TypeError: `نوع بيانات غير متوافق ${at}، مثل جمع نص مع رقم. استخدم str() أو int() للتحويل.`,
    IndexError: `الفهرس خارج حدود القائمة ${at}: الفهرس يبدأ من 0 وينتهي عند len(القائمة) - 1.`,
    KeyError: `المفتاح غير موجود في القاموس ${at}: تأكد من اسم المفتاح، أو استخدم get().`,
    AttributeError: `الكائن لا يملك هذه الخاصية أو الدالة ${at}.`,
  };
  return {
    type,
    detail,
    line: ln,
    src,
    msg: map[type] || `حدث خطأ ${at}. راجع الرسالة التفصيلية أدناه.`,
  };
}

export interface ReviewResult {
  score: number;
  items: Array<{ l: "err" | "warn" | "tip" | "ok"; m: string }>;
}

export function reviewCode(code: string): ReviewResult {
  if (!code.trim()) {
    return { score: 0, items: [{ l: "warn", m: "المحرر فارغ. ابدأ بكتابة أول سطر." }] };
  }
  const items: Array<{ l: "err" | "warn" | "tip" | "ok"; m: string }> = [];
  const ls = code.split("\n");
  ls.forEach((ln, i) => {
    const n = i + 1;
    if (ln.length > 79) {
      items.push({ l: "warn", m: `السطر ${n} أطول من 79 حرفاً؛ قسّمه لتحسين القراءة.` });
    }
    if (/except\s*:/.test(ln)) {
      items.push({ l: "err", m: `السطر ${n}: except عامة تخفي الأخطاء؛ حدّد النوع مثل except ValueError.` });
    }
    if (/[=!]=\s*(True|False|None)\b/.test(ln)) {
      items.push({ l: "warn", m: `السطر ${n}: استخدم is None أو الشرط المباشر بدلاً من == True/None.` });
    }
    if (/range\(len\(/.test(ln)) {
      items.push({ l: "tip", m: `السطر ${n}: عند الحاجة للفهرس والقيمة معاً استخدم enumerate().` });
    }
    if (/def\s+\w+\([^)]*=\s*(\[\]|\{\})/.test(ln)) {
      items.push({ l: "err", m: `السطر ${n}: القيمة الافتراضية [] أو {} تُشارَك بين الاستدعاءات؛ استخدم None.` });
    }
    if (/\b[a-z]+[A-Z]\w*\s*=/.test(ln)) {
      items.push({ l: "tip", m: `السطر ${n}: في بايثون تُكتب أسماء المتغيرات بـ snake_case مثل total_score.` });
    }
    if (/import\s+\*/.test(ln)) {
      items.push({ l: "err", m: `السطر ${n}: الاستيراد * يلوّث الفضاء العام؛ استورد ما تحتاجه فقط.` });
    }
    if (/^\s*def\s/.test(ln) && !/"""|'''/.test(ls[i + 1] || "")) {
      items.push({ l: "tip", m: `السطر ${n}: أضف docstring تشرح وظيفة الدالة.` });
    }
  });
  if (!/print\(/.test(code)) {
    items.push({ l: "warn", m: "لا يوجد print، لن ترى أي مخرجات." });
  }
  const cnt = (k: "err" | "warn" | "tip") => items.filter((i) => i.l === k).length;
  const score = Math.max(30, 100 - cnt("err") * 15 - cnt("warn") * 7 - cnt("tip") * 3);
  if (!items.length) {
    items.push({ l: "ok", m: "كود نظيف ومطابق لقواعد PEP 8." });
  }
  return { score, items };
}

let audioCtx: AudioContext | null = null;
export function playTone(freq: number, dur = 0.14, enabled = true) {
  if (!enabled) return;
  try {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = audioCtx || new AudioCtor();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + dur);
  } catch {
    // ignore audio restrictions
  }
}
