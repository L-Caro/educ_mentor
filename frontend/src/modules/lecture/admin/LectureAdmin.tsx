import { useState } from 'react';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import {
  useGetAdminTextsQuery,
  useUpdateTextMutation,
  useDeleteTextMutation,
  useGetAdminQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useCreateTextMutation,
} from '../lecture.api';
import type { LectureAdminQuestion, LectureAdminText } from '../lecture.type';
import '../lecture.scss';

const MAX_DISTRACTORS = 5;

// ─── Import JSON ───────────────────────────────────────────────────────────────

interface JsonImportData {
  titre: string;
  contenu: string;
  questions: { question: string; answer: string; distractors: string[]; excerpt?: string }[];
}

function parseImport(raw: string): JsonImportData {
  const data = JSON.parse(raw) as Record<string, unknown>;
  if (typeof data.titre !== 'string' || !data.titre.trim()) throw new Error('Champ "titre" manquant ou vide');
  if (typeof data.contenu !== 'string' || !data.contenu.trim()) throw new Error('Champ "contenu" manquant ou vide');
  if (!Array.isArray(data.questions) || data.questions.length === 0) throw new Error('Champ "questions" manquant ou vide');
  for (const [i, q] of (data.questions as unknown[]).entries()) {
    const qObj = q as Record<string, unknown>;
    if (typeof qObj.question !== 'string' || !qObj.question.trim()) throw new Error(`Question ${i + 1} : "question" manquante`);
    if (typeof qObj.answer !== 'string' || !qObj.answer.trim()) throw new Error(`Question ${i + 1} : "answer" manquant`);
    if (!Array.isArray(qObj.distractors) || qObj.distractors.length === 0) throw new Error(`Question ${i + 1} : "distractors" manquant ou vide`);
  }
  return data as unknown as JsonImportData;
}

function ImportForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [raw, setRaw]       = useState('');
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createText]     = useCreateTextMutation();
  const [createQuestion] = useCreateQuestionMutation();

  async function handleImport() {
    setError(null);
    let data: JsonImportData;
    try {
      data = parseImport(raw.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON invalide');
      return;
    }

    setLoading(true);
    try {
      const text = await createText({ titre: data.titre, contenu: data.contenu }).unwrap();
      await Promise.all(
        data.questions.map((q, i) =>
          createQuestion({
            textId:     text.id,
            question:   q.question,
            answer:     q.answer,
            distractors: q.distractors,
            excerpt:    q.excerpt,
            ordre:      i,
          }).unwrap(),
        ),
      );
      onDone();
    } catch {
      setError('Erreur lors de la création — vérifiez que le serveur est démarré.');
      setLoading(false);
    }
  }

  return (
    <div className="AdminCard">
      <div className="LectureAdmin__form">
        <textarea
          className="AdminInput"
          style={{ resize: 'vertical', minHeight: '16rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
          placeholder={'{\n  "titre": "...",\n  "contenu": "...",\n  "questions": [...]\n}'}
          value={raw}
          onChange={(e) => { setRaw(e.target.value); setError(null); }}
          disabled={loading}
          spellCheck={false}
        />
        {error && <p className="LectureAdmin__importError">{error}</p>}
        <div className="LectureAdmin__formActions">
          <Button size="sm" variant="primary" onClick={handleImport} disabled={loading || !raw.trim()}>
            {loading ? 'Création…' : 'Importer'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Formulaire question ───────────────────────────────────────────────────────

interface QuestionDraft {
  question: string;
  answer: string;
  distractors: string[];
  excerpt: string;
}

function emptyDraft(): QuestionDraft {
  return { question: '', answer: '', distractors: Array(MAX_DISTRACTORS).fill(''), excerpt: '' };
}

function draftFromQuestion(q: LectureAdminQuestion): QuestionDraft {
  const distractors = [...q.distractors];
  while (distractors.length < MAX_DISTRACTORS) distractors.push('');
  return { question: q.question, answer: q.answer, distractors, excerpt: q.excerpt ?? '' };
}

function QuestionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: QuestionDraft;
  onSave: (draft: QuestionDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<QuestionDraft>(initial ?? emptyDraft());

  function setDistractor(i: number, value: string) {
    const next = [...draft.distractors];
    next[i] = value;
    setDraft({ ...draft, distractors: next });
  }

  function handleSave() {
    if (!draft.question.trim() || !draft.answer.trim()) return;
    onSave({ ...draft, distractors: draft.distractors.map((d) => d.trim()).filter(Boolean) });
  }

  return (
    <div className="LectureAdmin__form">
      <textarea
        className="AdminInput"
        style={{ resize: 'vertical', minHeight: '4rem', fontFamily: 'inherit' }}
        placeholder="Question"
        value={draft.question}
        onChange={(e) => setDraft({ ...draft, question: e.target.value })}
      />
      <input
        className="AdminInput"
        placeholder="Bonne réponse"
        value={draft.answer}
        onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
      />
      <p className="LectureAdmin__formLabel">
        Mauvaises réponses — 1 min (facile), 3 (moyen), 5 (difficile)
      </p>
      {Array.from({ length: MAX_DISTRACTORS }, (_, i) => (
        <input
          key={i}
          className="AdminInput"
          placeholder={`Mauvaise réponse ${i + 1}`}
          value={draft.distractors[i]}
          onChange={(e) => setDistractor(i, e.target.value)}
        />
      ))}
      <input
        className="AdminInput"
        placeholder="Extrait surligné (facile) — copier la phrase exacte du texte, optionnel"
        value={draft.excerpt}
        onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
      />
      <div className="LectureAdmin__formActions">
        <Button size="sm" variant="primary" onClick={handleSave}>Enregistrer</Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

// ─── Liste de questions d'un texte ────────────────────────────────────────────

function QuestionList({ textId }: { textId: number }) {
  const { data: questions = [], isLoading } = useGetAdminQuestionsQuery(textId);
  const [createQuestion] = useCreateQuestionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();
  const [adding, setAdding]     = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <Spinner size="sm" />;

  async function handleCreate(draft: QuestionDraft) {
    await createQuestion({ textId, ...draft, ordre: questions.length });
    setAdding(false);
  }

  async function handleUpdate(q: LectureAdminQuestion, draft: QuestionDraft) {
    await updateQuestion({ id: q.id, textId, ...draft });
    setEditingId(null);
  }

  return (
    <div className="LectureAdmin__questions">
      {questions.map((q) =>
        editingId === q.id ? (
          <QuestionForm
            key={q.id}
            initial={draftFromQuestion(q)}
            onSave={(draft) => handleUpdate(q, draft)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={q.id} className="LectureAdmin__questionItem">
            <p className="LectureAdmin__questionText">{q.question}</p>
            <p className="LectureAdmin__questionMeta">
              ✓ {q.answer}
              {' · '}
              {q.distractors.length} mauvaise{q.distractors.length > 1 ? 's' : ''} réponse{q.distractors.length > 1 ? 's' : ''}
              {q.excerpt ? ' · extrait ✦' : ''}
            </p>
            <div className="LectureAdmin__questionActions">
              <Button size="sm" variant="outline" onClick={() => setEditingId(q.id)}>Modifier</Button>
              <Button size="sm" variant="danger-ghost" onClick={() => deleteQuestion({ id: q.id, textId })}>Supprimer</Button>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <QuestionForm onSave={handleCreate} onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" className="LectureAdmin__addQuestion" onClick={() => setAdding(true)}>
          + Ajouter une question
        </button>
      )}
    </div>
  );
}

// ─── Formulaire texte ─────────────────────────────────────────────────────────

function TextForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { titre: string; contenu: string };
  onSave: (data: { titre: string; contenu: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial ?? { titre: '', contenu: '' });

  return (
    <div className="LectureAdmin__form">
      <input
        className="AdminInput"
        placeholder="Titre du texte"
        value={form.titre}
        onChange={(e) => setForm({ ...form, titre: e.target.value })}
      />
      <textarea
        className="AdminInput"
        style={{ resize: 'vertical', minHeight: '14rem', fontFamily: 'inherit' }}
        placeholder="Contenu du texte"
        value={form.contenu}
        onChange={(e) => setForm({ ...form, contenu: e.target.value })}
      />
      <div className="LectureAdmin__formActions">
        <Button
          size="sm"
          variant="primary"
          onClick={() => { if (form.titre.trim() && form.contenu.trim()) onSave(form); }}
        >
          Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

type TopMode = 'none' | 'import';

export default function LectureAdmin() {
  const { data: texts = [], isLoading } = useGetAdminTextsQuery();
  const [updateText] = useUpdateTextMutation();
  const [deleteText] = useDeleteTextMutation();

  const [topMode, setTopMode]         = useState<TopMode>('none');
  const [editingText, setEditingText] = useState<LectureAdminText | null>(null);
  const [openTextId, setOpenTextId]   = useState<number | null>(null);

  if (isLoading) return <Spinner size="sm" />;

  async function handleUpdateText(id: number, data: { titre: string; contenu: string }) {
    await updateText({ id, ...data });
    setEditingText(null);
  }

  return (
    <div className="LectureAdmin">
      <div className="LectureAdmin__header">
        <h2 className="LectureAdmin__title">Textes & Questions</h2>
        {topMode === 'none' && (
          <div className="LectureAdmin__cardActions">
            <Button size="sm" variant="primary" onClick={() => setTopMode('import')}>
              Importer JSON
            </Button>
          </div>
        )}
      </div>

      {topMode === 'import' && (
        <ImportForm onDone={() => setTopMode('none')} onCancel={() => setTopMode('none')} />
      )}

      {texts.map((text) => (
        <div key={text.id} className="AdminCard">
          <div className="LectureAdmin__cardHeader">
            <div className="LectureAdmin__textMeta">
              <span className={`AdminBadge ${text.actif ? 'AdminBadge--success' : 'AdminBadge--neutral'}`}>
                {text.actif ? 'Actif' : 'Inactif'}
              </span>
              <p className="LectureAdmin__textTitle">{text.titre}</p>
              <span className="LectureAdmin__textCount">
                {text.question_count} question{text.question_count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="LectureAdmin__cardActions">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateText({ id: text.id, actif: !text.actif })}
              >
                {text.actif ? 'Désactiver' : 'Activer'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingText(editingText?.id === text.id ? null : text)}>
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOpenTextId(openTextId === text.id ? null : text.id)}
              >
                {openTextId === text.id ? 'Fermer' : 'Questions'}
              </Button>
              <Button size="sm" variant="danger-ghost" onClick={() => deleteText(text.id)}>
                Supprimer
              </Button>
            </div>
          </div>

          {editingText?.id === text.id && (
            <TextForm
              initial={{ titre: text.titre, contenu: text.contenu }}
              onSave={(data) => handleUpdateText(text.id, data)}
              onCancel={() => setEditingText(null)}
            />
          )}

          {openTextId === text.id && <QuestionList textId={text.id} />}
        </div>
      ))}

      {texts.length === 0 && topMode === 'none' && (
        <p className="LectureAdmin__empty">Aucun texte pour l'instant. Importez un JSON.</p>
      )}
    </div>
  );
}
