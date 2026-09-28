import { Company } from '../types';
import { supabase, supabaseConfigured } from './supabase';

type GovEstablishment = {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  code_commune?: string;
  commune?: string;
  libelle_commune?: string;
  activite_principale?: string;
  activite_principale_naf25?: string;
  libelle_activite_principale?: string;
  est_siege?: boolean;
  etat_administratif?: string;
  liste_enseignes?: string[];
  nom_commercial?: string | null;
  caractere_employeur?: string | null;
  tranche_effectif_salarie?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

type GovResult = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  matching_etablissements?: GovEstablishment[];
  siege?: GovEstablishment;
};

type GovSearchResponse = {
  results?: GovResult[];
  total_results?: number;
  total_pages?: number;
  page?: number;
  per_page?: number;
};

type GeoCommune = {
  nom?: string;
  code?: string;
  codesPostaux?: string[];
  centre?: { coordinates?: [number, number] };
};

type ResolvedCity = {
  name: string;
  codeCommune?: string;
  postalCodes: string[];
  department?: string;
  usePostalCodes?: boolean;
  center?: { lon: number; lat: number };
};

type Poi = {
  x?: number;
  y?: number;
  names?: string[];
  fulltext?: string;
  kind?: string;
  poiType?: string[];
  zipcode?: string;
  city?: string;
  classification?: number;
};

type ResolverCandidate = Company & {
  score?: number;
  matchQuality?: 'high' | 'strong' | 'possible';
  resolvedPlaceName?: string;
  matchSignals?: string[];
  sourceQueries?: string[];
  employer?: boolean;
  employeeBand?: string;
  latitude?: number;
  longitude?: number;
};

type RankedCompany = Company & { _score: number };

type Category =
  | 'food_retail'
  | 'retail'
  | 'restaurant'
  | 'hotel'
  | 'health'
  | 'finance'
  | 'automotive'
  | 'education'
  | 'beauty'
  | 'transport'
  | 'construction'
  | 'tech'
  | 'industry'
  | 'real_estate'
  | 'other';

const GENERIC_WORDS = new Set([
  'france', 'groupe', 'group', 'sas', 'sarl', 'sa', 'eurl', 'sasu', 'societe', 'ste',
  'etablissement', 'magasin', 'store', 'boutique', 'centre', 'commercial', 'siege',
  'social', 'services', 'service', 'le', 'la', 'les', 'de', 'des', 'du', 'et', 'a',
  'au', 'aux', 'the', 'company', 'co',
]);

const BAND_SCORE: Record<string, number> = {
  '00': 0, '01': 2, '02': 4, '03': 6,
  '11': 9, '12': 12, '21': 15, '22': 17,
  '31': 19, '32': 20, '41': 21, '42': 22,
  '51': 23, '52': 24, '53': 25,
};

function normalize(value?: string) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compact(value?: string) {
  return normalize(value).replace(/\s+/g, '');
}

function words(value?: string) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function significantWords(value?: string) {
  return words(value).filter((word) => !GENERIC_WORDS.has(word));
}

function tokenSimilarity(a?: string, b?: string) {
  const left = significantWords(a);
  const right = significantWords(b);
  if (!left.length || !right.length) return 0;
  const A = new Set(left);
  const B = new Set(right);
  let intersection = 0;
  for (const item of A) if (B.has(item)) intersection += 1;
  const union = new Set([...A, ...B]).size;
  return union ? intersection / union : 0;
}

function nameScore(query?: string, candidate?: string) {
  const q = compact(query);
  const c = compact(candidate);
  if (!q || !c) return 0;
  if (q === c) return 120;
  if (c.startsWith(q) || q.startsWith(c)) return 95;
  if (c.includes(q) || q.includes(c)) return 82;
  return Math.round(tokenSimilarity(query, candidate) * 72);
}

function parseNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const radius = 6371000;
  const rad = (value: number) => value * Math.PI / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function ensureAnonymousSession() {
  if (!supabase) return false;
  const current = await supabase.auth.getSession();
  if (current.data.session) return true;
  const signed = await supabase.auth.signInAnonymously();
  return !signed.error && Boolean(signed.data.session);
}

function companyKey(company: Company) {
  return company.siret || `${company.siren}:${normalize(company.address)}:${company.postalCode || ''}`;
}

function mergeCompanies(...groups: Company[][]) {
  const map = new Map<string, Company>();
  for (const group of groups) {
    for (const company of group) {
      const key = companyKey(company);
      const current = map.get(key);
      if (!current) {
        map.set(key, company);
        continue;
      }
      const currentQuality = current.matchQuality === 'high' ? 3 : current.matchQuality === 'strong' ? 2 : 1;
      const nextQuality = company.matchQuality === 'high' ? 3 : company.matchQuality === 'strong' ? 2 : 1;
      if (nextQuality > currentQuality) map.set(key, { ...current, ...company });
    }
  }
  return [...map.values()];
}

async function searchViaResolver(companyQuery: string, cityQuery: string): Promise<Company[] | null> {
  if (!supabaseConfigured || !supabase) return null;
  try {
    const ok = await ensureAnonymousSession();
    if (!ok) return null;
    const { data, error } = await supabase.functions.invoke('employer-search', {
      body: { companyQuery, cityQuery },
    });
    if (error || !data || !Array.isArray(data.candidates)) return null;

    return (data.candidates as ResolverCandidate[]).map((candidate) => ({
      siren: candidate.siren,
      siret: candidate.siret,
      name: candidate.name,
      legalName: candidate.legalName,
      city: candidate.city,
      postalCode: candidate.postalCode,
      address: candidate.address,
      industry: candidate.industry,
      isHeadquarters: candidate.isHeadquarters,
      employer: candidate.employer,
      employeeBand: candidate.employeeBand,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      matchQuality: candidate.matchQuality,
      resolvedPlaceName: candidate.resolvedPlaceName,
      matchSignals: candidate.matchSignals,
    }));
  } catch {
    return null;
  }
}

function metroDepartment(code?: string) {
  if (code === '75056') return '75';
  if (code === '69123') return '69';
  if (code === '13055') return '13';
  return undefined;
}

function mapCommune(row: GeoCommune, rawCity: string): ResolvedCity {
  const postalCodes = Array.isArray(row.codesPostaux) ? row.codesPostaux : (/^\d{5}$/.test(rawCity) ? [rawCity] : []);
  const department = metroDepartment(row.code);
  const coords = row.centre?.coordinates;
  return {
    name: row.nom || rawCity,
    codeCommune: row.code,
    postalCodes,
    department,
    usePostalCodes: Boolean(department && postalCodes.length > 1),
    center: Array.isArray(coords) && coords.length >= 2 && Number.isFinite(Number(coords[0])) && Number.isFinite(Number(coords[1]))
      ? { lon: Number(coords[0]), lat: Number(coords[1]) }
      : undefined,
  };
}

async function resolveFrenchCities(cityQuery: string): Promise<ResolvedCity[]> {
  const raw = cityQuery.trim();
  if (!raw) return [];

  try {
    const params = new URLSearchParams({ fields: 'nom,code,codesPostaux,centre', boost: 'population', limit: '12' });
    if (/^\d{5}$/.test(raw)) params.set('codePostal', raw);
    else params.set('nom', raw);

    const rows = await fetchJson(`https://geo.api.gouv.fr/communes?${params.toString()}`) as GeoCommune[];
    if (!Array.isArray(rows) || rows.length === 0) {
      return /^\d{5}$/.test(raw) ? [{ name: raw, postalCodes: [raw] }] : [];
    }

    const needle = compact(raw);
    const exact = rows.filter((row) => /^\d{5}$/.test(raw)
      ? row.codesPostaux?.includes(raw)
      : compact(row.nom) === needle);
    const selected = exact.length ? exact : rows;

    const dedup = new Map<string, ResolvedCity>();
    for (const row of selected.slice(0, 6)) {
      const city = mapCommune(row, raw);
      const key = `${city.codeCommune || ''}:${city.postalCodes.join(',')}:${normalize(city.name)}`;
      if (!dedup.has(key)) dedup.set(key, city);
    }
    return [...dedup.values()];
  } catch {
    return /^\d{5}$/.test(raw) ? [{ name: raw, postalCodes: [raw] }] : [];
  }
}

function establishmentMatchesCity(establishment: GovEstablishment, city: ResolvedCity | null, rawCity: string) {
  if (!city) {
    const needle = compact(rawCity);
    const place = `${establishment.libelle_commune || ''} ${establishment.commune || ''} ${establishment.code_postal || ''}`;
    return !needle || compact(place).includes(needle);
  }

  if (city.usePostalCodes && city.postalCodes.length && establishment.code_postal) {
    return city.postalCodes.includes(establishment.code_postal);
  }
  if (city.codeCommune && establishment.commune) return establishment.commune === city.codeCommune;
  if (city.postalCodes.length && establishment.code_postal) return city.postalCodes.includes(establishment.code_postal);
  return compact(establishment.libelle_commune) === compact(city.name);
}

function queryVariants(companyQuery: string) {
  const raw = companyQuery.trim();
  const variants = new Set<string>();
  const add = (value?: string) => {
    const clean = (value || '').replace(/\s+/g, ' ').trim();
    if (clean.length >= 2) variants.add(clean);
  };

  add(raw);
  add(raw.replace(/[’']/g, ' '));
  add(raw.replace(/[-_/.,()]/g, ' '));

  const significant = significantWords(raw);
  if (significant.length >= 1) add(significant.join(' '));
  if (significant.length >= 2) add(significant.slice(0, 2).join(' '));

  const n = normalize(raw);
  if (/\b(super|hyper)\s*u\b|\bu\s*express\b|\butile\b|\bsysteme\s*u\b/.test(n)) {
    ['Super U', 'Hyper U', 'U Express', 'Utile', 'Système U'].forEach(add);
  }
  if (/\bcarrefour\b/.test(n)) ['Carrefour', 'Carrefour Market', 'Carrefour City', 'Carrefour Contact', 'Carrefour Express'].forEach(add);
  if (/\bintermarche\b/.test(n)) ['Intermarché', 'Intermarché Hyper', 'Intermarché Super', 'Intermarché Contact'].forEach(add);
  if (/\bauchan\b/.test(n)) ['Auchan', 'Auchan Hypermarché', 'Auchan Supermarché'].forEach(add);
  if (/\b(e\s*leclerc|leclerc)\b/.test(n)) ['E.Leclerc', 'Leclerc'].forEach(add);
  if (/\bcasino\b/.test(n)) ['Casino', 'Casino Supermarchés', 'Géant Casino'].forEach(add);

  return [...variants].slice(0, 10);
}

async function searchApiPage(query: string, city: ResolvedCity | null, rawCity: string, page = 1) {
  const q = query.trim();
  const directId = /^\d{9}$/.test(q) || /^\d{14}$/.test(q);
  const params = new URLSearchParams({
    q: q,
    page: String(page),
    per_page: '25',
    limite_matching_etablissements: '100',
  });

  if (!directId) {
    if (city?.department && city.usePostalCodes) params.set('departement', city.department);
    else if (city?.codeCommune) params.set('code_commune', city.codeCommune);
    else if (/^\d{5}$/.test(rawCity)) params.set('code_postal', rawCity);
  }

  const json = await fetchJson(`https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`) as GovSearchResponse;
  return json;
}

async function searchNationalPage(query: string, page = 1) {
  const params = new URLSearchParams({
    q: query.trim(),
    page: String(page),
    per_page: '25',
    limite_matching_etablissements: '100',
  });
  return fetchJson(`https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`) as Promise<GovSearchResponse>;
}

async function searchNearPoint(poi: Poi, radiusKm = 0.25) {
  const lat = Number(poi.y);
  const lon = Number(poi.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [] as GovResult[];
  const params = new URLSearchParams({
    lat: String(lat),
    long: String(lon),
    radius: String(radiusKm),
    page: '1',
    per_page: '25',
    limite_matching_etablissements: '100',
  });
  const json = await fetchJson(`https://recherche-entreprises.api.gouv.fr/near_point?${params.toString()}`) as GovSearchResponse;
  return Array.isArray(json?.results) ? json.results : [];
}

async function searchPois(companyQuery: string, city: ResolvedCity | null, rawCity: string): Promise<Poi[]> {
  const params = new URLSearchParams({
    text: companyQuery.trim(),
    type: 'PositionOfInterest',
    maximumResponses: '15',
  });
  if (city?.codeCommune && !city.usePostalCodes) params.set('citycode', city.codeCommune);
  else if (city?.postalCodes?.length === 1) params.set('zipcode', city.postalCodes[0]);
  else if (/^\d{5}$/.test(rawCity.trim())) params.set('zipcode', rawCity.trim());
  if (city?.center) params.set('lonlat', `${city.center.lon},${city.center.lat}`);

  try {
    const json = await fetchJson(`https://data.geopf.fr/geocodage/completion/?${params.toString()}`);
    const rows = Array.isArray(json?.results) ? json.results as Poi[] : [];
    return rows.filter((poi) => Number.isFinite(Number(poi.x)) && Number.isFinite(Number(poi.y)));
  } catch {
    return [];
  }
}

function poiName(poi: Poi) {
  return poi.names?.find(Boolean) || poi.fulltext || '';
}

function poiRelevance(query: string, poi: Poi, city: ResolvedCity | null) {
  let score = nameScore(query, poiName(poi));
  if (poi.fulltext && poi.fulltext !== poiName(poi)) score = Math.max(score, Math.round(nameScore(query, poi.fulltext) * 0.8));
  if (city?.postalCodes.length && poi.zipcode && city.postalCodes.includes(poi.zipcode)) score += 18;
  if (city?.name && poi.city && compact(city.name) === compact(poi.city)) score += 14;
  if (typeof poi.classification === 'number' && Number.isFinite(poi.classification)) score += Math.max(0, 10 - Math.min(10, poi.classification));
  return score;
}

function candidateCategory(establishment: GovEstablishment): Category {
  const code = (establishment.activite_principale || establishment.activite_principale_naf25 || '').replace('.', '');
  const label = normalize(establishment.libelle_activite_principale || '');
  if (/^(4711|471|472)/.test(code) || /hypermarche|supermarche|commerce.*aliment/.test(label)) return 'food_retail';
  if (/^47/.test(code) || /commerce de detail|magasin|boutique/.test(label)) return 'retail';
  if (/^56/.test(code) || /restaurant|restauration|debit de boissons|traiteur/.test(label)) return 'restaurant';
  if (/^55/.test(code) || /hotel|hebergement/.test(label)) return 'hotel';
  if (/^(86|87|88)/.test(code) || /sante|medical|hopital|clinique|pharmacie/.test(label)) return 'health';
  if (/^(64|65|66)/.test(code) || /banque|assurance|financ/.test(label)) return 'finance';
  if (/^45/.test(code) || /automobile|garage|vehicule/.test(label)) return 'automotive';
  if (/^85/.test(code) || /enseignement|ecole|formation/.test(label)) return 'education';
  if (/^9602/.test(code) || /coiffure|beaute|esthetique/.test(label)) return 'beauty';
  if (/^(49|50|51|52|53)/.test(code) || /transport|logistique|poste|courrier/.test(label)) return 'transport';
  if (/^(41|42|43)/.test(code) || /construction|batiment|travaux/.test(label)) return 'construction';
  if (/^(62|63)/.test(code) || /informatique|logiciel|programmation|donnees/.test(label)) return 'tech';
  if (/^(10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33)/.test(code)) return 'industry';
  if (/^68/.test(code) || /immobili/.test(label)) return 'real_estate';
  return 'other';
}

function poiCategory(poi: Poi): Category {
  const value = normalize(`${poi.kind || ''} ${(poi.poiType || []).join(' ')} ${poi.fulltext || ''}`);
  if (/hypermarche|supermarche|alimentation|epicerie|grande surface|centre commercial/.test(value)) return 'food_retail';
  if (/restaurant|restauration|fast food|cafe|bar|brasserie|sushi|pizzeria/.test(value)) return 'restaurant';
  if (/hotel|hebergement|camping/.test(value)) return 'hotel';
  if (/pharmacie|hopital|clinique|sante|medecin|medical/.test(value)) return 'health';
  if (/banque|assurance|finance/.test(value)) return 'finance';
  if (/garage|automobile|station service|concession/.test(value)) return 'automotive';
  if (/ecole|college|lycee|universite|enseignement|formation/.test(value)) return 'education';
  if (/coiffeur|coiffure|beaute|esthetique/.test(value)) return 'beauty';
  if (/magasin|boutique|commerce|shopping/.test(value)) return 'retail';
  if (/gare|transport|aeroport|logistique/.test(value)) return 'transport';
  return 'other';
}

function categoriesCompatible(left: Category, right: Category) {
  if (left === 'other' || right === 'other') return 0;
  if (left === right) return 1;
  if ((left === 'food_retail' && right === 'retail') || (left === 'retail' && right === 'food_retail')) return 0.7;
  return -1;
}

function establishmentNames(result: GovResult, establishment: GovEstablishment) {
  return [
    ...(Array.isArray(establishment.liste_enseignes) ? establishment.liste_enseignes : []),
    establishment.nom_commercial || '',
    result.nom_complet || '',
    result.nom_raison_sociale || '',
  ].map((name) => name.trim()).filter(Boolean);
}

function bestDisplayName(result: GovResult, establishment: GovEstablishment, companyQuery: string) {
  const names = establishmentNames(result, establishment);
  if (!names.length) return '';
  return [...names].sort((a, b) => nameScore(companyQuery, b) - nameScore(companyQuery, a))[0];
}

function mapGovResults(
  results: GovResult[],
  companyQuery: string,
  cities: ResolvedCity[],
  rawCity: string,
  source: 'filtered' | 'national' | 'near',
  poi?: Poi,
) {
  const mapped: RankedCompany[] = [];
  const directId = /^\d{9}$/.test(companyQuery.trim()) || /^\d{14}$/.test(companyQuery.trim());
  const cityPool = cities.length ? cities : [null];

  for (const result of results) {
    if (!result.siren) continue;
    const legalName = (result.nom_complet || result.nom_raison_sociale || '').trim();
    const establishments = [...(result.matching_etablissements || [])];
    if (result.siege?.siret && !establishments.some((item) => item.siret === result.siege?.siret)) establishments.push(result.siege);

    for (const establishment of establishments) {
      if (!establishment.siret || (establishment.etat_administratif && establishment.etat_administratif !== 'A')) continue;
      if (source !== 'near' && !directId && !cityPool.some((city) => establishmentMatchesCity(establishment, city, rawCity))) continue;

      const names = establishmentNames(result, establishment);
      const bestName = bestDisplayName(result, establishment, companyQuery) || legalName;
      const directName = Math.max(...names.map((name) => nameScore(companyQuery, name)), 0);
      let score = directName;
      score += establishment.caractere_employeur === 'O' ? 14 : establishment.caractere_employeur === 'N' ? -8 : 0;
      score += establishment.tranche_effectif_salarie ? (BAND_SCORE[establishment.tranche_effectif_salarie] || 3) : 0;
      if (establishment.est_siege) score += 3;
      if (source === 'filtered') score += 18;
      if (source === 'national') score += 4;

      const signals: string[] = [];
      if (directName >= 110) signals.push('nom exact');
      else if (directName >= 70) signals.push('nom proche');
      if (establishment.caractere_employeur === 'O') signals.push('entreprise employeur');

      if (poi) {
        const lat = parseNumber(establishment.latitude);
        const lon = parseNumber(establishment.longitude);
        const pLat = Number(poi.y);
        const pLon = Number(poi.x);
        let distance: number | undefined;
        if (lat !== undefined && lon !== undefined && Number.isFinite(pLat) && Number.isFinite(pLon)) {
          distance = distanceMeters({ lat, lon }, { lat: pLat, lon: pLon });
          if (distance <= 40) score += 70;
          else if (distance <= 100) score += 55;
          else if (distance <= 220) score += 35;
          else if (distance <= 500) score += 16;
          else if (distance > 1200) score -= 25;
          if (distance <= 220) signals.push('adresse du lieu confirmée');
        }

        const compatibility = categoriesCompatible(candidateCategory(establishment), poiCategory(poi));
        if (compatibility === 1) {
          score += 58;
          signals.push('activité cohérente');
        } else if (compatibility > 0) {
          score += 28;
          signals.push('activité proche');
        } else if (compatibility < 0) {
          score -= 52;
          signals.push('activité différente');
        }

        const placeName = poiName(poi);
        const placeNameScore = Math.max(...names.map((name) => nameScore(placeName, name)), 0);
        if (placeNameScore >= 85) {
          score += 35;
          signals.push('enseigne confirmée');
        }
      }

      if (!directId && source !== 'near' && directName < 12) continue;

      mapped.push({
        siren: result.siren,
        siret: establishment.siret,
        name: bestName,
        legalName: legalName || undefined,
        city: establishment.libelle_commune || cities[0]?.name || rawCity,
        postalCode: establishment.code_postal,
        address: establishment.adresse,
        industry: establishment.libelle_activite_principale || establishment.activite_principale,
        isHeadquarters: Boolean(establishment.est_siege),
        employer: establishment.caractere_employeur === 'O' ? true : establishment.caractere_employeur === 'N' ? false : undefined,
        employeeBand: establishment.tranche_effectif_salarie || undefined,
        latitude: parseNumber(establishment.latitude),
        longitude: parseNumber(establishment.longitude),
        matchQuality: score >= 190 ? 'high' : score >= 105 ? 'strong' : 'possible',
        resolvedPlaceName: poi ? poiName(poi) : undefined,
        matchSignals: signals,
        _score: score,
      });
    }
  }
  return mapped;
}

function finalizeRanked(groups: RankedCompany[][], limit = 30) {
  const map = new Map<string, RankedCompany>();
  for (const group of groups) {
    for (const item of group) {
      const key = companyKey(item);
      const current = map.get(key);
      if (!current || item._score > current._score) map.set(key, item);
    }
  }
  return [...map.values()]
    .sort((a, b) => b._score - a._score || Number(b.employer) - Number(a.employer))
    .slice(0, limit)
    .map(({ _score: _ignored, ...company }) => company);
}

async function filteredOfficialSearch(companyQuery: string, cities: ResolvedCity[], rawCity: string) {
  const variants = queryVariants(companyQuery);
  const targetCities = cities.length ? cities.slice(0, 5) : [null];
  const groups: RankedCompany[][] = [];

  for (const variant of variants.slice(0, 5)) {
    for (const city of targetCities) {
      try {
        const first = await searchApiPage(variant, city, rawCity, 1);
        const firstRows = Array.isArray(first.results) ? first.results : [];
        groups.push(mapGovResults(firstRows, companyQuery, city ? [city] : [], rawCity, 'filtered'));

        if ((first.total_pages || 1) > 1 && groups.flat().length < 20) {
          const second = await searchApiPage(variant, city, rawCity, 2);
          groups.push(mapGovResults(Array.isArray(second.results) ? second.results : [], companyQuery, city ? [city] : [], rawCity, 'filtered'));
        }
      } catch {
        // Continue the cascade with the remaining city/name variants.
      }
      if (finalizeRanked(groups, 30).length >= 12) return finalizeRanked(groups, 30);
    }
  }
  return finalizeRanked(groups, 30);
}

async function poiNearSearch(companyQuery: string, cities: ResolvedCity[], rawCity: string) {
  const poiRows: Array<{ poi: Poi; city: ResolvedCity | null; score: number }> = [];
  const targetCities = cities.length ? cities.slice(0, 4) : [null];

  for (const city of targetCities) {
    const pois = await searchPois(companyQuery, city, rawCity);
    for (const poi of pois) {
      const score = poiRelevance(companyQuery, poi, city);
      if (score >= 28) poiRows.push({ poi, city, score });
    }
  }

  poiRows.sort((a, b) => b.score - a.score);
  const groups: RankedCompany[][] = [];
  const seenPoi = new Set<string>();

  for (const row of poiRows.slice(0, 5)) {
    const key = `${Number(row.poi.x).toFixed(5)}:${Number(row.poi.y).toFixed(5)}`;
    if (seenPoi.has(key)) continue;
    seenPoi.add(key);
    try {
      const nearRows = await searchNearPoint(row.poi, 0.3);
      groups.push(mapGovResults(nearRows, companyQuery, row.city ? [row.city] : cities, rawCity, 'near', row.poi));
    } catch {
      // A missing geo response should never make the normal official search fail.
    }
    if (finalizeRanked(groups, 25).length >= 8) break;
  }
  return finalizeRanked(groups, 25);
}

function discoveryLabels(results: GovResult[], companyQuery: string) {
  const scored = new Map<string, number>();
  for (const result of results) {
    const labels = [result.nom_complet, result.nom_raison_sociale].filter(Boolean) as string[];
    for (const establishment of [...(result.matching_etablissements || []), ...(result.siege ? [result.siege] : [])]) {
      if (!establishment) continue;
      if (Array.isArray(establishment.liste_enseignes)) labels.push(...establishment.liste_enseignes.filter(Boolean));
      if (establishment.nom_commercial) labels.push(establishment.nom_commercial);
    }
    for (const label of labels) {
      const score = nameScore(companyQuery, label);
      if (score >= 25) scored.set(label, Math.max(scored.get(label) || 0, score));
    }
  }
  return [...scored.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label).slice(0, 8);
}

async function nationalDiscoverySearch(companyQuery: string, cities: ResolvedCity[], rawCity: string) {
  const variants = queryVariants(companyQuery).slice(0, 3);
  const national: GovResult[] = [];

  for (const variant of variants) {
    try {
      const first = await searchNationalPage(variant, 1);
      national.push(...(Array.isArray(first.results) ? first.results : []));
      if ((first.total_pages || 1) > 1 && national.length < 35) {
        const second = await searchNationalPage(variant, 2);
        national.push(...(Array.isArray(second.results) ? second.results : []));
      }
    } catch {
      // Continue with the next spelling variant.
    }
  }

  const direct = mapGovResults(national, companyQuery, cities, rawCity, 'national');
  if (finalizeRanked([direct], 20).length) return finalizeRanked([direct], 20);

  const labels = discoveryLabels(national, companyQuery);
  const rematched: RankedCompany[][] = [];
  for (const label of labels.slice(0, 6)) {
    for (const city of (cities.length ? cities.slice(0, 4) : [null])) {
      try {
        const response = await searchApiPage(label, city, rawCity, 1);
        rematched.push(mapGovResults(Array.isArray(response.results) ? response.results : [], companyQuery, city ? [city] : [], rawCity, 'filtered'));
      } catch {
        // Ignore this rematch and keep trying the remaining candidate names.
      }
    }
    if (finalizeRanked(rematched, 20).length >= 8) break;
  }
  return finalizeRanked(rematched, 20);
}

async function directIdentifierSearch(companyQuery: string) {
  const value = companyQuery.trim();
  if (!/^\d{9}$/.test(value) && !/^\d{14}$/.test(value)) return [] as Company[];
  try {
    const response = await searchNationalPage(value, 1);
    const rows = Array.isArray(response.results) ? response.results : [];
    return finalizeRanked([mapGovResults(rows, value, [], '', 'national')], 30);
  } catch {
    return [];
  }
}

async function exhaustiveOfficialSearch(companyQuery: string, cityQuery: string) {
  const direct = await directIdentifierSearch(companyQuery);
  if (direct.length) return direct;

  const cities = await resolveFrenchCities(cityQuery);

  const filtered = await filteredOfficialSearch(companyQuery, cities, cityQuery);
  if (filtered.length >= 3 || filtered.some((item) => item.matchQuality === 'high')) return filtered;

  const near = await poiNearSearch(companyQuery, cities, cityQuery);
  const combined = mergeCompanies(filtered, near);
  if (combined.length >= 3 || combined.some((item) => item.matchQuality === 'high')) return combined;

  const national = await nationalDiscoverySearch(companyQuery, cities, cityQuery);
  return mergeCompanies(combined, national).slice(0, 30);
}

export async function searchFrenchEstablishments(companyQuery: string, cityQuery: string): Promise<Company[]> {
  const company = companyQuery.trim();
  const city = cityQuery.trim();
  if (company.length < 2 || city.length < 2) return [];

  // The server resolver remains the fast path. If it does not find a convincing
  // match, the client falls back to the official French register through several
  // independent routes (city-filtered search, POI + near_point, then national
  // discovery). This intentionally favors recall: a public French establishment
  // should not disappear simply because its legal name differs from its storefront name.
  const resolved = await searchViaResolver(company, city);
  if (resolved && (resolved.length >= 3 || resolved.some((item) => item.matchQuality === 'high'))) {
    return resolved;
  }

  const exhaustive = await exhaustiveOfficialSearch(company, city);
  if (!resolved?.length) return exhaustive;
  return mergeCompanies(resolved, exhaustive).slice(0, 30);
}
