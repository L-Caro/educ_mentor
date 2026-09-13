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
