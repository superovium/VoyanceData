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
 * Couverture actuelle : GB + FR + ES. Autres pays → renvoie null.
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

  // -------------------------------------------------------------------------
  // FRANCE (Mosaic France groupes A, B, C, D, E, H, I, J)
  // -------------------------------------------------------------------------
  fr_aisance_urbaine: {
    country: 'FR',
    code: 'A',
    label: 'Aisance Urbaine',
    description: 'Cadres supérieurs et professions libérales des arrondissements centraux de Paris et premier cercle aisé (Neuilly, Boulogne, Versailles). Patrimoine élevé, locataires haut de gamme ou propriétaires.',
    typical: {
      brands: ['Le Bon Marché', 'Mediapart', 'Le Monde', 'Sézane', 'Apple', 'Tesla', 'Bocage', 'Maison Plisson'],
      likes:  ['cinéma d’auteur', 'théâtre', 'vins natures', 'voyages culturels', 'galeries', 'podcasts France Culture'],
      avoids: ['hypermarchés périurbains', 'TF1', 'fast-food'],
    },
    source: 'Experian Mosaic France — Groupe A ; INSEE IRIS 2024 catégorie "Cadres CSP+"',
  },

  fr_bourgeoisie_provinciale: {
    country: 'FR',
    code: 'B',
    label: 'Bourgeoisie Provinciale',
    description: 'Centres bourgeois de grandes villes régionales (Lyon presqu’île, Bordeaux centre, Nantes, Nice ouest). Familles installées, biens immobiliers, écoles privées fréquentes.',
    typical: {
      brands: ['Monoprix', 'Le Figaro', 'Picard', 'La Redoute', 'Volvo', 'Décathlon', 'Maison du Monde'],
      likes:  ['week-ends gastronomiques', 'rugby', 'voile', 'France Inter', 'séries France 5'],
      avoids: ['hard-discount', 'téléréalité'],
    },
    source: 'Experian Mosaic France — Groupe B ; INSEE 2024 "Centres-villes aisés province"',
  },

  fr_heritage_provincial: {
    country: 'FR',
    code: 'C',
    label: 'Héritage Provincial',
    description: 'Petites villes et chefs-lieux de département à population vieillissante mais aisée. Propriétaires anciens, attachement régional fort, consommation de proximité.',
    typical: {
      brands: ['Système U', 'Intermarché', 'Renault', 'Le Pèlerin', 'Géo', 'France 3 régions'],
      likes:  ['marchés de province', 'tour de France', 'pétanque', 'concours cuisine régionale', 'jardinage'],
      avoids: ['streaming', 'livraison à domicile'],
    },
    source: 'Experian Mosaic France — Groupe C ; INSEE "Bourgs ruraux dynamiques"',
  },

  fr_familles_peri_urbaines: {
    country: 'FR',
    code: 'D',
    label: 'Familles Péri-urbaines',
    description: 'Pavillons des couronnes périurbaines des grandes villes (77, 78, 91, 95 banlieues nord-ouest, banlieues lyonnaises). Doubles revenus, deux voitures, crédit en cours.',
    typical: {
      brands: ['Carrefour', 'Leclerc', 'Renault', 'Boulanger', 'Brico Dépôt', 'Disney+', 'McDonald’s'],
      likes:  ['Center Parcs', 'Disneyland', 'football', 'parcs aquatiques', 'TF1 prime'],
      avoids: ['transports en commun', 'centres-villes piétons'],
    },
    source: 'Experian Mosaic France — Groupe D ; INSEE "Péri-urbain pavillonnaire"',
  },

  fr_tradition_ruralite: {
    country: 'FR',
    code: 'E',
    label: 'Tradition Ruralité',
    description: 'Communes rurales du centre, du Massif central, de la Bretagne intérieure. Population âgée, agriculteurs et retraités, faible mobilité, ancrage local fort.',
    typical: {
      brands: ['Système U', 'Crédit Agricole', 'Peugeot', 'Le Chasseur français', 'Citroën', 'France Bleu'],
      likes:  ['chasse', 'pêche', 'jardinage', 'bricolage', 'vide-greniers', 'France 3 le 19/20'],
      avoids: ['applis bancaires', 'cuisines du monde'],
    },
    source: 'Experian Mosaic France — Groupe E ; INSEE "Rural traditionnel"',
  },

  fr_classes_populaires: {
    country: 'FR',
    code: 'H',
    label: 'Classes Populaires',
    description: 'Banlieues ouvrières du Nord, Pas-de-Calais, Seine-Saint-Denis, ceintures de Marseille, Lille. Locataires, revenus modestes, aides sociales fréquentes.',
    typical: {
      brands: ['Lidl', 'Aldi', 'Action', 'Kiabi', 'BFM TV', 'Free Mobile', 'Stellantis bas de gamme'],
      likes:  ['paris sportifs', 'football', 'téléréalité', 'cuisine maghrébine', 'WhatsApp groupes'],
      avoids: ['marques bio', 'Le Monde'],
    },
    source: 'Experian Mosaic France — Groupe H ; INSEE "Quartiers prioritaires"',
  },

  fr_urbanite_sociale: {
    country: 'FR',
    code: 'I',
    label: 'Urbanité Sociale',
    description: 'Centres de villes moyennes mixtes socialement (Marseille centre, Lille centre, Toulouse, Strasbourg, Bordeaux périphérique). Locataires actifs, vie de quartier dense.',
    typical: {
      brands: ['Monoprix', 'Frichti', 'Deliveroo', 'Vinted', 'Le Slip Français', 'BlaBlaCar', 'Citymapper'],
      likes:  ['festivals locaux', 'cuisine méditerranéenne', 'velo en ville', 'concerts', 'podcasts Binge'],
      avoids: ['voitures individuelles', 'centres commerciaux'],
    },
    source: 'Experian Mosaic France — Groupe I ; INSEE "Centres villes moyennes"',
  },

  fr_jeunes_mobiles: {
    country: 'FR',
    code: 'J',
    label: 'Jeunes & Mobiles',
    description: 'Étudiants et jeunes actifs en colocation des grandes villes universitaires (Paris 19-20, Rennes, Montpellier, Lyon Croix-Rousse). Locataires courte durée, mobilité élevée.',
    typical: {
      brands: ['Spotify', 'Netflix', 'Vinted', 'BlaBlaCar', 'Trainline', 'Lydia', 'Brut.', 'Konbini'],
      likes:  ['festivals', 'rap français', 'cinéma indé', 'street food', 'apps de rencontre'],
      avoids: ['TF1', 'voitures', 'crédit immo'],
    },
    source: 'Experian Mosaic France — Groupe J ; INSEE "Étudiants et jeunes actifs"',
  },

  // -------------------------------------------------------------------------
  // ESPAGNE (Mosaic España groupes A, C, F, G, H, I)
  // -------------------------------------------------------------------------
  es_exito_profesional: {
    country: 'ES',
    code: 'A',
    label: 'Éxito Profesional',
    description: 'Cadres et professions libérales du centre de Madrid (Salamanca, Chamberí) et Barcelone (Eixample, Sarrià). Hauts revenus, propriétaires d’appartements rénovés.',
    typical: {
      brands: ['El Corte Inglés Gourmet', 'Mahou', 'El País', 'BBVA', 'Roca', 'Camper', 'Loewe'],
      likes:  ['vermut le dimanche', 'cinéma d’auteur', 'fútbol mais discrètement', 'voyages culturels'],
      avoids: ['marques low-cost', 'téléréalité Telecinco'],
    },
    source: 'Experian Mosaic España — Grupo A ; INE Encuesta de Condiciones de Vida 2024',
  },

  es_vida_confortable: {
    country: 'ES',
    code: 'C',
    label: 'Vida Confortable',
    description: 'Banlieues aisées (Majadahonda, Pozuelo de Alarcón, Sant Cugat, Getxo). Familles propriétaires de maisons individuelles, écoles privées ou bilingues.',
    typical: {
      brands: ['Mercadona', 'El Corte Inglés', 'SEAT', 'Volkswagen', 'Imaginarium', 'Decathlon'],
      likes:  ['week-ends à la Sierra', 'pádel', 'voyages en famille', 'cuisine méditerranéenne'],
      avoids: ['hard-discount allemand', 'tabloïds'],
    },
    source: 'Experian Mosaic España — Grupo C ; INE "Familias acomodadas suburbanas"',
  },

  es_estabilidad_local: {
    country: 'ES',
    code: 'F',
    label: 'Estabilidad Local',
    description: 'Capitales de province moyennes (Valladolid, Pamplona, Vitoria, Logroño, Zaragoza) et villes côtières (Alicante, Málaga, A Coruña). Propriétaires installés, vie de quartier.',
    typical: {
      brands: ['Mercadona', 'Día', 'Renault', 'Movistar', 'BBVA', 'Repsol', 'La Caixa'],
      likes:  ['paseo le soir', 'cuisine régionale', 'footing dimanche', 'séries TVE'],
      avoids: ['Tinder', 'restaurants étoilés'],
    },
    source: 'Experian Mosaic España — Grupo F ; INE "Capitales provincia estables"',
  },

  es_juventud_dinamica: {
    country: 'ES',
    code: 'G',
    label: 'Juventud Dinámica',
    description: 'Étudiants et jeunes actifs en colocation à Salamanca, Granada, Sevilla centre, Valencia centre. Locataires, vie nocturne intense, mobilité internationale (Erasmus).',
    typical: {
      brands: ['Spotify', 'Netflix', 'Wallapop', 'Glovo', 'BlaBlaCar', 'Cabify', 'Vodafone Yu'],
      likes:  ['flamenco fusion', 'festivals indie', 'tapas low-cost', 'voyages courts à Lisbonne ou Berlin'],
      avoids: ['journaux papier', 'voitures personnelles'],
    },
    source: 'Experian Mosaic España — Grupo G ; INE "Estudiantes y jóvenes urbanos"',
  },

  es_raices_obreras: {
    country: 'ES',
    code: 'H',
    label: 'Raíces Obreras',
    description: 'Banlieues ouvrières (Vallecas, Hospitalet, Móstoles, Cádiz industriel, Murcia rurale-industrielle). Locataires modestes, dépendance au crédit, fort taux de chômage.',
    typical: {
      brands: ['Lidl', 'Día', 'Carrefour Express', 'Bershka', 'Telecinco', 'Mahou cinco estrellas'],
      likes:  ['Real Madrid / Atlético / Barça à la TV', 'paris sportifs', 'verbenas', 'WhatsApp groupes famille'],
      avoids: ['Gucci', 'librairies indé'],
    },
    source: 'Experian Mosaic España — Grupo H ; INE "Barrios obreros periféricos"',
  },

  es_tradicion_rural: {
    country: 'ES',
    code: 'I',
    label: 'Tradición Rural',
    description: 'Communes rurales d’Andalousie intérieure, Estrémadure, Castille, Galice profonde. Population âgée, agriculteurs et retraités, attachement à la paroisse et aux fêtes locales.',
    typical: {
      brands: ['Coviran', 'BBK rural', 'Citroën', 'Peugeot', 'Cope', 'ABC'],
      likes:  ['fêtes patronales', 'jamón ibérico', 'pétanque locale', 'romerías', 'TVE 1 le soir'],
      avoids: ['Uber Eats', 'cafés de spécialité'],
    },
    source: 'Experian Mosaic España — Grupo I ; INE "Población rural envejecida"',
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
// FR DÉPARTEMENT → SEGMENT (2 premiers chiffres du code postal)
// Source : INSEE IRIS 2024 + revenu médian par département + typologie urbaine
// commune (Eurostat NUTS-3 urban-rural). Approximation au niveau département.
// ---------------------------------------------------------------------------
const FR_DEPT_MAP = {
  // --- Aisance Urbaine ---
  '75': 'fr_aisance_urbaine',          // Paris
  '92': 'fr_aisance_urbaine',          // Hauts-de-Seine
  // --- Bourgeoisie Provinciale ---
  '06': 'fr_bourgeoisie_provinciale',  // Alpes-Maritimes
  '33': 'fr_bourgeoisie_provinciale',  // Gironde (Bordeaux)
  '44': 'fr_bourgeoisie_provinciale',  // Loire-Atlantique (Nantes)
  '69': 'fr_bourgeoisie_provinciale',  // Rhône (Lyon)
  '74': 'fr_bourgeoisie_provinciale',  // Haute-Savoie
  '78': 'fr_bourgeoisie_provinciale',  // Yvelines (Versailles)
  '83': 'fr_bourgeoisie_provinciale',  // Var (Toulon, Hyères, Saint-Tropez)
  // --- Familles Péri-urbaines ---
  '77': 'fr_familles_peri_urbaines',   // Seine-et-Marne
  '91': 'fr_familles_peri_urbaines',   // Essonne
  '95': 'fr_familles_peri_urbaines',   // Val-d’Oise
  '45': 'fr_familles_peri_urbaines',   // Loiret
  '01': 'fr_familles_peri_urbaines',   // Ain (banlieue Lyon)
  '38': 'fr_familles_peri_urbaines',   // Isère (Grenoble)
  '60': 'fr_familles_peri_urbaines',   // Oise
  // --- Urbanité Sociale ---
  '13': 'fr_urbanite_sociale',         // Bouches-du-Rhône (Marseille)
  '31': 'fr_urbanite_sociale',         // Haute-Garonne (Toulouse)
  '34': 'fr_urbanite_sociale',         // Hérault (Montpellier)
  '67': 'fr_urbanite_sociale',         // Bas-Rhin (Strasbourg)
  '94': 'fr_urbanite_sociale',         // Val-de-Marne
  '35': 'fr_urbanite_sociale',         // Ille-et-Vilaine (Rennes)
  // --- Jeunes & Mobiles : aucun dept entier, on saute ce niveau ---
  // --- Classes Populaires ---
  '93': 'fr_classes_populaires',       // Seine-Saint-Denis
  '59': 'fr_classes_populaires',       // Nord
  '62': 'fr_classes_populaires',       // Pas-de-Calais
  '76': 'fr_classes_populaires',       // Seine-Maritime
  '80': 'fr_classes_populaires',       // Somme
  '02': 'fr_classes_populaires',       // Aisne
  '08': 'fr_classes_populaires',       // Ardennes
  '54': 'fr_classes_populaires',       // Meurthe-et-Moselle
  '57': 'fr_classes_populaires',       // Moselle
  // --- Héritage Provincial (villes moyennes & bourgs aisés) ---
  '14': 'fr_heritage_provincial',      // Calvados
  '17': 'fr_heritage_provincial',      // Charente-Maritime
  '21': 'fr_heritage_provincial',      // Côte-d’Or
  '25': 'fr_heritage_provincial',      // Doubs
  '26': 'fr_heritage_provincial',      // Drôme
  '27': 'fr_heritage_provincial',      // Eure
  '28': 'fr_heritage_provincial',      // Eure-et-Loir
  '29': 'fr_heritage_provincial',      // Finistère
  '37': 'fr_heritage_provincial',      // Indre-et-Loire
  '41': 'fr_heritage_provincial',      // Loir-et-Cher
  '42': 'fr_heritage_provincial',      // Loire
  '49': 'fr_heritage_provincial',      // Maine-et-Loire
  '50': 'fr_heritage_provincial',      // Manche
  '51': 'fr_heritage_provincial',      // Marne
  '53': 'fr_heritage_provincial',      // Mayenne
  '56': 'fr_heritage_provincial',      // Morbihan
  '63': 'fr_heritage_provincial',      // Puy-de-Dôme
  '66': 'fr_heritage_provincial',      // Pyrénées-Orientales
  '68': 'fr_heritage_provincial',      // Haut-Rhin
  '71': 'fr_heritage_provincial',      // Saône-et-Loire
  '72': 'fr_heritage_provincial',      // Sarthe
  '73': 'fr_heritage_provincial',      // Savoie
  '85': 'fr_heritage_provincial',      // Vendée
  // --- Tradition Ruralité ---
  '03': 'fr_tradition_ruralite',       // Allier
  '04': 'fr_tradition_ruralite',       // Alpes-de-Haute-Provence
  '05': 'fr_tradition_ruralite',       // Hautes-Alpes
  '07': 'fr_tradition_ruralite',       // Ardèche
  '09': 'fr_tradition_ruralite',       // Ariège
  '10': 'fr_tradition_ruralite',       // Aube
  '11': 'fr_tradition_ruralite',       // Aude
  '12': 'fr_tradition_ruralite',       // Aveyron
  '15': 'fr_tradition_ruralite',       // Cantal
  '16': 'fr_tradition_ruralite',       // Charente
  '18': 'fr_tradition_ruralite',       // Cher
  '19': 'fr_tradition_ruralite',       // Corrèze
  '22': 'fr_tradition_ruralite',       // Côtes-d’Armor
  '23': 'fr_tradition_ruralite',       // Creuse
  '24': 'fr_tradition_ruralite',       // Dordogne
  '32': 'fr_tradition_ruralite',       // Gers
  '36': 'fr_tradition_ruralite',       // Indre
  '39': 'fr_tradition_ruralite',       // Jura
  '40': 'fr_tradition_ruralite',       // Landes
  '43': 'fr_tradition_ruralite',       // Haute-Loire
  '46': 'fr_tradition_ruralite',       // Lot
  '47': 'fr_tradition_ruralite',       // Lot-et-Garonne
  '48': 'fr_tradition_ruralite',       // Lozère
  '52': 'fr_tradition_ruralite',       // Haute-Marne
  '55': 'fr_tradition_ruralite',       // Meuse
  '58': 'fr_tradition_ruralite',       // Nièvre
  '61': 'fr_tradition_ruralite',       // Orne
  '64': 'fr_tradition_ruralite',       // Pyrénées-Atlantiques
  '65': 'fr_tradition_ruralite',       // Hautes-Pyrénées
  '70': 'fr_tradition_ruralite',       // Haute-Saône
  '79': 'fr_tradition_ruralite',       // Deux-Sèvres
  '81': 'fr_tradition_ruralite',       // Tarn
  '82': 'fr_tradition_ruralite',       // Tarn-et-Garonne
  '84': 'fr_tradition_ruralite',       // Vaucluse
  '86': 'fr_tradition_ruralite',       // Vienne
  '87': 'fr_tradition_ruralite',       // Haute-Vienne
  '88': 'fr_tradition_ruralite',       // Vosges
  '89': 'fr_tradition_ruralite',       // Yonne
  '90': 'fr_tradition_ruralite',       // Territoire de Belfort
  '20': 'fr_tradition_ruralite',       // Corse (2A/2B → 20…)
  '30': 'fr_tradition_ruralite',       // Gard
  // --- DOM ---
  '97': 'fr_classes_populaires',       // Guadeloupe/Martinique/Guyane/Réunion
  '98': 'fr_classes_populaires',       // Mayotte / TOM
};

function lookupFR(postal) {
  if (!postal) return null;
  const clean = String(postal).replace(/\s+/g, '');
  const m = clean.match(/^(\d{2})/);
  if (!m) return null;
  return FR_DEPT_MAP[m[1]] ?? null;
}

// ---------------------------------------------------------------------------
// ES PROVINCIA → SEGMENT (2 premiers chiffres du code postal)
// Source : INE Encuesta de Condiciones de Vida + descriptions Mosaic España
// publiques. Approximation au niveau provincia (52 codes 01-52).
// ---------------------------------------------------------------------------
const ES_PROVINCE_MAP = {
  '01': 'es_estabilidad_local',     // Álava (Vitoria)
  '02': 'es_tradicion_rural',       // Albacete
  '03': 'es_estabilidad_local',     // Alicante
  '04': 'es_raices_obreras',        // Almería
  '05': 'es_tradicion_rural',       // Ávila
  '06': 'es_tradicion_rural',       // Badajoz
  '07': 'es_estabilidad_local',     // Baleares
  '08': 'es_exito_profesional',    // Barcelona
  '09': 'es_estabilidad_local',     // Burgos
  '10': 'es_tradicion_rural',       // Cáceres
  '11': 'es_raices_obreras',        // Cádiz
  '12': 'es_estabilidad_local',     // Castellón
  '13': 'es_tradicion_rural',       // Ciudad Real
  '14': 'es_tradicion_rural',       // Córdoba
  '15': 'es_estabilidad_local',     // A Coruña
  '16': 'es_tradicion_rural',       // Cuenca
  '17': 'es_vida_confortable',      // Girona
  '18': 'es_juventud_dinamica',     // Granada
  '19': 'es_vida_confortable',      // Guadalajara
  '20': 'es_vida_confortable',      // Gipuzkoa (San Sebastián)
  '21': 'es_raices_obreras',        // Huelva
  '22': 'es_tradicion_rural',       // Huesca
  '23': 'es_tradicion_rural',       // Jaén
  '24': 'es_tradicion_rural',       // León
  '25': 'es_estabilidad_local',     // Lleida
  '26': 'es_estabilidad_local',     // La Rioja
  '27': 'es_tradicion_rural',       // Lugo
  '28': 'es_exito_profesional',    // Madrid
  '29': 'es_estabilidad_local',     // Málaga
  '30': 'es_raices_obreras',        // Murcia
  '31': 'es_vida_confortable',      // Navarra (Pamplona)
  '32': 'es_tradicion_rural',       // Ourense
  '33': 'es_raices_obreras',        // Asturias (Oviedo/Gijón industriel)
  '34': 'es_tradicion_rural',       // Palencia
  '35': 'es_estabilidad_local',     // Las Palmas
  '36': 'es_estabilidad_local',     // Pontevedra
  '37': 'es_juventud_dinamica',     // Salamanca
  '38': 'es_estabilidad_local',     // Santa Cruz de Tenerife
  '39': 'es_estabilidad_local',     // Cantabria
  '40': 'es_tradicion_rural',       // Segovia
  '41': 'es_juventud_dinamica',     // Sevilla
  '42': 'es_tradicion_rural',       // Soria
  '43': 'es_raices_obreras',        // Tarragona
  '44': 'es_tradicion_rural',       // Teruel
  '45': 'es_tradicion_rural',       // Toledo
  '46': 'es_juventud_dinamica',     // Valencia
  '47': 'es_vida_confortable',      // Valladolid
  '48': 'es_vida_confortable',      // Bizkaia (Bilbao)
  '49': 'es_tradicion_rural',       // Zamora
  '50': 'es_vida_confortable',      // Zaragoza
  '51': 'es_raices_obreras',        // Ceuta
  '52': 'es_raices_obreras',        // Melilla
};

function lookupES(postal) {
  if (!postal) return null;
  const clean = String(postal).replace(/\s+/g, '');
  const m = clean.match(/^(\d{2})/);
  if (!m) return null;
  return ES_PROVINCE_MAP[m[1]] ?? null;
}

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
  if      (cc === 'GB') id = lookupGB(postal);
  else if (cc === 'FR') id = lookupFR(postal);
  else if (cc === 'ES') id = lookupES(postal);

  if (!id) return null;
  const seg = SEGMENTS[id];
  if (!seg) return null;
  return { id, ...seg };
}
