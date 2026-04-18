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
};

// ---------------------------------------------------------------------------
// Stubs — à remplir lors des prochaines itérations.
// ---------------------------------------------------------------------------
const TRAVELER     = { id: 'traveler',    label: 'L\u2019Exil\u00e9',     tagline: 'Celui dont la langue trahit le lieu',   rules: [] };
const PRIVILEGED   = { id: 'privileged',  label: 'Le Privil\u00e9gi\u00e9', tagline: 'Celui dont les pixels valent de l\u2019or', rules: [] };
const GAMER        = { id: 'gamer',       label: 'Le Chasseur',         tagline: 'Celui qui vit \u00e0 144 images par seconde',  rules: [] };
const WORKER       = { id: 'worker',      label: 'Le For\u00e7at',       tagline: 'Celui dont les fen\u00eatres sont trop petites',  rules: [] };

const PERSONAS = [NIGHT_OWL, TRAVELER, PRIVILEGED, GAMER, WORKER];

/**
 * Calcule les scores pour tous les personas à partir d'un rapport Collector.
 * Retourne :
 *   {
 *     scores:  [{ id, label, score, max, ratio, triggered: [ruleId,...] }],
 *     winner:  <persona le mieux classé>
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
    return {
      id: p.id,
      label: p.label,
      tagline: p.tagline,
      score: Math.round(score),
      max,
      ratio: max > 0 ? score / max : 0,
      triggered,
    };
  });

  // Le gagnant = meilleur ratio (et non score brut), pour que des personas
  // à peu de règles puissent quand même l'emporter s'ils matchent à fond.
  const winner = scores.reduce(
    (best, s) => (s.ratio > best.ratio ? s : best),
    scores[0],
  );

  return { scores, winner };
}

export { PERSONAS };
