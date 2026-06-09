import type { ReactNode } from 'react';

interface GamePromptProps {
  imageUrl?: string | null;   // undefined = pas d'image ; null = ❓ ; url = image affichée
  imageHidden?: boolean;      // 🙈 « devine sans voir l'image »
  imageAlt?: string;
  children?: ReactNode;       // contenu de l'énoncé (texte ou visuel propre au module)
}

/**
 * Énoncé partagé : gère l'image (carte, état masqué, placeholders) de façon uniforme.
 * Le contenu textuel/visuel reste fourni par le module via children.
 */
export default function GamePrompt({ imageUrl, imageHidden = false, imageAlt = '', children }: GamePromptProps) {
  const showImage = imageHidden || imageUrl !== undefined;

  return (
    <div className="GamePrompt">
      {showImage && (
        <div className={`GamePrompt__image${imageHidden ? ' GamePrompt__image--hidden' : ''}`}>
          {imageHidden
            ? <span className="GamePrompt__placeholder">🙈</span>
            : imageUrl
              ? <img src={imageUrl} alt={imageAlt} className="GamePrompt__img" />
              : <span className="GamePrompt__placeholder">❓</span>}
        </div>
      )}
      {children}
    </div>
  );
}
