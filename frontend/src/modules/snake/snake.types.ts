export type Direction = 'north' | 'south' | 'east' | 'west';
export type Position = [number, number];
export type FruitKey = 'apple' | 'abricot' | 'fraise' | 'poire';
export type ThemeKey = 'bg1' | 'bg2' | 'bg3' | 'bg4' | 'bg5' | 'bg6' | 'bg7' | 'bg8' | 'bg9' | 'bg10';

export interface ThemeConfig {
  mapColor: string;
  borderColor: string;
  scoreColor: string;
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  bg1: { mapColor: '#D96026', borderColor: '#76452D', scoreColor: '#FFFFFF' },
  bg2: { mapColor: '#FF9D26', borderColor: '#9A6321', scoreColor: '#FFFFFF' },
  bg3: { mapColor: '#EB3544', borderColor: '#8D2C34', scoreColor: '#FFFFFF' },
  bg4: { mapColor: '#FF5D94', borderColor: '#B72858', scoreColor: '#FFFFFF' },
  bg5: { mapColor: '#9A3AA7', borderColor: '#59325E', scoreColor: '#FFFFFF' },
  bg6: { mapColor: '#8968B6', borderColor: '#584770', scoreColor: '#FFFFFF' },
  bg7: { mapColor: '#29B6F6', borderColor: '#267092', scoreColor: '#FFFFFF' },
  bg8: { mapColor: '#918877', borderColor: '#5B564F', scoreColor: '#FFFFFF' },
  bg9: { mapColor: '#ADADAD', borderColor: '#6E6E6E', scoreColor: '#FFFFFF' },
  bg10: { mapColor: '#6B7481', borderColor: '#474b50', scoreColor: '#FFFFFF' },
};

export const DEFAULT_THEME: ThemeKey = 'bg10';
export const DEFAULT_FRUIT: FruitKey = 'apple';
export const DEFAULT_DIFFICULTY = 'medium';
