# Combats de strategies du dilemme du prisonier itéré en 2D

Un automate cellulaire qui organise dans une arène en 2D des combats de différentes strategies du dilemme du prisonier itéré.
[Une page wiki décrivant le projet](https://ressources.labomedia.org/max_oavl_2020)

L'UI est inspiré de ce projet de [jeu de la vie](https://gereleth.github.io/game-of-life/).

**[Essayez le ici!](https://mxbossard.github.io/game-of-life/public/)**

## Règles

### Les principes retenues sont les suivants
* Une cellule combat contre toutes les cellules de son entourage
* L'entourage d'une cellule est composé des 8 cellules qui l'entoure
* Les cellule essaye de donner naissance en priorité vers le centre de l'arene
* Si plusieurs cellule essaye de donner naissance au meme endroit, la cellule avec le meilleur score est autorisé ) s'y reproduire.

### Une cellule meurt si
* Elle est isolée (pas de cellule avec la meme strategie dans son entourage)
* Si un autre type de cellule cumule un meilleur score que son propre type de cellule (dans son entourage)
* Si son score est moins bon que 80% du score moyen dans son entourage

### Une cellule donne naissance si
* Il existe au moins 2 autres cellules avec la meme strategie dans son entourage ET si son score est superieur au score moyen dans son entourage