export interface FlashcardSet {
  slug: string;
  name: string;
  announcedCount: number;
  url: string;
}

export interface Theme {
  slug: string;
  name: string;
  announcedCount: number;
  sets: FlashcardSet[];
}

export interface ScrapedCard {
  imgid: string;
  en: string;
  imageUrl: string;
  thumbUrl: string | null;
  isTitleCard: boolean;
}

/** Une carte après dédup : le mot, sa traduction, et toutes ses appartenances thème/set. */
export interface Flashcard {
  imgid: string;
  en: string;
  fr: string;
  frSource: 'dictionary' | 'translation' | 'missing';
  memberships: { theme: string; themeName: string; set: string; setName: string }[];
  imageUrl: string;
  imageFile: string | null;
}
