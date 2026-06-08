import { useLocation, useNavigate } from 'react-router-dom';
import type { ImagierQuestion } from 'src/types';
import Button from 'src/components/common/Button';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';

interface ResultState {
  correctCount: number;
  total: number;
  results: { question: ImagierQuestion; wasCorrect: boolean }[];
}

export default function ImagierResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) { navigate('/module/imagier'); return null; }

  const { correctCount, total, results } = state;
  const percentage = Math.round((correctCount / total) * 100);
  const errors     = results.filter((r) => !r.wasCorrect);
  const emoji      = percentage === 100 ? '🏆' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪';

  return (
    <PageContainer className="ImagierResult">
      <div className="ImagierResult__score">
        <span className="ImagierResult__emoji">{emoji}</span>
        <p className="ImagierResult__fraction">{correctCount} / {total}</p>
        <p className="ImagierResult__pct">{percentage}% de bonnes réponses</p>
      </div>

      {errors.length > 0 && (
        <div className="ImagierResult__errors">
          <p className="ImagierResult__errorsTitle">À retravailler ({errors.length})</p>
          <ul className="ImagierResult__errorsList">
            {errors.map(({ question }) => {
              const correctLabel = question.choices.find((c) => c.id === question.correct_id)?.label;
              return (
                <li key={question.word_id} className="ImagierResult__errorItem">
                  <div className="ImagierResult__errorThumb">
                    {question.image_url
                      ? <img src={question.image_url} alt={question.prompt} />
                      : <span>❓</span>}
                  </div>
                  <div>
                    <p className="ImagierResult__errorFr">{question.prompt}</p>
                    {correctLabel && <p className="ImagierResult__errorEn">{correctLabel}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="ImagierResult__actions">
        <Button title="Rejouer 🔄" onClick={() => navigate(-1 as never)} />
        <button className="ImagierResult__btnOutline" onClick={() => navigate('/')}>
          Accueil
        </button>
      </div>
    </PageContainer>
  );
}
