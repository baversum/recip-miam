# Recip Miam

Carnet de recettes bilingue (français / anglais), construit avec MkDocs Material et publié sur GitHub Pages.

Site : https://baversum.github.io/recip-miam/

## Structure

```
mkdocs.yml
requirements.txt
.github/workflows/ci.yml
docs/
  index.fr.md / index.en.md
  recettes/
    tarte-poire-frangipane.fr.md
    tarte-poire-frangipane.en.md
```

Chaque page existe en deux versions : `page.fr.md` (par défaut, servie à la racine) et `page.en.md` (servie sous `/en/`). Le sélecteur de langue apparaît automatiquement dans l'en-tête du site.

## Ajouter une recette

1. Créer `docs/recettes/nom-de-la-recette.fr.md` et `docs/recettes/nom-de-la-recette.en.md`, avec un front matter YAML (title, category, temps, portions, tags) suivi du corps de la recette.
2. L'ajouter dans `nav:` de `mkdocs.yml` sous la bonne catégorie, avec le chemin sans suffixe de langue (ex. `recettes/nom-de-la-recette.md`).
3. Optionnel : ajouter un lien sur `docs/index.fr.md` et `docs/index.en.md`, et une entrée dans `nav_translations` pour le titre anglais dans la navigation.
4. Push : l'action GitHub build et déploie le site automatiquement.

## Prévisualisation locale

```bash
pip install -r requirements.txt
mkdocs serve
```

Puis ouvrir http://localhost:8000
