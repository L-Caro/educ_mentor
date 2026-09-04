import Spinner from 'src/components/common/Spinner';
import {
  useGetGeometrieActiveShapesQuery,
  useGetGeometrieShapesQuery,
  useUpdateGeometrieActiveShapesMutation,
} from '../geometrie.api';
import type { ShapeFamille } from '../geometrie.type';

const FAMILLE_LABEL: Record<ShapeFamille, string> = {
  triangle: 'Triangles',
  quadrilatere: 'Quadrilatères',
  polygone: 'Polygones réguliers',
  cercle: 'Cercle',
  solide: 'Solides',
};

const FAMILLE_ORDER: ShapeFamille[] = [
  'triangle',
  'quadrilatere',
  'polygone',
  'cercle',
  'solide',
];

export default function GeometrieSettings() {
  const { data: shapes = [], isLoading: loadingShapes } = useGetGeometrieShapesQuery();
  const { data: active = [], isLoading: loadingActive } = useGetGeometrieActiveShapesQuery();
  const [updateActive, { isLoading: saving }] = useUpdateGeometrieActiveShapesMutation();

  if (loadingShapes || loadingActive) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = active.includes(key)
      ? active.filter((activeKey) => activeKey !== key)
      : [...active, key];
    if (next.length === 0) return; // toujours au moins une figure active
    updateActive(next);
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Les figures actives déterminent ce qui peut être demandé en partie. Active-les au
          fil du programme, pas besoin d'attendre que tout soit vu en classe pour commencer.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        {FAMILLE_ORDER.map((famille) => {
          const shapesDeLaFamille = shapes.filter((shape) => shape.famille === famille);
          if (shapesDeLaFamille.length === 0) return null;
          return (
            <div key={famille} className="AdminCard GameSettings__card">
              <p className="GameSettings__cardTitle">{FAMILLE_LABEL[famille]}</p>
              <div className="GameSettings__denominations">
                {shapesDeLaFamille.map((shape) => (
                  <button
                    key={shape.key}
                    type="button"
                    className={`GameSettings__denomination${
                      active.includes(shape.key) ? ' GameSettings__denomination--active' : ''
                    }`}
                    onClick={() => toggle(shape.key)}
                  >
                    {shape.nom}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
