import { useState } from "react";
import type { NasaBundle } from "../types/nasa";

interface NasaTelemetryDeckProps {
  bundle: NasaBundle | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onInspectProfile: (kind: "model" | "asteroid" | "exoplanet", id: string, q?: string) => void;
}

export function NasaTelemetryDeck({
  bundle,
  loading,
  error,
  onRefresh,
  onInspectProfile,
}: NasaTelemetryDeckProps) {
  const [apodIdx, setApodIdx] = useState(0);
  const [marsPhotoIdx, setMarsPhotoIdx] = useState(0);

  if (loading && !bundle) {
    return (
      <section id="nasa-telemetry" className="max-w-7xl mx-auto px-4 pb-10">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          جارٍ جلب القياسات الحية من واجهات برمجة تطبيقات ناسا الرسمية...
        </div>
      </section>
    );
  }

  if (error && !bundle) {
    return (
      <section id="nasa-telemetry" className="max-w-7xl mx-auto px-4 pb-10">
        <div className="rounded-xl border border-rose-200 bg-white p-6 flex items-center justify-between gap-4">
          <div className="text-sm text-rose-700">{error}</div>
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
          >
            إعادة المحاولة
          </button>
        </div>
      </section>
    );
  }

  if (!bundle) return null;

  const gallery = bundle.apodGallery && bundle.apodGallery.length > 0 ? bundle.apodGallery : bundle.apod ? [bundle.apod] : [];
  const activeApod = gallery[apodIdx] || gallery[0] || null;
  const marsItems = bundle.marsPhotos?.items || [];
  const activeMarsPhoto = marsItems[marsPhotoIdx] || marsItems[0] || null;

  return (
    <section id="nasa-telemetry" className="max-w-7xl mx-auto px-4 pb-12 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">مركز القياسات والأرصاد الحية من ناسا</h2>
          <p className="text-xs text-slate-500 mt-1">
            جميع القيم والجداول والصور واردة مباشرة من خوادم ناسا الرسمية · اضغط على أي كويكب أو كوكب أو جرم لعرض ملفه الكامل وصوره
            <span className="mx-1.5">·</span>
            <span className="mono">{new Date(bundle.fetchedAt).toLocaleTimeString("ar-EG")}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "جارٍ التحديث..." : "تحديث القراءات من ناسا"}
        </button>
      </div>

      {/* Media Row: DSCOVR EPIC + Interactive APOD / Deep Space Observatory Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bundle.epic && (
          <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 bg-[#061224] rounded-lg overflow-hidden">
                <img
                  src={bundle.epic.imageUrl}
                  alt={bundle.epic.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-contain"
                />
              </div>
              <div className="sm:col-span-7 space-y-2">
                <div className="text-xs text-slate-500">
                  <span>{bundle.epic.source}</span>
                  <span className="mx-1.5">·</span>
                  <span className="mono">{bundle.epic.date}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">صورة الأرض الكاملة من مرصد DSCOVR EPIC</h3>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-slate-500">بعد المرصد عن الأرض</div>
                    <div className="mono text-sm font-bold text-slate-900 mt-0.5" dir="ltr">
                      {bundle.epic.dscovrDistanceKm.toLocaleString("en-US")} km
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <div className="text-slate-500">إحداثيات المركز</div>
                    <div className="mono text-sm font-bold text-slate-900 mt-0.5" dir="ltr">
                      {bundle.epic.lat}°, {bundle.epic.lon}°
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectProfile("model", "earth", "DSCOVR EPIC Earth")}
                  className="text-xs font-semibold text-violet-700 hover:text-violet-900 hover:underline underline-offset-4"
                >
                  عرض ملف الأرض الكامل وألبوم EPIC ←
                </button>
              </div>
            </div>
          </article>
        )}

        {activeApod && (
          <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 bg-[#061224] rounded-lg overflow-hidden">
                <img
                  src={activeApod.url}
                  alt={activeApod.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="sm:col-span-7 space-y-2">
                <div className="text-xs text-slate-500">
                  <span>{activeApod.source}</span>
                  <span className="mx-1.5">·</span>
                  <span className="mono">{activeApod.date}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeApod.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{activeApod.explanation}</p>
              </div>
            </div>
            {gallery.length > 1 && (
              <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-100">
                {gallery.map((g, i) => (
                  <button
                    key={g.url + i}
                    type="button"
                    onClick={() => setApodIdx(i)}
                    className={`rounded-lg overflow-hidden border transition-colors ${
                      i === apodIdx ? "border-violet-600 ring-2 ring-violet-500/30" : "border-slate-200 opacity-80 hover:opacity-100"
                    }`}
                    title={g.title}
                  >
                    <img
                      src={g.url}
                      alt={g.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-11 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </article>
        )}
      </div>

      {/* Mars Weather (Curiosity REMS) & Perseverance Mars 2020 Raw Photos */}
      {(bundle.marsWeather || bundle.marsPhotos) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bundle.marsWeather && bundle.marsWeather.sols.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">طقس المريخ الحي — {bundle.marsWeather.rover}</h3>
                  <p className="text-xs text-slate-500">{bundle.marsWeather.source}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectProfile("model", "curiosity", "Curiosity Rover Gale Crater")}
                  className="text-xs font-semibold text-violet-700 hover:underline underline-offset-4 whitespace-nowrap"
                >
                  ملف المريخ الكامل ←
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 font-medium">Sol</th>
                      <th className="py-2 font-medium">التاريخ</th>
                      <th className="py-2 font-medium">الصغرى (°C)</th>
                      <th className="py-2 font-medium">العظمى (°C)</th>
                      <th className="py-2 font-medium">الضغط (Pa)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bundle.marsWeather.sols.slice(0, 6).map((sol) => (
                      <tr key={sol.sol}>
                        <td className="py-2 font-bold text-slate-900 mono" dir="ltr">Sol {sol.sol}</td>
                        <td className="py-2 text-slate-600 mono" dir="ltr">{sol.terrestrialDate}</td>
                        <td className="py-2 text-cyan-700 font-semibold mono" dir="ltr">{sol.minTempC ?? "—"}</td>
                        <td className="py-2 text-amber-700 font-semibold mono" dir="ltr">{sol.maxTempC ?? "—"}</td>
                        <td className="py-2 text-slate-700 mono" dir="ltr">{sol.pressurePa ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeMarsPhoto && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">صور سطح المريخ — {bundle.marsPhotos?.rover}</h3>
                  <p className="text-xs text-slate-500">
                    {activeMarsPhoto.camera} · Sol {activeMarsPhoto.sol} · <span className="mono">{activeMarsPhoto.dateTakenUtc}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectProfile("model", "perseverance", "Perseverance Mars Rover")}
                  className="text-xs font-semibold text-violet-700 hover:underline underline-offset-4 whitespace-nowrap"
                >
                  ملف Perseverance الكامل ←
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-7 bg-[#061224] rounded-lg overflow-hidden">
                  <img
                    src={activeMarsPhoto.imageUrl}
                    alt={activeMarsPhoto.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover"
                  />
                </div>
                <div className="sm:col-span-5 space-y-2">
                  <div className="text-xs font-bold text-slate-900 leading-snug">{activeMarsPhoto.title}</div>
                  {activeMarsPhoto.caption && (
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-4">{activeMarsPhoto.caption}</p>
                  )}
                  <div className="text-[11px] text-slate-500 mono">{activeMarsPhoto.credit}</div>
                </div>
              </div>
              {marsItems.length > 1 && (
                <div className="grid grid-cols-6 gap-1.5 pt-1 border-t border-slate-100">
                  {marsItems.map((rp, i) => (
                    <button
                      key={rp.id + i}
                      type="button"
                      onClick={() => setMarsPhotoIdx(i)}
                      className={`rounded-lg overflow-hidden border transition-colors ${
                        i === marsPhotoIdx ? "border-violet-600 ring-2 ring-violet-500/30" : "border-slate-200 opacity-80 hover:opacity-100"
                      }`}
                      title={`${rp.camera} · Sol ${rp.sol}`}
                    >
                      <img
                        src={rp.imageUrl}
                        alt={rp.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-11 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Asteroid NeoWs Feed when available */}
      {bundle.neows && bundle.neows.items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">رادار الكويكبات اليومي (NASA NeoWs Feed)</h3>
              <p className="text-xs text-slate-500">اضغط على أي كويكب لجلب مداره الكامل ومعطياته الفيزيائية وصوره</p>
            </div>
            <span className="text-xs text-slate-500 mono">{bundle.neows.elementCount} جرم قريب اليوم</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 font-medium">الكويكب</th>
                  <th className="py-2 font-medium">القطر التقديري (m)</th>
                  <th className="py-2 font-medium">المسافة (km)</th>
                  <th className="py-2 font-medium">السرعة (km/s)</th>
                  <th className="py-2 font-medium">التصنيف</th>
                  <th className="py-2 font-medium">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bundle.neows.items.slice(0, 6).map((neo) => (
                  <tr
                    key={neo.id}
                    onClick={() => onInspectProfile("asteroid", neo.name.replace(/[()]/g, ""), `asteroid ${neo.name}`)}
                    className="hover:bg-violet-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 font-semibold text-slate-900 mono" dir="ltr">{neo.name}</td>
                    <td className="py-2 text-slate-700 mono" dir="ltr">{neo.diameterMinM}–{neo.diameterMaxM}</td>
                    <td className="py-2 text-violet-700 font-semibold mono" dir="ltr">
                      {neo.missDistanceKm.toLocaleString("en-US")}
                    </td>
                    <td className="py-2 text-cyan-700 font-semibold mono" dir="ltr">{neo.velocityKms}</td>
                    <td className={`py-2 font-semibold ${neo.hazardous ? "text-rose-700" : "text-emerald-700"}`}>
                      {neo.hazardous ? "خطر محتمل (PHA)" : "آمن"}
                    </td>
                    <td className="py-2 text-violet-700 font-semibold whitespace-nowrap">عرض الملف الكامل ←</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Tables Row: Clickable JPL SBDB Close Approaches + Clickable NASA Exoplanet Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bundle.sbdb && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">الأجرام القريبة من الأرض (NASA/JPL SBDB CAD)</h3>
                <p className="text-[11px] text-slate-500">اضغط على أي جرم لفتح ملفه المداري الكامل وألبوم صوره</p>
              </div>
              <span className="text-xs text-slate-500 mono">{bundle.sbdb.totalUpcoming} رصد</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">الجرم</th>
                    <th className="py-2 font-medium">تاريخ الاقتراب</th>
                    <th className="py-2 font-medium">المسافة (AU)</th>
                    <th className="py-2 font-medium">السرعة (km/s)</th>
                    <th className="py-2 font-medium">الملف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bundle.sbdb.items.slice(0, 6).map((item) => (
                    <tr
                      key={item.des + item.cd}
                      onClick={() => onInspectProfile("asteroid", item.des, `asteroid ${item.des}`)}
                      className="hover:bg-violet-50/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2 font-semibold text-slate-800 mono" dir="ltr">{item.des}</td>
                      <td className="py-2 text-slate-600 mono" dir="ltr">{item.cd}</td>
                      <td className="py-2 text-violet-700 font-semibold mono" dir="ltr">{item.distAu}</td>
                      <td className="py-2 text-cyan-700 font-semibold mono" dir="ltr">{item.vRelKms}</td>
                      <td className="py-2 text-violet-700 font-semibold whitespace-nowrap">كامل البيانات ←</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {bundle.exoplanets && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">أحدث الكواكب الخارجية (NASA Exoplanet Archive)</h3>
                <p className="text-[11px] text-slate-500">اضغط على أي كوكب لجلب خصائص نجمه المضيف وكتلته وحرارته</p>
              </div>
              <span className="text-xs text-slate-500 mono">TAP API</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">الكوكب</th>
                    <th className="py-2 font-medium">نصف القطر (R⊕)</th>
                    <th className="py-2 font-medium">الدورة (يوم)</th>
                    <th className="py-2 font-medium">الطريقة</th>
                    <th className="py-2 font-medium">الملف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bundle.exoplanets.items.slice(0, 6).map((p) => (
                    <tr
                      key={p.name}
                      onClick={() => onInspectProfile("exoplanet", p.name, "NASA Exoplanet Kepler TESS")}
                      className="hover:bg-violet-50/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2 font-semibold text-slate-800 mono" dir="ltr">{p.name}</td>
                      <td className="py-2 text-violet-700 font-semibold mono" dir="ltr">
                        {p.radiusEarth !== null ? p.radiusEarth : "—"}
                      </td>
                      <td className="py-2 text-cyan-700 font-semibold mono" dir="ltr">
                        {p.orbitalPeriodDays !== null ? p.orbitalPeriodDays : "—"}
                      </td>
                      <td className="py-2 text-slate-600">{p.method}</td>
                      <td className="py-2 text-violet-700 font-semibold whitespace-nowrap">كامل البيانات ←</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* EONET & NASA POWER Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bundle.eonet && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">الظواهر الطبيعية المرصودة (NASA EONET v3)</h3>
              <span className="text-xs text-slate-500 mono">{bundle.eonet.count} أحداث مفتوحة</span>
            </div>
            <ul className="divide-y divide-slate-100 text-xs">
              {bundle.eonet.events.slice(0, 4).map((ev) => (
                <li key={ev.id} className="py-2 flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800 truncate">{ev.title}</span>
                  <span className="text-slate-500 whitespace-nowrap shrink-0 mono">
                    {ev.category} · {ev.date}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {bundle.power && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">رصد الغلاف الجوي (NASA Langley POWER)</h3>
              <span className="text-xs text-slate-500 mono">{bundle.power.location}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {bundle.power.series.slice(-4).map((pt) => (
                <div key={pt.date} className="rounded-lg bg-slate-50 p-2.5">
                  <div className="mono text-[11px] text-slate-500">{pt.date}</div>
                  <div className="mono text-sm font-bold text-slate-900 mt-1">
                    {pt.tempC !== null ? `${pt.tempC} °C` : "قيد المعالجة"}
                  </div>
                  <div className="mono text-[11px] text-cyan-700 mt-0.5">
                    {pt.solarKwhM2 !== null ? `${pt.solarKwhM2} kWh/m²` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
