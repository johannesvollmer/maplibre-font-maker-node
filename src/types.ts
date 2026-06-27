export interface FontInput {
  name: string;
  bytes: Uint8Array;
  settings?: FontVariationSettings;
}

export interface GlyphRange {
  start: number;
  end: number;
}

export interface GeneratedGlyphPbfFile {
  filename: string;
  bytes: Uint8Array;
}

export interface GenerateGlyphPbfFilesOptions {
  fontstack: string;
  fonts: FontInput[];
  ranges: GlyphRange[];
}

export type FontVariationSettings = Record<string, number>;
