import Button from 'src/components/common/Button.tsx';
import Spinner from 'src/components/common/Spinner.tsx';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';

interface GameStateViewProps {
  loading?: boolean;
  errorMessage?: string;   // affiché quand on n'est pas en chargement
  onBack: () => void;
}

/** Écrans de chargement et d'erreur partagés par les modules de jeu. */
export default function GameStateView({ loading = false, errorMessage, onBack }: GameStateViewProps) {
  return (
    <PageContainer className="GameStateView">
      {loading ? (
        <Spinner />
      ) : (
        <>
          <p className="GameStateView__msg">{errorMessage || 'Aucune question disponible.'}</p>
          <Button title="← Retour" onClick={onBack} />
        </>
      )}
    </PageContainer>
  );
}
