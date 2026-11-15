import { useEffect, useState } from "react";
import { Code2, ExternalLink, Image as ImageIcon, Loader2, X } from "lucide-react";
import type { NasaEntityProfile } from "../types/nasa";

interface NasaDossierModalProps {
  profile: NasaEntityProfile | null;
  loading: boolean;
  error: string | null;
  open: boolean;
  onClose: () => void;
  onLoadCode: (snippet: string, title: string) => void;
}

export function NasaDossierModal({
  profile,
  loading,
  error,
  open,
  onClose,
  onLoadCode,
}: NasaDossierModalProps) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActivePhotoIdx(0);
    setFailedUrls({});
  }, [profile?.id, profile?.kind]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const images = profile?.images || [];
  const activeImage = images[activePhotoIdx] || images[0] || null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="ملف بيانات ناسا الكامل"
    >
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 bg-slate-50/70">
          <div className="min-w-0 space-y-1">
            <div className="text-xs text-slate-500 mono">
              {profile ? profile.sources.join(" · ") : "NASA Official Telemetry"}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {loading && !profile ? "جارٍ سحب جميع البيانات والصور من خوادم ناسا..." : profile?.title || "ملف ناسا"}
            </h2>
            {profile?.subtitle && (
              <p className="text-xs text-slate-600">{profile.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {profile?.pythonSnippet && (
              <button
                type="button"
                onClick={() => {
                  onLoadCode(profile.pythonSnippet, profile.title);
                  onClose();
                }}
                className="glow-em px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              >
                <Code2 className="w-3.5 h-3.5" />
                تحليل في محرر Python
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-6">
          {loading && !profile && (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-600 text-sm">
              <Loader2 className="w-6 h-6 animate-spin text-violet-700" />
              <span>جارٍ استعلام واجهات NASA/JPL والأرشيف الرسمي للصور...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          {profile && (
            <>
              {/* Gallery + Complete Physical/Orbital Specifications */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Photo Viewer & Gallery Strip */}
                <div className="lg:col-span-6 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-[#061224] overflow-hidden">
                    {activeImage && !failedUrls[activeImage.thumbUrl] ? (
                      <img
                        src={activeImage.thumbUrl}
                        alt={activeImage.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedUrls((prev) => ({ ...prev, [activeImage.thumbUrl]: true }))
                        }
                        className="w-full h-64 sm:h-72 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 sm:h-72 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                        <ImageIcon className="w-6 h-6" />
                        <span>لا توجد صورة معاينة متاحة لهذا الاستعلام في أرشيف NASA Images</span>
                      </div>
                    )}
                    {activeImage && (
                      <div className="p-3.5 bg-[#09182e] text-slate-100 space-y-1.5 border-t border-slate-800">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-cyan-300 mono">
                          <span>
                            {activeImage.center} · {activeImage.nasaId}
                          </span>
                          <span>{activeImage.dateCreated}</span>
                        </div>
                        <div className="text-xs font-bold text-white leading-snug">{activeImage.title}</div>
                        {activeImage.description && (
                          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                            {activeImage.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-600">
                        أرشيف الصور الرسمي ({images.length} صور من NASA Images API)
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {images.map((img, i) => (
                          <button
                            key={img.nasaId + i}
                            type="button"
                            onClick={() => setActivePhotoIdx(i)}
                            className={`rounded-lg overflow-hidden border transition-colors ${
                              i === activePhotoIdx
                                ? "border-violet-600 ring-2 ring-violet-500/30"
                                : "border-slate-200 hover:border-slate-400"
                            }`}
                            title={img.title}
                          >
                            {!failedUrls[img.thumbUrl] ? (
                              <img
                                src={img.thumbUrl}
                                alt={img.title}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setFailedUrls((prev) => ({ ...prev, [img.thumbUrl]: true }))
                                }
                                className="w-full h-12 object-cover"
                              />
                            ) : (
                              <div className="w-full h-12 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                                NASA
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Specs & Live Vector */}
                <div className="lg:col-span-6 space-y-4">
                  {profile.liveVector && (
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-950">متجه الحالة اللحظي (JPL Horizons)</span>
                        <span className="mono text-cyan-800" dir="ltr">
                          {profile.liveVector.epoch}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="rounded-lg bg-white border border-cyan-100 p-2.5">
                          <div className="text-slate-500">السرعة المدارية</div>
                          <div className="mono text-base font-black text-slate-900 mt-0.5" dir="ltr">
                            {profile.liveVector.velocityKms} km/s
                          </div>
                        </div>
                        <div className="rounded-lg bg-white border border-cyan-100 p-2.5">
                          <div className="text-slate-500">البُعد اللحظي</div>
                          <div className="mono text-base font-black text-slate-900 mt-0.5" dir="ltr">
                            {profile.liveVector.distanceAu && profile.liveVector.distanceAu > 0.05
                              ? `${profile.liveVector.distanceAu} AU`
                              : `${profile.liveVector.distanceKm?.toLocaleString("en-US")} km`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-800">
                      المواصفات الفيزيائية والمدارية الكاملة
                    </div>
                    {profile.specs.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {profile.specs.map((sp, i) => (
                          <div key={i} className="px-3.5 py-2 flex items-baseline justify-between gap-3 text-xs">
                            <span className="text-slate-600">{sp.label}</span>
                            <span className="mono font-bold text-slate-900 text-left" dir="ltr">
                              {sp.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 text-xs text-slate-500">
                        بيانات وصفية وأرشيفية واردة من NASA Images API.
                      </div>
                    )}
                  </div>

                  {profile.horizonsSummary && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                      <div className="text-[11px] font-bold text-slate-700">ملخص سجل NASA/JPL Horizons</div>
                      <p className="mono text-[11px] text-slate-600 leading-relaxed break-words" dir="ltr">
                        {profile.horizonsSummary}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asteroid SBDB Orbital Elements Table */}
              {profile.sbdbElements && profile.sbdbElements.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">العناصر المدارية التفصيلية (NASA/JPL SBDB)</h3>
                    <span className="text-xs text-slate-500 mono">Osculating Elements</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {profile.sbdbElements.map((el) => (
                      <div key={el.name} className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                        <div className="text-slate-500 truncate" title={el.title}>
                          {el.title} ({el.name})
                        </div>
                        <div className="mono font-bold text-slate-900 mt-1" dir="ltr">
                          {el.value} {el.units}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ISS 24h Horizons Trajectory */}
              {profile.issTrajectory && profile.issTrajectory.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900">مسار المحطة الدولية خلال 24 ساعة (NASA/JPL Horizons)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 font-medium">التوقيت (UTC)</th>
                          <th className="py-2 font-medium">الارتفاع (km)</th>
                          <th className="py-2 font-medium">السرعة (km/s)</th>
                          <th className="py-2 font-medium">البُعد عن مركز الأرض (km)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.issTrajectory.map((s) => (
                          <tr key={s.epoch}>
                            <td className="py-2 mono text-slate-700" dir="ltr">{s.epoch}</td>
                            <td className="py-2 mono font-bold text-violet-700" dir="ltr">{s.altitudeKm}</td>
                            <td className="py-2 mono font-bold text-cyan-700" dir="ltr">{s.velocityKms}</td>
                            <td className="py-2 mono text-slate-600" dir="ltr">{s.rangeKm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mars REMS Weather + Perseverance Photos when viewing Mars/Rovers */}
              {profile.marsWeatherSols && profile.marsWeatherSols.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">أحدث قراءات طقس المريخ — فوهة غيل (Curiosity REMS)</h3>
                    <span className="text-xs text-slate-500 mono">mars.nasa.gov</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 font-medium">Sol</th>
                          <th className="py-2 font-medium">التاريخ الأرضي</th>
                          <th className="py-2 font-medium">الصغرى (°C)</th>
                          <th className="py-2 font-medium">العظمى (°C)</th>
                          <th className="py-2 font-medium">الضغط (Pa)</th>
                          <th className="py-2 font-medium">الشمس / الغبار</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profile.marsWeatherSols.map((sol) => (
                          <tr key={sol.sol}>
                            <td className="py-2 mono font-bold text-slate-900" dir="ltr">Sol {sol.sol}</td>
                            <td className="py-2 mono text-slate-600" dir="ltr">{sol.terrestrialDate}</td>
                            <td className="py-2 mono text-cyan-700 font-semibold" dir="ltr">{sol.minTempC ?? "—"}</td>
                            <td className="py-2 mono text-amber-700 font-semibold" dir="ltr">{sol.maxTempC ?? "—"}</td>
                            <td className="py-2 mono text-slate-700" dir="ltr">{sol.pressurePa ?? "—"}</td>
                            <td className="py-2 text-slate-600">{sol.atmoOpacity} · {sol.uvIndex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {profile.marsRoverPhotos && profile.marsRoverPhotos.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">أحدث الصور الخام من سطح المريخ (Perseverance Mars 2020)</h3>
                    <span className="text-xs text-slate-500 mono">Jezero Crater</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {profile.marsRoverPhotos.slice(0, 6).map((rp) => (
                      <div key={rp.id} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                        <img
                          src={rp.imageUrl}
                          alt={rp.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-28 object-cover"
                        />
                        <div className="p-2 text-[11px] space-y-0.5">
                          <div className="font-bold text-slate-800 truncate">{rp.camera} · Sol {rp.sol}</div>
                          <div className="mono text-slate-500">{rp.dateTakenUtc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready Python Code Preview */}
              <div className="rounded-xl border border-slate-800 bg-[#0b1220] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    مقطع Python جاهز لتحليل هذا الجرم
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadCode(profile.pythonSnippet, profile.title);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                  >
                    تشغيل في المختبر
                  </button>
                </div>
                <pre className="mono text-xs text-emerald-300 whitespace-pre-wrap overflow-x-auto" dir="ltr">
                  {profile.pythonSnippet}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
