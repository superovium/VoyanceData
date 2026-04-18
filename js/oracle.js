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
// Composition.
// ---------------------------------------------------------------------------
export function compose(profilerResult) {
  const { winner } = profilerResult;
  const bank = BANK[winner.id];

  const lines = [pick(INTROS), pick(bank.core)];

  // On récupère les fragments associés aux règles déclenchées (strength > 0),
  // pondérés par la force. On en garde 2 à 3 — plus c'est long, plus c'est dilué.
  const fragments = winner.triggered
    .map((t) => ({ ...t, text: bank.triggers[t.id] }))
    .filter((t) => t.text)
    .sort((a, b) => (b.weight * b.strength) - (a.weight * a.strength))
    .slice(0, 3)
    .map((t) => t.text);

  lines.push(...shuffle(fragments));
  lines.push(pick(OUTROS));

  return { persona: winner, lines };
}

export { BANK };
