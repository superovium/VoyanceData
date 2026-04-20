/**
 * psychometrics.js
 * Inférences psycho-sociales à partir du rapport Collector, calibrées sur la
 * littérature scientifique. Chaque signal cite sa source : l'idée est d'oser
 * des déductions fortes (consommation, traits de personnalité) mais de pouvoir
 * pointer la recherche qui les justifie.
 *
 * Frameworks utilisés :
 *   - Big Five (OCEAN)           → scoreBigFive()
 *   - Westin Privacy Index       → westinSegment()
 *   - Chronotype (morningness)   → chronotype()
 *   - Consumer profile dérivé    → consumerProfile()
 *
 * AVERTISSEMENT : chaque corrélation unitaire est faible (r ≈ 0.15–0.30).
 * C'est l'agrégation de 8–12 signaux indépendants qui rend la prédiction
 * ressemblante. On renvoie des scores "relatifs à la moyenne", jamais absolus.
 */

// ---------------------------------------------------------------------------
// 1. SIGNAUX → DELTAS BIG FIVE
// Chaque signal renvoie une intensité ∈ [0,1]. Les `effects` sont des deltas
// en unités de z (écarts-types) appliqués quand l'intensité vaut 1.
// Les ordres de grandeur viennent des méta-analyses (Azucar 2018 : r~0.29).
// ---------------------------------------------------------------------------

const SIGNALS = [
  {
    id: 'eveningness',
    label: 'Chronotype vespéral',
    test: (d) => {
      const h = d.locale?.localHour;
      if (h == null) return 0;
      if (h >= 1 && h < 5)        return 1.0;
      if (h === 0 || h === 23)    return 0.7;
      if (h === 22)               return 0.5;
      if (h >= 20 && h < 22)      return 0.3;
      if (h >= 5 && h < 8)        return 0.2;
      return 0;
    },
    effects: { O: +0.4, C: -0.5, E:  0.0, A:  0.0, N: +0.3 },
    source: 'Cavallera & Giudici (2008), Personality & Individual Differences ; Díaz-Morales (2007)',
  },

  {
    id: 'polyglot',
    label: 'Profil polyglotte (≥3 langues)',
    test: (d) => {
      const n = d.browser?.languages?.length ?? 0;
      if (n >= 4) return 1.0;
      if (n === 3) return 0.7;
      if (n === 2) return 0.35;
      return 0;
    },
    effects: { O: +0.6, C:  0.0, E: +0.1, A: +0.1, N:  0.0 },
    source: 'Dewaele & Stavans (2014), International Journal of Multilingualism ; Bialystok (2017)',
  },

  {
    id: 'apple_ecosystem',
    label: 'Écosystème Apple',
    test: (d) => {
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      const plat = (d.browser?.uaData?.platform ?? '').toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad')) return 1;
      if (ua.includes('mac os') || plat.includes('mac')) return 1;
      return 0;
    },
    effects: { O: +0.1, C:  0.0, E: +0.3, A:  0.0, N:  0.0 },
    source: 'Shaw, Ellis, Ziegler (2018), Personality & Individual Differences',
  },

  {
    id: 'budget_android',
    label: 'Android milieu de gamme',
    test: (d) => {
      const model = (d.browser?.uaData?.model ?? '').toLowerCase();
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      const budget = /(^|\s)(mi |redmi|realme|oppo|vivo|poco|honor|infinix|tecno)/i;
      if (model && budget.test(model)) return 1;
      if (budget.test(ua)) return 0.8;
      return 0;
    },
    effects: { O:  0.0, C: +0.1, E: -0.1, A:  0.0, N:  0.0 },
    source: 'GWI Device Report (2023) ; Kantar ComTech Panel (EU5)',
  },

  {
    id: 'privacy_vigilance',
    label: 'Vigilance à la traçabilité',
    test: (d) => {
      const dnt = d.browser?.doNotTrack;
      const reducedData = d.preferences?.reducedData;
      const cookies = d.browser?.cookiesEnabled;
      let s = 0;
      if (dnt === '1' || dnt === 1) s += 0.6;
      if (reducedData) s += 0.2;
      if (cookies === false) s += 0.3;
      return Math.min(s, 1);
    },
    effects: { O: +0.2, C: +0.2, E: -0.1, A: -0.1, N: +0.2 },
    source: 'Schomakers, Lidynia, Müllmann & Ziefle (2019), Computers in Human Behavior ; Westin Privacy Segmentation',
  },

  {
    id: 'bedtime_phone',
    label: 'Téléphone au lit après 22h',
    test: (d) => {
      const h = d.locale?.localHour;
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      const isMobile = d.browser?.uaData?.mobile === true
        || ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
      const portrait = (d.display?.orientation ?? '').startsWith('portrait');
      if (!isMobile || h == null) return 0;
      let s = 0;
      if (h >= 22 || h < 2) s += 0.6;
      if (h >= 23 || h < 1) s += 0.2;
      if (portrait) s += 0.2;
      return Math.min(s, 1);
    },
    effects: { O:  0.0, C: -0.2, E:  0.0, A:  0.0, N: +0.5 },
    source: 'Lemola, Perkinson-Gloor, Brand, Dewald-Kaufmann & Grob (2015), J. Youth & Adolescence',
  },

  {
    id: 'battery_anxiety',
    label: 'Batterie basse, non branchée',
    test: (d) => {
      const lvl = d.battery?.level;
      if (lvl == null || d.battery?.charging) return 0;
      if (lvl < 0.15) return 1.0;
      if (lvl < 0.30) return 0.6;
      if (lvl < 0.50) return 0.3;
      return 0;
    },
    effects: { O:  0.0, C: -0.3, E:  0.0, A:  0.0, N: +0.4 },
    source: 'Deng, Nicholas & Chen (2019), Comp. Human Behavior ; Pew Research (2015), "Low-Battery Anxiety"',
  },

  {
    id: 'acculturation_gap',
    label: 'Langue ≠ pays IP',
    test: (d) => {
      const lang = d.browser?.language?.slice(0, 2).toLowerCase();
      const cc = d.network?.countryCode;
      if (!lang || !cc) return 0;
      const expected = {
        fr: ['FR','BE','CH','LU','MC','CA'],
        en: ['US','GB','IE','AU','NZ','CA','ZA'],
        de: ['DE','AT','CH','LI'],
        es: ['ES','MX','AR','CL','CO','PE','VE','UY'],
        it: ['IT','CH','SM'],
        pt: ['PT','BR','AO','MZ'],
        nl: ['NL','BE'],
        ja: ['JP'], ko: ['KR'],
        zh: ['CN','TW','HK','SG'],
        ru: ['RU','BY','KZ'],
        ar: ['SA','AE','EG','MA','DZ','TN','JO','LB'],
        tr: ['TR'], pl: ['PL'],
      }[lang];
      if (!expected) return 0;
      return expected.includes(cc) ? 0 : 1;
    },
    effects: { O: +0.5, C: +0.1, E:  0.0, A: +0.2, N: +0.2 },
    source: 'Berry (1997), Applied Psychology ; Benet-Martínez & Haritatos (2005), J. Personality',
  },

  {
    id: 'gamer_rig',
    label: 'Matériel orienté gaming',
    test: (d) => {
      const hz = d.display?.refreshHz ?? 60;
      const r = (d.gpu?.renderer ?? '').toLowerCase();
      let s = 0;
      if (hz >= 120) s += 0.5;
      else if (hz >= 90) s += 0.2;
      if (/geforce|nvidia|radeon/.test(r)) s += 0.5;
      return Math.min(s, 1);
    },
    effects: { O: +0.2, C: -0.1, E: -0.2, A: -0.1, N:  0.0 },
    source: 'Braun, Stopfer, Müller, Beutel & Egloff (2016), Comp. Human Behavior',
  },

  {
    id: 'office_worker',
    label: 'Horaires bureau, jour ouvré, desktop',
    test: (d) => {
      const h = d.locale?.localHour;
      const day = d.locale?.dayOfWeek;
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      const isMobile = d.browser?.uaData?.mobile === true
        || ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
      if (isMobile || h == null || day == null) return 0;
      if (day >= 1 && day <= 5 && h >= 9 && h < 18) return 1;
      return 0;
    },
    effects: { O: -0.1, C: +0.5, E:  0.0, A: +0.1, N: -0.1 },
    source: 'Barrick & Mount (1991), Personnel Psychology ; Judge, Higgins, Thoresen & Barrick (1999)',
  },

  {
    id: 'high_end_device',
    label: 'Appareil haut de gamme',
    test: (d) => {
      const mem = d.browser?.deviceMemory ?? 0;
      const cores = d.browser?.hardwareConcurrency ?? 0;
      const dpr = d.display?.pixelRatio ?? 1;
      let s = 0;
      if (mem >= 8) s += 0.3;
      if (cores >= 8) s += 0.3;
      if (dpr >= 3) s += 0.3;
      return Math.min(s, 1);
    },
    effects: { O: +0.1, C: +0.2, E: +0.1, A:  0.0, N: -0.1 },
    source: 'van Deursen & van Dijk (2014), New Media & Society ; Hargittai (2010)',
  },

  {
    id: 'aesthetic_dark',
    label: 'Esthétique sombre (dark mode)',
    test: (d) => d.preferences?.darkMode ? 1 : 0,
    effects: { O: +0.2, C:  0.0, E: -0.1, A:  0.0, N: +0.1 },
    source: 'Aditya & Permana (2020) ; Eisfeld & Kristallovich (2020), UX survey',
  },

  {
    id: 'weekend_leisure',
    label: 'Session loisir week-end',
    test: (d) => {
      const h = d.locale?.localHour;
      const day = d.locale?.dayOfWeek;
      if (h == null || day == null) return 0;
      const weekend = (day === 0 || day === 6 || (day === 5 && h >= 19));
      if (weekend && h >= 19 && h < 24) return 1;
      return 0;
    },
    effects: { O:  0.0, C:  0.0, E: +0.2, A:  0.0, N:  0.0 },
    source: 'OFCOM Media Nations Report (2023), descriptive baseline',
  },

  {
    id: 'rural_slow_link',
    label: 'Connexion cellulaire lente',
    test: (d) => {
      const dl = d.connection?.downlink;
      const type = d.connection?.effectiveType;
      if (dl == null || !type) return 0;
      if (type === '4g' && dl < 2) return 1;
      if (type === '4g' && dl < 5) return 0.5;
      if (type === '3g' || type === '2g') return 1;
      return 0;
    },
    effects: { O: -0.1, C:  0.0, E: -0.1, A: +0.1, N:  0.0 },
    source: 'OFCOM Connected Nations (2023) ; Philip et al. (2017), J. Rural Studies',
  },
];

/**
 * Calcule un vecteur Big Five (OCEAN) à partir du rapport, en z-scores relatifs.
 * Retourne aussi la liste des signaux qui ont effectivement contribué.
 */
export function scoreBigFive(report) {
  const acc = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const contributions = [];
  for (const sig of SIGNALS) {
    let strength = 0;
    try { strength = sig.test(report) ?? 0; } catch { strength = 0; }
    if (strength <= 0) continue;
    for (const t of ['O','C','E','A','N']) {
      acc[t] += (sig.effects[t] ?? 0) * strength;
    }
    contributions.push({
      id: sig.id,
      label: sig.label,
      strength,
      effects: sig.effects,
      source: sig.source,
    });
  }
  // Compression douce vers [-1, +1] pour ne pas exploser si plein de signaux
  // s'alignent dans le même sens.
  const traits = {};
  for (const t of ['O','C','E','A','N']) {
    traits[t] = Math.tanh(acc[t]);
  }
  return { traits, raw: acc, contributions };
}

// ---------------------------------------------------------------------------
// 2. WESTIN PRIVACY SEGMENTATION (Harris/Westin, 1991-2003)
// 3 clusters historiques, toujours utilisés par l'IAB et la CNIL.
// ---------------------------------------------------------------------------
export function westinSegment(report) {
  const dnt      = report.browser?.doNotTrack;
  const dntOn    = dnt === '1' || dnt === 1 || dnt === 'yes';
  const cookies  = report.browser?.cookiesEnabled;
  const rd       = report.preferences?.reducedData;
  const dark     = report.preferences?.darkMode;

  let score = 0;
  if (dntOn) score += 2;
  if (cookies === false) score += 2;
  if (rd) score += 1;
  if (dark) score += 0.5;

  if (score >= 3)   return { id: 'fundamentalist', label: 'Fondamentaliste', description: 'Refuse la plupart des formes de collecte. Active DNT, bloque cookies, pèse chaque consentement.' };
  if (score >= 1)   return { id: 'pragmatist',     label: 'Pragmatique',     description: 'Accepte la collecte si le bénéfice est clair, signale toutefois une préférence (DNT ou data-saver).' };
  return            { id: 'unconcerned',           label: 'Indifférent·e',   description: 'Aucun signal de vigilance détecté : la collecte passe sans friction.' };
}

// ---------------------------------------------------------------------------
// 3. CHRONOTYPE (Horne-Östberg simplifié)
// ---------------------------------------------------------------------------
export function chronotype(report) {
  const h = report.locale?.localHour;
  if (h == null) return { id: 'unknown', label: 'Indéterminé' };
  if (h >= 1 && h < 6)   return { id: 'extreme_evening', label: 'Vespéral extrême', note: 'Activité entre 1h et 6h : profil rare (≈5% de la population, Roenneberg 2007).' };
  if (h >= 22 || h < 1)  return { id: 'evening',         label: 'Vespéral',         note: 'Pic d\u2019activité après 22h : chronotype vespéral (Roenneberg 2007).' };
  if (h >= 18 && h < 22) return { id: 'neither',         label: 'Intermédiaire',    note: 'Plage soir sans excès, profil médian.' };
  if (h >= 5 && h < 9)   return { id: 'morning',         label: 'Matinal',          note: 'Activité dans la fenêtre 5h-9h : chronotype matinal.' };
  return                    { id: 'diurnal',               label: 'Diurne',           note: 'Activité en pleine journée.' };
}

// ---------------------------------------------------------------------------
// 4. CONSUMER PROFILE
// Dérive des préférences de consommation du vecteur Big Five (OCEAN)
// selon les corrélations documentées (Matz et al., Gladstone et al.).
// Le seuil 0.2 en valeur absolue correspond à ~0.2σ ; au-delà, l'écart
// à la moyenne est considéré significatif pour la démonstration.
// ---------------------------------------------------------------------------

const TRAIT_CONSUMER = {
  O: {
    high: {
      likes:    ['voyages lointains','podcasts de fond','cafés de spécialité','Netflix/HBO plutôt que TV linéaire','expositions d\u2019art','cuisine du monde','livres plutôt que reality-TV'],
      brands:   ['Brut.','Arte','Blue Bottle','The New York Times','Airbnb'],
      avoids:   ['franchises de fast-food lambda','chaînes TV historiques'],
    },
    low: {
      likes:    ['TV mainstream','marques locales installées','vacances familiales au même endroit','cuisine traditionnelle'],
      brands:   ['TF1','Leclerc','Renault','Netflix (top 10 uniquement)'],
      avoids:   ['newsletters culture','podcasts long format'],
    },
    source: 'Matz, Kosinski, Nave & Stillwell (2017), PNAS ; Gosling (2008)',
  },
  C: {
    high: {
      likes:    ['apps de planification (Notion, Todoist)','assurances et placements','LinkedIn','épicerie anticipée','montre connectée fitness'],
      brands:   ['Revolut','LinkedIn','Decathlon','Monoprix'],
      avoids:   ['achats impulsifs','délai de paiement'],
    },
    low: {
      likes:    ['livraison à domicile','gaming long format','abonnements oubliés','shopping impulsif mobile'],
      brands:   ['Uber Eats','Steam','Shein','SNCF dernière minute'],
      avoids:   ['agenda partagé','budgets familiaux'],
    },
    source: 'Gladstone, Matz & Lemaire (2019), Psychological Science',
  },
  E: {
    high: {
      likes:    ['réseaux sociaux actifs','événements live','mode visible','bars branchés','voyages en groupe'],
      brands:   ['Instagram','Spotify playlists sociales','Nike','Booking city breaks'],
      avoids:   ['soirées solo','applis de méditation'],
    },
    low: {
      likes:    ['livres','podcasts longs','hobbies solitaires','streaming en solo','jeux narratifs'],
      brands:   ['Kindle','Audible','Kobo','HBO'],
      avoids:   ['dîners networking','stories quotidiennes'],
    },
    source: 'Kosinski, Stillwell & Graepel (2013), PNAS',
  },
  A: {
    high: {
      likes:    ['marques éthiques','ONG','produits famille','seconde main','commerce équitable'],
      brands:   ['Back Market','Vinted','Patagonia','Alsa','AMAP'],
      avoids:   ['publicités clivantes'],
    },
    low: {
      likes:    ['marques statut','luxe accessible','tech premium','opinions politiques affirmées'],
      brands:   ['Apple','Tesla','Hermès','X/Twitter'],
      avoids:   ['marques militantes'],
    },
    source: 'Hirsh, Kang & Bodenhausen (2012), Psychological Science',
  },
  N: {
    high: {
      likes:    ['apps méditation (Calm, Headspace)','produits sommeil','news anxiogène compulsif','fintech "coach"','compléments alimentaires'],
      brands:   ['Headspace','Calm','Le Monde alertes','Doctolib'],
      avoids:   ['sports extrêmes'],
    },
    low: {
      likes:    ['sports d\u2019aventure','voyages improvisés','trading/crypto','cuisine épicée'],
      brands:   ['Decathlon Outdoor','Binance','GoPro','Ryanair last-minute'],
      avoids:   ['garanties étendues'],
    },
    source: 'Matz & Netzer (2017), Current Opinion in Behavioral Sciences',
  },
};

/**
 * À partir du vecteur Big Five, renvoie une liste de "sides" (trait × direction)
 * significatifs, avec leurs préférences associées et la source.
 * @param {{O:number,C:number,E:number,A:number,N:number}} traits
 */
export function consumerProfile(traits, threshold = 0.2) {
  const sides = [];
  for (const t of ['O','C','E','A','N']) {
    const v = traits[t] ?? 0;
    if (Math.abs(v) < threshold) continue;
    const direction = v > 0 ? 'high' : 'low';
    const bundle = TRAIT_CONSUMER[t]?.[direction];
    if (!bundle) continue;
    sides.push({
      trait: t,
      traitLabel: TRAIT_LABELS[t],
      direction,
      z: v,
      likes: bundle.likes,
      brands: bundle.brands,
      avoids: bundle.avoids,
      source: TRAIT_CONSUMER[t].source,
    });
  }
  // Trier par écart absolu, le trait le plus saillant d'abord.
  sides.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  return sides;
}

export const TRAIT_LABELS = {
  O: 'Ouverture',
  C: 'Conscienciosité',
  E: 'Extraversion',
  A: 'Agréabilité',
  N: 'Névrosisme',
};

export const TRAIT_DESCRIPTIONS = {
  O: { high: 'curieux·se, porté·e aux nouveautés', low: 'pragmatique, préfère le familier' },
  C: { high: 'organisé·e, planificateur·rice',    low: 'spontané·e, flexible' },
  E: { high: 'sociable, cherche la stimulation',  low: 'réservé·e, préfère le calme' },
  A: { high: 'coopératif·ve, empathique',         low: 'direct·e, compétitif·ve' },
  N: { high: 'sensible au stress, vigilant·e',    low: 'émotionnellement stable' },
};

/**
 * Agrège tout : traits Big Five, segment Westin, chronotype, préférences conso.
 */
export function analyze(report) {
  const bigFive = scoreBigFive(report);
  const westin  = westinSegment(report);
  const chrono  = chronotype(report);
  const consumer = consumerProfile(bigFive.traits);
  return { bigFive, westin, chrono, consumer };
}

export { SIGNALS };
