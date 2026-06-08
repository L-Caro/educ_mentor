import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSettingsMap } from 'src/api/settings.api';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';

function formatTimer(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${s}s`;
}

export default function CalculHome() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettingsMap().then(setSettings).finally(() => setLoading(false));
  }, []);

  const minValue = parseInt(settings.calcul_min_value ?? '0', 10);
  const maxValue = parseInt(settings.calcul_max_value ?? '20', 10);
  const timerSeconds = parseInt(settings.calcul_timer_seconds ?? '0', 10);
  const questionsPerSession = parseInt(settings.calcul_questions_per_session ?? '10', 10);

  const rangeLabel = minValue > 0 ? `de ${minValue} à ${maxValue}` : `jusqu'à ${maxValue}`;
  const countLabel = questionsPerSession === 0 ? 'Questions illimitées' : `${questionsPerSession} questions`;

  if (loading) {
    return (
      <PageContainer className="CalculHome">
        <div className="CalculHome__loading"><Spinner /></div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="CalculHome">
      <div className="CalculHome__card">
        <div className="CalculHome__icon">🧮</div>
        <h1 className="CalculHome__title">Calcul Mental</h1>
        <p className="CalculHome__subtitle">Trouve le nombre manquant dans l'opération</p>

        <div className="CalculHome__infos">
          <div className="CalculHome__info">
            <span className="CalculHome__infoIcon">🎯</span>
            <span className="CalculHome__infoLabel">Nombres {rangeLabel}</span>
          </div>
          <div className="CalculHome__info">
            <span className="CalculHome__infoIcon">📝</span>
            <span className="CalculHome__infoLabel">{countLabel}</span>
          </div>
          {timerSeconds > 0 && (
            <div className="CalculHome__info">
              <span className="CalculHome__infoIcon">⏱</span>
              <span className="CalculHome__infoLabel">{formatTimer(timerSeconds)} par opération</span>
            </div>
          )}
        </div>

        <Button
          className="CalculHome__startBtn"
          title="Jouer"
          onClick={() => navigate('/module/calcul-mental/play')}
        />
      </div>
    </PageContainer>
  );
}
