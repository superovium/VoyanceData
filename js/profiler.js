/**
 * profiler.js
 * Système de scoring des personas.
 *
 * Chaque persona = un ensemble de "règles". Chaque règle inspecte le rapport
 * produit par collector.js et renvoie un delta de points (positif ou négatif).
 * Les règles sont pondérées pour qu'un signal fort (ex: heure 3h du matin)
 * pèse plus qu'un signal faible (ex: dark mode seul).
 *
 * Pour la première itération, seul le persona "OISEAU DE NUIT" est
 * entièrement implémenté à titre d'exemple. Les autres sont stubés.
 */

const rule = (id, weight, test) => ({ id, weight, test });

// Un veto élimine un persona quand les données le contredisent frontalement.
// `test(d)` renvoie `null` si rien à signaler, ou une chaîne expliquant la
// preuve (chiffrée, lisible) qui justifie l'exclusion.
const veto = (id, test) => ({ id, test });

const DAY_NAMES = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

const isMobileDevice = (d) => {
  const ua = (d.browser?.userAgent ?? '').toLowerCase();
  return d.browser?.uaData?.mobile === true
    || ua.includes('mobile') || ua.includes('android')
    || ua.includes('iphone') || ua.includes('ipad');
};

// ---------------------------------------------------------------------------
// Persona : L'OISEAU DE NUIT / TOURMENTÉ
// Signaux attendus : heure locale tardive, dark mode, batterie faible,
// reduced-motion off (la personne scrolle encore à 4h), session un jour de
// semaine (insomnie vs soirée festive).
// ---------------------------------------------------------------------------
const NIGHT_OWL = {
  id: 'night_owl',
  label: 'L\u2019Oiseau de Nuit',
  tagline: 'Celui qui fuit le sommeil',
  rules: [
    rule('late_hour_core', 40, (d) => {
      const h = d.locale?.localHour;
      if (h == null) return 0;
      // Noyau dur 1h-5h → pleine pondération
      if (h >= 1 && h < 5) return 1;
      // Zone grise 23h-1h et 5h-6h → moitié
      if (h === 23 || h === 0 || h === 5) return 0.5;
      return 0;
    }),

    rule('dark_mode', 10, (d) =>
      d.preferences?.darkMode ? 1 : 0
    ),

    rule('low_battery', 20, (d) => {
      const lvl = d.battery?.level;
      if (lvl == null) return 0;
      if (d.battery.charging) return 0;          // en charge → signal neutralisé
      if (lvl < 0.15) return 1;                  // < 15 %
      if (lvl < 0.30) return 0.5;
      return 0;
    }),

    rule('weekday_insomnia', 15, (d) => {
      const h = d.locale?.localHour;
      const day = d.locale?.dayOfWeek;
      if (h == null || day == null) return 0;
      // Nuit de dimanche→lundi à jeudi→vendredi = insomnie probable
      const isWeekNight = day >= 1 && day <= 4;
      return (isWeekNight && h >= 1 && h < 5) ? 1 : 0;
    }),

    rule('save_data_off', 5, (d) =>
      // Celui qui surfe sans économiser la data à 3h = rituel de procrastination
      d.connection?.saveData === false ? 1 : 0
    ),
  ],

  vetoes: [
    veto('plein_jour', (d) => {
      const h = d.locale?.localHour;
      if (h == null) return null;
      return (h >= 8 && h < 19)
        ? `il est ${h}h chez toi — personne ne fuit le sommeil en plein jour`
        : null;
    }),
  ],
};

// ---------------------------------------------------------------------------
// Persona : LE VOYAGEUR / L'EXILÉ
// Signaux : langue du navigateur <> pays IP, fuseau <> fuseau IP,
// multi-langues dans navigator.languages.
// ---------------------------------------------------------------------------
const LANG_TO_COUNTRIES = {
  fr: ['FR', 'BE', 'CH', 'LU', 'MC', 'CA'],
  en: ['US', 'GB', 'IE', 'AU', 'NZ', 'CA', 'ZA'],
  de: ['DE', 'AT', 'CH', 'LI'],
  es: ['ES', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE', 'UY'],
  pt: ['PT', 'BR', 'AO', 'MZ'],
  it: ['IT', 'CH', 'SM'],
  nl: ['NL', 'BE'],
  ja: ['JP'],
  ko: ['KR'],
  zh: ['CN', 'TW', 'HK', 'SG'],
  ar: ['SA', 'AE', 'EG', 'MA', 'DZ', 'TN', 'JO', 'LB'],
  ru: ['RU', 'BY', 'KZ'],
  pl: ['PL'],
  tr: ['TR'],
};

// Cohérence fuseau horaire ↔ pays IP : true / false / null (indéterminé).
const EU_COUNTRIES   = ['FR','DE','ES','IT','GB','BE','NL','PT','CH','AT','SE','NO','FI','DK','PL','CZ'];
const AM_COUNTRIES   = ['US','CA','MX'];
const ASIA_COUNTRIES = ['JP','CN','KR','TW','HK','SG','IN','TH','VN'];

const tzMatchesCountry = (tz, country) => {
  if (!tz || !country) return null;
  const continent = tz.split('/')[0];
  if (EU_COUNTRIES.includes(country))   return continent === 'Europe';
  if (AM_COUNTRIES.includes(country))   return continent === 'America';
  if (ASIA_COUNTRIES.includes(country)) return continent === 'Asia';
  return null;
};

const TRAVELER = {
  id: 'traveler',
  label: 'L\u2019Exil\u00e9',
  tagline: 'Celui dont la langue trahit le lieu',
  rules: [
    rule('lang_country_mismatch', 40, (d) => {
      const lang = d.browser?.language?.slice(0, 2).toLowerCase();
      const country = d.network?.countryCode;
      if (!lang || !country) return 0;
      const expected = LANG_TO_COUNTRIES[lang];
      if (!expected) return 0;
      return expected.includes(country) ? 0 : 1;
    }),

    rule('timezone_country_mismatch', 30, (d) => {
      const tz = d.locale?.timezone;
      const country = d.network?.countryCode;
      if (!tz || !country) return 0;
      // Heuristique simple : le préfixe continent du fuseau doit matcher
      // grossièrement la région du pays IP. Approximation volontaire.
      const continent = tz.split('/')[0];
      const euCountries = ['FR','DE','ES','IT','GB','BE','NL','PT','CH','AT','SE','NO','FI','DK','PL','CZ'];
      const usCountries = ['US','CA','MX'];
      const asiaCountries = ['JP','CN','KR','TW','HK','SG','IN','TH','VN'];
      if (euCountries.includes(country) && continent !== 'Europe') return 1;
      if (usCountries.includes(country) && continent !== 'America') return 1;
      if (asiaCountries.includes(country) && continent !== 'Asia') return 1;
      return 0;
    }),

    rule('polyglot', 15, (d) => {
      const langs = d.browser?.languages ?? [];
      // 3+ langues déclarées = profil migrant / multilingue de naissance
      if (langs.length >= 3) return 1;
      if (langs.length === 2) return 0.5;
      return 0;
    }),
  ],

  vetoes: [
    veto('enracine', (d) => {
      const lang = d.browser?.language?.slice(0, 2).toLowerCase();
      const country = d.network?.countryCode;
      if (!lang || !country) return null;
      const expected = LANG_TO_COUNTRIES[lang];
      if (!expected || !expected.includes(country)) return null;
      // Langue cohérente avec le pays. Si le fuseau l'est aussi (ou est
      // indéterminé), tous les signaux racontent le même endroit.
      if (tzMatchesCountry(d.locale?.timezone, country) === false) return null;
      const monolingual = (d.browser?.languages?.length ?? 0) <= 2;
      return monolingual
        ? `langue « ${lang} », pays ${country} et fuseau ${d.locale?.timezone ?? '?'} racontent le même endroit`
        : null;
    }),
  ],
};

// ---------------------------------------------------------------------------
// Persona : LE PRIVILÉGIÉ
// Signaux : appareil Apple / haut de gamme, écran haute densité, beaucoup de
// RAM et de cœurs CPU.
// ---------------------------------------------------------------------------
const PRIVILEGED = {
  id: 'privileged',
  label: 'Le Privil\u00e9gi\u00e9',
  tagline: 'Celui dont les pixels valent de l\u2019or',
  rules: [
    rule('apple_device', 30, (d) => {
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      if (ua.includes('iphone') || ua.includes('ipad')) return 1;
      if (ua.includes('macintosh') || ua.includes('mac os')) return 1;
      return 0;
    }),

    rule('high_dpi', 20, (d) => {
      const dpr = d.display?.pixelRatio ?? 1;
      if (dpr >= 3) return 1;
      if (dpr >= 2) return 0.6;
      return 0;
    }),

    rule('big_screen', 15, (d) => {
      const w = d.display?.screenW ?? 0;
      if (w >= 2560) return 1;             // 4K / ultrawide / Studio Display
      if (w >= 1920) return 0.5;
      return 0;
    }),

    rule('rich_hardware', 20, (d) => {
      const cores = d.browser?.hardwareConcurrency ?? 0;
      const mem = d.browser?.deviceMemory ?? 0;
      let s = 0;
      if (cores >= 10) s += 0.5;
      else if (cores >= 8) s += 0.3;
      if (mem >= 8) s += 0.5;
      else if (mem >= 4) s += 0.2;
      return Math.min(s, 1);
    }),

    rule('fast_connection', 10, (d) => {
      if (d.connection?.effectiveType === '4g' && d.connection?.downlink >= 10) return 1;
      return 0;
    }),
  ],

  vetoes: [
    veto('machine_modeste', (d) => {
      const mem = d.browser?.deviceMemory;
      const cores = d.browser?.hardwareConcurrency;
      if (mem == null || cores == null) return null;
      return (mem <= 4 && cores <= 4)
        ? `${mem} Go de mémoire et ${cores} cœurs — un matériel qui compte ses pièces`
        : null;
    }),
    veto('android_budget', (d) => {
      const model = (d.browser?.uaData?.model ?? '');
      const ua = (d.browser?.userAgent ?? '');
      const budget = /(^|\s|\()(mi |redmi|realme|oppo|vivo|poco|honor|infinix|tecno)/i;
      const hit = budget.test(model) ? model : (budget.test(ua) ? 'gamme budget (user-agent)' : null);
      return hit ? `appareil détecté : ${hit} — milieu de gamme assumé` : null;
    }),
  ],
};

// ---------------------------------------------------------------------------
// Persona : LE GAMER / CHASSEUR
// Signaux : écran haute fréquence, GPU dédié, CPU musclé.
// ---------------------------------------------------------------------------
const GAMER = {
  id: 'gamer',
  label: 'Le Chasseur',
  tagline: 'Celui qui vit \u00e0 144 images par seconde',
  rules: [
    rule('high_refresh', 40, (d) => {
      const hz = d.display?.refreshHz ?? 60;
      if (hz >= 140) return 1;
      if (hz >= 110) return 0.8;
      if (hz >= 85)  return 0.3;
      return 0;
    }),

    rule('dedicated_gpu', 35, (d) => {
      const r = (d.gpu?.renderer ?? '').toLowerCase();
      if (!r) return 0;
      if (r.includes('geforce') || r.includes('nvidia')) return 1;
      if (r.includes('radeon')  || r.includes('amd'))    return 1;
      if (r.includes('intel'))   return 0;                // iGPU
      return 0;
    }),

    rule('many_cores', 15, (d) => {
      const cores = d.browser?.hardwareConcurrency ?? 0;
      if (cores >= 12) return 1;
      if (cores >= 8)  return 0.5;
      return 0;
    }),

    rule('desktop_os', 10, (d) => {
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      if (ua.includes('windows nt')) return 1;             // la plateforme gaming PC par excellence
      if (ua.includes('linux') && !ua.includes('android')) return 0.7;
      return 0;
    }),
  ],

  vetoes: [
    veto('ecran_de_poche', (d) =>
      isMobileDevice(d)
        ? 'appareil mobile — on ne chasse pas sur un écran de poche'
        : null
    ),
    veto('soixante_hertz', (d) => {
      const hz = d.display?.refreshHz;
      const r = (d.gpu?.renderer ?? '').toLowerCase();
      if (hz == null || !r) return null;
      const integrated = r.includes('intel') && !/arc/.test(r);
      return (hz <= 65 && integrated)
        ? `écran ${hz} Hz et GPU intégré (${d.gpu.renderer}) — aucune arène en vue`
        : null;
    }),
  ],
};

// ---------------------------------------------------------------------------
// Persona : LE TRAVAILLEUR / FORÇAT
// Signaux : jour ouvré + horaire bureau, desktop, fenêtre en multitâche.
// ---------------------------------------------------------------------------
const WORKER = {
  id: 'worker',
  label: 'Le For\u00e7at',
  tagline: 'Celui dont les fen\u00eatres sont trop petites',
  rules: [
    rule('office_hours', 35, (d) => {
      const h = d.locale?.localHour;
      const day = d.locale?.dayOfWeek;
      if (h == null || day == null) return 0;
      const isWeekday = day >= 1 && day <= 5;
      if (!isWeekday) return 0;
      if (h >= 9 && h < 12) return 1;
      if (h >= 14 && h < 18) return 1;
      if (h === 12 || h === 13) return 0.4;    // pause déj
      if (h === 8 || h === 18) return 0.5;
      return 0;
    }),

    rule('desktop_device', 20, (d) => {
      const ua = (d.browser?.userAgent ?? '').toLowerCase();
      if (ua.includes('mobile') || ua.includes('android')) return 0;
      if (ua.includes('iphone') || ua.includes('ipad'))    return 0;
      return 1;
    }),

    rule('multitasking_window', 25, (d) => {
      const sw = d.display?.screenW ?? 0;
      const ww = d.display?.windowW ?? 0;
      if (!sw || !ww) return 0;
      const ratio = ww / sw;
      // Fenêtre qui n'occupe pas tout l'écran = split-screen / multitâche
      if (ratio < 0.55) return 1;
      if (ratio < 0.75) return 0.6;
      if (ratio < 0.95) return 0.2;
      return 0;
    }),

    rule('plugged_in', 10, (d) => {
      // Au bureau, branché au secteur
      if (d.battery?.charging === true) return 1;
      return 0;
    }),

    rule('not_dark_mode', 10, (d) =>
      d.preferences?.darkMode === false ? 1 : 0
    ),
  ],

  vetoes: [
    veto('jour_de_repos', (d) => {
      const day = d.locale?.dayOfWeek;
      if (day == null) return null;
      return (day === 0 || day === 6)
        ? `nous sommes ${DAY_NAMES[day]} — les open spaces dorment`
        : null;
    }),
    veto('hors_horaires', (d) => {
      const h = d.locale?.localHour;
      if (h == null) return null;
      return (h < 7 || h >= 21)
        ? `${h}h — aucun bureau n'est éclairé à cette heure`
        : null;
    }),
    veto('nomade', (d) =>
      isMobileDevice(d)
        ? 'appareil mobile — pas un poste de travail fixe'
        : null
    ),
  ],
};

const PERSONAS = [NIGHT_OWL, TRAVELER, PRIVILEGED, GAMER, WORKER];

/**
 * Calcule les scores pour tous les personas à partir d'un rapport Collector.
 * Les vetos sont évalués d'abord : un persona contredit par les données est
 * exclu de la course, quelle que soit la force de ses règles positives.
 * Retourne :
 *   {
 *     scores:   [{ id, label, score, max, ratio, triggered, vetoes, excluded }],
 *     winner:   <persona le mieux classé parmi les non-exclus>,
 *     excluded: [<personas écartés, avec leurs raisons>]
 *   }
 */
export function profile(report) {
  const scores = PERSONAS.map((p) => {
    let score = 0;
    let max = 0;
    const triggered = [];
    for (const r of p.rules) {
      max += r.weight;
      let strength = 0;
      try { strength = r.test(report) ?? 0; } catch { strength = 0; }
      if (strength > 0) {
        score += r.weight * strength;
        triggered.push({ id: r.id, weight: r.weight, strength });
      }
    }

    const vetoes = [];
    for (const v of (p.vetoes ?? [])) {
      let reason = null;
      try { reason = v.test(report); } catch { reason = null; }
      if (reason) vetoes.push({ id: v.id, reason });
    }

    return {
      id: p.id,
      label: p.label,
      tagline: p.tagline,
      score: Math.round(score),
      max,
      ratio: max > 0 ? score / max : 0,
      triggered,
      vetoes,
      excluded: vetoes.length > 0,
    };
  });

  // Le gagnant = meilleur ratio (et non score brut) parmi les personas
  // non contredits. Si les données contredisent tout le monde (rapport
  // très pauvre), on retombe sur l'ensemble complet pour ne jamais
  // laisser l'Oracle muet.
  const pool = scores.some((s) => !s.excluded)
    ? scores.filter((s) => !s.excluded)
    : scores;
  const winner = pool.reduce(
    (best, s) => (s.ratio > best.ratio ? s : best),
    pool[0],
  );

  return { scores, winner, excluded: scores.filter((s) => s.excluded) };
}

export { PERSONAS };
