/**
 * main.js — orchestration des 3 états : oracle → trance → reveal.
 */

import Collector from './collector.js';
import { profile } from './profiler.js';
import { compose } from './oracle.js';

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

// ===========================================================================
// SCÈNE 2 — TRANSE
// Une phrase à la fois, crossfade, pas de scroll.
// ===========================================================================
const showTranceLine = (text, holdMs = 2400) => new Promise((resolve) => {
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
    await showTranceLine(line, 1600);
  }

  lastData = await collectPromise;
  lastProfile = profile(lastData);
  lastScript = compose(lastProfile);

  for (const line of lastScript.lines) {
    await showTranceLine(line, 2600);
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
  revealPersona.innerHTML = buildPersona(lastProfile);
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
