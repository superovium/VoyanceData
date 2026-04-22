/**
 * oracle.js
 * Génère un discours mystique à partir d'un résultat de profiler.js et d'une
 * analyse psychométrique (psychometrics.js).
 *
 * Principe :
 *   - Chaque persona a une banque de phrases "core" + "triggers".
 *   - Les fragments OCEAN sont CONCRETS : ils citent des habitudes, marques,
 *     gestes précis tirés des corrélations documentées (Kosinski 2013,
 *     Matz 2017, Gladstone 2019).
 *   - Les SIGNAL_FRAGMENTS pointent un signal psychométrique exact
 *     (téléphone au lit, batterie basse, etc.) avec une observation précise.
 *   - On assemble : intro + persona core + ~3-4 fragments mêlés + outro.
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
// Banque de phrases par persona (inchangée).
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

// ---------------------------------------------------------------------------
// Fragments Big Five — observations CONCRÈTES par (trait × direction).
// L'effet "waouh" vient de la précision : chaque phrase nomme une habitude,
// une marque, un geste, plutôt qu'une métaphore générique.
// Sources implicites : Kosinski 2013, Matz 2017, Gladstone 2019.
// ---------------------------------------------------------------------------
const OCEAN_FRAGMENTS = {
  O: {
    high: [
      'Tu ne regardes pas la téléréalité. Tu changes de chaîne avant le générique.',
      'Ton café, tu le choisis. Amer, de spécialité, jamais instantané.',
      'Arte plutôt que TF1. Un documentaire plutôt qu’une finale.',
      'Tu rêves de voyages où la langue n’est pas la tienne. Tu en fais moins que tu n’en rêves.',
      'Des podcasts tournent dans tes écouteurs quand d’autres regardent des stories.',
      'Ta playlist comporte des noms que tes amis ne savent pas prononcer.',
      'Tu as plus de livres commencés que de livres finis. Aucun ne t’ennuie vraiment.',
    ],
    low: [
      'Tu retournes aux mêmes marques depuis toujours. Elles te rassurent.',
      'Ta cuisine est celle de ton enfance. Tu ne t’en plains pas.',
      'Les nouveautés t’agacent plus qu’elles ne t’attirent. Tu préfères que les choses durent.',
    ],
  },
  C: {
    high: [
      'Tu notes. Ton agenda n’a pas de trous, ton frigo non plus.',
      'Tu paies tes factures avant la date limite. Personne ne te remercie pour ça.',
      'Ton épargne existe. Elle a un nom, parfois même un objectif.',
      'Tu réserves tes billets des semaines avant. Les prix te donnent raison.',
    ],
    low: [
      'Un abonnement te prélève chaque mois sans que tu saches bien lequel.',
      'Tes courses, tu les fais quand le frigo est déjà vide.',
      'Des onglets restent ouverts depuis des jours. Des intentions qui attendent.',
      'Tes billets de train, tu les prends la veille. Toujours plus cher, toujours la même surprise.',
    ],
  },
  E: {
    high: [
      'Tes stories témoignent d’un samedi. Ta fatigue du dimanche aussi.',
      'Tu connais les bars du quartier mieux que les livres de ton étagère.',
      'Tu réponds aux messages en moins d’une minute. Les silences t’inquiètent.',
    ],
    low: [
      'Tu préfères un livre à un dîner. Tu mens un peu quand on te propose les deux.',
      'Tes soirées idéales se passent sans sonnette.',
      'Un podcast long, casque vissé, te coûte moins qu’une réunion de cinq personnes.',
    ],
  },
  A: {
    high: [
      'Tu achètes d’occasion. Autant par principe que par porte-monnaie.',
      'Tu cèdes au conflit plus souvent que tu ne le voudrais. On appelle ça être gentil·le.',
      'Tu donnes ton temps plus facilement que ton argent. Et pourtant les deux te coûtent.',
    ],
    low: [
      'Tu acceptes de payer cher ce qui se remarque. La discrétion n’est pas ton luxe.',
      'Tu tranches vite. Les demi-mesures t’épuisent.',
      'Tu n’as pas peur de dire non. Ça t’a coûté, mais rarement autant que dire oui.',
    ],
  },
  N: {
    high: [
      'Une app de méditation attend sur ton téléphone. Tu l’ouvres quand il est déjà tard.',
      'Tu lis les titres anxieux avant les bons. Tu le sais.',
      'Ton téléphone est le dernier objet que tu touches avant de dormir. Et le premier au réveil.',
      'Tu relis un message avant de l’envoyer. Parfois deux fois.',
      'Tu achètes des compléments. Tu espères qu’ils marchent.',
    ],
    low: [
      'Les alertes te glissent dessus. On t’envie ce calme — parfois, on te le reproche aussi.',
      'Tu prends l’avion sans relire ton billet. Ça marche, jusqu’ici.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Fragments par signal psychométrique précis. Déclenchés selon les ids
// définis dans psychometrics.js. Plus précis encore que les OCEAN : ils
// décrivent un geste exact en s'appuyant sur le signal détecté.
// ---------------------------------------------------------------------------
const SIGNAL_FRAGMENTS = {
  eveningness: [
    'L’heure qu’il est chez toi n’est pas raisonnable. Tu le sais, et tu restes.',
    'Tu t’étais dit « encore cinq minutes ». Il y a deux heures.',
  ],
  polyglot: [
    'Plusieurs langues habitent ton téléphone. Aucune n’est tout à fait ta seule maison.',
    'Tu écris dans une langue, tu penses dans une autre. Tes amis corrigent parfois tes tournures.',
  ],
  acculturation_gap: [
    'Tes racines parlent une langue que le ciel au-dessus de toi ne comprend pas.',
    'Les rayons de ton épicerie ne contiennent pas ce que tu cuisinais enfant. Tu commandes en ligne ce qui te manque.',
  ],
  bedtime_phone: [
    'Ton dernier geste ce soir sera un scroll. Ton premier geste demain aussi.',
    'Tu as posé le téléphone, repris le téléphone, reposé le téléphone. Trois fois en dix minutes.',
  ],
  battery_anxiety: [
    'Ta batterie descend et tu la laisses descendre. Tu tolères mieux l’incertitude que tu ne l’avoues.',
  ],
  privacy_vigilance: [
    'Tu as refusé les cookies. Tu signales que tu sais. L’Oracle sait quand même.',
    'DuckDuckGo, Signal, Brave : tu connais les noms. Tu en utilises au moins un.',
  ],
  apple_ecosystem: [
    'Le fruit défendu vibre entre tes doigts. Tu as choisi le clan — et tu l’as payé.',
  ],
  budget_android: [
    'Ton téléphone n’est plus neuf. Tu le gardes par pragmatisme, pas par manque. Il te suffit.',
    'Tu n’as pas acheté le modèle qu’on voit dans les pubs. Tu as acheté celui qui marche.',
  ],
  gamer_rig: [
    'Ton écran te rend des images que l’œil moyen ne saurait pas voir. Tu les payes cher.',
    'Une carte graphique chauffe dans ton salon. Elle vaut plus que ton frigo.',
  ],
  office_worker: [
    'Tu es à ton poste à l’heure où d’autres hésitent encore. Cela a un prix que peu voient.',
  ],
  high_end_device: [
    'Ta machine ne t’attend jamais. Elle est ton alliée silencieuse — et le prix s’est vu sur le relevé.',
  ],
  aesthetic_dark: [
    'Tu as choisi l’obscurité jusque dans tes écrans. Une coquetterie qui en dit long.',
  ],
  rural_slow_link: [
    'Le monde met un peu plus de temps à te répondre. Tu as appris l’attente — ou tu l’as subie.',
    'Tes téléchargements, tu les lances avant d’aller dormir. Le débit te punit chaque jour.',
  ],
  weekend_leisure: [
    'Ce soir, tu n’attends personne. Tu te tiens compagnie, et cela te suffit.',
  ],
};

const WESTIN_FRAGMENTS = {
  fundamentalist: 'Tu as fermé plus de portes que tu n’en as ouvertes. Ton navigateur est une forteresse. L’Oracle t’y reconnaît quand même.',
  pragmatist:     'Tu cliques « refuser tout » quand tu y penses. Tu oublies parfois. L’Oracle connaît les deux versions de toi.',
  unconcerned:    'Tu n’as rien fermé. Tu ne crois pas qu’on te regarde. Et pourtant me voici.',
};

/**
 * Renvoie les lignes de révélation : 1 OCEAN dominant + 1-2 signaux concrets
 * + 0-1 Westin. Mélange macro (trait dominant) et micro (signal précis).
 */
function psychoLines(psycho) {
  if (!psycho) return [];
  const lines = [];

  // 1. Une phrase OCEAN sur le trait dominant (si écart ≥ 0.25σ).
  const { traits, contributions } = psycho.bigFive;
  const entries = Object.entries(traits)
    .map(([t, v]) => ({ trait: t, v, abs: Math.abs(v) }))
    .sort((a, b) => b.abs - a.abs);

  const top = entries[0];
  if (top && top.abs >= 0.25) {
    const dir = top.v > 0 ? 'high' : 'low';
    const frag = pick(OCEAN_FRAGMENTS[top.trait]?.[dir] ?? []);
    if (frag) lines.push(frag);
  }

  // 2. 1-2 phrases tirées des signaux concrets les plus forts.
  const signalFrags = [...contributions]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4)
    .map((c) => {
      const pool = SIGNAL_FRAGMENTS[c.id];
      return pool?.length ? pick(pool) : null;
    })
    .filter(Boolean);

  lines.push(...shuffle(signalFrags).slice(0, 2));

  // 3. Phrase privacy si le segment est saillant (proba modérée).
  const westinId = psycho.westin?.id;
  if (westinId === 'fundamentalist' && Math.random() < 0.6) {
    lines.push(WESTIN_FRAGMENTS.fundamentalist);
  } else if (westinId === 'pragmatist' && Math.random() < 0.45) {
    lines.push(WESTIN_FRAGMENTS.pragmatist);
  } else if (westinId === 'unconcerned' && Math.random() < 0.35) {
    lines.push(WESTIN_FRAGMENTS.unconcerned);
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Composition.
// ---------------------------------------------------------------------------
export function compose(profilerResult, psycho) {
  const { winner } = profilerResult;
  const bank = BANK[winner.id];

  const lines = [pick(INTROS), pick(bank.core)];

  // Fragments liés aux règles déclenchées du persona gagnant.
  const fragments = winner.triggered
    .map((t) => ({ ...t, text: bank.triggers[t.id] }))
    .filter((t) => t.text)
    .sort((a, b) => (b.weight * b.strength) - (a.weight * a.strength))
    .slice(0, 2)
    .map((t) => t.text);

  // Fragments psychométriques (OCEAN + signaux concrets + Westin).
  const psycho_lines = psychoLines(psycho);

  // Mélange : on garde 4-5 fragments au total pour ne pas diluer.
  const middle = shuffle([...fragments, ...psycho_lines]).slice(0, 5);
  lines.push(...middle);
  lines.push(pick(OUTROS));

  return { persona: winner, lines };
}

export { BANK };
