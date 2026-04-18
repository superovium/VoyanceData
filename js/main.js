/**
 * main.js — orchestration des 3 états : oracle → trance → reveal.
 */

import Collector from './collector.js';
import { profile } from './profiler.js';
import { compose } from './oracle.js';

const body = document.body;
const sceneOracle = document.getElementById('scene-oracle');
const sceneTrance = document.getElementById('scene-trance');
const sceneReveal = document.getElementById('scene-reveal');
const btnConsult  = document.getElementById('btn-consult');
const btnRestart  = document.getElementById('btn-restart');
const tranceLines = document.getElementById('trance-lines');
const revealRaw   = document.getElementById('reveal-raw');
const revealScores = document.getElementById('reveal-scores');
const revealExplain = document.getElementById('reveal-explain');

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

// ---------------------------------------------------------------------------
// Transition vers la transe : on lance la collecte en parallèle de l'animation.
// ---------------------------------------------------------------------------
const runTrance = async () => {
  setState('trance');
  tranceLines.innerHTML = '';

  // Démarre la collecte SANS l'attendre : l'animation tourne pendant ce temps.
  const collectPromise = Collector.collectAll();

  // Phrases d'attente génériques pendant la collecte
  const waitingLines = [
    'Je sonde l\u2019\u00e9ther\u2026',
    'Les signes convergent\u2026',
    'Ton empreinte se dessine\u2026',
  ];
  for (const line of waitingLines) {
    addTranceLine(line);
    await sleep(1100);
  }

  lastData = await collectPromise;
  lastProfile = profile(lastData);
  lastScript = compose(lastProfile);

  // On affiche les phrases personnalisées, une par une.
  for (const line of lastScript.lines) {
    addTranceLine(line);
    await sleep(1400);
  }

  // Bouton "Voir la vérité"
  await sleep(800);
  const revealBtn = document.createElement('button');
  revealBtn.className = 'ghost-btn';
  revealBtn.style.marginTop = '2rem';
  revealBtn.style.color = 'var(--mystic-text)';
  revealBtn.style.borderColor = 'var(--mystic-accent)';
  revealBtn.textContent = 'Voir la v\u00e9rit\u00e9';
  revealBtn.addEventListener('click', runReveal, { once: true });
  tranceLines.appendChild(revealBtn);
};

const addTranceLine = (text) => {
  const p = document.createElement('p');
  p.textContent = text;
  tranceLines.appendChild(p);
};

// ---------------------------------------------------------------------------
// Révélation : affiche raw data + scores + explications.
// ---------------------------------------------------------------------------
const runReveal = () => {
  setState('reveal');

  // 1. Données brutes — JSON pretty-print, avec _errors en fin de liste
  revealRaw.textContent = JSON.stringify(lastData, null, 2);

  // 2. Scores
  revealScores.innerHTML = '';
  const sorted = [...lastProfile.scores].sort((a, b) => b.ratio - a.ratio);
  for (const s of sorted) {
    const row = document.createElement('div');
    row.className = 'score-row' + (s.id === lastProfile.winner.id ? ' winner' : '');
    const pct = Math.round(s.ratio * 100);
    row.innerHTML = `
      <span>${escapeHtml(s.label)}</span>
      <span class="score-bar"><span style="width:${pct}%"></span></span>
      <span>${pct}%</span>
    `;
    revealScores.appendChild(row);
  }

  // 3. Explications : les règles déclenchées sur le persona gagnant
  revealExplain.innerHTML = '';
  if (lastProfile.winner.triggered.length === 0) {
    revealExplain.innerHTML = '<div class="explain-item">Aucune r\u00e8gle n\u2019a pu s\u2019appliquer clairement.</div>';
  }
  for (const t of lastProfile.winner.triggered) {
    const item = document.createElement('div');
    item.className = 'explain-item';
    const strengthPct = Math.round(t.strength * 100);
    item.innerHTML = `
      <span class="explain-rule">${escapeHtml(t.id)}</span>
      <span class="explain-why">
        (poids ${t.weight} &middot; d\u00e9clench\u00e9 \u00e0 ${strengthPct}%)
      </span>
    `;
    revealExplain.appendChild(item);
  }
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

// ---------------------------------------------------------------------------
// Bindings
// ---------------------------------------------------------------------------
btnConsult.addEventListener('click', runTrance);
btnRestart.addEventListener('click', () => setState('oracle'));
