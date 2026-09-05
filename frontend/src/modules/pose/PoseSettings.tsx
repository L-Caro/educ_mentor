import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import {
  useGetPoseActiveOperationsQuery,
  useGetPoseCatalogueQuery,
  useUpdatePoseActiveOperationsMutation,
} from './pose.api.ts';
import './pose.scss';

const METHODES = [
  {
    value: 'compensation',
    titre: 'Par compensation',
    exemple: 'on ajoute 10 en haut et 1 en bas',
    detail: "7 − 8 impossible : le 7 devient 17, et le chiffre des dizaines du bas augmente de 1.",
  },
  {
    value: 'cassage',
    titre: 'Par cassage',
    exemple: 'on emprunte au chiffre suivant',
    detail: '7 − 8 impossible : on prend une dizaine au chiffre de gauche, qui est barré et diminué de 1.',
  },
] as const;

/** Les opérations ouvertes. La multiplication posée est là mais fermée : on l'ouvre quand
 * la classe l'a vue, comme les figures de la géométrie.
 *
 * La division posée n'y figure pas : sa potence est une autre géométrie — quotient
 * construit de gauche à droite, abaissements, reste — que la grille en colonnes ne sait
 * pas rendre. La proposer sans savoir la jouer ouvrirait une case muette. */
function OperationsActives() {
  const { data: catalogue = [], isLoading: loadingCatalogue } =
    useGetPoseCatalogueQuery();
  const { data: actives = [], isLoading: loadingActives } =
    useGetPoseActiveOperationsQuery();
  const [updateActives, { isLoading: saving }] =
    useUpdatePoseActiveOperationsMutation();

  if (loadingCatalogue || loadingActives) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = actives.includes(key)
      ? actives.filter((k) => k !== key)
      : [...actives, key];
    if (next.length === 0) return; // toujours au moins une opération jouable
    updateActives(next);
  }

  return (
    <div className="AdminCard GameSettings__card">
      <div className="GameSettings__header">
        <p className="GameSettings__cardTitle">Opérations posées</p>
        {saving && <Spinner size="xs" />}
      </div>
      <p className="GameSettings__hint">
        La classe indiquée dit quand ouvrir — rien n&rsquo;empêche d&rsquo;ouvrir plus
        tôt. La multiplication demande d&rsquo;écrire les produits partiels et leur
        décalage : c&rsquo;est là qu&rsquo;elle se joue.
      </p>
      <div className="GameSettings__denominations">
        {catalogue.map((operation) => (
          <button
            key={operation.key}
            type="button"
            className={`GameSettings__denomination${
              actives.includes(operation.key)
                ? ' GameSettings__denomination--active'
                : ''
            }`}
            onClick={() => toggle(operation.key)}
            title={operation.exemple}
          >
            {operation.label}
            <span className="GameSettings__niveau">
              {operation.niveau.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PoseSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const methode = settings.pose_subtraction_method ?? 'compensation';
  const digits = parseInt(settings.pose_digits ?? '3', 10);

  return (
    <div className="GameSettings">
      <OperationsActives />

      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          La méthode et la taille des nombres dépendent de la classe, pas de la partie :
          elles se règlent ici et non avant chaque jeu.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Méthode de soustraction</p>
          <p className="GameSettings__hint">
            Choisir celle qu'enseigne la maîtresse. Les deux donnent le même résultat, mais
            ne s'écrivent pas pareil : en apprendre une autre que la sienne la desservirait.
          </p>

          <div className="PoseSettings__methods">
            {METHODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`PoseSettings__method${methode === m.value ? ' PoseSettings__method--active' : ''}`}
                onClick={() => updateSetting({ key: 'pose_subtraction_method', value: m.value })}
              >
                <span className="PoseSettings__methodTitle">{m.titre}</span>
                <span className="PoseSettings__methodExemple">{m.exemple}</span>
                <span className="PoseSettings__methodDetail">{m.detail}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Nombre de chiffres</p>
          <p className="GameSettings__hint">
            Taille des opérandes. Au-delà de six chiffres, la grille devient large sur une
            tablette en portrait.
          </p>

          <div className="GameSettings__rangeRow">
            <label className="GameSettings__rangeLabel" htmlFor="pose-digits">Chiffres</label>
            <input
              id="pose-digits"
              type="range"
              min={2}
              max={10}
              step={1}
              value={digits}
              onChange={(e) => updateSetting({ key: 'pose_digits', value: e.target.value })}
              className="GameSettings__range"
            />
            <span className="GameSettings__rangeValue">{digits}</span>
          </div>

          <p className="GameSettings__hint">
            Exemple : {'9'.repeat(digits)} + {'9'.repeat(digits)}
          </p>
        </div>
      </div>
    </div>
  );
}
