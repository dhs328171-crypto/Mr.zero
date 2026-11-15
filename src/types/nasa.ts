export interface IssSample {
  epoch: string;
  altitudeKm: number;
  velocityKms: number;
  rangeKm: number;
}

export interface NasaPlanetEphemeris {
  id: string;
  nameEn: string;
  nameAr: string;
  distanceAu: number;
  velocityKms: number;
  color: string;
}

export interface SbdbApproachItem {
  des: string;
  cd: string;
  distAu: number;
  distLd: number;
  vRelKms: number;
  hMag: number | null;
}

export interface NeoWsItem {
  id: string;
  name: string;
  hazardous: boolean;
  diameterMinM: number;
  diameterMaxM: number;
  velocityKms: number;
  missDistanceKm: number;
  closeApproachDate: string;
}

export interface MarsWeatherSol {
  sol: string;
  terrestrialDate: string;
  minTempC: number | null;
  maxTempC: number | null;
  pressurePa: number | null;
  atmoOpacity: string;
  uvIndex: string;
  sunrise: string;
  sunset: string;
  season: string;
}

export interface MarsRoverPhoto {
  id: string;
  sol: number;
  camera: string;
  title: string;
  caption: string;
  dateTakenUtc: string;
  credit: string;
  imageUrl: string;
}

export interface NasaEpicData {
  source: string;
  endpoint: string;
  identifier: string;
  date: string;
  caption: string;
  imageUrl: string;
  lat: number | null;
  lon: number | null;
  dscovrDistanceKm: number;
  sunDistanceMillionKm: number | null;
  framesAvailable: number;
}

export interface NasaEonetEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  coordinates: number[];
  sourceId: string;
}

export interface NasaExoplanetItem {
  name: string;
  radiusEarth: number | null;
  orbitalPeriodDays: number | null;
  distanceParsecs: number | null;
  discYear: number | null;
  method: string;
}

export interface NasaPowerPoint {
  date: string;
  tempC: number | null;
  solarKwhM2: number | null;
}

export interface NasaMetricRow {
  label: string;
  value: string;
  date: string;
  source: string;
}

export interface ApodItem {
  title: string;
  date: string;
  url: string;
  explanation: string;
  source: string;
  nasaId?: string;
  center?: string;
}

export interface NasaBundle {
  fetchedAt: string;
  iss: {
    source: string;
    endpoint: string;
    samples: IssSample[];
    current: IssSample | null;
  } | null;
  planets: NasaPlanetEphemeris[];
  sbdb: {
    source: string;
    endpoint: string;
    totalUpcoming: number;
    items: SbdbApproachItem[];
  } | null;
  neows: {
    source: string;
    endpoint: string;
    elementCount: number;
    items: NeoWsItem[];
  } | null;
  marsWeather: {
    source: string;
    endpoint: string;
    rover: string;
    sols: MarsWeatherSol[];
  } | null;
  marsPhotos: {
    source: string;
    endpoint: string;
    rover: string;
    items: MarsRoverPhoto[];
  } | null;
  epic: NasaEpicData | null;
  eonet: {
    source: string;
    endpoint: string;
    count: number;
    events: NasaEonetEvent[];
  } | null;
  exoplanets: {
    source: string;
    endpoint: string;
    items: NasaExoplanetItem[];
  } | null;
  power: {
    source: string;
    endpoint: string;
    location: string;
    series: NasaPowerPoint[];
    latestValid: NasaPowerPoint | null;
  } | null;
  apod: ApodItem | null;
  apodGallery: ApodItem[];
  donkiFlareCount: number | null;
  metrics: NasaMetricRow[];
}

export interface NasaImageItem {
  nasaId: string;
  title: string;
  center: string;
  dateCreated: string;
  description: string;
  thumbUrl: string;
}

export interface NasaProfileSpec {
  label: string;
  value: string;
}

export interface NasaEntityProfile {
  kind: "model" | "asteroid" | "exoplanet";
  id: string;
  title: string;
  subtitle: string;
  sources: string[];
  horizonsSummary?: string;
  liveVector?: {
    epoch: string;
    distanceAu?: number;
    distanceKm?: number;
    velocityKms: number;
  } | null;
  specs: NasaProfileSpec[];
  images: NasaImageItem[];
  marsWeatherSols?: MarsWeatherSol[];
  marsRoverPhotos?: MarsRoverPhoto[];
  issTrajectory?: IssSample[];
  sbdbElements?: Array<{ name: string; title: string; value: string; units: string }>;
  pythonSnippet: string;
}

export interface NasaLesson {
  title: string;
  concept: string;
  challenge: string;
  starter: string;
  expect: string;
  hint: string;
  source: string;
  datasetTag: string;
}

export interface NasaQuizItem {
  q: string;
  options: string[];
  answer: number;
  source: string;
}

export interface HoloItem {
  t: "orbit" | "earth" | "sun" | "planet" | "satellite" | "rocket" | "line" | "text" | "shape";
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  r?: number;
  c?: string;
  l?: string;
  dur?: number;
  pr?: number;
  a?: number;
  s?: string | number;
  n?: string;
}
