# Attributions

Ce module réutilise deux sources externes, vérifiées le 2026-09-13.

## Tuiles (`tuiles-svg/*.svg`)

**Source :** [FluffyStuff/riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles)
**Licence :** Domaine public (CC0). Texte exact du LICENSE.md du dépôt :
> "This work is in the public domain."

Fichiers repris tels quels (34 faces : Man1-9, Pin1-9, Sou1-9, Ton/Nan/Shaa/Pei, Haku/Hatsu/Chun), sans les variantes "Dora" (cinq rouge) ni les tuiles bonus (fleurs/saisons, absentes de ce set).

**Exception : `Haku.svg` (dragon blanc).** Le fichier existe mais son calque est vide
(`<g ... transform="..." />`, sans le moindre trait a l'interieur) dans les deux variantes
du depot d'origine (Regular et Black), verifie directement dans les fichiers. Le rendu de
cette face n'utilise donc pas l'image : `TuileFaceSvg.tsx` dessine un simple cadre CSS a
la place (convention reelle de cette tuile dans plusieurs jeux physiques).

## Dispositions du mode Difficile (`formes/*.json`)

**Source :** [danhquach/mahjongsolitaire](https://github.com/danhquach/mahjongsolitaire)
**Licence :** MIT. Copyright (c) 2026 Daniel Quach.

Fichiers repris tels quels (`data/layouts/*.json`) : turtle_classic, pyramid, fortress, spider, butterfly, bridge, cat, moon_gate, terrace, windmill. Format documenté dans `docs/layouts.md` du dépôt d'origine (coordonnées en demi-unités, footprint 2x2 par tuile, support total ou partagé entre deux tuiles de l'étage du dessous).

Ces dix dispositions sont **volontairement compactes et en portrait** : au plus 9 colonnes
de large, 10 rangées de haut, empilées sur 4 à 5 étages vers le centre. C'est une décision
documentée du dépôt d'origine (`docs/decisions/0015-compact-portrait-layouts-and-band-pools.md`,
2026-09-01) : leurs dispositions précédentes allaient jusqu'à 16 colonnes, et le rendu
mettant tout le plateau à l'échelle de l'écran, une largeur pareille réduisait les tuiles à
23 px sur un téléphone, faces illisibles et touches imprécises. Ne pas « corriger » ce
profil en le croyant accidentel : il est le résultat d'un arbitrage, et le remplacer par
des dispositions larges classiques ramènerait exactement le défaut qu'il évite.

## Géométrie du rendu (`mahjong.geometrie.ts`)

**Source :** le même dépôt, `ui/src/geometry.ts` et `ui/src/depth.ts`.
**Licence :** MIT (voir ci-dessus).

Les constantes de projection et les quatre indices de relief viennent de là : demi-unités
de 32 x 42 px, décalage d'étage de 11 px vers le haut et la gauche, épaisseur du côté égale
à ce décalage, assombrissement de 1,5 % par étage sur la face et de 3 % sur l'encre. Le
code est réécrit, pas copié : leur rendu est un canevas 2D, le nôtre du DOM et du CSS,
mais les valeurs sont les leurs, et ce sont leurs dispositions : les reprendre garantit que
les tuiles tombent là où la disposition les attend.
