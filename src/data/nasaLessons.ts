import type { HoloItem, NasaBundle, NasaLesson, NasaQuizItem } from "../types/nasa";

export interface NasaGalleryModel {
  id: string;
  titleAr: string;
  nasaQuery: string;
  missionSummary: string;
}

export const NASA_GALLERY_MODELS: NasaGalleryModel[] = [
  { id: "earth", titleAr: "الأرض (مرصد EPIC)", nasaQuery: "DSCOVR EPIC Earth", missionSummary: "رصد الغلاف الجوي والمحيطات عبر مرصد DSCOVR التابع لناسا وNOAA." },
  { id: "moon", titleAr: "القمر (برنامج Artemis)", nasaQuery: "Artemis Moon NASA", missionSummary: "هدف رحلات أرتميس لاستكشاف القطب الجنوبي القمري." },
  { id: "mars", titleAr: "المريخ (MRO)", nasaQuery: "Mars Reconnaissance Orbiter", missionSummary: "الكوكب الأحمر المرصود بمركبات ناسا المدارية والجوالة." },
  { id: "sun", titleAr: "الشمس (مرصد SDO)", nasaQuery: "Solar Dynamics Observatory Sun", missionSummary: "مرصد ديناميكا الشمس SDO لمتابعة التوهجات الشمسية." },
  { id: "saturn", titleAr: "زحل (مهمة Cassini)", nasaQuery: "Cassini Saturn rings", missionSummary: "كوكب الحلقات الجليدية الذي استكشفته مركبة كاسيني-هويجنز." },
  { id: "jupiter", titleAr: "المشتري (مهمة Juno)", nasaQuery: "Juno Jupiter", missionSummary: "عملاق النظام الشمسي تحت عدسة مسبار جونو القطبي." },
  { id: "mercury", titleAr: "عطارد (MESSENGER)", nasaQuery: "MESSENGER Mercury NASA", missionSummary: "أقرب الكواكب إلى الشمس ورُسمت خرائطه بمهمة ماسنجر." },
  { id: "venus", titleAr: "الزهرة (Magellan)", nasaQuery: "Magellan Venus radar", missionSummary: "كوكب الزهرة المرصود برادار مهمة ماجلان." },
  { id: "uranus", titleAr: "أورانوس (Voyager 2)", nasaQuery: "Voyager 2 Uranus", missionSummary: "الكوكب الجليدي المائل الذي زارته فوييجر 2 عام 1986." },
  { id: "neptune", titleAr: "نبتون (Voyager 2)", nasaQuery: "Voyager 2 Neptune", missionSummary: "أبعد كواكب النظام الشمسي برياح تفوق سرعة الصوت." },
  { id: "pluto", titleAr: "بلوتو (New Horizons)", nasaQuery: "New Horizons Pluto", missionSummary: "الكوكب القزم الذي صورته مركبة نيو هورايزونز بدقة عالية." },
  { id: "iss", titleAr: "محطة الفضاء الدولية", nasaQuery: "International Space Station orbit", missionSummary: "مختبر ناسا المداري على ارتفاع ~420 كم حول الأرض." },
  { id: "jwst", titleAr: "تلسكوب جيمس ويب", nasaQuery: "James Webb Space Telescope", missionSummary: "تلسكوب الأشعة تحت الحمراء لاستكشاف المجرات الأولى." },
  { id: "hubble", titleAr: "تلسكوب هابل", nasaQuery: "Hubble Space Telescope", missionSummary: "أيقونة الرصد البصري المداري منذ عام 1990." },
  { id: "voyager", titleAr: "مسبار فوييجر", nasaQuery: "Voyager interstellar", missionSummary: "أبعد مركبة من صنع البشر في الفضاء بين النجمي." },
  { id: "perseverance", titleAr: "بيرسيفيرانس", nasaQuery: "Perseverance Mars Rover", missionSummary: "المركبة الجوالة في فوهة جيزيرو لجمع عينات المريخ." },
  { id: "curiosity", titleAr: "كيوريوسيتي", nasaQuery: "Curiosity Rover Gale Crater", missionSummary: "مختبر علوم المريخ في فوهة غيل منذ 2012." },
  { id: "artemis_sls", titleAr: "صاروخ SLS أرتميس", nasaQuery: "Space Launch System Artemis", missionSummary: "نظام الإطلاق الفضائي فائق الثقل لرحلات القمر والمريخ." },
  { id: "orion_capsule", titleAr: "كبسولة أوريون", nasaQuery: "Orion spacecraft NASA", missionSummary: "مركبة الطاقم المخصصة لمهام الفضاء العميق." },
  { id: "dscovr_epic", titleAr: "مرصد DSCOVR", nasaQuery: "DSCOVR spacecraft", missionSummary: "مرصد نقطة لاغرانج L1 على بُعد ~1.5 مليون كم." },
  { id: "parker_probe", titleAr: "مسبار باركر الشمسي", nasaQuery: "Parker Solar Probe", missionSummary: "أسرع مركبة بشرية تلامس الهالة الشمسية." },
  { id: "chandra", titleAr: "مرصد شاندرا", nasaQuery: "Chandra X-ray Observatory", missionSummary: "تلسكوب الأشعة السينية لرصد الثقوب السوداء والمستعرات." },
  { id: "osiris_rex", titleAr: "مهمة OSIRIS-REx", nasaQuery: "OSIRIS-REx Bennu asteroid", missionSummary: "مهمة جلب عينات من الكويكب بينو." },
  { id: "comet", titleAr: "المذنبات (JPL SBDB)", nasaQuery: "NASA comet NEOWISE", missionSummary: "أجرام جليدية تتبع مدارات إهليلجية مرصودة في قاعدة JPL." },
  { id: "asteroid", titleAr: "الكويكبات القريبة", nasaQuery: "NASA asteroid Bennu", missionSummary: "أجرام قريبة من الأرض تتابعها شبكة JPL CNEOS." },
  { id: "black_hole", titleAr: "الثقوب السوداء", nasaQuery: "NASA black hole visualization", missionSummary: "ظواهر الجاذبية القصوى المرصودة عبر شاندرا وNuSTAR." },
  { id: "galaxy", titleAr: "المجرات (JWST/Hubble)", nasaQuery: "Hubble spiral galaxy", missionSummary: "تجمعات مليارات النجوم المرصودة في مسوحات ناسا العميقة." },
  { id: "nebula", titleAr: "السدم الكونية", nasaQuery: "Carina Nebula Webb", missionSummary: "سحب الغاز والغبار المولّدة للنجوم بعدسة جيمس ويب." },
  { id: "exoplanet", titleAr: "الكواكب الخارجية", nasaQuery: "Kepler exoplanet", missionSummary: "عوالم تدور حول نجوم أخرى في أرشيف NASA Exoplanet Archive." },
];

export const NASA_SHAPE_NAMES = NASA_GALLERY_MODELS.map((m) => m.id);

export function buildNasaLessons(bundle: NasaBundle): NasaLesson[] {
  const issAlt = bundle.iss?.current?.altitudeKm ?? 420.0;
  const issVel = bundle.iss?.current?.velocityKms ?? 7.66;
  const issSamples = (bundle.iss?.samples || []).map((s) => s.altitudeKm).slice(0, 6);
  const altSeries = issSamples.length >= 3 ? issSamples : [issAlt];
  const altMean = Number((altSeries.reduce((a, b) => a + b, 0) / altSeries.length).toFixed(1));

  // Mars Weather Curiosity REMS primary; fallback to NASA POWER if Mars Weather unavailable
  const marsSol = bundle.marsWeather?.sols?.[0];
  const hasMarsTemp = marsSol && marsSol.maxTempC !== null;
  const tempReading = hasMarsTemp ? (marsSol.maxTempC as number) : (bundle.power?.latestValid?.tempC ?? 21.5);
  const tempThreshold = hasMarsTemp ? -15 : 25;
  const tempTrueLabel = hasMarsTemp ? "تجمد مريخي شديد" : "مرتفع";
  const tempFalseLabel = hasMarsTemp ? "طقس معتدل في فوهة غيل" : "معتدل";
  const tempExpect = tempReading < tempThreshold && hasMarsTemp
    ? tempTrueLabel
    : !hasMarsTemp && tempReading > tempThreshold
      ? tempTrueLabel
      : tempFalseLabel;

  // Asteroid speeds from NeoWs when available or SBDB CAD
  const neoItems = bundle.neows?.items || [];
  const cadItems = bundle.sbdb?.items || [];
  const asteroidSpeeds =
    neoItems.length >= 3
      ? neoItems.slice(0, 5).map((n) => n.velocityKms)
      : cadItems.slice(0, 5).map((item) => item.vRelKms);
  const fastCount = asteroidSpeeds.filter((v) => v > 10).length;

  const closestNeo = cadItems[0];
  const neoDes = closestNeo?.des || neoItems[0]?.name || "NEO";
  const neoDistAu =
    closestNeo?.distAu ??
    (neoItems[0] ? Number((neoItems[0].missDistanceKm / 149597870.7).toFixed(5)) : 0.02);
  const neoDistLd = Number((neoDistAu * 389.17).toFixed(1));

  const exoItems = bundle.exoplanets?.items || [];
  const exoFirstThree = exoItems.slice(0, 3).map((p) => p.name);
  const exoFourth = exoItems[3]?.name || "Kepler-186 f";

  const marsPressures: Array<number | null> = (bundle.marsWeather?.sols || []).map((s) => s.pressurePa);
  const rawRadii: Array<number | null> = exoItems.map((p) => p.radiusEarth);
  const sensorSeries: Array<number | null> =
    marsPressures.some((v) => v === null) && marsPressures.length >= 4
      ? marsPressures
      : rawRadii.some((v) => v === null)
        ? rawRadii
        : [...(marsPressures.length >= 4 ? marsPressures.slice(0, 4) : rawRadii.slice(0, 4)), null, ...(marsPressures.length >= 5 ? marsPressures.slice(4, 6) : rawRadii.slice(4, 6))];
  const validSensorCount = sensorSeries.filter((v) => v !== null).length;
  const sensorPyList = sensorSeries.map((v) => (v === null ? "None" : String(v))).join(", ");

  const dist60s = Number((issVel * 60).toFixed(1));

  return [
    {
      title: "المتغيرات والسرعة المدارية لـ ISS",
      concept:
        "في مركز جونسون للفضاء (JSC) ومختبر الدفع النفاث (JPL)، يبدأ تحليل القياسات بحفظ قراءة القياس عن بُعد في متغير واضح. القيمة التالية مأخوذة مباشرة من متجه الحالة الحي لمحطة الفضاء الدولية (NAIF -125544).",
      challenge: `السرعة المدارية الحالية من NASA/JPL Horizons هي ${issVel} كم/ث. احسب المسافة التي تقطعها المحطة خلال دقيقة واحدة (iss_speed * 60) وقرّبها لمنزلة عشرية ثم اطبعها.`,
      starter: `iss_speed = ${issVel}  # km/s (NASA/JPL Horizons -125544)\n# احسب المسافة خلال 60 ثانية واطبعها مقربة لمنزلة عشرية\n`,
      expect: String(dist60s),
      hint: `distance = round(iss_speed * 60, 1)\nprint(distance)`,
      source: `NASA/JPL Horizons API · العينة: ${bundle.iss?.current?.epoch || "مباشر"}`,
      datasetTag: "JPL Horizons (-125544)",
    },
    {
      title: hasMarsTemp ? "الجمل الشرطية وطقس المريخ (REMS)" : "الجمل الشرطية ورصد الحرارة",
      concept: hasMarsTemp
        ? `تراقب محطة REMS على متن مركبة Curiosity في فوهة غيل (Gale Crater) درجات الحرارة يومياً. تسمح جمل if/else لنظام المسبار بتفعيل السخانات الحرارية عند انخفاض الحرارة دون ${tempThreshold}°C.`
        : "تسمح جمل if و else بتصنيف القراءات الفضائية تلقائياً. نستخدم هنا درجة حرارة السطح اليومية المستخرجة من أقمار NASA Langley POWER.",
      challenge: hasMarsTemp
        ? `أعلى حرارة رصدتها Curiosity في Sol ${marsSol.sol} هي ${tempReading}°C. اطبع '${tempTrueLabel}' إذا كانت أقل من ${tempThreshold}، وإلا اطبع '${tempFalseLabel}'.`
        : `قراءة القمر الصناعي NASA POWER هي ${tempReading}°C. اطبع '${tempTrueLabel}' إذا تجاوزت ${tempThreshold}، وإلا اطبع '${tempFalseLabel}'.`,
      starter: hasMarsTemp
        ? `mars_max_c = ${tempReading}  # °C (Curiosity REMS Sol ${marsSol.sol})\n# اطبع التصنيف المناسب باستخدام if / else\n`
        : `temp_c = ${tempReading}  # °C (NASA POWER API)\n# اكتب جملة if / else\n`,
      expect: tempExpect,
      hint: hasMarsTemp
        ? `if mars_max_c < ${tempThreshold}:\n    print('${tempTrueLabel}')\nelse:\n    print('${tempFalseLabel}')`
        : `if temp_c > ${tempThreshold}:\n    print('${tempTrueLabel}')\nelse:\n    print('${tempFalseLabel}')`,
      source: hasMarsTemp
        ? `NASA Curiosity REMS Weather API · Sol ${marsSol.sol} (${marsSol.terrestrialDate})`
        : `NASA Langley POWER API · التاريخ: ${bundle.power?.latestValid?.date || "أحدث رصد"}`,
      datasetTag: hasMarsTemp ? `Mars REMS Sol ${marsSol.sol}` : "NASA POWER T2M",
    },
    {
      title: "الحلقات والدفاع الكوكبي (NEO)",
      concept:
        "تتابع شبكة NASA CNEOS وقاعدة JPL SBDB وخدمة NeoWs سرعات الكويكبات القريبة من الأرض لحساب احتمالية الخطر. تمر الحلقة for على كل رصد لفرز الأجرام فائقة السرعة.",
      challenge:
        "استخدم حلقة for لحساب عدد الكويكبات في neo_speeds التي تتجاوز سرعتها النسبية 10 كم/ث، ثم اطبع fast_count.",
      starter: `neo_speeds = [${asteroidSpeeds.join(", ")}]  # km/s (NASA JPL/NeoWs)\nfast_count = 0\n# اكتب حلقة for لحساب الأجرام الأسرع من 10 km/s\nprint(fast_count)\n`,
      expect: String(fastCount),
      hint: `for v in neo_speeds:\n    if v > 10:\n        fast_count += 1\nprint(fast_count)`,
      source: neoItems.length >= 3
        ? `NASA NeoWs Feed API · ${bundle.neows?.elementCount ?? asteroidSpeeds.length} جرم مرصود اليوم`
        : `NASA/JPL SBDB CAD API · إجمالي الأرصاد: ${bundle.sbdb?.totalUpcoming ?? asteroidSpeeds.length}`,
      datasetTag: neoItems.length >= 3 ? "NASA NeoWs Feed" : "JPL SBDB CAD",
    },
    {
      title: "القوائم وأرشيف الكواكب الخارجية",
      concept:
        "يجمع أرشيف NASA Exoplanet Archive بيانات الكواكب التي اكتشفتها تلسكوبات Kepler وTESS وJames Webb. نستخدم القوائم والدالة append() لضم كل كوكب مؤكّد حديثاً.",
      challenge: `أضف الكوكب المكتشف '${exoFourth}' إلى القائمة exoplanets باستخدام append() ثم اطبع العدد الإجمالي للكواكب.`,
      starter: `exoplanets = ${JSON.stringify(exoFirstThree)}\nlatest_planet = ${JSON.stringify(exoFourth)}\n# أضف latest_planet ثم اطبع العدد\n`,
      expect: "4",
      hint: `exoplanets.append(latest_planet)\nprint(len(exoplanets))`,
      source: `NASA Exoplanet Archive TAP · أحدث الاكتشافات المؤكدة`,
      datasetTag: "NASA Exoplanet TAP",
    },
    {
      title: "الدوال وحساب المسافة القمرية (LD)",
      concept:
        "يستخدم مهندسو الدفاع الكوكبي في ناسا المسافة القمرية (LD ≈ 384,400 كم) كمقياس بديهي لاقتراب الكويكبات مقارنةً ببُعد القمر، حيث تعادل 1 AU نحو 389.17 LD.",
      challenge: `الكويكب '${neoDes}' على مسافة ${neoDistAu} AU حسب NASA/JPL. عرّف دالة au_to_ld(au) تعيد round(au * 389.17, 1) ثم اطبع au_to_ld(dist_au).`,
      starter: `dist_au = ${neoDistAu}  # ${neoDes} (NASA/JPL)\n# اكتب الدالة au_to_ld ثم اطبع الناتج\n`,
      expect: String(neoDistLd),
      hint: `def au_to_ld(au):\n    return round(au * 389.17, 1)\n\nprint(au_to_ld(dist_au))`,
      source: `NASA/JPL SBDB CAD API · الكويكب ${neoDes}`,
      datasetTag: "JPL Ephemeris Math",
    },
    {
      title: "السلاسل الزمنية لمدار ISS",
      concept:
        "يختلف ارتفاع محطة الفضاء الدولية قليلاً أثناء دورانها حول الأرض بسبب تفلطح الأرض وتأثيرات الغلاف الجوي العلوي. حساب المتوسط الزمني عبر نقاط NASA/JPL Horizons يعطينا مؤشر ثبات المدار.",
      challenge:
        "احسب متوسط الارتفاع المداري في القائمة iss_altitudes وقرّبه لمنزلة عشرية ثم اطبعه.",
      starter: `iss_altitudes = [${altSeries.join(", ")}]  # km (NASA/JPL Horizons)\n# احسب المتوسط واطبعه\n`,
      expect: String(altMean),
      hint: `avg_alt = round(sum(iss_altitudes) / len(iss_altitudes), 1)\nprint(avg_alt)`,
      source: `NASA/JPL Horizons API · سلسلة ${altSeries.length} نقاط مدارية`,
      datasetTag: "Horizons Time-Series",
    },
    {
      title: "تنقية قراءات مستشعرات ناسا",
      concept:
        "تصل أحياناً قراءات مفقودة (None) من أجهزة قياس الضغط على المريخ أو أقطار الكواكب الخارجية غير المقاسة بعد. تصفية القيم الفارغة بـ is not None خطوة حاسمة في بايثون العلمي.",
      challenge:
        "استبعد القيم المفقودة None من nasa_readings داخل قائمة جديدة، ثم اطبع عدد القراءات الصالحة.",
      starter: `nasa_readings = [${sensorPyList}]\n# استبعد None ثم اطبع عدد القراءات الصالحة\n`,
      expect: String(validSensorCount),
      hint: `valid = [x for x in nasa_readings if x is not None]\nprint(len(valid))`,
      source: `NASA Mars REMS & Exoplanet Archive · بيانات رصد حية`,
      datasetTag: "Telemetry Cleaning",
    },
  ];
}

export function buildNasaDemoCode(bundle: NasaBundle): string {
  const issAlt = bundle.iss?.current?.altitudeKm ?? 420;
  const issVel = bundle.iss?.current?.velocityKms ?? 7.66;
  const neo = bundle.sbdb?.items?.[0];
  const mars = bundle.marsWeather?.sols?.[0];
  const epicDist = bundle.epic?.dscovrDistanceKm ?? 1490000;
  return `iss_altitude_km = ${issAlt}
iss_velocity_kms = ${issVel}
dscovr_distance_km = ${epicDist}
mars_curiosity_sol = ${JSON.stringify(mars?.sol || "latest")}
mars_temp_range_c = (${mars?.minTempC ?? -70}, ${mars?.maxTempC ?? -5})
nearest_neo = ${JSON.stringify({
    name: neo?.des || "NEO",
    dist_au: neo?.distAu ?? 0.02,
    speed_kms: neo?.vRelKms ?? 8.5,
  })}

if iss_altitude_km > 400:
    print("ISS orbit nominal above 400 km")
else:
    print("ISS orbit low")

print("ISS speed:", iss_velocity_kms, "km/s")
print("Mars Gale Crater Sol:", mars_curiosity_sol, mars_temp_range_c)
print("Nearest NEO:", nearest_neo["name"])
`;
}

export function buildHoloDemoCode(bundle: NasaBundle): string {
  const alt = bundle.iss?.current?.altitudeKm ?? 420;
  const vel = bundle.iss?.current?.velocityKms ?? 7.66;
  const neo = bundle.sbdb?.items?.[0]?.des || "NEO";
  return `altitude = ${alt}  # NASA/JPL Horizons live ISS
velocity = ${vel}
cx, cy = 200, 150
earth_r = 58
draw_earth(cx, cy, earth_r, "Earth")
orbit_r = earth_r + altitude / 6
draw_orbit(cx, cy, orbit_r, "#22d3ee")
draw_satellite(cx, cy, orbit_r, 9, "#f59e0b", 4)
draw_rocket(330, 68, 35)
draw_text(12, 286, f"ISS (JPL Horizons): {altitude} km · {velocity} km/s", "#67e8f9")
draw_text(12, 22, "Next NEO (JPL SBDB): ${neo}", "#fde68a")
print("ISS altitude:", altitude, "km")
`;
}

export function buildSolarDemoCode(bundle: NasaBundle): string {
  const planets = bundle.planets || [];
  const rows = planets.length
    ? planets.map((p, i) => `("${p.nameEn}", ${36 + i * 24}, ${i === 4 ? 10 : 4}, "${p.color}", ${6 + i * 4}, ${p.distanceAu})`)
    : [
        `("Mercury", 36, 3, "#cbd5e1", 6, 0.39)`,
        `("Venus", 60, 5, "#fde68a", 10, 0.72)`,
        `("Earth", 84, 5, "#60a5fa", 14, 1.0)`,
        `("Mars", 108, 4, "#f87171", 18, 1.52)`,
        `("Jupiter", 134, 10, "#fdba74", 24, 5.2)`,
      ];
  return `draw_sun(200, 150, 15, "Sun")
planets = [
    ${rows.join(",\n    ")}
]
for name, r, size, color, dur, au in planets:
    draw_orbit(200, 150, r, "#22d3ee")
    draw_satellite(200, 150, r, dur, color, size)
draw_text(12, 288, "Heliocentric positions · NASA/JPL Horizons", "#67e8f9")
print("Planets loaded from NASA Horizons:", len(planets))
`;
}

export function buildGalleryDemoCode(): string {
  return `names = ${JSON.stringify(NASA_SHAPE_NAMES)}
for i, n in enumerate(names):
    x = 40 + (i % 5) * 80
    y = 30 + (i // 5) * 46
    draw_shape(n, x, y, 14, "#22d3ee")
    draw_text(x - 32, y + 22, n, "#94a3b8")
print("NASA models drawn:", len(names))
`;
}

export function buildJsHoloDemo(bundle: NasaBundle | null): HoloItem[] {
  const alt = bundle?.iss?.current?.altitudeKm ?? 420;
  const vel = bundle?.iss?.current?.velocityKms ?? 7.66;
  const neo = bundle?.sbdb?.items?.[0]?.des || "JPL SBDB";
  const orbitR = 58 + alt / 6;
  return [
    { t: "earth", x: 200, y: 150, r: 58, l: "Earth" },
    { t: "orbit", x: 200, y: 150, r: orbitR, c: "#22d3ee" },
    { t: "satellite", x: 200, y: 150, r: orbitR, c: "#f59e0b", pr: 4, dur: 9 },
    { t: "rocket", x: 330, y: 68, a: 35, c: "#e0f2fe" },
    { t: "text", x: 12, y: 286, s: `ISS (JPL Horizons): ${alt} km · ${vel} km/s`, c: "#67e8f9" },
    { t: "text", x: 12, y: 22, s: `Next NEO (JPL SBDB): ${neo}`, c: "#fde68a" },
  ];
}

export function buildJsSolarDemo(bundle: NasaBundle | null): HoloItem[] {
  const items: HoloItem[] = [{ t: "sun", x: 200, y: 150, r: 15, l: "Sun" }];
  const planets = bundle?.planets?.length
    ? bundle.planets
    : [
        { nameEn: "Mercury", color: "#cbd5e1", distanceAu: 0.39 },
        { nameEn: "Venus", color: "#fde68a", distanceAu: 0.72 },
        { nameEn: "Earth", color: "#60a5fa", distanceAu: 1.0 },
        { nameEn: "Mars", color: "#f87171", distanceAu: 1.52 },
        { nameEn: "Jupiter", color: "#fdba74", distanceAu: 5.2 },
      ];
  planets.forEach((p, i) => {
    const r = 36 + i * 24;
    items.push({ t: "orbit", x: 200, y: 150, r, c: "#22d3ee" });
    items.push({ t: "satellite", x: 200, y: 150, r, c: p.color, pr: i === 4 ? 10 : 4, dur: 6 + i * 4 });
  });
  items.push({ t: "text", x: 12, y: 288, s: "Heliocentric positions · NASA/JPL Horizons", c: "#67e8f9" });
  return items;
}

export function buildJsGalleryDemo(): HoloItem[] {
  return NASA_SHAPE_NAMES.flatMap((n, i) => {
    const x = 40 + (i % 5) * 80;
    const y = 30 + Math.floor(i / 5) * 46;
    return [
      { t: "shape", n, x, y, s: 14, c: "#22d3ee" },
      { t: "text", x: x - 32, y: y + 22, s: n, c: "#94a3b8" },
    ];
  });
}

export function buildNasaQuizzes(bundle: NasaBundle | null): NasaQuizItem[] {
  const closest = bundle?.sbdb?.items?.[0];
  const exo = bundle?.exoplanets?.items?.[0];
  const issAlt = bundle?.iss?.current?.altitudeKm;
  const marsSol = bundle?.marsWeather?.sols?.[0];

  return [
    {
      q: closest
        ? `ما الكويكب الأقرب اقتراباً حالياً في بيانات NASA/JPL SBDB؟`
        : "أي واجهة برمجة تطبيقات تابعة لناسا توفر بيانات اقتراب الكويكبات؟",
      options: closest
        ? [closest.des, "Voyager 1", "DSCOVR-L1", "Hubble-02"]
        : ["NASA/JPL SBDB CAD", "OpenWeather", "Space-Track", "Wikipedia API"],
      answer: 0,
      source: "NASA/JPL SBDB CAD API",
    },
    {
      q: marsSol
        ? `في أي موقع على المريخ تسجل المركبة Curiosity قراءات الطقس (Sol ${marsSol.sol})؟`
        : "ما اسم الأداة التي تقيس بها Curiosity طقس المريخ يومياً؟",
      options: ["فوهة غيل (Gale Crater) عبر REMS", "بحر السكون على القمر", "نقطة لاغرانج L1", "القطب الشمالي لزحل"],
      answer: 0,
      source: "NASA Mars Curiosity REMS API",
    },
    {
      q: exo
        ? `ما أحدث كوكب خارجي مسجل في القائمة الحالية من NASA Exoplanet Archive؟`
        : "ما الدالة المستخدمة لتنظيف القيم المفقودة None في قوائم بايثون؟",
      options: exo
        ? ["Mars Rover", exo.name, "ISS Module", "Ceres-1"]
        : ["if x is not None", "if x == null", "delete x", "skip(x)"],
      answer: exo ? 1 : 0,
      source: "NASA Exoplanet Archive TAP",
    },
    {
      q: issAlt
        ? `حسب بيانات NASA/JPL Horizons الحالية، في أي نطاق يدور ارتفاع محطة الفضاء الدولية؟`
        : "أي نظام يوفر متجهات الموقع المدارية الدقيقة لمحطة الفضاء الدولية؟",
      options: issAlt
        ? ["حوالي 50 كم", "حوالي 400–435 كم", "حوالي 36,000 كم", "حوالي 384,000 كم"]
        : ["NASA/JPL Horizons", "Local Mock", "Static CSV", "Random Seed"],
      answer: issAlt ? 1 : 0,
      source: "NASA/JPL Horizons API",
    },
    {
      q: "ما الوحدة المستخدمة للتحويل السريع لبُعد الكويكب من الوحدة الفلكية (AU) إلى المسافة القمرية؟",
      options: ["الضرب في 389.17", "القسمة على 10", "الجمع مع 420", "الطرح من 9.8"],
      answer: 0,
      source: "NASA/JPL CNEOS Ephemeris",
    },
  ];
}
