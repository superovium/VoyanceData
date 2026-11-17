# VoyanceData — L'Oracle Numérique

Site de sensibilisation aux données : un « oracle » devine des choses sur le visiteur
uniquement à partir de ce que son navigateur laisse voir, puis révèle comment il a fait.

## Technique

- HTML, CSS et JavaScript purs : pas de framework, pas de build, pas de serveur applicatif.
- Tout tourne dans le navigateur du visiteur. Seul appel externe : `https://ipapi.co/json/`
  (IP → ville, FAI). Rien n'est enregistré côté serveur.
- `index.html` : les trois scènes (antre, transe, révélation).
- `css/mystic.css`, `css/reveal.css` : apparence et animations.
- `js/collector.js` : collecte des signaux du navigateur (réseau, langue, écran, batterie…).
- `js/profiler.js` : choix du persona et moteur d'exclusion des personas contredits.
- `js/psychometrics.js` : inférence OCEAN / Big Five.
- `js/oracle.js` : phrases de la transe et déductions croisées.
- `js/main.js` : orchestration des scènes et affichage de la révélation.

## Mise en ligne — IMPORTANT

- Branche de production : `claude/oracle-data-awareness-site-SPID6` (branche par défaut sur GitHub).
  **Tout push sur cette branche est en ligne sur https://voyance.superovium.fr en 2 minutes maximum.**
- Sur le VPS (CloudPanel), une tâche cron (`/etc/cron.d/voyance-deploy`) lance
  `/home/voyance/deploy-voyance.sh` toutes les 2 minutes : `git fetch` puis `reset --hard`
  dans `/home/voyance/htdocs/voyance.superovium.fr`. Journal : `/home/voyance/deploy.log`.
- Les fichiers `*.md` à la racine sont retirés du dossier web après chaque déploiement.
- Le dépôt GitHub est **public** : ne jamais y mettre de secret.
- Ajouter un build ou un backend demande d'adapter le déploiement d'abord.

## Façon de travailler

1. Ne jamais committer directement sur la branche de production.
2. Créer une branche (`git checkout -b <idee>`), y travailler et y pousser librement.
3. Tester en local : `python -m http.server 8000` puis http://localhost:8000.
4. Quand c'est validé par le propriétaire : merge dans la branche de production, puis `git push`.
5. Terminer chaque branche (fusionnée ou abandonnée) avant d'en ouvrir une autre :
   les branches `claude/...` non fusionnées ont déjà fini par se contredire.

## En suspens (au 2026-11-17)

- `claude/discover-data-correlations-3aFXL` (avril 2026) n'a jamais été fusionnée :
  segmentation géographique type Mosaic (FR, ES, GB, nouveau `js/mosaic.js`) et phrases
  d'oracle plus concrètes. Elle entre en conflit avec la production sur `js/oracle.js`.
  Au propriétaire de décider : fusionner (en résolvant le conflit) ou abandonner.
- `claude/project-analysis-enhancement-l0ac1w` (juin 2026) est déjà intégrée à la production.
