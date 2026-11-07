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
    tarte-poire-frangipane.fr.md / tarte-poire-frangipane.en.md
    ... (19 recettes, deux fichiers par recette)
```

Chaque page existe en deux versions : `page.fr.md` (par défaut, servie à la racine) et `page.en.md` (servie sous `/en/`). Le sélecteur de langue apparaît automatiquement dans l'en-tête du site.

## Catégories

- **Desserts** : tarte poire frangipane, placek, pancakes banane, confiture, brownie choco banane, banana bread avoine
- **Plats** : poulet curry, poulet pomme cidre, one pot mexicain chorizo riz, one pot poulet basquaise, croque monsieur béchamel, frittata pomme de terre ciboule, pomme de terre au four, dahl patate crémeux, caghuse, brandade de thon
- **Entrées & apéritif** : gougères au fromage, velouté butternut coco curry, compotée d'échalotes

## Ajouter une recette

1. Créer `docs/recettes/nom-de-la-recette.fr.md` et `docs/recettes/nom-de-la-recette.en.md`, avec un front matter YAML (title, category, temps, portions, tags) suivi du corps de la recette (sections numérotées, tableau d'ingrédients).
2. L'ajouter dans `nav:` de `mkdocs.yml` sous la bonne catégorie, avec le chemin sans suffixe de langue (ex. `recettes/nom-de-la-recette.md`).
3. Ajouter le titre anglais dans `nav_translations` (bloc `locale: en`), et un lien sur `docs/index.fr.md` et `docs/index.en.md`.
4. Push : l'action GitHub build et déploie le site automatiquement.

## Déploiement

Le workflow `.github/workflows/ci.yml` build le site et le déploie via GitHub Pages à chaque push sur `main`. Il nécessite, dans les réglages du repo : **Settings > Pages > Source : GitHub Actions**.

## Prévisualisation locale

```bash
pip install -r requirements.txt
mkdocs serve
```

Puis ouvrir http://localhost:8000 (le site anglais est servi sur http://localhost:8000/en/)
