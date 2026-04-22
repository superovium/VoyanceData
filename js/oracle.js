/**
 * oracle.js
 * Génère un discours mystique à partir d'un résultat de profiler.js et d'une
 * analyse psychométrique (psychometrics.js).
 *
 * Règles de design :
 *   - Aucune phrase ne nomme le signal technique qui l'a déclenchée
 *     (pas de "cookies", "batterie", "navigateur", "débit", "carte graphique",
 *     "scroll"). L'Oracle décrit des habitudes et conséquences, pas des API.
 *   - Chaque fragment est tagué avec un `theme`. En composition, on garde AU
 *     PLUS UNE phrase par thème : plus de redondance sur un chemin donné.
 *   - L'assemblage final : intro + persona core + 4 fragments dédoublonnés
 *     par thème + outro.
 */

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ---------------------------------------------------------------------------
// Introductions & outros génériques
// ---------------------------------------------------------------------------
const INTROS = [
  'Les astres se penchent sur toi…',
  'Je perçois une présence, ton aura se dessine…',
  'Le voile se déchire. Je te vois.',
  'Approche. Les signes me parviennent.',
];

const OUTROS = [
  'Tu sais déjà tout cela, au fond de toi.',
  'Rien ne m’échappe, pas même ce que tu refuses de voir.',
  'Les énergies ne mentent pas.',
];

// ---------------------------------------------------------------------------
// Banque de phrases par persona.
// - core    : accroche narrative (toujours retenue, pas de dédup)
// - triggers: phrases liées à un ruleId, taguées via BANK_THEMES plus bas
// ---------------------------------------------------------------------------
const BANK = {
  night_owl: {
    core: [
      'Tu fuis le sommeil, mais c’est lui qui te cherche.',
      'La nuit t’a adopté. Tu lui rends ses heures.',
      'Je vois une veille qui dure, une lumière qui refuse de s’éteindre.',
    ],
    triggers: {
      late_hour_core: 'L’heure que tu lis n’est pas la mienne. Elle est celle des âmes qui tardent.',
      dark_mode: 'Tu as choisi l’obscurité jusque dans tes écrans.',
      low_battery: 'Ton talisman s’épuise. La flamme vacille et tu ne la recharges pas.',
      weekday_insomnia: 'Demain t’attend, et pourtant tu restes. Ce n’est pas une fête, c’est un refuge.',
      save_data_off: 'Tu déroules sans fin, comme on tourne les pages d’un livre qu’on ne lira pas.',
    },
  },

  traveler: {
    core: [
      'Il y a en toi deux terres qui se disputent.',
      'Tes racines sont ailleurs que tes pas.',
      'Tu parles une langue qui n’est pas celle du ciel qui te couvre.',
    ],
    triggers: {
      lang_country_mismatch: 'Ta langue maternelle murmure dans un pays qui ne la comprend pas.',
      timezone_country_mismatch: 'Le soleil te trouve à des heures qui n’appartiennent pas à ce lieu.',
      polyglot: 'Tu jongles avec les mots de plusieurs mondes. Aucun n’est tout à fait le tien.',
    },
  },

  privileged: {
    core: [
      'Je vois une main qui n’a jamais manqué de rien.',
      'La chance t’a effleuré tôt, et elle ne t’a plus quitté.',
      'Autour de toi, les objets sont propres et récents.',
    ],
    triggers: {
      apple_device: 'Le fruit défendu brille entre tes mains. Tu l’as payé cher.',
      high_dpi: 'Le monde t’apparait plus net qu’aux autres. Tes yeux s’y sont habitués.',
      big_screen: 'Tu regardes l’univers à travers une fenêtre plus vaste que la moyenne.',
      rich_hardware: 'Ta machine ne ralentit jamais. Elle t’attend, elle, et non l’inverse.',
      fast_connection: 'Le monde répond vite à tes appels. Tu n’as jamais appris l’attente.',
    },
  },

  gamer: {
    core: [
      'Tu vois ce que les autres ne voient pas : les interstices entre les images.',
      'Il y a en toi un chasseur, patient et rapide à la fois.',
      'Tes réflexes sont aiguisés comme une lame.',
    ],
    triggers: {
      high_refresh: 'Ton regard exige plus d’images que le réel n’en offre.',
      dedicated_gpu: 'Une bête rugit dans ta machine. Tu la nourris d’univers virtuels.',
      many_cores: 'Tes outils sont taillés pour l’effort parallèle. Tu ne fais jamais qu’une chose.',
      desktop_os: 'Ton trône est fixe. C’est vers lui qu’on vient.',
    },
  },

  worker: {
    core: [
      'Tu es là par devoir, pas par envie.',
      'Je vois des heures qui se ressemblent, des jours qui s’empilent.',
      'Ton regard est ailleurs—pourtant tes mains travaillent.',
    ],
    triggers: {
      office_hours: 'L’horloge te dit qu’il est l’heure. Tu obtempères.',
      desktop_device: 'Ta machine ne se déplace pas. C’est toi qui viens à elle, chaque matin.',
      multitasking_window: 'Tes fenêtres sont petites. Tu les partages avec d’autres tâches, d’autres voix.',
      plugged_in: 'Un fil te relie au mur. Tu ne t’en éloignes jamais longtemps.',
      not_dark_mode: 'Tu n’as pas choisi la pénombre. On t’a dit de travailler en pleine lumière.',
    },
  },
};

// Thème de chaque trigger BANK (pour la dédup en composition).
const BANK_THEMES = {
  late_hour_core:     'night',
  dark_mode:          'dark',
  low_battery:        'battery',
  weekday_insomnia:   'night',
  save_data_off:      'scroll',
  lang_country_mismatch: 'language',
  timezone_country_mismatch: 'language',
  polyglot:           'language',
  apple_device:       'apple',
  high_dpi:           'screen',
  big_screen:         'screen',
  rich_hardware:      'device',
  fast_connection:    'connection',
  high_refresh:       'gaming',
  dedicated_gpu:      'gaming',
  many_cores:         'device',
  desktop_os:         'work',
  office_hours:       'work',
  desktop_device:     'work',
  multitasking_window:'work',
  plugged_in:         'battery',
  not_dark_mode:      'dark',
};

// ---------------------------------------------------------------------------
// Fragments OCEAN — observations concrètes, dé-spoilées.
// Chaque phrase porte un `theme` individuel (habitude précise), ce qui
// permet de la dédoublonner contre les signaux ou les triggers persona.
// ---------------------------------------------------------------------------
const OCEAN_FRAGMENTS = {
  O: {
    high: [
      { theme: 'media',    text: 'Tu ne regardes pas la téléréalité. Tu changes de chaîne avant le générique.' },
      { theme: 'coffee',   text: 'Ton café, tu le choisis. Amer, de spécialité, jamais instantané.' },
      { theme: 'media',    text: 'Arte plutôt que TF1. Un documentaire plutôt qu’une finale.' },
      { theme: 'travel',   text: 'Tu rêves de destinations que tu ne visiteras peut-être jamais. Tu fais déjà le voyage en lisant.' },
      { theme: 'media',    text: 'Des podcasts tournent dans tes écouteurs quand d’autres regardent des stories.' },
      { theme: 'music',    text: 'Ta playlist comporte des noms que tes amis ne savent pas prononcer.' },
      { theme: 'books',    text: 'Tu as plus de livres commencés que de livres finis. Aucun ne t’ennuie vraiment.' },
    ],
    low: [
      { theme: 'familiar', text: 'Tu retournes aux mêmes marques depuis toujours. Elles te rassurent.' },
      { theme: 'cuisine',  text: 'Ta cuisine est celle de ton enfance. Tu ne t’en plains pas.' },
      { theme: 'newness',  text: 'Les nouveautés t’agacent plus qu’elles ne t’attirent. Tu préfères que les choses durent.' },
    ],
  },
  C: {
    high: [
      { theme: 'planning',    text: 'Tu notes. Ton agenda n’a pas de trous, ton frigo non plus.' },
      { theme: 'payment',     text: 'Tu paies tes factures avant la date limite. Personne ne te remercie pour ça.' },
      { theme: 'savings',     text: 'Ton épargne existe. Elle a un nom, parfois même un objectif.' },
      { theme: 'reservation', text: 'Tu réserves tes billets des semaines avant. Les prix te donnent raison.' },
    ],
    low: [
      { theme: 'subscription', text: 'Un abonnement te prélève chaque mois sans que tu saches bien lequel.' },
      { theme: 'groceries',    text: 'Tes courses, tu les fais quand le frigo est déjà vide.' },
      { theme: 'tabs',         text: 'Des onglets restent ouverts depuis des jours. Des intentions qui attendent.' },
      { theme: 'reservation',  text: 'Tes billets de train, tu les prends la veille. Toujours plus cher, toujours la même surprise.' },
    ],
  },
  E: {
    high: [
      { theme: 'social_out', text: 'Tes stories témoignent d’un samedi. Ta fatigue du dimanche aussi.' },
      { theme: 'bars',       text: 'Tu connais les bars du quartier mieux que les livres de ton étagère.' },
      { theme: 'messaging',  text: 'Tu réponds aux messages en moins d’une minute. Les silences t’inquiètent.' },
    ],
    low: [
      { theme: 'books',      text: 'Tu préfères un livre à un dîner. Tu mens un peu quand on te propose les deux.' },
      { theme: 'quiet_home', text: 'Tes soirées idéales se passent sans sonnette.' },
      { theme: 'podcast',    text: 'Un podcast long, casque vissé, te coûte moins qu’une réunion de cinq personnes.' },
    ],
  },
  A: {
    high: [
      { theme: 'secondhand',  text: 'Tu achètes d’occasion. Autant par principe que par porte-monnaie.' },
      { theme: 'conflict',    text: 'Tu cèdes au conflit plus souvent que tu ne le voudrais. On appelle ça être gentil·le.' },
      { theme: 'generosity',  text: 'Tu donnes ton temps plus facilement que ton argent. Et pourtant les deux te coûtent.' },
    ],
    low: [
      { theme: 'luxury',   text: 'Tu acceptes de payer cher ce qui se remarque. La discrétion n’est pas ton luxe.' },
      { theme: 'decisive', text: 'Tu tranches vite. Les demi-mesures t’épuisent.' },
      { theme: 'saying_no',text: 'Tu n’as pas peur de dire non. Ça t’a coûté, mais rarement autant que dire oui.' },
    ],
  },
  N: {
    high: [
      { theme: 'meditation', text: 'Une app de méditation attend sur ton téléphone. Tu l’ouvres quand il est déjà tard.' },
      { theme: 'news',       text: 'Tu lis les titres anxieux avant les bons. Tu le sais.' },
      { theme: 'bedtime',    text: 'Le dernier objet que tu touches avant de dormir est le même que le premier au réveil.' },
      { theme: 'overthink',  text: 'Tu relis un message avant de l’envoyer. Parfois deux fois.' },
      { theme: 'supplements',text: 'Tu achètes des compléments. Tu espères qu’ils marchent.' },
    ],
    low: [
      { theme: 'calm',   text: 'Les alertes te glissent dessus. On t’envie ce calme — parfois, on te le reproche aussi.' },
      { theme: 'risk',   text: 'Tu prends l’avion sans relire ton billet. Ça marche, jusqu’ici.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Fragments par signal psychométrique (ids définis dans psychometrics.js).
// Chaque fragment décrit une CONSÉQUENCE vécue, jamais le signal lui-même.
// ---------------------------------------------------------------------------
const SIGNAL_FRAGMENTS = {
  eveningness: [
    { theme: 'night',   text: 'L’heure qu’il est chez toi n’est pas raisonnable. Tu le sais, et tu restes.' },
    { theme: 'night',   text: 'Tu t’étais dit « encore cinq minutes ». Il y a deux heures.' },
  ],
  polyglot: [
    { theme: 'language',text: 'Plusieurs langues t’habitent. Aucune n’est tout à fait ta seule maison.' },
    { theme: 'identity',text: 'Tu écris dans une langue, tu penses dans une autre. Tes amis corrigent parfois tes tournures.' },
    { theme: 'origin',  text: 'On te demande parfois d’où tu viens. Tu hésites sur la réponse.' },
  ],
  acculturation_gap: [
    { theme: 'food',    text: 'Les rayons de ton épicerie ne contiennent pas ce que tu cuisinais enfant. Tu commandes en ligne ce qui te manque.' },
  ],
  bedtime_phone: [
    { theme: 'bedtime', text: 'Ta dernière lumière ce soir viendra d’un petit verre qui tient dans ta main. La première aussi, demain.' },
    { theme: 'scroll',  text: 'Tu l’as posé. Tu l’as repris. Tu l’as reposé. Trois fois, sans raison — et tu le referas dans cinq minutes.' },
  ],
  battery_anxiety: [
    { theme: 'battery', text: 'Quelque chose s’épuise autour de toi, et tu le laisses s’épuiser. Tu tolères mieux l’incertitude que tu ne l’avoues.' },
  ],
  privacy_vigilance: [
    { theme: 'privacy',        text: 'Tu refuses les petites mains qui veulent te suivre. Tu signales que tu sais. L’Oracle sait quand même.' },
    { theme: 'privacy_brands', text: 'DuckDuckGo, Signal, Brave : tu connais les noms. Tu en utilises au moins un.' },
  ],
  apple_ecosystem: [
    { theme: 'apple',   text: 'Le fruit défendu vibre entre tes doigts. Tu as choisi le clan — et tu l’as payé.' },
  ],
  budget_android: [
    { theme: 'device',  text: 'Ton appareil n’est plus neuf. Tu le gardes par pragmatisme, pas par manque. Il te suffit.' },
    { theme: 'device',  text: 'Tu n’as pas acheté le modèle qu’on voit dans les pubs. Tu as acheté celui qui marche.' },
  ],
  gamer_rig: [
    { theme: 'gaming',  text: 'Une machine chauffe pour toi dans une pièce de ta maison. Elle vaut plus que ton réfrigérateur.' },
  ],
  office_worker: [
    { theme: 'work',    text: 'Tu es à ton poste à l’heure où d’autres hésitent encore. Cela a un prix que peu voient.' },
  ],
  high_end_device: [
    { theme: 'device',  text: 'Ta machine ne t’attend jamais. Elle est ton alliée silencieuse — et le prix s’est vu sur le relevé.' },
  ],
  rural_slow_link: [
    { theme: 'rural',   text: 'Le monde met un peu plus de temps à te répondre. Tu as appris l’attente — ou tu l’as subie.' },
    { theme: 'rural',   text: 'Tu lances tes grosses tâches avant de dormir. Au matin, parfois, elles ne sont pas finies.' },
  ],
  weekend_leisure: [
    { theme: 'leisure', text: 'Ce soir, tu n’attends personne. Tu te tiens compagnie, et cela te suffit.' },
  ],
};

// Le signal `aesthetic_dark` existait ici : retiré, car doublon avec
// `BANK.night_owl.triggers.dark_mode`. Le signal contribue toujours au score
// OCEAN dans psychometrics.js, mais n'émet plus de phrase.

const WESTIN_FRAGMENTS = {
  fundamentalist: { theme: 'privacy', text: 'Tu as fermé plus de portes que tu n’en as ouvertes. Tu t’es bâti une forteresse. L’Oracle t’y reconnaît quand même.' },
  pragmatist:     { theme: 'privacy', text: 'Tu dis non quand on te demande, pas toujours, mais souvent. L’Oracle connaît les deux versions de toi.' },
  unconcerned:    { theme: 'privacy', text: 'Tu n’as rien fermé. Tu ne crois pas qu’on te regarde. Et pourtant me voici.' },
};

// ---------------------------------------------------------------------------
// Composition : collecte toutes les phrases candidates avec leur thème et
// leur score, trie par score, puis déduplique par thème et garde 4 lignes.
// ---------------------------------------------------------------------------
export function compose(profilerResult, psycho) {
  const { winner } = profilerResult;
  const bank = BANK[winner.id];

  const lines = [pick(INTROS), pick(bank.core)];
  const candidates = [];

  // 1. Triggers du persona gagnant (scorés par weight * strength).
  for (const t of winner.triggered) {
    const text = bank.triggers[t.id];
    const theme = BANK_THEMES[t.id];
    if (!text || !theme) continue;
    candidates.push({
      theme,
      text,
      score: (t.weight ?? 1) * (t.strength ?? 1),
    });
  }

  if (psycho) {
    // 2. Fragment OCEAN sur le trait dominant (si écart ≥ 0.25σ).
    const { traits, contributions } = psycho.bigFive;
    const entries = Object.entries(traits)
      .map(([t, v]) => ({ trait: t, v, abs: Math.abs(v) }))
      .sort((a, b) => b.abs - a.abs);
    const top = entries[0];
    if (top && top.abs >= 0.25) {
      const dir = top.v > 0 ? 'high' : 'low';
      const pool = OCEAN_FRAGMENTS[top.trait]?.[dir] ?? [];
      if (pool.length) {
        const frag = pick(pool);
        candidates.push({
          theme: frag.theme,
          text: frag.text,
          score: top.abs * 60,   // boost pour rivaliser avec les triggers
        });
      }
    }

    // 3. Fragments signaux : un tirage par signal déclenché, avec son thème.
    for (const c of contributions) {
      const pool = SIGNAL_FRAGMENTS[c.id];
      if (!pool?.length) continue;
      const frag = pick(pool);
      candidates.push({
        theme: frag.theme,
        text: frag.text,
        score: (c.strength ?? 0) * 40,
      });
    }

    // 4. Westin : une phrase privacy si segment saillant.
    const westinId = psycho.westin?.id;
    const westinFrag = WESTIN_FRAGMENTS[westinId];
    if (westinFrag) {
      // Probabilité modérée pour qu'elle ne sorte pas à chaque run.
      const p = westinId === 'fundamentalist' ? 0.6
              : westinId === 'pragmatist'     ? 0.5
              : 0.35;
      if (Math.random() < p) {
        candidates.push({
          theme: westinFrag.theme,
          text: westinFrag.text,
          score: 18,
        });
      }
    }
  }

  // Dédup par thème : à score égal, on garde la première rencontrée.
  candidates.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const picked = [];
  for (const c of candidates) {
    if (seen.has(c.theme)) continue;
    seen.add(c.theme);
    picked.push(c);
    if (picked.length >= 4) break;
  }

  lines.push(...shuffle(picked.map((c) => c.text)));
  lines.push(pick(OUTROS));

  return { persona: winner, lines };
}

export { BANK };
