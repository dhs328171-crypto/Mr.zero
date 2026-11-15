import React, { useEffect, useRef, useState } from "react";
import { NASA_GALLERY_MODELS } from "../data/nasaLessons";
import type { HoloItem, NasaImageItem } from "../types/nasa";
import { playTone } from "../utils/pythonEngine";

const holoStars = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 97) % 400,
  y: (i * 53) % 300,
  r: 0.5 + (i % 3) * 0.4,
  d: (i % 7) * 0.5,
}));

const NASA_SHAPES: Record<string, () => React.ReactNode> = {
  earth: () => (
    <>
      <circle r="32" fill="url(#atmo)" />
      <circle r="26" fill="url(#earthG)" />
      <path d="M-8 -8 q6 -4 10 2 t-2 10 q-6 2 -8 -4z" fill="#34d399" fillOpacity=".75" />
    </>
  ),
  moon: () => (
    <>
      <circle r="22" fill="#d1d5db" />
      <circle cx="-7" cy="-5" r="4" fill="#9ca3af" />
      <circle cx="8" cy="6" r="3" fill="#9ca3af" />
      <circle cx="4" cy="-9" r="2.5" fill="#9ca3af" />
    </>
  ),
  mars: () => (
    <>
      <circle r="22" fill="#f87171" />
      <ellipse cx="-4" cy="4" rx="9" ry="5" fill="#991b1b" fillOpacity=".4" />
    </>
  ),
  sun: () => (
    <>
      <circle r="38" fill="url(#sunG)" />
      <circle r="22" fill="#fde68a" />
    </>
  ),
  saturn: () => (
    <>
      <ellipse rx="36" ry="9" fill="none" stroke="#fde68a" strokeWidth="3" strokeOpacity=".7" />
      <circle r="16" fill="#fdba74" />
    </>
  ),
  jupiter: () => (
    <>
      <circle r="26" fill="#fdba74" />
      <path d="M-26 -6 H26 M-26 6 H26" stroke="#b45309" strokeOpacity=".5" strokeWidth="3" />
      <ellipse cx="8" cy="10" rx="5" ry="3" fill="#dc2626" fillOpacity=".75" />
    </>
  ),
  mercury: () => <circle r="11" fill="#cbd5e1" />,
  venus: () => (
    <>
      <circle r="20" fill="#fde68a" />
      <path d="M-16 -4 Q0 -10 16 -4 M-14 6 Q0 12 14 6" fill="none" stroke="#f59e0b" strokeOpacity=".55" strokeWidth="2" />
    </>
  ),
  uranus: () => (
    <>
      <ellipse rx="8" ry="32" fill="none" stroke="#67e8f9" strokeWidth="2" strokeOpacity=".6" />
      <circle r="17" fill="#a5f3fc" />
    </>
  ),
  neptune: () => (
    <>
      <circle r="19" fill="#3b82f6" />
      <path d="M-15 -3 H15" stroke="#93c5fd" strokeWidth="2" strokeOpacity=".6" />
    </>
  ),
  pluto: () => (
    <>
      <circle r="12" fill="#d6d3d1" />
      <ellipse cx="2" cy="2" rx="5" ry="4" fill="#fef3c7" fillOpacity=".6" />
    </>
  ),
  iss: () => (
    <>
      <rect x="-4" y="-22" width="8" height="44" fill="#e0f2fe" />
      <rect x="-32" y="-10" width="24" height="20" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />
      <rect x="8" y="-10" width="24" height="20" fill="#2563eb" stroke="#93c5fd" strokeWidth="1" />
      <circle r="5" fill="#f59e0b" />
    </>
  ),
  jwst: () => (
    <>
      <polygon points="0,-24 22,10 -22,10" fill="#fde68a" fillOpacity=".25" stroke="#fde68a" strokeWidth="2" />
      <polygon points="0,-16 8,-4 0,8 -8,-4" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1.5" />
      <path d="M-26 14 H26" stroke="#c084fc" strokeWidth="3" />
    </>
  ),
  hubble: () => (
    <>
      <rect x="-8" y="-20" width="16" height="38" rx="3" fill="#cbd5e1" />
      <rect x="-28" y="-6" width="18" height="10" fill="#1d4ed8" stroke="#93c5fd" />
      <rect x="10" y="-6" width="18" height="10" fill="#1d4ed8" stroke="#93c5fd" />
      <circle cx="0" cy="-20" r="6" fill="#22d3ee" fillOpacity=".6" />
    </>
  ),
  voyager: () => (
    <>
      <ellipse cx="0" cy="-8" rx="18" ry="8" fill="none" stroke="#e0f2fe" strokeWidth="3" />
      <line x1="0" y1="0" x2="24" y2="20" stroke="#94a3b8" strokeWidth="2" />
      <line x1="0" y1="0" x2="-22" y2="18" stroke="#67e8f9" strokeWidth="2" />
      <circle cx="0" cy="4" r="5" fill="#f59e0b" />
    </>
  ),
  perseverance: () => (
    <>
      <rect x="-18" y="-8" width="36" height="16" rx="3" fill="#e2e8f0" />
      <circle cx="-14" cy="12" r="5" fill="#64748b" />
      <circle cx="0" cy="12" r="5" fill="#64748b" />
      <circle cx="14" cy="12" r="5" fill="#64748b" />
      <path d="M-6 -8 V-20 H6" fill="none" stroke="#22d3ee" strokeWidth="2.5" />
    </>
  ),
  curiosity: () => (
    <>
      <rect x="-16" y="-6" width="32" height="14" rx="2" fill="#cbd5e1" />
      <circle cx="-12" cy="12" r="4.5" fill="#94a3b8" />
      <circle cx="0" cy="12" r="4.5" fill="#94a3b8" />
      <circle cx="12" cy="12" r="4.5" fill="#94a3b8" />
      <path d="M8 -6 V-18 L18 -14" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
    </>
  ),
  artemis_sls: () => (
    <>
      <rect x="-5" y="-28" width="10" height="44" rx="3" fill="#f8fafc" />
      <rect x="-13" y="-12" width="5" height="28" fill="#cbd5e1" />
      <rect x="8" y="-12" width="5" height="28" fill="#cbd5e1" />
      <path d="M-8 16 L0 30 L8 16 Z" fill="#f59e0b" className="flicker" />
    </>
  ),
  orion_capsule: () => (
    <>
      <polygon points="0,-22 18,4 -18,4" fill="#e0f2fe" stroke="#67e8f9" strokeWidth="2" />
      <rect x="-14" y="4" width="28" height="10" fill="#475569" />
      <path d="M-26 9 H-14 M14 9 H26" stroke="#3b82f6" strokeWidth="3" />
    </>
  ),
  dscovr_epic: () => (
    <>
      <rect x="-8" y="-10" width="16" height="20" rx="2" fill="#e0f2fe" />
      <rect x="-30" y="-5" width="18" height="10" fill="#2563eb" />
      <rect x="12" y="-5" width="18" height="10" fill="#2563eb" />
      <circle cx="0" cy="16" r="5" fill="#22d3ee" />
    </>
  ),
  parker_probe: () => (
    <>
      <ellipse cx="0" cy="-16" rx="20" ry="5" fill="#fde68a" />
      <polygon points="-10,-12 10,-12 6,14 -6,14" fill="#94a3b8" />
      <path d="M-22 10 L-8 4 M22 10 L8 4" stroke="#60a5fa" strokeWidth="3" />
    </>
  ),
  chandra: () => (
    <>
      <polygon points="0,-24 10,16 -10,16" fill="#cbd5e1" />
      <rect x="-28" y="-2" width="20" height="8" fill="#3b82f6" />
      <rect x="8" y="-2" width="20" height="8" fill="#3b82f6" />
      <circle cx="0" cy="-24" r="4" fill="#c084fc" />
    </>
  ),
  osiris_rex: () => (
    <>
      <rect x="-10" y="-10" width="20" height="18" fill="#e2e8f0" />
      <rect x="-30" y="-8" width="16" height="14" fill="#1d4ed8" />
      <rect x="14" y="-8" width="16" height="14" fill="#1d4ed8" />
      <path d="M0 8 V24" stroke="#f59e0b" strokeWidth="3" />
      <circle cx="0" cy="25" r="4" fill="#fde68a" />
    </>
  ),
  comet: () => (
    <>
      <path d="M-24 14 Q0 0 22 -14" stroke="#67e8f9" strokeWidth="8" strokeOpacity=".35" strokeLinecap="round" />
      <circle cx="-18" cy="12" r="7" fill="#e0f2fe" />
    </>
  ),
  asteroid: () => (
    <polygon points="-18,-8 -4,-18 16,-10 20,8 4,18 -16,12" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" />
  ),
  black_hole: () => (
    <>
      <ellipse rx="32" ry="10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeOpacity=".75" />
      <circle r="12" fill="#020617" stroke="#fbbf24" strokeWidth="2" />
    </>
  ),
  galaxy: () => (
    <>
      <path d="M-26 8 C -16 -18, 16 -18, 26 8 M-20 -10 C -8 18, 8 18, 20 -10" fill="none" stroke="#67e8f9" strokeWidth="3" />
      <circle r="5" fill="#fde68a" />
    </>
  ),
  nebula: () => (
    <>
      <circle cx="-8" cy="-4" r="20" fill="#a855f7" fillOpacity=".3" />
      <circle cx="10" cy="6" r="18" fill="#22d3ee" fillOpacity=".3" />
      <circle cx="2" cy="-10" r="10" fill="#f472b6" fillOpacity=".35" />
    </>
  ),
  exoplanet: () => (
    <>
      <circle r="20" fill="#0d9488" />
      <ellipse rx="32" ry="8" fill="none" stroke="#67e8f9" strokeDasharray="3 4" />
      <circle cx="28" cy="2" r="4" fill="#fde68a" />
    </>
  ),
};

function drawItem(it: HoloItem, i: number) {
  switch (it.t) {
    case "orbit":
      return (
        <circle
          key={i}
          cx={it.x}
          cy={it.y}
          r={it.r}
          fill="none"
          stroke={it.c || "#22d3ee"}
          strokeOpacity=".55"
          strokeDasharray="3 5"
          className="flow"
        />
      );
    case "earth":
      return (
        <g key={i}>
          <circle cx={it.x} cy={it.y} r={(it.r || 50) + 6} fill="url(#atmo)" />
          <circle cx={it.x} cy={it.y} r={it.r} fill="url(#earthG)" />
          <text x={it.x} y={(it.y || 0) + (it.r || 50) + 14} fill="#e0f2fe" fontSize="10" textAnchor="middle">
            {it.l}
          </text>
        </g>
      );
    case "sun":
      return (
        <g key={i}>
          <circle cx={it.x} cy={it.y} r={(it.r || 15) * 2.2} fill="url(#sunG)" />
          <circle cx={it.x} cy={it.y} r={it.r} fill="#fde68a" />
        </g>
      );
    case "planet":
      return <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={it.c} fillOpacity=".9" />;
    case "satellite":
      return (
        <circle key={i} cx={(it.x || 0) + (it.r || 40)} cy={it.y} r={it.pr || 3} fill={it.c || "#f59e0b"}>
          <animateMotion
            dur={`${it.dur || 8}s`}
            repeatCount="indefinite"
            path={`M 0 0 a ${it.r} ${it.r} 0 1 0 ${-2 * (it.r || 40)} 0 a ${it.r} ${it.r} 0 1 0 ${2 * (it.r || 40)} 0`}
          />
        </circle>
      );
    case "rocket":
      return (
        <g key={i} transform={`translate(${it.x} ${it.y}) rotate(${it.a || 0})`}>
          <path d="M0 -12 L5 6 L0 3 L-5 6 Z" fill={it.c || "#e0f2fe"} />
          <path d="M-3 6 L0 16 L3 6 Z" fill="#f59e0b" className="flicker" />
        </g>
      );
    case "line":
      return <line key={i} x1={it.x1} y1={it.y1} x2={it.x2} y2={it.y2} stroke={it.c || "#22d3ee"} strokeDasharray="6 4" className="flow" />;
    case "text":
      return (
        <text key={i} x={it.x} y={it.y} fill={it.c || "#e0f2fe"} fontSize="11">
          {String(it.s ?? "")}
        </text>
      );
    case "shape": {
      const S = it.n ? NASA_SHAPES[it.n] : null;
      return (
        <g key={i} transform={`translate(${it.x} ${it.y}) scale(${(Number(it.s) || 30) / 30})`}>
          {S ? S() : null}
        </g>
      );
    }
    default:
      return null;
  }
}

interface HologramStageProps {
  items: HoloItem[];
  soundOn: boolean;
  onInspectProfile: (kind: "model" | "asteroid" | "exoplanet", id: string, q?: string) => void;
  onLoadCode: (snippet: string, title: string) => void;
}

export function HologramStage({ items, soundOn, onInspectProfile, onLoadCode }: HologramStageProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<"cyan" | "violet" | "amber">("cyan");
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  const [selectedId, setSelectedId] = useState("iss");
  const [filter, setFilter] = useState("");
  const [modelProfile, setModelProfile] = useState<import("../types/nasa").NasaEntityProfile | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);

  const themes = {
    cyan: ["#06304a", "#021019", "#22d3ee"],
    violet: ["#2b174d", "#10051c", "#c084fc"],
    amber: ["#4a2a06", "#1c0d02", "#fbbf24"],
  };
  const palette = themes[theme];

  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const activeModel = NASA_GALLERY_MODELS.find((m) => m.id === selectedId) || NASA_GALLERY_MODELS[0];
  const filteredModels = NASA_GALLERY_MODELS.filter((m) => {
    const q = filter.trim().toLowerCase();
    return !q || m.id.includes(q) || m.titleAr.toLowerCase().includes(q);
  });

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    setPhotoIdx(0);
    fetch(
      `/api/nasa/profile?kind=model&id=${encodeURIComponent(activeModel.id)}&q=${encodeURIComponent(activeModel.nasaQuery)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setModelProfile(data || null);
        }
      })
      .catch(() => {
        if (!cancelled) setModelProfile(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeModel.id, activeModel.nasaQuery]);

  const nasaPhoto: NasaImageItem | null = modelProfile?.images?.[photoIdx] || modelProfile?.images?.[0] || null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setTilt((v) => ({
      x: Math.max(-22, Math.min(22, v.x + dx * 0.25)),
      y: Math.max(-18, Math.min(18, v.y + dy * 0.25)),
    }));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };

  const release = () => {
    dragRef.current = null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-cyan-800 font-semibold">اسحب داخل المجسم للدوران · عجلة الماوس للتكبير</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTilt({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            توسيط
          </button>
          <button
            type="button"
            onClick={() => setShowGrid((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            شبكة
          </button>
          <button
            type="button"
            onClick={() => setShowAxes((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            محاور
          </button>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "cyan" | "violet" | "amber")}
            aria-label="نمط الهولوجرام"
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700"
          >
            <option value="cyan">Cyan Lab</option>
            <option value="violet">Violet Lab</option>
            <option value="amber">Amber Lab</option>
          </select>
        </div>
      </div>

      <div
        className="relative rounded-xl overflow-hidden border border-cyan-500/30 cursor-grab active:cursor-grabbing"
        style={{ background: `radial-gradient(ellipse at center, ${palette[0]} 0%, ${palette[1]} 85%)` }}
        dir="ltr"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((v) => Math.max(0.75, Math.min(1.45, +(v - e.deltaY * 0.001).toFixed(2))));
        }}
      >
        <svg viewBox="0 0 400 300" className="w-full h-72 select-none">
          <defs>
            <radialGradient id="earthG" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="45%" stopColor="#1d4ed8" />
              <stop offset="100%" stopColor="#0b1d4a" />
            </radialGradient>
            <radialGradient id="atmo">
              <stop offset="72%" stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity=".6" />
            </radialGradient>
            <radialGradient id="sunG">
              <stop offset="0%" stopColor="#fde68a" stopOpacity=".9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
            <pattern id="holoGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke={palette[2]} strokeOpacity=".14" />
            </pattern>
            <filter id="holoGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {showGrid && <rect width="400" height="300" fill="url(#holoGrid)" />}
          {holoStars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#e0f2fe" className="twinkle" style={{ animationDelay: `${s.d}s` }} />
          ))}
          <g transform={`translate(200 150) rotate(${tilt.x}) skewX(${tilt.y / 5}) scale(${zoom}) translate(-200 -150)`} filter="url(#holoGlow)">
            {showAxes && (
              <>
                <line x1="30" y1="270" x2="105" y2="270" stroke="#f87171" strokeWidth="1.5" />
                <line x1="30" y1="270" x2="30" y2="195" stroke="#4ade80" strokeWidth="1.5" />
                <line x1="30" y1="270" x2="6" y2="294" stroke="#60a5fa" strokeWidth="1.5" />
                <text x="110" y="273" fill="#f87171" fontSize="8">X</text>
                <text x="28" y="190" fill="#4ade80" fontSize="8">Y</text>
                <text x="2" y="298" fill="#60a5fa" fontSize="8">Z</text>
              </>
            )}
            {items.map(drawItem)}
            <ellipse cx="200" cy="260" rx="95" ry="10" fill="none" stroke={palette[2]} strokeOpacity=".18" strokeDasharray="4 5" />
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 scan-lines" />
        <div className="pointer-events-none absolute inset-x-0 scan-sweep" />
        <span className="absolute top-2.5 left-3 text-[11px] text-cyan-200 mono">NASA HOLOGRAM STAGE</span>
        <span className="absolute top-2.5 right-3 text-[11px] text-cyan-200 mono">Z {Math.round(zoom * 100)}%</span>
      </div>

      {/* 29 NASA Mission & Celestial Models + Full Official Data & Photos Preview */}
      <div id="nasa-gallery" className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              معرض مهام وأجرام ناسا — {NASA_GALLERY_MODELS.length} نموذجاً
            </h3>
            <p className="text-xs text-slate-500">اختر أي جرم أو مهمة لجلب كامل مواصفاته الفيزيائية والمدارية وألبوم صوره من ناسا فوراً.</p>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="ابحث في النماذج..."
            className="w-36 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto">
          {filteredModels.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelectedId(m.id);
                playTone(660, 0.08, soundOn);
              }}
              className={`min-h-9 text-xs px-2 py-1 rounded-lg border truncate transition-colors ${
                selectedId === m.id
                  ? "border-violet-500 bg-violet-50 text-violet-800 font-bold"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
              title={m.titleAr}
            >
              {m.titleAr}
            </button>
          ))}
        </div>

        {/* Complete Inline Selected Model Dossier */}
        <div className="rounded-xl border border-slate-200 bg-[#071a2a] p-3.5 text-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-3 flex items-center justify-center rounded-lg bg-[#04101b] p-2" dir="ltr">
              <svg viewBox="-50 -50 100 100" className="h-24 w-24 shrink-0">
                <defs>
                  <radialGradient id="previewGlow">
                    <stop stopColor="#67e8f9" stopOpacity=".55" />
                    <stop offset="1" stopColor="#071a2a" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle r="45" fill="url(#previewGlow)" />
                <g className="spin-slow" style={{ transformOrigin: "0 0" }}>
                  {NASA_SHAPES[activeModel.id]?.()}
                </g>
              </svg>
            </div>
            <div className="sm:col-span-5 flex flex-col justify-center space-y-1">
              <div className="text-sm font-bold text-cyan-200">
                {modelProfile?.title || activeModel.titleAr}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                {modelProfile?.subtitle || activeModel.missionSummary}
              </div>
              <div className="text-[11px] text-cyan-300/80 mono pt-1">
                {nasaPhoto ? `${nasaPhoto.center} · ${nasaPhoto.nasaId} · ${nasaPhoto.dateCreated}` : "NASA/JPL & NASA Images API"}
              </div>
            </div>
            <div className="sm:col-span-4">
              {profileLoading && !nasaPhoto ? (
                <div className="h-28 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                  جارٍ جلب الصور والبيانات...
                </div>
              ) : nasaPhoto ? (
                <button
                  type="button"
                  onClick={() => onInspectProfile("model", activeModel.id, activeModel.nasaQuery)}
                  className="block w-full text-right group"
                  title="اضغط لعرض الملف الكامل والألبوم بالحجم الكامل"
                >
                  <img
                    src={nasaPhoto.thumbUrl}
                    alt={nasaPhoto.title}
                    referrerPolicy="no-referrer"
                    className="h-28 w-full object-cover rounded-lg border border-cyan-500/30 group-hover:border-cyan-300 transition-colors"
                  />
                </button>
              ) : (
                <div className="h-28 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-center text-xs text-slate-400 text-center px-2">
                  أرشيف NASA Images API
                </div>
              )}
            </div>
          </div>

          {/* Clickable Photo Strip of ALL returned NASA Images */}
          {modelProfile && modelProfile.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
              {modelProfile.images.map((img, i) => (
                <button
                  key={img.nasaId + i}
                  type="button"
                  onClick={() => setPhotoIdx(i)}
                  className={`rounded overflow-hidden border ${
                    i === photoIdx ? "border-cyan-300 ring-1 ring-cyan-300" : "border-slate-700 opacity-75 hover:opacity-100"
                  }`}
                  title={img.title}
                >
                  <img
                    src={img.thumbUrl}
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-10 object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Complete Horizons / NASA Specs Preview Grid */}
          {modelProfile && modelProfile.specs.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] pt-1 border-t border-cyan-900/60">
              {modelProfile.specs.slice(0, 6).map((sp, i) => (
                <div key={i} className="rounded-lg bg-[#04101b]/90 px-2.5 py-1.5 border border-cyan-950">
                  <div className="text-slate-400 truncate">{sp.label}</div>
                  <div className="mono font-bold text-cyan-200 truncate" dir="ltr">{sp.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-slate-400">
              {modelProfile
                ? `${modelProfile.images.length} صور · ${modelProfile.specs.length} مؤشرات فيزيائية/مدارية`
                : "جارٍ سحب البيانات الكاملة..."}
            </span>
            <div className="flex flex-wrap gap-2">
              {modelProfile?.pythonSnippet && (
                <button
                  type="button"
                  onClick={() => onLoadCode(modelProfile.pythonSnippet, modelProfile.title)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold hover:bg-emerald-500/30 whitespace-nowrap"
                >
                  تحميل في محرر Python
                </button>
              )}
              <button
                type="button"
                onClick={() => onInspectProfile("model", activeModel.id, activeModel.nasaQuery)}
                className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 whitespace-nowrap"
              >
                عرض الملف الكامل ({modelProfile ? modelProfile.specs.length + modelProfile.images.length : "NASA"})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
