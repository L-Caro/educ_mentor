import {
  PALIERS_ROMAINS,
  choixRomains,
  enRomain,
  estUnPalierRomain,
  lireRomain,
  romainsAProposer,
  romainsFaux,
  romainsJustes,
} from './numeration.romains';

describe('chiffres romains', () => {
  it.each([
    [1, 'I'],
    [4, 'IV'],
    [9, 'IX'],
    [14, 'XIV'],
    [39, 'XXXIX'],
    [40, 'XL'],
    [49, 'XLIX'],
    [90, 'XC'],
    [99, 'XCIX'],
    [400, 'CD'],
    [900, 'CM'],
    [1994, 'MCMXCIV'],
    [3999, 'MMMCMXCIX'],
  ])('ecrit %i en %s', (valeur, attendu) => {
    expect(enRomain(valeur)).toBe(attendu);
  });

  it('refuse ce qui n’a pas d’ecriture romaine', () => {
    expect(() => enRomain(0)).toThrow(RangeError);
    expect(() => enRomain(4000)).toThrow(RangeError);
    expect(() => enRomain(2.5)).toThrow(RangeError);
  });

  it('relit dans les deux sens tous les nombres de 1 a 3999', () => {
    for (let valeur = 1; valeur <= 3999; valeur++) {
      expect(lireRomain(enRomain(valeur))).toBe(valeur);
    }
  });

  it('accepte IIII, XXXX et CCCC comme des ecritures justes', () => {
    expect(lireRomain('IIII')).toBe(4);
    expect(lireRomain('XIIII')).toBe(14);
    expect(lireRomain('XXXX')).toBe(40);
    expect(lireRomain('CCCC')).toBe(400);
    expect(lireRomain('xiiii')).toBe(14);
  });

  it.each(['IC', 'VX', 'IL', 'IIIII', 'VV', 'XM', 'IIV', 'VIIII', '', 'ABC'])(
    'refuse %p',
    (texte) => {
      expect(lireRomain(texte)).toBeNull();
    },
  );

  it('donne les deux ecritures du quatre, la moderne en premier', () => {
    expect(romainsJustes(4)).toEqual(['IV', 'IIII']);
    expect(romainsJustes(9)).toEqual(['IX']);
    expect(romainsJustes(14)).toEqual(['XIV', 'XIIII']);
    expect(romainsJustes(44)).toEqual(
      expect.arrayContaining(['XLIV', 'XLIIII', 'XXXXIV', 'XXXXIIII']),
    );
  });

  it('ne compte comme justes que des ecritures qui se lisent comme le nombre', () => {
    for (let valeur = 1; valeur <= 3999; valeur += 7) {
      for (const texte of romainsJustes(valeur)) {
        expect(lireRomain(texte)).toBe(valeur);
      }
    }
  });

  describe.each(PALIERS_ROMAINS)('palier %i', (palier) => {
    const signesDuPalier = {
      39: /^[IVX]+$/,
      100: /^[IVXLC]+$/,
      1000: /^[IVXLCDM]+$/,
    }[palier];

    it('ne fabrique que des pieges qui ne valent PAS le nombre', () => {
      for (let valeur = 1; valeur <= palier; valeur++) {
        const fausses = romainsFaux(valeur, palier);
        expect(fausses.length).toBeGreaterThanOrEqual(3);
        for (const texte of fausses) {
          expect(lireRomain(texte)).not.toBe(valeur);
        }
      }
    });

    it('ne sort jamais un signe que le palier n’a pas encore enseigne', () => {
      for (let valeur = 1; valeur <= palier; valeur++) {
        for (const texte of romainsFaux(valeur, palier)) {
          expect(texte).toMatch(signesDuPalier);
        }
      }
    });

    it('ne fait jamais passer une ecriture juste ou additive pour une faute', () => {
      for (let valeur = 1; valeur <= palier; valeur++) {
        const fausses = romainsFaux(valeur, palier);
        for (const juste of romainsJustes(valeur)) {
          expect(fausses).not.toContain(juste);
        }
      }
      expect(romainsFaux(9, palier)).not.toContain('VIIII');
    });
  });

  it('propose le piege classique de l’ordre des signes', () => {
    expect(romainsFaux(4, 39)).toContain('VI');
    expect(romainsFaux(4, 39)).not.toContain('IIII');
    expect(romainsFaux(9, 39)).toContain('XI');
  });

  it('propose des ecritures melangees, sans doublon, avec le bon drapeau', () => {
    for (let essai = 0; essai < 200; essai++) {
      const palier = PALIERS_ROMAINS[essai % PALIERS_ROMAINS.length];
      const valeur = 1 + Math.floor(Math.random() * palier);
      const proposees = romainsAProposer(valeur, palier);
      expect(proposees.some((romain) => romain.juste)).toBe(true);
      expect(
        proposees.filter((romain) => !romain.juste).length,
      ).toBeGreaterThanOrEqual(3);
      expect(new Set(proposees.map(({ texte }) => texte)).size).toBe(
        proposees.length,
      );
      for (const { texte, juste } of proposees) {
        expect(lireRomain(texte) === valeur).toBe(juste);
      }
    }
  });

  it('garde IIII parmi les justes quand on demande le quatre', () => {
    const proposees = romainsAProposer(4, 39);
    expect(proposees.find(({ texte }) => texte === 'IIII')?.juste).toBe(true);
    expect(proposees.find(({ texte }) => texte === 'IV')?.juste).toBe(true);
  });

  it('ne donne qu’UNE bonne reponse a un QCM, y compris pour le quatre', () => {
    for (let essai = 0; essai < 200; essai++) {
      const valeur = 1 + Math.floor(Math.random() * 39);
      const { bonne, choix } = choixRomains(valeur, 39);
      expect(choix).toHaveLength(4);
      expect(new Set(choix).size).toBe(4);
      expect(choix).toContain(bonne);
      expect(choix.filter((texte) => lireRomain(texte) === valeur)).toEqual([
        bonne,
      ]);
    }
  });

  it('reconnait un palier valide', () => {
    expect(estUnPalierRomain(39)).toBe(true);
    expect(estUnPalierRomain(1000)).toBe(true);
    expect(estUnPalierRomain(50)).toBe(false);
    expect(estUnPalierRomain('39')).toBe(false);
  });
});
