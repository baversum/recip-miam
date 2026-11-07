---
title: Téléchargements
---

Sélectionne les recettes que tu veux récupérer, puis choisis le format :

- **Markdown (.md)** : les fichiers sources, exactement tels qu'ils sont écrits dans le dépôt. Idéal pour archiver ou réimporter les recettes.
- **HTML autonome** : une page indépendante par recette, avec une mise en page minimale intégrée, lisible hors ligne sans aucune dépendance.

La sélection est livrée dans une archive (.zip) générée directement dans le navigateur, sans envoi de données à un serveur tiers. Chaque fichier porte le nom de la recette.

<style>
#recipe-export {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.4rem;
  padding: 0.9rem 1.1rem 1rem;
  margin-top: 1.2em;
}
.rex-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 0.8rem;
}
#recipe-export button {
  border: 1px solid #ff7043;
  border-radius: 0.25rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: transparent;
  color: #ff7043;
  cursor: pointer;
}
#recipe-export button:hover { background: rgba(255, 112, 67, 0.12); }
#recipe-export button:disabled { opacity: 0.45; cursor: not-allowed; }
#recipe-export .rex-dl { background: #ff7043; color: #fff; }
#recipe-export .rex-dl:hover { background: #f4511e; }
#recipe-export .rex-dl:disabled { background: #ff7043; color: #fff; }
#rex-count { font-size: 0.8rem; opacity: 0.7; }
.rex-group {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 0.4rem;
  margin: 0 0 0.8rem;
  padding: 0.4rem 0.9rem 0.6rem;
}
.rex-group legend { font-weight: 700; padding: 0 0.35rem; }
.rex-cat-all { font-weight: 700; }
.rex-item { display: inline-flex; align-items: center; gap: 0.35rem; margin: 0.25rem 1.2rem 0.25rem 0; }
#recipe-export label { cursor: pointer; }
#recipe-export input[type="checkbox"] { accent-color: #ff7043; }
#rex-status { font-size: 0.8rem; opacity: 0.75; min-height: 1.2em; margin: 0.4rem 0 0; }
[data-md-color-scheme="slate"] #recipe-export,
[data-md-color-scheme="slate"] .rex-group { border-color: rgba(255, 255, 255, 0.18); }
</style>

<div id="recipe-export">
  <noscript><p>Cet outil nécessite JavaScript.</p></noscript>
  <div class="rex-toolbar">
    <button type="button" id="rex-toggle-all">Tout sélectionner</button>
    <span id="rex-count"></span>
    <button type="button" class="rex-dl" id="rex-download-md">Markdown (.md)</button>
    <button type="button" class="rex-dl" id="rex-download-html">HTML autonome</button>
  </div>
  <div id="rex-list"></div>
  <p id="rex-status" role="status"></p>
</div>
