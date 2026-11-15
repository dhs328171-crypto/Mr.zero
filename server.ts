import express from "express";
import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const NASA_API_KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const AU_KM = 149597870.7;
const EARTH_RADIUS_KM = 6371.0;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number): T {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

async function fetchJson<T>(url: string, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "MrZero-NASA-Lab/1.0",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatCompactDate(date: Date): string {
  return formatUtcDate(date).replaceAll("-", "");
}

function parseHorizonsVectors(resultText: string) {
  const start = resultText.indexOf("$$SOE");
  const end = resultText.indexOf("$$EOE");
  if (start === -1 || end === -1 || end <= start) return [];

  const body = resultText.slice(start + 5, end);
  const blocks = body
    .split(/^(?=\d+\.\d+\s*=\s*A\.D\.)/m)
    .map((b) => b.trim())
    .filter(Boolean);
  const samples: Array<{
    epoch: string;
    altitudeKm: number;
    velocityKms: number;
    rangeKm: number;
  }> = [];

  for (const block of blocks) {
    const epochMatch = block.match(/A\.D\.\s+([0-9]{4}-[A-Za-z]{3}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2})/);
    const vxMatch = block.match(/VX=\s*([-+0-9.E]+)/);
    const vyMatch = block.match(/VY=\s*([-+0-9.E]+)/);
    const vzMatch = block.match(/VZ=\s*([-+0-9.E]+)/);
    const rgMatch = block.match(/RG=\s*([-+0-9.E]+)/);

    if (vxMatch && vyMatch && vzMatch && rgMatch) {
      const vx = Number(vxMatch[1]);
      const vy = Number(vyMatch[1]);
      const vz = Number(vzMatch[1]);
      const rg = Number(rgMatch[1]);
      if (Number.isFinite(rg) && Number.isFinite(vx)) {
        samples.push({
          epoch: epochMatch ? epochMatch[1] : "",
          rangeKm: Number(rg.toFixed(2)),
          altitudeKm: Number((rg - EARTH_RADIUS_KM).toFixed(1)),
          velocityKms: Number(Math.hypot(vx, vy, vz).toFixed(2)),
        });
      }
    }
  }
  return samples;
}

function parseHorizonsSpecs(resultText: string) {
  const specs: Array<{ label: string; value: string }> = [];
  const patterns: Array<[RegExp, string]> = [
    [/Vol\.\s*mean radius \(km\)\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "متوسط نصف القطر (km)"],
    [/Equatorial radius \(km\)\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "نصف القطر الاستوائي (km)"],
    [/Density \(g\/cm\^3\)\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "الكثافة (g/cm³)"],
    [/Mass x10\^(\d+)\s*\(kg\)\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "الكتلة (kg)"],
    [/Sidereal rot\. period\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "فترة الدوران"],
    [/Mean solar day[^\n=]*=\s*([^\n]+?)(?:\s{2,}|$)/i, "طول اليوم الشمسي"],
    [/Equ\.\s*gravity\s*m\/s\^2\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "الجاذبية الاستوائية (m/s²)"],
    [/Surface gravity[^\n=]*=\s*([^\n]+?)(?:\s{2,}|$)/i, "الجاذبية السطحية"],
    [/Geometric Albedo\s*=\s*([^\n]+?)(?:\s{2,}|$)/i, "البياض الهندسي (Albedo)"],
    [/Mean Temperature[^\n=]*=\s*([^\n]+?)(?:\s{2,}|$)/i, "متوسط الحرارة"],
    [/Launch date[^\n:]*:\s*([^\n]+)/i, "تاريخ الإطلاق"],
    [/Mission duration[^\n:]*:\s*([^\n]+)/i, "مدة المهمة"],
  ];

  for (const [regex, label] of patterns) {
    const m = resultText.match(regex);
    if (m) {
      const value = m.length === 3 ? `${m[2].trim()} × 10^${m[1]}` : m[1].trim();
      if (value && !specs.some((s) => s.label === label)) {
        specs.push({ label, value });
      }
    }
  }

  const lines = resultText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("*") && !l.startsWith("$$") && !l.startsWith("Ephemeris"));

  return {
    specs,
    summary: lines.slice(0, 6).join(" · ").slice(0, 320),
  };
}

async function fetchHorizonsData() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const start = formatUtcDate(now);
  const stop = formatUtcDate(tomorrow);

  const issUrl =
    `https://ssd.jpl.nasa.gov/api/horizons.api?format=json` +
    `&COMMAND=%27-125544%27&OBJ_DATA=%27NO%27&MAKE_EPHEM=%27YES%27` +
    `&EPHEM_TYPE=%27VECTORS%27&CENTER=%27500@399%27` +
    `&START_TIME=%27${start}%27&STOP_TIME=%27${stop}%27&STEP_SIZE=%274%20h%27`;

  const issRaw = await fetchJson<{ result?: string }>(issUrl, 12000);
  const issSamples = parseHorizonsVectors(issRaw.result || "");
  const iss = {
    source: "NASA/JPL Horizons API (NAIF -125544)",
    endpoint: "https://ssd.jpl.nasa.gov/api/horizons.api",
    samples: issSamples,
    current: issSamples[0] || null,
  };

  let planets = getCached<Array<{
    id: string;
    nameEn: string;
    nameAr: string;
    distanceAu: number;
    velocityKms: number;
    color: string;
  }>>("planets");

  if (!planets) {
    const bodies = [
      { id: "199", nameEn: "Mercury", nameAr: "عطارد", color: "#cbd5e1" },
      { id: "299", nameEn: "Venus", nameAr: "الزهرة", color: "#fde68a" },
      { id: "399", nameEn: "Earth", nameAr: "الأرض", color: "#60a5fa" },
      { id: "499", nameEn: "Mars", nameAr: "المريخ", color: "#f87171" },
      { id: "599", nameEn: "Jupiter", nameAr: "المشتري", color: "#fdba74" },
    ];
    planets = [];
    for (const b of bodies) {
      try {
        const url =
          `https://ssd.jpl.nasa.gov/api/horizons.api?format=json` +
          `&COMMAND=%27${b.id}%27&OBJ_DATA=%27NO%27&MAKE_EPHEM=%27YES%27` +
          `&EPHEM_TYPE=%27VECTORS%27&CENTER=%27500@10%27` +
          `&START_TIME=%27${start}%27&STOP_TIME=%27${stop}%27&STEP_SIZE=%271%20d%27`;
        const raw = await fetchJson<{ result?: string }>(url, 12000);
        const samples = parseHorizonsVectors(raw.result || "");
        const s = samples[0];
        if (s) {
          planets.push({
            id: b.id,
            nameEn: b.nameEn,
            nameAr: b.nameAr,
            distanceAu: Number((s.rangeKm / AU_KM).toFixed(3)),
            velocityKms: s.velocityKms,
            color: b.color,
          });
        }
      } catch {
        // continue with remaining planets
      }
    }
    if (planets.length > 0) {
      setCached("planets", planets, 6 * 60 * 60 * 1000);
    }
  }

  return { iss, planets };
}

async function fetchHorizonsSingle(naifId: string) {
  const cacheKey = `horizons:${naifId}`;
  const hit = getCached<{
    specs: Array<{ label: string; value: string }>;
    summary: string;
    vector: { epoch: string; distanceAu?: number; distanceKm?: number; velocityKms: number } | null;
  }>(cacheKey);
  if (hit) return hit;

  const earthCentered = ["-125544", "301", "-48", "-78", "-151"].includes(naifId);
  const center = earthCentered ? "500@399" : "500@10";
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const start = formatUtcDate(now);
  const stop = formatUtcDate(tomorrow);

  const url =
    `https://ssd.jpl.nasa.gov/api/horizons.api?format=json` +
    `&COMMAND=%27${encodeURIComponent(naifId)}%27&OBJ_DATA=%27YES%27&MAKE_EPHEM=%27YES%27` +
    `&EPHEM_TYPE=%27VECTORS%27&CENTER=%27${center}%27` +
    `&START_TIME=%27${start}%27&STOP_TIME=%27${stop}%27&STEP_SIZE=%271%20d%27`;

  const raw = await fetchJson<{ result?: string }>(url, 12000);
  const resultText = raw.result || "";
  const parsedSpecs = parseHorizonsSpecs(resultText);
  const samples = parseHorizonsVectors(resultText);
  const v = samples[0];

  const payload = {
    specs: parsedSpecs.specs,
    summary: parsedSpecs.summary,
    vector: v
      ? {
          epoch: v.epoch,
          distanceKm: Math.round(v.rangeKm),
          distanceAu: Number((v.rangeKm / AU_KM).toFixed(4)),
          velocityKms: v.velocityKms,
        }
      : null,
  };
  return setCached(cacheKey, payload, 60 * 60 * 1000);
}

async function fetchMarsWeather() {
  const url = "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json";
  const raw = await fetchJson<{
    soles?: Array<{
      sol: string;
      terrestrial_date: string;
      min_temp: string;
      max_temp: string;
      pressure: string;
      atmo_opacity: string;
      local_uv_irradiance_index: string;
      sunrise: string;
      sunset: string;
      season: string;
    }>;
  }>(url, 10000);

  const parseNum = (val: string) => {
    const n = Number(val);
    return val !== "--" && Number.isFinite(n) ? n : null;
  };

  const sols = (raw.soles || []).slice(0, 7).map((s) => ({
    sol: s.sol,
    terrestrialDate: s.terrestrial_date,
    minTempC: parseNum(s.min_temp),
    maxTempC: parseNum(s.max_temp),
    pressurePa: parseNum(s.pressure),
    atmoOpacity: s.atmo_opacity || "Sunny",
    uvIndex: s.local_uv_irradiance_index || "Moderate",
    sunrise: s.sunrise || "--",
    sunset: s.sunset || "--",
    season: s.season || "",
  }));

  return {
    source: "NASA Mars Curiosity REMS Weather API",
    endpoint: "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json",
    rover: "Curiosity (Gale Crater)",
    sols,
  };
}

async function fetchMarsPhotos() {
  const url = "https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=6&page=0";
  const raw = await fetchJson<{
    images?: Array<{
      imageid?: string;
      sol?: number;
      camera?: { instrument?: string };
      title?: string;
      caption?: string;
      date_taken_utc?: string;
      credit?: string;
      image_files?: { medium?: string; small?: string; full_res?: string };
    }>;
  }>(url, 10000);

  const items = (raw.images || [])
    .map((img) => {
      const imageUrl = img.image_files?.medium || img.image_files?.small || img.image_files?.full_res || "";
      if (!imageUrl) return null;
      return {
        id: img.imageid || "",
        sol: Number(img.sol || 0),
        camera: img.camera?.instrument || "Mars 2020",
        title: img.title || `Perseverance Sol ${img.sol || ""}`,
        caption: (img.caption || "").slice(0, 220),
        dateTakenUtc: (img.date_taken_utc || "").slice(0, 10),
        credit: img.credit || "NASA/JPL-Caltech",
        imageUrl,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    source: "NASA Mars 2020 Perseverance Raw Images API",
    endpoint: "https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json",
    rover: "Perseverance (Jezero Crater)",
    items,
  };
}

async function fetchSbdbCad() {
  const url = "https://ssd-api.jpl.nasa.gov/cad.api?limit=10&sort=date";
  const raw = await fetchJson<{
    signature?: { source?: string; version?: string };
    total?: number;
    fields?: string[];
    data?: string[][];
  }>(url);

  const fields = raw.fields || [];
  const idxOf = (name: string) => fields.indexOf(name);
  const iDes = idxOf("des");
  const iCd = idxOf("cd");
  const iDist = idxOf("dist");
  const iVrel = idxOf("v_rel");
  const iH = idxOf("h");

  const items = (raw.data || []).map((row) => {
    const distAu = Number(Number(row[iDist]).toFixed(5));
    return {
      des: row[iDes] || "",
      cd: row[iCd] || "",
      distAu,
      distLd: Number((distAu * 389.17).toFixed(2)),
      vRelKms: Number(Number(row[iVrel]).toFixed(2)),
      hMag: row[iH] ? Number(Number(row[iH]).toFixed(2)) : null,
    };
  });

  return {
    source: raw.signature?.source || "NASA/JPL SBDB Close Approach Data API",
    endpoint: "https://ssd-api.jpl.nasa.gov/cad.api",
    totalUpcoming: Number(raw.total || items.length),
    items,
  };
}

async function fetchNeoWs() {
  const cached = getCached<{
    source: string;
    endpoint: string;
    elementCount: number;
    items: Array<{
      id: string;
      name: string;
      hazardous: boolean;
      diameterMinM: number;
      diameterMaxM: number;
      velocityKms: number;
      missDistanceKm: number;
      closeApproachDate: string;
    }>;
  } | null>("neows");
  if (cached !== null) return cached;

  try {
    const today = formatUtcDate(new Date());
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${encodeURIComponent(NASA_API_KEY)}`;
    const raw = await fetchJson<{
      element_count?: number;
      near_earth_objects?: Record<
        string,
        Array<{
          id: string;
          name: string;
          is_potentially_hazardous_asteroid?: boolean;
          estimated_diameter?: {
            meters?: { estimated_diameter_min?: number; estimated_diameter_max?: number };
          };
          close_approach_data?: Array<{
            close_approach_date?: string;
            relative_velocity?: { kilometers_per_second?: string };
            miss_distance?: { kilometers?: string };
          }>;
        }>
      >;
    }>(url, 7000);

    const dayList = Object.values(raw.near_earth_objects || {}).flat();
    const items = dayList.slice(0, 8).map((neo) => {
      const ca = neo.close_approach_data?.[0];
      return {
        id: neo.id,
        name: neo.name,
        hazardous: Boolean(neo.is_potentially_hazardous_asteroid),
        diameterMinM: Math.round(neo.estimated_diameter?.meters?.estimated_diameter_min || 0),
        diameterMaxM: Math.round(neo.estimated_diameter?.meters?.estimated_diameter_max || 0),
        velocityKms: Number(Number(ca?.relative_velocity?.kilometers_per_second || 0).toFixed(2)),
        missDistanceKm: Math.round(Number(ca?.miss_distance?.kilometers || 0)),
        closeApproachDate: ca?.close_approach_date || today,
      };
    });

    const payload = {
      source: "NASA NeoWs (Near Earth Object Web Service)",
      endpoint: "https://api.nasa.gov/neo/rest/v1/feed",
      elementCount: Number(raw.element_count || items.length),
      items,
    };
    return setCached("neows", payload, 60 * 60 * 1000);
  } catch {
    return setCached("neows", null, 15 * 60 * 1000);
  }
}

async function fetchEpic() {
  const url = "https://epic.gsfc.nasa.gov/api/natural";
  const items = await fetchJson<
    Array<{
      identifier: string;
      caption: string;
      image: string;
      date: string;
      centroid_coordinates?: { lat: number; lon: number };
      dscovr_j2000_position?: { x: number; y: number; z: number };
      sun_j2000_position?: { x: number; y: number; z: number };
    }>
  >(url);

  const latest = items[0];
  if (!latest) return null;

  const [datePart] = latest.date.split(" ");
  const [yyyy, mm, dd] = datePart.split("-");
  const pos = latest.dscovr_j2000_position;
  const sunPos = latest.sun_j2000_position;
  const distanceKm = pos ? Math.round(Math.hypot(pos.x, pos.y, pos.z)) : 0;
  const sunDistanceKm = sunPos ? Math.round(Math.hypot(sunPos.x, sunPos.y, sunPos.z)) : 0;

  return {
    source: "NASA/NOAA DSCOVR EPIC API",
    endpoint: "https://epic.gsfc.nasa.gov/api/natural",
    identifier: latest.identifier,
    date: latest.date,
    caption: latest.caption,
    imageUrl: `https://epic.gsfc.nasa.gov/archive/natural/${yyyy}/${mm}/${dd}/png/${latest.image}.png`,
    lat: latest.centroid_coordinates ? Number(latest.centroid_coordinates.lat.toFixed(2)) : null,
    lon: latest.centroid_coordinates ? Number(latest.centroid_coordinates.lon.toFixed(2)) : null,
    dscovrDistanceKm: distanceKm,
    sunDistanceMillionKm: sunDistanceKm ? Number((sunDistanceKm / 1_000_000).toFixed(2)) : null,
    framesAvailable: items.length,
  };
}

async function fetchEonet() {
  const url = "https://eonet.gsfc.nasa.gov/api/v3/events?limit=8&status=open";
  const raw = await fetchJson<{
    title?: string;
    events?: Array<{
      id: string;
      title: string;
      link: string;
      categories?: Array<{ id: string; title: string }>;
      sources?: Array<{ id: string; url: string }>;
      geometry?: Array<{ date: string; type: string; coordinates: number[] }>;
    }>;
  }>(url);

  const events = (raw.events || []).map((ev) => {
    const geom = ev.geometry?.[ev.geometry.length - 1];
    return {
      id: ev.id,
      title: ev.title,
      category: ev.categories?.[0]?.title || "Natural Event",
      date: geom?.date ? geom.date.slice(0, 10) : "",
      coordinates: geom?.coordinates || [],
      sourceId: ev.sources?.[0]?.id || "NASA EONET",
    };
  });

  return {
    source: "NASA EONET v3 API",
    endpoint: "https://eonet.gsfc.nasa.gov/api/v3/events",
    count: events.length,
    events,
  };
}

async function fetchExoplanets() {
  const url =
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" +
    encodeURIComponent(
      "select top 8 pl_name,pl_rade,pl_orbper,sy_dist,disc_year,discoverymethod from pscomppars order by disc_pubdate desc"
    ) +
    "&format=json";

  const items = await fetchJson<
    Array<{
      pl_name: string;
      pl_rade: number | null;
      pl_orbper: number | null;
      sy_dist: number | null;
      disc_year: number | null;
      discoverymethod: string | null;
    }>
  >(url);

  return {
    source: "NASA Exoplanet Archive TAP API",
    endpoint: "https://exoplanetarchive.ipac.caltech.edu/TAP/sync",
    items: items.map((p) => ({
      name: p.pl_name,
      radiusEarth: p.pl_rade !== null ? Number(p.pl_rade.toFixed(2)) : null,
      orbitalPeriodDays: p.pl_orbper !== null ? Number(p.pl_orbper.toFixed(2)) : null,
      distanceParsecs: p.sy_dist !== null ? Number(p.sy_dist.toFixed(2)) : null,
      discYear: p.disc_year,
      method: p.discoverymethod || "Transit",
    })),
  };
}

async function fetchPower() {
  const end = new Date();
  const start = new Date(end.getTime() - 9 * 24 * 60 * 60 * 1000);
  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,ALLSKY_SFC_SW_DWN` +
    `&community=RE&longitude=31.2357&latitude=30.0444` +
    `&start=${formatCompactDate(start)}&end=${formatCompactDate(end)}&format=JSON`;

  const raw = await fetchJson<{
    properties?: {
      parameter?: {
        T2M?: Record<string, number>;
        ALLSKY_SFC_SW_DWN?: Record<string, number>;
      };
    };
  }>(url);

  const t2m = raw.properties?.parameter?.T2M || {};
  const sw = raw.properties?.parameter?.ALLSKY_SFC_SW_DWN || {};
  const series = Object.keys(t2m)
    .sort()
    .map((day) => ({
      date: `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`,
      tempC: t2m[day] <= -900 ? null : Number(t2m[day].toFixed(2)),
      solarKwhM2: sw[day] !== undefined && sw[day] > -900 ? Number(sw[day].toFixed(2)) : null,
    }));

  const validTemps = series.filter((d) => d.tempC !== null);
  const latestValid = validTemps[validTemps.length - 1] || null;

  return {
    source: "NASA Langley POWER Satellite API",
    endpoint: "https://power.larc.nasa.gov/api/temporal/daily/point",
    location: "Cairo Station (30.04°N, 31.24°E)",
    series,
    latestValid,
  };
}

interface NasaImageItemRaw {
  nasaId: string;
  title: string;
  center: string;
  dateCreated: string;
  description: string;
  thumbUrl: string;
}

async function fetchNasaImages(query: string): Promise<{
  source: string;
  endpoint: string;
  query: string;
  items: NasaImageItemRaw[];
}> {
  const cleanQ = query.trim().slice(0, 80) || "NASA Earth";
  const cacheKey = `img:${cleanQ.toLowerCase()}`;
  const hit = getCached<{ source: string; endpoint: string; query: string; items: NasaImageItemRaw[] }>(cacheKey);
  if (hit) return hit;

  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(cleanQ)}&media_type=image&page_size=8`;
  const raw = await fetchJson<{
    collection?: {
      items?: Array<{
        data?: Array<{
          nasa_id?: string;
          title?: string;
          center?: string;
          date_created?: string;
          description?: string;
        }>;
        links?: Array<{ href?: string; rel?: string }>;
      }>;
    };
  }>(url);

  const items = (raw.collection?.items || [])
    .map((entry) => {
      const meta = entry.data?.[0];
      const thumb = entry.links?.find((l) => l.href)?.href || "";
      if (!meta || !thumb) return null;
      return {
        nasaId: meta.nasa_id || "",
        title: meta.title || "",
        center: meta.center || "NASA",
        dateCreated: (meta.date_created || "").slice(0, 10),
        description: (meta.description || "").slice(0, 480),
        thumbUrl: thumb,
      };
    })
    .filter((x): x is NasaImageItemRaw => x !== null);

  const payload = {
    source: "NASA Images and Video Library API",
    endpoint: "https://images-api.nasa.gov/search",
    query: cleanQ,
    items,
  };
  return setCached(cacheKey, payload, 60 * 60 * 1000);
}

interface ApodEntry {
  title: string;
  date: string;
  url: string;
  explanation: string;
  source: string;
  nasaId?: string;
  center?: string;
}

async function fetchOptionalApiNasaGov() {
  const cached = getCached<{
    apod: ApodEntry | null;
    apodGallery: ApodEntry[];
    donkiFlareCount: number | null;
  }>("apinasagov2");
  if (cached) return cached;

  let apod: ApodEntry | null = null;
  const apodGallery: ApodEntry[] = [];
  let donkiFlareCount: number | null = null;

  try {
    const arr = await fetchJson<
      Array<{ title?: string; date?: string; url?: string; media_type?: string; explanation?: string }>
    >(`https://api.nasa.gov/planetary/apod?count=5&api_key=${encodeURIComponent(NASA_API_KEY)}`, 6000);
    for (const item of arr) {
      if (item?.title && item.url && item.media_type === "image") {
        const entry: ApodEntry = {
          title: item.title,
          date: item.date || "",
          url: item.url,
          explanation: (item.explanation || "").slice(0, 420),
          source: "NASA APOD API (api.nasa.gov)",
        };
        apodGallery.push(entry);
        if (!apod) apod = entry;
      }
    }
  } catch {
    // Fallback below to official NASA Images API deep space collection
  }

  if (apodGallery.length < 4) {
    try {
      const imgs = await fetchNasaImages("Nebula Webb");
      for (const item of imgs.items) {
        if (!apodGallery.some((x) => x.url === item.thumbUrl)) {
          const entry: ApodEntry = {
            title: item.title,
            date: item.dateCreated,
            url: item.thumbUrl,
            explanation: item.description,
            source: `NASA Images API (${item.nasaId})`,
            nasaId: item.nasaId,
            center: item.center,
          };
          apodGallery.push(entry);
          if (!apod) apod = entry;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const end = new Date();
    const start = new Date(end.getTime() - 14 * 24 * 60 * 60 * 1000);
    const flares = await fetchJson<Array<{ flrID?: string }>>(
      `https://api.nasa.gov/DONKI/FLR?startDate=${formatUtcDate(start)}&endDate=${formatUtcDate(end)}&api_key=${encodeURIComponent(NASA_API_KEY)}`,
      6000
    );
    if (Array.isArray(flares)) donkiFlareCount = flares.length;
  } catch {
    donkiFlareCount = null;
  }

  return setCached("apinasagov2", { apod, apodGallery: apodGallery.slice(0, 6), donkiFlareCount }, 60 * 60 * 1000);
}

async function buildFreshNasaBundle() {

  const [horizonsRes, marsWeatherRes, marsPhotosRes, sbdbRes, neowsRes, epicRes, eonetRes, exoRes, powerRes, optionalRes] =
    await Promise.allSettled([
      fetchHorizonsData(),
      fetchMarsWeather(),
      fetchMarsPhotos(),
      fetchSbdbCad(),
      fetchNeoWs(),
      fetchEpic(),
      fetchEonet(),
      fetchExoplanets(),
      fetchPower(),
      fetchOptionalApiNasaGov(),
    ]);

  const iss = horizonsRes.status === "fulfilled" ? horizonsRes.value.iss : null;
  const planets = horizonsRes.status === "fulfilled" ? horizonsRes.value.planets : [];
  const marsWeather = marsWeatherRes.status === "fulfilled" ? marsWeatherRes.value : null;
  const marsPhotos = marsPhotosRes.status === "fulfilled" ? marsPhotosRes.value : null;
  const sbdb = sbdbRes.status === "fulfilled" ? sbdbRes.value : null;
  const neows = neowsRes.status === "fulfilled" ? neowsRes.value : null;
  const epic = epicRes.status === "fulfilled" ? epicRes.value : null;
  const eonet = eonetRes.status === "fulfilled" ? eonetRes.value : null;
  const exoplanets = exoRes.status === "fulfilled" ? exoRes.value : null;
  const power = powerRes.status === "fulfilled" ? powerRes.value : null;
  const optional =
    optionalRes.status === "fulfilled" ? optionalRes.value : { apod: null, apodGallery: [], donkiFlareCount: null };

  const metrics: Array<{ label: string; value: string; date: string; source: string }> = [];
  if (iss?.current) {
    metrics.push({
      label: "ارتفاع محطة الفضاء الدولية",
      value: `${iss.current.altitudeKm} km`,
      date: iss.current.epoch.slice(0, 17),
      source: "NASA/JPL Horizons API",
    });
    metrics.push({
      label: "السرعة المدارية للمحطة",
      value: `${iss.current.velocityKms} km/s`,
      date: iss.current.epoch.slice(0, 17),
      source: "NASA/JPL Horizons API",
    });
  }
  if (marsWeather?.sols?.[0]) {
    const s = marsWeather.sols[0];
    metrics.push({
      label: `طقس المريخ (Sol ${s.sol})`,
      value: `${s.minTempC ?? "--"} / ${s.maxTempC ?? "--"} °C`,
      date: s.terrestrialDate,
      source: "NASA Curiosity REMS API",
    });
  }
  if (sbdb?.items?.[0]) {
    metrics.push({
      label: `أقرب كويكب (${sbdb.items[0].des})`,
      value: `${sbdb.items[0].distAu} AU`,
      date: sbdb.items[0].cd,
      source: "NASA/JPL SBDB CAD API",
    });
  }
  if (epic) {
    metrics.push({
      label: "بُعد مرصد DSCOVR عن الأرض",
      value: `${epic.dscovrDistanceKm.toLocaleString("en-US")} km`,
      date: epic.date.slice(0, 10),
      source: "NASA/NOAA DSCOVR EPIC API",
    });
  }
  if (eonet) {
    metrics.push({
      label: "ظواهر أرضية نشطة مرصودة",
      value: `${eonet.count} أحداث`,
      date: eonet.events[0]?.date || formatUtcDate(new Date()),
      source: "NASA EONET v3 API",
    });
  }
  if (power?.latestValid) {
    metrics.push({
      label: "حرارة السطح بالأقمار الصناعية",
      value: `${power.latestValid.tempC} °C`,
      date: power.latestValid.date,
      source: "NASA Langley POWER API",
    });
  }
  if (exoplanets?.items?.[0]) {
    metrics.push({
      label: `أحدث كوكب خارجي (${exoplanets.items[0].name})`,
      value: exoplanets.items[0].orbitalPeriodDays ? `${exoplanets.items[0].orbitalPeriodDays} يوم` : "مؤكد",
      date: String(exoplanets.items[0].discYear || ""),
      source: "NASA Exoplanet Archive TAP",
    });
  }

  const bundle = {
    fetchedAt: new Date().toISOString(),
    iss,
    planets,
    marsWeather,
    marsPhotos,
    sbdb,
    neows,
    epic,
    eonet,
    exoplanets,
    power,
    apod: optional.apod,
    apodGallery: optional.apodGallery,
    donkiFlareCount: optional.donkiFlareCount,
    metrics,
  };

  if (metrics.length > 0) {
    setCached("bundle", bundle, 15 * 60 * 1000);
  }
  return bundle;
}

type ServerNasaBundle = Awaited<ReturnType<typeof buildFreshNasaBundle>>;

async function buildNasaBundle(forceRefresh = false): Promise<ServerNasaBundle> {
  if (!forceRefresh) {
    const hit = getCached<ServerNasaBundle>("bundle");
    if (hit) return hit;
  }
  return buildFreshNasaBundle();
}

const MODEL_NAIF_MAP: Record<string, { naif?: string; title: string; query: string }> = {
  earth: { naif: "399", title: "كوكب الأرض", query: "DSCOVR EPIC Earth" },
  moon: { naif: "301", title: "القمر", query: "Artemis Moon NASA" },
  mars: { naif: "499", title: "كوكب المريخ", query: "Mars Reconnaissance Orbiter" },
  sun: { naif: "10", title: "الشمس", query: "Solar Dynamics Observatory Sun" },
  saturn: { naif: "699", title: "زحل", query: "Cassini Saturn rings" },
  jupiter: { naif: "599", title: "المشتري", query: "Juno Jupiter" },
  mercury: { naif: "199", title: "عطارد", query: "MESSENGER Mercury NASA" },
  venus: { naif: "299", title: "الزهرة", query: "Magellan Venus NASA" },
  uranus: { naif: "799", title: "أورانوس", query: "Voyager 2 Uranus" },
  neptune: { naif: "899", title: "نبتون", query: "Voyager 2 Neptune" },
  pluto: { naif: "999", title: "بلوتو", query: "New Horizons Pluto" },
  iss: { naif: "-125544", title: "محطة الفضاء الدولية (ISS)", query: "International Space Station orbit" },
  jwst: { naif: "-170", title: "تلسكوب جيمس ويب (JWST)", query: "James Webb Space Telescope" },
  hubble: { naif: "-48", title: "تلسكوب هابل الفضائي", query: "Hubble Space Telescope" },
  voyager: { naif: "-31", title: "مسبار فوييجر 1", query: "Voyager spacecraft" },
  perseverance: { naif: "499", title: "مركبة Perseverance على المريخ", query: "Perseverance Mars Rover" },
  curiosity: { naif: "499", title: "مركبة Curiosity على المريخ", query: "Curiosity Rover Gale Crater" },
  artemis_sls: { title: "صاروخ SLS برنامج أرتميس", query: "Space Launch System Artemis" },
  orion_capsule: { title: "كبسولة أوريون (Orion)", query: "Orion spacecraft NASA" },
  dscovr_epic: { naif: "-78", title: "مرصد DSCOVR EPIC", query: "DSCOVR spacecraft" },
  parker_probe: { naif: "-96", title: "مسبار باركر الشمسي", query: "Parker Solar Probe" },
  chandra: { naif: "-151", title: "مرصد شاندرا للأشعة السينية", query: "Chandra X-ray Observatory" },
  osiris_rex: { naif: "-64", title: "مهمة OSIRIS-REx", query: "OSIRIS-REx Bennu asteroid" },
  comet: { title: "المذنبات في أرشيف NASA/JPL", query: "NASA comet NEOWISE" },
  asteroid: { title: "الكويكبات القريبة من الأرض", query: "NASA asteroid Bennu" },
  black_hole: { title: "الثقوب السوداء (Chandra / NuSTAR)", query: "NASA black hole" },
  galaxy: { title: "المجرات المرصودة بويب وهابل", query: "Hubble spiral galaxy" },
  nebula: { title: "السدم الكونية (JWST)", query: "Carina Nebula Webb" },
  exoplanet: { title: "الكواكب الخارجية (Exoplanet Archive)", query: "Kepler exoplanet" },
};

async function buildEntityProfile(params: { kind: string; id: string; q?: string }) {
  const { kind, id, q } = params;
  const bundle = (await buildNasaBundle(false)) as Awaited<ReturnType<typeof buildNasaBundle>>;

  if (kind === "asteroid") {
    const sbdbUrl = `https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=${encodeURIComponent(id)}&phys-par=1`;
    const [sbdbRes, imgRes] = await Promise.allSettled([
      fetchJson<{
        signature?: { source?: string };
        object?: { fullname?: string; pha?: boolean; neo?: boolean; orbit_class?: { name?: string }; spkid?: string };
        phys_par?: Array<{ name: string; title?: string; value: string; units?: string | null }>;
        orbit?: {
          n_obs_used?: number;
          data_arc?: string;
          condition_code?: string;
          elements?: Array<{ name: string; title?: string; value: string; units?: string | null }>;
        };
      }>(sbdbUrl, 10000),
      fetchNasaImages(`asteroid ${id}`),
    ]);

    const sbdb = sbdbRes.status === "fulfilled" ? sbdbRes.value : null;
    let images = imgRes.status === "fulfilled" ? imgRes.value.items : [];
    if (images.length === 0) {
      try {
        const fallbackImgs = await fetchNasaImages("NASA asteroid Bennu");
        images = fallbackImgs.items;
      } catch {
        // ignore
      }
    }

    const cadMatch = bundle.sbdb?.items?.find((i) => i.des === id || id.includes(i.des));
    const neoMatch = bundle.neows?.items?.find(
      (n) => n.id === id || n.name === id || n.name.includes(id)
    );
    const specs: Array<{ label: string; value: string }> = [
      { label: "التصنيف المداري", value: sbdb?.object?.orbit_class?.name || "NEO" },
      { label: "خطر محتمل (PHA)", value: sbdb?.object?.pha || neoMatch?.hazardous ? "نعم" : "لا" },
      { label: "عدد الأرصاد المعتمدة", value: String(sbdb?.orbit?.n_obs_used ?? "—") },
      { label: "قوس الرصد (أيام)", value: sbdb?.orbit?.data_arc || "—" },
    ];
    if (cadMatch) {
      specs.push(
        { label: "تاريخ الاقتراب", value: cadMatch.cd },
        { label: "أقرب مسافة (AU)", value: `${cadMatch.distAu} AU` },
        { label: "أقرب مسافة (LD)", value: `${cadMatch.distLd} LD` },
        { label: "السرعة النسبية", value: `${cadMatch.vRelKms} km/s` }
      );
    } else if (neoMatch) {
      specs.push(
        { label: "تاريخ الاقتراب (NeoWs)", value: neoMatch.closeApproachDate },
        { label: "القطر التقديري", value: `${neoMatch.diameterMinM}–${neoMatch.diameterMaxM} m` },
        { label: "مسافة العبور", value: `${neoMatch.missDistanceKm.toLocaleString("en-US")} km` },
        { label: "السرعة النسبية", value: `${neoMatch.velocityKms} km/s` }
      );
    }
    for (const p of (sbdb?.phys_par || []).slice(0, 4)) {
      specs.push({ label: p.title || p.name, value: `${p.value}${p.units ? ` ${p.units}` : ""}` });
    }

    const sbdbElements = (sbdb?.orbit?.elements || []).slice(0, 8).map((el) => ({
      name: el.name,
      title: el.title || el.name,
      value: Number(el.value) ? Number(el.value).toFixed(4) : el.value,
      units: el.units || "",
    }));

    const distAuVal = cadMatch?.distAu ?? (neoMatch ? Number((neoMatch.missDistanceKm / AU_KM).toFixed(5)) : 0.02);
    const velVal = cadMatch?.vRelKms ?? neoMatch?.velocityKms ?? 10.5;

    const pythonSnippet = `asteroid_name = ${JSON.stringify(sbdb?.object?.fullname || neoMatch?.name || id)}
dist_au = ${distAuVal}
velocity_kms = ${velVal}
dist_million_km = round(dist_au * 149.5978707, 2)

draw_earth(200, 150, 50, "Earth")
draw_orbit(200, 150, 115, "#f59e0b")
draw_shape("asteroid", 315, 150, 26, "#cbd5e1")
draw_text(12, 286, f"{asteroid_name}: {dist_million_km}M km · {velocity_kms} km/s", "#fde68a")
print("Asteroid:", asteroid_name)
print("Distance (million km):", dist_million_km)
`;

    return {
      kind: "asteroid",
      id,
      title: sbdb?.object?.fullname || neoMatch?.name || id,
      subtitle: "ملف جرم قريب من الأرض — NASA/JPL Small-Body Database & NeoWs",
      sources: [
        "NASA/JPL SBDB Lookup API",
        neoMatch ? "NASA NeoWs Feed API" : "NASA/JPL SBDB CAD API",
        "NASA Images API",
      ],
      specs,
      images,
      sbdbElements,
      pythonSnippet,
    };
  }

  if (kind === "exoplanet") {
    const safeName = id.replace(/[^A-Za-z0-9 .+-]/g, "");
    const tapUrl =
      "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" +
      encodeURIComponent(
        `select pl_name,hostname,pl_rade,pl_bmasse,pl_orbper,pl_eqt,st_teff,sy_dist,disc_year,discoverymethod,disc_facility from pscomppars where pl_name='${safeName}'`
      ) +
      "&format=json";

    const [tapRes, imgRes] = await Promise.allSettled([
      fetchJson<
        Array<{
          pl_name: string;
          hostname: string;
          pl_rade: number | null;
          pl_bmasse: number | null;
          pl_orbper: number | null;
          pl_eqt: number | null;
          st_teff: number | null;
          sy_dist: number | null;
          disc_year: number | null;
          discoverymethod: string | null;
          disc_facility: string | null;
        }>
      >(tapUrl, 10000),
      fetchNasaImages("Kepler exoplanet"),
    ]);

    const exo = tapRes.status === "fulfilled" ? tapRes.value[0] : null;
    const images = imgRes.status === "fulfilled" ? imgRes.value.items : [];

    const specs: Array<{ label: string; value: string }> = [
      { label: "النجم المضيف", value: exo?.hostname || "—" },
      { label: "نصف القطر (R⊕)", value: exo?.pl_rade != null ? `${exo.pl_rade.toFixed(2)} R⊕` : "غير مقاس" },
      { label: "الكتلة (M⊕)", value: exo?.pl_bmasse != null ? `${exo.pl_bmasse.toFixed(2)} M⊕` : "غير مقاسة" },
      { label: "الدورة المدارية", value: exo?.pl_orbper != null ? `${exo.pl_orbper.toFixed(2)} يوم` : "—" },
      { label: "درجة حرارة التوازن", value: exo?.pl_eqt != null ? `${Math.round(exo.pl_eqt)} K` : "—" },
      { label: "حرارة النجم (Teff)", value: exo?.st_teff != null ? `${Math.round(exo.st_teff)} K` : "—" },
      { label: "البُعد عن الأرض", value: exo?.sy_dist != null ? `${exo.sy_dist.toFixed(1)} pc` : "—" },
      { label: "المرصد وطريقة الاكتشاف", value: `${exo?.disc_facility || "NASA"} · ${exo?.discoverymethod || "Transit"}` },
    ];

    const pythonSnippet = `planet = ${JSON.stringify(exo?.pl_name || id)}
radius_earth = ${exo?.pl_rade ?? 1.5}
orbital_days = ${exo?.pl_orbper ?? 10.0}
distance_ly = round(${exo?.sy_dist ?? 50} * 3.26156, 1)

draw_sun(200, 150, 20, ${JSON.stringify(exo?.hostname || "Host Star")})
draw_orbit(200, 150, 105, "#22d3ee")
draw_satellite(200, 150, 105, 8, "#34d399", 6)
draw_text(12, 286, f"{planet}: {distance_ly} ly · {orbital_days} d", "#67e8f9")
print("Exoplanet:", planet, "| Distance (ly):", distance_ly)
`;

    return {
      kind: "exoplanet",
      id,
      title: exo?.pl_name || id,
      subtitle: `كوكب خارجي مؤكد (${exo?.disc_year || "NASA Archive"}) — NASA Exoplanet Archive`,
      sources: ["NASA Exoplanet Archive TAP API", "NASA Images API"],
      specs,
      images,
      pythonSnippet,
    };
  }

  // Default: one of the 29 NASA gallery models
  const meta = MODEL_NAIF_MAP[id] || { title: id, query: q || `NASA ${id}` };
  const [imgRes, horizonsRes] = await Promise.allSettled([
    fetchNasaImages(q || meta.query),
    meta.naif ? fetchHorizonsSingle(meta.naif) : Promise.resolve(null),
  ]);

  const images = imgRes.status === "fulfilled" ? imgRes.value.items : [];
  const horizons = horizonsRes.status === "fulfilled" ? horizonsRes.value : null;

  const sources = ["NASA Images and Video Library API"];
  if (meta.naif && horizons) sources.unshift("NASA/JPL Horizons API");

  const specs = [...(horizons?.specs || [])];
  if (horizons?.vector) {
    specs.unshift(
      { label: "السرعة المدارية الحالية", value: `${horizons.vector.velocityKms} km/s` },
      {
        label: "البُعد الحالي عن المركز",
        value:
          horizons.vector.distanceAu && horizons.vector.distanceAu > 0.05
            ? `${horizons.vector.distanceAu} AU`
            : `${horizons.vector.distanceKm?.toLocaleString("en-US")} km`,
      }
    );
  }

  const isMarsModel = id === "mars" || id === "perseverance" || id === "curiosity";
  const isEarthModel = id === "earth" || id === "dscovr_epic";
  const isIssModel = id === "iss";

  if (isMarsModel && bundle.marsWeather) sources.push("NASA Curiosity REMS Weather API");
  if (isMarsModel && bundle.marsPhotos) sources.push("NASA Perseverance Raw Images API");
  if (isEarthModel && bundle.epic) sources.push("NASA/NOAA DSCOVR EPIC API", "NASA EONET v3 API", "NASA Langley POWER API");

  if (isEarthModel && bundle.epic) {
    specs.push(
      { label: "بُعد DSCOVR EPIC", value: `${bundle.epic.dscovrDistanceKm.toLocaleString("en-US")} km` },
      { label: "ظواهر EONET نشطة", value: `${bundle.eonet?.count ?? 0} أحداث` }
    );
  }

  const pythonSnippet = isMarsModel
    ? `mars_sol = ${JSON.stringify(bundle.marsWeather?.sols?.[0]?.sol || "latest")}
mars_min_c = ${bundle.marsWeather?.sols?.[0]?.minTempC ?? -70}
mars_max_c = ${bundle.marsWeather?.sols?.[0]?.maxTempC ?? -5}
mars_pressure_pa = ${bundle.marsWeather?.sols?.[0]?.pressurePa ?? 750}

draw_shape("mars", 200, 150, 48, "#f87171")
draw_shape("perseverance", 290, 210, 24, "#22d3ee")
draw_text(12, 286, f"Mars Sol {mars_sol}: {mars_min_c}°C to {mars_max_c}°C · {mars_pressure_pa} Pa", "#fde68a")
print("Mars Sol:", mars_sol, "| Max Temp:", mars_max_c, "C")
`
    : `target = ${JSON.stringify(meta.title)}
velocity_kms = ${horizons?.vector?.velocityKms ?? 0}
distance_au = ${horizons?.vector?.distanceAu ?? 0}

draw_shape(${JSON.stringify(id)}, 200, 150, 46, "#22d3ee")
draw_text(12, 286, f"{target} · NASA/JPL Horizons", "#67e8f9")
print("Target:", target, "| Speed:", velocity_kms, "km/s")
`;

  return {
    kind: "model",
    id,
    title: meta.title,
    subtitle: meta.naif ? `بيانات كاملة ومحدثة من NASA/JPL (NAIF ${meta.naif})` : "ملف بيانات وصور رسمية من أرشيف ناسا",
    sources,
    horizonsSummary: horizons?.summary,
    liveVector: horizons?.vector || null,
    specs,
    images,
    marsWeatherSols: isMarsModel ? bundle.marsWeather?.sols || [] : undefined,
    marsRoverPhotos: isMarsModel ? bundle.marsPhotos?.items || [] : undefined,
    issTrajectory: isIssModel ? bundle.iss?.samples || [] : undefined,
    pythonSnippet,
  };
}

export function createApiApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/nasa/bundle", async (req, res) => {
    try {
      const refresh = req.query.refresh === "1";
      const data = await buildNasaBundle(refresh);
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: "تعذر الاتصال بواجهات برمجة تطبيقات ناسا الرسمية حالياً.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/nasa/images", async (req, res) => {
    try {
      const q = typeof req.query.q === "string" ? req.query.q : "NASA Earth";
      const data = await fetchNasaImages(q);
      res.json(data);
    } catch (error) {
      res.status(502).json({
        error: "تعذر تحميل الوسائط من NASA Images API.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/nasa/profile", async (req, res) => {
    try {
      const kind = typeof req.query.kind === "string" ? req.query.kind : "model";
      const id = typeof req.query.id === "string" ? req.query.id : "earth";
      const q = typeof req.query.q === "string" ? req.query.q : undefined;
      const profile = await buildEntityProfile({ kind, id, q });
      res.json(profile);
    } catch (error) {
      res.status(502).json({
        error: "تعذر جلب ملف البيانات الكامل من ناسا.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const localPyodideDir = path.join(__dirname, "node_modules", "pyodide");
  const pyodideCache = new Map<string, { buf: Buffer; contentType: string }>();
  const PYODIDE_MIME: Record<string, string> = {
    ".js": "application/javascript; charset=utf-8",
    ".mjs": "application/javascript; charset=utf-8",
    ".wasm": "application/wasm",
    ".zip": "application/zip",
    ".json": "application/json; charset=utf-8",
    ".whl": "application/zip",
    ".map": "application/json; charset=utf-8",
  };

  app.get("/pyodide/:file", async (req, res) => {
    const file = path.basename(req.params.file || "");
    if (!/^[A-Za-z0-9._-]+$/.test(file)) {
      res.status(400).send("Invalid filename");
      return;
    }
    try {
      let cached = pyodideCache.get(file);
      if (!cached) {
        const ext = path.extname(file).toLowerCase();
        const localPath = path.join(localPyodideDir, file);
        let buf: Buffer | null = null;
        let contentType = PYODIDE_MIME[ext] || "application/octet-stream";

        try {
          buf = await fs.readFile(localPath);
        } catch {
          const upstream = await fetch(`https://cdn.jsdelivr.net/npm/pyodide@0.26.4/${file}`);
          if (!upstream.ok) {
            res.status(upstream.status).send("Upstream error");
            return;
          }
          buf = Buffer.from(await upstream.arrayBuffer());
          contentType = PYODIDE_MIME[ext] || upstream.headers.get("content-type") || "application/octet-stream";
        }

        cached = { buf, contentType };
        pyodideCache.set(file, cached);
      }
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Content-Length", String(cached.buf.length));
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(cached.buf);
    } catch (error) {
      res.status(502).send(error instanceof Error ? error.message : "Failed to load Pyodide asset");
    }
  });

  return app;
}

export const app = createApiApp();
export default app;

async function startLocalServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mr. Zero NASA Lab listening on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startLocalServer();
}
