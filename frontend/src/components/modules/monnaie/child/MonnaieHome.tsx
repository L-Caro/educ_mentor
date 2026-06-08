import { useNavigate } from 'react-router-dom';
import type { MonnaieExerciseType } from 'src/types';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';

const EXERCISE_TYPES: { key: MonnaieExerciseType; icon: string; label: string; description: string }[] = [
  { key: 'reconnaitre', icon: '👀', label: 'Reconnaître', description: 'Compte les pièces et les billets' },
  { key: 'total', icon: '🛒', label: 'Total d\'achat', description: 'Calcule le prix de tous les articles' },
  { key: 'rendre', icon: '💸', label: 'Rendre la monnaie', description: 'Calcule ce qu\'on te rend' },
];

export default function MonnaieHome() {
  const navigate = useNavigate();

  function handleSelectType(exerciseType: MonnaieExerciseType) {
    navigate('/module/monnaie/play', { state: { exerciseType } });
  }

  return (
    <PageContainer className="MonnaieHome">
      <div className="MonnaieHome__header">
        <div className="MonnaieHome__icon">💶</div>
        <h1 className="MonnaieHome__title">Monnaie</h1>
        <p className="MonnaieHome__subtitle">Quel exercice veux-tu faire ?</p>
      </div>

      <div className="MonnaieHome__grid">
        {EXERCISE_TYPES.map(({ key, icon, label, description }) => (
          <button
            key={key}
            className="MonnaieHome__typeCard"
            onClick={() => handleSelectType(key)}
          >
            <span className="MonnaieHome__typeIcon">{icon}</span>
            <span className="MonnaieHome__typeLabel">{label}</span>
            <span className="MonnaieHome__typeDesc">{description}</span>
          </button>
        ))}
      </div>
    </PageContainer>
  );
}
