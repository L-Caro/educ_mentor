import { useLocation, useNavigate } from 'react-router-dom';
import type { ImagierQuestion } from 'src/types';
import GameResultPage from 'src/components/common/Game/GameResultPage.tsx';

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
  const errors = results.filter((result) => !result.wasCorrect);

  return (
    <GameResultPage
      correctCount={correctCount}
      total={total}
      onReplay={() => navigate(-1 as never)}
      onHome={() => navigate('/')}
      withStars={false}
      errorCount={errors.length}
    >
      {errors.map(({ question }) => {
        const correctLabel = question.choices.find((choice) => choice.id === question.correct_id)?.label;
        return (
          <li key={question.word_id} className="GameResult__errorItem">
            <div className="GameResult__errorThumb">
              {question.image_url
                ? <img src={question.image_url} alt={question.prompt} />
                : <span>❓</span>}
            </div>
            <div>
              <p className="GameResult__errorFr">{question.prompt}</p>
              {correctLabel && <p className="GameResult__errorEn">{correctLabel}</p>}
            </div>
          </li>
        );
      })}
    </GameResultPage>
  );
}
