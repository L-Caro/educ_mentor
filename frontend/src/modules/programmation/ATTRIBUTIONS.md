# Attributions

Le thème « Le village (pixels) » réutilise des sprites externes, vérifiés le 2026-09-15.
Les quatre autres thèmes sont dessinés dans `themes.tsx` et ne doivent rien à personne.

## Sprites (`assets/village/*.png`)

**Source :** [Kenney](https://kenney.nl), packs *RPG Urban Pack* et *Tiny Town*
**Licence :** CC0 1.0, domaine public. Texte exact du `License.txt` des deux paquets :
> "This content is free to use in personal, educational and commercial projects.
> Written permission not required, support us by crediting or donating (not mandatory)."

L'attribution n'est donc **pas obligatoire** : elle est écrite ici parce qu'il est utile de
savoir d'où vient un fichier qu'on n'a pas dessiné, et pour retrouver le pack le jour où il
faudra une tuile de plus.

| Fichier | Pack | Tuile d'origine |
| --- | --- | --- |
| `perso-nord.png` | RPG Urban Pack | `tile_0025` |
| `perso-est.png` | RPG Urban Pack | `tile_0026` |
| `perso-sud.png` | RPG Urban Pack | `tile_0024` |
| `perso-ouest.png` | RPG Urban Pack | `tile_0023` |
| `herbe.png` | Tiny Town | `tile_0000` |
| `herbe-2.png` | Tiny Town | `tile_0001` |
| `arbre.png` | Tiny Town | `tile_0027` |
| `champignon.png` | Tiny Town | `tile_0029` |
| `cible.png` | Tiny Town | `tile_0095` |

Fichiers repris tels quels, 16 × 16 pixels, sans retouche.

## Ce qui a guidé les choix, pour ne pas les refaire à l'envers

**Le personnage a QUATRE dessins, pas un seul tourné.** Il est vu de trois quarts : on voit
son visage quand il descend et son dos quand il monte. Le faire pivoter l'aurait couché sur
le côté. C'est pour cela que `Theme.personnage` est une fonction de la direction : les
thèmes dessinés, eux, sont vus strictement de dessus et se contentent d'une rotation.

**L'arbre est orange, et ce n'est pas un goût.** Le sapin vert du même jeu de tuiles
(`tile_0004`) se fondait dans l'herbe : il n'en restait que le contour sombre, qu'on prenait
pour une arche. Un obstacle doit se voir avant d'être compris.

**Le but est une cible, pas la maison.** `tile_0092` n'en montre que le toit, les maisons de
Kenney tenant sur plusieurs cases : posée seule, on la prend pour un rocher.

**Les sprites débordent de leur case.** Ils portent leur propre marge : à l'échelle exacte,
le personnage n'occupait que six dixièmes de sa case et paraissait perdu. D'où le `zoom` de
`image()` dans `themes.tsx`.
