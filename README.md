# Recip Miam

Bilingual (French / English) recipe collection, built with MkDocs Material and published on GitHub Pages.

Site: https://baversum.github.io/recip-miam/

## Structure

```
mkdocs.yml
requirements.txt
.github/workflows/ci.yml
docs/
  index.fr.md / index.en.md
  downloads.fr.md / downloads.en.md
  javascripts/recipe-export.js
  recettes/
    tarte-poire-frangipane.fr.md / tarte-poire-frangipane.en.md
    ... (19 recipes, two files per recipe)
```

Each page exists in two versions: `page.fr.md` (default language, served at the root) and `page.en.md` (served under `/en/`). The language switcher appears automatically in the site header.

## Categories

- **Desserts**: pear and frangipane tart, placek, banana pancakes, fruit jam, chocolate banana brownie, oat banana bread
- **Mains**: coconut chicken curry, chicken with apples and cider, Mexican chorizo rice one pot, chicken basquaise one pot, croque monsieur with béchamel, potato and spring onion frittata, oven-baked stuffed potatoes, creamy potato dhal, caghuse, tuna brandade gratin
- **Starters & appetizers**: cheese gougères, butternut and coconut velouté, shallot compote

## Adding a recipe

1. Create `docs/recettes/recipe-name.fr.md` and `docs/recettes/recipe-name.en.md`, with a YAML front matter (title, category, times, servings, tags) followed by the recipe body (numbered sections, ingredient table).
2. Add it to `nav:` in `mkdocs.yml` under the right category, using the language-suffix-free path (e.g. `recettes/recipe-name.md`).
3. Add the English title to `nav_translations` (under the `locale: en` block), and a link in `docs/index.fr.md` and `docs/index.en.md`.
4. Push: the GitHub Action builds and deploys the site automatically.

## Recipe export

The **Téléchargements / Downloads** page offers a client-side export tool: select recipes with checkboxes (one by one, by category, or all at once with the select all / deselect all button) and download a ZIP archive containing either the Markdown sources or standalone HTML pages. Everything runs in the browser: the ZIP is built locally (no external library), the Markdown sources are fetched from this repository on GitHub, and the recipe list is read from the site navigation at runtime, so the tool requires no maintenance when recipes are added.

## Deployment

The `.github/workflows/ci.yml` workflow builds the site and deploys it through GitHub Pages on every push to `main`. It requires, in the repository settings: **Settings > Pages > Source: GitHub Actions**.

## Local preview

```bash
pip install -r requirements.txt
mkdocs serve
```

Then open http://localhost:8000 (the English site is served on http://localhost:8000/en/)
