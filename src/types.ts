export interface FontInput {
  name: string;
  bytes: Uint8Array;
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
