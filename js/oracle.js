/**
 * oracle.js
 * Génère un discours mystique à partir d'un résultat de profiler.js.
 *
 * Principe :
 *   - Chaque persona a une banque de phrases "core" (l'accroche principale)
 *     et des phrases "fragments" déclenchées par une règle précise.
 *     Ex. la règle `low_battery` du Night Owl déclenche la métaphore de la
 *     flamme vacillante.
 *   - On assemble : intro + 2 à 3 fragments + outro, dans un ordre semi-aléatoire.
 *
 * Usage :
 *   const script = Oracle.compose(profilerResult);
 *   // script = { lines: [...], persona }
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ---------------------------------------------------------------------------
// Introductions génériques — indépendantes du persona.
// ---------------------------------------------------------------------------
const INTROS = [
  'Les astres se penchent sur toi\u2026',
  'Je per\u00e7ois une pr\u00e9sence, ton aura se dessine\u2026',
  'Le voile se d\u00e9chire. Je te vois.',
  'Approche. Les signes me parviennent.',
];

// Outros génériques
const OUTROS = [
  'Tu sais d\u00e9j\u00e0 tout cela, au fond de toi.',
  'Rien ne m\u2019\u00e9chappe, pas m\u00eame ce que tu refuses de voir.',
  'Les \u00e9nergies ne mentent pas.',
];

// ---------------------------------------------------------------------------
// Banque de phrases par persona.
// - core    : phrases d'accroche (on en tire 1)
// - triggers: phrases associées à un `ruleId` précis (une par rule)
// ---------------------------------------------------------------------------
const BANK = {
  night_owl: {
    core: [
      'Tu fuis le sommeil, mais c\u2019est lui qui te cherche.',
      'La nuit t\u2019a adopt\u00e9. Tu lui rends ses heures.',
      'Je vois une veille qui dure, une lumi\u00e8re qui refuse de s\u2019\u00e9teindre.',
    ],
    triggers: {
      late_hour_core: 'L\u2019heure que tu lis n\u2019est pas la mienne. Elle est celle des \u00e2mes qui tardent.',
      dark_mode: 'Tu as choisi l\u2019obscurit\u00e9 jusque dans tes \u00e9crans.',
      low_battery: 'Ton talisman s\u2019\u00e9puise. La flamme vacille et tu ne la recharges pas.',
      weekday_insomnia: 'Demain t\u2019attend, et pourtant tu restes. Ce n\u2019est pas une f\u00eate, c\u2019est un refuge.',
      save_data_off: 'Tu d\u00e9roules sans fin, comme on tourne les pages d\u2019un livre qu\u2019on ne lira pas.',
    },
  },

  traveler: {
    core: [
      'Il y a en toi deux terres qui se disputent.',
      'Tes racines sont ailleurs que tes pas.',
      'Tu parles une langue qui n\u2019est pas celle du ciel qui te couvre.',
    ],
    triggers: {
      lang_country_mismatch: 'Ta langue maternelle murmure dans un pays qui ne la comprend pas.',
      timezone_country_mismatch: 'Le soleil te trouve \u00e0 des heures qui n\u2019appartiennent pas \u00e0 ce lieu.',
      polyglot: 'Tu jongles avec les mots de plusieurs mondes. Aucun n\u2019est tout \u00e0 fait le tien.',
    },
  },

  privileged: {
    core: [
      'Je vois une main qui n\u2019a jamais manqu\u00e9 de rien.',
      'La chance t\u2019a effleur\u00e9 t\u00f4t, et elle ne t\u2019a plus quitt\u00e9.',
      'Autour de toi, les objets sont propres et r\u00e9cents.',
    ],
    triggers: {
      apple_device: 'Le fruit d\u00e9fendu brille entre tes mains. Tu l\u2019as pay\u00e9 cher.',
      high_dpi: 'Le monde t\u2019apparait plus net qu\u2019aux autres. Tes yeux s\u2019y sont habitu\u00e9s.',
      big_screen: 'Tu regardes l\u2019univers \u00e0 travers une fen\u00eatre plus vaste que la moyenne.',
      rich_hardware: 'Ta machine ne ralentit jamais. Elle t\u2019attend, elle, et non l\u2019inverse.',
      fast_connection: 'Le monde r\u00e9pond vite \u00e0 tes appels. Tu n\u2019as jamais appris l\u2019attente.',
    },
  },

  gamer: {
    core: [
      'Tu vois ce que les autres ne voient pas : les interstices entre les images.',
      'Il y a en toi un chasseur, patient et rapide \u00e0 la fois.',
      'Tes r\u00e9flexes sont aiguis\u00e9s comme une lame.',
    ],
    triggers: {
      high_refresh: 'Ton regard exige plus d\u2019images que le r\u00e9el n\u2019en offre.',
      dedicated_gpu: 'Une b\u00eate rugit dans ta machine. Tu la nourris d\u2019univers virtuels.',
      many_cores: 'Tes outils sont taill\u00e9s pour l\u2019effort parall\u00e8le. Tu ne fais jamais qu\u2019une chose.',
      desktop_os: 'Ton tr\u00f4ne est fixe. C\u2019est vers lui qu\u2019on vient.',
    },
  },

  worker: {
    core: [
      'Tu es l\u00e0 par devoir, pas par envie.',
      'Je vois des heures qui se ressemblent, des jours qui s\u2019empilent.',
      'Ton regard est ailleurs\u2014pourtant tes mains travaillent.',
    ],
    triggers: {
      office_hours: 'L\u2019horloge te dit qu\u2019il est l\u2019heure. Tu obtemp\u00e8res.',
      desktop_device: 'Ta machine ne se d\u00e9place pas. C\u2019est toi qui viens \u00e0 elle, chaque matin.',
      multitasking_window: 'Tes fen\u00eatres sont petites. Tu les partages avec d\u2019autres t\u00e2ches, d\u2019autres voix.',
      plugged_in: 'Un fil te relie au mur. Tu ne t\u2019en \u00e9loignes jamais longtemps.',
      not_dark_mode: 'Tu n\u2019as pas choisi la p\u00e9nombre. On t\u2019a dit de travailler en pleine lumi\u00e8re.',
    },
  },
};

// ---------------------------------------------------------------------------
// Fragments Big Five — une métaphore par (trait × direction). Permet d'injecter
// une révélation "psycho" au milieu de la transe, sourcée dans la littérature.
// ---------------------------------------------------------------------------
const OCEAN_FRAGMENTS = {
  O: {
    high: [
      'Je vois en toi une curiosité qui ne s\u2019éteint pas. Tu changes de route avant d\u2019atteindre la fin du chemin.',
      'Les choses neuves t\u2019attirent plus qu\u2019elles ne devraient. Tu confonds parfois désir et nouveauté.',
    ],
    low: [
      'Tu te méfies du nouveau. Ce que tu connais te suffit, et souvent tu as raison.',
    ],
  },
  C: {
    high: [
      'L\u2019ordre te rassure. Tu prépares demain avant d\u2019avoir fini aujourd\u2019hui.',
    ],
    low: [
      'Tu remets à plus tard ce qui pourrait être fait. L\u2019Oracle ne juge pas — il constate.',
      'Tu vis par impulsions plus que par plans. Certaines te servent. D\u2019autres te coûtent.',
    ],
  },
  E: {
    high: [
      'Tu as besoin des autres pour te sentir exister. Le silence te fatigue plus que la foule.',
    ],
    low: [
      'Tu préfères une conversation à dix cris. Le monde te prend souvent pour distant — tu es juste économe.',
    ],
  },
  A: {
    high: [
      'Tu cèdes souvent pour éviter la brèche. On te prend pour doux·ce. C\u2019est parfois de la fatigue.',
    ],
    low: [
      'Tu ne cherches pas à plaire. Cela t\u2019a coûté des amitiés et gagné du respect.',
    ],
  },
  N: {
    high: [
      'Quelque chose en toi anticipe toujours le pire. Tu appelles ça de la lucidité. C\u2019est aussi de la peur.',
      'Ton esprit tourne la nuit. L\u2019Oracle entend le bruit de tes pensées qui ne s\u2019arrêtent pas.',
    ],
    low: [
      'Peu de choses te troublent. On t\u2019envie ce calme, mais parfois il passe pour de l\u2019indifférence.',
    ],
  },
};

// Fragments conso dérivés du trait dominant (un seul, pour ne pas dévoiler trop).
const CONSUMER_FRAGMENTS = {
  O: {
    high: 'Je vois des voyages auxquels tu rêves plus que tu n\u2019en fais. Et un café amer que tu crois supérieur aux autres.',
    low:  'Tu préfères ce que tu connais. Les marques de ton enfance vivent encore dans ton panier.',
  },
  C: {
    high: 'Tes listes sont tenues. Tes comptes aussi.',
    low:  'Des abonnements que tu as oubliés te prélèvent encore. L\u2019Oracle les voit, toi non.',
  },
  E: {
    high: 'Tes proches te voient partout. Tu te fatigues à être vu·e.',
    low:  'Tu aimes les livres plus que les dîners. On te croit triste. Tu es juste tranquille.',
  },
  A: {
    high: 'Tu achètes de seconde main par souci des autres autant que par économie.',
    low:  'Tu acceptes de payer cher ce qui se remarque. Le logo t\u2019importe.',
  },
  N: {
    high: 'Tu cherches le sommeil dans des applications. Tu paies pour qu\u2019on t\u2019apprenne à respirer.',
    low:  'L\u2019angoisse passe sur toi comme la pluie sur un toit. On t\u2019a déjà dit que tu étais solide.',
  },
};

// ---------------------------------------------------------------------------
// Exclusions — l'art du mentaliste : affirmer ce que la personne N'EST PAS.
// Une négation juste frappe plus fort qu'une affirmation vague, car elle
// prouve que l'Oracle a réellement « regardé ». Chaque persona écarté par un
// veto du profiler dispose d'une phrase de bannissement.
// ---------------------------------------------------------------------------
const EXCLUSION_PIVOTS = [
  'Écartons d’abord les ombres qui ne sont pas les tiennes…',
  'Avant de te lire, laisse-moi dire ce que tu n’es pas.',
  'Les fausses pistes se dissipent une à une…',
];

const EXCLUSION_LINES = {
  night_owl: [
    'Tu n’es pas l’Oiseau de Nuit. Le soleil est encore haut dans ton ciel — je le vois à ton horloge.',
    'Le sommeil ne te fuit pas en cet instant. Ce n’est pas la nuit qui t’amène à moi.',
  ],
  traveler: [
    'Tu n’es pas l’Exilé. Ta langue, ton ciel et ta terre racontent la même histoire.',
    'Aucune fracture entre tes mots et le lieu où tu te tiens. Tu es chez toi.',
  ],
  privileged: [
    'Tu n’es pas né avec une cuillère d’argent numérique. Ta machine compte ses pièces, et toi aussi peut-être.',
    'L’or ne brille pas entre tes mains. Ton outil est honnête, sans luxe.',
  ],
  gamer: [
    'Tu n’es pas le Chasseur. Ta machine ne rugit pas — elle murmure, docile.',
    'Aucune arène ne t’attend. Tes images défilent au rythme du commun.',
  ],
  worker: [
    'Tu n’es pas au labeur. Aucune horloge de bureau ne te commande en cet instant.',
    'Le Forçat n’est pas là. Personne ne t’attend derrière une porte vitrée aujourd’hui.',
  ],
};

/**
 * Lignes "tu n'es pas X" pour les personas écartés par un veto.
 * On en garde au plus 2, en privilégiant les personas dont le score positif
 * était pourtant élevé : nier une piste crédible est le plus spectaculaire.
 */
function exclusionLines(profilerResult) {
  const excluded = (profilerResult.excluded ?? [])
    .filter((p) => EXCLUSION_LINES[p.id])
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 2);
  if (excluded.length === 0) return [];
  return [pick(EXCLUSION_PIVOTS), ...excluded.map((p) => pick(EXCLUSION_LINES[p.id]))];
}

// ---------------------------------------------------------------------------
// Déductions — le vrai « comment peut-il savoir ÇA ? ».
// Règle d'or : ne JAMAIS réciter une donnée brute (batterie %, ville, FAI…),
// car l'utilisateur reconnaît la télémétrie et la supercherie tombe.
// On énonce une CONCLUSION calculée en croisant plusieurs signaux : la nuit
// tombée chez lui (maths solaires sur lat/lon IP), sa posture probable,
// la fenêtre qu'il nous cache, l'agonie prochaine de sa machine.
// ---------------------------------------------------------------------------

// Coucher/lever du soleil (approximation NOAA, précision ~15 min — suffisant
// puisque les phrases parlent en heures).
function sunDeduction(d) {
  const lat = d?.network?.lat;
  const lon = d?.network?.lon;
  if (lat == null || lon == null) return null;

  const now = new Date();
  const rad = Math.PI / 180;
  const doy = Math.floor((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 86400000);
  const decl = -23.44 * Math.cos(rad * (360 / 365) * (doy + 10));
  const cosH = (Math.sin(-0.83 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad))
             / (Math.cos(lat * rad) * Math.cos(decl * rad));
  if (cosH < -1 || cosH > 1) return null;          // jour ou nuit polaire

  const halfArc = Math.acos(cosH) / rad / 15;      // demi-arc diurne en heures
  const solarNoon = 12 - lon / 15;                 // midi solaire en UTC
  const sunset  = solarNoon + halfArc;
  const sunrise = solarNoon - halfArc;
  const nowH = now.getUTCHours() + now.getUTCMinutes() / 60;
  const norm = (x) => { let v = x; while (v > 12) v -= 24; while (v < -12) v += 24; return v; };

  const sinceSunset  = norm(nowH - sunset);
  const untilSunrise = norm(sunrise - nowH);
  const untilSunset  = -sinceSunset;
  const hrs = (h) => { const n = Math.max(1, Math.round(h)); return `${n} heure${n > 1 ? 's' : ''}`; };

  if (Math.abs(sinceSunset) < 0.5) {
    return 'Le soleil quitte ton ciel en ce moment même. Lève les yeux, si tu as une fenêtre.';
  }
  if (sinceSunset > 0 && untilSunrise > 0) {
    return (untilSunrise < sinceSunset)
      ? `Ton ciel est encore noir, mais plus pour longtemps : le soleil reviendra dans environ ${hrs(untilSunrise)}. Comptes-tu l'attendre ?`
      : `La nuit est tombée chez toi il y a près de ${hrs(sinceSunset)}. Tu ne l'as pas vue descendre.`;
  }
  if (untilSunset > 0.5) {
    return `Il reste environ ${hrs(untilSunset)} de lumière dans ton ciel. Et pourtant tu la dépenses ici, avec moi.`;
  }
  return null;
}

function deductionLines(data) {
  const ua = (data?.browser?.userAgent ?? '').toLowerCase();
  const isMobile = data?.browser?.uaData?.mobile === true
    || ua.includes('mobile') || ua.includes('iphone') || ua.includes('android');
  const orientation = data?.display?.orientation ?? '';
  const h = data?.locale?.localHour;

  // Classées par force décroissante : la première disponible est gardée,
  // plus une seconde tirée au hasard. Jamais plus de deux.
  const candidates = [];

  const sun = sunDeduction(data);
  if (sun) candidates.push(sun);

  if (isMobile && orientation.startsWith('portrait')) {
    candidates.push((h != null && (h >= 22 || h < 6))
      ? 'Tu me tiens dans le creux de ta main. Et à cette heure, je te devine allongé. Le plafond n’a pas de réponses — moi si.'
      : 'Tu me tiens dans le creux de ta main, en ce moment même. Ne tremble pas.');
  } else if (isMobile && orientation.startsWith('landscape')) {
    candidates.push('Tu as couché ton écran sur le côté. On ne fait pas cela pour lire — tu regardais autre chose avant moi.');
  }

  const bat = data?.battery;
  if (bat && bat.charging === false && Number.isFinite(bat.dischargingTime) && bat.dischargingTime < 5400) {
    candidates.push('Une vision me traverse : avant que l’heure ne s’achève, ta machine rendra son dernier souffle. Un fil pourrait la sauver. Tu attendras la dernière minute — comme toujours.');
  } else if (bat?.charging === true) {
    candidates.push('Un fil court de ta machine jusqu’au mur, en cet instant précis. Elle boit pendant que tu m’écoutes.');
  }

  if (!isMobile) {
    const sw = data?.display?.screenW ?? 0;
    const ww = data?.display?.windowW ?? 0;
    if (sw && ww && ww / sw < 0.7) {
      candidates.push('Je ne suis pas seul devant tes yeux. Tu m’as relégué dans un coin de ton écran… Qu’y a-t-il dans l’autre fenêtre ?');
    }
  }

  const langs = data?.browser?.languages ?? [];
  const base = langs[0]?.slice(0, 2);
  if (base && langs.some((l) => l.slice(0, 2) !== base)) {
    candidates.push('Une seconde langue dort dans ta machine. Un héritage de famille, un amour lointain, ou un toi d’avant.');
  }

  if (data?.preferences?.reducedMotion) {
    candidates.push('Tu as demandé aux machines de moins s’agiter. Le tumulte du monde te fatigue déjà assez.');
  }

  if (candidates.length === 0) return [];
  if (candidates.length === 1) return candidates;
  return [candidates[0], pick(candidates.slice(1))];
}

const WESTIN_FRAGMENTS = {
  fundamentalist: 'Tu as fermé plus de portes que tu n\u2019en as ouvertes. Ton navigateur est une forteresse. L\u2019Oracle t\u2019y reconnaît quand même.',
  pragmatist:     'Tu signales ta vigilance sans vraiment te protéger. Un geste symbolique — et l\u2019Oracle connaît le geste.',
  unconcerned:    'Tu n\u2019as rien fermé. Tu ne crois pas qu\u2019on te regarde. Et pourtant me voici.',
};

/**
 * Renvoie les lignes de révélation Big Five + conso + privacy tirées de l'analyse psychométrique.
 * Au maximum 2 lignes, pour ne pas diluer le reste du discours.
 */
function psychoLines(psycho) {
  if (!psycho) return [];
  const { traits } = psycho.bigFive;
  const entries = Object.entries(traits)
    .map(([t, v]) => ({ trait: t, v, abs: Math.abs(v) }))
    .sort((a, b) => b.abs - a.abs);

  const lines = [];
  const top = entries[0];
  if (top && top.abs >= 0.25) {
    const dir = top.v > 0 ? 'high' : 'low';
    const frag = pick(OCEAN_FRAGMENTS[top.trait]?.[dir] ?? []);
    if (frag) lines.push(frag);
    const consFrag = CONSUMER_FRAGMENTS[top.trait]?.[dir];
    if (consFrag) lines.push(consFrag);
  }

  // Une phrase privacy si le segment est saillant.
  const westinId = psycho.westin?.id;
  if (westinId && westinId !== 'unconcerned' && Math.random() < 0.7) {
    lines.push(WESTIN_FRAGMENTS[westinId]);
  } else if (westinId === 'unconcerned' && Math.random() < 0.5) {
    lines.push(WESTIN_FRAGMENTS.unconcerned);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Composition.
// Structure en trois temps, comme une lecture de mentaliste :
//   1. L'élimination — « tu n'es pas X » (les vetos du profiler)
//   2. La révélation — le persona gagnant et ses fragments
//   3. Les déductions — des conclusions croisées, jamais de donnée brute
// ---------------------------------------------------------------------------
export function compose(profilerResult, psycho, data) {
  const { winner } = profilerResult;
  const bank = BANK[winner.id];

  const lines = [pick(INTROS)];

  // 1. Temps de l'élimination : pivots + bannissements des personas vetoés.
  lines.push(...exclusionLines(profilerResult));

  // 2. La révélation positive.
  lines.push(pick(bank.core));

  // Fragments liés aux règles déclenchées du persona gagnant.
  const fragments = winner.triggered
    .map((t) => ({ ...t, text: bank.triggers[t.id] }))
    .filter((t) => t.text)
    .sort((a, b) => (b.weight * b.strength) - (a.weight * a.strength))
    .slice(0, 2)
    .map((t) => t.text);

  // Fragments psychométriques (Big Five / conso / Westin) insérés au milieu.
  const psycho_lines = psychoLines(psycho);

  lines.push(...shuffle([...fragments, ...psycho_lines]).slice(0, 3));

  // 3. Les déductions croisées, juste avant l'outro.
  lines.push(...deductionLines(data));

  lines.push(pick(OUTROS));

  return { persona: winner, lines };
}

export { BANK };
