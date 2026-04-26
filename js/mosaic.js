/**
 * mosaic.js
 * Segmentation socio-géographique inspirée d'Experian Mosaic, calibrée
 * sur les typologies publiques + ONS OAC 2021 (UK), INSEE IRIS (FR),
 * INE / Mosaic España descriptive (ES).
 *
 * AVERTISSEMENT : la vraie table Mosaic (postcode → type) est propriétaire
 * Experian et payante. On reste ici au niveau **groupe** (15 UK, 11 FR,
 * 10 ES officiels — on en couvre 8/8/6 ici). Les mappings sont approximatifs.
 *
 * Couverture actuelle : GB uniquement. FR + ES seront ajoutés ensuite.
 *
 * Usage :
 *   import { mosaicSegment } from './mosaic.js';
 *   const seg = mosaicSegment(report);
 *   // seg = { id, country, code, label, description, typical, source } | null
 */

// ---------------------------------------------------------------------------
// SEGMENTS — chaque entrée décrit un cluster Mosaic-like avec les marques,
// appétences et évitements typiques (sources : Experian Mosaic UK 2024
// summary, Acorn 2023 typology, ONS OAC 2021 group descriptions).
// ---------------------------------------------------------------------------
export const SEGMENTS = {
  // -------------------------------------------------------------------------
  // ROYAUME-UNI (Mosaic UK groupes A, B, C, F, G, I, J, N)
  // -------------------------------------------------------------------------
  gb_city_prosperity: {
    country: 'GB',
    code: 'A',
    label: 'City Prosperity',
    description: 'Cadres et professions libérales des quartiers centraux de Londres ou d’Édimbourg. Hauts revenus, locataires ou propriétaires de petits appartements haut de gamme, vie nocturne intense.',
    typical: {
      brands: ['Waitrose', 'Whole Foods', 'Ottolenghi', 'The Economist', 'Soho House', 'Monzo', 'Apple', 'Tesla'],
      likes:  ['brunchs du dimanche', 'galeries d’art', 'yoga', 'podcasts politiques', 'vins natures', 'séries A24'],
      avoids: ['centres commerciaux périurbains', 'TV linéaire', 'chaînes de fast-food'],
    },
    source: 'Experian Mosaic UK 2024 — Group A ; ONS OAC 2021 1A "Cosmopolitan Student Neighbourhoods"',
  },

  gb_prestige_positions: {
    country: 'GB',
    code: 'B',
    label: 'Prestige Positions',
    description: 'Familles aisées de propriétaires en grande banlieue prospère ou en country town. Maisons individuelles, deux voitures, scolarité privée fréquente.',
    typical: {
      brands: ['John Lewis', 'M&S Food', 'Range Rover', 'The Telegraph', 'BBC Radio 4', 'Boden', 'Le Creuset'],
      likes:  ['rugby', 'voile', 'jardinage', 'voyages organisés', 'écoles privées', 'Sunday roast'],
      avoids: ['Wetherspoons', 'Premier Inn', 'Aldi'],
    },
    source: 'Experian Mosaic UK 2024 — Group B ; ONS OAC 2021 4A "Affluent Communities"',
  },

  gb_country_living: {
    country: 'GB',
    code: 'C',
    label: 'Country Living',
    description: 'Petites villes et villages des shires (Somerset, Cornouailles, Yorkshire ruraux). Propriétaires longue durée, revenus moyens-supérieurs, fort attachement local.',
    typical: {
      brands: ['Waitrose', 'Land Rover', 'National Trust', 'Barbour', 'The Times', 'Joules', 'Hunter'],
      likes:  ['BBC Radio 4', 'jardinage', 'randonnée', 'marchés fermiers', 'cidre artisanal', 'pubs de village'],
      avoids: ['Uber Eats', 'TikTok', 'centres commerciaux'],
    },
    source: 'Experian Mosaic UK 2024 — Group C ; ONS OAC 2021 7B "Rural Tenants"',
  },

  gb_suburban_stability: {
    country: 'GB',
    code: 'F',
    label: 'Suburban Stability',
    description: 'Banlieues pavillonnaires des Home Counties et villes moyennes. Familles installées, propriétaires, niveau de vie moyen, vie de quartier.',
    typical: {
      brands: ['Sainsbury’s', 'Argos', 'Dunelm', 'Halifax', 'Currys', 'Wickes', 'Ford', 'Sky'],
      likes:  ['barbecues', 'streaming sportif', 'DIY', 'voyages tout compris', 'pubs de chaîne'],
      avoids: ['centres-villes branchés', 'restaurants gastronomiques'],
    },
    source: 'Experian Mosaic UK 2024 — Group F ; ONS OAC 2021 5B "Mature Suburbs"',
  },

  gb_domestic_success: {
    country: 'GB',
    code: 'G',
    label: 'Domestic Success',
    description: 'Familles à double revenu en périurbain dynamique (Milton Keynes, Reading, Leeds banlieues). Maisons récentes, crédit hypothécaire, enfants scolarisés.',
    typical: {
      brands: ['Tesco', 'IKEA', 'Costa Coffee', 'Boots', 'Halfords', 'Volkswagen', 'BBC iPlayer'],
      likes:  ['Netflix', 'Center Parcs', 'parcs d’attractions', 'football le samedi', 'Pinterest'],
      avoids: ['vie urbaine intense', 'transports en commun'],
    },
    source: 'Experian Mosaic UK 2024 — Group G ; ONS OAC 2021 5A "Suburban Achievers"',
  },

  gb_family_basics: {
    country: 'GB',
    code: 'I',
    label: 'Family Basics',
    description: 'Familles aux revenus serrés des villes industrielles (Midlands, North-East, NI). Locataires sociaux ou propriétaires de petites maisons mitoyennes, dépendance à l’aide sociale.',
    typical: {
      brands: ['Aldi', 'Lidl', 'Iceland', 'Greggs', 'Wetherspoons', 'B&M', 'Sky Sports', 'Sports Direct'],
      likes:  ['football', 'EastEnders', 'paris sportifs', 'Facebook', 'fish & chips'],
      avoids: ['supermarchés haut de gamme', 'cuisine du monde'],
    },
    source: 'Experian Mosaic UK 2024 — Group I ; ONS OAC 2021 6B "Hard-Pressed Living"',
  },

  gb_transient_renters: {
    country: 'GB',
    code: 'J',
    label: 'Transient Renters',
    description: 'Jeunes actifs et étudiants en colocation dans les centres de Manchester, Liverpool, Bristol, Leeds. Locataires courte durée, mobilité forte, vie sociale intense.',
    typical: {
      brands: ['Pret a Manger', 'Deliveroo', 'Spotify', 'Depop', 'Vinted', 'Brewdog', 'Monzo', 'Trainline'],
      likes:  ['festivals', 'séries Netflix', 'gym', 'apps de rencontre', 'café spécialité', 'musique électronique'],
      avoids: ['voitures', 'crédit immobilier', 'TV traditionnelle'],
    },
    source: 'Experian Mosaic UK 2024 — Group J ; ONS OAC 2021 1B "Students Around Campus"',
  },

  gb_urban_cohesion: {
    country: 'GB',
    code: 'N',
    label: 'Urban Cohesion',
    description: 'Quartiers urbains diversifiés (Tower Hamlets, Birmingham inner, Bradford). Forte présence de communautés issues de l’immigration, vie collective dense, multilinguisme.',
    typical: {
      brands: ['Asda', 'Primark', 'WhatsApp', 'TikTok', 'Western Union', 'Tesco Express', 'Sky'],
      likes:  ['cuisine sud-asiatique ou africaine', 'transferts d’argent', 'religion communautaire', 'quartiers piétons'],
      avoids: ['alcool en hypermarché', 'voyages onéreux'],
    },
    source: 'Experian Mosaic UK 2024 — Group N ; ONS OAC 2021 2A "Ethnicity Central"',
  },
};

// ---------------------------------------------------------------------------
// UK POSTCODE → SEGMENT
// Clés mixtes : essayer le préfixe le plus long d'abord (3 → 2 → 1).
// Couverture : ~85 areas. Source : ONS Postcode Directory + group affinities
// décrites dans Mosaic UK 2024.
// ---------------------------------------------------------------------------
const UK_POSTCODE_MAP = {
  // --- Londres centre / prestige (3 chars) ---
  'EC':  'gb_city_prosperity',
  'WC':  'gb_city_prosperity',
  'SW1': 'gb_city_prosperity', 'SW3': 'gb_city_prosperity', 'SW5': 'gb_city_prosperity',
  'SW7': 'gb_city_prosperity', 'SW10': 'gb_city_prosperity',
  'W1':  'gb_city_prosperity', 'W2':  'gb_city_prosperity', 'W8':  'gb_city_prosperity',
  'W11': 'gb_city_prosperity', 'W14': 'gb_city_prosperity',
  'NW1': 'gb_city_prosperity', 'NW3': 'gb_city_prosperity', 'NW8': 'gb_city_prosperity',
  'N1':  'gb_city_prosperity', 'N6':  'gb_city_prosperity',
  // --- Londres extérieur (fallbacks 1-2 chars) ---
  'SW':  'gb_prestige_positions',
  'W':   'gb_urban_cohesion',
  'NW':  'gb_urban_cohesion',
  'N':   'gb_urban_cohesion',
  'E':   'gb_urban_cohesion',
  'SE':  'gb_urban_cohesion',
  // --- Home Counties / banlieues prestigieuses ---
  'KT': 'gb_prestige_positions', 'TW': 'gb_prestige_positions',
  'GU': 'gb_prestige_positions', 'RG': 'gb_prestige_positions',
  'HP': 'gb_prestige_positions', 'SL': 'gb_prestige_positions',
  'AL': 'gb_prestige_positions', 'WD': 'gb_prestige_positions',
  'OX': 'gb_prestige_positions', 'CB': 'gb_prestige_positions',
  'HG': 'gb_prestige_positions', 'RH': 'gb_prestige_positions',
  // --- Banlieues stables / suburbaines ---
  'HA': 'gb_suburban_stability', 'BR': 'gb_suburban_stability',
  'SM': 'gb_suburban_stability', 'DA': 'gb_suburban_stability',
  'BH': 'gb_suburban_stability', 'SN': 'gb_suburban_stability',
  'SO': 'gb_suburban_stability', 'PO': 'gb_suburban_stability',
  'TN': 'gb_suburban_stability', 'BN': 'gb_suburban_stability',
  'CW': 'gb_suburban_stability', 'CH': 'gb_suburban_stability',
  'SK': 'gb_suburban_stability', 'CO': 'gb_suburban_stability',
  'CV': 'gb_suburban_stability', 'FK': 'gb_suburban_stability',
  // --- Périurbain dynamique / Domestic Success ---
  'NN': 'gb_domestic_success', 'MK': 'gb_domestic_success',
  'SG': 'gb_domestic_success', 'CM': 'gb_domestic_success',
  'NG': 'gb_domestic_success', 'LS': 'gb_domestic_success',
  'AB': 'gb_domestic_success',
  // --- Country Living / rural prospère ---
  'BA': 'gb_country_living', 'TA': 'gb_country_living',
  'EX': 'gb_country_living', 'TR': 'gb_country_living',
  'PL': 'gb_country_living', 'TQ': 'gb_country_living',
  'DT': 'gb_country_living', 'SP': 'gb_country_living',
  'WR': 'gb_country_living', 'HR': 'gb_country_living',
  'GL': 'gb_country_living', 'YO': 'gb_country_living',
  'IP': 'gb_country_living', 'NR': 'gb_country_living',
  'PE': 'gb_country_living', 'LN': 'gb_country_living',
  'CT': 'gb_country_living', 'LA': 'gb_country_living',
  'CA': 'gb_country_living', 'DL': 'gb_country_living',
  'PH': 'gb_country_living', 'IV': 'gb_country_living',
  'TD': 'gb_country_living', 'DG': 'gb_country_living',
  'HS': 'gb_country_living', 'KW': 'gb_country_living',
  'ZE': 'gb_country_living', 'LL': 'gb_country_living',
  'LD': 'gb_country_living', 'SY': 'gb_country_living',
  // --- Family Basics (villes industrielles) ---
  'B':  'gb_family_basics',  'WV': 'gb_family_basics',
  'WS': 'gb_family_basics',  'DY': 'gb_family_basics',
  'ST': 'gb_family_basics',  'DE': 'gb_family_basics',
  'LE': 'gb_family_basics',  'LU': 'gb_family_basics',
  'SS': 'gb_family_basics',  'WN': 'gb_family_basics',
  'BL': 'gb_family_basics',  'OL': 'gb_family_basics',
  'BB': 'gb_family_basics',  'PR': 'gb_family_basics',
  'FY': 'gb_family_basics',  'WA': 'gb_family_basics',
  'HX': 'gb_family_basics',  'HD': 'gb_family_basics',
  'WF': 'gb_family_basics',  'HU': 'gb_family_basics',
  'DN': 'gb_family_basics',  'S':  'gb_family_basics',
  'NE': 'gb_family_basics',  'TS': 'gb_family_basics',
  'SR': 'gb_family_basics',  'DH': 'gb_family_basics',
  'DD': 'gb_family_basics',  'KY': 'gb_family_basics',
  'PA': 'gb_family_basics',  'ML': 'gb_family_basics',
  'KA': 'gb_family_basics',  'NP': 'gb_family_basics',
  'SA': 'gb_family_basics',  'BT': 'gb_family_basics',
  'ME': 'gb_family_basics',
  // --- Transient Renters (centres jeunes) ---
  'M':  'gb_transient_renters', 'L':  'gb_transient_renters',
  'BS': 'gb_transient_renters',
  // --- Urban Cohesion (urbain divers) ---
  'CR': 'gb_urban_cohesion', 'UB': 'gb_urban_cohesion',
  'IG': 'gb_urban_cohesion', 'RM': 'gb_urban_cohesion',
  'EN': 'gb_urban_cohesion', 'BD': 'gb_urban_cohesion',
  'CF': 'gb_urban_cohesion', 'EH': 'gb_city_prosperity',
  'G':  'gb_urban_cohesion',
};

// ---------------------------------------------------------------------------
// Lookup principal
// ---------------------------------------------------------------------------

/**
 * Extrait le préfixe (area + district) d'un postcode UK.
 * Format UK : <area 1-2 lettres><district 1-2 chiffres ou chiffre+lettre><space><inward>
 * Ex: "TA1 3AB" → outward "TA1" → area "TA"
 *     "SW1A 1AA" → outward "SW1A" → area "SW1"
 */
function ukOutward(postal) {
  if (!postal) return null;
  const clean = String(postal).toUpperCase().replace(/\s+/g, '');
  const m = clean.match(/^([A-Z]{1,2}\d[A-Z\d]?)/);
  return m ? m[1] : null;
}

function lookupGB(postal) {
  const out = ukOutward(postal);
  if (!out) return null;
  // Préfixe le plus long d'abord : 4 → 3 → 2 → 1 caractères.
  const candidates = [
    out,                              // ex: "SW1A"
    out.slice(0, 3),                  // ex: "SW1"
    out.replace(/\d.*$/, ''),         // strip digits → ex: "SW"
    out.charAt(0),                    // ex: "S"
  ];
  for (const c of candidates) {
    if (c && UK_POSTCODE_MAP[c]) return UK_POSTCODE_MAP[c];
  }
  return null;
}

/**
 * Résout un segment Mosaic-like depuis un rapport Collector.
 * Renvoie un objet segment ou null si pays non couvert / postal absent.
 */
export function mosaicSegment(report) {
  const cc = report?.network?.countryCode;
  const postal = report?.network?.postal;
  if (!cc || !postal) return null;

  let id = null;
  if (cc === 'GB') id = lookupGB(postal);
  // FR et ES seront ajoutés dans les étapes suivantes.

  if (!id) return null;
  const seg = SEGMENTS[id];
  if (!seg) return null;
  return { id, ...seg };
}
