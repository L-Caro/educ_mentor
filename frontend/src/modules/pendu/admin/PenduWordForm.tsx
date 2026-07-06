import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PenduWord } from '../pendu.type.ts';
import {
  useGetPenduWordsQuery,
  useCreatePenduWordMutation,
  useUpdatePenduWordMutation,
} from '../pendu.api.ts';
import Button from 'src/components/common/Button.tsx';
import Spinner from 'src/components/common/Spinner.tsx';
import '../_penduAdmin.scss';

export default function PenduWordForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();

  const { data: allWords } = useGetPenduWordsQuery(undefined, { skip: isNew });
  const [createWord] = useCreatePenduWordMutation();
  const [updateWord] = useUpdatePenduWordMutation();

  const [word, setWord] = useState<Partial<PenduWord>>({ is_active: false, difficulty: 'normal' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNew && allWords) {
      const found = allWords.find((w) => w.id === id);
      if (found) setWord(found);
    }
  }, [allWords, id, isNew]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.word) return;
    setIsSaving(true);
    try {
      if (isNew) {
        await createWord({
          word: word.word,
          difficulty: word.difficulty ?? 'normal',
          is_active: word.is_active ?? false,
        }).unwrap();
      } else {
        await updateWord({ id: id!, ...word }).unwrap();
      }
      navigate('/admin/pendu');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="PenduWordForm">
      <h2 className="PenduWordForm__title">
        {isNew ? 'Nouveau mot' : `Éditer : ${word.word}`}
      </h2>

      <form onSubmit={handleSubmit} className="AdminCard PenduWordForm__card">
        <div className="PenduWordForm__field">
          <label className="PenduWordForm__label">Mot *</label>
          <input
            value={word.word ?? ''}
            onChange={(e) => setWord((prev) => ({ ...prev, word: e.target.value.toUpperCase() }))}
            required
            placeholder="Ex: MAISON"
            className="PenduWordForm__input"
          />
        </div>

        <div className="PenduWordForm__field">
          <label className="PenduWordForm__label">Difficulté</label>
          <select
            value={word.difficulty ?? 'normal'}
            onChange={(e) => setWord((prev) => ({ ...prev, difficulty: e.target.value }))}
            className="PenduWordForm__select"
          >
            <option value="easy">Facile</option>
            <option value="normal">Normal</option>
            <option value="hard">Difficile</option>
          </select>
        </div>

        <label className="PenduWordForm__checkRow">
          <input
            type="checkbox"
            checked={word.is_active ?? false}
            onChange={(e) => setWord((prev) => ({ ...prev, is_active: e.target.checked }))}
          />
          <span>Activer (visible dans le jeu)</span>
        </label>

        <div className="PenduWordForm__actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/admin/pendu')}
          >
            Annuler
          </Button>
          <Button
            size="sm"
            variant="primary"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? <Spinner size="xs" /> : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  );
}