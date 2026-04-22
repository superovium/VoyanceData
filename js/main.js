/**
 * main.js — orchestration des 3 états : oracle → trance → reveal.
 */

import Collector from './collector.js';
import { profile } from './profiler.js';
import { compose } from './oracle.js';
import { analyze, TRAIT_LABELS, TRAIT_DESCRIPTIONS } from './psychometrics.js';

const $ = (id) => document.getElementById(id);

const body          = document.body;
const sceneOracle   = $('scene-oracle');
const sceneTrance   = $('scene-trance');
const sceneReveal   = $('scene-reveal');
const btnConsult    = $('btn-consult');
const btnRestart    = $('btn-restart');
const tranceLines   = $('trance-lines');
const tranceActions = $('trance-actions');
const revealCards   = $('reveal-cards');
const revealRaw     = $('reveal-raw');
const revealPersona = $('reveal-persona');

let lastData = null;
let lastProfile = null;
let lastScript = null;
let lastPsycho = null;

const setState = (name) => {
  body.dataset.state = name;
  sceneOracle.hidden = name !== 'oracle';
  sceneTrance.hidden = name !== 'trance';
  sceneReveal.hidden = name !== 'reveal';
  window.scrollTo(0, 0);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

// Durée d'affichage en ms calibrée sur les standards de sous-titrage.
// Référence : ~180 mots/min confortables (BBC/Netflix guidelines, ~17 CPS),
// ralenti ici à ~150 mots/min pour le ton mystique (mots qui se savourent).
// + un buffer de 900ms pour le fondu d'entrée et la pause contemplative.
// Bornes : min 2s (pour une phrase très courte), max 7.5s (pour les tirades).
const readingTimeMs = (text) => {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length;
  const perWord = 60000 / 150;  // 400 ms / mot
  const raw = words * perWord + 900;
  return Math.min(7500, Math.max(2000, Math.round(raw)));
};

// ===========================================================================
// SCÈNE 2 — TRANSE
// Une phrase à la fois, crossfade, pas de scroll.
// ===========================================================================
const showTranceLine = (text, holdMs) => new Promise((resolve) => {
  if (holdMs == null) holdMs = readingTimeMs(text);
  const prev = tranceLines.querySelector('.trance-line');
  if (prev) {
    prev.classList.add('fading-out');
    setTimeout(() => prev.remove(), 600);
  }
  const p = document.createElement('p');
  p.className = 'trance-line';
  p.textContent = text;
  tranceLines.appendChild(p);
  setTimeout(resolve, holdMs);
});

const runTrance = async () => {
  setState('trance');
  tranceLines.innerHTML = '';
  tranceActions.innerHTML = '';

  const collectPromise = Collector.collectAll();

  const waitingLines = [
    'Je sonde l\u2019éther…',
    'Les signes convergent…',
    'Ton empreinte se dessine…',
  ];
  for (const line of waitingLines) {
    await showTranceLine(line);
  }

  lastData = await collectPromise;
  lastProfile = profile(lastData);
  lastPsycho = analyze(lastData);
  lastScript = compose(lastProfile, lastPsycho);

  for (const line of lastScript.lines) {
    await showTranceLine(line);
  }

  // Dernière phrase reste à l'écran, on ajoute le bouton.
  await sleep(400);
  const btn = document.createElement('button');
  btn.className = 'mystic-btn';
  btn.textContent = 'Voir la vérité';
  btn.addEventListener('click', runReveal, { once: true });
  tranceActions.appendChild(btn);
};

// ===========================================================================
// SCÈNE 3 — RÉVÉLATION
// ===========================================================================
const fmt = {
  na: '<em class="card-empty" style="display:inline; padding:0">—</em>',
  bool: (v) => v === true ? '✓' : v === false ? '✗' : fmt.na,
  num: (v, unit = '') => (v == null ? fmt.na : `${v}${unit}`),
  str: (v) => (v ? escapeHtml(v) : fmt.na),
};

const row = (key, value, extraClass = '') =>
  `<div class="card-row"><dt>${escapeHtml(key)}</dt><dd class="${extraClass}">${value}</dd></div>`;

const card = (icon, title, rowsHtml) => {
  if (!rowsHtml) {
    rowsHtml = `<div class="card-empty">Aucune donnée lisible.</div>`;
  }
  return `
    <article class="reveal-card">
      <h3 class="card-title"><span class="card-icon">${icon}</span>${escapeHtml(title)}</h3>
      <dl>${rowsHtml}</dl>
    </article>
  `;
};

const buildCards = (d) => {
  const parts = [];

  // Réseau
  const n = d.network;
  if (n) {
    const location = [n.city, n.region, n.country].filter(Boolean).join(', ') || fmt.na;
    const rows =
      row('IP publique', fmt.str(n.ip), 'accent') +
      row('Pays',        `${fmt.str(n.country)} ${n.countryCode ? `<span class="tag">${escapeHtml(n.countryCode)}</span>` : ''}`) +
      row('Localisation',location) +
      row('Coordonnées', (n.lat != null && n.lon != null) ? `${n.lat.toFixed(2)}, ${n.lon.toFixed(2)}` : fmt.na) +
      row('FAI',         fmt.str(n.isp)) +
      row('ASN',         fmt.str(n.asn));
    parts.push(card('🌐', 'Réseau', rows));
  } else {
    parts.push(card('🌐', 'Réseau', ''));
  }

  // Navigateur
  const b = d.browser;
  if (b) {
    const rows =
      row('Langue principale', fmt.str(b.language)) +
      row('Langues acceptées', b.languages?.length ? escapeHtml(b.languages.join(', ')) : fmt.na) +
      row('Plateforme',        fmt.str(b.uaData?.platform || b.platform)) +
      row('Version OS',        fmt.str(b.uaData?.platformVersion)) +
      row('CPU (logique)',     fmt.num(b.hardwareConcurrency, ' cœurs')) +
      row('Mémoire',           fmt.num(b.deviceMemory, ' Go')) +
      row('Cookies activés',   fmt.bool(b.cookiesEnabled), b.cookiesEnabled ? 'warn' : 'good') +
      row('Do Not Track',      fmt.str(b.doNotTrack));
    parts.push(card('🧭', 'Navigateur & OS', rows));
  } else {
    parts.push(card('🧭', 'Navigateur & OS', ''));
  }

  // Écran
  const s = d.display;
  if (s) {
    const hzClass = s.refreshHz >= 100 ? 'accent' : '';
    const rows =
      row('Résolution écran', `${fmt.num(s.screenW)} × ${fmt.num(s.screenH)}`) +
      row('Fenêtre',          `${fmt.num(s.windowW)} × ${fmt.num(s.windowH)}`) +
      row('Densité (DPR)',    fmt.num(s.pixelRatio, '×')) +
      row('Profondeur',       fmt.num(s.colorDepth, ' bits')) +
      row('Rafraîchissement', fmt.num(s.refreshHz, ' Hz'), hzClass) +
      row('Orientation',      fmt.str(s.orientation));
    parts.push(card('🖥️', 'Écran & fenêtre', rows));
  } else {
    parts.push(card('🖥️', 'Écran & fenêtre', ''));
  }

  // GPU
  const g = d.gpu;
  if (g) {
    const rendererStr = (g.renderer || '').toLowerCase();
    const dedicated = /nvidia|geforce|radeon|amd/.test(rendererStr);
    const rows =
      row('Fabricant',     fmt.str(g.vendor)) +
      row('Modèle',        fmt.str(g.renderer), dedicated ? 'accent' : '') +
      row('Type',          dedicated ? 'GPU dédié' : 'GPU intégré', dedicated ? 'good' : '') +
      row('API',           fmt.str(g.version));
    parts.push(card('🎮', 'Processeur graphique', rows));
  } else {
    parts.push(card('🎮', 'Processeur graphique', ''));
  }

  // Locale
  const l = d.locale;
  if (l) {
    const days = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const hh = String(l.localHour).padStart(2, '0');
    const mm = String(l.localMinutes).padStart(2, '0');
    const nightly = l.localHour != null && (l.localHour >= 23 || l.localHour < 6);
    const rows =
      row('Heure locale',   `${hh}:${mm}`, nightly ? 'warn' : '') +
      row('Jour',           days[l.dayOfWeek] ?? fmt.na) +
      row('Fuseau horaire', fmt.str(l.timezone)) +
      row('Décalage UTC',   l.tzOffsetMin != null ? `${l.tzOffsetMin >= 0 ? '+' : ''}${l.tzOffsetMin} min` : fmt.na) +
      row('Locale',         fmt.str(l.locale)) +
      row('Calendrier',     fmt.str(l.calendar));
    parts.push(card('🕰️', 'Heure & langue', rows));
  } else {
    parts.push(card('🕰️', 'Heure & langue', ''));
  }

  // Préférences
  const p = d.preferences;
  if (p) {
    const rows =
      row('Mode sombre',      fmt.bool(p.darkMode),       p.darkMode ? 'accent' : '') +
      row('Motion réduite',   fmt.bool(p.reducedMotion)) +
      row('Data réduite',     fmt.bool(p.reducedData)) +
      row('Contraste élevé',  fmt.bool(p.highContrast));
    parts.push(card('🎨', 'Préférences système', rows));
  } else {
    parts.push(card('🎨', 'Préférences système', ''));
  }

  // Batterie
  const bat = d.battery;
  if (bat) {
    const pct = Math.round((bat.level ?? 0) * 100);
    const low = pct < 20;
    const chargingStr = bat.charging ? '⚡ en charge' : '🔋 sur batterie';
    const bar = `<span class="mini-bar ${low ? 'low' : ''}"><span style="width:${pct}%"></span></span>${pct}%`;
    const rows =
      row('Niveau',           bar, low ? 'danger' : 'good') +
      row('Statut',           chargingStr) +
      row('Temps restant',    bat.dischargingTime && bat.dischargingTime !== Infinity ? `${Math.round(bat.dischargingTime/60)} min` : fmt.na);
    parts.push(card('🔋', 'Batterie', rows));
  } else {
    parts.push(card('🔋', 'Batterie', '<div class="card-empty">API non disponible (Firefox / Safari).</div>'));
  }

  // Connexion
  const c = d.connection;
  if (c) {
    const rows =
      row('Type',        fmt.str(c.effectiveType?.toUpperCase())) +
      row('Débit',       fmt.num(c.downlink, ' Mb/s')) +
      row('Latence',     fmt.num(c.rtt, ' ms')) +
      row('Économie data', fmt.bool(c.saveData));
    parts.push(card('📡', 'Connexion réseau', rows));
  } else {
    parts.push(card('📡', 'Connexion réseau', '<div class="card-empty">API non disponible.</div>'));
  }

  return parts.join('');
};

// ---------- Oracle echo : rappel des phrases de la transe ----------
const buildOracleEcho = (script) => {
  if (!script?.lines?.length) return '';
  const items = script.lines
    .map((line) => `<p class="echo-line">${escapeHtml(line)}</p>`)
    .join('');
  return `
    <section class="oracle-echo">
      <h3 class="echo-title">
        <span class="echo-icon">✦</span>
        Ce que l’Oracle a murmuré
      </h3>
      <div class="echo-body">${items}</div>
      <p class="echo-foot">
        Relis à froid ce que la transe t’a soufflé. Les pages suivantes
        expliquent <em>d’où</em> viennent ces phrases.
      </p>
    </section>
  `;
};

// ---------- Psychometrics panel ----------
// Rendu du Big Five, segment Westin, chronotype et profil conso dérivé.
// Chaque bloc cite sa source académique.
const TRAIT_ORDER = ['O', 'C', 'E', 'A', 'N'];

const buildBigFiveBars = (traits) => TRAIT_ORDER.map((t) => {
  const z = traits[t] ?? 0;
  const pct = Math.round(((z + 1) / 2) * 100);   // [-1,+1] → [0,100]
  const dir = z >= 0 ? 'high' : 'low';
  const desc = TRAIT_DESCRIPTIONS[t][dir];
  const absStrong = Math.abs(z) >= 0.4;
  const zLabel = (z >= 0 ? '+' : '') + z.toFixed(2) + 'σ';
  return `
    <div class="ocean-row ${absStrong ? 'strong' : ''}">
      <span class="ocean-label">${TRAIT_LABELS[t]}</span>
      <span class="ocean-track">
        <span class="ocean-axis"></span>
        <span class="ocean-fill ${z >= 0 ? 'pos' : 'neg'}" style="width:${Math.abs(z) * 50}%; ${z >= 0 ? 'left:50%' : `right:50%`}"></span>
      </span>
      <span class="ocean-z">${zLabel}</span>
      <span class="ocean-desc">${escapeHtml(desc)}</span>
    </div>
  `;
}).join('');

const buildPsychometrics = (psycho) => {
  if (!psycho) return '';
  const { bigFive, westin, chrono, consumer } = psycho;

  // Bloc Big Five avec avertissement scientifique.
  const bigFiveHtml = `
    <div class="psy-section psy-bigfive">
      <h3>Portrait OCEAN <span class="psy-sub">selon les signaux détectés</span></h3>
      <div class="ocean-grid">${buildBigFiveBars(bigFive.traits)}</div>
      <p class="psy-footnote">
        Lecture : une barre à droite = au-dessus de la moyenne, à gauche = en dessous.
        Agrégation probabiliste de ${bigFive.contributions.length} signal(s) indépendant(s).
        Chaque signal unitaire reste faible (r ≈ 0.15–0.30, Azucar et al. 2018) ;
        c'est le cumul qui rend le portrait ressemblant.
      </p>
    </div>
  `;

  // Signaux déclenchés + sources.
  const sigsHtml = bigFive.contributions.length === 0
    ? '<p class="psy-empty">Aucun signal détectable dans ce rapport.</p>'
    : bigFive.contributions.map((c) => `
        <details class="psy-signal">
          <summary>
            <span class="psy-sig-label">${escapeHtml(c.label)}</span>
            <span class="psy-sig-strength">${Math.round(c.strength * 100)}%</span>
          </summary>
          <div class="psy-sig-body">
            <div class="psy-sig-effects">${
              TRAIT_ORDER
                .filter((t) => Math.abs(c.effects[t]) >= 0.1)
                .map((t) => {
                  const v = c.effects[t] * c.strength;
                  const sign = v >= 0 ? '+' : '';
                  return `<span class="psy-eff psy-eff-${v >= 0 ? 'pos' : 'neg'}">${TRAIT_LABELS[t]} ${sign}${v.toFixed(2)}σ</span>`;
                })
                .join('')
            }</div>
            <cite class="psy-source">${escapeHtml(c.source)}</cite>
          </div>
        </details>
      `).join('');

  // Segment Westin.
  const westinHtml = `
    <div class="psy-section psy-westin">
      <h3>Segment Westin (vie privée)</h3>
      <div class="psy-badge psy-westin-${westin.id}">${escapeHtml(westin.label)}</div>
      <p class="psy-text">${escapeHtml(westin.description)}</p>
      <cite class="psy-source">Westin Privacy Segmentation (Harris &amp; Westin, 1991-2003) ; Schomakers et al. (2019)</cite>
    </div>
  `;

  // Chronotype.
  const chronoHtml = chrono.id === 'unknown' ? '' : `
    <div class="psy-section psy-chrono">
      <h3>Chronotype</h3>
      <div class="psy-badge psy-chrono-${chrono.id}">${escapeHtml(chrono.label)}</div>
      <p class="psy-text">${escapeHtml(chrono.note ?? '')}</p>
      <cite class="psy-source">Horne &amp; Östberg (1976) ; Roenneberg et al. (2007), Current Biology</cite>
    </div>
  `;

  // Profil conso.
  const consumerHtml = consumer.length === 0
    ? `<p class="psy-empty">Portrait trop proche de la moyenne : aucune préférence conso saillante.</p>`
    : consumer.map((side) => {
        const arrow = side.direction === 'high' ? '↑' : '↓';
        return `
          <div class="psy-consumer-block">
            <h4>
              <span class="psy-trait-name">${escapeHtml(side.traitLabel)} ${arrow}</span>
              <span class="psy-z">${side.z >= 0 ? '+' : ''}${side.z.toFixed(2)}σ</span>
            </h4>
            <div class="psy-chip-group">
              <span class="psy-chip-label">Appétences :</span>
              ${side.likes.map((x) => `<span class="psy-chip psy-chip-like">${escapeHtml(x)}</span>`).join('')}
            </div>
            <div class="psy-chip-group">
              <span class="psy-chip-label">Marques typiques :</span>
              ${side.brands.map((x) => `<span class="psy-chip psy-chip-brand">${escapeHtml(x)}</span>`).join('')}
            </div>
            <cite class="psy-source">${escapeHtml(side.source)}</cite>
          </div>
        `;
      }).join('');

  return `
    <section class="psy-panel">
      ${bigFiveHtml}

      <div class="psy-row">
        ${westinHtml}
        ${chronoHtml}
      </div>

      <div class="psy-section psy-consumer">
        <h3>Profil consommateur probable <span class="psy-sub">(dérivé du portrait OCEAN)</span></h3>
        ${consumerHtml}
        <p class="psy-warning">
          ⚠ Ces prédictions sont <strong>probabilistes</strong> et tirées de corrélations de groupe :
          elles décrivent ce que font <em>en moyenne</em> les personnes aux signaux similaires,
          pas ce que tu es. C'est exactement le type d'inférence qu'utilisent les régies
          publicitaires (Matz et al. 2017, PNAS).
        </p>
      </div>

      <div class="psy-section psy-signals">
        <h3>Signaux détectés dans ton rapport</h3>
        ${sigsHtml}
      </div>
    </section>
  `;
};

// ---------- Persona panel ----------
const buildPersona = (prof) => {
  const w = prof.winner;
  const scoresHtml = [...prof.scores].sort((a, b) => b.ratio - a.ratio).map((s) => {
    const pct = Math.round(s.ratio * 100);
    const winner = s.id === w.id ? 'winner' : '';
    return `
      <div class="score-row ${winner}">
        <span>${escapeHtml(s.label)}</span>
        <span class="score-bar"><span style="width:${pct}%"></span></span>
        <span>${pct}%</span>
      </div>
    `;
  }).join('');

  const triggered = w.triggered.length === 0
    ? '<div class="explain-item">Aucune règle n\u2019a pu s\u2019appliquer clairement.</div>'
    : w.triggered.map((t) => `
      <div class="explain-item">
        <span class="explain-rule">${escapeHtml(t.id)}</span>
        <span class="explain-why">poids ${t.weight} · déclenché à ${Math.round(t.strength * 100)}%</span>
      </div>
    `).join('');

  return `
    <div class="persona-hero">
      <h2 class="persona-label">${escapeHtml(w.label)}</h2>
      <p class="persona-tag">${escapeHtml(w.tagline)}</p>
      <span class="persona-score">${Math.round(w.ratio * 100)}% de correspondance</span>
    </div>

    <div class="explain-section">
      <h3>Score de tous les personas</h3>
      ${scoresHtml}
    </div>

    <div class="explain-section">
      <h3>Règles déclenchées sur ${escapeHtml(w.label)}</h3>
      ${triggered}
    </div>
  `;
};

// ---------- JSON syntax highlighter ----------
const syntaxHighlight = (json) => {
  const str = JSON.stringify(json, null, 2);
  return escapeHtml(str).replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (m) => {
      let cls = 'jn';
      if (/^"/.test(m))       cls = /:$/.test(m) ? 'jk' : 'js';
      else if (/true|false/.test(m)) cls = 'jb';
      else if (/null/.test(m))       cls = 'jnull';
      return `<span class="${cls}">${m}</span>`;
    }
  );
};

const runReveal = () => {
  setState('reveal');
  revealCards.innerHTML   = buildCards(lastData);
  revealPersona.innerHTML = buildOracleEcho(lastScript) + buildPersona(lastProfile) + buildPsychometrics(lastPsycho);
  revealRaw.innerHTML     = syntaxHighlight(lastData);
};

// ---------- Tabs ----------
document.querySelectorAll('.reveal-tabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.reveal-tabs .tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.tab-panel').forEach((p) => {
      p.classList.toggle('active', p.id === `tab-${target}`);
    });
  });
});

// ---------- Bindings ----------
btnConsult.addEventListener('click', runTrance);
btnRestart.addEventListener('click', () => setState('oracle'));
