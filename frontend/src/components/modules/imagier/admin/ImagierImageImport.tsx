import { useRef, useState } from 'react';
import { createWord, uploadWordImage } from 'src/api/module/imagier.api.ts';
import Spinner from 'src/components/common/Spinner';
import { lookupWord, filenameToFr } from 'src/components/modules/imagier/constants/lookupWord';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'pending' | 'saving' | 'done' | 'error';

interface WordDraft {
  uid: string;
  file: File;
  preview: string;
  fr: string;
  en: string;
  category: string;
  subcategory: string;
  is_active: boolean;
  selected: boolean;
  status: Status;
  errorMsg?: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function fileToWordDraft(file: File): WordDraft {
  const fr = filenameToFr(file.name);
  const match = lookupWord(fr);
  return {
    uid: `${file.name}-${Math.random()}`,
    file,
    preview: URL.createObjectURL(file),
    fr,
    en: match?.en ?? '',
    category: match?.subcategory ?? '',
    subcategory: match?.category ?? '',
    is_active: true,
    selected: false,
    status: 'pending',
  };
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  draft: WordDraft;
  onChange: (patch: Partial<WordDraft>) => void;
  onRemove: () => void;
}

function WordDraftCard({ draft, onChange, onRemove }: CardProps) {
  const isDone    = draft.status === 'done';
  const isSaving  = draft.status === 'saving';
  const isError   = draft.status === 'error';
  const disabled  = isDone || isSaving;

  const classes = [
    'WordDraftCard',
    draft.selected  ? 'WordDraftCard--selected' : '',
    isDone          ? 'WordDraftCard--done'      : '',
    isError         ? 'WordDraftCard--error'     : '',
    isSaving        ? 'WordDraftCard--saving'    : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <div className="WordDraftCard__top">
        {!isDone && (
          <input
            type="checkbox"
            className="WordDraftCard__checkbox"
            checked={draft.selected}
            onChange={(e) => onChange({ selected: e.target.checked })}
          />
        )}

        <div className="WordDraftCard__preview">
          <img src={draft.preview} alt={draft.fr} />
        </div>

        <div className="WordDraftCard__fields">
          <div className="WordDraftCard__row">
            <div className="WordDraftCard__field">
              <span className="WordDraftCard__label">FR *</span>
              <input
                value={draft.fr}
                onChange={(e) => onChange({ fr: e.target.value })}
                disabled={disabled}
                className="WordDraftCard__input"
                placeholder="chat"
              />
            </div>
            <div className="WordDraftCard__field">
              <span className="WordDraftCard__label">EN</span>
              <input
                value={draft.en}
                onChange={(e) => onChange({ en: e.target.value })}
                disabled={disabled}
                className="WordDraftCard__input"
                placeholder="cat"
              />
            </div>
          </div>
          <div className="WordDraftCard__row">
            <div className="WordDraftCard__field">
              <span className="WordDraftCard__label">Catégorie *</span>
              <input
                value={draft.category}
                onChange={(e) => onChange({ category: e.target.value })}
                disabled={disabled}
                className="WordDraftCard__input"
                placeholder="animaux"
              />
            </div>
            <div className="WordDraftCard__field">
              <span className="WordDraftCard__label">Sous-cat.</span>
              <input
                value={draft.subcategory}
                onChange={(e) => onChange({ subcategory: e.target.value })}
                disabled={disabled}
                className="WordDraftCard__input"
                placeholder="mammiferes"
              />
            </div>
          </div>
        </div>

        <button className="WordDraftCard__remove" onClick={onRemove} title="Retirer">
          ×
        </button>
      </div>

      <div className="WordDraftCard__bottom">
        {!isDone && (
          <label className="WordDraftCard__activeToggle">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => onChange({ is_active: e.target.checked })}
              disabled={disabled}
            />
            <span>Activer</span>
          </label>
        )}

        {isSaving && <Spinner size="xs" />}
        {isDone   && <span className="WordDraftCard__status WordDraftCard__status--done">✓ Enregistré</span>}
        {isError  && <span className="WordDraftCard__status WordDraftCard__status--error">{draft.errorMsg}</span>}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ImagierImageImport() {
  const [drafts, setDrafts]     = useState<WordDraft[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter             = useRef(0);
  const fileRef                 = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  function addFiles(files: FileList | File[]) {
    const newDrafts = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map(fileToWordDraft);
    if (newDrafts.length > 0) setDrafts((prev) => [...prev, ...newDrafts]);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setDragOver(true);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  // ── Draft mutations ────────────────────────────────────────────────────────

  function updateDraft(uid: string, patch: Partial<WordDraft>) {
    setDrafts((prev) => prev.map((d) => d.uid === uid ? { ...d, ...patch } : d));
  }

  function removeDraft(uid: string) {
    setDrafts((prev) => {
      const target = prev.find((d) => d.uid === uid);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((d) => d.uid !== uid);
    });
  }

  function removeSelected() {
    setDrafts((prev) => {
      prev.filter((d) => d.selected).forEach((d) => URL.revokeObjectURL(d.preview));
      return prev.filter((d) => !d.selected);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setDrafts((prev) => prev.map((d) =>
      d.status === 'pending' ? { ...d, selected: checked } : d
    ));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function saveAll() {
    const pending = drafts.filter((d) => d.status === 'pending');
    for (const draft of pending) {
      if (!draft.fr.trim() || !draft.category.trim()) {
        updateDraft(draft.uid, { status: 'error', errorMsg: 'FR et catégorie requis' });
        continue;
      }
      updateDraft(draft.uid, { status: 'saving' });
      try {
        const saved = await createWord({
          fr: draft.fr.trim(),
          en: draft.en.trim(),
          category: draft.category.trim(),
          subcategory: draft.subcategory.trim() || undefined,
          is_active: draft.is_active,
        });
        await uploadWordImage(saved.id, draft.file);
        updateDraft(draft.uid, { status: 'done' });
      } catch {
        updateDraft(draft.uid, { status: 'error', errorMsg: 'Erreur serveur' });
      }
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  const pendingDrafts  = drafts.filter((d) => d.status === 'pending');
  const selectedCount  = drafts.filter((d) => d.selected).length;
  const allSelected    = pendingDrafts.length > 0 && pendingDrafts.every((d) => d.selected);

  // ── Empty state ──────────────────────────────────────────────────────────

  if (drafts.length === 0) {
    return (
      <div
        className={`ImagierImageImport__dropzone${dragOver ? ' ImagierImageImport__dropzone--over' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <span className="ImagierImageImport__dropIcon">🖼️</span>
        <p className="ImagierImageImport__dropLabel">Glissez vos images ici</p>
        <p className="ImagierImageImport__dropSub">ou cliquez pour sélectionner</p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  // ── With content ──────────────────────────────────────────────────────────

  return (
    <div
      className="ImagierImageImport"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="ImagierImageImport__overlay">
          Déposez les images ici
        </div>
      )}

      <div className="ImagierImageImport__toolbar">
        <div className="ImagierImageImport__toolbarLeft">
          <label className="ImagierImageImport__selectAll">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
            />
            <span>Tout sélectionner</span>
          </label>
          {selectedCount > 0 && (
            <button onClick={removeSelected} className="AdminBtn AdminBtn--danger-ghost">
              🗑 Supprimer ({selectedCount})
            </button>
          )}
        </div>
        <div className="ImagierImageImport__toolbarRight">
          <button onClick={() => fileRef.current?.click()} className="AdminBtn AdminBtn--outline">
            + Ajouter des images
          </button>
          <button
            onClick={saveAll}
            disabled={pendingDrafts.length === 0}
            className="AdminBtn AdminBtn--primary"
          >
            ✓ Enregistrer ({pendingDrafts.length})
          </button>
        </div>
      </div>

      <div className="ImagierImageImport__grid">
        {drafts.map((draft) => (
          <WordDraftCard
            key={draft.uid}
            draft={draft}
            onChange={(patch) => updateDraft(draft.uid, patch)}
            onRemove={() => removeDraft(draft.uid)}
          />
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />
    </div>
  );
}
