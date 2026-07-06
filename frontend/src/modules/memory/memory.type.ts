export type MemoryMode = 'image' | 'image_word_fr' | 'image_word_en';

export interface MemoryPair {
  id: string;
  image_url: string | null;
  word_fr: string;
  word_en: string;
}

export interface MemorySessionResponse {
  session_id: string;
  pairs: MemoryPair[];
  mode: MemoryMode;
}

export interface MemoryCard {
  cardId: string;   // pairId + '-a' | '-b'
  pairId: string;
  type: 'image' | 'word';
  content: string;  // URL d'image ou texte du mot
}