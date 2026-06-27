import { range256 } from './ranges.js';
import type {
  FontInput,
  GeneratedGlyphPbfFile,
  GenerateGlyphPbfFilesOptions,
  GlyphRange,
} from './types.js';
import { loadFontMaker } from './wasm/load-font-maker.js';
import { allocateBytes, copyBytes, freePointer } from './wasm/memory.js';
import { ccallNumber, ccallVoid, type FontMakerModule, type Pointer } from './wasm/sdfglyph-module.js';

export async function generateGlyphPbfFiles(
  options: GenerateGlyphPbfFilesOptions,
): Promise<GeneratedGlyphPbfFile[]> {
  const fontstack = validateFontstack(options?.fontstack);
  const fonts = validateFonts(options?.fonts);
  const ranges = validateRanges(options?.ranges);
  const module = await initializeWasm();

  let fontstackPtr: Pointer | undefined;
  const fontDataPtrs: Pointer[] = [];

  try {
    fontstackPtr = ccallNumber(module, 'create_fontstack', ['string'], [fontstack]);

    if (!fontstackPtr) {
      throw new Error('font-maker WASM returned a null fontstack pointer.');
    }

    for (const font of fonts) {
      const dataPtr = allocateBytes(module, font.bytes);
      fontDataPtrs.push(dataPtr);
      addFace(module, fontstackPtr, font, dataPtr);
    }

    return ranges.map((range) => generateRange(module, fontstackPtr!, fontstack, range));
  } finally {
    if (fontstackPtr) {
      ccallVoid(module, 'free_fontstack', ['number'], [fontstackPtr]);
    }

    for (const ptr of fontDataPtrs) {
      freePointer(module, ptr);
    }
  }
}

async function initializeWasm(): Promise<FontMakerModule> {
  try {
    return await loadFontMaker();
  } catch (error) {
    throw new Error(`Failed to initialize font-maker WASM: ${formatError(error)}`);
  }
}

function addFace(module: FontMakerModule, fontstackPtr: Pointer, font: FontInput, dataPtr: Pointer): void {
  try {
    ccallVoid(module, 'fontstack_add_face', ['number', 'number', 'number'], [
      fontstackPtr,
      dataPtr,
      font.bytes.byteLength,
    ]);
  } catch (error) {
    throw new Error(`Failed to add font "${font.name}": ${formatError(error)}`);
  }
}

function generateRange(
  module: FontMakerModule,
  fontstackPtr: Pointer,
  fontstack: string,
  range: GlyphRange,
): GeneratedGlyphPbfFile {
  let glyphBufferPtr: Pointer | undefined;

  try {
    glyphBufferPtr = ccallNumber(module, 'generate_glyph_buffer', ['number', 'number'], [
      fontstackPtr,
      range.start,
    ]);

    if (!glyphBufferPtr) {
      throw new Error(`font-maker WASM returned a null glyph buffer pointer for ${formatRange(range)}.`);
    }

    const dataPtr = ccallNumber(module, 'glyph_buffer_data', ['number'], [glyphBufferPtr]);
    const byteLength = ccallNumber(module, 'glyph_buffer_size', ['number'], [glyphBufferPtr]);

    if (byteLength <= 0) {
      throw new Error(`font-maker WASM returned an empty glyph buffer for ${formatRange(range)}.`);
    }

    return {
      filename: `${fontstack}/${formatRange(range)}.pbf`,
      bytes: copyBytes(module, dataPtr, byteLength),
    };
  } catch (error) {
    throw new Error(`Failed to generate glyph range ${formatRange(range)}: ${formatError(error)}`);
  } finally {
    if (glyphBufferPtr) {
      ccallVoid(module, 'free_glyph_buffer', ['number'], [glyphBufferPtr]);
    }
  }
}

function validateFontstack(fontstack: unknown): string {
  if (typeof fontstack !== 'string' || fontstack.trim().length === 0) {
    throw new TypeError('fontstack must be a non-empty string.');
  }

  if (fontstack.includes('\0')) {
    throw new TypeError('fontstack must not contain null bytes.');
  }

  return fontstack;
}

function validateFonts(fonts: unknown): FontInput[] {
  if (!Array.isArray(fonts) || fonts.length === 0) {
    throw new TypeError('fonts must contain at least one font.');
  }

  return fonts.map((font, index) => validateFont(font, index));
}

function validateFont(font: unknown, index: number): FontInput {
  if (!font || typeof font !== 'object') {
    throw new TypeError(`fonts[${index}] must be an object.`);
  }

  const candidate = font as Partial<FontInput>;

  if (typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    throw new TypeError(`fonts[${index}].name must be a non-empty string.`);
  }

  if (!(candidate.bytes instanceof Uint8Array)) {
    throw new TypeError(`fonts[${index}].bytes must be a Uint8Array.`);
  }

  if (!hasSupportedSfntSignature(candidate.bytes)) {
    throw new TypeError(`fonts[${index}].bytes is not a supported TTF or OTF font.`);
  }

  return {
    name: candidate.name,
    bytes: candidate.bytes,
  };
}

function validateRanges(ranges: unknown): GlyphRange[] {
  if (!Array.isArray(ranges) || ranges.length === 0) {
    throw new TypeError('ranges must contain at least one glyph range.');
  }

  const seen = new Set<string>();

  return ranges.map((range, index) => {
    const normalized = validateRange(range, index);
    const key = formatRange(normalized);

    if (seen.has(key)) {
      throw new TypeError(`Duplicate glyph range: ${key}.`);
    }

    seen.add(key);
    return normalized;
  });
}

function validateRange(range: unknown, index: number): GlyphRange {
  if (!range || typeof range !== 'object') {
    throw new TypeError(`ranges[${index}] must be an object.`);
  }

  const candidate = range as Partial<GlyphRange>;
  const expected = range256(Number(candidate.start));

  if (candidate.end !== expected.end) {
    throw new RangeError(
      `ranges[${index}] must be a 256-codepoint range. Expected ${formatRange(expected)}.`,
    );
  }

  return expected;
}

function hasSupportedSfntSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 4) {
    return false;
  }

  if (bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) {
    return true;
  }

  const signature = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  return signature === 'OTTO' || signature === 'true' || signature === 'typ1' || signature === 'ttcf';
}

function formatRange(range: GlyphRange): string {
  return `${range.start}-${range.end}`;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
