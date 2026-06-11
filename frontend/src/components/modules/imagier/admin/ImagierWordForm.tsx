import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetImagierWordsQuery,
  useCreateImagierWordMutation,
  useUpdateImagierWordMutation,
  useUploadImagierWordImageMutation,
} from '../imagier.api';
import { useGetImagierCategoriesQuery } from 'src/store/api/sharedApi';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import type { ImagierWord } from 'src/types';

export default function ImagierWordForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'nouveau';
  const navigate = useNavigate();

  const { data: categoryList = [] } = useGetImagierCategoriesQuery();
  const { data: allWords } = useGetImagierWordsQuery(undefined, { skip: isNew });
  const [createWord] = useCreateImagierWordMutation();
  const [updateWord] = useUpdateImagierWordMutation();
  const [uploadImage] = useUploadImagierWordImageMutation();

  const [word, setWord] = useState<Partial<ImagierWord>>({ is_active: false });
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const categories = categoryList.map((categoryEntry) => categoryEntry.category).sort();

  useEffect(() => {
    if (!isNew && allWords) {
      const found = allWords.find((wordEntry) => wordEntry.id === id);
      if (found) {
        setWord(found);
        if (found.image_filename) {
          setImagePreview(`/media/imagier/${found.category}/${encodeURIComponent(found.image_filename)}`);
        }
      }
    }
  }, [allWords, id, isNew]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.fr || !word.en || !word.category) return;
    setIsSaving(true);
    try {
      let saved: ImagierWord;
      if (isNew) {
        saved = await createWord({
          fr: word.fr,
          en: word.en,
          category: word.category,
          subcategory: word.subcategory,
          is_active: word.is_active,
        }).unwrap();
      } else {
        saved = await updateWord({ id: id!, ...word }).unwrap();
      }
      if (pendingFile) await uploadImage({ wordId: saved.id, file: pendingFile }).unwrap();
      navigate('/admin/imagier');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="ImagierWordForm">
      <h2 className="ImagierWordForm__title">
        {isNew ? 'Nouveau mot' : `Éditer : ${word.fr}`}
      </h2>

      <form onSubmit={handleSubmit} className="AdminCard ImagierWordForm__card">
        <div className="ImagierWordForm__row">
          <div className="ImagierWordForm__field">
            <label className="ImagierWordForm__label">Français *</label>
            <input
              value={word.fr ?? ''}
              onChange={(e) => setWord((previousWord) => ({ ...previousWord, fr: e.target.value }))}
              required
              className="ImagierWordForm__input"
            />
          </div>
          <div className="ImagierWordForm__field">
            <label className="ImagierWordForm__label">Anglais *</label>
            <input
              value={word.en ?? ''}
              onChange={(e) => setWord((previousWord) => ({ ...previousWord, en: e.target.value }))}
              required
              className="ImagierWordForm__input"
            />
          </div>
        </div>

        <div className="ImagierWordForm__row">
          <div className="ImagierWordForm__field">
            <label className="ImagierWordForm__label">Catégorie *</label>
            <input
              list="categories-list"
              value={word.category ?? ''}
              onChange={(e) => setWord((previousWord) => ({ ...previousWord, category: e.target.value }))}
              required
              className="ImagierWordForm__input"
            />
            <datalist id="categories-list">
              {categories.map((category) => <option key={category} value={category} />)}
            </datalist>
          </div>
          <div className="ImagierWordForm__field">
            <label className="ImagierWordForm__label">Sous-catégorie</label>
            <input
              value={word.subcategory ?? ''}
              onChange={(e) => setWord((previousWord) => ({ ...previousWord, subcategory: e.target.value }))}
              className="ImagierWordForm__input"
            />
          </div>
        </div>

        <div className="ImagierWordForm__field">
          <label className="ImagierWordForm__label">Image</label>
          <div className="ImagierWordForm__imageRow">
            <div className="ImagierWordForm__imagePreview">
              {imagePreview
                ? <img src={imagePreview} alt="preview" />
                : <span>🖼</span>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
            >
              Choisir un fichier
            </Button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        </div>

        <label className="ImagierWordForm__checkRow">
          <input
            type="checkbox"
            checked={word.is_active ?? false}
            onChange={(e) => setWord((previousWord) => ({ ...previousWord, is_active: e.target.checked }))}
          />
          <span>Activer (visible dans le jeu)</span>
        </label>

        <div className="ImagierWordForm__actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/admin/imagier')}
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
